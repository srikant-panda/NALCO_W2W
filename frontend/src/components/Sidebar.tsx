import { LayoutDashboard, BookOpen, ShoppingCart, Truck, Leaf, Users, Settings, Zap, ChevronLeft, ChevronRight } from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "ledger", label: "Residue Ledger", icon: BookOpen },
  { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
  { id: "logistics", label: "Logistics Hub", icon: Truck },
  { id: "carbon", label: "Carbon Credits", icon: Leaf },
  { id: "buyers", label: "Buyer Network", icon: Users },
  { id: "setup", label: "Setup Guide", icon: Settings },
];

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col z-50 transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[260px]"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-lg font-black shrink-0">
          W2W
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold tracking-wide">NALCO</div>
            <div className="text-[10px] text-slate-400 tracking-wider">WASTE-TO-WEALTH</div>
          </div>
        )}
      </div>

      {/* IoT Status */}
      {!collapsed && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-emerald-400" />
            <span className="text-[11px] text-emerald-300 font-medium">IoT Sensors Active</span>
            <span className="ml-auto flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 mt-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={active ? "text-emerald-400" : ""} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700/50">
          <div className="text-[10px] text-slate-500 text-center">
            Damanjodi Plant, Koraput, Odisha
            <br />
            v2.1.0 • Real-time Monitoring
          </div>
        </div>
      )}
    </aside>
  );
}
