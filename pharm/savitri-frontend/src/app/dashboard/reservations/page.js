'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = async (url) => {
  const token = localStorage.getItem('savitri_token');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export default function Reservations() {
  const [filter, setFilter] = useState('Pending');

  const { data: reservations = [], mutate, isLoading: loading } = useSWR(
    'https://savix-pharmacy-api-sy7t.onrender.com/api/reservations', 
    fetcher, 
    { refreshInterval: 5000 }
  );

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('savitri_token');
      const res = await fetch(`https://savix-pharmacy-api-sy7t.onrender.com/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const filteredReservations = filter === 'All' 
    ? reservations 
    : reservations.filter(r => r.reservationStatus === filter);

  return (
    <div className="min-h-screen bg-[#F0F4FF] text-slate-800 font-sans flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1a2b6b] border-r border-[#1a2b6b] hidden md:flex flex-col text-white">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1a2b6b] font-bold">S</div>
          <h1 className="text-xl font-bold text-white">Savitri Portal</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 text-blue-200 hover:bg-white/10 px-4 py-3 rounded-xl font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </Link>
          <Link href="/dashboard/reservations" className="flex items-center gap-3 bg-white/15 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            Reservations
          </Link>
          <Link href="/dashboard/b2b" className="flex items-center gap-3 text-blue-200 hover:bg-white/10 px-4 py-3 rounded-xl font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
            B2B Network
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0">
          <h2 className="text-xl font-bold text-[#1a2b6b]">Manage Reservations</h2>
        </header>

        <div className="p-6 sm:p-8 flex-1 overflow-auto">
          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['All', 'Pending', 'Accepted', 'Ready for Pickup', 'Completed', 'Cancelled'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f ? 'bg-[#1a2b6b] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredReservations.map((res) => (
              <div key={res._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-800">#{res._id.slice(-6).toUpperCase()}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      res.reservationStatus === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      res.reservationStatus === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                      res.reservationStatus === 'Ready for Pickup' ? 'bg-indigo-100 text-indigo-800' :
                      res.reservationStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {res.reservationStatus}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1a2b6b]">Customer <span className="text-sm font-normal text-slate-500 ml-2">{res.customerContact || 'No contact'}</span></h3>
                  <p className="text-slate-600 mt-1">
                    {res.medicines?.map(m => m.medicineId?.medicineName || 'Medicine').join(', ') || 'Unknown items'}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">{new Date(res.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="text-2xl font-extrabold text-slate-800">₹{res.totalPrice || 0}</div>
                  <div className="flex gap-2">
                    {res.reservationStatus === 'Pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(res._id, 'Rejected')} className="px-4 py-2 bg-white border border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50">Reject</button>
                        <button onClick={() => handleUpdateStatus(res._id, 'Accepted')} className="px-4 py-2 bg-[#1a2b6b] text-white font-bold rounded-xl hover:bg-[#0D1BD6]">Accept Order</button>
                      </>
                    )}
                    {res.reservationStatus === 'Accepted' && (
                      <button onClick={() => handleUpdateStatus(res._id, 'Ready for Pickup')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Mark Ready for Pickup</button>
                    )}
                    {res.reservationStatus === 'Ready for Pickup' && (
                      <button onClick={() => handleUpdateStatus(res._id, 'Completed')} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Mark Completed</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReservations.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <div className="text-slate-500 mb-4">No reservations found with status "{filter}".</div>
                <button onClick={() => setFilter('All')} className="bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold py-2 px-4 rounded-xl">View All Reservations</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
