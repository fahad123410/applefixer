import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Wrench,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    pendingRepairs: 0,
    completedRepairs: 0,
    lowStock: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => total += doc.data().total);
      setStats(prev => ({ ...prev, totalSales: total }));
      
      const salesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5);
      setRecentSales(salesData);
    });

    const unsubscribeExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => total += doc.data().amount);
      setStats(prev => ({ ...prev, totalExpenses: total }));
    });

    const unsubscribeRepairs = onSnapshot(collection(db, 'repairs'), (snapshot) => {
      let pending = 0;
      let completed = 0;
      snapshot.forEach(doc => {
        const status = doc.data().status;
        if (status === 'Pending' || status === 'In Progress') pending++;
        if (status === 'Completed') completed++;
      });
      setStats(prev => ({ ...prev, pendingRepairs: pending, completedRepairs: completed }));

      const repairsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5);
      setRecentRepairs(repairsData);
    });

    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      let low = 0;
      snapshot.forEach(doc => {
        if (doc.data().stock < 5) low++;
      });
      setStats(prev => ({ ...prev, lowStock: low }));
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
      unsubscribeRepairs();
      unsubscribeProducts();
    };
  }, []);

  const netProfit = stats.totalSales - stats.totalExpenses;

  const statCards = [
    { 
      name: 'Total Revenue', 
      value: stats.totalSales, 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      trend: '+12.5%',
      isCurrency: true
    },
    { 
      name: 'Total Expenses', 
      value: stats.totalExpenses, 
      icon: Wallet, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      trend: '-2.4%',
      isCurrency: true
    },
    { 
      name: 'Net Profit', 
      value: netProfit, 
      icon: CheckCircle2, 
      color: 'text-brand-600', 
      bg: 'bg-brand-50',
      trend: '+8.1%',
      isCurrency: true
    },
    { 
      name: 'Pending Repairs', 
      value: stats.pendingRepairs, 
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      trend: 'Active',
      isCurrency: false
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 mt-1">Welcome back, here's your business performance.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 card-shadow text-sm font-medium text-slate-600">
          <Clock size={16} className="text-slate-400" />
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[24px] card-shadow border border-slate-50 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={cn(stat.bg, "p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300")}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : 
                stat.trend.startsWith('-') ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={10} /> : 
                 stat.trend.startsWith('-') ? <ArrowDownRight size={10} /> : null}
                {stat.trend}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {stat.isCurrency ? `Rs. ${stat.value.toLocaleString()}` : stat.value}
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] card-shadow border border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Recent Sales</h3>
            <button className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {recentSales.length > 0 ? recentSales.map((sale, idx) => (
              <motion.div 
                key={sale.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    <ShoppingCart size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Order #{sale.id.slice(-4).toUpperCase()}</p>
                    <p className="text-xs font-medium text-slate-400">{new Date(sale.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">Rs. {sale.total.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">{sale.paymentMethod}</p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                  <ShoppingCart size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No sales recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] card-shadow border border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Active Repairs</h3>
            <button className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {recentRepairs.length > 0 ? recentRepairs.map((repair, idx) => (
              <motion.div 
                key={repair.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                      <Wrench size={16} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{repair.deviceModel}</p>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    repair.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                    repair.status === 'In Progress' ? "bg-brand-50 text-brand-600 border-brand-100" :
                    "bg-emerald-50 text-emerald-600 border-emerald-100"
                  )}>
                    {repair.status}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">{repair.customerName}</p>
                  <p className="text-xs font-bold text-slate-900">Rs. {repair.estimatedCost.toLocaleString()}</p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                  <Wrench size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No active repairs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
