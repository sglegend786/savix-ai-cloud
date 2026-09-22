'use client';

import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useContext(AuthContext) || {};
  const router = useRouter();

  const handleLogout = () => {
    if (logout) {
      logout();
    }
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex flex-col justify-center items-center text-slate-500">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your profile</h2>
        <button onClick={() => router.push('/')} className="text-[#1a2b6b] hover:underline font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF] text-slate-800 font-sans pb-12">
      <header className="bg-[#1a2b6b] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">My Profile</h1>
          <button 
            onClick={handleLogout}
            className="text-sm font-bold text-red-100 hover:text-white bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Personal Details */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1a2b6b] mb-4 border-b pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Full Name</p>
              <p className="font-semibold text-slate-800 text-lg">{user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email Address</p>
              <p className="font-semibold text-slate-800">{user.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone Number</p>
              <p className="font-semibold text-slate-800">{user.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Role</p>
              <p className="font-semibold text-slate-800 capitalize">{user.role || 'Customer'}</p>
            </div>
          </div>
        </section>

        {/* Saved Addresses (Mock) */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1a2b6b] mb-4 border-b pb-2">Saved Addresses</h2>
          <div className="space-y-4">
            <div className="border border-slate-100 rounded-xl p-4 hover:border-[#1a2b6b] transition-colors bg-slate-50">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-[#1a2b6b]/10 text-[#1a2b6b] text-xs font-bold px-2 py-1 rounded">Home</span>
              </div>
              <p className="font-semibold text-slate-800">123 Main St, Tech Park, Prayagraj</p>
              <p className="text-sm text-slate-500 mt-1">Uttar Pradesh, 211002</p>
            </div>
            
            <div className="border border-slate-100 rounded-xl p-4 hover:border-[#1a2b6b] transition-colors bg-slate-50">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-[#1a2b6b]/10 text-[#1a2b6b] text-xs font-bold px-2 py-1 rounded">Work</span>
              </div>
              <p className="font-semibold text-slate-800">45 Business Hub, Civil Lines, Prayagraj</p>
              <p className="text-sm text-slate-500 mt-1">Uttar Pradesh, 211001</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
