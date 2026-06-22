import React, { useState, useRef, useEffect } from 'react';
import { Package, AlertTriangle, Search, Plus, Edit3, Trash2, Download, X, Save, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Groceries', 'Packaged Food', 'Dairy', 'Beverages', 'Personal Care', 'Household', 'General'];

export default function Inventory({ products = [], onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const LOW = 10;
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowCount = products.filter(p => p.stock <= LOW).length;

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ barcode: '', name: '', category: 'Groceries', price: '', stock: '' });
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  const categories = React.useMemo(() => {
    const s = new Set(products.map(p => p.category || 'Groceries'));
    return ['All', ...s];
  }, [products]);

  const filtered = React.useMemo(() => {
    return products.filter(p => {
      const matchCat = catFilter === 'All' || p.category === catFilter;
      const q = search.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q) || (p.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, catFilter, search]);

  useEffect(() => {
    if (isOpen) setTimeout(() => firstRef.current?.focus(), 120);
  }, [isOpen]);

  const openAdd = () => {
    setEditId(null);
    setForm({ barcode: '', name: '', category: 'Groceries', price: '', stock: '' });
    setIsOpen(true);
  };

  const openEdit = p => {
    setEditId(p.id);
    setForm({ barcode: p.barcode, name: p.name, category: p.category || 'Groceries', price: String(p.price), stock: String(p.stock) });
    setIsOpen(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.barcode || !form.name || !form.price || !form.stock) return toast.error('All fields are required.');
    const payload = { barcode: form.barcode.trim(), name: form.name.trim(), category: form.category, price: parseFloat(form.price), stock: parseInt(form.stock, 10) };
    setSaving(true);
    let ok;
    if (editId) {
      ok = await onUpdateProduct(editId, payload);
      if (ok) toast.success('Product updated!');
    } else {
      if (products.some(p => p.barcode === payload.barcode)) {
        toast.error('Barcode already exists!');
        setSaving(false);
        return;
      }
      ok = await onAddProduct(payload);
      if (ok) toast.success('Product added!');
    }
    setSaving(false);
    if (ok) setIsOpen(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const ok = await onDeleteProduct(id);
    if (ok) toast.success(`"${name}" deleted.`);
    else toast.error('Delete failed.');
  };

  const exportCSV = () => {
    if (!products.length) return toast.error('No products to export.');
    const head = 'Barcode,Name,Category,Price,Stock,Value\n';
    const rows = products.map(p => `"${p.barcode}","${p.name.replace(/"/g,'""')}","${p.category}",${p.price},${p.stock},${(p.price*p.stock).toFixed(2)}`).join('\n');
    const url = URL.createObjectURL(new Blob([head+rows], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `Inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('CSV exported!');
  };

  const stockBadge = p => {
    if (p.stock === 0) return { label: 'Out of Stock', bg: '#fef2f2', color: '#ef4444' };
    if (p.stock <= LOW) return { label: 'Low Stock', bg: '#fffbeb', color: '#d97706' };
    return { label: 'In Stock', bg: '#f0fdf4', color: '#16a34a' };
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-up">

      {/* ── Header + KPIs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage stock levels, pricing and product catalogue.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total SKUs', value: products.length, icon: Package, color: '#2563eb' },
            { label: 'Low Stock', value: lowCount, icon: AlertTriangle, color: lowCount > 0 ? '#ef4444' : '#10b981' },
            { label: 'Asset Value', value: `₹${totalValue.toLocaleString('en-IN')}`, color: '#8b5cf6', isRupee: true },
          ].map(({ label, value, icon: Icon, color, isRupee }) => (
            <div key={label} className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: color + '15', color }}>
                {isRupee ? '₹' : <Icon size={14} />}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-black text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, barcode..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="relative">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm">
            <Download size={14} /> Export
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100" style={{ background: '#f8fafc' }}>
                {['Barcode / SKU', 'Product Name', 'Category', 'Unit Price', 'Stock', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-16 text-center text-slate-400 text-sm">No products found.</td></tr>
              ) : filtered.map(p => {
                const badge = stockBadge(p);
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-5 font-mono text-xs text-slate-400">{p.barcode}</td>
                    <td className="py-4 px-5 font-semibold text-sm text-slate-800">{p.name}</td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        {p.category || 'Groceries'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-sm text-slate-900">₹{p.price.toFixed(2)}</td>
                    <td className="py-4 px-5">
                      <span className={`font-bold text-sm ${p.stock <= LOW ? 'text-red-600' : 'text-slate-800'}`}>
                        {p.stock} <span className="text-xs font-normal text-slate-400">units</span>
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                        style={{ background: badge.bg, color: badge.color, borderColor: badge.color + '30' }}>
                        {p.stock <= LOW && p.stock > 0 && <AlertTriangle size={10} />}
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400 font-medium">
          <span>{filtered.length} of {products.length} products</span>
          <span>Total asset value: <span className="font-bold text-slate-600">₹{totalValue.toLocaleString('en-IN')}</span></span>
        </div>
      </div>

      {/* ── Slide-over Drawer ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0" style={{ background: '#f8fafc' }}>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{editId ? 'Edit Product' : 'Add New Product'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editId ? 'Update catalogue listing' : 'Register a new SKU'}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <X size={17} />
              </button>
            </div>

            {/* Drawer form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {[
                { label: 'Barcode / SKU *', key: 'barcode', type: 'text', placeholder: 'Scan or type barcode...', ref: firstRef },
                { label: 'Product Name *', key: 'name', type: 'text', placeholder: 'e.g. Amul Butter 500g' },
              ].map(({ label, key, type, placeholder, ref }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input
                    ref={ref} type={type} required value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} disabled={saving}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                <div className="relative">
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={saving}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Price (₹) *</label>
                  <input type="number" required step="0.01" min="0" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" disabled={saving}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Stock Units *</label>
                  <input type="number" required min="0" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" disabled={saving}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                </div>
              </div>

              <div className="pt-4 flex gap-2 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsOpen(false)} disabled={saving}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                  <Save size={14} />
                  {saving ? 'Saving...' : editId ? 'Update' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
