'use client';

import { useState, useRef, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

// ─── SVG Illustrations ────────────────────────────────────────────────────────
function PharmacyIllustration() {
  return (
    <svg viewBox="0 0 520 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background block */}
      <rect x="60" y="20" width="400" height="360" rx="24" fill="#E8ECF8"/>
      {/* Shelf back */}
      <rect x="90" y="50" width="340" height="280" rx="16" fill="white" opacity="0.9"/>
      {/* Shelf lines */}
      <rect x="90" y="120" width="340" height="6" rx="3" fill="#C5CBE8"/>
      <rect x="90" y="200" width="340" height="6" rx="3" fill="#C5CBE8"/>
      <rect x="90" y="280" width="340" height="6" rx="3" fill="#C5CBE8"/>
      {/* Medicine boxes row 1 */}
      <rect x="105" y="75" width="36" height="44" rx="6" fill="#1a2b6b"/>
      <rect x="148" y="80" width="30" height="39" rx="6" fill="#4A7BFF"/>
      <rect x="185" y="72" width="40" height="47" rx="6" fill="#E8ECF8" stroke="#1a2b6b" strokeWidth="2"/>
      <rect x="232" y="78" width="32" height="41" rx="6" fill="#6B8EFF"/>
      <rect x="271" y="75" width="36" height="44" rx="6" fill="#1a2b6b" opacity="0.7"/>
      <rect x="314" y="80" width="28" height="39" rx="6" fill="#4A7BFF" opacity="0.6"/>
      <rect x="349" y="74" width="38" height="45" rx="6" fill="#1a2b6b" opacity="0.4"/>
      {/* Medicine boxes row 2 */}
      <rect x="105" y="134" width="42" height="60" rx="6" fill="#4A7BFF" opacity="0.8"/>
      <circle cx="126" cy="162" r="8" fill="white" opacity="0.7"/>
      <rect x="155" y="138" width="30" height="55" rx="6" fill="#1a2b6b" opacity="0.9"/>
      <rect x="192" y="134" width="50" height="60" rx="6" fill="#E8ECF8" stroke="#4A7BFF" strokeWidth="2"/>
      <text x="217" y="169" textAnchor="middle" fontSize="9" fill="#1a2b6b" fontWeight="bold">+</text>
      <rect x="250" y="140" width="36" height="53" rx="6" fill="#6B8EFF"/>
      <rect x="294" y="134" width="32" height="60" rx="6" fill="#1a2b6b" opacity="0.5"/>
      <rect x="334" y="138" width="40" height="55" rx="6" fill="#4A7BFF" opacity="0.5"/>
      {/* Counter */}
      <rect x="90" y="296" width="340" height="54" rx="0" fill="#C5CBE8"/>
      <rect x="90" y="286" width="340" height="20" rx="6" fill="#1a2b6b" opacity="0.15"/>
      {/* Monitor */}
      <rect x="280" y="230" width="100" height="68" rx="8" fill="#1a2b6b" opacity="0.2"/>
      <rect x="285" y="235" width="90" height="55" rx="6" fill="#1a2b6b" opacity="0.6"/>
      <rect x="315" y="293" width="28" height="6" rx="3" fill="#1a2b6b" opacity="0.3"/>
      {/* Doctor figure */}
      <circle cx="185" cy="228" r="22" fill="#FFD5B8"/>
      <path d="M155 330 Q185 290 215 330" fill="#1a2b6b" opacity="0.9"/>
      <rect x="168" y="248" width="34" height="55" rx="8" fill="white" stroke="#C5CBE8" strokeWidth="2"/>
      {/* Cross on coat */}
      <rect x="181" y="262" width="8" height="18" rx="2" fill="#4A7BFF"/>
      <rect x="177" y="266" width="16" height="8" rx="2" fill="#4A7BFF"/>
      {/* Hair */}
      <path d="M163 228 Q185 200 207 228" fill="#2D2D2D" opacity="0.8"/>
    </svg>
  );
}

// ─── Nav Icon ─────────────────────────────────────────────────────────────────
function SearchIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const debounceRef = useRef(null);

  const fetchSuggestions = async (val) => {
    if (!val || val.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`http://localhost:5003/api/medicines/search-master?q=${encodeURIComponent(val)}&limit=7`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch { setSuggestions([]); }
  };

  const handleInput = (val) => {
    setInputValue(val);
    setShowSugg(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const [nearbyPharmacies, setNearbyPharmacies] = useState([]);
  const [trendingMeds, setTrendingMeds] = useState([]);
  const [locationStatus, setLocationStatus] = useState('finding'); // finding, found, denied

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationStatus('found');
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // 1. Fetch nearby pharmacies
            const pharmRes = await fetch(`http://localhost:5003/api/search/nearby-pharmacies?lat=${lat}&lng=${lng}&maxDistance=15000`);
            const pharmData = await pharmRes.json();
            if(pharmRes.ok) setNearbyPharmacies(pharmData.slice(0, 3)); // Top 3

            // 2. Fetch compare prices for a common med (e.g. Paracetamol)
            const medRes = await fetch(`http://localhost:5003/api/search/compare-prices?medicineName=Paracetamol&lat=${lat}&lng=${lng}&maxDistance=15000`);
            const medData = await medRes.json();
            if(medRes.ok) setTrendingMeds(medData.results?.slice(0, 3) || []);
          } catch(err) {
            console.error('Failed to fetch nearby data', err);
          }
        },
        (error) => {
          console.error("Location error:", error);
          setLocationStatus('denied');
        }
      );
    } else {
      setLocationStatus('denied');
    }
  }, []);

  const handleSearch = (query) => {
    const q = query || inputValue;
    if (!q) { router.push('/compare'); return; }
    setShowSugg(false);
    router.push(`/compare?q=${encodeURIComponent(q)}`);
  };

  const STATS = [
    { value: '500+', label: 'Local Pharmacies' },
    { value: '5,000+', label: 'Medicines Indexed' },
    { value: '100%', label: 'Price Transparent' },
    { value: 'Real-Time', label: 'Availability' },
  ];

  const FEATURES = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      title: 'Find Nearby',
      desc: 'Discover local pharmacies within your exact GPS location. Real distance, real availability.'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
      title: 'Compare Prices',
      desc: 'See the exact price of your medicine at every nearby pharmacy. Never overpay again.'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ),
      title: '🏆 Best Match',
      desc: 'AI combines price, distance, availability & rating to recommend the single best pharmacy.'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
      ),
      title: 'Scan Prescription',
      desc: 'Upload your doctor\'s prescription. AI reads it and instantly finds all medicines nearby.'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      ),
      title: 'Reserve & Pickup',
      desc: 'Reserve online. The pharmacy confirms it. Walk in and collect your medicines.'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      title: 'Live Status',
      desc: 'Track your order in real-time: Pending → Accepted → Ready for Pickup → Completed.'
    },
  ];

  const HOW = [
    { step: '01', icon: '🔍', title: 'Search or Scan', desc: 'Type a medicine name or upload your prescription photo.' },
    { step: '02', icon: '⚖️', title: 'Compare & Choose', desc: 'See all nearby pharmacies ranked by Best Match, Price, and Distance.' },
    { step: '03', icon: '✅', title: 'Reserve & Pickup', desc: 'Reserve your medicines. Walk in when ready. Done.' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════════ */}
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', gap: '8px', marginBottom: 0 }}>
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', fontWeight: '900', fontSize: '15px', fontFamily: 'sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Sx</span>
  <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px', color: '#0F172A', fontFamily: 'sans-serif', marginBottom: 0, lineHeight: 1 }}>SAVIX</span>
</Link>

            {/* Center Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-[#1a2b6b] border-b-2 border-[#1a2b6b] pb-0.5">Home</Link>
              <Link href="/compare" className="text-sm font-medium text-slate-500 hover:text-[#1a2b6b] transition-colors">Find Medicines</Link>
              <Link href="/compare" className="text-sm font-medium text-slate-500 hover:text-[#1a2b6b] transition-colors">Compare Prices</Link>
              <Link href="/scan" className="text-sm font-medium text-slate-500 hover:text-[#1a2b6b] transition-colors">Scan Rx</Link>
              {user?.role === 'customer' && (
                <Link href="/my-reservations" className="text-sm font-medium text-slate-500 hover:text-[#1a2b6b] transition-colors">My Orders</Link>
              )}
              {user?.role === 'pharmacy_owner' && (
                <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-[#1a2b6b] transition-colors">Dashboard</Link>
              )}
            </div>

            {/* Right Nav */}
            <div className="hidden md:flex items-center gap-3">
              {!user ? (
                <>
                  <Link href="/login" className="text-sm font-semibold text-[#1a2b6b] hover:text-[#4A7BFF] transition-colors px-4 py-2">Login</Link>
                  <Link href="/login" className="text-sm font-bold bg-[#1a2b6b] text-white px-5 py-2.5 rounded-xl hover:bg-[#0D1BD6] transition-colors">Register</Link>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-[#1a2b6b] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    Hi, {user.name?.split(' ')[0] || 'User'}
                  </div>
                  <button onClick={logout} className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">Logout</button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-slate-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div className="md:hidden pb-4 space-y-2 border-t border-slate-100 pt-3">
              {[
                { href: '/', label: 'Home' },
                { href: '/compare', label: 'Find Medicines' },
                { href: '/scan', label: 'Scan Prescription' },
                ...(user?.role === 'customer' ? [{ href: '/my-reservations', label: 'My Orders' }] : []),
                ...(user?.role === 'pharmacy_owner' ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
              ].map(link => (
                <Link key={link.href + link.label} href={link.href} onClick={() => setMobileMenu(false)}
                  className="block px-2 py-2 text-sm font-medium text-slate-600 hover:text-[#1a2b6b]">{link.label}</Link>
              ))}
              {!user ? (
                <Link href="/login" onClick={() => setMobileMenu(false)}
                  className="block w-full text-center bg-[#1a2b6b] text-white font-bold py-3 rounded-xl mt-2 text-sm">
                  Login / Register
                </Link>
              ) : (
                <button onClick={() => { logout(); setMobileMenu(false); }}
                  className="block w-full text-center text-red-500 font-medium py-2 text-sm">
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — Text + Search */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-[#1a2b6b] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#4A7BFF] rounded-full animate-pulse" />
              AI-Powered Local Pharmacy Network
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-[#1a2b6b] leading-[1.1] mb-5">
              Your Health,<br />
              <span className="text-[#4A7BFF]">Our Priority.</span>
            </h1>

            <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-lg">
              Search medicines, compare prices across local pharmacies, and reserve instantly — all in one place.
            </p>

            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="flex items-center gap-2 border-2 border-slate-200 hover:border-[#4A7BFF] focus-within:border-[#1a2b6b] rounded-2xl p-2 transition-colors bg-white shadow-sm">
                <div className="pl-2 text-slate-400">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                  placeholder="Search medicines, brands, salts..."
                  className="flex-1 py-2 px-2 text-slate-800 text-sm font-medium outline-none placeholder-slate-400 bg-transparent"
                />
                <button
                  onClick={() => handleSearch()}
                  className="bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shrink-0"
                >
                  Search
                </button>
              </div>

              {/* Autocomplete */}
              {showSugg && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button key={i} onMouseDown={() => handleSearch(s.name)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-center gap-3 transition-colors">
                      <span className="text-xl">💊</span>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.composition || ''} {s.manufacturer ? `• ${s.manufacturer}` : ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-xs text-slate-400 font-medium self-center">Popular:</span>
              {['Paracetamol', 'Azithromycin', 'Metformin', 'Cetirizine'].map(med => (
                <button key={med} onClick={() => handleSearch(med)}
                  className="text-xs font-semibold text-[#1a2b6b] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                  {med}
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href="/compare"
                className="flex items-center gap-2 bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-blue-900/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                Find Pharmacy
              </Link>
              <Link href="/scan"
                className="flex items-center gap-2 border-2 border-[#1a2b6b] text-[#1a2b6b] hover:bg-blue-50 font-bold px-7 py-3.5 rounded-xl transition-colors text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Scan Prescription
              </Link>
            </div>
          </div>

          {/* Right — Illustration */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-[#1a2b6b] rounded-3xl opacity-[0.07]" />
            <div className="relative bg-[#E8ECF8] rounded-3xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#1a2b6b] rounded-bl-[80px] opacity-10" />
              <div className="h-80">
                <PharmacyIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀🚀🚀 LOCAL INSIGHTS 🚀🚀🚀 */}
      {(locationStatus === 'finding' || nearbyPharmacies.length > 0) && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#1a2b6b]">Pharmacies Near You</h2>
                <p className="text-slate-500 text-sm mt-1">Based on your current location</p>
              </div>
              {locationStatus === 'finding' && (
                <div className="text-sm font-bold text-blue-600 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"/>
                  Locating...
                </div>
              )}
            </div>

            {nearbyPharmacies.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {nearbyPharmacies.map(p => (
                  <div key={p._id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-shadow bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{p.pharmacyName}</h3>
                    <p className="text-sm text-slate-500 mt-1">{p.address}</p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                      <span className="text-[#4A7BFF] font-black text-sm">{(p.distance / 1000).toFixed(1)} km away</span>
                      <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">Open: {p.openingTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {trendingMeds.length > 0 && (
              <>
                <h2 className="text-xl font-black text-[#1a2b6b] mb-4">Trending Deals Nearby: Paracetamol</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingMeds.map((med, i) => (
                    <div key={i} className="flex flex-col border border-slate-200 p-4 rounded-xl relative overflow-hidden group hover:border-[#4A7BFF] transition-colors">
                      {i === 0 && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg uppercase">Cheapest</div>}
                      <span className="text-xs text-slate-400 mb-1">{med.pharmacyName}</span>
                      <div className="flex justify-between items-end">
                        <span className="font-black text-xl text-slate-800">₹{med.price}</span>
                        <span className="text-xs font-bold text-[#4A7BFF]">{(med.distance / 1000).toFixed(1)} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ══ STATS BAR ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-[#1a2b6b] mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-[#1a2b6b] mb-3">Everything you need, in one platform</h2>
          <p className="text-slate-500 max-w-xl mx-auto">SAVIX-AI is not just a search engine. It's a complete pharmacy intelligence system.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={f.title}
              className={`rounded-2xl border p-6 hover:shadow-md transition-all group ${i === 2 ? 'bg-[#1a2b6b] border-[#1a2b6b] text-white' : 'bg-white border-slate-200 hover:border-[#4A7BFF]'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                ${i === 2 ? 'bg-white/20' : 'bg-blue-50 text-[#1a2b6b] group-hover:bg-[#1a2b6b] group-hover:text-white'}`}>
                {f.icon}
              </div>
              <h3 className={`font-bold text-lg mb-2 ${i === 2 ? 'text-white' : 'text-[#1a2b6b]'}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${i === 2 ? 'text-blue-200' : 'text-slate-500'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════════ */}
      <section className="bg-[#1a2b6b] py-20 px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">How it works</h2>
            <p className="text-blue-300 max-w-md mx-auto">Reserve your medicine in 3 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < HOW.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-2/3 w-full h-0.5 bg-white/20" />
                )}
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-blue-400 mb-1">{s.step}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PHARMACY OWNER CTA ══════════════════════════════════════════════════ */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-10 sm:p-16 text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-3xl font-black text-[#1a2b6b] mb-3">Are you a Pharmacy Owner?</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Register on SAVIX-AI and reach thousands of customers searching for medicines in your area. Manage inventory, track orders, and grow your business.
            </p>
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-[#1a2b6b] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#0D1BD6] transition-colors shadow-lg shadow-blue-900/20">
              Register Your Pharmacy →
            </Link>
          </div>
        </section>
      )}

      {/* ══ FOOTER ══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1a2b6b] flex items-center justify-center text-white font-black text-sm">S</div>
            <span className="font-black text-[#1a2b6b]">SAVIX-AI</span>
            <span className="text-slate-400 text-sm">Pharmacy</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 SAVIX-AI. AI-powered local pharmacy marketplace.</p>
          <div className="flex gap-5 text-sm text-slate-400">
            <Link href="/compare" className="hover:text-[#1a2b6b] transition-colors">Search</Link>
            <Link href="/login" className="hover:text-[#1a2b6b] transition-colors">Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
