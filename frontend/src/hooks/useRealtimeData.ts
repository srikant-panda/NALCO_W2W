import { useCallback, useEffect, useRef, useState } from "react";
import {
  authTokenFromStorage,
  calculateLogistics,
  createOrder,
  fetchBuyers,
  fetchCarbon,
  fetchInventory,
  fetchOrders,
  fetchWasteStreams,
  formatIotReading,
  normalizeBatch,
  normalizeBuyer,
  normalizeOrder,
  normalizeWasteStream,
  type BackendBatch,
  type BackendBuyer,
  type BackendCarbonCredit,
  type BackendOrder,
  type BackendWasteStream,
  type CarbonResponse,
  type InventoryResponse,
  type OrdersResponse,
  type WasteStream,
  WS_BASE,
} from "../lib/api";
import type { Batch, Buyer, Order } from "../data/wasteStreams";

export interface RealtimeMetrics {
  totalStockpile: number;
  totalRevenue: number;
  totalCarbonSaved: number;
  totalOrders: number;
  activeBuyers: number;
  trucksInTransit: number;
  stockByStream: Record<string, number>;
  lastUpdate: Date;
}

export interface RevenuePoint {
  month: string;
  actual: number | null;
  projected: number | null;
}

export interface CarbonPoint {
  month: string;
  redMud: number;
  flyAsh: number;
  spl: number;
  dross: number;
  caustic: number;
  limeGrit: number;
  total: number;
}

const MONTH_WINDOW = 6;
const FUTURE_MONTHS = 2;

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function lastMonths(count: number, includeFuture = 0): Date[] {
  const start = addMonths(monthStart(new Date()), -(count - 1));
  return Array.from({ length: count + includeFuture }, (_, index) => addMonths(start, index));
}

function streamSeriesKey(type?: string): keyof CarbonPoint {
  switch (type) {
    case "RED_MUD":
      return "redMud";
    case "FLY_ASH":
      return "flyAsh";
    case "SPENT_POT_LINING":
      return "spl";
    case "ALUMINIUM_DROSS":
      return "dross";
    case "CAUSTIC_LIQUOR":
      return "caustic";
    case "LIME_GRIT":
      return "limeGrit";
    default:
      return "redMud";
  }
}

function buildMetrics(batches: Batch[], orders: Order[], buyers: Buyer[], streams: WasteStream[]): RealtimeMetrics {
  const stockByStream: Record<string, number> = Object.fromEntries(streams.map((stream) => [stream.id, 0]));
  batches.forEach((batch) => {
    if (batch.status !== "Available") return;
    stockByStream[batch.wasteStreamId] = (stockByStream[batch.wasteStreamId] || 0) + batch.tonnes;
  });

  const totalStockpile = Object.values(stockByStream).reduce((sum, value) => sum + value, 0);
  const totalRevenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.totalValue, 0);
  const totalCarbonSaved = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.carbonCredits, 0);
  const trucksInTransit = orders
    .filter((order) => order.status === "Dispatched")
    .reduce((sum, order) => sum + order.truckCount, 0);

  return {
    totalStockpile,
    totalRevenue,
    totalCarbonSaved,
    totalOrders: orders.length,
    activeBuyers: buyers.filter((buyer) => buyer.verified).length,
    trucksInTransit,
    stockByStream,
    lastUpdate: new Date(),
  };
}

function buildRevenueHistory(orders: Order[]): RevenuePoint[] {
  const months = lastMonths(MONTH_WINDOW, FUTURE_MONTHS);
  const actualByMonth = new Map<string, number>();

  orders
    .filter((order) => order.status !== "Cancelled")
    .forEach((order) => {
      const key = monthKey(new Date(order.orderDate));
      actualByMonth.set(key, (actualByMonth.get(key) || 0) + order.totalValue / 100000);
    });

  const pastWindow = months.slice(0, MONTH_WINDOW);
  const history: RevenuePoint[] = pastWindow.map((date) => {
    const actual = Number((actualByMonth.get(monthKey(date)) || 0).toFixed(1));
    return {
      month: monthLabel(date),
      actual,
      projected: actual > 0 ? Number((actual * 1.08).toFixed(1)) : null,
    };
  });

  const trailingActuals = history.map((point) => point.actual || 0).filter((value) => value > 0);
  const baseline = trailingActuals.length
    ? trailingActuals.slice(-3).reduce((sum, value) => sum + value, 0) / Math.min(3, trailingActuals.length)
    : 0;

  months.slice(MONTH_WINDOW).forEach((date, index) => {
    const growth = 1 + (index + 1) * 0.04;
    history.push({
      month: monthLabel(date),
      actual: null,
      projected: Number((baseline * growth || 0).toFixed(1)) || null,
    });
  });

  return history;
}

function buildCarbonHistory(credits: BackendCarbonCredit[]): CarbonPoint[] {
  const months = lastMonths(MONTH_WINDOW);
  const rows = new Map<string, CarbonPoint>();

  months.forEach((date) => {
    rows.set(monthKey(date), {
      month: monthLabel(date),
      redMud: 0,
      flyAsh: 0,
      spl: 0,
      dross: 0,
      caustic: 0,
      limeGrit: 0,
      total: 0,
    });
  });

  credits.forEach((credit) => {
    const createdAt = credit.createdAt ? new Date(credit.createdAt) : null;
    if (!createdAt) return;
    const row = rows.get(monthKey(monthStart(createdAt)));
    if (!row) return;
    const key = streamSeriesKey(credit.order?.batch?.wasteStream?.type);
    const value = Number(credit.tCO2e) || 0;
    row[key] += value;
    row.total += value;
  });

  return months.map((date) => rows.get(monthKey(date)) || {
    month: monthLabel(date),
    redMud: 0,
    flyAsh: 0,
    spl: 0,
    dross: 0,
    caustic: 0,
    limeGrit: 0,
    total: 0,
  });
}

function coerceBackendBatchList(payload: InventoryResponse | null): BackendBatch[] {
  return payload?.batches || [];
}

function coerceBackendOrderList(payload: OrdersResponse | null): BackendOrder[] {
  return payload?.orders || [];
}

function coerceBackendBuyers(payload: BackendBuyer[] | null): Buyer[] {
  return payload?.length ? payload.map(normalizeBuyer) : [];
}

function coerceCarbonResponse(payload: CarbonResponse | null): BackendCarbonCredit[] {
  return payload?.credits || [];
}

function coerceWasteStreams(payload: BackendWasteStream[] | null): BackendWasteStream[] {
  return payload || [];
}

function openRoomSocket(room: string, onMessage: (payload: any) => void) {
  const socket = new WebSocket(`${WS_BASE.replace(/\/$/, "")}/ws/${room}`);
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // Ignore malformed messages and keep the connection alive.
    }
  };
  socket.onerror = () => {
    socket.close();
  };
  return socket;
}

export function useRealtimeData() {
  const [wasteStreams, setWasteStreams] = useState<WasteStream[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [carbonCredits, setCarbonCredits] = useState<BackendCarbonCredit[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>(() => buildMetrics([], [], [], []));
  const [revenueHistory, setRevenueHistory] = useState<RevenuePoint[]>([]);
  const [carbonHistory, setCarbonHistory] = useState<CarbonPoint[]>([]);
  const [iotFeed, setIotFeed] = useState<{ time: string; event: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const socketsRef = useRef<WebSocket[]>([]);
  const pollRef = useRef<number | null>(null);

  const refreshMetrics = useCallback(
    (nextBatches: Batch[], nextOrders: Order[], nextBuyers: Buyer[], nextStreams: WasteStream[], nextCredits: BackendCarbonCredit[]) => {
      setMetrics(buildMetrics(nextBatches, nextOrders, nextBuyers, nextStreams));
      setRevenueHistory(buildRevenueHistory(nextOrders));
      setCarbonHistory(buildCarbonHistory(nextCredits));
    },
    [],
  );

  const refreshSnapshot = useCallback(async () => {
    const token = authTokenFromStorage();
    try {
      const [inventory, ordersResponse, buyersResponse, carbonResponse, streamsResponse] = await Promise.all([
        fetchInventory(token),
        fetchOrders(token),
        fetchBuyers(token),
        fetchCarbon(token),
        fetchWasteStreams(token),
      ]);

      const normalizedBatches = coerceBackendBatchList(inventory).map(normalizeBatch);
      const normalizedOrders = coerceBackendOrderList(ordersResponse).map(normalizeOrder);
      const normalizedBuyers = coerceBackendBuyers(buyersResponse);
      const normalizedCarbon = coerceCarbonResponse(carbonResponse);
      const normalizedStreams = coerceWasteStreams(streamsResponse).map(normalizeWasteStream);

      setWasteStreams(normalizedStreams);
      setBatches(normalizedBatches);
      setOrders(normalizedOrders);
      setBuyers(normalizedBuyers);
      setCarbonCredits(normalizedCarbon);
      refreshMetrics(normalizedBatches, normalizedOrders, normalizedBuyers, normalizedStreams, normalizedCarbon);
      setError("");
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load backend data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [refreshMetrics]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) return;
      await refreshSnapshot();
    };

    void run();

    const dashboardSocket = openRoomSocket("dashboard", (message) => {
      if (message?.event === "metrics:update") {
        const data = message.data as Record<string, unknown> | undefined;
        if (data?.lastUpdate) {
          setMetrics((prev) => ({
            ...prev,
            lastUpdate: new Date(String(data.lastUpdate)),
          }));
        } else {
          setMetrics((prev) => ({ ...prev, lastUpdate: new Date() }));
        }
      }
      if (message?.event === "inventory:new" || message?.event === "orders:update") {
        void refreshSnapshot();
      }
    });

    const ordersSocket = openRoomSocket("orders", (message) => {
      if (message?.event === "orders:update") {
        void refreshSnapshot();
      }
    });

    const iotSocket = openRoomSocket("iot-feed", (message) => {
      if (message?.event !== "iot:reading") return;
      const reading = message.data as Record<string, unknown> | undefined;
      if (!reading) return;
      setIotFeed((prev) => [formatIotReading(reading), ...prev.slice(0, 19)]);
    });

    socketsRef.current = [dashboardSocket, ordersSocket, iotSocket];
    pollRef.current = window.setInterval(() => {
      void refreshSnapshot();
    }, 30000);

    return () => {
      active = false;
      socketsRef.current.forEach((socket) => socket.close());
      socketsRef.current = [];
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [refreshSnapshot]);

  const addOrder = useCallback(
    async (order: Order) => {
      const token = authTokenFromStorage();
      await createOrder(
        {
          buyerId: order.buyerId,
          batchId: order.batchId,
          tonnes: order.tonnes,
        },
        token,
      );
      await refreshSnapshot();
    },
    [refreshSnapshot],
  );

  const calculateRoute = useCallback(async (tonnes: number, distanceKM: number, wasteType: string) => {
    const token = authTokenFromStorage();
    return calculateLogistics({ tonnes, distanceKM, wasteType }, token);
  }, []);

  return {
    batches,
    orders,
    buyers,
    wasteStreams,
    carbonCredits,
    revenueHistory,
    carbonHistory,
    metrics,
    iotFeed,
    loading,
    error,
    addOrder,
    refreshSnapshot,
    calculateRoute,
  };
}
