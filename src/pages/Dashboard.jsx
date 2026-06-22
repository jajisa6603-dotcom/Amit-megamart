import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, AlertTriangle, IndianRupee,
  ArrowRight, Package, ArrowUpRight, ArrowDownRight, BarChart2
} from 'lucide-react';

export default function Dashboard({ products = [], sales = [] }) {
  const LOW = 10;

  const totalInventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStockItems = products.filter(p => p.stock <= LOW);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => new Date(s.created_at).toISOString().split('T')[0] === today);
  const todayRevenue = todaySales.reduce((s, x) => s + Number(x.total_amount), 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split('T')[0];
  const yRevenue = sales
    .filter(s => new Date(s.created_at).toISOString().split('T')[0] === yDate)
    .reduce((s, x) => s + Number(x.total_amount), 0);

  const revenueChange = yRevenue > 0 ? ((todayRevenue - yRevenue) / yRevenue) * 100 : null;

  // Last 7 days chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyTotals = last7.map(date =>
    sales
      .filter(s => new Date(s.created_at).toISOString().split('T')[0] === date)
      .reduce((s, x) => s + Number(x.total_amount), 0)
  );

  const maxVal = Math.max(...dailyTotals, 500);

  // Top products
  const topProducts = React.useMemo(() => {
    const map = {};
    sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const n = item.product_name || item.name || 'Unknown';
        map[n] = (map[n] || 0) + item.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  const fmt = n => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const KPICard = ({ label, value, sub, icon: Icon, color, link, linkLabel, change }) => (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
          <Icon size={19} style={{ color }} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        {change !== undefined && change !== null ? (
          <span className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(change).toFixed(1)}% vs yesterday
          </span>
        ) : (
          <span className="text-xs text-slate-400">{sub || ''}</span>
        )}
        {link && (
          <Link to={link} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
            {linkLabel} <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 animate-fade-up">

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Today's Revenue"
          value={`₹${fmt(todayRevenue)}`}
          icon={IndianRupee}
          color="#2563eb"
          change={revenueChange}
          link="/sales"
          linkLabel="View Sales"
        />
        <KPICard
          label="Total Transactions"
          value={`${sales.length}`}
          sub="All-time checkouts"
          icon={ShoppingBag}
          color="#8b5cf6"
          link="/sales"
          linkLabel="View All"
        />
        <KPICard
          label="Low Stock Alerts"
          value={`${lowStockItems.length}`}
          sub={`Items under ${LOW} units`}
          icon={AlertTriangle}
          color={lowStockItems.length > 0 ? '#ef4444' : '#10b981'}
          link="/inventory"
          linkLabel="Fix Now"
        />
        <KPICard
          label="Inventory Value"
          value={`₹${fmt(totalInventoryValue)}`}
          sub={`${products.length} unique SKUs`}
          icon={Package}
          color="#10b981"
          link="/inventory"
          linkLabel="Manage"
        />
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-600" /> Weekly Revenue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <TrendingUp size={12} /> Live data
            </span>
          </div>

          {dailyTotals.every(v => v === 0) ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No sales data yet — make a sale in POS Billing!
            </div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {dailyTotals.map((val, i) => {
                const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const date = new Date(last7[i]);
                const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                const isToday = last7[i] === today;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    {val > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{val.toFixed(0)}
                      </span>
                    )}
                    <div className="w-full rounded-t-lg transition-all duration-500 relative" style={{
                      height: `${Math.max(pct, 3)}%`,
                      background: isToday
                        ? 'linear-gradient(to top,#1d4ed8,#3b82f6)'
                        : 'linear-gradient(to top,#dbeafe,#93c5fd)',
                      minHeight: 4
                    }} />
                    <span className={`text-[9px] font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-xs text-center">
              No orders yet.<br />Process a sale to see rankings.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: '#eff6ff', color: '#2563eb' }}
                  >
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                    <div className="h-1 rounded-full bg-slate-100 mt-1.5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(p.qty / topProducts[0].qty) * 100}%`, background: '#2563eb' }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0">{p.qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales + Low Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Recent Sales */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Recent Transactions</h3>
            <Link to="/sales" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              All Bills <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {sales.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No sales recorded yet.</div>
            ) : (
              sales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{sale.customer_name || 'Walk-in Customer'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(sale.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ·{' '}
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      <span className="font-semibold text-slate-500">{sale.payment_method}</span>
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{Number(sale.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Stock Alerts</h3>
            <Link to="/inventory" className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-0.5">
              Reorder <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {lowStockItems.length === 0 ? (
              <div className="py-12 text-center">
                <Package size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-xs text-emerald-600 font-semibold">All products well stocked!</p>
              </div>
            ) : (
              lowStockItems.slice(0, 5).map(prod => (
                <div key={prod.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{prod.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{prod.category} · SKU: {prod.barcode}</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{
                      background: prod.stock === 0 ? '#fef2f2' : '#fffbeb',
                      color: prod.stock === 0 ? '#ef4444' : '#d97706'
                    }}
                  >
                    {prod.stock === 0 ? 'Out of stock' : `${prod.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
