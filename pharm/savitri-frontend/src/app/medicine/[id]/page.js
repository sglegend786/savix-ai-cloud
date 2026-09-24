'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 font-medium shrink-0 mr-4">{label}</span>
      <span className="text-sm text-slate-800 font-semibold text-right">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="font-extrabold text-slate-800 text-sm">{title}</h2>
      </div>
      <div className="px-5 py-3">{children}</div>
    </div>
  );
}

export default function MedicineDetailPage() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const res = await fetch(`https://savix-pharmacy-api-sy7t.onrender.com/api/medicines/master/${id}`);
        if (!res.ok) throw new Error('Medicine not found');
        const data = await res.json();
        setMedicine(data);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    if (id) fetchMedicine();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  if (error || !medicine) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="text-5xl">😕</div>
      <h2 className="font-bold text-slate-700">Medicine not found</h2>
      <Link href="/compare" className="text-teal-600 font-semibold hover:underline">← Search Medicines</Link>
    </div>
  );

  // Parse composition for quick summary
  const composition = medicine.composition || '';

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/compare" className="text-slate-500 hover:text-teal-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 leading-tight line-clamp-1">{medicine.name}</h1>
            <p className="text-xs text-slate-400">Medicine Information</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">💊</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-xl leading-tight">{medicine.name}</h2>
              {medicine.manufacturer && (
                <p className="text-teal-200 text-sm mt-0.5">by {medicine.manufacturer}</p>
              )}
              {medicine.type && (
                <span className="inline-block mt-2 bg-white/20 border border-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {medicine.type}
                </span>
              )}
            </div>
            {medicine.price && (
              <div className="text-right shrink-0">
                <div className="text-2xl font-extrabold">₹{medicine.price}</div>
                <div className="text-teal-200 text-xs">MRP</div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <Section title="Basic Information" icon="📋">
          <InfoRow label="Medicine Name" value={medicine.name} />
          <InfoRow label="Manufacturer" value={medicine.manufacturer} />
          <InfoRow label="Type / Form" value={medicine.type} />
          <InfoRow label="Pack Size" value={medicine.packSize} />
          <InfoRow label="MRP" value={medicine.price ? `₹${medicine.price}` : null} />
        </Section>

        {/* Composition */}
        {composition && (
          <Section title="Composition / Salt" icon="🔬">
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{composition}</p>
          </Section>
        )}

        {/* Usage Info (generic, not personalized) */}
        <Section title="General Information" icon="ℹ️">
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>This medicine belongs to the <strong>{medicine.type || 'pharmaceutical'}</strong> category.</p>
            {composition && (
              <p>The active composition is <strong>{composition}</strong>.</p>
            )}
            <p>Always consult your doctor or pharmacist before taking any medicine. Do not self-medicate.</p>
          </div>
        </Section>

        {/* Safety Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <h3 className="font-bold text-amber-800 text-sm mb-1">Important Safety Notice</h3>
            <p className="text-amber-700 text-xs leading-relaxed">
              SAVIX-AI provides general medicine information only. <strong>Dosage, frequency, and duration must only be prescribed by a qualified doctor.</strong> This information does not replace medical advice. Always read the label and consult your pharmacist.
            </p>
          </div>
        </div>

        {/* Storage */}
        <Section title="Storage Information" icon="🏷️">
          <div className="space-y-2 text-sm text-slate-600">
            <p>• Store in a cool, dry place away from direct sunlight.</p>
            <p>• Keep out of reach of children.</p>
            <p>• Do not use after the expiry date mentioned on the pack.</p>
          </div>
        </Section>

        {/* CTA */}
        <div className="pb-6">
          <Link
            href={`/compare?q=${encodeURIComponent(medicine.name)}`}
            className="block w-full bg-teal-600 text-white font-bold text-center py-4 rounded-2xl hover:bg-teal-700 transition-colors shadow-md"
          >
            🔍 Find {medicine.name} at Nearby Pharmacies
          </Link>
        </div>

      </div>
    </div>
  );
}
