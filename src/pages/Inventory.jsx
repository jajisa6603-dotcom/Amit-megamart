import React, { useState, useRef, useEffect } from 'react';
import { Package, AlertTriangle, Search, Plus, Edit3, Trash2, Download, X, Barcode, Save, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inventory({ products = [], onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const lowStockThreshold = 10;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock <= lowStockThreshold).length;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Slider Drawer State for Add/Edit Form
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null); // Null for Add Product
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'Groceries',
    price: '',
    stock: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const barcodeInputRef = useRef(null);

  // Focus barcode input when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      setTimeout(() => barcodeInputRef.current?.focus(), 150);
    }
  }, [isDrawerOpen]);

  // Extract unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Groceries'));
    return ['All', ...cats];
  }, [products]);

  // Filtered Products
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

  // Trigger Edit modal prep
  const handleOpenEdit = (product) => {
    setEditProductId(product.id);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category || 'Groceries',
      price: product.price.toString(),
      stock: product.stock.toString()
    });
    setIsDrawerOpen(true);
  };

  // Trigger Add modal prep
  const handleOpenAdd = () => {
    setEditProductId(null);
    setFormData({
      barcode: '',
      name: '',
      category: 'Groceries',
      price: '',
      stock: ''
    });
    setIsDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.barcode || !formData.name || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      barcode: formData.barcode.trim(),
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10)
    };

    setIsSaving(true);
    let success;

    if (editProductId) {
      success = await onUpdateProduct(editProductId, payload);
      if (success) {
        toast.success('Product updated successfully!');
      }
    } else {
      // Check duplicate barcode
      const isDuplicate = products.some(p => p.barcode === payload.barcode);
      if (isDuplicate) {
        toast.error('A product with this barcode already exists!');
        setIsSaving(false);
        return;
      }
      success = await onAddProduct(payload);
      if (success) {
        toast.success('Product registered successfully!');
      }
    }

    setIsSaving(false);
    if (success) {
      setIsDrawerOpen(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`);
    if (!isConfirmed) return;

    const success = await onDeleteProduct(id);
    if (success) {
      toast.success(`"${name}" deleted successfully.`);
    } else {
      toast.error('Failed to delete product. Database error.');
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error('No inventory products available to export!');
      return;
    }

    const headers = 'Barcode/SKU,Product Name,Category,Price (INR),Stock level,Inventory Asset Value (INR)\n';
    const rows = products.map(p => {
      const escapedName = p.name.replace(/"/g, '""');
      const itemValue = (p.price * p.stock).toFixed(2);
      return `"${p.barcode}","${escapedName}","${p.category || 'Groceries'}",${p.price},${p.stock},${itemValue}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory report exported to CSV!');
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Top dashboard summary header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Terminal</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage catalogue pricing, categories and replenish stock levels.</p>
        </div>

        {/* Small KPI Summary Widgets */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Package size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total SKUs</p>
              <p className="text-lg font-black text-slate-800">{products.length}</p>
            </div>
          </div>
          
          <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`p-2 rounded-lg ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Low Stock</p>
              <p className="text-lg font-black text-slate-800">{lowStockCount}</p>
            </div>
          </div>

          <div className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600 font-bold text-sm">
              ₹
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asset Valuation</p>
              <p className="text-lg font-black text-slate-800">₹{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action panel (Search filters + CRUD actions) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        
        {/* Search & Category Filter */}
        <div className="flex flex-1 flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, barcode..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Export / Add Product triggers */}
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-600 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-200 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Barcode / SKU</th>
                <th className="py-4 px-6">Product Details</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Stock Level</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400 font-semibold">
                    No matching products in stock database.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stock <= lowStockThreshold;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">{product.barcode}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800 text-sm">{product.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-50 px-2.5 py-1 rounded-md text-[10px] text-slate-500 font-bold border border-slate-100">
                          {product.category || 'Groceries'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-800 font-bold text-sm">₹{product.price.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <span className={`font-extrabold ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-600 border border-red-100/50">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100/50">
                            <AlertTriangle size={11} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 bg-white border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit3 size={13} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 bg-white border border-slate-100 hover:border-red-200 text-slate-300 hover:text-red-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer Slide-over for Add/Edit Form Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop click closer */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
          />

          {/* Drawer Sheet Body */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-fade-in border-l border-slate-100">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editProductId ? 'Edit Product Details' : 'Register New Product'}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {editProductId ? 'Modifying existing catalog listing' : 'Create new stock keeping unit'}
                </p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Barcode / SKU (Required)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Barcode size={16} />
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    placeholder="Scan product barcode or type SKU..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-600 transition-all"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Product Name (Required)
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Britannia Bourbon Biscuit 150g"
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-600 transition-all"
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-600 transition-all cursor-pointer"
                    disabled={isSaving}
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Packaged Food">Packaged Food</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Household">Household</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Unit Price (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <IndianRupee size={12} />
                    </div>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full pl-7 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-600 transition-all"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Stock Level (Units)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-600 transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Submit triggers inside form */}
              <div className="pt-6 border-t border-slate-50 flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-blue-200 flex items-center gap-1.5 cursor-pointer"
                  disabled={isSaving}
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
