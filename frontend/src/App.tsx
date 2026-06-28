import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login, { type AuthUser } from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ledger from "./pages/Ledger";
import Marketplace from "./pages/Marketplace";
import Logistics from "./pages/Logistics";
import Carbon from "./pages/Carbon";
import Buyers from "./pages/Buyers";
import SetupGuide from "./pages/SetupGuide";
import { useRealtimeData } from "./hooks/useRealtimeData";
import { clearAuthSession, logoutAuthSession, storeAuthSession } from "./lib/api";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("nalco:w2w:user");
    return stored ? JSON.parse(stored) : null;
  });
  const {
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
    calculateRoute,
  } = useRealtimeData();

  const handleLogin = (nextUser: AuthUser) => {
    storeAuthSession(nextUser);
    setUser(nextUser);
  };

  const handleLogout = () => {
    void logoutAuthSession();
    clearAuthSession();
    setUser(null);
    setActivePage("dashboard");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard metrics={metrics} iotFeed={iotFeed} wasteStreams={wasteStreams} revenueHistory={revenueHistory} carbonHistory={carbonHistory} />;
      case "ledger":
        return <Ledger batches={batches} wasteStreams={wasteStreams} />;
      case "marketplace":
        return <Marketplace batches={batches} orders={orders} buyers={buyers} wasteStreams={wasteStreams} onAddOrder={addOrder} calculateRoute={calculateRoute} />;
      case "logistics":
        return <Logistics orders={orders} buyers={buyers} wasteStreams={wasteStreams} calculateRoute={calculateRoute} />;
      case "carbon":
        return <Carbon metrics={metrics} buyers={buyers} wasteStreams={wasteStreams} carbonHistory={carbonHistory} carbonCredits={carbonCredits} />;
      case "buyers":
        return <Buyers buyers={buyers} wasteStreams={wasteStreams} />;
      case "setup":
        return <SetupGuide />;
      default:
        return <Dashboard metrics={metrics} iotFeed={iotFeed} wasteStreams={wasteStreams} revenueHistory={revenueHistory} carbonHistory={carbonHistory} />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif]">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[68px]" : "ml-[260px]"}`}
      >
        <Header metrics={metrics} activePage={activePage} user={user} onLogout={handleLogout} />
        <main className="p-6">
          {loading && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Syncing live data from the API...
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              API sync warning: {error}
            </div>
          )}
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
