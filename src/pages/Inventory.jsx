import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';

export default function Inventory({ products }) {
  const lowStockThreshold = 10;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your stock and monitor low levels.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <span className="font-bold text-lg">₹</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Inventory Value</p>
              <p className="text-xl font-bold text-gray-900">₹{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-4 px-6 font-semibold">Barcode</th>
                <th className="py-4 px-6 font-semibold">Product Name</th>
                <th className="py-4 px-6 font-semibold">Price</th>
                <th className="py-4 px-6 font-semibold">Stock Level</th>
                <th className="py-4 px-6 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No products found. Add some products to see them here.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.stock <= lowStockThreshold;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-500 font-mono text-sm">{product.barcode}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{product.name}</td>
                      <td className="py-4 px-6 text-gray-600">₹{product.price.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle size={14} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
