// app/dashboard/host/today/page.js - Today's bookings quick view for host dashboard
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TodayBookings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user?.role !== "host") {
      router.replace("/login");
      return;
    }

    const fetchTodayBookings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch("/api/bookings/host?status=pending");
        
        if (!response.ok) {
          throw new Error("Failed to fetch today's bookings");
        }
        
        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (error) {
        console.error("Error fetching today's bookings:", error);
        setError("Failed to load today's bookings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTodayBookings();
  }, [session, status, router]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? { ...booking, isLoading: true } : booking
        )
      );
      
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }
      
      // Update the booking in state
      setBookings(prev =>
        prev.map(booking =>
          booking._id === bookingId
            ? { ...booking, status: newStatus, isLoading: false }
            : booking
        )
      );
      
      // Show success message
      alert(`Booking ${newStatus === "confirmed" ? "accepted" : "declined"} successfully`);
      
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status. Please try again.");
      
      // Reset loading state
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? { ...booking, isLoading: false } : booking
        )
      );
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Today's Bookings</h1>
          <Link 
            href="/dashboard/host/bookings" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            View All Bookings
          </Link>
        </div>
        
        {/* Today's Bookings */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-gray-500">No bookings for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      {/* Guest */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.guestInfo?.name}</div>
                        <div className="text-sm text-gray-500">{booking.guestInfo?.phone}</div>
                      </td>
                      
                      {/* Room */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.category}</div>
                        <div className="text-sm text-gray-500">Room {booking.roomNumber}</div>
                      </td>
                      
                      {/* Dates */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</div>
                        <div className="text-sm text-gray-500">
                          {booking.numAdults} {booking.numAdults === 1 ? 'Adult' : 'Adults'}
                          {booking.numChildren > 0 && `, ${booking.numChildren} ${booking.numChildren === 1 ? 'Child' : 'Children'}`}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'cancelled' || booking.status === 'declined' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {booking.status === 'confirmed' ? 'Confirmed' : 
                           booking.status === 'pending' ? 'Pending' : 
                           booking.status === 'cancelled' ? 'Cancelled' : 
                           booking.status === 'declined' ? 'Declined' : 
                           booking.status}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStatusChange(booking._id, "confirmed")}
                              disabled={booking.isLoading}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking._id, "declined")}
                              disabled={booking.isLoading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <Link 
                            href={`/dashboard/host/bookings/${booking._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}