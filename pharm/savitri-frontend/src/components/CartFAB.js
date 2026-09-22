"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

export default function CartFAB() {
  const { cart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || cart.length === 0) return null;

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/checkout" className="fixed bottom-6 right-6 z-50">
      <div className="relative bg-[#1a2b6b] text-white p-4 rounded-full shadow-lg hover:bg-[#121f4f] transition-colors cursor-pointer flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
          {itemCount}
        </span>
      </div>
    </Link>
  );
}
