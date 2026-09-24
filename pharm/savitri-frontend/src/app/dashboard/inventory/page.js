'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '../../../context/AuthContext';

export default function InventoryManagement() {
  const { user } = useContext(AuthContext);
  const [filter, setFilter] = useState('All');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [notified, setNotified] = useState({ rahul: false, priya: false });
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    category: '',
    manufacturer: '',
    strength: '',
    packSize: '',
    price: '',
    stockQuantity: '',
    prescriptionRequired: false,
    expiryDate: ''
  });

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('savitri_token');
      const res = await fetch('https://savix-pharmacy-api-sy7t.onrender.com/api/medicines/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map(m => ({
          id: m._id,
          name: m.medicineName,
          brand: m.manufacturer || m.brandName || 'Generic',
          strength: m.strength || '-',
          pack: m.packSize || '-',
          price: m.price,
          stock: m.stockQuantity,
          status: m.stockQuantity > 10 ? 'In Stock' : (m.stockQuantity > 0 ? 'Low Stock' : 'Out of Stock')
        }));
        setMedicines(formatted);
      }
    } catch (err) {
      console.error("Failed to load inventory");
    }
    setLoading(false);
  };

  // Fetch real inventory from backend
  useEffect(() => {
    fetchInventory();
  }, []);

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'medicineName') {
      if (value.length > 2) {
        try {
          const token = localStorage.getItem('savitri_token');
          const res = await fetch(`https://savix-pharmacy-api-sy7t.onrender.com/api/medicines/search-master?q=${value}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const selectSuggestion = (s) => {
    setFormData(prev => ({
      ...prev,
      medicineName: s.name,
      genericName: s.composition || '',
      manufacturer: s.manufacturer || '',
      packSize: s.packSize || '',
      price: s.price || prev.price
    }));
    setShowSuggestions(false);
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'pharmacy_owner') {
      alert('You must be logged in as a pharmacy owner');
      return;
    }
    
    try {
      const res = await fetch('https://savix-pharmacy-api-sy7t.onrender.com/api/medicines', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('savitri_token')}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stockQuantity: Number(formData.stockQuantity),
          availability: Number(formData.stockQuantity) > 10 ? 'In Stock' : (Number(formData.stockQuantity) > 0 ? 'Low Stock' : 'Out of Stock')
        })
      });
      
      if (res.ok) {
        alert('Medicine added to database successfully!');
        setIsModalOpen(false);
        setFormData({
          medicineName: '', genericName: '', category: '', manufacturer: '', strength: '', packSize: '', price: '', stockQuantity: '', prescriptionRequired: false, expiryDate: ''
        });
        fetchInventory();
      } else {
        const errorData = await res.json();
        alert('Error: ' + errorData.message);
      }
    } catch (err) {
      alert('Server error');
    }
  };

  const filteredMedicines = filter === 'All' 
    ? medicines 
    : medicines.filter(m => m.status && m.status.includes(filter));

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
          <Link href="/dashboard/inventory" className="flex items-center gap-3 bg-white/15 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-sm">
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0">
          <h2 className="text-xl font-bold text-[#1a2b6b]">Inventory Management</h2>
          <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            <span className="text-[#1a2b6b] font-bold">PO</span>
          </div>
        </header>

        {/* URGENT MANUFACTURER RECALL BANNER */}
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mx-6 sm:mx-8 mt-6 shadow-sm rounded-r-lg shrink-0">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-3 w-full">
              <h3 className="text-lg font-bold text-red-800">
                URGENT MANUFACTURER RECALL: Amoxicillin 250mg (Batch #BX-902). Contamination risk detected.
              </h3>
              <div className="mt-3">
                <button
                  onClick={() => setShowTrace(!showTrace)}
                  className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-red-700 transition-colors"
                >
                  Trace Affected Patients
                </button>
              </div>
              {showTrace && (
                <div className="mt-4 bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                  <p className="text-sm text-slate-600 mb-3 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    🔍 Tracing Batch #BX-902...
                  </p>
                  <ul className="space-y-3">
                    <li className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 gap-3">
                      <span className="text-red-900 font-medium text-sm">⚠️ Patient: Rahul Sharma (Purchased: Aug 12)</span>
                      <button
                        onClick={() => setNotified(prev => ({ ...prev, rahul: true }))}
                        className={`text-sm font-bold py-1.5 px-4 rounded-lg transition-colors shrink-0 ${
                          notified.rahul 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-white text-red-700 border border-red-200 hover:bg-red-50 shadow-sm'
                        }`}
                      >
                        {notified.rahul ? '✓ Notified via SMS' : '1-Click Notify'}
                      </button>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 gap-3">
                      <span className="text-red-900 font-medium text-sm">⚠️ Patient: Priya Singh (Purchased: Aug 14)</span>
                      <button
                        onClick={() => setNotified(prev => ({ ...prev, priya: true }))}
                        className={`text-sm font-bold py-1.5 px-4 rounded-lg transition-colors shrink-0 ${
                          notified.priya 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-white text-red-700 border border-red-200 hover:bg-red-50 shadow-sm'
                        }`}
                      >
                        {notified.priya ? '✓ Notified via SMS' : '1-Click Notify'}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-auto">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-96">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Search medicines by name or brand..." 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b] transition-shadow"
              />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#1a2b6b] text-white font-bold py-2.5 px-6 rounded-xl shadow-sm hover:bg-[#0D1BD6] transition-colors flex items-center gap-2 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add New Medicine
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f 
                  ? 'bg-[#1a2b6b] text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Medicine Info</th>
                    <th className="px-6 py-4">Pack Size</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock Qty</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">AI Decision</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMedicines.map((med) => (
                    <tr key={med.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1a2b6b] text-base">{med.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{med.brand} • {med.strength}</div>
                      </td>
                      <td className="px-6 py-4">{med.pack}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">₹{med.price}</td>
                      <td className="px-6 py-4 font-medium">{med.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          med.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                          med.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {med.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {med.stock < 20 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            🟢 BUY (Expected demand: ↑)
                          </span>
                        ) : med.stock >= 50 ? (
                          <div className="flex flex-col gap-2 items-start">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              ⚠️ EXPIRY RISK (High stock)
                            </span>
                            <button onClick={() => alert('Item listed on B2B Marketplace!')} className="text-xs bg-[#1a2b6b] text-white px-2 py-1 rounded shadow-sm hover:bg-[#0D1BD6] transition-colors">
                              Push to B2B
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            🔴 DON'T BUY (Low demand)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button className="text-[#4A7BFF] hover:text-[#1a2b6b] font-medium">Edit</button>
                        <button className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredMedicines.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        No medicines found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Add Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mt-auto sm:mt-0 sm:my-8 relative">
            <div className="px-6 py-4 flex justify-between items-center sticky top-0 bg-[#1a2b6b] text-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold">Add New Medicine</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddMedicine} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name *</label>
                  <input required name="medicineName" value={formData.medicineName} onChange={handleInputChange} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" placeholder="Start typing..." />
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map(s => (
                        <div key={s._id} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0">
                          <div className="font-bold text-[#1a2b6b]">{s.name}</div>
                          <div className="text-xs text-slate-500">{s.manufacturer} • {s.composition}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Generic Name</label>
                  <input name="genericName" value={formData.genericName} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                  <input name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Strength (e.g. 500mg)</label>
                  <input name="strength" value={formData.strength} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pack Size (e.g. 10 Tablets)</label>
                  <input name="packSize" value={formData.packSize} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input required type="number" min="0" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity *</label>
                  <input required type="number" min="0" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input type="date" required name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]" />
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" name="prescriptionRequired" checked={formData.prescriptionRequired} onChange={handleInputChange} className="w-4 h-4 text-[#1a2b6b] rounded focus:ring-[#1a2b6b]" />
                  <label className="text-sm font-medium text-slate-700">Prescription Required</label>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#1a2b6b] text-white font-bold rounded-xl hover:bg-[#0D1BD6]">Add Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
