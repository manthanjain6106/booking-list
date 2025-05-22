"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BookingUserDetailsForm from "../../../../components/BookingUserDetailsForm";

export default function BookingPage() {
  const { uniqueUrl, roomId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState({
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
    guestAddress: "", // Added new field for guest address
    specialRequests: ""
  });

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
        console.log("Fetching property with uniqueUrl:", uniqueUrl);
        console.log("Fetching room with ID:", roomId);
        
        // Fetch property details by unique URL
        const propertyRes = await fetch(`/api/property/url/${uniqueUrl}`);
        
        if (!propertyRes.ok) {
          console.error("Property fetch failed with status:", propertyRes.status);
          throw new Error("Property not found");
        }
        
        const propertyData = await propertyRes.json();
        console.log("Property data:", propertyData);
        setProperty(propertyData.property);
        
        // Fetch room details - try different API endpoints if one fails
        let roomRes = await fetch(`/api/rooms/${roomId}`);
        
        // If the first endpoint fails, try an alternative
        if (!roomRes.ok) {
          console.log("First room fetch attempt failed, trying alternative...");
          roomRes = await fetch(`/api/rooms/public/${roomId}`);
          
          // If that fails too, try with property ID
          if (!roomRes.ok && propertyData.property?._id) {
            console.log("Second room fetch attempt failed, trying with property ID...");
            roomRes = await fetch(`/api/rooms/public?propertyId=${propertyData.property._id}&roomId=${roomId}`);
          }
          
          // If all attempts fail
          if (!roomRes.ok) {
            console.error("Room fetch failed with status:", roomRes.status);
            throw new Error("Room not found");
          }
        }
        
        const roomData = await roomRes.json();
        console.log("Room data:", roomData);
        
        // Handle different response structures
        const roomObject = roomData.room || roomData.rooms?.find(r => r._id === roomId) || null;
        
        if (!roomObject) {
          throw new Error("Room data has unexpected format");
        }
        
        setRoom(roomObject);
        
        // Prefill form with user data if logged in
        if (session && session.user) {
          setBookingData(prev => ({
            ...prev,
            guestName: session.user.name || prev.guestName,
            guestEmail: session.user.email || prev.guestEmail,
            guestPhone: session.user.phone || prev.guestPhone,
            guestAddress: session.user.address || prev.guestAddress // Prefill address if available
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

  // Handle booking data changes
  const handleBookingDataChange = (newData) => {
    setBookingData(newData);
  };

  // Handle booking submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Calculate children counts based on checkboxes
      const youngerChildren = bookingData.hasYoungerChildren ? bookingData.youngerChildrenCount : 0;
      const olderChildren = bookingData.hasOlderChildren ? bookingData.olderChildrenCount : 0;
      const totalChildren = youngerChildren + olderChildren;
      
      // Create booking payload
      const payload = {
        propertyId: property._id,
        roomId: room._id,
        roomNumber: room.roomNumber,
        category: room.category,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numAdults: parseInt(bookingData.numAdults),
        numChildren: totalChildren,
        youngerChildren: youngerChildren,
        olderChildren: olderChildren,
        guestName: bookingData.guestName,
        guestPhone: bookingData.guestPhone,
        guestEmail: bookingData.guestEmail,
        guestAddress: bookingData.guestAddress, // Include address in payload
        specialRequests: bookingData.specialRequests,
        totalAmount: calculateTotalPrice(),
        // If user is logged in, link the booking to their account
        userId: session?.user?.id
      };
      
      console.log("Submitting booking payload:", payload);
      
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
      console.log("Booking created successfully:", data);
      
      // Redirect to booking confirmation page
      router.push(`/booking/confirmation/${data.booking._id}`);
      
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.message || "An error occurred while creating your booking");
    }
  };

  // Calculate price function (for the payload)
  const calculateTotalPrice = () => {
    const nights = calculateNights();
    if (!room || nights <= 0) return 0;
    
    const youngerChildren = bookingData.hasYoungerChildren ? bookingData.youngerChildrenCount : 0;
    const olderChildren = bookingData.hasOlderChildren ? bookingData.olderChildrenCount : 0;
    
    if (property?.pricing?.type === "perRoom") {
      const roomPrice = room.pricing?.price || 0;
      const extraPersonCharge = room.pricing?.extraPersonCharge || 0;
      const baseCapacity = parseInt(room.capacity?.total) || 1;
      const chargeable = bookingData.numAdults + olderChildren;
      const extraGuests = Math.max(0, chargeable - baseCapacity);
      return (roomPrice + (extraGuests * extraPersonCharge)) * nights;
    } else {
      const adultRate = room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0;
      const adultTotal = bookingData.numAdults * adultRate;
      const olderChildRate = Math.floor(adultRate / 2);
      const olderChildrenTotal = olderChildren * olderChildRate;
      return (adultTotal + olderChildrenTotal) * nights;
    }
  };

  // Calculate number of nights
  const calculateNights = () => {
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
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
          <p className="text-xs mt-2">uniqueUrl: {uniqueUrl}, roomId: {roomId}</p>
        </div>
        <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-800">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <BookingUserDetailsForm
      bookingData={bookingData}
      onBookingDataChange={handleBookingDataChange}
      onSubmit={handleSubmit}
      property={property}
      room={room}
    />
  );
}