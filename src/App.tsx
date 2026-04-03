import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Smartphone, 
  Wrench, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { cn } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Repairs from './components/Repairs';
import POS from './components/POS';
import Customers from './components/Customers';
import Expenses from './components/Expenses';

function Sidebar({ user }: { user: User }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'POS', path: '/pos', icon: ShoppingCart },
    { name: 'Repairs', path: '/repairs', icon: Wrench },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Expenses', path: '/expenses', icon: TrendingUp },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-white text-slate-900 rounded-full shadow-lg border border-slate-100"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-out lg:translate-x-0 sidebar-shadow",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 bg-brand-600 rounded-2xl shadow-lg shadow-brand-200">
              <Smartphone className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">AppleFixer</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">POS System</p>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group",
                  location.pathname === item.path 
                    ? "bg-brand-50 text-brand-600 font-semibold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={cn(
                    "transition-colors",
                    location.pathname === item.path ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span>{item.name}</span>
                </div>
                {location.pathname === item.path && (
                  <motion.div layoutId="active-pill">
                    <ChevronRight size={14} />
                  </motion.div>
                )}
              </Link>
            ))}
          </nav>

          <div className="pt-8 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-6 p-2 bg-slate-50 rounded-2xl">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=0e8de9&color=fff`} 
                alt={user.displayName || 'User'} 
                className="w-10 h-10 rounded-xl border-2 border-white shadow-sm"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase font-bold tracking-wider">Administrator</p>
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center justify-center gap-3 w-full px-4 py-3.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-[0.98]"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="rounded-full h-10 w-10 border-4 border-slate-200 border-t-brand-600"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-10 text-center card-shadow"
        >
          <div className="inline-flex p-5 bg-brand-50 rounded-[24px] mb-8">
            <Smartphone className="text-brand-600" size={48} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">AppleFixer</h1>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">Complete management system for phone shops and repair centers.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-4 bg-slate-900 text-white py-4.5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar user={user} />
      <main className="lg:ml-72 p-6 lg:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/repairs" element={<Repairs />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/expenses" element={<Expenses />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
