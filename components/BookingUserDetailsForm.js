'use client'
import { useState } from "react";
import Image from "next/image";

// Helper functions for dates
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

function getDayAfterTomorrow() {
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  return formatDate(dayAfterTomorrow);
}

// Default booking data
const defaultBookingData = {
  checkIn: getTomorrow(),
  checkOut: getDayAfterTomorrow(),
  numAdults: 1,
  numChildren: 0,
  hasYoungerChildren: false,
  youngerChildrenCount: 0,
  hasOlderChildren: false,
  olderChildrenCount: 0,
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  guestAddress: "",
  specialRequests: ""
};

export default function BookingUserDetailsForm({ 
  bookingData = defaultBookingData, 
  onBookingDataChange = () => {}, 
  onSubmit,
  property,
  room
}) {
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    onBookingDataChange({
      ...bookingData,
      [name]: type === "checkbox" ? checked : value
    });
    
    // Update child counts when checkbox is unchecked
    if (type === "checkbox" && !checked) {
      if (name === "hasYoungerChildren") {
        onBookingDataChange({
          ...bookingData,
          [name]: checked,
          youngerChildrenCount: 0
        });
      } else if (name === "hasOlderChildren") {
        onBookingDataChange({
          ...bookingData,
          [name]: checked,
          olderChildrenCount: 0
        });
      }
    }
  };

  // Handle child count changes
  const handleChildCountChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    
    onBookingDataChange({
      ...bookingData,
      [name]: numValue < 0 ? 0 : numValue
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!bookingData.guestName || !bookingData.guestPhone) {
      setError("Please fill in all required fields");
      return;
    }
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    
    if (checkIn >= checkOut) {
      setError("Check-out date must be after check-in date");
      return;
    }
    
    // Validate child counts if checkboxes are checked
    if (bookingData.hasYoungerChildren && bookingData.youngerChildrenCount <= 0) {
      setError("Please specify the number of children (0-5 years)");
      return;
    }
    
    if (bookingData.hasOlderChildren && bookingData.olderChildrenCount <= 0) {
      setError("Please specify the number of children (6-10 years)");
      return;
    }
    
    setError("");
    onSubmit && onSubmit(e);
  };

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
    
    // Get counts for both age groups
    const youngerChildren = bookingData.hasYoungerChildren ? bookingData.youngerChildrenCount : 0;
    const olderChildren = bookingData.hasOlderChildren ? bookingData.olderChildrenCount : 0;
    
    if (property?.pricing?.type === "perRoom") {
      // For per-room pricing
      const roomPrice = room.pricing?.price || 0;
      const extraPersonCharge = room.pricing?.extraPersonCharge || 0;
      const baseCapacity = parseInt(room.capacity?.total) || 1;
      
      // Only adults and older children (6-10) count toward capacity for extra charges
      const chargeable = bookingData.numAdults + olderChildren;
      
      // Calculate extra guests
      const extraGuests = Math.max(0, chargeable - baseCapacity);
      
      return (roomPrice + (extraGuests * extraPersonCharge)) * nights;
    } else {
      // For per-person pricing
      const adultRate = room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0;
      
      // Adults: full price
      const adultTotal = bookingData.numAdults * adultRate;
      
      // Children 6-10 years: HALF price
      const olderChildRate = Math.floor(adultRate / 2);
      const olderChildrenTotal = olderChildren * olderChildRate;
      
      return (adultTotal + olderChildrenTotal) * nights;
    }
  };

  // Safe room image handling
  const getRoomImage = () => {
    if (room?.images && room.images.length > 0) {
      return room.images[0]; // Direct path from database
    }
    return '/placeholder-room.jpg';
  };

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
                <div>
                  <div className="mb-4">
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
                  
                  {/* Children checkboxes section */}
                  <div className="mb-4">
                    <h3 className="block text-sm font-medium text-gray-700 mb-2">Children</h3>
                    
                    {/* 0-5 Years Checkbox and Count */}
                    <div className="mb-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="hasYoungerChildren"
                            name="hasYoungerChildren"
                            type="checkbox"
                            checked={bookingData.hasYoungerChildren}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="hasYoungerChildren" className="font-medium text-gray-700">
                            Children (0-5 years) - <span className="text-green-600">Free</span>
                          </label>
                        </div>
                      </div>
                      
                      {bookingData.hasYoungerChildren && (
                        <div className="mt-2 ml-7">
                          <label htmlFor="youngerChildrenCount" className="block text-sm text-gray-700 mb-1">
                            Number of children (0-5 years)
                          </label>
                          <input
                            type="number"
                            id="youngerChildrenCount"
                            name="youngerChildrenCount"
                            min="1"
                            max="10"
                            value={bookingData.youngerChildrenCount}
                            onChange={handleChildCountChange}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 6-10 Years Checkbox and Count */}
                    <div className="mb-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="hasOlderChildren"
                            name="hasOlderChildren"
                            type="checkbox"
                            checked={bookingData.hasOlderChildren}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="hasOlderChildren" className="font-medium text-gray-700">
                            Children (6-10 years) - <span className="text-indigo-600">Half Price</span>
                          </label>
                        </div>
                      </div>
                      
                      {bookingData.hasOlderChildren && (
                        <div className="mt-2 ml-7">
                          <label htmlFor="olderChildrenCount" className="block text-sm text-gray-700 mb-1">
                            Number of children (6-10 years)
                          </label>
                          <input
                            type="number"
                            id="olderChildrenCount"
                            name="olderChildrenCount"
                            min="1"
                            max="10"
                            value={bookingData.olderChildrenCount}
                            onChange={handleChildCountChange}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>
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
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="guestAddress"
                      value={bookingData.guestAddress || ""}
                      onChange={handleChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter your full address"
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
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
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
                <Image
                  src={getRoomImage()}
                  alt={`${room?.category || 'Room'} ${room?.roomNumber ? `- Room ${room.roomNumber}` : ''}`}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              
              {/* Property & Room Details */}
              <div className="mb-4">
                {property && <h3 className="text-lg font-medium text-gray-800">{property.name}</h3>}
                {room && (
                  <p className="text-gray-600">
                    {room.category}{room.roomNumber ? ` - Room ${room.roomNumber}` : ''}
                  </p>
                )}
                {room?.capacity?.total && (
                  <p className="text-gray-600 text-sm mt-1">
                    {room.capacity.total} {parseInt(room.capacity.total) === 1 ? 'Person' : 'People'} Capacity
                  </p>
                )}
                
                {/* Amenities */}
                {room?.amenities && room.amenities.length > 0 && (
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
                    {bookingData.hasYoungerChildren && bookingData.youngerChildrenCount > 0 && 
                      `, ${bookingData.youngerChildrenCount} Child${bookingData.youngerChildrenCount !== 1 ? 'ren' : ''} (0-5 years, Free)`}
                    {bookingData.hasOlderChildren && bookingData.olderChildrenCount > 0 && 
                      `, ${bookingData.olderChildrenCount} Child${bookingData.olderChildrenCount !== 1 ? 'ren' : ''} (6-10 years, Half Price)`}
                  </span>
                </div>
              </div>
              
              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-800">Total</span>
                  <span className="text-xl font-bold text-indigo-600">₹{calculateTotalPrice().toLocaleString()}</span>
                </div>
                
                {property?.pricing?.advanceAmount > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    * Advance payment of ₹{property.pricing.advanceAmount} required to confirm booking.
                  </p>
                )}
              </div>
              
              {/* Payment Policy */}
              <div className="mt-6 bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Payment Policy:</p>
                <p>Payment can be made at the property during check-in.</p>
                {property?.cancellationPolicy && (
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