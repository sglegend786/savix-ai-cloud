'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function PharmacyDashboard() {
  const { logout } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    inStockMedicines: 0,
    lowStockMedicines: 0,
    outOfStockMedicines: 0,
    todaysReservations: 0,
    pendingRequests: 0,
    confirmedReservations: 0,
    completedReservations: 0
  });
  const [charts, setCharts] = useState({
    revenueData: [],
    popularMedicines: [],
    lowStockAlerts: []
  });

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Hi! I'm your SAVIX Business Copilot. Ask me anything." }
  ]);

  const [temperature, setTemperature] = useState(4.2);
  const [isPowerOut, setIsPowerOut] = useState(false);

  useEffect(() => {
    let interval;
    if (isPowerOut) {
      interval = setInterval(() => {
        setTemperature((prev) => {
          if (prev >= 12.5) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1.5;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPowerOut]);

  const handleCopilotChipClick = (question) => {
    setChatHistory(prev => [...prev, { role: 'user', text: question }]);
    setTimeout(() => {
      let response = "I'm looking into that for you.";
      if (question === "Why did my profit fall?") {
        response = "Sales decreased 8% this week compared to last. The biggest contributors were lower sales in Category X and stock-outs of Paracetamol.";
      } else if (question === "What should I reorder?") {
        response = "Based on local demand trends, you should immediately reorder Medicine A and Medicine B, as they are frequently searched in your area but currently out of stock.";
      }
      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    }, 600);
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('savitri_token');
        if (!token) return;

        const res = await fetch('https://savix-pharmacy-api-sy7t.onrender.com/api/pharmacies/dashboard/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalMedicines: data.totalMedicines || 0,
            inStockMedicines: data.inStockMedicines || 0,
            lowStockMedicines: data.lowStockMedicines || 0,
            outOfStockMedicines: data.outOfStockMedicines || 0,
            todaysReservations: data.todaysReservations || 0,
            pendingRequests: data.pendingRequests || 0,
            confirmedReservations: data.confirmedReservations || 0,
            completedReservations: data.completedReservations || 0
          });
          if (data.charts) {
            setCharts(data.charts);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard stats');
      }
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1a2b6b] border-r border-[#1a2b6b] hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1a2b6b] font-bold">S</div>
          <h1 className="text-xl font-bold text-white">Savitri Portal</h1>
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col justify-between">
          <div className="space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 bg-white/15 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Dashboard / Analytics
            </Link>
            <Link href="/dashboard/inventory" className="flex items-center gap-3 text-blue-200 hover:bg-white/10 px-4 py-3 rounded-xl font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              Inventory
            </Link>
            <Link href="/dashboard/reservations" className="flex items-center gap-3 text-blue-200 hover:bg-white/10 px-4 py-3 rounded-xl font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              Reservations
            </Link>
            <Link href="/dashboard/b2b" className="flex items-center gap-3 text-blue-200 hover:bg-white/10 px-4 py-3 rounded-xl font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              B2B Network
            </Link>
          </div>
          <div>
            <button onClick={logout} className="flex items-center gap-3 text-red-300 hover:bg-red-500/20 px-4 py-3 rounded-xl font-medium transition-colors w-full text-left mt-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8">
          <h2 className="text-xl font-bold text-[#1a2b6b]">Pharmacy Dashboard</h2>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-[#1a2b6b]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=Pharmacy+Owner&background=1a2b6b&color=fff" alt="Profile" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-auto">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-black text-[#1a2b6b] mb-1">Welcome back to your Dashboard</h3>
              <p className="text-slate-500">Here is what's happening with your store today.</p>
            </div>
            <button className="bg-[#1a2b6b] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#0D1BD6] transition-colors hidden sm:flex items-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add Medicine
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Medicines */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1a2b6b] flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Medicines</p>
                  <h4 className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.totalMedicines}</h4>
                </div>
              </div>
            </div>

            {/* In Stock */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">In Stock</p>
                  <h4 className="text-2xl font-bold text-emerald-600">{loading ? '...' : (stats.inStockMedicines + stats.lowStockMedicines)}</h4>
                </div>
              </div>
            </div>

            {/* Out of Stock */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Out of Stock</p>
                  <h4 className="text-2xl font-bold text-red-600">{loading ? '...' : stats.outOfStockMedicines}</h4>
                </div>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                  <h4 className="text-2xl font-bold text-amber-600">{loading ? '...' : stats.pendingRequests}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-[#1a2b6b] mb-4">Revenue Trend (Last 7 Days)</h3>
              <div className="h-72">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.revenueData}>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#1a2b6b" strokeWidth={3} dot={{ fill: '#1a2b6b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-[#1a2b6b] mb-4">Top Selling Medicines</h3>
              <div className="h-72">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.popularMedicines} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Alerts Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Inventory Alerts
              </h3>
              <Link href="/dashboard/inventory" className="text-sm font-medium text-[#1a2b6b] hover:underline">Manage Inventory</Link>
            </div>
            <div className="p-0">
              {loading ? (
                <div className="p-6 text-center text-slate-400">Loading alerts...</div>
              ) : charts.lowStockAlerts && charts.lowStockAlerts.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {charts.lowStockAlerts.map((alert, index) => (
                    <li key={index} className="p-4 px-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-medium text-slate-800">{alert.name}</span>
                      </div>
                      <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        Only {alert.stockQuantity} left
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-slate-500">No low stock alerts at this time.</div>
              )}
            </div>
          </div>

          {/* Unmet Demand Section */}
          <div className="bg-[#1a2b6b] rounded-2xl shadow-sm border border-[#1a2b6b] overflow-hidden mb-8 text-white">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Lost-Sales & Unmet Demand Intelligence
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
                <p className="font-medium text-lg">
                  You lost 27 potential medicine requests this week because of stock-outs. Estimated lost revenue: <span className="text-yellow-400 font-bold">₹3,450</span>.
                </p>
              </div>
              <h4 className="text-sm font-bold text-blue-200 mb-3 uppercase tracking-wider">Top Local Demand (Not in your stock)</h4>
              <div className="bg-white text-slate-800 rounded-xl overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  <li className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-[#1a2b6b]">Medicine A</div>
                      <div className="text-sm text-slate-500">11 local searches</div>
                    </div>
                    <button className="text-sm font-bold bg-[#1a2b6b] text-white px-4 py-2 rounded-lg hover:bg-[#0D1BD6] transition-colors">
                      Order from Supplier
                    </button>
                  </li>
                  <li className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-[#1a2b6b]">Medicine B</div>
                      <div className="text-sm text-slate-500">8 local searches</div>
                    </div>
                    <button className="text-sm font-bold bg-[#1a2b6b] text-white px-4 py-2 rounded-lg hover:bg-[#0D1BD6] transition-colors">
                      Order from Supplier
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cold-Chain IoT Monitor Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1a2b6b] flex items-center gap-2">
                ❄️ Cold-Chain IoT Monitor
              </h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl font-black text-[#1a2b6b]">
                      {temperature.toFixed(1)}°C
                    </div>
                    <div>
                      {temperature <= 8 ? (
                        <div className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200 inline-block">
                          ✅ Safe (2°C - 8°C). Insulin & Vaccines are secure.
                        </div>
                      ) : (
                        <div className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-200 animate-pulse inline-block">
                          🚨 CRITICAL: Temperature exceeded 8°C! 14 units of Insulin have been automatically quarantined and removed from the public storefront.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsPowerOut(true)}
                    disabled={isPowerOut}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${isPowerOut ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                  >
                    Simulate Power Outage
                  </button>
                  <button 
                    onClick={() => {
                      setIsPowerOut(false);
                      setTemperature(4.2);
                    }}
                    disabled={!isPowerOut && temperature === 4.2}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${!isPowerOut && temperature === 4.2 ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                  >
                    Restore Power
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Business Copilot Widget */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {isCopilotOpen && (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 mb-4 overflow-hidden flex flex-col h-96 transition-all transform origin-bottom-right">
              <div className="bg-[#1a2b6b] p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-bold">SAVIX Business Copilot</h3>
                </div>
                <button onClick={() => setIsCopilotOpen(false)} className="text-blue-200 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'ai' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' : 'bg-[#1a2b6b] text-white rounded-tr-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap gap-2">
                <button onClick={() => handleCopilotChipClick("Why did my profit fall?")} className="text-xs bg-blue-50 text-[#1a2b6b] px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors font-medium">
                  Why did my profit fall?
                </button>
                <button onClick={() => handleCopilotChipClick("What should I reorder?")} className="text-xs bg-blue-50 text-[#1a2b6b] px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors font-medium">
                  What should I reorder?
                </button>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className="w-14 h-14 bg-[#1a2b6b] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#0D1BD6] transition-transform hover:scale-105"
          >
            {isCopilotOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <span className="text-2xl">✨</span>
            )}
          </button>
        </div>

      </main>
    </div>
  );
}
