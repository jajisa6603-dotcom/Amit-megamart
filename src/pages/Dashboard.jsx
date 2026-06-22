import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, AlertTriangle, IndianRupee, ArrowRight, Package, ChevronRight } from 'lucide-react';

export default function Dashboard({ products = [], sales = [] }) {
  // 1. Calculate Key Metrics
  const lowStockThreshold = 10;
  
  // Total Inventory Value
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  
  // Low Stock Count
  const lowStockItems = products.filter(p => p.stock <= lowStockThreshold);
  
  // Today's Sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => {
    const saleDate = new Date(s.created_at).toISOString().split('T')[0];
    return saleDate === today;
  });
  
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const todayCount = todaySales.length;

  // 2. Prepare SVG Sales Trend Data (Last 7 Days)
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const last7Days = getLast7Days();
  const dailyTotals = last7Days.map(dateStr => {
    const daySales = sales.filter(s => {
      const saleDate = new Date(s.created_at).toISOString().split('T')[0];
      return saleDate === dateStr;
    });
    return daySales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  });

  // Calculate coordinates for SVG Path
  const maxSale = Math.max(...dailyTotals, 1000); // Minimum max of 1000 for height scaling
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 20;

  const points = dailyTotals.map((amount, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / 6;
    // Invert Y coordinate since SVG (0,0) is top-left
    const y = chartHeight - padding - (amount / maxSale) * (chartHeight - padding * 2);
    return { x, y, amount, date: last7Days[idx] };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // For filling gradient under the line
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  // Get Top Products (mocked ranking from actual sales data or just high value sales)
  // Let's count actual top sold items from sales history
  const topProducts = React.useMemo(() => {
    const countMap = {};
    sales.forEach(sale => {
      // If sale_items details exist in the sale record
      if (sale.items) {
        sale.items.forEach(item => {
          const name = item.product_name || item.name || 'Unknown Product';
          countMap[name] = (countMap[name] || 0) + item.quantity;
        });
      }
    });
    
    // Sort and get top 4
    return Object.entries(countMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);
  }, [sales]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Amit Mega Mart Operations Portal</p>
        </div>
        <div className="text-slate-500 text-xs font-semibold bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
          Updated: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 flex flex-col justify-between group hover:shadow-md hover:border-slate-200/50 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Today's Revenue</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">₹{todayRevenue.toFixed(2)}</h2>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{todayCount} Transactions</span>
            <span className="text-emerald-600 font-bold">Live Synced</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 flex flex-col justify-between group hover:shadow-md hover:border-slate-200/50 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sales Logs</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{sales.length} Bills</h2>
            </div>
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>All-time checkouts</span>
            <Link to="/sales" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 font-bold hover:underline">
              View Log <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 flex flex-col justify-between group hover:shadow-md hover:border-slate-200/50 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Critical Alerts</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'}
              </h2>
            </div>
            <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 ${lowStockItems.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Stock under {lowStockThreshold} units</span>
            {lowStockItems.length > 0 ? (
              <Link to="/inventory" className="text-red-600 hover:text-red-700 font-bold flex items-center gap-0.5 hover:underline">
                Reorder Now <ArrowRight size={12} />
              </Link>
            ) : (
              <span className="text-emerald-600 font-bold">Stock Healthy</span>
            )}
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 flex flex-col justify-between group hover:shadow-md hover:border-slate-200/50 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Inventory Value</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">₹{totalInventoryValue.toLocaleString()}</h2>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{products.length} Unique Products</span>
            <Link to="/inventory" className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 hover:underline">
              Inventory <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph + Side Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Weekly Revenue Trend</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Rolling 7-day revenue visualization</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/30">
              <TrendingUp size={14} />
              <span>Positive growth</span>
            </div>
          </div>

          {/* SVG line chart */}
          <div className="relative w-full h-44 flex items-center justify-center">
            {dailyTotals.every(val => val === 0) ? (
              <div className="text-slate-400 text-xs font-medium py-10">No recent sales records to chart. Make checkout transactions in POS Billing!</div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#f1f5f9" strokeWidth="1" />

                {/* Filled Gradient Area */}
                {areaD && <path d={areaD} fill="url(#chart-grad)" />}

                {/* Line Path */}
                {pathD && <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />}

                {/* Chart Dots & Values */}
                {points.map((p, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" className="transition-all duration-200 hover:r-6 hover:fill-blue-600" />
                    <text x={p.x} y={chartHeight - 4} textAnchor="middle" className="text-[7px] font-bold fill-slate-400">
                      {new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </text>
                    <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[7px] font-extrabold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      ₹{p.amount.toFixed(0)}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Top Products Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Top Selling Products</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Best-moving inventory items</p>
          </div>

          <div className="space-y-3.5">
            {topProducts.length === 0 ? (
              <div className="text-slate-400 text-xs text-center py-12 font-medium">
                No orders processed yet.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-xs truncate max-w-[150px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900">{p.quantity} units</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sold</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock and Recent Sales Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Operations Log */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Sales</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Most recent checkout transactions</p>
            </div>
            <Link to="/sales" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 hover:underline">
              All Bills <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-6 pt-0 divide-y divide-slate-50 overflow-y-auto max-h-72">
            {sales.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-16 font-medium">No sales recorded yet.</div>
            ) : (
              sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {sale.customer_name || 'Walk-in Customer'}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        sale.payment_method === 'UPI' ? 'bg-indigo-50 text-indigo-600' :
                        sale.payment_method === 'Card' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {sale.payment_method}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Invoice: #{sale.id.slice(0, 8)} • {new Date(sale.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">₹{Number(sale.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Low Stock Alerts</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Products requiring immediate replenishment</p>
            </div>
            <Link to="/inventory" className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-0.5 hover:underline">
              Inventory <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-6 pt-0 divide-y divide-slate-50 overflow-y-auto max-h-72">
            {lowStockItems.length === 0 ? (
              <div className="text-center text-emerald-600 text-xs py-16 font-bold flex flex-col items-center gap-2">
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-500">
                  <Package size={24} />
                </div>
                <span>Excellent! All products are well stocked.</span>
              </div>
            ) : (
              lowStockItems.map((prod) => (
                <div key={prod.id} className="flex justify-between items-center py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">{prod.name}</span>
                    <p className="text-[10px] text-slate-400 font-medium">
                      SKU: {prod.barcode} • Category: {prod.category}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2.5">
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${prod.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {prod.stock === 0 ? 'Out of stock' : `${prod.stock} left`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
