import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, History, Store, Globe, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Layout({ isUsingMock }) {
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('amm_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('amm_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'POS Billing', path: '/pos', icon: ShoppingCart },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Sales Logs', path: '/sales', icon: History },
  ];

  // POS page needs a rigid height layout (no page scroll); other pages need free scroll
  const isPOS = location.pathname === '/pos';

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 antialiased font-sans overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`transition-all duration-300 bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>

        {/* Brand Header & Toggle */}
        <div className={`flex items-center justify-between border-b border-slate-50 bg-white h-[72px] shrink-0 ${isCollapsed ? 'px-4 justify-center' : 'px-5'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-200 shrink-0">
              <Store size={18} />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in overflow-hidden">
                <h1 className="font-bold text-slate-900 leading-tight text-[13px] tracking-tight whitespace-nowrap">Amit Mega Mart</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">POS & Management</p>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer shrink-0 ml-2"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Connection Status Badge */}
        <div className={`py-3 border-b border-slate-50 bg-slate-50/20 shrink-0 ${isCollapsed ? 'px-3 flex justify-center' : 'px-4'}`}>
          {isUsingMock ? (
            isCollapsed ? (
              <div className="bg-amber-50 p-2 rounded-xl text-amber-500 border border-amber-100/40 cursor-help" title="Offline Mode — Using Local Storage">
                <WifiOff size={15} />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100/40 w-full animate-fade-in">
                <WifiOff size={14} className="shrink-0 text-amber-500" />
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-bold leading-none">Offline Demo</p>
                  <p className="text-[8px] text-amber-600 mt-0.5 font-bold truncate">Local storage sync</p>
                </div>
              </div>
            )
          ) : (
            isCollapsed ? (
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500 border border-emerald-100/40 cursor-help" title="Live — Supabase DB Connected">
                <Globe size={15} />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100/40 w-full animate-fade-in">
                <Globe size={14} className="shrink-0 text-emerald-500" />
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-bold leading-none">Live Connected</p>
                  <p className="text-[8px] text-emerald-600 mt-0.5 font-bold truncate">Supabase DB active</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl transition-all duration-200 relative group ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-blue-50/70 text-blue-600 font-bold shadow-sm shadow-blue-100/20 border border-blue-100/30'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 w-1 h-5 bg-blue-600 rounded-r-full" />
                )}
                <Icon
                  size={17}
                  className={`transition-transform duration-200 group-hover:scale-105 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                />
                {!isCollapsed && <span className="text-[13px] animate-fade-in truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-50 bg-slate-50/20 flex flex-col gap-0.5 items-center justify-center shrink-0">
          {!isCollapsed ? (
            <>
              <div className="text-[10px] font-bold text-slate-700 animate-fade-in">Amit Mega Mart Retail</div>
              <div className="text-[8px] text-slate-400 font-bold animate-fade-in">Production System v1.5.0</div>
            </>
          ) : (
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight">v1.5</div>
          )}
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isPOS ? (
          /* POS page: fixed height, no outer scroll — inner panels scroll independently */
          <div className="flex-1 p-5 md:p-6 overflow-hidden flex flex-col min-h-0">
            <Outlet />
          </div>
        ) : (
          /* All other pages: allow natural vertical scrolling */
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-8 max-w-full">
              <Outlet />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
