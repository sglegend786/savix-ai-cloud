
const fs = require('fs');

const loginCode = \'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, setUser, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      router.push('/admin');
    }
  }, [user, loading, router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (email === 'admin@savix.ai' && password === 'godmode') {
      const adminData = {
        name: 'SAVIX Founder',
        email: 'admin@savix.ai',
        role: 'admin',
        token: 'mock-admin-token-123'
      };
      
      localStorage.setItem('savitri_token', adminData.token);
      localStorage.setItem('savitri_user', JSON.stringify(adminData));
      setUser(adminData);
      
      router.push('/admin');
    } else {
      setError('Invalid admin credentials. (Hint: admin@savix.ai / godmode)');
    }
  };

  if (loading) return null;

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-900 font-sans px-4'>
      <div className='w-full max-w-md bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700'>
        <div className='p-8 text-center border-b border-slate-700 bg-slate-800/50'>
          <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 shadow-lg shadow-indigo-500/30'>
            S
          </div>
          <h1 className='text-2xl font-black text-white tracking-wide'>God Mode</h1>
          <p className='text-slate-400 text-sm mt-1'>SAVIX Platform Command Center</p>
        </div>
        
        <div className='p-8'>
          {error && (
            <div className='bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm text-center'>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className='space-y-5'>
            <div>
              <label className='block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider'>Admin Email</label>
              <input 
                type='email' 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors'
                placeholder='founder@savix.ai'
                required
              />
            </div>
            <div>
              <label className='block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider'>Master Password</label>
              <input 
                type='password' 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors'
                placeholder='••••••••'
                required
              />
            </div>
            
            <button 
              type='submit'
              className='w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all mt-4'
            >
              Access Command Center
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}\;

const layoutCode = \'use client';
import { useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext';

export default function AdminLayout({ children }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (pathname === '/admin/login') {
        if (user?.role === 'admin') router.push('/admin');
      } else {
        if (user?.role !== 'admin') router.push('/admin/login');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) return null;
  if (pathname !== '/admin/login' && user?.role !== 'admin') return null;

  return <>{children}</>;
}\;

fs.writeFileSync('src/app/admin/login/page.js', loginCode, 'utf8');
fs.writeFileSync('src/app/admin/layout.js', layoutCode, 'utf8');

