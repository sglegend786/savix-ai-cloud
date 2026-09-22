"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('savitri_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to parse cart from local storage", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('savitri_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => {
      const medId = item.medicineId || item._id || item.id;
      const existing = prev.find((i) => (i.medicineId || i._id || i.id) === medId && i.pharmacyId === item.pharmacyId);
      if (existing) {
        return prev.map((i) => 
          ((i.medicineId || i._id || i.id) === medId && i.pharmacyId === item.pharmacyId) 
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, medicineId: medId, id: `${medId}-${item.pharmacyId}`, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
