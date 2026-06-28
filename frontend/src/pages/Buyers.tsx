import { useState } from "react";
import { Search, CheckCircle, XCircle, Star, MapPin, Phone, FileCheck, Building2, Leaf, Package } from "lucide-react";
import type { Buyer, WasteStream } from "../data/wasteStreams";

interface Props {
  buyers: Buyer[];
  wasteStreams: WasteStream[];
}

export default function Buyers({ buyers, wasteStreams }: Props) {
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");

  const filtered = buyers.filter((b) => {
    if (filterVerified === "verified" && !b.verified) return false;
    if (filterVerified === "pending" && b.verified) return false;
    if (search && !b.company.toLowerCase().includes(search.toLowerCase()) && !b.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">Total Buyers</div>
          <div className="text-2xl font-bold text-slate-800">{buyers.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">Verified</div>
          <div className="text-2xl font-bold text-emerald-600">{buyers.filter((b) => b.verified).length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">Total Ordered</div>
          <div className="text-2xl font-bold text-blue-600">{buyers.reduce((s, b) => s + b.totalOrdered, 0).toLocaleString()} MT</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">Carbon Generated</div>
          <div className="text-2xl font-bold text-teal-600">{buyers.reduce((s, b) => s + b.carbonCredits, 0).toLocaleString()} tCO₂e</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
          <div className="flex gap-2">
            {["all", "verified", "pending"].map((v) => (
              <button
                key={v}
                onClick={() => setFilterVerified(v)}
                className={`text-xs px-4 py-2 rounded-lg border transition-colors font-medium capitalize ${
                  filterVerified === v
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buyer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((buyer) => (
          <div
            key={buyer.id}
            className={`bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg ${
              buyer.verified ? "border-slate-100 hover:border-emerald-200" : "border-amber-200 bg-amber-50/20"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Building2 size={18} className="text-slate-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{buyer.company}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <MapPin size={10} />
                    {buyer.location}
                  </div>
                </div>
              </div>
              {buyer.verified ? (
                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              ) : (
                <XCircle size={18} className="text-amber-500 shrink-0" />
              )}
            </div>

            {/* Industry Tag */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                {buyer.industry}
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 font-medium">
                {buyer.distance} km away
              </span>
              {buyer.rating > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                  <Star size={10} fill="currentColor" />
                  {buyer.rating}
                </span>
              )}
            </div>

            {/* Waste Interests */}
            <div className="mb-3">
              <div className="text-[10px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Waste Stream Interests</div>
              <div className="flex flex-wrap gap-1">
                {buyer.wasteInterests.map((wsId) => {
                  const ws = wasteStreams.find((w) => w.id === wsId);
                  return ws ? (
                    <span
                      key={wsId}
                      className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: ws.bgColor, color: ws.color, border: `1px solid ${ws.borderColor}` }}
                    >
                      {ws.icon} {ws.name.split("(")[0].trim()}
                    </span>
                  ) : null;
                })}
                {buyer.wasteInterests.length === 0 && (
                  <span className="text-[10px] text-slate-400">No API interests listed</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                  <Package size={10} />
                  Total Ordered
                </div>
                <div className="text-sm font-bold text-slate-700">{buyer.totalOrdered.toLocaleString()} MT</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 mb-0.5">
                  <Leaf size={10} />
                  Carbon Credits
                </div>
                <div className="text-sm font-bold text-emerald-700">{buyer.carbonCredits.toLocaleString()} tCO₂e</div>
              </div>
            </div>

            {/* Contact */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Phone size={10} />
                  {buyer.contactPerson || "Unassigned"}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <FileCheck size={10} />
                {buyer.gstNumber ? `${buyer.gstNumber.slice(0, 8)}...` : "GST not set"}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            No buyers returned from the API.
          </div>
        )}
      </div>
    </div>
  );
}
