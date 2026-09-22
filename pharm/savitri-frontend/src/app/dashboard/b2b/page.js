'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function B2BDashboard() {
  const [b2bItems] = useState([
    {
      id: 1,
      type: 'request',
      pharmacy: 'Pharmacy A',
      item: 'Amoxicillin',
      quantity: 50,
      description: 'Needs: 50x Amoxicillin',
      actionText: 'Fulfill Request'
    },
    {
      id: 2,
      type: 'surplus',
      pharmacy: 'Pharmacy B',
      item: 'Metformin',
      quantity: 100,
      description: 'Pushed surplus: 100x Metformin (Expiring in 60 days)',
      actionText: 'Claim at 30% discount'
    }
  ]);

  const handleAction = (item) => {
    alert(`Action taken on ${item.item} from ${item.pharmacy}`);
  };

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
          <Link href="/dashboard/inventory" className="flex items-center gap-3 text-blue-200 hover:bg-white/10 px-4 py-3 rounded-xl font-medium transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            Inventory
          </Link>
          <Link href="/dashboard/reservations" className="flex items-center gap-3 text-blue-200 hover:bg-white/10 px-4 py-3 rounded-xl font-medium transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            Reservations
          </Link>
          <Link href="/dashboard/b2b" className="flex items-center gap-3 bg-white/15 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
            B2B Network
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0">
          <h2 className="text-xl font-bold text-[#1a2b6b]">B2B Marketplace & Expiry Rescue</h2>
        </header>

        <div className="p-6 sm:p-8 flex-1 overflow-auto">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-[#1a2b6b] mb-1">Pharmacy Network</h3>
            <p className="text-slate-500">Connect with other pharmacies to share surplus stock or fulfill shortages.</p>
          </div>

          <div className="grid gap-6">
            {b2bItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-800">{item.pharmacy}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.type === 'request' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.type === 'request' ? 'Shortage Request' : 'Surplus Available'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1a2b6b]">{item.item}</h3>
                  <p className="text-slate-600 mt-1">{item.description}</p>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-3">
                  <button onClick={() => handleAction(item)} className="px-6 py-2.5 bg-[#1a2b6b] text-white font-bold rounded-xl hover:bg-[#0D1BD6] transition-colors shadow-sm">
                    {item.actionText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
