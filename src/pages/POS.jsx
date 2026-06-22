import React, { useState, useRef, useEffect } from 'react';
import { Search, Trash2, CreditCard, Receipt, Loader2, Plus, Minus, X, Printer, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function POS({ products = [], onCheckout }) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Customer & Billing State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'flat'
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const inputRef = useRef(null);

  // Auto-focus input for barcode scanner
  useEffect(() => {
    inputRef.current?.focus();
  }, [showReceipt]);

  // NOTE: Auto-print removed — cashier manually clicks Print on the receipt modal.

  // Extract unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Groceries'));
    return ['All', ...cats];
  }, [products]);

  // Filter products for the visual grid
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        p.name.toLowerCase().includes(query) || 
        p.barcode.includes(query) ||
        (p.category && p.category.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add product to cart helper
  const addProductToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Cannot add more ${product.name}. Stock limit reached.`);
          return prev;
        }
        toast.success(`Incremented ${product.name} quantity`);
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      toast.success(`Added ${product.name} to cart`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleScan = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = products.find(p => p.barcode === barcodeInput.trim());
    if (product) {
      addProductToCart(product);
    } else {
      toast.error('Product not found with scanned barcode!');
    }
    setBarcodeInput('');
    inputRef.current?.focus();
  };

  const updateQuantity = (id, amount) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + amount;
          // Find original product to check stock
          const original = products.find(p => p.id === id);
          if (newQty > original.stock) {
            toast.error(`Cannot exceed stock level of ${original.stock} units.`);
            return item;
          }
          if (newQty <= 0) {
            toast.success(`Removed ${item.name} from cart`);
            return null; // Will filter out below
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.success('Removed product from cart');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = React.useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === 'percent') {
      return (subtotal * val) / 100;
    }
    return val;
  }, [subtotal, discountType, discountValue]);

  const tax = (subtotal - discountAmount) * 0.05; // 5% GST
  const total = Math.max(0, subtotal - discountAmount + tax);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    const saleDetails = {
      id: 'temp-' + Math.floor(100000 + Math.random() * 900000),
      cart,
      subtotal,
      discountAmount,
      taxAmount: tax,
      total,
      paymentMethod,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || null,
      created_at: new Date().toISOString()
    };

    const success = await onCheckout(saleDetails);
    setIsCheckingOut(false);
    
    if (success) {
      setCompletedSale(saleDetails);
      setShowReceipt(true);
      
      // Clear Cart and Inputs
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountValue(0);
      setPaymentMethod('Cash');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex gap-4 relative animate-fade-in min-h-0 overflow-hidden">
      
      {/* Left Pane - Visual Catalog & Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-w-0">
        {/* Search header */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/20 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-800"
            />
          </div>
          
          {/* Categories Horizontal Scroller */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10 font-semibold">
              No products found matching filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(prod => (
                <button
                  key={prod.id}
                  onClick={() => addProductToCart(prod)}
                  className="bg-white p-3.5 rounded-xl border border-slate-100/60 shadow-sm text-left flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                >
                  {prod.stock <= 5 && prod.stock > 0 && (
                    <span className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                      Low stock
                    </span>
                  )}
                  {prod.stock === 0 && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[0.5px] z-1 flex items-center justify-center">
                      <span className="bg-red-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        Out of stock
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      {prod.category}
                    </span>
                    <h4 className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {prod.name}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-50 flex flex-col gap-0.5 text-left shrink-0">
                    <span className="font-extrabold text-sm text-slate-900">₹{prod.price.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Stock: {prod.stock} units</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Pane - Barcode Scan & Cart */}
      <div className="flex-[1.3] flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-w-0">
        {/* Scanner Barcode Input */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/20">
          <form onSubmit={handleScan} className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold text-slate-700 placeholder-slate-400 transition-all text-sm"
              placeholder="Barcode scanner focus area (or type & press Enter)..."
              disabled={isCheckingOut}
            />
          </form>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
              <Receipt size={40} className="text-slate-300" />
              <p className="text-sm font-semibold">Your billing cart is empty.</p>
              <p className="text-xs text-slate-400">Scan barcodes or tap products from the catalog grid.</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 bg-white border border-slate-100 shadow-sm rounded-xl hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-600 font-extrabold text-xs">
                    {item.quantity}x
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs line-clamp-1">{item.name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold">₹{item.price.toFixed(2)} each</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  {/* Quantity adjustments */}
                  <div className="flex items-center border border-slate-100 rounded-lg overflow-hidden bg-slate-50/30">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                      disabled={isCheckingOut}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                      disabled={isCheckingOut}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="font-extrabold text-sm text-slate-900 min-w-[70px] text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    disabled={isCheckingOut}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane - Checkout Summary Sheet */}
      <div className="w-72 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900 text-sm">Customer & Summary</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer Metadata fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium text-slate-800"
                disabled={isCheckingOut}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Contact Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10 digit phone number"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium text-slate-800"
                disabled={isCheckingOut}
              />
            </div>
          </div>

          {/* Discount Parameters */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Discount Structure
            </label>
            <div className="flex rounded-lg overflow-hidden border border-slate-100 mb-2">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-1.5 text-center text-xs font-bold cursor-pointer ${
                  discountType === 'percent'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
                disabled={isCheckingOut}
              >
                Percent (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('flat')}
                className={`flex-1 py-1.5 text-center text-xs font-bold cursor-pointer ${
                  discountType === 'flat'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
                disabled={isCheckingOut}
              >
                Flat (₹)
              </button>
            </div>
            <input
              type="number"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="Discount value"
              className="w-full px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium text-slate-800"
              disabled={isCheckingOut}
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Card'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  disabled={isCheckingOut}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Calculations panel */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-800 font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>Discount</span>
              <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5% GST)</span>
              <span className="text-slate-800 font-bold">₹{tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-100 my-2"></div>
            <div className="flex justify-between items-baseline text-slate-900">
              <span className="text-sm font-extrabold">Grand Total</span>
              <span className="text-xl font-black">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Charge Button */}
        <div className="p-4 border-t border-slate-50">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut}
            className="w-full py-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCheckingOut ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <CreditCard size={16} />
            )}
            {isCheckingOut ? 'Processing...' : `Charge ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* ── Tax Invoice Receipt Modal ─────────────────── */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowReceipt(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] flex flex-col overflow-hidden animate-scale-in"
            style={{ maxHeight: 'calc(100vh - 48px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Bill Generated</p>
                  <p className="text-[10px] text-slate-400">AMM-{completedSale.id?.slice(0,8).toUpperCase() || 'NEW'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Receipt */}
            <div className="flex-1 overflow-y-auto p-5">
              <div id="receipt-print-area" className="font-mono text-[11px] leading-relaxed text-slate-800 max-w-[300px] mx-auto">
                <div className="text-center mb-5 space-y-0.5">
                  <h2 className="font-black text-base uppercase tracking-widest text-slate-900">AMIT MEGA MART</h2>
                  <p className="text-[9px] text-slate-500">Retail & POS Billing Counter</p>
                  <p className="text-[9px] text-slate-400">Sector-15, Noida, UP — 201301</p>
                  <p className="text-[9px] text-slate-400">Ph: +91 98765 43210 | GSTIN: 09ABCDE1234F1Z5</p>
                  <div className="border-t border-dashed border-slate-200 my-2" />
                </div>

                <div className="space-y-1 mb-4 text-slate-600">
                  <div className="flex justify-between"><span className="font-bold text-slate-700">Invoice:</span><span>AMM-{completedSale.id?.slice(0,8).toUpperCase() || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="font-bold text-slate-700">Date:</span><span>{new Date(completedSale.created_at).toLocaleDateString('en-IN')} {new Date(completedSale.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
                  <div className="flex justify-between"><span className="font-bold text-slate-700">Cashier:</span><span>Terminal A</span></div>
                  <div className="flex justify-between"><span className="font-bold text-slate-700">Customer:</span><span>{completedSale.customerName}</span></div>
                  {completedSale.customerPhone && <div className="flex justify-between"><span className="font-bold text-slate-700">Phone:</span><span>{completedSale.customerPhone}</span></div>}
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 mb-3">
                  <div className="flex justify-between font-black text-slate-900 mb-2 text-[10px] uppercase tracking-wider">
                    <span>Item</span><span>Amount</span>
                  </div>
                  {completedSale.cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 leading-tight">{item.name}</p>
                        <p className="text-[9px] text-slate-400">{item.quantity} × ₹{item.price.toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{completedSale.subtotal.toFixed(2)}</span></div>
                  {completedSale.discountAmount > 0 && (
                    <div className="flex justify-between font-semibold text-amber-600"><span>Discount</span><span>−₹{completedSale.discountAmount.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between text-slate-500"><span>GST (5%)</span><span>₹{completedSale.taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                    <span>GRAND TOTAL</span><span>₹{completedSale.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1"><span>Payment</span><span className="font-bold">{completedSale.paymentMethod}</span></div>
                </div>

                <div className="border-t border-dashed border-slate-200 mt-4 pt-3 text-center space-y-1">
                  <p className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">★ Thank You For Shopping ★</p>
                  <p className="text-slate-400 text-[9px]">Visit us again soon!</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Close & Return to Scanning
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
