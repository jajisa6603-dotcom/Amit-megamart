import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, History,
  Store, Wifi, WifiOff, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';

export default function Layout({ isUsingMock }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('amm_sidebar_collapsed') === 'true'
  );

  const toggle = () => setCollapsed(prev => {
    const next = !prev;
    localStorage.setItem('amm_sidebar_collapsed', String(next));
    return next;
  });

  const nav = [
    { name: 'Dashboard',   path: '/',          icon: LayoutDashboard },
    { name: 'POS Billing', path: '/pos',        icon: ShoppingCart },
    { name: 'Inventory',   path: '/inventory',  icon: Package },
    { name: 'Sales Logs',  path: '/sales',      icon: History },
  ];

  const isPOS = location.pathname === '/pos';

  const pageNames = {
    '/':          'Dashboard',
    '/pos':       'POS Terminal',
    '/inventory': 'Inventory',
    '/sales':     'Sales History',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f4f8' }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? 72 : 240,
          background: '#0f172a',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center shrink-0 border-b"
          style={{ height: 64, borderColor: 'rgba(255,255,255,0.06)', padding: collapsed ? '0 16px' : '0 20px' }}
        >
          <div
            className="flex items-center justify-center shrink-0 rounded-xl"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}
          >
            <Store size={18} className="text-white" />
          </div>

          {!collapsed && (
            <div className="ml-3 overflow-hidden animate-fade-in">
              <p className="font-bold text-white text-[13px] leading-tight truncate">Amit Mega Mart</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
                POS System
              </p>
            </div>
          )}

          <button
            onClick={toggle}
            className="ml-auto p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Connection badge */}
        <div
          className="shrink-0 mx-3 mt-3 mb-1 rounded-lg flex items-center"
          style={{
            padding: collapsed ? '8px' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: isUsingMock ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
          }}
          title={isUsingMock ? 'Offline — localStorage mode' : 'Live — Supabase connected'}
        >
          {isUsingMock
            ? <WifiOff size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
            : <Wifi size={14} style={{ color: '#10b981', flexShrink: 0 }} />
          }
          {!collapsed && (
            <span
              className="ml-2 text-[11px] font-semibold truncate animate-fade-in"
              style={{ color: isUsingMock ? '#f59e0b' : '#10b981' }}
            >
              {isUsingMock ? 'Offline Mode' : 'DB Connected'}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {nav.map(({ name, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? name : undefined}
                className="flex items-center rounded-xl transition-all duration-150 relative"
                style={{
                  padding: collapsed ? '10px 12px' : '10px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                  color: active ? '#60a5fa' : '#64748b',
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full"
                    style={{ height: 20, background: '#2563eb' }}
                  />
                )}
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span className="ml-3 text-[13px] truncate animate-fade-in">{name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="shrink-0 border-t py-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)', textAlign: 'center' }}
        >
          {collapsed
            ? <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>v1.5</span>
            : (
              <div className="animate-fade-in">
                <p className="text-[10px] font-semibold" style={{ color: '#334155' }}>Amit Mega Mart Retail</p>
                <p className="text-[9px]" style={{ color: '#1e293b' }}>Production System v1.5.0</p>
              </div>
            )
          }
        </div>
      </aside>

      {/* ══════════════ MAIN AREA ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header
          className="shrink-0 flex items-center justify-between px-6 border-b bg-white"
          style={{ height: 64, borderColor: '#e2e8f0' }}
        >
          <div>
            <h1 className="font-bold text-slate-900 text-[15px] tracking-tight">
              {pageNames[location.pathname] || 'Amit Mega Mart'}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer relative"
            >
              <Bell size={18} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: '#ef4444' }}
              />
            </button>
            <div
              className="flex items-center gap-2.5 pl-3 border-l"
              style={{ borderColor: '#e2e8f0' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}
              >
                AM
              </div>
              {!collapsed && (
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800">Admin</p>
                  <p className="text-[10px] text-slate-400">Manager</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        {isPOS ? (
          <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
            <Outlet />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-full">
              <Outlet />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
