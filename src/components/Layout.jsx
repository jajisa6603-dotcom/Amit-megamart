import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, History, Store, Globe, WifiOff } from 'lucide-react';

export default function Layout({ isUsingMock }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'POS Billing', path: '/pos', icon: ShoppingCart },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Sales Logs', path: '/sales', icon: History },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-50">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-200">
            <Store size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight text-base tracking-tight">Amit Mega Mart</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">POS & Management</p>
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
          {isUsingMock ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100/50">
              <WifiOff size={15} className="shrink-0 text-amber-500" />
              <div className="text-left">
                <p className="text-[11px] font-bold leading-none">Offline Demo Mode</p>
                <p className="text-[9px] text-amber-600/80 mt-0.5 font-medium">Using local storage</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100/50">
              <Globe size={15} className="shrink-0 text-emerald-500" />
              <div className="text-left">
                <p className="text-[11px] font-bold leading-none">Database Connected</p>
                <p className="text-[9px] text-emerald-600/80 mt-0.5 font-medium">Supabase online</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-blue-50/70 text-blue-600 font-bold shadow-sm shadow-blue-100/30 border border-blue-100/40'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 w-1.5 h-6 bg-blue-600 rounded-r-full" />
                )}
                <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="text-[13px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-slate-50 bg-slate-50/20 flex flex-col gap-1 items-center">
          <div className="text-[11px] font-bold text-slate-700">
            Amit Mega Mart Retail
          </div>
          <div className="text-[9px] text-slate-400 font-medium">
            Production System v1.5.0
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gradient-to-b from-slate-50/60 to-slate-100/40">
        <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
