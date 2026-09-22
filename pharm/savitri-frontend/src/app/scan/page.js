'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PrescriptionScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMedicines, setScannedMedicines] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [error, setError] = useState(null);
  const [manualText, setManualText] = useState('');

  // Dynamically load Tesseract.js from CDN
  useEffect(() => {
    if (!document.getElementById('tesseract-script')) {
      const script = document.createElement('script');
      script.id = 'tesseract-script';
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      document.body.appendChild(script);
    }
  }, []);

  const processTextWithBackend = async (textToProcess) => {
    try {
      const response = await fetch('http://localhost:5003/api/search/match-prescription-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess })
      });
      const result = await response.json();
      
      if (result && result.length > 0) {
        setScannedMedicines(result);
      } else {
        setScannedMedicines([]);
        setError('No medicines found in this prescription. Please try another image or add manually.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to scan prescription.');
      setScannedMedicines([]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setFileUploaded(true);
    setIsScanning(true);
    setError(null);
    processTextWithBackend(manualText);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!e.target.files || e.target.files.length === 0) return;
    
    setFileUploaded(true);
    setIsScanning(true);
    setError(null);
    
    try {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      
      let extractedText = "";
      
      if (window.Tesseract) {
        const { data } = await window.Tesseract.recognize(imageUrl, 'eng', { logger: m => console.log(m) });
        extractedText = data.text;
      } else {
        throw new Error("Tesseract library failed to load");
      }
      
      await processTextWithBackend(extractedText);
    } catch (err) {
      console.error(err);
      setError('Failed to scan image. Make sure you have an active internet connection for OCR.');
      setIsScanning(false);
    }
  };

  const removeMedicine = (id) => setScannedMedicines(scannedMedicines.filter(m => m.id !== id));

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-[#1a2b6b] transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1a2b6b] flex items-center justify-center text-white font-black text-sm">S</div>
            <div>
              <h1 className="text-lg font-black text-[#1a2b6b] leading-none">Scan Prescription</h1>
              <p className="text-xs text-slate-400">AI-powered medicine extraction</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Upload Area */}
        {!fileUploaded && (
            <div className="bg-white border-2 border-dashed border-[#4A7BFF] rounded-3xl p-14 text-center hover:border-[#1a2b6b] hover:bg-blue-50/30 transition-all">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#1a2b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              </div>
              <h3 className="text-2xl font-black text-[#1a2b6b] mb-2">Upload your prescription</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Supports JPG, PNG, and PDF files. Our AI will extract all medicines automatically.</p>
  
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <label className="bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold py-3.5 px-8 rounded-xl cursor-pointer transition-colors shadow-lg shadow-blue-900/20">
                  Select from Gallery
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                </label>
                <button className="border-2 border-[#1a2b6b] text-[#1a2b6b] hover:bg-blue-50 font-bold py-3.5 px-8 rounded-xl transition-colors">
                  Use Camera
                </button>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <h4 className="text-sm font-bold text-slate-500 mb-3">OR PASTE TEXT</h4>
                <textarea 
                  value={manualText} 
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste your medical report or prescription text here..."
                  className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A7BFF] text-sm"
                />
                <button 
                  onClick={handleTextSubmit}
                  className="mt-3 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors w-full"
                >
                  Analyze Text
                </button>
              </div>
  
              <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400">
                <span>✓ JPG / PNG</span>
                <span>✓ PDF</span>
                <span>✓ Raw Text OK</span>
              </div>
            </div>
        )}

        {/* Error Toast */}
        {error && !isScanning && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            <p className="font-bold">{error}</p>
            <button onClick={() => {setFileUploaded(false); setError(null);}} className="mt-2 text-sm underline hover:text-red-800">Try again</button>
          </div>
        )}

        {/* Scanning */}
        {isScanning && (
          <div className="bg-white rounded-3xl p-14 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-[#1a2b6b] rounded-full animate-spin mx-auto mb-6"/>
            <h3 className="text-xl font-black text-[#1a2b6b]">SAVIX-AI is reading your prescription...</h3>
            <p className="text-slate-400 mt-2 text-sm">Extracting medicine names, strengths, and dosages.</p>
          </div>
        )}

        {/* Results */}
        {fileUploaded && !isScanning && !error && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h2 className="font-black text-emerald-800">Medicines Detected</h2>
                <p className="text-emerald-600 text-xs">Please verify before searching pharmacies.</p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {scannedMedicines.map((med) => (
                <div key={med.id} className="border border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:border-[#4A7BFF] transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💊</span>
                    <div>
                      <h4 className="font-bold text-[#1a2b6b]">{med.name} <span className="text-[#4A7BFF] text-sm font-semibold">{med.strength}</span></h4>
                      <p className="text-slate-400 text-xs mt-0.5">{med.dosage} · {med.frequency} · Qty: {med.quantity}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Edit</button>
                    <button onClick={() => removeMedicine(med.id)} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 pt-0">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 flex gap-2">
                <span>⚠️</span>
                <p className="text-amber-700 text-xs">Always verify detected medicines with your doctor or pharmacist before purchasing.</p>
              </div>
              <Link
                href={`/compare?q=${scannedMedicines.length > 0 ? encodeURIComponent(scannedMedicines[0].name) : ''}`}
                className="flex items-center justify-center gap-2 bg-[#1a2b6b] hover:bg-[#0D1BD6] text-white font-bold py-4 px-8 rounded-2xl w-full shadow-lg transition-colors"
              >
                Find Pharmacies for These Medicines
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
