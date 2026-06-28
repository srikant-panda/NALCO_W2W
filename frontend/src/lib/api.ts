import type { Batch, Buyer, Order, WasteStream } from "../data/wasteStreams";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const WS_BASE = resolveWebSocketBase(import.meta.env.VITE_WS_URL || API_BASE);

type BackendWasteType =
  | "RED_MUD"
  | "FLY_ASH"
  | "SPENT_POT_LINING"
  | "ALUMINIUM_DROSS"
  | "CAUSTIC_LIQUOR"
  | "LIME_GRIT";

type BackendBatchStatus = "AVAILABLE" | "RESERVED" | "IN_TRANSIT" | "DELIVERED" | "REJECTED";
type BackendOrderStatus = "PENDING" | "CONFIRMED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

export interface BackendWasteStream {
  id: string;
  type: BackendWasteType;
  name: string;
  chemicalFormula?: string;
  source?: string;
  avgPricePerMT?: number;
  carbonFactor?: number;
  monthlyProd?: number;
  applications?: string[];
  currentStock?: number;
  createdAt?: string;
}

export interface BackendBatch {
  id: string;
  batchCode: string;
  wasteStreamId: string;
  tonnes: number;
  moisture: number;
  ph: number;
  grade: "A" | "B" | "C";
  status: BackendBatchStatus;
  location: string;
  treatmentMethod: string;
  certifications: string[];
  createdAt?: string;
  updatedAt?: string;
  wasteStream?: BackendWasteStream;
}

export interface BackendBuyer {
  id: string;
  company: string;
  industry: string;
  location: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  distance: number;
  verified: boolean;
  gstNumber?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  rating: number;
  totalOrdered: number;
  totalCarbon: number;
  wasteInterests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendCarbonCredit {
  id: string;
  orderId: string;
  buyerId: string;
  tCO2e: number;
  methodology: string;
  registry: string;
  valueINR: number;
  verified: boolean;
  certificateUrl?: string | null;
  createdAt?: string;
  buyer?: BackendBuyer;
  order?: BackendOrder;
}

export interface BackendOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  batchId: string;
  tonnes: number;
  pricePerMT: number;
  totalValue: number;
  freightCost: number;
  distance: number;
  highway: string;
  truckCount: number;
  status: BackendOrderStatus;
  estimatedDelivery?: string;
  actualDelivery?: string | null;
  createdAt?: string;
  updatedAt?: string;
  buyer?: BackendBuyer;
  batch?: BackendBatch;
  carbonCredits?: BackendCarbonCredit;
}

export interface InventoryResponse {
  batches: BackendBatch[];
  stats?: {
    totalBatches?: number;
    availableStock?: number;
    gradeA?: number;
    inTransit?: number;
  };
}

export interface OrdersResponse {
  orders: BackendOrder[];
  stats?: Record<string, number>;
}

export interface CarbonResponse {
  credits: BackendCarbonCredit[];
  totalCO2e: number;
  totalValueINR: number;
  count: number;
}

export interface WasteStreamsResponse {
  streams: BackendWasteStream[];
}

export interface RealtimeFeedMessage {
  event?: string;
  data?: Record<string, unknown>;
}

export function resolveWebSocketBase(raw: string): string {
  if (raw.startsWith("ws://") || raw.startsWith("wss://")) {
    return raw.replace(/\/$/, "");
  }
  if (raw.startsWith("https://")) {
    return `wss://${raw.slice("https://".length).replace(/\/api\/?$/, "").replace(/\/$/, "")}`;
  }
  if (raw.startsWith("http://")) {
    return `ws://${raw.slice("http://".length).replace(/\/api\/?$/, "").replace(/\/$/, "")}`;
  }
  return raw.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE.replace(/\/$/, "")}${normalizedPath}`;
}

export async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await requestOnce(path, init, token);
  if (!response.ok && response.status === 401 && token && !path.startsWith("/auth/")) {
    const refreshedToken = await refreshAuthSession();
    if (refreshedToken) {
      const retry = await requestOnce(path, init, refreshedToken);
      if (retry.ok) {
        return retry.json() as Promise<T>;
      }
      throw await readRequestError(retry);
    }
  }

  if (!response.ok) {
    throw await readRequestError(response);
  }

  return response.json() as Promise<T>;
}

async function requestOnce(path: string, init: RequestInit, token?: string): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(apiUrl(path), { ...init, headers, credentials: init.credentials ?? "include" });
}

async function readRequestError(response: Response): Promise<Error> {
  let message = `Request failed with status ${response.status}`;
  try {
    const body = await response.json();
    message = typeof body?.error === "string" ? body.error : body?.detail?.error || message;
  } catch {
    // Keep the generic message if the backend does not return JSON.
  }
  return new Error(message);
}

const WASTE_STREAM_THEMES: Record<
  BackendWasteType,
  { icon: string; color: string; bgColor: string; borderColor: string }
> = {
  RED_MUD: { icon: "🔴", color: "#DC2626", bgColor: "#FEF2F2", borderColor: "#FECACA" },
  FLY_ASH: { icon: "⚫", color: "#6B7280", bgColor: "#F9FAFB", borderColor: "#E5E7EB" },
  SPENT_POT_LINING: { icon: "⬛", color: "#1F2937", bgColor: "#F3F4F6", borderColor: "#D1D5DB" },
  ALUMINIUM_DROSS: { icon: "🔘", color: "#9CA3AF", bgColor: "#F9FAFB", borderColor: "#E5E7EB" },
  CAUSTIC_LIQUOR: { icon: "🟡", color: "#F59E0B", bgColor: "#FFFBEB", borderColor: "#FDE68A" },
  LIME_GRIT: { icon: "⚪", color: "#A8A29E", bgColor: "#FAFAF9", borderColor: "#E7E5E4" },
};

function themeForWasteStream(type?: string) {
  if (
    type === "RED_MUD" ||
    type === "FLY_ASH" ||
    type === "SPENT_POT_LINING" ||
    type === "ALUMINIUM_DROSS" ||
    type === "CAUSTIC_LIQUOR" ||
    type === "LIME_GRIT"
  ) {
    return WASTE_STREAM_THEMES[type];
  }

  return WASTE_STREAM_THEMES.RED_MUD;
}

export function normalizeWasteStreamId(type?: string, fallbackId?: string): string {
  switch (type) {
    case "RED_MUD":
      return "red-mud";
    case "FLY_ASH":
      return "fly-ash";
    case "SPENT_POT_LINING":
      return "spent-pot-lining";
    case "ALUMINIUM_DROSS":
      return "dross";
    case "CAUSTIC_LIQUOR":
      return "caustic-soda-liquor";
    case "LIME_GRIT":
      return "lime-grit";
    default:
      return fallbackId || "red-mud";
  }
}

export function wasteTypeFromStreamId(streamId?: string): BackendWasteType {
  switch (streamId) {
    case "red-mud":
      return "RED_MUD";
    case "fly-ash":
      return "FLY_ASH";
    case "spent-pot-lining":
      return "SPENT_POT_LINING";
    case "dross":
      return "ALUMINIUM_DROSS";
    case "caustic-soda-liquor":
      return "CAUSTIC_LIQUOR";
    case "lime-grit":
      return "LIME_GRIT";
    default:
      return "RED_MUD";
  }
}

export function normalizeWasteStream(stream: BackendWasteStream): WasteStream {
  const theme = themeForWasteStream(stream.type);
  return {
    id: normalizeWasteStreamId(stream.type, stream.id),
    name: stream.name,
    chemicalFormula: stream.chemicalFormula || "",
    source: stream.source || "",
    color: theme.color,
    bgColor: theme.bgColor,
    borderColor: theme.borderColor,
    icon: theme.icon,
    applications: stream.applications || [],
    avgPrice: Number(stream.avgPricePerMT) || 0,
    carbonFactor: Number(stream.carbonFactor) || 0,
    currentStock: Number(stream.currentStock) || 0,
    monthlyProduction: Number(stream.monthlyProd) || 0,
    moistureRange: "",
    phRange: "",
    description: stream.source || stream.name,
  };
}

export function normalizeBatch(batch: BackendBatch): Batch {
  return {
    id: batch.id,
    wasteStreamId: normalizeWasteStreamId(batch.wasteStream?.type, batch.wasteStreamId),
    batchCode: batch.batchCode,
    date: batch.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    tonnes: Number(batch.tonnes) || 0,
    moisture: Number(batch.moisture) || 0,
    ph: Number(batch.ph) || 0,
    grade: batch.grade,
    status: normalizeBatchStatus(batch.status),
    location: batch.location,
    treatmentMethod: batch.treatmentMethod,
    certifications: batch.certifications || [],
  };
}

export function normalizeBatchStatus(status: BackendBatchStatus | string): Batch["status"] {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "RESERVED":
      return "Reserved";
    case "IN_TRANSIT":
      return "In Transit";
    case "DELIVERED":
      return "Delivered";
    case "REJECTED":
      return "Rejected";
    default:
      return "Available";
  }
}

export function normalizeOrder(order: BackendOrder): Order {
  const normalizedWasteStreamId = order.batch
    ? normalizeWasteStreamId(order.batch.wasteStream?.type, order.batch.wasteStreamId)
    : "red-mud";
  const carbonCredits = order.carbonCredits?.tCO2e ?? 0;

  return {
    id: order.orderNumber || order.id,
    buyerId: order.buyerId,
    batchId: order.batchId,
    wasteStreamId: normalizedWasteStreamId,
    tonnes: Number(order.tonnes) || 0,
    pricePerMT: Number(order.pricePerMT) || 0,
    totalValue: Number(order.totalValue) || 0,
    carbonCredits: Number(carbonCredits) || 0,
    status: normalizeOrderStatus(order.status),
    orderDate: order.createdAt?.slice(0, 10) || order.estimatedDelivery?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    estimatedDelivery: order.estimatedDelivery?.slice(0, 10) || order.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    freightCost: Number(order.freightCost) || 0,
    distance: Number(order.distance) || 0,
    truckCount: Number(order.truckCount) || 0,
    highway: order.highway,
  };
}

export function normalizeOrderStatus(status: BackendOrderStatus | string): Order["status"] {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "DISPATCHED":
      return "Dispatched";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function normalizeBuyer(buyer: BackendBuyer): Buyer {
  return {
    id: buyer.id,
    company: buyer.company,
    industry: buyer.industry,
    location: buyer.location,
    state: buyer.state,
    distance: Number(buyer.distance) || 0,
    verified: Boolean(buyer.verified),
    wasteInterests: buyer.wasteInterests || [],
    totalOrdered: Number(buyer.totalOrdered) || 0,
    carbonCredits: Number(buyer.totalCarbon) || 0,
    contactPerson: buyer.contactPerson || "",
    phone: buyer.phone || "",
    gstNumber: buyer.gstNumber || "",
    rating: Number(buyer.rating) || 0,
  };
}

export function formatIotReading(feed: Record<string, unknown>): { time: string; event: string; value: string } {
  const time = typeof feed.timestamp === "string" ? new Date(feed.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
  const event = [feed.type, feed.wasteStream].filter(Boolean).join(" - ") || "IoT reading";
  const valueParts = [feed.value, feed.unit].filter(Boolean).map(String);
  const value = valueParts.join(" ");
  return { time, event, value };
}

export async function fetchInventory(token?: string): Promise<InventoryResponse> {
  return request<InventoryResponse>("/inventory/batches", {}, token);
}

export async function fetchOrders(token?: string): Promise<OrdersResponse> {
  return request<OrdersResponse>("/orders", {}, token);
}

export async function fetchBuyers(token?: string): Promise<BackendBuyer[]> {
  return request<BackendBuyer[]>("/buyers", {}, token);
}

export async function fetchCarbon(token?: string): Promise<CarbonResponse> {
  return request<CarbonResponse>("/carbon", {}, token);
}

export async function fetchWasteStreams(token?: string): Promise<BackendWasteStream[]> {
  const response = await request<WasteStreamsResponse | BackendWasteStream[]>("/inventory/streams", {}, token);
  return Array.isArray(response) ? response : response.streams;
}

export async function calculateLogistics(payload: {
  tonnes: number;
  distanceKM: number;
  wasteType: string;
}, token?: string) {
  return request<{
    freightCost: number;
    truckCount: number;
    transportCO2e: number;
    carbonCredits: { tCO2e: number; valueINR: number; factor: number };
    netCO2e: number;
  }>("/logistics/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function createOrder(payload: { buyerId: string; batchId: string; tonnes: number }, token?: string) {
  return request<{ order: BackendOrder; carbonSummary: Record<string, unknown>; freightSummary: Record<string, unknown>; message: string }>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export interface AuthSession {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string | null;
  token?: string;
  tokenExpiresAt?: string | null;
}

export interface AuthLoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AuthSession;
}

const AUTH_STORAGE_KEY = "nalco:w2w:user";

export function authSessionFromStorage(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function storeAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function authTokenFromStorage(): string | undefined {
  return authSessionFromStorage()?.token || undefined;
}

export function sessionFromLoginResponse(data: AuthLoginResponse): AuthSession {
  return {
    ...data.user,
    token: data.token,
    tokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
  };
}

export async function loginAuthSession(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw await readRequestError(response);
  }

  const data = (await response.json()) as AuthLoginResponse;
  return sessionFromLoginResponse(data);
}

export async function refreshAuthSession(): Promise<string | undefined> {
  const session = authSessionFromStorage();

  try {
    const response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      clearAuthSession();
      return undefined;
    }

    const data = (await response.json()) as AuthLoginResponse;
    const nextSession: AuthSession = {
      ...session,
      ...sessionFromLoginResponse(data),
    };
    storeAuthSession(nextSession);
    return nextSession.token;
  } catch {
    clearAuthSession();
    return undefined;
  }
}

export async function logoutAuthSession(): Promise<void> {
  try {
    await fetch(apiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Clear local session regardless of server cleanup outcome.
  }
  clearAuthSession();
}
