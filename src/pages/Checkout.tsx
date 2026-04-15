import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const adData = location.state?.adData;

  if (!adData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">No ad data found.</h2>
        <button onClick={() => navigate('/post-ad')} className="mt-4 text-green-700">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-black mb-6">Checkout</h1>
      <div className="bg-white p-6 rounded-3xl shadow-sm border">
        <h2 className="text-xl font-bold mb-2">{adData.title}</h2>
        <p className="text-orange-600 font-bold mb-4">Featured Ad Plan: 7 Days</p>
        <p className="text-gray-600 mb-6">Price: {adData.price} PKR</p>
        <button className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold">
          Pay Now
        </button>
      </div>
    </div>
  );
}