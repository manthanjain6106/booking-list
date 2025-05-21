// app/dashboard/host/bookings/page.js - Simplified with debugging
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HostBookings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Check if user is logged in
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "loading") {
      return;
    }

    // Additional debugging
    console.log("Session data:", session);
    setDebugInfo(prev => ({ ...prev, session }));

    const fetchHostBookings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching bookings...");
        
        // Try to fetch the host's property first to debug
        const propertyRes = await fetch("/api/property/host");
        const propertyData = await propertyRes.json();
        console.log("Property data:", propertyData);
        setDebugInfo(prev => ({ ...prev, property: propertyData }));
        
        if (!propertyRes.ok) {
          throw new Error(`Failed to fetch property: ${propertyData.message || propertyRes.statusText}`);
        }
        
        // Now fetch bookings
        const response = await fetch("/api/bookings/host");
        console.log("Bookings API response status:", response.status);
        setDebugInfo(prev => ({ ...prev, bookingsStatus: response.status }));
        
        // Try to parse response even if not OK, for debugging
        let responseData;
        try {
          responseData = await response.json();
          console.log("Bookings API response data:", responseData);
          setDebugInfo(prev => ({ ...prev, bookingsResponse: responseData }));
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setDebugInfo(prev => ({ ...prev, parseError: parseError.message }));
          throw new Error("Failed to parse server response");
        }
        
        if (!response.ok) {
          throw new Error(responseData.message || "Failed to fetch bookings");
        }
        
        setBookings(responseData.bookings || []);
      } catch (err) {
        console.error("Error in fetchHostBookings:", err);
        setError(err.message);
        setDebugInfo(prev => ({ ...prev, error: err.message, stack: err.stack }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostBookings();
  }, [session, status, router]);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Show loading spinner while session is loading
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Show error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-red-700 underline"
          >
            Try Again
          </button>
          
          {/* Show debug information in development */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-gray-800 text-xs overflow-auto">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="mr-4 text-gray-500 hover:text-indigo-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Bookings</h1>
        </div>
        
        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            All Bookings
          </h2>
          
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-gray-500">No bookings found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest Details
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Info
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
                      {/* Guest Details */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.guestInfo?.name}</div>
                        <div className="text-sm text-gray-500">{booking.guestInfo?.phone}</div>
                        <div className="text-sm text-gray-500">{booking.guestInfo?.email}</div>
                      </td>
                      
                      {/* Room Info */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.category}</div>
                        <div className="text-sm text-gray-500">Room {booking.roomNumber}</div>
                      </td>
                      
                      {/* Dates */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</div>
                        <div className="text-sm text-gray-500">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</div>
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
                            <button className="text-green-600 hover:text-green-900">
                              Accept
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Decline
                            </button>
                          </div>
                        ) : (
                          <Link href={`/dashboard/host/bookings/${booking._id}`} className="text-indigo-600 hover:text-indigo-900">
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
          
          {/* Debug Information (Development only) */}
          <div className="mt-8 p-4 bg-gray-100 rounded text-gray-800 text-xs overflow-auto">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <pre>{JSON.stringify({ session, bookingsCount: bookings.length, ...debugInfo }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}