import { useState, useMemo } from 'react';
import { Search, Eye, Printer, X, Loader2, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function SalesHistory({ sales = [], isUsingMock }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  
  // Sort State
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Receipt Modal State
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Fetch individual sale items (joined with product details)
  const handleViewReceipt = async (sale) => {
    setSelectedSale(sale);
    setShowInvoice(true);
    setLoadingItems(true);
    setSaleItems([]);

    if (isUsingMock) {
      // Offline mode uses embedded items array
      setSaleItems(sale.items || []);
      setLoadingItems(false);
      return;
    }

    try {
      // Online mode: Query Supabase sale_items with a relation join to products
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          price,
          products (
            name,
            barcode
          )
        `)
        .eq('sale_id', sale.id);

      if (error) throw error;

      // Map join results to match consistent format
      const formattedItems = data.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        name: item.products ? item.products.name : 'Unknown Product',
        barcode: item.products ? item.products.barcode : 'N/A'
      }));

      setSaleItems(formattedItems);
    } catch (err) {
      console.error('Error fetching sale items:', err.message);
      toast.error('Failed to load transaction products. Using local inventory cross-reference.');
      
      // Fallback: Try manual matching with loaded products if details missing
      if (sale.items) {
        setSaleItems(sale.items);
      } else {
        setSaleItems([]);
      }
    } finally {
      setLoadingItems(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter Sales list
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesPayment = paymentFilter === 'All' || s.payment_method === paymentFilter;
      
      const query = searchQuery.toLowerCase().trim();
      const customerName = (s.customer_name || '').toLowerCase();
      const customerPhone = (s.customer_phone || '').toLowerCase();
      const invoiceId = s.id.toLowerCase();
      
      const matchesSearch = !query ||
        customerName.includes(query) ||
        customerPhone.includes(query) ||
        invoiceId.includes(query);

      return matchesPayment && matchesSearch;
    }).sort((a, b) => {
      let multiplier = sortOrder === 'asc' ? 1 : -1;
      
      if (sortField === 'created_at') {
        return (new Date(a.created_at) - new Date(b.created_at)) * multiplier;
      }
      if (sortField === 'total_amount') {
        return (Number(a.total_amount) - Number(b.total_amount)) * multiplier;
      }
      if (sortField === 'customer_name') {
        const nameA = a.customer_name || 'Walk-in';
        const nameB = b.customer_name || 'Walk-in';
        return nameA.localeCompare(nameB) * multiplier;
      }
      return 0;
    });
  }, [sales, searchQuery, paymentFilter, sortField, sortOrder]);

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales History & Logs</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Verify past transaction history, reprint customer receipts, and analyze payment statistics.</p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm justify-between items-center">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone or Invoice ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Payment filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>
      </div>

      {/* Transactions list table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                <th className="py-4 px-6" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Date & Time <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-4 px-6">Invoice ID</th>
                <th className="py-4 px-6" onClick={() => handleSort('customer_name')}>
                  <div className="flex items-center gap-1">
                    Customer Details <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-4 px-6">Payment Mode</th>
                <th className="py-4 px-6 text-right">Tax & Saved</th>
                <th className="py-4 px-6 text-right" onClick={() => handleSort('total_amount')}>
                  <div className="flex items-center justify-end gap-1">
                    Grand Total <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400 font-semibold">
                    No transactions found in system logs.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="py-4 px-6 font-medium text-slate-500">
                      {new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400 text-[11px]">
                      AMM-{sale.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-800 font-bold">{sale.customer_name || 'Walk-in Customer'}</div>
                      {sale.customer_phone && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{sale.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-bold border uppercase tracking-wider ${
                        sale.payment_method === 'UPI' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                        sale.payment_method === 'Card' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                        'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-y-0.5">
                      <div className="text-slate-400 text-[10px]">Tax: ₹{Number(sale.tax_amount || 0).toFixed(2)}</div>
                      {Number(sale.discount_amount) > 0 && (
                        <div className="text-amber-600 text-[9px] font-bold">Saved: ₹{Number(sale.discount_amount).toFixed(2)}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-900 text-sm">
                      ₹{Number(sale.total_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleViewReceipt(sale)}
                        className="p-1.5 bg-white border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Bill Invoice popup Modal */}
      {showInvoice && selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-fade-in flex flex-col">
            
            {/* Modal Header Actions */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">
                Tax Invoice Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Print Invoice"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Receipt Area for Thermal Printer rendering */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loadingItems ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-bold text-xs">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                  <span>Loading sale items...</span>
                </div>
              ) : (
                <div id="receipt-print-area" className="font-mono text-[11px] text-slate-800 leading-relaxed max-w-[280px] mx-auto bg-slate-50/40 p-4 border border-dashed border-slate-200 rounded-lg">
                  <div className="text-center space-y-1 mb-4">
                    <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">AMIT MEGA MART</h2>
                    <p className="text-[9px] text-slate-500">Retail & POS Billing counter</p>
                    <p className="text-[9px] text-slate-400">Sector-15, Noida, UP (Pin: 201301)</p>
                    <p className="text-[9px] text-slate-400">Ph: +91 98765 43210</p>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-200 py-2.5 my-3.5 space-y-1 text-slate-500">
                    <p><span className="font-bold text-slate-700">Invoice ID:</span> AMM-{selectedSale.id.slice(0, 8).toUpperCase()}</p>
                    <p><span className="font-bold text-slate-700">Date:</span> {new Date(selectedSale.created_at).toLocaleDateString()} {new Date(selectedSale.created_at).toLocaleTimeString()}</p>
                    <p><span className="font-bold text-slate-700">Cashier:</span> Terminal A (Digital)</p>
                    <p><span className="font-bold text-slate-700">Customer:</span> {selectedSale.customer_name || 'Walk-in Customer'}</p>
                    {selectedSale.customer_phone && (
                      <p><span className="font-bold text-slate-700">Phone:</span> {selectedSale.customer_phone}</p>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-extrabold text-slate-900 border-b border-slate-100 pb-1">
                      <span>ITEM (QTY x RATE)</span>
                      <span>AMOUNT</span>
                    </div>
                    {saleItems.length === 0 ? (
                      <div className="text-slate-400 text-center py-2 text-[10px]">No item details logged for this sale.</div>
                    ) : (
                      saleItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-1">
                          <div className="truncate max-w-[180px]">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                          </div>
                          <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Calculations breakdown summary */}
                  <div className="border-t border-dashed border-slate-200 mt-4 pt-3.5 space-y-1 text-right text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{(Number(selectedSale.total_amount) + Number(selectedSale.discount_amount || 0) - Number(selectedSale.tax_amount || 0)).toFixed(2)}</span>
                    </div>
                    {Number(selectedSale.discount_amount) > 0 && (
                      <div className="flex justify-between text-amber-600 font-bold">
                        <span>Discount Saved:</span>
                        <span>-₹{Number(selectedSale.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax (5% GST):</span>
                      <span>₹{Number(selectedSale.tax_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-100 mt-1">
                      <span>Grand Total:</span>
                      <span>₹{Number(selectedSale.total_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-200 mt-5 pt-4 text-center space-y-2 text-slate-400 text-[9px] font-bold">
                    <p>Paid via: {selectedSale.payment_method.toUpperCase()}</p>
                    <p className="uppercase tracking-wider text-slate-500">*** Tax Invoice copy ***</p>
                    <p>Powered by Amit Mega Mart</p>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowInvoice(false)}
                className="w-full py-2 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
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
