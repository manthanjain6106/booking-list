// app/booking/[uniqueUrl]/[roomId]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function BookingPage() {
  const { uniqueUrl, roomId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Booking form state
  const [bookingData, setBookingData] = useState({
    checkIn: getTomorrow(),
    checkOut: getDayAfterTomorrow(),
    numAdults: 1,
    numChildren: 0,
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    specialRequests: ""
  });
  
  // Get formatted tomorrow's date
  function getTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }
  
  // Get formatted day after tomorrow's date
  function getDayAfterTomorrow() {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return formatDate(dayAfterTomorrow);
  }
  
  // Format date to YYYY-MM-DD
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  useEffect(() => {
    const fetchPropertyAndRoom = async () => {
      try {
        setIsLoading(true);
        
        // Fetch property details by unique URL
        const propertyRes = await fetch(`/api/property/url/${uniqueUrl}`);
        
        if (!propertyRes.ok) {
          throw new Error("Property not found");
        }
        
        const propertyData = await propertyRes.json();
        setProperty(propertyData.property);
        
        // Fetch room details
        const roomRes = await fetch(`/api/rooms/${roomId}`);
        
        if (!roomRes.ok) {
          throw new Error("Room not found");
        }
        
        const roomData = await roomRes.json();
        setRoom(roomData.room);
        
        // Prefill form with user data if logged in
        if (session && session.user) {
          setBookingData(prev => ({
            ...prev,
            guestName: session.user.name || prev.guestName,
            guestEmail: session.user.email || prev.guestEmail,
            guestPhone: session.user.phone || prev.guestPhone
          }));
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (uniqueUrl && roomId) {
      fetchPropertyAndRoom();
    }
  }, [uniqueUrl, roomId, session]);
  
  // Calculate number of nights
  const calculateNights = () => {
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    const nights = calculateNights();
    
    if (!room || nights <= 0) return 0;
    
    if (property.pricing?.type === "perRoom") {
      // Per room pricing
      const roomPrice = room.price || 0;
      const extraPersonCharge = room.extraPersonCharge || 0;
      const baseCapacity = parseInt(room.capacity) || 1;
      const totalGuests = (bookingData.numAdults || 1) + (bookingData.numChildren || 0);
      const extraGuests = Math.max(0, totalGuests - baseCapacity);
      
      return (roomPrice + (extraGuests * extraPersonCharge)) * nights;
    } else {
      // Per person pricing
      const adultRate = room.adultRate || (room.perPersonPrices && room.perPersonPrices[1]) || 0;
      const childRate = room.childRate || Math.floor((room.perPersonPrices && room.perPersonPrices[1]) / 2) || 0;
      
      return ((bookingData.numAdults * adultRate) + (bookingData.numChildren * childRate)) * nights;
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (!bookingData.guestName || !bookingData.guestPhone) {
        alert("Please fill in all required fields");
        return;
      }
      
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      
      if (checkIn >= checkOut) {
        alert("Check-out date must be after check-in date");
        return;
      }
      
      // Create booking payload
      const payload = {
        propertyId: property._id,
        roomNumber: room.roomNumber,
        category: room.category,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numAdults: parseInt(bookingData.numAdults),
        numChildren: parseInt(bookingData.numChildren),
        guestName: bookingData.guestName,
        guestPhone: bookingData.guestPhone,
        guestEmail: bookingData.guestEmail,
        specialRequests: bookingData.specialRequests,
        totalAmount: calculateTotalPrice(),
        // If user is logged in, link the booking to their account
        userId: session?.user?.id
      };
      
      // Submit booking
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create booking");
      }
      
      const data = await res.json();
      
      // Redirect to booking confirmation page
      router.push(`/booking/confirmation/${data.booking._id}`);
      
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.message || "An error occurred while creating your booking");
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !property || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md w-full text-center">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error || "Property or room not found"}</p>
        </div>
        <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-800">
          Return to Home
        </Link>
      </div>
    );
  }
  
  // Get placeholder image if no images
  const roomImage = room.imageUrls && room.imageUrls.length > 0 
    ? room.imageUrls[0] 
    : '/placeholder-room.jpg';
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Book Your Stay</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      name="checkIn"
                      value={bookingData.checkIn}
                      onChange={handleChange}
                      min={getTomorrow()}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      name="checkOut"
                      value={bookingData.checkOut}
                      onChange={handleChange}
                      min={bookingData.checkIn}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                {/* Guests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adults *
                    </label>
                    <select
                      name="numAdults"
                      value={bookingData.numAdults}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Children (Age 5-12)
                    </label>
                    <select
                      name="numChildren"
                      value={bookingData.numChildren}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[0, 1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Guest Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Guest Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="guestName"
                        value={bookingData.guestName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="guestPhone"
                        value={bookingData.guestPhone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="guestEmail"
                      value={bookingData.guestEmail}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests
                  </label>
                  <textarea
                    name="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Any special requests or requirements..."
                  />
                </div>
                
                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Book Now
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Summary</h2>
              
              {/* Room Image */}
              <div className="relative h-48 w-full rounded-md overflow-hidden mb-4">
                <img 
                  src={roomImage}
                  alt={`${room.category} - Room ${room.roomNumber}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Room Details */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800">{property.name}</h3>
                <p className="text-gray-600">{room.category} - Room {room.roomNumber}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {room.capacity} {parseInt(room.capacity) === 1 ? 'Person' : 'People'} Capacity
                </p>
                
                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Amenities:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.amenities.map((amenity, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Booking Details */}
              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">{new Date(bookingData.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">{new Date(bookingData.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Nights</span>
                  <span className="font-medium">{calculateNights()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">
                    {bookingData.numAdults} {bookingData.numAdults === 1 ? 'Adult' : 'Adults'}
                    {bookingData.numChildren > 0 && `, ${bookingData.numChildren} ${bookingData.numChildren === 1 ? 'Child' : 'Children'}`}
                  </span>
                </div>
              </div>
              
              {/* Price Breakdown */}
              <div className="border-t border-gray-100 pt-4 mb-4">
                <h3 className="text-md font-medium text-gray-800 mb-2">Price Details</h3>
                
                {property.pricing?.type === "perRoom" ? (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Room Rate</span>
                      <span>₹{room.price} per night</span>
                    </div>
                    
                    {room.extraPersonCharge > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Extra Person Charge</span>
                        <span>₹{room.extraPersonCharge} per person</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Adult Rate</span>
                      <span>₹{room.adultRate || (room.perPersonPrices && room.perPersonPrices[1]) || 0} per adult</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Child Rate</span>
                      <span>₹{room.childRate || Math.floor((room.perPersonPrices && room.perPersonPrices[1]) / 2) || 0} per child</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Number of Nights</span>
                  <span>{calculateNights()}</span>
                </div>
              </div>
              
              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-800">Total</span>
                  <span className="text-xl font-bold text-indigo-600">₹{calculateTotalPrice().toLocaleString()}</span>
                </div>
                
                {property.pricing?.advanceAmount > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    * Advance payment of ₹{property.pricing.advanceAmount} required to confirm booking.
                  </p>
                )}
              </div>
              
              {/* Payment Policy */}
              <div className="mt-6 bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Payment Policy:</p>
                <p>Payment can be made at the property during check-in.</p>
                {property.cancellationPolicy && (
                  <>
                    <p className="font-medium text-gray-700 mt-2 mb-1">Cancellation Policy:</p>
                    <p>{property.cancellationPolicy}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}