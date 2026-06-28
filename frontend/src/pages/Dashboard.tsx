import { TrendingUp, TrendingDown, Package, DollarSign, Leaf, Truck, Users, BarChart3, ArrowUpRight, Factory } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import type { CarbonPoint, RealtimeMetrics, RevenuePoint } from "../hooks/useRealtimeData";
import type { WasteStream } from "../data/wasteStreams";

interface Props {
  metrics: RealtimeMetrics;
  iotFeed: { time: string; event: string; value: string }[];
  wasteStreams: WasteStream[];
  revenueHistory: RevenuePoint[];
  carbonHistory: CarbonPoint[];
}

export default function Dashboard({ metrics, iotFeed, wasteStreams, revenueHistory, carbonHistory }: Props) {
  const pieData = wasteStreams.map((ws) => ({
    name: ws.name.split("(")[0].trim(),
    value: metrics.stockByStream[ws.id] || ws.currentStock,
    color: ws.color,
  }));

  const kpiCards = [
    {
      label: "Total Stockpile",
      value: `${(metrics.totalStockpile / 1000).toFixed(1)}K MT`,
      change: "+2.4%",
      trend: "up",
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Revenue Generated",
      value: `₹${(metrics.totalRevenue / 100000).toFixed(1)}L`,
      change: "+12.8%",
      trend: "up",
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Carbon Credits",
      value: `${metrics.totalCarbonSaved.toLocaleString()} tCO₂e`,
      change: "+8.2%",
      trend: "up",
      icon: Leaf,
      color: "from-teal-500 to-teal-600",
      bg: "bg-teal-50",
      textColor: "text-teal-600",
    },
    {
      label: "Active Orders",
      value: metrics.totalOrders.toString(),
      change: "+3",
      trend: "up",
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Trucks In Transit",
      value: metrics.trucksInTransit.toString(),
      change: "On NH-26, NH-53",
      trend: "up",
      icon: Truck,
      color: "from-orange-500 to-orange-600",
      bg: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      label: "Active Buyers",
      value: metrics.activeBuyers.toString(),
      change: "+2 new",
      trend: "up",
      icon: Users,
      color: "from-pink-500 to-pink-600",
      bg: "bg-pink-50",
      textColor: "text-pink-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className={kpi.textColor} />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  {kpi.trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-xl font-bold text-slate-800">{kpi.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Revenue & Projections</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly revenue from waste stream sales (₹ Lakhs)</p>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-200"></span> Projected
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueHistory}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                formatter={(value: any) => [`₹${value}L`, ""]}
              />
              <Area type="monotone" dataKey="projected" stroke="#6EE7B7" fill="url(#colorProjected)" strokeWidth={2} strokeDasharray="5 5" />
              <Area type="monotone" dataKey="actual" stroke="#10B981" fill="url(#colorActual)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Waste Distribution Pie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Waste Stream Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Available stock by type (MT)</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} MT`, ""]} contentStyle={{ borderRadius: "12px", fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-700">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carbon Credits by Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Carbon Credits by Waste Stream</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly tCO₂e savings breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={carbonHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="redMud" name="Red Mud" fill="#DC2626" radius={[2, 2, 0, 0]} stackId="stack" />
              <Bar dataKey="flyAsh" name="Fly Ash" fill="#6B7280" radius={[2, 2, 0, 0]} stackId="stack" />
              <Bar dataKey="spl" name="SPL" fill="#1F2937" radius={[2, 2, 0, 0]} stackId="stack" />
              <Bar dataKey="dross" name="Dross" fill="#9CA3AF" radius={[2, 2, 0, 0]} stackId="stack" />
              <Bar dataKey="caustic" name="Caustic" fill="#F59E0B" radius={[2, 2, 0, 0]} stackId="stack" />
              <Bar dataKey="limeGrit" name="Lime Grit" fill="#A8A29E" radius={[2, 2, 0, 0]} stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* IoT Live Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800">IoT Sensor Feed</h3>
            <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">LIVE</span>
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {iotFeed.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Waiting for sensor data...</p>
            ) : (
              iotFeed.map((item, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border text-[11px] transition-all duration-500 ${
                    i === 0
                      ? "bg-emerald-50/50 border-emerald-200 animate-pulse"
                      : "bg-slate-50/50 border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-slate-500 font-mono">{item.time}</span>
                    <span className="font-bold text-slate-700">{item.value}</span>
                  </div>
                  <div className="text-slate-600">{item.event}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Waste Stream Cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Factory size={16} />
          Waste Stream Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wasteStreams.map((ws) => (
            <div
              key={ws.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{ws.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{ws.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{ws.chemicalFormula}</p>
                </div>
                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>

              <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{ws.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-xs font-bold text-slate-700">
                    {((metrics.stockByStream[ws.id] || ws.currentStock) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[9px] text-slate-400">Stock MT</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-xs font-bold text-emerald-600">₹{ws.avgPrice}</div>
                  <div className="text-[9px] text-slate-400">Per MT</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-xs font-bold text-blue-600">{ws.carbonFactor}</div>
                  <div className="text-[9px] text-slate-400">tCO₂e/MT</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {ws.applications.slice(0, 3).map((app) => (
                  <span
                    key={app}
                    className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: ws.bgColor, color: ws.color, border: `1px solid ${ws.borderColor}` }}
                  >
                    {app}
                  </span>
                ))}
                {ws.applications.length > 3 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    +{ws.applications.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
