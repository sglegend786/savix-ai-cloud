'use client';

import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on page load
    const token = localStorage.getItem('savitri_token');
    const userData = localStorage.getItem('savitri_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      const res = await fetch('https://savix-pharmacy-api-sy7t.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // STRICT ROLE CHECK
        if (data.role !== role) {
          const errorMessage = data.role === 'pharmacy_owner' 
            ? "These credentials belong to a Pharmacy Owner account. Please select Pharmacy Owner to continue."
            : "These credentials belong to a Customer account. Please select Customer to continue.";
            
          return { 
            success: false, 
            message: errorMessage
          };
        }

        localStorage.setItem('savitri_token', data.token);
        localStorage.setItem('savitri_user', JSON.stringify(data));
        setUser(data);
        
        if (data.role === 'pharmacy_owner') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: 'Server connection error' };
    }
  };

  const register = async (payload) => {
    try {
      const res = await fetch('https://savix-pharmacy-api-sy7t.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('savitri_token', data.token);
        localStorage.setItem('savitri_user', JSON.stringify(data));
        setUser(data);
        
        if (data.role === 'pharmacy_owner') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
        return { success: true };
      } else {
        alert('Signup failed from backend: ' + (data.message || JSON.stringify(data)));
        return { success: false, message: data.message || 'Signup failed' };
      }
    } catch (error) {
      alert('Signup request completely failed. Is backend running? Error: ' + error.message);
      return { success: false, message: 'Server connection error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('savitri_token');
    localStorage.removeItem('savitri_user');
    setUser(null);
    window.location.replace('https://savix-ai-cloud.vercel.app/index.html?logout=true');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
