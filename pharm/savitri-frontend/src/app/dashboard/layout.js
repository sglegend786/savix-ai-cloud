'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in
        router.replace('/login');
      } else if (user.role !== 'pharmacy_owner') {
        // Logged in but not a pharmacy owner (e.g. regular user)
        router.replace('/');
      } else {
        // Authorized!
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-teal-600 font-bold text-xl">Verifying Access...</div>
      </div>
    );
  }

  return <>{children}</>;
}
