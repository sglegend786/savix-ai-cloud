'use client';

import { useEffect } from 'react';

export default function Login() {
  useEffect(() => {
    window.location.replace("http://127.0.0.1:8080/index.html");
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
      <h2 className="text-xl font-bold text-[#1a2b6b]">Redirecting to Savix AI...</h2>
      <p className="text-slate-500 mt-2">Authentication is centrally managed by SAVIX-AI.</p>
    </div>
  );
}
