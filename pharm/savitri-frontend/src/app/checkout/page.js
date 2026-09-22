"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';

export default function CheckoutPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const { cart, cartTotal, clearCart, removeFromCart } = useCart();
  const router = useRouter();

  const [deliveryType, setDeliveryType] = useState('Store Pickup');
  const [paymentMethod, setPaymentMethod] = useState('Pay on Delivery/Pickup');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const deliveryFee = deliveryType === 'Home Delivery' ? 40 : 0;
  const gstAmount = cartTotal * 0.12;
  const finalTotal = cartTotal + gstAmount + deliveryFee;

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setError('');

    try {
      const token = localStorage.getItem('savitri_token');
      if (!token) {
        throw new Error('You must be logged in to place an order.');
      }

      // We send a separate request for each item in the cart
      const promises = cart.map(item => {
        return fetch('http://localhost:5003/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            medicineId: item.medicineId,
            pharmacyId: item.pharmacyId,
            quantity: item.quantity,
            status: 'Pending',
            paymentMethod,
            fulfillment: deliveryType
          })
        });
      });

      const responses = await Promise.all(promises);
      const failed = responses.some(res => !res.ok);

      if (failed) {
        throw new Error('One or more reservations failed. Please try again or check your reservations page.');
      }

      clearCart();
      router.push('/my-reservations');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4 text-[#1a2b6b]">Your cart is empty</h2>
        <Link href="/compare">
          <button className="bg-[#1a2b6b] text-white px-6 py-2 rounded shadow hover:bg-[#121f4f] transition-colors">
            Go to Compare
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8 text-[#1a2b6b]">Checkout</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-6 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Order Summary */}
        <div className="flex-1 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 text-[#1a2b6b] border-b pb-2">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-[#1a2b6b] text-lg">
                    {item.name || item.medicineName || 'Medicine'} <span className="text-sm font-semibold text-slate-500 ml-1">x{item.quantity}</span>
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">{item.pharmacyName || 'Pharmacy'}</p>
                  
                  <div className="mt-2 text-sm text-gray-700 grid grid-cols-2 gap-y-1">
                    <span>Unit Price:</span>
                    <span className="font-medium text-right">₹{item.price}</span>
                    <span>Quantity:</span>
                    <span className="font-medium text-right">{item.quantity}</span>
                    <span>GST (12%):</span>
                    <span className="font-medium text-right text-gray-500">₹{(item.price * item.quantity * 0.12).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between ml-4">
                  <p className="font-bold text-[#1a2b6b] text-lg">
                    ₹{(item.price * item.quantity * 1.12).toFixed(2)}
                  </p>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 text-xs mt-2 hover:text-red-700 font-bold uppercase"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Estimated GST (12%)</span>
              <span>₹{(cartTotal * 0.12).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-[#1a2b6b] border-t border-slate-200 pt-3 mt-3">
              <span>Grand Total</span>
              <span>₹{(cartTotal * 1.12 + deliveryFee).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Delivery & Payment */}
        <div className="flex-1 bg-white p-6 rounded shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#1a2b6b] border-b pb-2">Fulfillment & Payment</h2>
            
            <div className="mb-6">
              <h3 className="font-medium mb-3">Delivery Type</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="deliveryType" 
                    value="Store Pickup"
                    checked={deliveryType === 'Store Pickup'}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="form-radio text-[#1a2b6b]"
                  />
                  <span>Store Pickup (Free)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="deliveryType" 
                    value="Home Delivery"
                    checked={deliveryType === 'Home Delivery'}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="form-radio text-[#1a2b6b]"
                  />
                  <span>Home Delivery (₹40)</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">Payment Method</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="Pay Online"
                    checked={paymentMethod === 'Pay Online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio text-[#1a2b6b]"
                  />
                  <span>Pay Online</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="Pay on Delivery/Pickup"
                    checked={paymentMethod === 'Pay on Delivery/Pickup'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio text-[#1a2b6b]"
                  />
                  <span>Pay on Delivery/Pickup</span>
                </label>
              </div>
            </div>
          </div>

          <button 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className={`w-full py-3 rounded text-white font-bold transition-colors ${
              isPlacingOrder ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a2b6b] hover:bg-[#121f4f]'
            }`}
          >
            {isPlacingOrder ? 'Placing Order...' : `Place Order • ₹${finalTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
