import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, History, Store, Globe, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Layout({ isUsingMock }) {
  const location = useLocation();

  // Load initial collapsible sidebar preference from localStorage
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

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 antialiased font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`transition-all duration-300 bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Brand Header & Toggle */}
        <div className={`p-5 flex items-center justify-between border-b border-slate-50 bg-white h-[77px] shrink-0 ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-200 shrink-0">
              <Store size={20} className="animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-slate-900 leading-tight text-[14px] tracking-tight">Amit Mega Mart</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">POS & Management</p>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button 
              onClick={toggleSidebar} 
              className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {/* Collapsed Expand Trigger (Centered Arrow when collapsed) */}
        {isCollapsed && (
          <div className="py-2.5 border-b border-slate-50 flex justify-center bg-slate-50/10">
            <button 
              onClick={toggleSidebar} 
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-100/50 hover:border-slate-200 transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Connection Status Badge */}
        <div className={`py-4 border-b border-slate-50 bg-slate-50/20 shrink-0 ${isCollapsed ? 'px-4 flex justify-center' : 'px-6'}`}>
          {isUsingMock ? (
            isCollapsed ? (
              <div className="bg-amber-50 p-2.5 rounded-xl text-amber-500 border border-amber-100/40 cursor-help" title="Offline Demo Mode (Using Local Storage)">
                <WifiOff size={16} />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100/40 w-full animate-fade-in">
                <WifiOff size={15} className="shrink-0 text-amber-500" />
                <div className="text-left">
                  <p className="text-[10px] font-bold leading-none">Offline Demo</p>
                  <p className="text-[8px] text-amber-600 mt-0.5 font-bold">Local storage sync</p>
                </div>
              </div>
            )
          ) : (
            isCollapsed ? (
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-500 border border-emerald-100/40 cursor-help" title="Database Connected (Supabase Online)">
                <Globe size={16} />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100/40 w-full animate-fade-in">
                <Globe size={15} className="shrink-0 text-emerald-500" />
                <div className="text-left">
                  <p className="text-[10px] font-bold leading-none">Live Connected</p>
                  <p className="text-[8px] text-emerald-600 mt-0.5 font-bold">Supabase DB active</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
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
                  <span className="absolute left-0 w-1.5 h-5 bg-blue-600 rounded-r-full" />
                )}
                <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {!isCollapsed && <span className="text-[13px] animate-fade-in">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/20 flex flex-col gap-1 items-center justify-center shrink-0">
          {!isCollapsed ? (
            <>
              <div className="text-[10px] font-bold text-slate-700 animate-fade-in">
                Amit Mega Mart Retail
              </div>
              <div className="text-[8px] text-slate-400 font-bold animate-fade-in">
                Production System v1.5.0
              </div>
            </>
          ) : (
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
              v1.5
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gradient-to-b from-slate-50/60 to-slate-100/40 flex flex-col">
        <div className="p-6 md:p-8 w-full flex-grow flex flex-col overflow-hidden min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
