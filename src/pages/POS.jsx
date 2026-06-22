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

  // Auto-trigger print when receipt modal opens
  useEffect(() => {
    if (showReceipt && completedSale) {
      const timer = setTimeout(() => {
        window.print();
      }, 400); // 400ms delay to let the DOM settle and render
      return () => clearTimeout(timer);
    }
  }, [showReceipt, completedSale]);

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
    <div className="h-[calc(100vh-140px)] flex gap-6 relative animate-fade-in">
      
      {/* Left Pane - Visual Catalog & Grid */}
      <div className="w-[45%] flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/20 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-800"
            />
          </div>
          
          {/* Categories Horizontal Scroller */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
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
                  <div className="mt-3.5 flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="font-extrabold text-sm text-slate-900">₹{prod.price.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Qty: {prod.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Pane - Barcode Scan & Cart */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
      <div className="w-80 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
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

      {/* Tax Invoice Receipt Popup Modal */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-fade-in flex flex-col">
            
            {/* Modal Header Actions */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-500" /> Bill Generated
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
                  onClick={() => setShowReceipt(false)}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Receipt Area for Thermal Printer rendering */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div id="receipt-print-area" className="font-mono text-[11px] text-slate-800 leading-relaxed max-w-[280px] mx-auto bg-slate-50/40 p-4 border border-dashed border-slate-200 rounded-lg">
                <div className="text-center space-y-1 mb-4">
                  <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">AMIT MEGA MART</h2>
                  <p className="text-[9px] text-slate-500">Retail & POS Billing counter</p>
                  <p className="text-[9px] text-slate-400">Sector-15, Noida, UP (Pin: 201301)</p>
                  <p className="text-[9px] text-slate-400">Ph: +91 98765 43210</p>
                </div>

                <div className="border-t border-b border-dashed border-slate-200 py-2.5 my-3.5 space-y-1 text-slate-500">
                  <p><span className="font-bold text-slate-700">Invoice ID:</span> AMM-{completedSale.id ? completedSale.id.slice(0, 8).toUpperCase() : 'N/A'}</p>
                  <p><span className="font-bold text-slate-700">Date:</span> {new Date(completedSale.created_at).toLocaleDateString()} {new Date(completedSale.created_at).toLocaleTimeString()}</p>
                  <p><span className="font-bold text-slate-700">Cashier:</span> Terminal A (Digital)</p>
                  <p><span className="font-bold text-slate-700">Customer:</span> {completedSale.customerName}</p>
                  {completedSale.customerPhone && (
                    <p><span className="font-bold text-slate-700">Phone:</span> {completedSale.customerPhone}</p>
                  )}
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <div className="flex justify-between font-extrabold text-slate-900 border-b border-slate-100 pb-1">
                    <span>ITEM (QTY x RATE)</span>
                    <span>AMOUNT</span>
                  </div>
                  {completedSale.cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-1">
                      <div className="truncate max-w-[180px]">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                      </div>
                      <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Breakdown Summary */}
                <div className="border-t border-dashed border-slate-200 mt-4 pt-3.5 space-y-1 text-right text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{completedSale.subtotal.toFixed(2)}</span>
                  </div>
                  {completedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Discount Saved:</span>
                      <span>-₹{completedSale.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (5% GST):</span>
                    <span>₹{completedSale.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-100 mt-1">
                    <span>Grand Total:</span>
                    <span>₹{completedSale.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 mt-5 pt-4 text-center space-y-2 text-slate-400 text-[9px] font-bold">
                  <p>Paid via: {completedSale.paymentMethod.toUpperCase()}</p>
                  <p className="uppercase tracking-wider text-slate-500">*** Thank You For Shopping ***</p>
                  <p>Visit again soon!</p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full py-2 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close and Return to Scanning
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
