import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import Layout from './components/Layout';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import AddProduct from './pages/AddProduct';

// Mock initial data as fallback
const initialProducts = [
  { id: '1', barcode: '12345', name: 'Premium Basmati Rice 1kg', price: 150.00, stock: 50 },
  { id: '2', barcode: '12346', name: 'Refined Sunflower Oil 1L', price: 125.50, stock: 30 },
  { id: '3', barcode: '12347', name: 'Tata Salt 1kg', price: 25.00, stock: 100 },
];

function App() {
  const [products, setProducts] = useState([]);
  const [isUsingMock, setIsUsingMock] = useState(false);

  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return url && !url.includes('your-project-id');
  };

  const fetchProducts = async () => {
    if (!isSupabaseConfigured()) {
      setProducts(initialProducts);
      setIsUsingMock(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
      setIsUsingMock(false);
    } catch (err) {
      console.error('Error fetching products:', err.message);
      toast.error('Failed to load products from database. Using local backup.');
      setProducts(initialProducts);
      setIsUsingMock(true);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (newProduct) => {
    if (isUsingMock) {
      setProducts(prev => [...prev, { ...newProduct, id: Date.now().toString() }]);
      return true;
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          barcode: newProduct.barcode,
          name: newProduct.name,
          price: newProduct.price,
          stock: newProduct.stock
        }]);

      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error adding product:', err.message);
      toast.error(`Database error: ${err.message}`);
      return false;
    }
  };

  const handleCheckout = async (cart, total) => {
    if (isUsingMock) {
      const updatedProducts = products.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.quantity };
        }
        return p;
      });
      setProducts(updatedProducts);
      return true;
    }

    try {
      // 1. Insert Sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ total_amount: total }])
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Insert Sale Items
      const saleItemsData = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // 3. Deduct stock for each item
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
        
        if (stockError) {
          console.error(`Failed to update stock for ${item.name}:`, stockError.message);
        }
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Checkout error:', err.message);
      toast.error(`Checkout failed: ${err.message}`);
      return false;
    }
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      {isUsingMock && (
        <div className="bg-amber-500 text-white text-xs px-4 py-1.5 text-center font-semibold tracking-wide">
          Running in offline demo mode. Setup your `.env` file to connect to your Supabase database.
        </div>
      )}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <POS 
              products={products} 
              onCheckout={handleCheckout} 
            />
          } />
          <Route path="inventory" element={<Inventory products={products} />} />
          <Route path="add-product" element={<AddProduct addProduct={handleAddProduct} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
