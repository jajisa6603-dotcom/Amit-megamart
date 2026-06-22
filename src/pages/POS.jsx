import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Trash2, CreditCard, Receipt, Loader2,
  Plus, Minus, X, Printer, CheckCircle, Barcode
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function POS({ products = [], onCheckout }) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, [showReceipt]);

  const categories = React.useMemo(() => {
    const s = new Set(products.map(p => p.category || 'Groceries'));
    return ['All', ...s];
  }, [products]);

  const filteredProducts = React.useMemo(() =>
    products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      return matchCat && (!q || p.name.toLowerCase().includes(q) || p.barcode.includes(q));
    }), [products, selectedCategory, searchQuery]);

  const addToCart = (product) => {
    if (product.stock <= 0) return toast.error(`${product.name} is out of stock!`);
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stock) { toast.error('Stock limit reached.'); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      toast.success(`Added ${product.name}`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleScan = e => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const p = products.find(p => p.barcode === barcodeInput.trim());
    if (p) addToCart(p); else toast.error('Product not found!');
    setBarcodeInput('');
    inputRef.current?.focus();
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nq = item.quantity + delta;
      const orig = products.find(p => p.id === id);
      if (nq > (orig?.stock || 0)) { toast.error('Exceeds stock!'); return item; }
      if (nq <= 0) { toast.success(`Removed ${item.name}`); return null; }
      return { ...item, quantity: nq };
    }).filter(Boolean));
  };

  const removeFromCart = id => { setCart(p => p.filter(i => i.id !== id)); };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = React.useMemo(() => {
    const v = Number(discountValue) || 0;
    return discountType === 'percent' ? (subtotal * v) / 100 : v;
  }, [subtotal, discountType, discountValue]);
  const tax = (subtotal - discountAmount) * 0.05;
  const total = Math.max(0, subtotal - discountAmount + tax);

  const handleCheckout = async () => {
    if (!cart.length) return;
    setIsCheckingOut(true);
    const saleDetails = {
      id: 'temp-' + Math.floor(100000 + Math.random() * 900000),
      cart, subtotal, discountAmount, taxAmount: tax, total,
      paymentMethod, customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || null,
      created_at: new Date().toISOString()
    };
    const ok = await onCheckout(saleDetails);
    setIsCheckingOut(false);
    if (ok) {
      setCompletedSale(saleDetails);
      setShowReceipt(true);
      setCart([]); setCustomerName(''); setCustomerPhone('');
      setDiscountValue(0); setPaymentMethod('Cash');
    }
  };

  const PAY_METHODS = ['Cash', 'UPI', 'Card'];

  return (
    <div className="flex-1 flex gap-3 min-h-0 overflow-hidden animate-fade-up">

      {/* ── LEFT: Product Catalogue ── */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        {/* Search + Categories */}
        <div className="p-3 border-b border-slate-100 space-y-2.5 shrink-0" style={{ background: '#f8fafc' }}>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
                style={{
                  background: selectedCategory === cat ? '#2563eb' : '#f1f5f9',
                  color: selectedCategory === cat ? '#fff' : '#64748b'
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
              {filteredProducts.map(prod => (
                <button key={prod.id} onClick={() => addToCart(prod)} disabled={prod.stock === 0}
                  className="text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group"
                  style={{
                    background: '#fff',
                    borderColor: prod.stock === 0 ? '#f1f5f9' : '#e2e8f0',
                    opacity: prod.stock === 0 ? 0.5 : 1
                  }}
                  onMouseEnter={e => { if (prod.stock > 0) e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = prod.stock === 0 ? '#f1f5f9' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {prod.stock <= 5 && prod.stock > 0 && (
                    <span className="absolute top-0 right-0 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg"
                      style={{ background: '#f59e0b', color: '#fff' }}>LOW</span>
                  )}
                  {prod.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                      style={{ background: 'rgba(248,250,252,0.85)' }}>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#ef4444', color: '#fff' }}>Out of Stock</span>
                    </div>
                  )}
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{prod.category}</p>
                  <p className="font-semibold text-slate-800 text-xs leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">{prod.name}</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-50">
                    <p className="font-black text-sm text-slate-900">₹{prod.price.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{prod.stock} in stock</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER: Cart ── */}
      <div className="flex-[1.2] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        {/* Barcode Scanner Input */}
        <div className="p-3 border-b border-slate-100 shrink-0" style={{ background: '#f8fafc' }}>
          <form onSubmit={handleScan} className="relative">
            <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input ref={inputRef} type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Scan barcode or type & press Enter..."
              disabled={isCheckingOut} />
          </form>
        </div>

        {/* Cart Header */}
        <div className="px-4 py-2.5 border-b border-slate-100 shrink-0 flex items-center justify-between" style={{ background: '#f8fafc' }}>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
          </span>
          {cart.length > 0 && (
            <button onClick={() => { setCart([]); toast.success('Cart cleared'); }}
              className="text-xs text-red-400 hover:text-red-600 font-semibold cursor-pointer transition-colors">
              Clear all
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
              <Receipt size={44} />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400">Cart is empty</p>
                <p className="text-xs text-slate-300 mt-0.5">Tap products or scan barcodes</p>
              </div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors shadow-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                  style={{ background: '#eff6ff', color: '#2563eb' }}>
                  {item.quantity}x
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-xs truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">₹{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, -1)} disabled={isCheckingOut}
                      className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer">
                      <Minus size={12} />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-800 border-x border-slate-200">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} disabled={isCheckingOut}
                      className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer">
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="font-bold text-sm text-slate-900 w-16 text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button onClick={() => removeFromCart(item.id)} disabled={isCheckingOut}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT: Checkout Panel ── */}
      <div className="w-64 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 shrink-0" style={{ background: '#f8fafc' }}>
          <h3 className="font-bold text-slate-900 text-sm">Checkout</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              disabled={isCheckingOut} />
            <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              disabled={isCheckingOut} />
          </div>

          {/* Discount */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 mt-1.5 mb-2">
              {['percent', 'flat'].map(t => (
                <button key={t} type="button" onClick={() => setDiscountType(t)} disabled={isCheckingOut}
                  className="flex-1 py-1.5 text-xs font-bold cursor-pointer transition-colors"
                  style={{ background: discountType === t ? '#eff6ff' : '#f8fafc', color: discountType === t ? '#2563eb' : '#94a3b8' }}>
                  {t === 'percent' ? '% Percent' : '₹ Flat'}
                </button>
              ))}
            </div>
            <input type="number" min="0" value={discountValue}
              onChange={e => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              disabled={isCheckingOut} />
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {PAY_METHODS.map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)} disabled={isCheckingOut}
                  className="py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer"
                  style={{
                    background: paymentMethod === m ? '#2563eb' : '#f8fafc',
                    borderColor: paymentMethod === m ? '#2563eb' : '#e2e8f0',
                    color: paymentMethod === m ? '#fff' : '#64748b'
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            {[
              { label: 'Subtotal', value: subtotal, color: '#475569' },
              { label: 'Discount', value: -discountAmount, color: '#d97706' },
              { label: 'GST (5%)', value: tax, color: '#475569' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-xs font-medium" style={{ color }}>
                <span>{label}</span>
                <span className="font-bold">{value < 0 ? '-' : ''}₹{Math.abs(value).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-slate-200 items-baseline">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-lg font-black text-slate-900">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Charge Button */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: cart.length === 0 ? '#e2e8f0' : 'linear-gradient(135deg,#2563eb,#4f46e5)',
              color: cart.length === 0 ? '#94a3b8' : '#fff',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
            }}>
            {isCheckingOut ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
            {isCheckingOut ? 'Processing...' : `Charge ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* ── Receipt Modal ── */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="flex min-h-full items-start justify-center p-4 pt-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-scale-in"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                    <CheckCircle size={16} style={{ color: '#16a34a' }} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Sale Complete</p>
                    <p className="text-[10px] text-slate-400">AMM-{completedSale.id?.slice(0,8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    style={{ background: '#f1f5f9', color: '#475569' }}>
                    <Printer size={12} /> Print
                  </button>
                  <button onClick={() => setShowReceipt(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Receipt */}
              <div className="overflow-y-auto p-5" style={{ maxHeight: '60vh' }}>
                <div id="receipt-print-area" className="font-mono text-[11px] leading-relaxed text-slate-800 max-w-[280px] mx-auto">
                  <div className="text-center mb-4">
                    <h2 className="font-black text-sm uppercase tracking-widest">AMIT MEGA MART</h2>
                    <p className="text-[9px] text-slate-500 mt-0.5">Retail & POS Billing Counter</p>
                    <p className="text-[9px] text-slate-400">Sector-15, Noida, UP — 201301</p>
                    <p className="text-[9px] text-slate-400">GSTIN: 09ABCDE1234F1Z5</p>
                    <div className="border-t border-dashed border-slate-200 my-2.5" />
                  </div>
                  <div className="space-y-0.5 mb-3 text-slate-600">
                    {[
                      ['Invoice', `AMM-${completedSale.id?.slice(0,8).toUpperCase()}`],
                      ['Date', `${new Date(completedSale.created_at).toLocaleDateString('en-IN')} ${new Date(completedSale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`],
                      ['Customer', completedSale.customerName],
                      ...(completedSale.customerPhone ? [['Phone', completedSale.customerPhone]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="font-bold text-slate-700">{k}:</span>
                        <span className="text-right truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-2.5 mb-2.5">
                    <div className="flex justify-between font-bold text-slate-900 mb-2 text-[10px] uppercase">
                      <span>Item</span><span>Amt</span>
                    </div>
                    {completedSale.cart.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 leading-tight">{item.name}</p>
                          <p className="text-[9px] text-slate-400">{item.quantity} × ₹{item.price.toFixed(2)}</p>
                        </div>
                        <span className="font-bold shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-1">
                    <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{completedSale.subtotal.toFixed(2)}</span></div>
                    {completedSale.discountAmount > 0 && (
                      <div className="flex justify-between font-semibold" style={{ color: '#d97706' }}>
                        <span>Discount</span><span>−₹{completedSale.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500"><span>GST 5%</span><span>₹{completedSale.taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                      <span>TOTAL</span><span>₹{completedSale.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-0.5">
                      <span>Paid via</span><span className="font-bold">{completedSale.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-slate-200 mt-3 pt-3 text-center">
                    <p className="font-bold text-slate-500 text-[9px] uppercase tracking-widest">★ Thank You ★</p>
                    <p className="text-slate-400 text-[9px] mt-0.5">amit-megamart.vercel.app</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 shrink-0" style={{ background: '#f8fafc' }}>
                <button onClick={() => setShowReceipt(false)}
                  className="w-full py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer transition-all"
                  style={{ background: '#0f172a' }}>
                  Close & New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
