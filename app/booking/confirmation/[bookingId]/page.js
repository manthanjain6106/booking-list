'use client'
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, X } from 'lucide-react';

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(true);
  
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/bookings/${bookingId}`);
        
        if (!res.ok) {
          throw new Error("Booking not found");
        }
        
        const data = await res.json();
        console.log("Booking data:", data); // Log the response to see structure
        
        setBooking(data.booking);
        setProperty(data.booking.property);
        setRoom(data.booking.room);
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);
  
  // Generate a reference number
  const generateBookingRef = () => {
    if (!booking) return "";
    return booking.bookingRef || booking.bookingId || `FRA-BE-${Date.now().toString().slice(-8)}-${property?.name?.slice(0, 6).toUpperCase() || "STAY"}-BOOKING`;
  };
  
  const closePopup = () => {
    setShowPopup(false);
  };
  
  const goToHome = () => {
    router.push('/');
  };
  
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md w-full text-center">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error || "Booking not found"}</p>
        </div>
        <Link href="/" className="mt-4 text-green-600 hover:text-green-800">
          Return to Home
        </Link>
      </div>
    );
  }
  
  const bookingRef = generateBookingRef();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Popup Message */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {booking.status === 'confirmed' 
                  ? 'Booking Confirmed' 
                  : booking.status === 'pending'
                  ? 'Booking Received'
                  : 'Booking Status'}
              </h3>
              <button 
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              
              <p className="text-center mb-4">
                {booking.status === 'confirmed'
                  ? 'Your booking has been confirmed. Thank you for choosing our service!'
                  : booking.status === 'pending'
                  ? 'Your booking request has been received and is awaiting confirmation from the host.'
                  : 'Your booking has been processed. Thank you for choosing our service!'}
              </p>
              
              <button
                onClick={closePopup}
                className="mt-2 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Confirmation Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {booking.status === 'confirmed' 
              ? 'Booking Confirmed!' 
              : booking.status === 'pending'
              ? 'Booking Pending'
              : booking.status === 'cancelled'
              ? 'Booking Cancelled'
              : 'Booking Processed'}
          </h1>
          <p className="text-gray-500 text-lg mb-2">Booking Ref. {bookingRef}</p>
          
          {/* Status badge */}
          <div className="flex justify-center items-center mt-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              booking.status === 'confirmed' 
                ? 'bg-green-100 text-green-800' 
                : booking.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : booking.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
            </span>
          </div>
          
          <p className="text-lg text-gray-600">
            {booking.status === 'confirmed'
              ? 'Your booking has been received and confirmed.'
              : booking.status === 'pending'
              ? 'Your booking request has been received and is awaiting confirmation from the host.'
              : booking.status === 'cancelled'
              ? 'This booking has been cancelled.'
              : 'Your booking request has been processed.'}
          </p>
        </div>
        
        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {/* Property and Room Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">{property?.name}</h2>
                <p className="text-gray-600">{property?.location?.city}, {property?.location?.state}</p>
              </div>
              
              {room?.images && room.images.length > 0 && (
                <div className="w-full md:w-32 h-24 relative rounded-md overflow-hidden">
                  <Image
                    src={room.images[0]}
                    alt={room.category || "Room"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-700">Room Details</h3>
              <p className="text-gray-800">{room?.category} - Room {room?.roomNumber}</p>
              {room?.capacity && (
                <p className="text-sm text-gray-600">
                  {room.capacity.total} {parseInt(room.capacity.total) === 1 ? 'Person' : 'People'} Capacity
                </p>
              )}
            </div>
          </div>
          
          {/* Booking Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-700 mb-4">Booking Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-medium">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="font-medium">{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Guests</p>
                <p className="font-medium">
                  {booking.numAdults} {booking.numAdults === 1 ? 'Adult' : 'Adults'}
                  {booking.youngerChildren > 0 && 
                    `, ${booking.youngerChildren} Child${booking.youngerChildren !== 1 ? 'ren' : ''} (0-5 years)`}
                  {booking.olderChildren > 0 && 
                    `, ${booking.olderChildren} Child${booking.olderChildren !== 1 ? 'ren' : ''} (6-10 years)`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Booking ID</p>
                <p className="font-medium">{booking._id}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-green-600">
                ₹{(booking.totalAmount || booking.pricing?.totalAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Guest Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-700 mb-4">Guest Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{booking.guestPhone}</p>
              </div>
              {booking.guestEmail && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{booking.guestEmail}</p>
                </div>
              )}
              {booking.guestAddress && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{booking.guestAddress}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Special Requests</h3>
              <p className="text-gray-600">{booking.specialRequests}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="p-6 bg-gray-50">
            <button
              onClick={goToHome}
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              Return to Home
            </button>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="font-medium text-gray-700 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-3">If you have any questions about your booking, please contact:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {property?.phoneNumbers?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{property.phoneNumbers[0]}</p>
              </div>
            )}
            {property?.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{property.email}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center text-gray-500 text-sm">
          <p>Thank you for booking with us!</p>
        </div>
      </div>
    </div>
  );
}