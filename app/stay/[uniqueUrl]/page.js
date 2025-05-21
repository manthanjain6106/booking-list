// app/stay/[uniqueUrl]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function StayPage() {
  const { uniqueUrl } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchPropertyAndRooms = async () => {
      try {
        setIsLoading(true);
        setError("");
        // Fetch property details by unique URL
        const propertyRes = await fetch(`/api/property/url/${uniqueUrl}`);
        if (!propertyRes.ok) {
          throw new Error("Property not found");
        }
        const propertyData = await propertyRes.json();
        setProperty(propertyData.property);
        // Debug: Log property ID
        console.log("Fetched property ID:", propertyData.property?._id);
        // Fetch rooms for this property
        if (!propertyData.property?._id) {
          throw new Error("Property ID is missing");
        }
        const roomsRes = await fetch(`/api/rooms/public?propertyId=${propertyData.property._id}`);
        if (!roomsRes.ok) {
          // Try to get error message from backend
          let errorMsg = "Failed to fetch rooms";
          try {
            const errData = await roomsRes.json();
            if (errData && errData.message) errorMsg = errData.message;
          } catch {}
          throw new Error(errorMsg);
        }
        const roomsData = await roomsRes.json();
        // Debug: Log rooms data
        console.log("Fetched rooms data:", roomsData);
        const roomsArray = Array.isArray(roomsData.rooms) ? roomsData.rooms : [];
        setRooms(roomsArray);
        // Extract unique categories
        const uniqueCategories = [...new Set(roomsArray.map(room => room.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (uniqueUrl) {
      fetchPropertyAndRooms();
    }
  }, [uniqueUrl]);
  
  // Filter rooms by category
  const filteredRooms = selectedCategory === "all" 
    ? rooms 
    : rooms.filter(room => room.category === selectedCategory);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md w-full text-center">
          <p className="font-medium">Property Not Found</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-800">
          Return to Home
        </Link>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md max-w-md w-full text-center">
          <p className="font-medium">Property Not Available</p>
          <p className="text-sm mt-1">The property you&apos;re looking for is currently unavailable.</p>
        </div>
        <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-800">
          Return to Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Property Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{property.name}</h1>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Location:</span> {property.location.address}, {property.location.city}, {property.location.state}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="inline-flex items-center bg-indigo-50 px-3 py-1 rounded-full">
                <span className="text-indigo-700 font-medium">
                  ₹{property.pricing?.value} {property.pricing?.type === 'perPerson' ? ' per person' : ' per room'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Property Description */}
          {property.description && (
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">About this place</h2>
              <p className="text-gray-600">{property.description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              selectedCategory === "all" 
                ? "bg-indigo-100 text-indigo-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Rooms
          </button>
          
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                selectedCategory === category 
                  ? "bg-indigo-100 text-indigo-700" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Rooms List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No rooms available for this property. If you are the property owner, please add rooms in the dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div key={room._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {/* Room Image */}
                <div className="relative h-48 w-full">
                  <Image 
                    src={room.images && room.images.length > 0
                      ? (room.images[0].startsWith('/uploads/') ? room.images[0] : `/uploads/rooms/${room.images[0]}`)
                      : '/placeholder-room.jpg'}
                    alt={`${room.category} - Room ${room.roomNumber}`}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Room Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{room.category}</h3>
                      <p className="text-gray-600 text-sm">Room {room.roomNumber}</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                      {room.capacity?.total} {room.capacity?.total === 1 ? 'Person' : 'People'}
                    </span>
                  </div>
                  
                  {/* Amenities */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700">Amenities</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.amenities.map((amenity, idx) => (
                          <span key={idx} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Pricing */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    {property.pricing?.type === "perRoom" ? (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Price per night</span>
                        <span className="text-lg font-semibold text-gray-800">₹{room.pricing?.price}</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total for {room.numAdults || 1} {(room.numAdults || 1) === 1 ? 'adult' : 'adults'}{room.numChildren > 0 ? ` & ${room.numChildren} ${room.numChildren === 1 ? 'child' : 'children'}` : ''}</span>
                          <span className="text-lg font-semibold text-gray-800">₹{
                            (() => {
                              const adultRate = room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0;
                              const childRate = room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) / 2) || 0;
                              const numAdults = room.numAdults || 1;
                              const numChildren = room.numChildren || 0;
                              return (numAdults * adultRate) + (numChildren * childRate);
                            })()
                          }</span>
                        </div>
                        
                        <div className="mt-1 text-xs text-gray-500">
                          <div>Adults: ₹{room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0} per person</div>
                          <div>
                            <span>Children (0-5 years): <span className="text-green-600 font-medium">Free</span></span>
                          </div>
                          <div>
                            <span>Children (6-10 years): ₹{Math.floor((room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0) / 2)} per child</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Book Now Button - Using Link component for direct navigation */}
                  <Link href={`/booking/${property.uniqueUrl}/${room._id}`} passHref>
                    <button
                      className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
                      onClick={() => console.log(`Navigating to booking page: /booking/${property.uniqueUrl}/${room._id}`)}
                    >
                      Book Now
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Contact Info */}
      <div className="bg-white shadow-md mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Phone:</span> {property.phoneNumbers[0]}
                {property.phoneNumbers[1] && (
                  <>, {property.phoneNumbers[1]}</>
                )}
              </p>
              
              {property.email && (
                <p className="text-gray-600 mt-2">
                  <span className="font-medium">Email:</span> {property.email}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Address:</span> {property.location.address}, {property.location.city}, {property.location.state}, {property.location.pincode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 