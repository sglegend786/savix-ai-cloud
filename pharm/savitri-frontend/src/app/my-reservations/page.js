'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';

const STATUS_STEPS = ['Pending', 'Accepted', 'Ready for Pickup', 'Completed'];

const STATUS_META = {
  Pending:          { color: 'bg-amber-100 text-amber-800 border-amber-200',  icon: '⏳', label: 'Pending Confirmation' },
  Accepted:         { color: 'bg-blue-100 text-blue-800 border-blue-200',     icon: '✅', label: 'Order Accepted' },
  'Ready for Pickup': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '🏪', label: 'Ready for Pickup!' },
  Completed:        { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🎉', label: 'Completed' },
  Rejected:         { color: 'bg-red-100 text-red-800 border-red-200',        icon: '❌', label: 'Rejected' },
  Cancelled:        { color: 'bg-slate-100 text-slate-600 border-slate-200',  icon: '🚫', label: 'Cancelled' },
};

function StatusTracker({ status }) {
  const activeIdx = STATUS_STEPS.indexOf(status);
  if (activeIdx === -1) return null; // Rejected/Cancelled – no tracker
  return (
    <div className="flex items-center gap-0 mt-4">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all
            ${i < activeIdx ? 'bg-teal-600 border-teal-600 text-white' :
              i === activeIdx ? 'bg-teal-600 border-teal-600 text-white ring-4 ring-teal-100' :
              'bg-white border-slate-300 text-slate-400'}`}>
            {i < activeIdx ? '✓' : i + 1}
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`h-1 flex-1 transition-all ${i < activeIdx ? 'bg-teal-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function StepLabel({ status }) {
  const activeIdx = STATUS_STEPS.indexOf(status);
  if (activeIdx === -1) return null;
  return (
    <div className="flex justify-between mt-1.5">
      {STATUS_STEPS.map((step, i) => (
        <span key={step} className={`text-xs font-medium text-center flex-1 leading-tight px-0.5
          ${i === activeIdx ? 'text-teal-700 font-bold' : i < activeIdx ? 'text-teal-500' : 'text-slate-400'}`}
          style={{ fontSize: '10px' }}>
          {step === 'Ready for Pickup' ? 'Ready' : step}
        </span>
      ))}
    </div>
  );
}

const fetcher = async (url) => {
  const token = localStorage.getItem('savitri_token');
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function MyReservations() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [filter, setFilter] = useState('All');

  const [showAdherence, setShowAdherence] = useState(true);

  const { user, loading: authLoading } = useCustomerAuth();

  const handleRefill = () => {
    addToCart({
      medicineId: 'metformin_mock_123',
      medicineName: 'Metformin 500mg',
      pharmacyId: 'apollo_pharmacy',
      pharmacyName: 'Apollo Pharmacy',
      price: 150,
      quantity: 1,
    });
    router.push('/checkout');
  };

  const { data, error, isLoading } = useSWR('https://savix-pharmacy-api-sy7t.onrender.com/api/reservations', fetcher, { refreshInterval: 5000 });
  
  const reservations = data || [];
  const loading = isLoading;

  const filters = ['All', 'Pending', 'Accepted', 'Ready for Pickup', 'Completed', 'Rejected'];
  const filtered = filter === 'All' ? reservations : reservations.filter((r) => r.reservationStatus === filter);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-teal-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">My Orders</h1>
            <p className="text-xs text-slate-400">Track your medicine reservations</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* SAVIX Adherence Engine Widget */}
        {showAdherence && (
          <div className="mb-8 rounded-2xl border-2 border-[#1a2b6b] bg-gradient-to-br from-white to-blue-50 overflow-hidden shadow-md relative">
            <div className="bg-[#1a2b6b] px-5 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h2 className="font-extrabold text-lg">SAVIX Adherence Engine</h2>
              </div>
              <button 
                onClick={() => setShowAdherence(false)}
                className="text-white hover:text-gray-300 transition-colors"
                title="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-3 mb-5 text-sm">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-blue-900">
                  <span className="text-lg">🧠</span> 
                  <p><strong>AI Analysis:</strong> You purchased a 30-day supply of Metformin 500mg 28 days ago from Apollo Pharmacy. (Simulated Demo Data)</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-900 border border-amber-200">
                  <span className="text-lg">⚠️</span> 
                  <p><strong>Action Required:</strong> Refill due in 2 days.</p>
                </div>
              </div>
              <button 
                onClick={handleRefill}
                className="bg-[#1a2b6b] text-white font-bold py-3 px-6 rounded-full hover:bg-opacity-90 transition-all text-sm w-full shadow-md"
              >
                1-Click Refill
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full border transition-all shrink-0
                ${filter === f ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">No orders here</h3>
            <p className="text-slate-500 text-sm mb-6">
              {filter === 'All' ? "You haven't reserved any medicines yet." : `No orders with status "${filter}".`}
            </p>
            <Link href="/compare" className="inline-block bg-teal-600 text-white font-bold px-8 py-3 rounded-full hover:bg-teal-700 transition-colors text-sm">
              Search Medicines
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((res) => {
              const meta = STATUS_META[res.reservationStatus] || STATUS_META['Pending'];
              const isTerminal = ['Rejected', 'Cancelled'].includes(res.reservationStatus);
              return (
                <div key={res._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Top status bar */}
                  <div className={`px-5 py-2.5 flex items-center gap-2 border-b ${meta.color}`}>
                    <span className="text-base">{meta.icon}</span>
                    <span className="font-bold text-sm">{meta.label}</span>
                    <span className="ml-auto text-xs opacity-70">{new Date(res.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <div className="p-5">
                    {/* Pharmacy */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{res.pharmacyId?.pharmacyName || 'Pharmacy'}</h3>
                        {res.pharmacyId?.address && (
                          <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {res.pharmacyId.address}
                          </p>
                        )}
                        {res.pharmacyId?.pharmacyPhone && (
                          <p className="text-teal-600 text-xs font-semibold mt-0.5">📞 {res.pharmacyId.pharmacyPhone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-teal-700">₹{res.totalPrice}</div>
                        <div className="text-xs text-slate-400">Total</div>
                      </div>
                    </div>

                    {/* Medicines */}
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 mb-4">
                      {res.medicines.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-base">💊</span>
                            <span className="font-semibold text-slate-700">{item.medicineId?.medicineName || 'Medicine'}</span>
                            <span className="text-slate-400 text-xs">×{item.quantity}</span>
                          </div>
                          <span className="font-bold text-slate-700">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress Tracker */}
                    {!isTerminal && (
                      <>
                        <StatusTracker status={res.reservationStatus} />
                        <StepLabel status={res.reservationStatus} />
                      </>
                    )}

                    {/* Ready for Pickup alert */}
                    {res.reservationStatus === 'Ready for Pickup' && (
                      <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
                        <span className="text-2xl">🏪</span>
                        <div>
                          <p className="font-bold text-indigo-800 text-sm">Your medicines are ready!</p>
                          <p className="text-indigo-600 text-xs">Visit the pharmacy to collect your order.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
