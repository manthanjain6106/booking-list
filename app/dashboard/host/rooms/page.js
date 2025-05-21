// app/dashboard/host/rooms/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RoomManagement() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [property, setProperty] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Initial form data
  const [formData, setFormData] = useState({
    categoryName: "",
    price: "",
    capacity: "1",
    amenities: [],
    images: [],
    extraPersonCharge: "",
    agentCommission: "",
    advanceAmount: "",
    roomCount: 1,
    roomNumbers: [""], // For room numbers/names
    // Enhanced pricing fields
    adultRate: "",
    childRate: "",
    numAdults: 1,
    numChildren: 0,
    perPersonPrices: {
      1: "",
      2: "",
      3: ""
    }
  });

  // Common amenities for both pricing types
  const amenitiesOptions = [
    { id: "wifi", label: "WiFi" },
    { id: "geyser", label: "Geyser" },
    { id: "ac", label: "Air Conditioning" },
    { id: "tv", label: "Television" },
    { id: "breakfast", label: "Breakfast Included" },
    { id: "parking", label: "Parking" },
    { id: "roomService", label: "Room Service" },
  ];

  useEffect(() => {
    // Fetch property details to get pricing type and existing rooms
    const fetchPropertyAndRooms = async () => {
      try {
        // Fetch property details
        const propertyRes = await fetch("/api/property/host");
        if (propertyRes.ok) {
          const propertyData = await propertyRes.json();
          setProperty(propertyData.property);
          
          // Fetch rooms for this property
          const roomsRes = await fetch(`/api/rooms?propertyId=${propertyData.property._id}`);
          if (roomsRes.ok) {
            const roomsData = await roomsRes.json();
            setRooms(roomsData.rooms || []);
            
            // Extract unique categories from rooms
            const uniqueCategories = [...new Set(roomsData.rooms.map(room => room.category))];
            setCategories(uniqueCategories);
          }
        } else {
          setError("Could not load property details. Please try again.");
          router.push("/dashboard/host");
        }
      } catch (error) {
        console.error("Failed to fetch property or rooms:", error);
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchPropertyAndRooms();
    }
  }, [session, router]);

  const handleAmenityChange = (amenityId) => {
    const updatedAmenities = formData.amenities.includes(amenityId)
      ? formData.amenities.filter(id => id !== amenityId)
      : [...formData.amenities, amenityId];
    
    setFormData({ ...formData, amenities: updatedAmenities });
  };

  const handleRoomNumberChange = (index, value) => {
    const updatedRoomNumbers = [...formData.roomNumbers];
    updatedRoomNumbers[index] = value;
    setFormData({ ...formData, roomNumbers: updatedRoomNumbers });
  };

  const addRoomNumber = () => {
    setFormData({ 
      ...formData, 
      roomNumbers: [...formData.roomNumbers, ""],
      roomCount: formData.roomCount + 1 
    });
  };

  const removeRoomNumber = (index) => {
    const updatedRoomNumbers = formData.roomNumbers.filter((_, i) => i !== index);
    setFormData({ 
      ...formData, 
      roomNumbers: updatedRoomNumbers,
      roomCount: formData.roomCount - 1 
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, images: files });
  };

  const handleCategorySelect = (category) => {
    if (category === "custom") {
      setShowCategoryForm(true);
    } else {
      setSelectedCategory(category);
      setShowCategoryForm(false);
      // Pre-fill form with existing data if editing an existing category
      const existingRooms = rooms.filter(room => room.category === category);
      if (existingRooms.length > 0) {
        const firstRoom = existingRooms[0];
        setFormData({
          categoryName: category,
          price: firstRoom.price || "",
          capacity: firstRoom.capacity || "1",
          amenities: firstRoom.amenities || [],
          images: [], // Can't pre-fill images
          extraPersonCharge: firstRoom.extraPersonCharge || "",
          agentCommission: firstRoom.agentCommission || "",
          advanceAmount: firstRoom.advanceAmount || "",
          roomCount: existingRooms.length,
          roomNumbers: existingRooms.map(room => room.roomNumber || ""),
          // Enhanced pricing fields
          adultRate: firstRoom.adultRate || "",
          childRate: firstRoom.childRate || "",
          numAdults: firstRoom.numAdults || 1,
          numChildren: firstRoom.numChildren || 0,
          perPersonPrices: firstRoom.perPersonPrices || { 1: "", 2: "", 3: "" }
        });
      } else {
        // Reset form for new category
        resetForm();
      }
    }
  };

  const createCustomCategory = () => {
    if (customCategory.trim()) {
      setCategories([...categories, customCategory]);
      setSelectedCategory(customCategory);
      setShowCategoryForm(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      categoryName: selectedCategory,
      price: "",
      capacity: "1",
      amenities: [],
      images: [],
      extraPersonCharge: "",
      agentCommission: "",
      advanceAmount: "",
      roomCount: 1,
      roomNumbers: [""],
      // Enhanced pricing fields
      adultRate: "",
      childRate: "",
      numAdults: 1,
      numChildren: 0,
      perPersonPrices: {
        1: "",
        2: "",
        3: ""
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validate form fields
    if (!selectedCategory && !formData.categoryName) {
      setError("Category name is required");
      setIsSubmitting(false);
      return;
    }
    if (property.pricing.type === "perRoom" && !formData.price) {
      setError("Room price is required");
      setIsSubmitting(false);
      return;
    }
    if (property.pricing.type === "perPerson" && !formData.adultRate) {
      setError("Adult rate is required");
      setIsSubmitting(false);
      return;
    }
    if (!formData.roomNumbers.every(room => room.trim())) {
      setError("All room numbers/names are required");
      setIsSubmitting(false);
      return;
    }
    // Check for duplicate room numbers
    const uniqueRoomNumbers = new Set(formData.roomNumbers);
    if (uniqueRoomNumbers.size !== formData.roomNumbers.length) {
      setError("Room numbers/names must be unique");
      setIsSubmitting(false);
      return;
    }
    try {
      // Prepare FormData for /api/rooms/with-images
      const fd = new FormData();
      // Prepare room payloads, referencing image keys
      let imageKeys = [];
      let roomPayloads = formData.roomNumbers.map((roomNumber, idx) => {
        let images = [];
        if (formData.images && formData.images.length > 0) {
          images = formData.images.map((file, i) => `room${idx}_img${i}`);
        }
        imageKeys = imageKeys.concat(images.map((key, i) => ({ key, file: formData.images[i] })));
        // Calculate total price for each room
        let calculatedTotalPrice = null;
        if (property.pricing.type === "perRoom") {
          calculatedTotalPrice = formData.price !== "" ? Number(formData.price) : null;
        } else {
          const adultRate = Number(formData.adultRate) || 0;
          const childRate = Number(formData.childRate) || 0;
          const numAdults = Number(formData.numAdults) || 1;
          const numChildren = Number(formData.numChildren) || 0;
          calculatedTotalPrice = (numAdults * adultRate) + (numChildren * childRate);
        }
        return {
          property: property._id, // FIX: use 'property' instead of 'propertyId'
          category: selectedCategory || formData.categoryName,
          roomNumber,
          capacity: {
            adults: Number(formData.numAdults) || 1,
            children: Number(formData.numChildren) || 0,
            total: (Number(formData.numAdults) || 1) + (Number(formData.numChildren) || 0),
            capacityText: "",
          },
          price: property.pricing.type === "perRoom" && formData.price !== "" ? Number(formData.price) : null,
          extraPersonCharge:
            property.pricing.type === "perRoom" && formData.extraPersonCharge
              ? Number(formData.extraPersonCharge)
              : null,
          perPersonPrices:
            property.pricing.type === "perPerson"
              ? {
                  1: Number(formData.adultRate) || 0,
                  2: Number(formData.adultRate) * 2 || 0,
                  3: Number(formData.adultRate) * 3 || 0,
                }
              : null,
          adultRate:
            property.pricing.type === "perPerson"
              ? Number(formData.adultRate) || 0
              : null,
          childRate:
            property.pricing.type === "perPerson"
              ? Number(formData.childRate) || 0
              : null,
          numAdults:
            property.pricing.type === "perPerson"
              ? Number(formData.numAdults) || 1
              : null,
          numChildren:
            property.pricing.type === "perPerson"
              ? Number(formData.numChildren) || 0
              : null,
          amenities: formData.amenities,
          agentCommission: formData.agentCommission
            ? Number(formData.agentCommission)
            : null,
          advanceAmount: formData.advanceAmount
            ? Number(formData.advanceAmount)
            : null,
          images, // array of keys for this room
          calculatedTotalPrice
        };
      });
      // Debug: log the payload before sending
      console.log('Room payloads:', roomPayloads);
      // Attach all images to FormData
      imageKeys.forEach(({ key, file }) => {
        if (file) fd.append(key, file);
      });
      // Attach room data as JSON
      fd.append('roomData', JSON.stringify({ rooms: roomPayloads }));
      // Send to /api/rooms/with-images
      const res = await fetch("/api/rooms/with-images", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save rooms");
      }
      alert("Rooms saved successfully!");
      // Refresh room data
      const refreshRes = await fetch(`/api/rooms?propertyId=${property._id}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setRooms(refreshData.rooms || []);
      }
      setSelectedCategory("");
      resetForm();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle the delete confirmation modal
  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
  };

  // Function to close the delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteConfirm(false);
    setRoomToDelete(null);
  };

  // Function to handle the actual deletion
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    setIsDeleting(true);
    setError("");
    
    try {
      const res = await fetch(`/api/rooms/${roomToDelete._id}`, {
        method: "DELETE"
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete room");
      }
      
      // Remove the deleted room from the local state
      setRooms(rooms.filter(room => room._id !== roomToDelete._id));

      // Refresh property and rooms from backend
      try {
        const propertyRes = await fetch("/api/property/host");
        if (propertyRes.ok) {
          const propertyData = await propertyRes.json();
          if (propertyData.property) {
            setProperty(propertyData.property);
            const roomsRes = await fetch(`/api/rooms?propertyId=${propertyData.property._id}`);
            if (roomsRes.ok) {
              const roomsData = await roomsRes.json();
              setRooms(roomsData.rooms || []);
            } else {
              setError("Could not refresh rooms after deletion.");
            }
          } else {
            setProperty(null);
            setRooms([]);
            setCategories([]);
          }
        } else {
          setError("Could not refresh property after deletion.");
        }
      } catch (refreshError) {
        setError("An error occurred while refreshing data after deletion.");
      }

      // Close the modal
      closeDeleteModal();
      // Show success message
      alert("Room deleted successfully!");
      // Check if we need to update categories
      const remainingRoomsInCategory = rooms.filter(
        room => room.category === roomToDelete.category && room._id !== roomToDelete._id
      );
      if (remainingRoomsInCategory.length === 0) {
        setCategories(categories.filter(cat => cat !== roomToDelete.category));
      }
      
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to calculate total price for a room
  const calculateTotalPrice = (room) => {
    if (property?.pricing?.type === "perRoom") {
      return room.pricing?.price || 0;
    } else {
      const adultRate = room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0;
      const childRate = room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) / 2) || 0;
      const numAdults = room.numAdults || 1;
      const numChildren = room.numChildren || 0;
      return (numAdults * adultRate) + (numChildren * childRate);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">Unauthorized Access</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">No property found. Please register a property first.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Room Management</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 sm:mb-8">
          <p className="text-base sm:text-lg text-gray-600">
            Manage rooms for your property: {property.name}
          </p>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm w-fit">
            {property.pricing.type === "perRoom" ? "Per Room Pricing" : "Per Person Pricing"}
          </span>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Existing Rooms Summary */}
        {rooms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Existing Rooms</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <div className="min-w-full">
                {/* Mobile view - card layout */}
                <div className="sm:hidden">
                  {rooms.map((room) => (
                    <div key={room._id} className="border-b border-gray-200 p-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold">{room.roomNumber}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleCategorySelect(room.category)}
                            className="inline-flex items-center px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(room)}
                            className="inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <div><span className="font-medium text-gray-700">Category:</span> {room.category}</div>
                        <div><span className="font-medium text-gray-700">Capacity:</span> {room.capacity?.total} {room.capacity?.total === 1 ? 'Person' : 'People'}</div>
                        
                        {property.pricing.type === "perRoom" ? (
                          <div><span className="font-medium text-gray-700">Price:</span> ₹{room.pricing?.price}</div>
                        ) : (
                          <div className="space-y-1">
                            {/* Total Price Calculation */}
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">Total Room Price:</span>
                              <span className="font-bold text-green-600">₹{calculateTotalPrice(room).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-2 text-xs text-gray-600">
                              <div><span className="font-medium">Adults:</span> {room.numAdults || 1} × ₹{room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0} = ₹{((room.numAdults || 1) * (room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0)).toLocaleString()}</div>
                              <div><span className="font-medium">Children:</span> {room.numChildren || 0} × ₹{room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) / 2) || 0} = ₹{((room.numChildren || 0) * (room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) / 2) || 0)).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium text-gray-700">Amenities:</span>{' '}
                          {room.amenities?.map(amenity => {
                            const option = amenitiesOptions.find(opt => opt.id === amenity);
                            return option ? option.label : amenity;
                          }).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop view - table layout */}
                <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room Number
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {property.pricing.type === "perRoom" ? "Price" : "Pricing"}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amenities
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rooms.map((room) => (
                      <tr key={room._id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {room.roomNumber}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {room.category}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {room.capacity?.total} {room.capacity?.total === 1 ? 'Person' : 'People'}
                        </td>
                        
                        {property.pricing.type === "perRoom" ? (
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₹{room.pricing?.price}
                          </td>
                        ) : (
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                            <div className="space-y-1">
                              {/* Total Price Calculation */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-700">Total Room Price:</span>
                                <span className="font-bold text-green-600">₹{calculateTotalPrice(room).toLocaleString()}</span>
                              </div>
                              
                              <div className="border-t border-gray-100 pt-2 text-xs text-gray-600">
                                <div><span className="font-medium">Adults:</span> {room.numAdults || 1} × ₹{room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0} = ₹{((room.numAdults || 1) * (room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0)).toLocaleString()}</div>
                                <div><span className="font-medium">Children:</span> {room.numChildren || 0} × ₹{room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1])/2) || 0} = ₹{((room.numChildren || 0) * (room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1])/2) || 0)).toLocaleString()}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {room.amenities?.map(amenity => {
                            const option = amenitiesOptions.find(opt => opt.id === amenity);
                            return option ? option.label : amenity;
                          }).join(', ')}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleCategorySelect(room.category)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(room)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Room Categories</h2>
          
          {!selectedCategory && !showCategoryForm && (
            <div className="space-y-4">
              <p className="text-gray-600">Select an existing category or create a new one:</p>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 text-sm sm:text-base"
                  >
                    {category}
                  </button>
                ))}
                
                <button
                  onClick={() => handleCategorySelect("custom")}
                  className="px-3 sm:px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm sm:text-base"
                >
                  + Add New Category
                </button>
              </div>
            </div>
          )}

          {showCategoryForm && (
            <div className="mt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={createCustomCategory}
                    className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCategoryForm(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Details Form */}
        {selectedCategory && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                {selectedCategory} Details
              </h2>
              <button
                onClick={() => setSelectedCategory("")}
                className="text-gray-500 hover:text-gray-700"
              >
                &times; Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Capacity
                </label>
                <select
                  name="capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1">Single Room (1 person)</option>
                  <option value="2">Double Room (2 people)</option>
                  <option value="3">Triple Room (3 people)</option>
                  <option value="4">Four Room (4 people)</option>
                  <option value="5+">Dormitory (5+ people)</option>
                </select>
              </div>

              {/* Pricing Section - Based on property pricing type */}
              {property.pricing.type === "perRoom" ? (
                <div>
                  {/* Only show this section for perRoom pricing */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate per Room
                  </label>
                  <div className="flex items-center">
                    <span className="mr-2">₹</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      min="0"
                      placeholder="1000"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {/* Extra Person Charge - Only for "perRoom" pricing */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extra Person Charge (optional)
                    </label>
                    <div className="flex items-center">
                      <span className="mr-2">₹</span>
                      <input
                        type="number"
                        name="extraPersonCharge"
                        value={formData.extraPersonCharge}
                        onChange={(e) => setFormData({ ...formData, extraPersonCharge: e.target.value })}
                        min="0"
                        placeholder="500"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Only show this section for perPerson pricing */}
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Per Person Pricing
                  </label>
                  <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-indigo-800">
                      Set the price per adult. Child rate (5-10 years) is automatically calculated at half the adult rate.
                    </p>
                  </div>
                  {/* Adult Rate */}
                  <div className="mb-4 border-b border-gray-100 pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adult Rate (Per Person)
                    </label>
                    <div className="flex items-center">
                      <span className="mr-2">₹</span>
                      <input
                        type="number"
                        value={formData.adultRate || ""}
                        onChange={(e) => {
                          const adultRate = e.target.value;
                          // Calculate child rate as half of adult rate
                          const childRate = adultRate ? Math.floor(Number(adultRate) / 2) : "";
                          setFormData({
                            ...formData,
                            adultRate,
                            childRate,
                            perPersonPrices: {
                              1: adultRate,
                              2: adultRate * 2,
                              3: adultRate * 3
                            }
                          });
                        }}
                        min="0"
                        placeholder="1000"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  {/* Child Rate Display (calculated field) */}
                  <div className="mb-4 border-b border-gray-100 pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Child Rate (5-10 years)
                    </label>
                    <div className="flex items-center relative">
                      <span className="mr-2">₹</span>
                      <input
                        type="number"
                        value={formData.childRate || ""}
                        readOnly
                        className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                      <span className="absolute right-3 text-xs text-gray-500">(Half of adult rate)</span>
                    </div>
                  </div>
                  {/* Number of Adults */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Adults
                    </label>
                    <input
                      type="number"
                      value={formData.numAdults || "1"}
                      onChange={(e) => {
                        const numAdults = Math.max(1, parseInt(e.target.value) || 1); // Minimum 1 adult
                        setFormData({
                          ...formData,
                          numAdults
                        });
                      }}
                      min="1"
                      max="10"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {/* Number of Children */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Children (5-10 years)
                    </label>
                    <input
                      type="number"
                      value={formData.numChildren || "0"}
                      onChange={(e) => {
                        const numChildren = Math.max(0, parseInt(e.target.value) || 0);
                        setFormData({
                          ...formData,
                          numChildren
                        });
                      }}
                      min="0"
                      max="10"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {/* Total Price Calculation */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Price Breakdown</h3>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Adults: {formData.numAdults || 1} × ₹{formData.adultRate || 0}</span>
                        <span>₹{(formData.numAdults || 1) * (formData.adultRate || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Children: {formData.numChildren || 0} × ₹{formData.childRate || 0}</span>
                        <span>₹{(formData.numChildren || 0) * (formData.childRate || 0)}</span>
                      </div>
                    </div>
                    <div className="border-t border-green-200 pt-2 flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Room Price:</span>
                      <span className="text-lg font-bold text-green-700">
                        ₹{
                          ((formData.numAdults || 1) * (formData.adultRate || 0) + 
                          (formData.numChildren || 0) * (formData.childRate || 0)).toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {amenitiesOptions.map(option => (
                    <label key={option.id} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(option.id)}
                        onChange={() => handleAmenityChange(option.id)}
                        className="form-checkbox text-indigo-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can upload multiple photos. Each photo should be less than 5MB.
                </p>
                {formData.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.images.map((file, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        {file.name} ({Math.round(file.size / 1024)}KB)
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Agent Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Commission (optional)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="agentCommission"
                    value={formData.agentCommission}
                    onChange={(e) => setFormData({ ...formData, agentCommission: e.target.value })}
                    min="0"
                    max="100"
                    placeholder="10"
                    className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-2">%</span>
                </div>
              </div>

              {/* Advance Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Amount (optional)
                </label>
                <div className="flex items-center">
                  <span className="mr-2">₹</span>
                  <input
                    type="number"
                    name="advanceAmount"
                    value={formData.advanceAmount}
                    onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                    min="0"
                    placeholder="1000"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Room Numbers */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0">
                    Room Numbers/Names
                  </label>
                  <button
                    type="button"
                    onClick={addRoomNumber}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Room
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.roomNumbers.map((roomNumber, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => handleRoomNumberChange(index, e.target.value)}
                        placeholder="101"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      {formData.roomNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoomNumber(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 sm:px-6 py-2 ${
                    isSubmitting ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                  } text-white rounded-md font-semibold transition duration-300 text-sm sm:text-base`}
                >
                  {isSubmitting ? "Saving..." : "Save Rooms"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete room <span className="font-medium">{roomToDelete?.roomNumber}</span> from category <span className="font-medium">{roomToDelete?.category}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                disabled={isDeleting}
                className={`px-4 py-2 ${
                  isDeleting ? "bg-red-400" : "bg-red-600 hover:bg-red-700"
                } text-white rounded-md transition-colors flex items-center`}
              >
                {isDeleting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}