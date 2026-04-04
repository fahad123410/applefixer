import { useState, useEffect, FormEvent } from 'react';
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
  ChevronRight,
  Mail,
  Lock,
  UserPlus,
  LogIn
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0e8de9&color=fff`} 
                alt={user.displayName || 'User'} 
                className="w-10 h-10 rounded-xl border-2 border-white shadow-sm"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || user.email?.split('@')[0]}</p>
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createUserProfile = async (user: User, name?: string) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: name || user.displayName || user.email?.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        role: 'user', // Default role
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);
    } catch (error: any) {
      setError(error.message);
      console.error("Login failed:", error);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
        await createUserProfile(userCredential.user, displayName);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await createUserProfile(userCredential.user);
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Auth failed:", error);
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
          <div className="inline-flex p-5 bg-brand-50 rounded-[24px] mb-6">
            <Smartphone className="text-brand-600" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">AppleFixer</h1>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">Complete management system for phone shops and repair centers.</p>
          
          <form onSubmit={handleEmailAuth} className="space-y-4 text-left mb-6">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-sm font-medium"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="email" 
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-sm font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 text-center px-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-brand-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 active:scale-[0.98]"
            >
              {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-4 bg-white border border-slate-100 text-slate-700 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Google Account
          </button>

          <p className="mt-8 text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-brand-600 font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Create one now'}
            </button>
          </p>
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
