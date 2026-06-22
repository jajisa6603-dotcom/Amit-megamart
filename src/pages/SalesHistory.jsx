import { useState, useMemo } from 'react';
import {
  Search, Eye, Printer, X, Loader2, ArrowUpDown,
  History, IndianRupee, ShoppingBag, CreditCard, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function SalesHistory({ sales = [], isUsingMock }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  // ── Stats ─────────────────────────────────────────────────
  const totalRevenue = sales.reduce((s, x) => s + Number(x.total_amount || 0), 0);
  const totalTax = sales.reduce((s, x) => s + Number(x.tax_amount || 0), 0);
  const totalSaved = sales.reduce((s, x) => s + Number(x.discount_amount || 0), 0);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const handleViewReceipt = async (sale) => {
    setSelectedSale(sale);
    setShowInvoice(true);
    setLoadingItems(true);
    setSaleItems([]);

    if (isUsingMock) {
      setSaleItems(sale.items || []);
      setLoadingItems(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`id, quantity, price, products ( name, barcode )`)
        .eq('sale_id', sale.id);

      if (error) throw error;

      setSaleItems(data.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        name: item.products?.name || 'Unknown Product',
        barcode: item.products?.barcode || 'N/A'
      })));
    } catch (err) {
      console.error('Error fetching sale items:', err.message);
      toast.error('Could not load transaction items.');
      setSaleItems(sale.items || []);
    } finally {
      setLoadingItems(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales
      .filter(s => {
        const matchPay = paymentFilter === 'All' || s.payment_method === paymentFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchSearch = !q ||
          (s.customer_name || '').toLowerCase().includes(q) ||
          (s.customer_phone || '').toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q);
        return matchPay && matchSearch;
      })
      .sort((a, b) => {
        const m = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'created_at') return (new Date(a.created_at) - new Date(b.created_at)) * m;
        if (sortField === 'total_amount') return (Number(a.total_amount) - Number(b.total_amount)) * m;
        if (sortField === 'customer_name') {
          return ((a.customer_name || 'Walk-in').localeCompare(b.customer_name || 'Walk-in')) * m;
        }
        return 0;
      });
  }, [sales, searchQuery, paymentFilter, sortField, sortOrder]);

  const payBadge = (method) => {
    if (method === 'UPI')  return 'bg-violet-50 text-violet-700 border-violet-200';
    if (method === 'Card') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const SortTh = ({ label, field, right }) => (
    <th
      onClick={() => handleSort(field)}
      className={`py-3.5 px-5 font-semibold text-[11px] uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-slate-700 transition-colors whitespace-nowrap ${right ? 'text-right' : ''}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className={sortField === field ? 'text-blue-500' : 'text-slate-300'} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6 animate-fade-up pb-8">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History size={22} className="text-blue-600" />
            Sales History
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">All checkout transactions and invoice records.</p>
        </div>
        {/* Summary pills */}
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-700 shadow-sm">
            <ShoppingBag size={12} className="text-blue-500" />
            {sales.length} total bills
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-700 shadow-sm">
            <IndianRupee size={12} className="text-emerald-500" />
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} revenue
          </span>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone or Invoice ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Payment:</span>
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <SortTh label="Date & Time"    field="created_at"    />
                <th className="py-3.5 px-5 font-semibold text-[11px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Invoice ID</th>
                <SortTh label="Customer"       field="customer_name" />
                <th className="py-3.5 px-5 font-semibold text-[11px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Payment</th>
                <th className="py-3.5 px-5 font-semibold text-[11px] uppercase tracking-widest text-slate-400 text-right whitespace-nowrap">Tax / Discount</th>
                <SortTh label="Grand Total"    field="total_amount"  right />
                <th className="py-3.5 px-5 font-semibold text-[11px] uppercase tracking-widest text-slate-400 text-right whitespace-nowrap">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400 text-sm font-medium">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-5 text-sm text-slate-500 font-medium whitespace-nowrap">
                      {new Date(sale.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="block text-xs text-slate-400">
                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-400 whitespace-nowrap">
                      AMM-{sale.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-sm text-slate-800">{sale.customer_name || 'Walk-in Customer'}</div>
                      {sale.customer_phone && (
                        <div className="text-xs text-slate-400 mt-0.5">{sale.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${payBadge(sale.payment_method)}`}>
                        <CreditCard size={10} />
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="text-xs text-slate-400">GST: ₹{Number(sale.tax_amount || 0).toFixed(2)}</div>
                      {Number(sale.discount_amount) > 0 && (
                        <div className="text-xs font-semibold text-amber-600 mt-0.5">
                          Saved: ₹{Number(sale.discount_amount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="font-bold text-base text-slate-900">
                        ₹{Number(sale.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleViewReceipt(sale)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 hover:border-blue-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredSales.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-50/50">
            <span>{filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''}</span>
            <span>
              Total: <span className="font-bold text-slate-700">
                ₹{filteredSales.reduce((s, x) => s + Number(x.total_amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Invoice Modal ────────────────────────────────── */}
      {showInvoice && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowInvoice(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

          {/* Modal Card */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] flex flex-col overflow-hidden animate-scale-in"
            style={{ maxHeight: 'calc(100vh - 48px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Eye size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Tax Invoice</p>
                  <p className="text-[10px] text-slate-400 font-medium">AMM-{selectedSale.id.slice(0,8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  title="Print Receipt"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer size={13} />
                  Print
                </button>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Receipt Content (scrollable) */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingItems ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={26} />
                  <p className="text-sm font-medium">Loading items...</p>
                </div>
              ) : (
                <div id="receipt-print-area" className="font-mono text-[11px] leading-relaxed text-slate-800 max-w-[300px] mx-auto">
                  {/* Store Header */}
                  <div className="text-center mb-5 space-y-0.5">
                    <h2 className="font-black text-base uppercase tracking-widest text-slate-900">AMIT MEGA MART</h2>
                    <p className="text-[9px] text-slate-500">Retail & POS Billing Counter</p>
                    <p className="text-[9px] text-slate-400">Sector-15, Noida, UP — 201301</p>
                    <p className="text-[9px] text-slate-400">Ph: +91 98765 43210 | GSTIN: 09ABCDE1234F1Z5</p>
                    <div className="border-t border-dashed border-slate-200 my-2" />
                  </div>

                  {/* Invoice Meta */}
                  <div className="space-y-1 mb-4 text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-700">Invoice:</span>
                      <span>AMM-{selectedSale.id.slice(0,8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-700">Date:</span>
                      <span>{new Date(selectedSale.created_at).toLocaleDateString('en-IN')} {new Date(selectedSale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-700">Cashier:</span>
                      <span>Terminal A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-700">Customer:</span>
                      <span>{selectedSale.customer_name || 'Walk-in Customer'}</span>
                    </div>
                    {selectedSale.customer_phone && (
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-700">Phone:</span>
                        <span>{selectedSale.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="border-t border-dashed border-slate-200 pt-3 mb-3">
                    <div className="flex justify-between font-black text-slate-900 mb-2 text-[10px] uppercase tracking-wider">
                      <span>Item</span>
                      <span>Amount</span>
                    </div>
                    {saleItems.length === 0 ? (
                      <p className="text-center text-slate-400 py-2 text-[10px]">No item details available.</p>
                    ) : (
                      saleItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 leading-tight">{item.name}</p>
                            <p className="text-[9px] text-slate-400">{item.quantity} × ₹{item.price.toFixed(2)}</p>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>₹{(Number(selectedSale.total_amount) + Number(selectedSale.discount_amount||0) - Number(selectedSale.tax_amount||0)).toFixed(2)}</span>
                    </div>
                    {Number(selectedSale.discount_amount) > 0 && (
                      <div className="flex justify-between font-semibold text-amber-600">
                        <span>Discount</span>
                        <span>−₹{Number(selectedSale.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>GST (5%)</span>
                      <span>₹{Number(selectedSale.tax_amount||0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                      <span>GRAND TOTAL</span>
                      <span>₹{Number(selectedSale.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1">
                      <span>Payment</span>
                      <span className="font-bold">{selectedSale.payment_method}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-dashed border-slate-200 mt-4 pt-3 text-center space-y-1">
                    <p className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">★ Thank You For Shopping ★</p>
                    <p className="text-slate-400 text-[9px]">Visit us again soon! • amit-megamart.vercel.app</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Modal Footer */}
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowInvoice(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
