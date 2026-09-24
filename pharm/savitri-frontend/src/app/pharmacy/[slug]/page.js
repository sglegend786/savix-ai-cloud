'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCart } from '../../../context/CartContext';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function PharmacyPublicPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('Info');
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submitReviewError, setSubmitReviewError] = useState('');
  const [submitReviewSuccess, setSubmitReviewSuccess] = useState(false);
  
  // Medicines state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
      import('leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css');
      import('leaflet-defaulticon-compatibility');
    }
  }, []);

  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await fetch(`https://savix-pharmacy-api-sy7t.onrender.com/api/pharmacies/slug/${slug}`);
        if (!res.ok) {
          setError('Pharmacy not found');
        } else {
          const data = await res.json();
          setPharmacy(data);
        }
      } catch (err) {
        setError('Server error');
      }
      setLoading(false);
    };
    fetchPharmacy();
  }, [slug]);

  useEffect(() => {
    if (pharmacy && pharmacy._id) {
      const fetchReviews = async () => {
        setReviewLoading(true);
        try {
          const res = await fetch(`https://savix-pharmacy-api-sy7t.onrender.com/api/reviews?pharmacyId=${pharmacy._id}`);
          if (res.ok) {
            const data = await res.json();
            setReviews(data.data || data);
          }
        } catch (err) {
          console.error(err);
        }
        setReviewLoading(false);
      };
      fetchReviews();
    }
  }, [pharmacy]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitReviewError('');
    setSubmitReviewSuccess(false);
    
    // Use token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setSubmitReviewError('You must be logged in to submit a review.');
      return;
    }

    try {
      const res = await fetch('https://savix-pharmacy-api-sy7t.onrender.com/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pharmacyId: pharmacy._id,
          rating: ratingInput,
          comment: commentInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitReviewError(data.message || 'Failed to submit review');
      } else {
        setSubmitReviewSuccess(true);
        setCommentInput('');
        setRatingInput(5);
        
        // Refresh reviews
        const revRes = await fetch(`https://savix-pharmacy-api-sy7t.onrender.com/api/reviews?pharmacyId=${pharmacy._id}`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData.data || revData);
        }
      }
    } catch (err) {
      setSubmitReviewError('Server error while submitting review');
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-500' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#1a2b6b]/30 border-t-[#1a2b6b] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !pharmacy) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex flex-col justify-center items-center text-slate-500">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <Link href="/compare" className="text-[#1a2b6b] hover:underline">Return to Search</Link>
      </div>
    );
  }
  
  const totalMedicines = pharmacy.medicines?.length || 0;
  const filteredMedicines = (pharmacy.medicines || []).filter(med => 
    med.medicineName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isOpen = true; // Placeholder for actual opening/closing time logic
  
  const mapCenter = pharmacy.location?.coordinates ? [pharmacy.location.coordinates[1], pharmacy.location.coordinates[0]] : null;

  return (
    <div className="min-h-screen bg-[#F0F4FF] text-slate-800 font-sans pb-12">
      {/* 1. Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/compare" className="text-[#1a2b6b] hover:text-[#0D1BD6] font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Search
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1a2b6b] flex items-center justify-center text-white font-bold">S</div>
            <span className="font-bold text-slate-800">SAVIX-AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* 2. Pharmacy Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Top Banner Gradient */}
          <div className="bg-gradient-to-r from-[#1a2b6b] to-[#2d4399] p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{pharmacy.pharmacyName}</h1>
                  {pharmacy.verificationStatus === 'verified' && (
                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm border border-white/30">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center text-amber-400 font-bold mt-2 gap-2">
                  <div className="flex items-center">{renderStars(Math.round(pharmacy.rating || 4))}</div>
                  <span className="text-white/80 font-medium text-sm">({pharmacy.rating || '4.0'})</span>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 bg-[#0D1BD6]/40 border border-white/20 px-3 py-1.5 rounded-lg text-sm text-white font-medium backdrop-blur-sm">
                  ⭐ SAVIX Reliability: {pharmacy.reliabilityScore || 96}/100 (Based on stock accuracy & fulfillment)
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6">
            {/* Info Section */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 text-slate-700">
                <svg className="w-5 h-5 text-[#1a2b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                <span className="font-medium">{pharmacy.pharmacyPhone || pharmacy.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <svg className="w-5 h-5 text-[#1a2b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{pharmacy.openingTime || '8:00 AM'} - {pharmacy.closingTime || '10:00 PM'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <svg className="w-5 h-5 text-[#1a2b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span>{pharmacy.address}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              <a href={`tel:${pharmacy.pharmacyPhone || pharmacy.phone}`} className="bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold py-3 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                Call Pharmacy
              </a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.location?.coordinates?.[1]},${pharmacy.location?.coordinates?.[0]}`} target="_blank" rel="noreferrer" className="bg-white border-2 border-[#1a2b6b] hover:bg-slate-50 text-[#1a2b6b] font-bold py-3 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Get Directions
              </a>
            </div>
          </div>
        </div>

        {/* 3. Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-center">
            <div className="text-slate-500 text-sm font-medium mb-1">Total Medicines</div>
            <div className="text-2xl font-bold text-[#1a2b6b]">{totalMedicines}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-center">
            <div className="text-slate-500 text-sm font-medium mb-1">Rating</div>
            <div className="text-2xl font-bold text-[#1a2b6b]">{pharmacy.rating || '4.0'} / 5</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-center">
            <div className="text-slate-500 text-sm font-medium mb-1">Status</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{isOpen ? 'Open Now' : 'Closed'}</div>
          </div>
        </div>

        {/* 4. Tab Navigation */}
        <div className="flex border-b border-slate-300 mb-6 overflow-x-auto pb-px">
          {['Info', 'Medicines', 'Reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 font-bold text-sm transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-b-2 border-[#1a2b6b] text-[#1a2b6b]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 min-h-[400px]">
          
          {/* 5. Info Tab */}
          {activeTab === 'Info' && (
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-6">Pharmacy Information</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">License Number</div>
                    <div className="font-medium text-slate-800">{pharmacy.licenseNumber || 'Not provided'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Business Hours</div>
                    <div className="font-medium text-slate-800">{pharmacy.openingTime || '8:00 AM'} - {pharmacy.closingTime || '10:00 PM'}</div>
                    <div className="text-sm text-emerald-600 font-medium mt-1">Open 7 days a week</div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500 mb-1">Contact</div>
                    <div className="font-medium text-slate-800">{pharmacy.pharmacyPhone || pharmacy.phone}</div>
                    <div className="font-medium text-slate-800 mt-1">{pharmacy.email || 'N/A'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500 mb-2">Location</div>
                  <div className="font-medium text-slate-800 mb-4">{pharmacy.address}</div>
                  
                  {mapCenter && typeof window !== 'undefined' ? (
                    <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0 relative mb-4">
                      <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                        <Marker position={mapCenter}>
                          <Popup>
                            <div className="font-bold">{pharmacy.pharmacyName}</div>
                            <div className="text-xs text-slate-500">{pharmacy.address}</div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                      Loading Map...
                    </div>
                  )}
                  
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.location?.coordinates?.[1]},${pharmacy.location?.coordinates?.[0]}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-xl transition-colors w-full"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Open in Google Maps
                  </a>
                  
                  {pharmacy.location?.coordinates && (
                    <div className="mt-4 text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded">
                      Coordinates: {pharmacy.location.coordinates[1]}, {pharmacy.location.coordinates[0]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 6. Medicines Tab */}
          {activeTab === 'Medicines' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Available Medicines</h3>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Search inventory..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b6b] focus:border-transparent transition-all" 
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {(!pharmacy.medicines || pharmacy.medicines.length === 0) ? (
                   <div className="text-center py-12 flex flex-col items-center">
                     <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                     <p className="text-slate-500 mb-4">No medicines available in stock.</p>
                     <button className="bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold py-2 px-6 rounded-xl transition-colors">
                       Request Medicines
                     </button>
                   </div>
                ) : filteredMedicines.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No matching medicines found.</div>
                ) : (
                  filteredMedicines.map((med) => (
                    <div key={med._id} className="py-4 flex justify-between items-center hover:bg-slate-50 transition-colors px-4 rounded-xl -mx-4">
                      <div>
                        <div className="font-bold text-slate-800 text-lg">{med.medicineName}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="font-bold text-[#1a2b6b] text-lg">₹{med.price}</div>
                        <div className={`text-xs font-bold px-3 py-1.5 rounded-full w-24 text-center border ${
                          med.availability === 'In Stock' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {med.availability}
                        </div>
                        <button
                          onClick={() => {
                            addToCart({
                              ...med,
                              pharmacyId: pharmacy._id,
                              pharmacyName: pharmacy.pharmacyName
                            });
                            alert('Added to cart!');
                          }}
                          className="bg-[#1a2b6b] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#0D1BD6] transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 7. Reviews Tab */}
          {activeTab === 'Reviews' && (
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-6">Customer Reviews</h3>
              
              {/* Write Review Form */}
              <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4">Write a Review</h4>
                <form onSubmit={handleReviewSubmit}>
                  {submitReviewError && <div className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{submitReviewError}</div>}
                  {submitReviewSuccess && <div className="text-emerald-600 text-sm mb-3 bg-emerald-50 p-2 rounded">Review submitted successfully!</div>}
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => setRatingInput(star)}
                          className="focus:outline-none"
                        >
                          <svg className={`w-8 h-8 ${star <= ratingInput ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300'} transition-colors`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Comment</label>
                    <textarea 
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      rows="3" 
                      className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1a2b6b] focus:border-transparent transition-all text-sm"
                      placeholder="Share your experience with this pharmacy..."
                      required
                    ></textarea>
                  </div>
                  
                  <button type="submit" className="bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm">
                    Submit Review
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviewLoading ? (
                   <div className="text-center py-8 text-slate-500">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-medium">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  reviews.map((review, idx) => (
                    <div key={review._id || idx} className="bg-white border border-slate-200 p-5 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-800">
                          {review.customer?.name || review.user?.name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <div className="flex mb-3">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
