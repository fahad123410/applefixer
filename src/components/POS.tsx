import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Headphones, Package, X, CheckCircle2, ChevronRight, Receipt } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Transfer'>('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const product = products.find(p => p.id === id);
        if (newQty > 0 && newQty <= (product?.stock || 0)) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total,
        paymentMethod,
        createdAt: new Date().toISOString()
      };

      const saleRef = await addDoc(collection(db, 'sales'), saleData);
      
      // Update stock
      for (const item of cart) {
        await updateDoc(doc(db, 'products', item.id), {
          stock: increment(-item.quantity)
        });
      }

      setLastSale({ id: saleRef.id, ...saleData });
      setCart([]);
      setShowReceipt(true);
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col space-y-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Point of Sale</h2>
            <p className="text-slate-500 mt-1">Select products to create a new order.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-sm font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <motion.button
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.02 }}
                disabled={product.stock <= 0}
                onClick={() => addToCart(product)}
                className={cn(
                  "bg-white p-5 rounded-[28px] card-shadow border border-slate-50 text-left transition-all hover:shadow-xl active:scale-[0.98] group relative overflow-hidden flex flex-col h-full",
                  product.stock <= 0 && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <div className="mb-4 p-4 bg-slate-50 rounded-2xl w-fit group-hover:bg-brand-50 transition-colors group-hover:scale-110 duration-300">
                  {product.category === 'Phone' ? <Smartphone size={24} className="text-slate-600 group-hover:text-brand-600" /> : 
                   product.category === 'Accessory' ? <Headphones size={24} className="text-slate-600 group-hover:text-brand-600" /> :
                   <Package size={24} className="text-slate-600 group-hover:text-brand-600" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{product.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{product.brand}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <p className="font-black text-brand-600">Rs. {product.price.toLocaleString()}</p>
                  <div className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                    product.stock < 5 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                  )}>
                    {product.stock} left
                  </div>
                </div>
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Out of Stock</span>
                  </div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-[32px] card-shadow border border-slate-50 flex flex-col overflow-hidden h-full">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-100">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Current Order</h3>
              <p className="text-xs font-medium text-slate-400">{cart.length} items in cart</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {cart.length > 0 ? cart.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 group"
              >
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">{item.name}</h5>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Rs. {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)} 
                    className="p-1.5 hover:bg-white hover:text-brand-600 rounded-lg shadow-sm transition-all active:scale-90"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-black w-6 text-center text-slate-900">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)} 
                    className="p-1.5 hover:bg-white hover:text-brand-600 rounded-lg shadow-sm transition-all active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)} 
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-12">
                <div className="p-6 bg-slate-50 rounded-full">
                  <ShoppingCart size={48} strokeWidth={1} />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-50 space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>Rs. {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">Rs. {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'Cash', icon: Banknote },
              { id: 'Card', icon: CreditCard },
              { id: 'Transfer', icon: Receipt }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95",
                  paymentMethod === method.id 
                    ? "border-brand-600 bg-brand-50 text-brand-600 shadow-md shadow-brand-100" 
                    : "border-transparent bg-white text-slate-400 hover:bg-slate-100"
                )}
              >
                <method.icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{method.id}</span>
              </button>
            ))}
          </div>

          <button
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className="w-full bg-brand-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-brand-100 hover:bg-brand-700 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Order</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showReceipt && lastSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceipt(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-10 text-center space-y-6">
                <div className="inline-flex p-5 bg-emerald-50 text-emerald-600 rounded-[24px] shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Order Successful</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sale #{lastSale.id.slice(-6).toUpperCase()}</p>
                </div>
                
                <div className="bg-slate-50 rounded-[24px] p-6 space-y-3">
                  {lastSale.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">{item.quantity}x {item.name}</span>
                      <span className="font-bold text-slate-900">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Paid</span>
                    <span className="text-xl font-black text-brand-600">Rs. {lastSale.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Banknote size={14} />
                  <span>Paid via {lastSale.paymentMethod}</span>
                </div>

                <button 
                  onClick={() => setShowReceipt(false)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
