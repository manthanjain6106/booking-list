// app/components/BookingForm.js (simplified version to highlight the key points)
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingForm({ room, property }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    adults: 1,
    child0to5: false,
    child6to10: false,
    numChild0to5: 0,
    numChild6to10: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Log props to verify data is coming through correctly
  console.log("BookingForm received room:", room);
  console.log("BookingForm received property:", property);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const bookingData = {
        ...formData,
        roomId: room._id,
        propertyId: room.property,
      };
      
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }
      
      const result = await response.json();
      router.push(`/booking/confirmation/${result.bookingId}`);
    } catch (error) {
      console.error("Booking error:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-2">Fill Your Details</h2>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div>
        <label className="block font-medium">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mt-1"
          required
        />
      </div>
      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mt-1"
          required
        />
      </div>
      <div>
        <label className="block font-medium">Mobile No</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mt-1"
          required
        />
      </div>
      <div>
        <label className="block font-medium">No. of Adults</label>
        <input
          type="number"
          name="adults"
          min={1}
          max={10}
          value={formData.adults}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mt-1"
          required
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="child0to5"
            checked={formData.child0to5}
            onChange={handleChange}
            className="mr-2"
          />
          0-5 Year Child (Free)
        </label>
        {formData.child0to5 && (
          <input
            type="number"
            name="numChild0to5"
            min={1}
            max={10}
            value={formData.numChild0to5}
            onChange={handleChange}
            className="w-16 border rounded px-2 py-1 ml-2"
            placeholder="Count"
          />
        )}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="child6to10"
            checked={formData.child6to10}
            onChange={handleChange}
            className="mr-2"
          />
          6-10 Year Child (Half Price)
        </label>
        {formData.child6to10 && (
          <input
            type="number"
            name="numChild6to10"
            min={1}
            max={10}
            value={formData.numChild6to10}
            onChange={handleChange}
            className="w-16 border rounded px-2 py-1 ml-2"
            placeholder="Count"
          />
        )}
      </div>
      {/* Pricing summary */}
      <div className="bg-gray-50 p-3 rounded text-sm">
        <div>0-5 Year Child: <span className="font-semibold">Free</span></div>
        <div>6-10 Year Child: <span className="font-semibold">Half Price</span></div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded mt-4 transition"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Booking..." : "Book Now"}
      </button>
    </form>
  );
}