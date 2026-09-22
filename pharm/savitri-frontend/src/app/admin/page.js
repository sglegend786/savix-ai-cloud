"use client";

import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5003/api';

export default function SuperAdminDashboard() {
  const [pharmacies, setPharmacies] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [token, setToken] = useState("");
  
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', address: '', city: 'Prayagraj' });

  useEffect(() => {
    const t = localStorage.getItem('savitri_token');
    setToken(t);
    if (t) fetchPharmacies(t);
  }, []);

  const fetchPharmacies = async (t) => {
    try {
      const res = await fetch(API_URL + '/pharmacies', {
        headers: { Authorization: "Bearer " + t }
      });
      const data = await res.json();
      setPharmacies(Array.isArray(data) ? data : data.pharmacies || []);
    } catch (err) {
      console.error(err);
      showToast("Error loading pharmacies");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!token) return;
    try {
      const res = await fetch(API_URL + '/pharmacies/admin-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: "Bearer " + token },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          phone: addForm.phone,
          location: {
             address: addForm.address,
             city: addForm.city,
             state: 'UP',
             zipCode: '211001',
             coordinates: { type: 'Point', coordinates: [81.8463, 25.4358] }
          }
        })
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Pharmacy added successfully!");
      setAddForm({ name: '', email: '', phone: '', address: '', city: 'Prayagraj' });
      fetchPharmacies(token);
    } catch (err) {
      console.error(err);
      showToast("Error adding pharmacy");
    }
  };

  const handleDelete = async (id, name) => {
    if(!confirm("Delete " + name + " and all its medicines?")) return;
    try {
      const res = await fetch(API_URL + '/pharmacies/admin-delete/' + id, {
        method: 'DELETE',
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) throw new Error("Failed");
      showToast(name + " Deleted.");
      fetchPharmacies(token);
    } catch (err) {
      console.error(err);
      showToast("Error deleting pharmacy");
    }
  };

  const handleVerify = async (id, name) => {
    try {
      const res = await fetch(API_URL + '/pharmacies/admin-verify/' + id, {
        method: 'PUT',
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      showToast("Verification toggled for " + name);
      fetchPharmacies(token);
    } catch (err) {
      console.error(err);
      showToast("Error verifying pharmacy");
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  return (
    <div className="flex min-h-screen font-sans text-slate-800 bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6">
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', gap: '8px', marginBottom: 0 }}>
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', fontWeight: '900', fontSize: '15px', fontFamily: 'sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Sx</span>
  <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px', color: '#0F172A', fontFamily: 'sans-serif', marginBottom: 0, lineHeight: 1 }}>SAVIX</span>
</a>
          <p className="text-xs text-slate-400 mt-1">Super-Admin</p>
        </div>
        <nav className="mt-6 flex-1">
          <a href="#" className="block py-3 px-6 bg-slate-800 text-indigo-300 border-l-4 border-indigo-500">Dashboard</a>
          <a href="/" className="block py-3 px-6 hover:bg-slate-800 transition-colors">Home</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">Pharmacy Command Center</h1>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Pharmacy</h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input type="text" placeholder="Pharmacy Name" className="border p-2 rounded" required value={addForm.name} onChange={e=>setAddForm({...addForm, name: e.target.value})} />
              <input type="email" placeholder="Owner Email" className="border p-2 rounded" required value={addForm.email} onChange={e=>setAddForm({...addForm, email: e.target.value})} />
              <input type="text" placeholder="Phone Number" className="border p-2 rounded" required value={addForm.phone} onChange={e=>setAddForm({...addForm, phone: e.target.value})} />
              <input type="text" placeholder="Address" className="border p-2 rounded" required value={addForm.address} onChange={e=>setAddForm({...addForm, address: e.target.value})} />
              <input type="text" placeholder="City" className="border p-2 rounded" required value={addForm.city} onChange={e=>setAddForm({...addForm, city: e.target.value})} />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg font-bold">Add Pharmacy</button>
            </form>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Manage Pharmacies ({pharmacies.length})</h2>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Pharmacy Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pharmacies.length > 0 ? pharmacies.map((pharmacy) => (
                  <tr key={pharmacy._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{pharmacy.pharmacyName}</td>
                    <td className="px-6 py-4 text-slate-600">{pharmacy.address}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{pharmacy.pharmacyPhone}<br/><span className="text-xs text-slate-400">License: {pharmacy.licenseNumber}</span></td>
                    <td className="px-6 py-4">
                      {pharmacy.verificationStatus === 'verified' ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">Verified</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleVerify(pharmacy._id, pharmacy.pharmacyName)} className={`px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-bold ${pharmacy.verificationStatus === 'verified' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
                          {pharmacy.verificationStatus === 'verified' ? 'Unverify' : 'Verify'}
                        </button>
                        <button onClick={() => handleDelete(pharmacy._id, pharmacy.pharmacyName)} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-bold">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="text-center p-4">No pharmacies found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl z-50">
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
