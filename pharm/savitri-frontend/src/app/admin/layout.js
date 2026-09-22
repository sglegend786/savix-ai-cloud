
'use client';
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
}

