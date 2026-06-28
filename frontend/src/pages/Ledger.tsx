import { useState } from "react";
import { Search, Filter, Download, FlaskConical, Droplets, TestTube } from "lucide-react";
import type { Batch, WasteStream } from "../data/wasteStreams";

interface Props {
  batches: Batch[];
  wasteStreams: WasteStream[];
}

const statusColors: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Reserved: "bg-amber-50 text-amber-700 border-amber-200",
  "In Transit": "bg-blue-50 text-blue-700 border-blue-200",
  Delivered: "bg-slate-50 text-slate-500 border-slate-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const gradeColors: Record<string, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-amber-500 text-white",
  C: "bg-red-500 text-white",
};

export default function Ledger({ batches, wasteStreams }: Props) {
  const [search, setSearch] = useState("");
  const [filterStream, setFilterStream] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = batches.filter((b) => {
    if (filterStream !== "all" && b.wasteStreamId !== filterStream) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (search && !b.batchCode.toLowerCase().includes(search.toLowerCase()) && !b.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalAvailable = filtered.filter((b) => b.status === "Available").reduce((s, b) => s + b.tonnes, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">Total Batches</div>
          <div className="text-2xl font-bold text-slate-800">{filtered.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">Available Stock</div>
          <div className="text-2xl font-bold text-emerald-600">{totalAvailable.toLocaleString()} MT</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">Grade A Batches</div>
          <div className="text-2xl font-bold text-blue-600">{filtered.filter((b) => b.grade === "A").length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">In Transit</div>
          <div className="text-2xl font-bold text-orange-600">{filtered.filter((b) => b.status === "In Transit").length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search batch code, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterStream}
              onChange={(e) => setFilterStream(e.target.value)}
              className="text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">All Streams</option>
              {wasteStreams.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.icon} {ws.name.split("(")[0].trim()}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Batch Code</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Waste Stream</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tonnes</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quality</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Treatment</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Certifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((batch) => {
                const ws = wasteStreams.find((w) => w.id === batch.wasteStreamId);
                return (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-slate-800">{batch.batchCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{ws?.icon || "◦"}</span>
                        <span className="text-slate-600">{ws?.name.split("(")[0].trim() || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(batch.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{batch.tonnes.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-blue-600" title="Moisture">
                          <Droplets size={12} />
                          {batch.moisture.toFixed(1)}%
                        </span>
                        <span className="flex items-center gap-1 text-purple-600" title="pH">
                          <TestTube size={12} />
                          {batch.ph.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex w-6 h-6 rounded-md items-center justify-center text-xs font-bold ${gradeColors[batch.grade]}`}>
                        {batch.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{batch.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <FlaskConical size={12} />
                        {batch.treatmentMethod}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColors[batch.status]}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {batch.certifications.map((cert) => (
                          <span key={cert} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={10}>
                    No batches match the current API-backed filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
