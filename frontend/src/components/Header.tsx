import { Bell, LogOut, RefreshCw, Search } from "lucide-react";
import type { RealtimeMetrics } from "../hooks/useRealtimeData";
import type { AuthUser } from "../pages/Login";

interface HeaderProps {
  metrics: RealtimeMetrics;
  activePage: string;
  user: AuthUser;
  onLogout: () => void;
}

const pageLabels: Record<string, string> = {
  dashboard: "Command Center",
  ledger: "Residue Ledger",
  marketplace: "B2B Marketplace",
  logistics: "Logistics Hub",
  carbon: "Carbon Credits Dashboard",
  buyers: "Buyer Network",
  setup: "Backend Setup Guide",
};

export default function Header({ metrics, activePage, user, onLogout }: HeaderProps) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{pageLabels[activePage] || "Dashboard"}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Last sync: {metrics.lastUpdate.toLocaleTimeString()} • Damanjodi Operations Center
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Stock Ticker */}
          <div className="hidden lg:flex items-center gap-4 mr-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">LIVE</span>
            </div>
            <div className="text-[11px]">
              <span className="text-slate-400">Stockpile:</span>{" "}
              <span className="font-bold text-slate-700">{metrics.totalStockpile.toLocaleString()} MT</span>
            </div>
            <div className="text-[11px]">
              <span className="text-slate-400">Revenue:</span>{" "}
              <span className="font-bold text-emerald-600">₹{(metrics.totalRevenue / 100000).toFixed(1)}L</span>
            </div>
            <div className="text-[11px]">
              <span className="text-slate-400">CO₂ Saved:</span>{" "}
              <span className="font-bold text-blue-600">{metrics.totalCarbonSaved.toLocaleString()} tCO₂e</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search batches, orders..."
              className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell size={18} className="text-slate-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Sync */}
          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw size={18} className="text-slate-500" />
          </button>

          {/* User */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-700">{user.name}</div>
              <div className="text-[10px] text-slate-400">{user.role.replace("_", " ")}</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} className="text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
