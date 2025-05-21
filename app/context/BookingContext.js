// app/context/BookingContext.js
"use client";

import { createContext, useContext, useState } from "react";

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a new booking
  const createBooking = async (bookingData) => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      
      const data = await response.json();
      
      // Update bookings state
      setBookings(prevBookings => [...prevBookings, data.booking]);
      
      return data.booking;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all bookings for the current user
  const getUserBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/bookings');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings);
      
      return data.bookings;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get booking details by ID
  const getBookingById = async (bookingId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch booking');
      }
      
      const data = await response.json();
      return data.booking;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a booking
  const cancelBooking = async (bookingId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
      
      const data = await response.json();
      
      // Update bookings state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
      
      return data.booking;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      isLoading,
      error,
      createBooking,
      getUserBookings,
      getBookingById,
      cancelBooking
    }}>
      {children}
    </BookingContext.Provider>
  );
}

// Custom hook to use the booking context
export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}