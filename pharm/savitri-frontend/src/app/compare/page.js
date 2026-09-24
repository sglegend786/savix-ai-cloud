'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const StarIcon = () => (
  <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// ─── Pharmacy Card ─────────────────────────────────────────────────────────────
function PharmacyCard({ pharmacy, userLocation, badge, badgeColor, onAddToCart }) {
  const directionsLink = userLocation && pharmacy.lat && pharmacy.lng
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${pharmacy.lat},${pharmacy.lng}&travelmode=driving`
    : '#';

  const isOpen = pharmacy.isOpenNow;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all ${badge === 'bestMatch' ? 'border-[#4A7BFF] ring-2 ring-[#4A7BFF]/30' : 'border-slate-200'}`}>
      {/* Badge */}
      {badge && (
        <div className={`px-4 py-2 rounded-t-2xl text-xs font-bold flex items-center gap-1.5 ${badgeColor}`}>
          {badge === 'bestMatch' && <span>🏆 BEST MATCH — Lowest Price + Nearest</span>}
          {badge === 'cheapest' && <span>💰 LOWEST PRICE</span>}
          {badge === 'nearest' && <span>📍 NEAREST PHARMACY</span>}
        </div>
      )}

      <div className="p-4">
        {/* Top Row */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{pharmacy.name}</h3>
              {pharmacy.verificationStatus === 'verified' && (
                <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-semibold shrink-0">✓ Verified</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {isOpen ? '🟢 Open Now' : '🔴 Closed'}
              </span>
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <LocationIcon />
                <span className="font-medium text-slate-700">{pharmacy.distanceLabel || pharmacy.distance}</span>
              </span>
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <StarIcon />
                <span className="font-medium text-slate-700">{pharmacy.rating || '—'}</span>
              </span>
              <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">⭐ SAVIX Trust: {pharmacy.reliabilityScore || 94}/100</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            {pharmacy.totalPrice != null ? (
              <>
                <div className="text-3xl font-extrabold text-[#1a2b6b]">₹{pharmacy.totalPrice}</div>
                <div className={`text-xs font-bold mt-0.5 ${pharmacy.availability === 'In Stock' ? 'text-emerald-600' : pharmacy.availability === 'Low Stock' ? 'text-amber-600' : 'text-red-500'}`}>
                  {pharmacy.availability}
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-400 font-medium">No price listed</div>
            )}
          </div>
        </div>

        {/* Best Match Score Tags */}
        {badge === 'bestMatch' && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg font-medium">✓ Best Price</span>
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg font-medium">✓ Close to You</span>
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg font-medium">✓ Available</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
          <a
            href={directionsLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 font-semibold py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Directions
          </a>
          <button
            onClick={() => onAddToCart(pharmacy)}
            disabled={!pharmacy.totalPrice}
            className="flex items-center justify-center gap-1.5 bg-[#1a2b6b] text-white font-bold py-2 rounded-xl hover:bg-[#0D1BD6] transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Add to Cart
          </button>
          <Link
            href={`/pharmacy/${pharmacy.slug}`}
            className="flex items-center justify-center gap-1.5 bg-slate-800 text-white font-bold py-2 rounded-xl hover:bg-slate-900 transition-colors text-sm"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <h2 className="font-extrabold text-slate-800 text-lg leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
function CompareContent() {
  const searchParams = useSearchParams();
  const { user } = useContext(AuthContext) || {};
  const { addToCart } = useCart();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support Voice Search. Please use Chrome.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Use en-IN or hi-IN to allow English & Hindi
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      
      // Simple NLP Extractor for Hinglish/English Voice Commands
      let extractedMedicine = transcript.toLowerCase();
      const stopwords = ["mujhe", "chahiye", "chaahiye", "ki", "ka", "dawa", "davai", "medicine", "khojo", "dhundo", "mere", "ghar", "ke", "paas", "mil", "jayega", "kya", "hai", "please", "give", "me", "i", "need", "want", "some", "for"];
      stopwords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        extractedMedicine = extractedMedicine.replace(regex, '');
      });
      extractedMedicine = extractedMedicine.replace(/[^\w\s]/gi, '').trim();
      
      // Fallback to original transcript if the NLP stripped everything
      const finalQuery = extractedMedicine.length > 1 ? extractedMedicine : transcript;

      setInputValue(finalQuery);
      if (sugDebounceRef.current) clearTimeout(sugDebounceRef.current);
      setSearchQuery(finalQuery);
      setShowSuggestions(false);
      setIsListening(false);
    };

    recognition.onerror = (e) => {
      console.error("Voice Error", e);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const [byPrice, setByPrice] = useState([]);
  const [byDistance, setByDistance] = useState([]);
  const [bestMatch, setBestMatch] = useState(null);
  const [nearbyPharmacies, setNearbyPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Getting location...');
  const [radius, setRadius] = useState(10000); // meters
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

  const debounceRef = useRef(null);
  const sugDebounceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
      import('leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css');
      import('leaflet-defaulticon-compatibility');
    }
  }, []);

  // ── 1. Get Location ──────────────────────────────────────────────────────────
  useEffect(() => {
    // For demo purposes, we will always default to Prayagraj so the seeded data shows up
    // regardless of the user's actual physical location.
    setLocation({ lat: 25.4420, lng: 81.8136 });
    setLocationLabel('Prayagraj (Demo Mode)');
  }, []);

  // ── 2. Medicine Autocomplete ─────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (val) => {
    if (!val || val.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://savix-pharmacy-api-sy7t.onrender.com/api/medicines/search-master?q=${encodeURIComponent(val)}&limit=8`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch { setSuggestions([]); }
  }, []);

  const handleInputChange = (val) => {
    setInputValue(val);
    setSelectedMedicine(null);
    if (sugDebounceRef.current) clearTimeout(sugDebounceRef.current);
    sugDebounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
    setShowSuggestions(true);
    if (!val) setSearchQuery('');
  };

  const handleSelectSuggestion = (med) => {
    setInputValue(med.name);
    setSearchQuery(med.name);
    setSelectedMedicine(med);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSearch = () => {
    setSearchQuery(inputValue);
    setShowSuggestions(false);
  };

  // ── 3. Fetch Pharmacies ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!location) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (searchQuery) {
          // Compare mode
          const url = `https://savix-pharmacy-api-sy7t.onrender.com/api/search/compare-prices?medicineName=${encodeURIComponent(searchQuery)}&lat=${location.lat}&lng=${location.lng}&maxDistance=${radius}`;
          const res = await fetch(url);
          const data = await res.json();

          const format = (arr) =>
            (arr || []).map((med) => ({
              id: med.pharmacyId?._id,
              medicineId: med._id,
              name: med.pharmacyId?.pharmacyName || 'Unknown',
              slug: med.pharmacyId?.slug || '',
              totalPrice: med.price,
              rating: med.pharmacyId?.rating || 0,
              availability: med.availability,
              distance: med.distanceLabel,
              distanceLabel: med.distanceLabel,
              distanceKm: med.distanceKm,
              isOpenNow: med.isOpenNow,
              verificationStatus: med.pharmacyId?.verificationStatus,
              lat: med.pharmacyId?.location?.coordinates[1],
              lng: med.pharmacyId?.location?.coordinates[0],
              bestMatchScore: med.bestMatchScore,
              reliabilityScore: med.reliabilityScore,
            }));

          setByPrice(format(data.byPrice));
          setByDistance(format(data.byDistance));
          setBestMatch(data.bestMatch ? format([data.bestMatch])[0] : null);
          setNearbyPharmacies([]);
        } else {
          // Nearby mode (no search query)
          const url = `https://savix-pharmacy-api-sy7t.onrender.com/api/search/nearby-pharmacies?lat=${location.lat}&lng=${location.lng}&maxDistance=${radius}`;
          const res = await fetch(url);
          const data = await res.json();

          if (Array.isArray(data)) {
            setNearbyPharmacies(
              data.map((p) => ({
                id: p._id,
                name: p.pharmacyName,
                slug: p.slug,
                distanceLabel: p.distanceLabel,
                distanceKm: p.distanceKm,
                rating: p.rating,
                isOpenNow: p.isOpenNow,
                verificationStatus: p.verificationStatus,
                totalPrice: null,
                availability: 'Check In-Store',
                lat: p.location?.coordinates[1],
                lng: p.location?.coordinates[0],
              }))
            );
          }
          setByPrice([]);
          setByDistance([]);
          setBestMatch(null);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [location, searchQuery, radius]);

  // ── 4. Add to Cart ───────────────────────────────────────────────────────────────
  const handleAddToCart = (pharmacy) => {
    if (!pharmacy.medicineId) {
      alert('Cannot add from this card — please search for a specific medicine first.');
      return;
    }
    addToCart({
      _id: pharmacy.medicineId,
      medicineName: searchQuery,
      price: pharmacy.totalPrice,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name
    });
    alert('Added to cart!');
  };

  const hasSearchResults = searchQuery && (byPrice.length > 0 || byDistance.length > 0);
  
  // Deduplicate map pharmacies
  const allMapPharmacies = searchQuery ? [bestMatch, ...byPrice, ...byDistance].filter(Boolean) : nearbyPharmacies;
  const mapPharmacies = Array.from(new Map(allMapPharmacies.map(p => [p.id, p])).values());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* ── HEADER ── */}
      <header className="bg-[#1a2b6b] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">

          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="hover:bg-[#0D1BD6] p-2 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-extrabold leading-none">SAVIX-AI Pharmacy</h1>
              <div className="flex items-center gap-1 text-teal-200 text-xs mt-0.5">
                <LocationIcon />
                <span>{locationLabel}</span>
              </div>
            </div>
          </div>

          {/* Search + Autocomplete */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-teal-300">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white placeholder-teal-200 focus:bg-white focus:text-slate-800 focus:placeholder-slate-400 outline-none transition-all text-sm"
                  placeholder="Search medicines, brands, salts..."
                />
                {inputValue && (
                  <button
                    onClick={() => { setInputValue(''); setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                    className="absolute inset-y-0 right-10 flex items-center text-teal-300 hover:text-white px-2"
                    title="Clear"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={startVoiceSearch}
                  className={`absolute inset-y-0 right-2 flex items-center px-2 transition-colors ${isListening ? 'text-red-400 animate-pulse' : 'text-teal-300 hover:text-white'}`}
                  title="Voice Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-3 bg-white text-[#1a2b6b] font-bold hover:bg-blue-50 rounded-xl transition-colors text-sm shrink-0"
              >
                Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-64 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">💊</span>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.generic || s.genericName || ''} {s.manufacturer ? `• ${s.manufacturer}` : ''}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Radius Selector & View Mode */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-teal-200 text-xs font-medium">Radius:</span>
              {[1000, 5000, 10000, 20000].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${radius === r ? 'bg-white text-[#1a2b6b]' : 'bg-teal-700/50 text-teal-100 hover:bg-teal-700'}`}
                >
                  {r / 1000}km
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1 bg-teal-800/50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`text-xs px-3 py-1 rounded-md font-semibold transition-colors ${viewMode === 'list' ? 'bg-white text-[#1a2b6b]' : 'text-teal-100 hover:text-white hover:bg-teal-700/50'}`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`text-xs px-3 py-1 rounded-md font-semibold transition-colors ${viewMode === 'map' ? 'bg-white text-[#1a2b6b]' : 'text-teal-100 hover:text-white hover:bg-teal-700/50'}`}
              >
                Map View
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-[#1a2b6b] rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Finding pharmacies near you...</p>
          </div>

        ) : !hasSearchResults && nearbyPharmacies.length === 0 && !searchQuery ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-200">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No pharmacies found nearby</h3>
            <p className="text-sm">Try increasing your radius or allow location access.</p>
          </div>

        ) : !hasSearchResults && searchQuery ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-200">
            <div className="text-5xl mb-4">😕</div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No pharmacies carry "{searchQuery}" nearby</h3>
            <p className="text-sm">Try a wider radius or a different medicine name.</p>
          </div>
          
        ) : viewMode === 'map' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[400px] relative z-0">
            {typeof window !== 'undefined' && location && (
              <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                
                <CircleMarker center={[location.lat, location.lng]} radius={8} pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}>
                   <Popup>Your Location</Popup>
                </CircleMarker>
                
                {mapPharmacies.map((p, i) => {
                  if (!p.lat || !p.lng) return null;
                  return (
                    <Marker key={`${p.id}-${i}`} position={[p.lat, p.lng]}>
                      <Popup>
                        <div className="text-sm min-w-[200px] p-1">
                          <div className="font-bold text-lg mb-1 leading-tight">{p.name}</div>
                          <div className="text-slate-600 mb-3 text-xs">{p.distanceLabel || ''} • <span className={p.isOpenNow ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>{p.isOpenNow ? 'Open Now' : 'Closed'}</span></div>
                          {p.totalPrice && <div className="font-extrabold text-[#1a2b6b] text-xl mb-3">₹{p.totalPrice}</div>}
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={!p.totalPrice}
                            className="w-full bg-[#1a2b6b] text-white font-bold py-2 rounded-lg hover:bg-[#0D1BD6] disabled:opacity-50 transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        ) : searchQuery ? (
          <>
            {/* ── BEST MATCH ── */}
            {bestMatch && (
              <div>
                <PharmacyCard
                  pharmacy={bestMatch}
                  userLocation={location}
                  badge="bestMatch"
                  badgeColor="bg-gradient-to-r from-[#1a2b6b] to-[#4A7BFF] text-white"
                  onAddToCart={handleAddToCart}
                />
              </div>
            )}

            {/* ── TWO COLUMN: Price + Distance ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lowest Price */}
              <div>
                <SectionHeader icon="💰" title="Lowest Price" subtitle="Sorted by price ↑" />
                <div className="space-y-3">
                  {byPrice.map((p, i) => (
                    <PharmacyCard
                      key={p.id + '-price-' + i}
                      pharmacy={p}
                      userLocation={location}
                      badge={i === 0 && bestMatch?.id !== p.id ? 'cheapest' : null}
                      badgeColor="bg-amber-50 text-amber-800 border-b border-amber-100"
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </div>

              {/* Nearest */}
              <div>
                <SectionHeader icon="📍" title="Nearest Pharmacy" subtitle="Sorted by distance ↑" />
                <div className="space-y-3">
                  {byDistance.map((p, i) => (
                    <PharmacyCard
                      key={p.id + '-dist-' + i}
                      pharmacy={p}
                      userLocation={location}
                      badge={i === 0 && bestMatch?.id !== p.id ? 'nearest' : null}
                      badgeColor="bg-indigo-50 text-indigo-800 border-b border-indigo-100"
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>

        ) : (
          // ── NEARBY MODE (no search) ──
          <>
            <SectionHeader icon="🏥" title="Nearby Pharmacies" subtitle={`${nearbyPharmacies.length} pharmacies found within ${radius / 1000}km`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nearbyPharmacies.map((p, i) => (
                <PharmacyCard
                  key={p.id + i}
                  pharmacy={p}
                  userLocation={location}
                  badge={i === 0 ? 'nearest' : null}
                  badgeColor="bg-indigo-50 text-indigo-800 border-b border-indigo-100"
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Wrapper with Suspense ─────────────────────────────────────────────────────
export default function PharmacySearch() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-[#1a2b6b] rounded-full animate-spin" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
