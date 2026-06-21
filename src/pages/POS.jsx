import React, { useState, useRef, useEffect } from 'react';
import { Search, Trash2, CreditCard, Receipt, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function POS({ products, onCheckout }) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input for barcode scanner
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = products.find(p => p.barcode === barcodeInput.trim());
    
    if (product) {
      if (product.stock <= 0) {
        toast.error(`${product.name} is out of stock!`);
        setBarcodeInput('');
        return;
      }

      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            toast.error(`Cannot add more ${product.name}. Stock limit reached.`);
            return prev;
          }
          return prev.map(item => 
            item.id === product.id 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      toast.success(`Added ${product.name}`);
    } else {
      toast.error('Product not found!');
    }
    
    setBarcodeInput('');
    inputRef.current?.focus();
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% mock tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    
    const success = await onCheckout(cart, total);
    setIsCheckingOut(false);
    
    if (success) {
      setCart([]);
      toast.success('Payment successful! Receipt printing...');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-full flex gap-6">
      {/* Left Area - Cart */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Scanner Input Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <form onSubmit={handleScan} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 text-lg border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-shadow"
              placeholder="Scan barcode or type and press Enter..."
              autoFocus
              disabled={isCheckingOut}
            />
          </form>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <Receipt size={48} className="text-gray-200" />
              <p className="text-lg">Cart is empty. Scan items to begin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                      {item.quantity}x
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isCheckingOut}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Area - Checkout Panel */}
      <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
        </div>
        
        <div className="p-6 flex-1 flex flex-col justify-end">
          <div className="space-y-4 text-gray-600 mb-8">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="font-semibold">₹{tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-200 my-4"></div>
            <div className="flex justify-between text-2xl font-bold text-gray-900">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <CreditCard size={24} />
            )}
            {isCheckingOut ? 'Processing...' : `Charge ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
