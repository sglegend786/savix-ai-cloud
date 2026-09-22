'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SSOHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Send token to our local backend to verify and get local token
      fetch('http://localhost:5003/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          // Store token and user with correct prefix
          localStorage.setItem('savitri_token', data.token);
          localStorage.setItem('savitri_user', JSON.stringify(data));
          // Role-based redirect
          if (data.role === 'admin') {
            window.location.replace('/admin');
          } else if (data.role === 'pharmacy_owner') {
            window.location.replace('/dashboard');
          } else {
            window.location.replace('/');
          }
        } else {
          setError(data.message || 'Failed to authenticate');
        }
      })
      .catch(err => {
        console.error('SSO Error:', err);
        setError('Error connecting to authentication server.');
      });
    } else {
      setError('No token provided.');
    }
  }, [searchParams, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h2>Authenticating via SchemeSathi SSO...</h2>
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
    </div>
  );
}

export default function SSOPage() {
  return (
    <Suspense fallback={<div>Loading SSO...</div>}>
      <SSOHandler />
    </Suspense>
  );
}
