import { useEffect, useState } from "react";
import { ShoppingCart, Plus, X, Leaf, Truck, Calculator, CheckCircle2, Clock, Package, MapPin } from "lucide-react";
import type { Batch, Buyer, Order, WasteStream } from "../data/wasteStreams";
import { wasteTypeFromStreamId } from "../lib/api";

interface Props {
  batches: Batch[];
  orders: Order[];
  buyers: Buyer[];
  wasteStreams: WasteStream[];
  onAddOrder: (order: Order) => Promise<void> | void;
  calculateRoute: (tonnes: number, distanceKM: number, wasteType: string) => Promise<{
    freightCost: number;
    truckCount: number;
    transportCO2e: number;
    carbonCredits: { tCO2e: number; valueINR: number; factor: number };
    netCO2e: number;
  }>;
}

const statusColors: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  Dispatched: "bg-purple-50 text-purple-700 border-purple-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function Marketplace({ batches, orders, buyers, wasteStreams, onAddOrder, calculateRoute }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [orderTonnes, setOrderTonnes] = useState("");
  const [backendCalc, setBackendCalc] = useState<{
    freightCost: number;
    truckCount: number;
    transportCO2e: number;
    carbonCredits: { tCO2e: number; valueINR: number; factor: number };
    netCO2e: number;
  } | null>(null);

  const availableBatches = batches.filter((b) => b.status === "Available");
  const batch = batches.find((b) => b.id === selectedBatch);
  const buyer = buyers.find((b) => b.id === selectedBuyer);
  const ws = batch ? wasteStreams.find((w) => w.id === batch.wasteStreamId) : null;

  const tonnes = Number(orderTonnes) || 0;
  const pricePerMT = ws?.avgPrice || 0;
  const totalValue = tonnes * pricePerMT;
  const carbonCredits = tonnes * (ws?.carbonFactor || 0);
  const distance = buyer?.distance || 0;
  const apiCarbonCredits = backendCalc?.carbonCredits.tCO2e ?? carbonCredits;

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!batch || !buyer || tonnes <= 0 || !ws) {
        setBackendCalc(null);
        return;
      }
      try {
        const result = await calculateRoute(tonnes, distance, wasteTypeFromStreamId(ws.id));
        if (active) {
          setBackendCalc(result);
        }
      } catch {
        if (active) {
          setBackendCalc(null);
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [batch, buyer, calculateRoute, distance, tonnes, ws]);

  const handleSubmit = async () => {
    if (!batch || !buyer || tonnes <= 0) return;
    const order: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      buyerId: buyer.id,
      batchId: batch.id,
      wasteStreamId: batch.wasteStreamId,
      tonnes,
      pricePerMT,
      totalValue,
      carbonCredits: Math.round(carbonCredits),
      status: "Pending",
      orderDate: new Date().toISOString().split("T")[0],
      estimatedDelivery: new Date(Date.now() + distance * 100000).toISOString().split("T")[0],
      freightCost: Math.round(backendCalc?.freightCost ?? 0),
      distance,
      truckCount: backendCalc?.truckCount ?? 0,
      highway: "NH-26",
    };
    await onAddOrder(order);
    setShowModal(false);
    setSelectedBatch("");
    setSelectedBuyer("");
    setOrderTonnes("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mt-1">Manage purchase orders for waste stream materials</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending", value: orders.filter((o) => o.status === "Pending").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Dispatched", value: orders.filter((o) => o.status === "Dispatched").length, icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Delivered", value: orders.filter((o) => o.status === "Delivered").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Revenue", value: `₹${(orders.reduce((s, o) => s + o.totalValue, 0) / 100000).toFixed(1)}L`, icon: Calculator, color: "text-slate-700", bg: "bg-slate-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon size={14} className={stat.color} />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-[11px] text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Order History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Buyer</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Material</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tonnes</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CO₂ Saved</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Trucks</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => {
                const b = buyers.find((x) => x.id === order.buyerId);
                const w = wasteStreams.find((x) => x.id === order.wasteStreamId);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 font-medium">{b?.company || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400">{b?.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span>{w?.icon}</span>
                        <span className="text-slate-600">{w?.name.split("(")[0].trim()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{order.tonnes.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">₹{(order.totalValue / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-blue-600 font-semibold">{order.carbonCredits}</span>
                      <span className="text-[10px] text-slate-400 ml-1">tCO₂e</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} />
                        {order.highway} ({order.distance}km)
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{order.truckCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{order.orderDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Create New Order</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Select Batch */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Select Available Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Choose a batch...</option>
                  {availableBatches.map((b) => {
                    const w = wasteStreams.find((x) => x.id === b.wasteStreamId);
                    return (
                      <option key={b.id} value={b.id}>
                        {w?.icon || "•"} {b.batchCode} — {b.tonnes} MT {w?.name.split("(")[0].trim() || "Waste stream"} (Grade {b.grade})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select Buyer */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Select Buyer</label>
                <select
                  value={selectedBuyer}
                  onChange={(e) => setSelectedBuyer(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Choose a buyer...</option>
                  {buyers.filter((b) => b.verified).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.company} — {b.location} ({b.distance} km)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tonnes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Order Quantity (MT) {batch && <span className="text-slate-400 font-normal">— Max: {batch.tonnes} MT</span>}
                </label>
                <input
                  type="number"
                  value={orderTonnes}
                  onChange={(e) => setOrderTonnes(e.target.value)}
                  max={batch?.tonnes}
                  placeholder="Enter tonnes..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Live Preview */}
              {batch && buyer && tonnes > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl p-5 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Order Preview</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Material Value:</span>
                      <span className="font-bold text-emerald-600">₹{totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Price/MT:</span>
                      <span className="font-semibold">₹{pricePerMT}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Est. Freight:</span>
                      <span className="font-semibold text-orange-600">₹{Math.round(backendCalc?.freightCost ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance:</span>
                      <span className="font-semibold">{distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trucks Required:</span>
                      <span className="font-semibold">{backendCalc?.truckCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CO₂ Credits:</span>
                      <span className="font-bold text-blue-600">{apiCarbonCredits.toFixed(1)} tCO₂e</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <Leaf size={14} className="text-emerald-600" />
                      <span className="text-xs text-emerald-700 font-medium">
                        Carbon Credit Value: ₹{Math.round(backendCalc?.carbonCredits.valueINR ?? 0).toLocaleString()} (@ ₹1,500/tCO₂e on Indian Carbon Market)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!batch || !buyer || tonnes <= 0}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <Package size={16} />
                  Place Order {totalValue > 0 && `— ₹${totalValue.toLocaleString()}`}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
