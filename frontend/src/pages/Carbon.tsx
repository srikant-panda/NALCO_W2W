import { Leaf, Award, Globe, FileText, Download, TreePine, Droplets, Factory } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, RadialBarChart, RadialBar } from "recharts";
import type { Buyer, WasteStream } from "../data/wasteStreams";
import type { CarbonPoint, RealtimeMetrics } from "../hooks/useRealtimeData";
import type { BackendCarbonCredit } from "../lib/api";
import { wasteTypeFromStreamId } from "../lib/api";

interface Props {
  metrics: RealtimeMetrics;
  buyers: Buyer[];
  wasteStreams: WasteStream[];
  carbonHistory: CarbonPoint[];
  carbonCredits: BackendCarbonCredit[];
}

export default function Carbon({ metrics, buyers, wasteStreams, carbonHistory, carbonCredits }: Props) {
  const totalCarbonAllTime = carbonCredits.reduce((sum, credit) => sum + (Number(credit.tCO2e) || 0), 0);
  const liveCarbonTotal = metrics.totalCarbonSaved || totalCarbonAllTime;
  const carbonValue = liveCarbonTotal * 1500; // ₹1500/tCO₂e
  const treesEquivalent = Math.round(liveCarbonTotal * 45); // ~45 trees per tCO₂e
  const waterSaved = Math.round(liveCarbonTotal * 3200); // liters

  // Top buyers by carbon contribution
  const topBuyers = [...buyers]
    .filter((b) => b.carbonCredits > 0)
    .sort((a, b) => b.carbonCredits - a.carbonCredits)
    .slice(0, 5);

  // By-stream carbon breakdown
  const carbonByStream = new Map<string, number>();
  carbonCredits.forEach((credit) => {
    const streamType = credit.order?.batch?.wasteStream?.type;
    if (!streamType) return;
    carbonByStream.set(streamType, (carbonByStream.get(streamType) || 0) + (Number(credit.tCO2e) || 0));
  });

  const streamBreakdown = wasteStreams.map((ws) => ({
    name: ws.name.split("(")[0].trim(),
    icon: ws.icon,
    factor: ws.carbonFactor,
    total: Math.round(carbonByStream.get(wasteTypeFromStreamId(ws.id)) || 0),
    color: ws.color,
    potential: Math.round(ws.currentStock * ws.carbonFactor),
  }));

  // Radial data for methodology
  const methodologyCounts = new Map<string, number>();
  carbonCredits.forEach((credit) => {
    methodologyCounts.set(credit.methodology, (methodologyCounts.get(credit.methodology) || 0) + 1);
  });
  const methodologyTotal = carbonCredits.length || 1;
  const methodPalette = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#14B8A6"];
  const methodData = methodologyCounts.size
    ? [...methodologyCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], index) => ({ name, value: Math.round((count / methodologyTotal) * 100), fill: methodPalette[index % methodPalette.length] }))
    : [{ name: "No credits yet", value: 0, fill: "#10B981" }];

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Leaf size={18} />
            <span className="text-xs font-semibold opacity-80">Total CO₂ Saved</span>
          </div>
          <div className="text-3xl font-bold">{liveCarbonTotal.toLocaleString()}</div>
          <div className="text-xs opacity-70 mt-1">tCO₂e (all time)</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} />
            <span className="text-xs font-semibold opacity-80">Carbon Credit Value</span>
          </div>
          <div className="text-3xl font-bold">₹{(carbonValue / 10000000).toFixed(1)}Cr</div>
          <div className="text-xs opacity-70 mt-1">@ ₹1,500/tCO₂e (ICM)</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <TreePine size={18} />
            <span className="text-xs font-semibold opacity-80">Trees Equivalent</span>
          </div>
          <div className="text-3xl font-bold">{(treesEquivalent / 1000).toFixed(0)}K</div>
          <div className="text-xs opacity-70 mt-1">trees planted equivalent</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Droplets size={18} />
            <span className="text-xs font-semibold opacity-80">Water Saved</span>
          </div>
          <div className="text-3xl font-bold">{(waterSaved / 1000000).toFixed(1)}M</div>
          <div className="text-xs opacity-70 mt-1">liters (vs virgin mining)</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Carbon Credit Accumulation</h3>
          <p className="text-xs text-slate-400 mb-4">tCO₂e saved per month from all waste streams</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={carbonHistory}>
              <defs>
                <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Area type="monotone" dataKey="total" stroke="#10B981" fill="url(#carbonGrad)" strokeWidth={2.5} name="Total tCO₂e" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Verification Standards</h3>
          <p className="text-xs text-slate-400 mb-4">Compliance score by methodology</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={methodData} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={8} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "11px" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {methodData.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.fill }}></span>
                  <span className="text-slate-600">{m.name}</span>
                </div>
                <span className="font-bold text-slate-700">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By-Stream Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream cards */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Factory size={16} />
            Carbon Savings by Waste Stream
          </h3>
          <div className="space-y-3">
            {streamBreakdown.map((s) => (
              <div key={s.name} className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.factor} tCO₂e/MT</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-600">{s.total.toLocaleString()} tCO₂e</div>
                    <div className="text-[10px] text-slate-400">of {s.potential.toLocaleString()} potential</div>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.potential > 0 ? Math.min((s.total / s.potential) * 100, 100) : 0}%`, backgroundColor: s.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Buyers by Carbon */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Globe size={16} />
            Top Buyers by Carbon Contribution
          </h3>
          <div className="space-y-3">
            {topBuyers.map((buyer, i) => (
              <div key={buyer.id} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                    i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-amber-700" : "bg-slate-300"
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">{buyer.company}</div>
                    <div className="text-[10px] text-slate-400">{buyer.industry} • {buyer.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{buyer.carbonCredits.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">tCO₂e</div>
                  </div>
                </div>
                <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(buyer.carbonCredits / topBuyers[0].carbonCredits) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Carbon Certificate */}
          <div className="mt-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">Carbon Credit Certificate</span>
              </div>
              <button className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                <Download size={10} />
                PDF
              </button>
            </div>
          <div className="text-[10px] text-emerald-700 space-y-1">
              <p>• Methodology: {methodData[0]?.name || "API-driven"}</p>
              <p>• Registry: Indian Carbon Market (ICM)</p>
              <p>• Verification: Backend-supplied credits</p>
              <p>• Credit Period: Current API window</p>
              <p>• Total Issued: {liveCarbonTotal.toLocaleString()} VCUs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stacked Bar for monthly breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Breakdown by Stream</h3>
        <p className="text-xs text-slate-400 mb-4">Stacked view of tCO₂e savings contribution</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={carbonHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
            <Bar dataKey="redMud" name="Red Mud" fill="#DC2626" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="flyAsh" name="Fly Ash" fill="#6B7280" stackId="a" />
            <Bar dataKey="spl" name="SPL" fill="#1F2937" stackId="a" />
            <Bar dataKey="dross" name="Dross" fill="#9CA3AF" stackId="a" />
            <Bar dataKey="caustic" name="Caustic" fill="#F59E0B" stackId="a" />
            <Bar dataKey="limeGrit" name="Lime Grit" fill="#A8A29E" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
