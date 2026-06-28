import { useEffect, useMemo, useState } from "react";
import { MapPin, Truck, Clock, IndianRupee, Route, Navigation, ArrowRight, Fuel, AlertTriangle, Factory as FactoryIcon, Calculator } from "lucide-react";
import type { Buyer, Order, WasteStream } from "../data/wasteStreams";
import { wasteTypeFromStreamId } from "../lib/api";

interface Props {
  orders: Order[];
  buyers: Buyer[];
  wasteStreams: WasteStream[];
  calculateRoute: (tonnes: number, distanceKM: number, wasteType: string) => Promise<{
    freightCost: number;
    truckCount: number;
    transportCO2e: number;
    carbonCredits: { tCO2e: number; valueINR: number; factor: number };
    netCO2e: number;
  }>;
}

function highwayForDistance(distance: number): string {
  if (distance <= 120) return "NH-26";
  if (distance <= 220) return "NH-26 -> NH-59";
  if (distance <= 360) return "NH-26 -> NH-55";
  if (distance <= 430) return "NH-49 -> NH-53";
  return "NH-26 -> NH-16";
}

export default function Logistics({ orders, buyers, wasteStreams, calculateRoute }: Props) {
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [selectedWasteStreamId, setSelectedWasteStreamId] = useState("");
  const [calcTonnes, setCalcTonnes] = useState("1000");
  const [backendCalc, setBackendCalc] = useState<{
    freightCost: number;
    truckCount: number;
    transportCO2e: number;
    carbonCredits: { tCO2e: number; valueINR: number; factor: number };
    netCO2e: number;
  } | null>(null);

  const destinations = useMemo(() => [...buyers].sort((a, b) => a.distance - b.distance), [buyers]);
  const activeShipments = orders.filter((o) => o.status === "Dispatched" || o.status === "Confirmed");
  const routeBuyer = destinations[selectedRoute] || destinations[0];
  const routeWasteStream = wasteStreams.find((stream) => stream.id === selectedWasteStreamId) || wasteStreams[0];
  const tonnes = Number(calcTonnes) || 0;
  const distance = routeBuyer?.distance || 0;

  useEffect(() => {
    if (!selectedWasteStreamId && wasteStreams.length) {
      setSelectedWasteStreamId(wasteStreams[0].id);
    }
  }, [selectedWasteStreamId, wasteStreams]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!tonnes || !distance || !routeWasteStream) {
        setBackendCalc(null);
        return;
      }
      try {
        const result = await calculateRoute(tonnes, distance, wasteTypeFromStreamId(routeWasteStream.id));
        if (active) {
          setBackendCalc(result);
        }
      } catch {
        if (active) setBackendCalc(null);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [calculateRoute, distance, routeWasteStream, tonnes]);

  const routeNodes = destinations.slice(0, 7).map((buyer, index) => {
    const positions = [
      { top: "40%", left: "30%" },
      { top: "68%", left: "45%" },
      { top: "25%", left: "55%" },
      { top: "18%", left: "40%" },
      { top: "12%", left: "50%" },
      { top: "38%", left: "72%" },
      { top: "78%", left: "35%" },
    ];
    const position = positions[index] || positions[positions.length - 1];
    return {
      ...position,
      name: buyer.location.split(",")[0],
      distance: `${buyer.distance}km`,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Active Shipments</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{activeShipments.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Currently in transit or confirmed</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Route size={16} className="text-emerald-600" />
            <span className="text-xs font-semibold text-slate-600">Total Distance Today</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {activeShipments.reduce((s, o) => s + o.distance, 0).toLocaleString()} km
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all active routes</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={16} className="text-orange-600" />
            <span className="text-xs font-semibold text-slate-600">Freight Cost</span>
          </div>
          <div className="text-3xl font-bold text-orange-600">
            ₹{(activeShipments.reduce((s, o) => s + o.freightCost, 0) / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Estimated total freight</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Logistics Route Network</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live buyer destinations from the API</p>
          </div>

          <div className="p-6">
            <div className="relative bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50 rounded-2xl p-6 border border-slate-200 min-h-[380px]">
              <div className="flex items-center gap-2 mb-4">
                <Navigation size={14} className="text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Buyer route map</span>
              </div>

              <div className="absolute top-[55%] left-[20%]">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                    <FactoryIcon size={10} className="text-white" />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-red-700 bg-white/90 px-1.5 py-0.5 rounded shadow">
                    DAMANJODI
                  </div>
                </div>
              </div>

              {routeNodes.map((dest) => (
                <div key={`${dest.name}-${dest.distance}`} className="absolute" style={{ top: dest.top, left: dest.left }}>
                  <div className="relative group cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md group-hover:scale-150 transition-transform"></div>
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold text-blue-800 bg-white/90 px-1.5 py-0.5 rounded shadow opacity-80 group-hover:opacity-100">
                      {dest.name}
                    </div>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-slate-500 bg-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {dest.distance}
                    </div>
                    <svg className="absolute top-1/2 right-full w-16 h-0.5 overflow-visible pointer-events-none" style={{ transform: "translateY(-50%)" }}>
                      <line x1="0" y1="0" x2="60" y2="0" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" className="animate-pulse" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calculator size={16} />
              Freight Cost Calculator
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Select Destination</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {destinations.map((buyer, index) => (
                    <option key={buyer.id} value={index}>
                      {buyer.company} — {buyer.distance} km
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Select Waste Stream</label>
                <select
                  value={selectedWasteStreamId}
                  onChange={(e) => setSelectedWasteStreamId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {wasteStreams.map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.icon} {stream.name.split("(")[0].trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Quantity (MT)</label>
                <input
                  type="number"
                  value={calcTonnes}
                  onChange={(e) => setCalcTonnes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-medium text-slate-700">Damanjodi</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-slate-700">{routeBuyer?.location || "Select destination"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs">
                    <Route size={12} className="text-slate-400" />
                    <span className="text-slate-500">Distance:</span>
                    <span className="font-bold text-slate-700">{distance} km</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-slate-500">Route:</span>
                    <span className="font-bold text-slate-700">{highwayForDistance(distance)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Truck size={12} className="text-slate-400" />
                    <span className="text-slate-500">Trucks:</span>
                    <span className="font-bold text-slate-700">{backendCalc?.truckCount ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="text-slate-500">Waste:</span>
                    <span className="font-bold text-slate-700">{routeWasteStream?.name.split("(")[0].trim() || "Select stream"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Freight Cost:</span>
                    <span className="font-bold text-orange-600">₹{Math.round(backendCalc?.freightCost ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Transport CO₂:</span>
                    <span className="font-semibold text-red-600 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {(backendCalc?.transportCO2e ?? 0).toFixed(1)} tCO₂e
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Net CO₂:</span>
                    <span className="font-semibold text-emerald-600">{(backendCalc?.netCO2e ?? 0).toFixed(1)} tCO₂e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">CO₂ Credits:</span>
                    <span className="font-semibold text-blue-600">{(backendCalc?.carbonCredits.tCO2e ?? 0).toFixed(1)} tCO₂e</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Active Shipments</h3>
            <div className="space-y-3">
              {activeShipments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No active shipments</p>
              ) : (
                activeShipments.map((order) => {
                  const b = buyers.find((x) => x.id === order.buyerId);
                  return (
                    <div key={order.id} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-slate-700">{order.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          order.status === "Dispatched" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-1">{b?.company || "Unknown"} → {b?.location || "Unknown"}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{order.tonnes} MT</span>
                        <span>•</span>
                        <span>{order.distance} km</span>
                        <span>•</span>
                        <span>{order.truckCount} trucks</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000"
                          style={{ width: order.status === "Dispatched" ? "65%" : "25%" }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
