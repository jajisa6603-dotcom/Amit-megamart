import React, { useState, useRef, useEffect } from 'react';
import { Save, Plus, Barcode, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddProduct({ addProduct }) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    price: '',
    stock: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const barcodeInputRef = useRef(null);

  // Auto-focus barcode input when mounting
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.barcode || !formData.name || !formData.price || !formData.stock) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSaving(true);
    const newProduct = {
      barcode: formData.barcode.trim(),
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10)
    };

    const success = await addProduct(newProduct);
    setIsSaving(false);

    if (success) {
      toast.success('Product added successfully!');
      // Reset form
      setFormData({ barcode: '', name: '', price: '', stock: '' });
      barcodeInputRef.current?.focus();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-500 mt-1">Enter product details or scan barcode to add to inventory.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            Product Details
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode / SKU
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Barcode className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="block w-full pl-10 pr-4 py-3 border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="Scan or type barcode..."
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan the product barcode to automatically fill this field.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="block w-full px-4 py-3 border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Premium Basmati Rice 1kg"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="block w-full px-4 py-3 border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="block w-full px-4 py-3 border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="100"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium shadow-md shadow-blue-200 transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {isSaving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
