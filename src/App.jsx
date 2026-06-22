import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { supabase, isSupabaseReady } from './supabaseClient';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import SalesHistory from './pages/SalesHistory';

// Mock initial products data as fallback / seed
const initialProducts = [
  { id: '1', barcode: '12345', name: 'Premium Basmati Rice 1kg', price: 150.00, stock: 50, category: 'Groceries' },
  { id: '2', barcode: '12346', name: 'Refined Sunflower Oil 1L', price: 125.50, stock: 30, category: 'Groceries' },
  { id: '3', barcode: '12347', name: 'Tata Iodized Salt 1kg', price: 25.00, stock: 100, category: 'Groceries' },
  { id: '4', barcode: '89010', name: 'Maggi 2-Min Noodles 70g', price: 14.00, stock: 200, category: 'Packaged Food' },
  { id: '5', barcode: '89011', name: 'Britannia Marie Gold 250g', price: 35.00, stock: 80, category: 'Packaged Food' },
  { id: '6', barcode: '89012', name: 'Amul Butter 500g', price: 275.00, stock: 25, category: 'Dairy' },
  { id: '7', barcode: '89013', name: 'Colgate Dental Cream 200g', price: 110.00, stock: 60, category: 'Personal Care' },
  { id: '8', barcode: '89014', name: 'Dettol Liquid Handwash 200ml', price: 99.00, stock: 45, category: 'Personal Care' },
  { id: '9', barcode: '89015', name: 'Surf Excel Easy Wash 1kg', price: 140.00, stock: 40, category: 'Household' },
  { id: '10', barcode: '89016', name: 'Vim Dishwash Gel 500ml', price: 105.00, stock: 55, category: 'Household' },
  { id: '11', barcode: '89017', name: 'Haldirams Bhujia Sev 150g', price: 45.00, stock: 90, category: 'Packaged Food' },
  { id: '12', barcode: '89018', name: 'Cadbury Dairy Milk Silk 60g', price: 80.00, stock: 15, category: 'Packaged Food' },
  { id: '13', barcode: '89019', name: 'Coca-Cola Soft Drink 750ml', price: 40.00, stock: 70, category: 'Beverages' },
  { id: '14', barcode: '89020', name: 'Red Label Tea 250g', price: 115.00, stock: 50, category: 'Beverages' },
  { id: '15', barcode: '89021', name: 'Nescafe Classic Coffee 50g', price: 165.00, stock: 35, category: 'Beverages' }
];

// Helper to generate seed sales for a rich demo dashboard
const getMockSales = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  return [
    {
      id: 'mock-sale-1',
      total_amount: 325.00,
      payment_method: 'UPI',
      customer_name: 'Rahul Sharma',
      customer_phone: '9876543210',
      discount_amount: 15.00,
      tax_amount: 15.00,
      created_at: new Date().toISOString(),
      items: [
        { id: '1', name: 'Premium Basmati Rice 1kg', price: 150.00, quantity: 2 }
      ]
    },
    {
      id: 'mock-sale-2',
      total_amount: 175.50,
      payment_method: 'Cash',
      customer_name: 'Pooja Gupta',
      customer_phone: '8765432109',
      discount_amount: 0.00,
      tax_amount: 8.35,
      created_at: yesterday.toISOString(),
      items: [
        { id: '2', name: 'Refined Sunflower Oil 1L', price: 125.50, quantity: 1 },
        { id: '3', name: 'Tata Iodized Salt 1kg', price: 25.00, quantity: 2 }
      ]
    },
    {
      id: 'mock-sale-3',
      total_amount: 450.00,
      payment_method: 'Card',
      customer_name: 'Amit Verma',
      customer_phone: '7654321098',
      discount_amount: 50.00,
      tax_amount: 20.00,
      created_at: twoDaysAgo.toISOString(),
      items: [
        { id: '6', name: 'Amul Butter 500g', price: 275.00, quantity: 1 },
        { id: '9', name: 'Surf Excel Easy Wash 1kg', price: 140.00, quantity: 1 }
      ]
    },
    {
      id: 'mock-sale-4',
      total_amount: 120.00,
      payment_method: 'UPI',
      customer_name: 'Suresh Kumar',
      customer_phone: '8899889988',
      discount_amount: 0.00,
      tax_amount: 5.71,
      created_at: threeDaysAgo.toISOString(),
      items: [
        { id: '12', name: 'Cadbury Dairy Milk Silk 60g', price: 80.00, quantity: 1 },
        { id: '13', name: 'Coca-Cola Soft Drink 750ml', price: 40.00, quantity: 1 }
      ]
    }
  ];
};

function App() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [isUsingMock, setIsUsingMock] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!isSupabaseReady) {
      const stored = localStorage.getItem('amm_products');
      if (stored) {
        setProducts(JSON.parse(stored));
      } else {
        setProducts(initialProducts);
        localStorage.setItem('amm_products', JSON.stringify(initialProducts));
      }
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
      console.error('Error fetching products from Supabase:', err.message);
      const stored = localStorage.getItem('amm_products');
      if (stored) {
        setProducts(JSON.parse(stored));
      } else {
        setProducts(initialProducts);
        localStorage.setItem('amm_products', JSON.stringify(initialProducts));
      }
      setIsUsingMock(true);
      toast.error('Failed to load products from database. Operating in offline fallback mode.');
    }
  }, []);

  const fetchSales = useCallback(async () => {
    if (!isSupabaseReady) {
      const stored = localStorage.getItem('amm_sales');
      if (stored) {
        setSales(JSON.parse(stored));
      } else {
        const seedSales = getMockSales();
        setSales(seedSales);
        localStorage.setItem('amm_sales', JSON.stringify(seedSales));
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching sales from Supabase:', err.message);
      const stored = localStorage.getItem('amm_sales');
      if (stored) {
        setSales(JSON.parse(stored));
      } else {
        const seedSales = getMockSales();
        setSales(seedSales);
        localStorage.setItem('amm_sales', JSON.stringify(seedSales));
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      // Defer state updates slightly to avoid triggering cascading renders during render phase
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!active) return;
      fetchProducts();
      fetchSales();
    };
    init();
    return () => {
      active = false;
    };
  }, [fetchProducts, fetchSales]);

  const handleAddProduct = async (newProduct) => {
    if (!isSupabaseReady || isUsingMock) {
      const updated = [...products, { ...newProduct, id: Date.now().toString(), created_at: new Date().toISOString() }];
      setProducts(updated);
      localStorage.setItem('amm_products', JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          barcode: newProduct.barcode,
          name: newProduct.name,
          price: newProduct.price,
          stock: newProduct.stock,
          category: newProduct.category
        }]);

      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error adding product to Supabase:', err.message);
      toast.error(`Database error: ${err.message}`);
      return false;
    }
  };

  const handleUpdateProduct = async (id, updatedFields) => {
    if (!isSupabaseReady || isUsingMock) {
      const updated = products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
      setProducts(updated);
      localStorage.setItem('amm_products', JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({
          barcode: updatedFields.barcode,
          name: updatedFields.name,
          price: updatedFields.price,
          stock: updatedFields.stock,
          category: updatedFields.category
        })
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error updating product in Supabase:', err.message);
      toast.error(`Database update failed: ${err.message}`);
      return false;
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!isSupabaseReady || isUsingMock) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem('amm_products', JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error deleting product from Supabase:', err.message);
      toast.error(`Failed to delete: ${err.message}`);
      return false;
    }
  };

  const handleCheckout = async (saleDetails) => {
    if (!isSupabaseReady || isUsingMock) {
      // 1. Update local stock levels
      const updatedProducts = products.map(p => {
        const cartItem = saleDetails.cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.quantity };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('amm_products', JSON.stringify(updatedProducts));

      // 2. Prepend local sales logs
      const localSale = {
        id: saleDetails.id,
        total_amount: saleDetails.total,
        payment_method: saleDetails.paymentMethod,
        customer_name: saleDetails.customerName,
        customer_phone: saleDetails.customerPhone,
        discount_amount: saleDetails.discountAmount,
        tax_amount: saleDetails.taxAmount,
        created_at: saleDetails.created_at,
        items: saleDetails.cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };
      
      const updatedSales = [localSale, ...sales];
      setSales(updatedSales);
      localStorage.setItem('amm_sales', JSON.stringify(updatedSales));
      return true;
    }

    try {
      // 1. Insert parent record in 'sales' table
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          total_amount: saleDetails.total,
          payment_method: saleDetails.paymentMethod,
          customer_name: saleDetails.customerName,
          customer_phone: saleDetails.customerPhone,
          discount_amount: saleDetails.discountAmount,
          tax_amount: saleDetails.taxAmount
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Mutate ID of details object with true DB generated UUID
      saleDetails.id = sale.id;

      // 2. Insert line items in 'sale_items' table
      const saleItemsData = saleDetails.cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // 3. Deduct stock for each item sequentially in the database
      for (const item of saleDetails.cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
        
        if (stockError) {
          console.error(`Failed to update stock for ${item.name}:`, stockError.message);
        }
      }

      // 4. Refresh listings
      await fetchProducts();
      await fetchSales();
      return true;
    } catch (err) {
      console.error('Checkout database error:', err.message);
      toast.error(`Checkout failed: ${err.message}`);
      return false;
    }
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout isUsingMock={isUsingMock} />}>
          <Route index element={<Dashboard products={products} sales={sales} />} />
          <Route path="pos" element={<POS products={products} onCheckout={handleCheckout} />} />
          <Route path="inventory" element={
            <Inventory 
              products={products} 
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          } />
          <Route path="sales" element={
            <SalesHistory 
              sales={sales} 
              isUsingMock={isUsingMock} 
            />
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
