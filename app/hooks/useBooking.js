// app/hooks/useBooking.js
"use client";

import { useContext } from "react";
import BookingContext from "@/app/context/BookingContext";

export function useBooking() {
  const context = useContext(BookingContext);
  
  if (context === undefined) {
    // Provide a fallback implementation if not using the context
    return {
      bookings: [],
      isLoading: false,
      error: null,
      createBooking: async (bookingData) => {
        try {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create booking');
          }
          
          return await response.json();
        } catch (error) {
          console.error("Error in useBooking hook:", error);
          throw error;
        }
      },
      getUserBookings: async () => {
        const response = await fetch('/api/bookings');
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        return data.bookings;
      },
      getBookingById: async (id) => {
        const response = await fetch(`/api/bookings/${id}`);
        if (!response.ok) throw new Error('Failed to fetch booking');
        const data = await response.json();
        return data.booking;
      },
      cancelBooking: async (id) => {
        const response = await fetch(`/api/bookings/${id}/cancel`, {
          method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to cancel booking');
        return await response.json();
      }
    };
  }
  
  return context;
}