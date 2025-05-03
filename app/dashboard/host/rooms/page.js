"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RoomManagement() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [property, setProperty] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);

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
    // Handle multiple image uploads
    const files = Array.from(e.target.files);
    // In a real implementation, you would upload these to storage
    // and get back URLs. For now, we'll just store the File objects
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

    if (property.pricing.type === "perPerson" && 
        (!formData.perPersonPrices[1] || !formData.perPersonPrices[2] || !formData.perPersonPrices[3])) {
      setError("All per-person prices are required");
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
      // Create payload for each room
      const roomPayloads = formData.roomNumbers.map(roomNumber => ({
        propertyId: property._id,
        category: selectedCategory || formData.categoryName,
        roomNumber,
        capacity: formData.capacity,
        price: property.pricing.type === "perRoom" ? Number(formData.price) : null,
        perPersonPrices: property.pricing.type === "perPerson" ? {
          1: Number(formData.perPersonPrices[1]),
          2: Number(formData.perPersonPrices[2]),
          3: Number(formData.perPersonPrices[3])
        } : null,
        amenities: formData.amenities,
        extraPersonCharge: formData.extraPersonCharge ? Number(formData.extraPersonCharge) : null,
        agentCommission: formData.agentCommission ? Number(formData.agentCommission) : null,
        advanceAmount: formData.advanceAmount ? Number(formData.advanceAmount) : null,
      }));

      // Send API request to save rooms
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: roomPayloads }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save rooms");
      }

      // Handle image uploads separately (in a real implementation)
      // For each room, you would upload images and associate them with the room ID

      alert("Rooms saved successfully!");
      
      // Refresh room data
      const refreshRes = await fetch(`/api/rooms?propertyId=${property._id}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setRooms(refreshData.rooms || []);
      }
      
      // Reset form and selection
      setSelectedCategory("");
      resetForm();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Room Management</h1>
        <p className="text-lg text-gray-600 mb-8">
          Manage rooms for your property: {property.name}
          <span className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
            {property.pricing.type === "perRoom" ? "Per Room Pricing" : "Per Person Pricing"}
          </span>
        </p>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Existing Rooms Summary */}
        {rooms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Existing Rooms</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {property.pricing.type === "perRoom" ? "Price" : "Base Price (1 Person)"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amenities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rooms.map((room) => (
                    <tr key={room._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {room.roomNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.capacity} {parseInt(room.capacity) === 1 ? 'Person' : 'People'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{property.pricing.type === "perRoom" 
                          ? room.price 
                          : (room.perPersonPrices && room.perPersonPrices[1])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.amenities?.map(amenity => {
                          const option = amenitiesOptions.find(opt => opt.id === amenity);
                          return option ? option.label : amenity;
                        }).join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => handleCategorySelect(room.category)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Room Categories</h2>
          
          {!selectedCategory && !showCategoryForm && (
            <div className="space-y-4">
              <p className="text-gray-600">Select an existing category or create a new one:</p>
              
              <div className="flex flex-wrap gap-3">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
                  >
                    {category}
                  </button>
                ))}
                
                <button
                  onClick={() => handleCategorySelect("custom")}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100"
                >
                  + Add New Category
                </button>
              </div>
            </div>
          )}

          {showCategoryForm && (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={createCustomCategory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Room Details Form */}
        {selectedCategory && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">
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
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rates per Person
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-32">1 Person:</span>
                      <span className="mr-2">₹</span>
                      <input
                        type="number"
                        value={formData.perPersonPrices[1]}
                        onChange={(e) => setFormData({
                          ...formData,
                          perPersonPrices: {
                            ...formData.perPersonPrices,
                            1: e.target.value
                          }
                        })}
                        min="0"
                        placeholder="1000"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="w-32">2 Persons:</span>
                      <span className="mr-2">₹</span>
                      <input
                        type="number"
                        value={formData.perPersonPrices[2]}
                        onChange={(e) => setFormData({
                          ...formData,
                          perPersonPrices: {
                            ...formData.perPersonPrices,
                            2: e.target.value
                          }
                        })}
                        min="0"
                        placeholder="1600"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="w-32">3 Persons:</span>
                      <span className="mr-2">₹</span>
                      <input
                        type="number"
                        value={formData.perPersonPrices[3]}
                        onChange={(e) => setFormData({
                          ...formData,
                          perPersonPrices: {
                            ...formData.perPersonPrices,
                            3: e.target.value
                          }
                        })}
                        min="0"
                        placeholder="2100"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

              {/* Extra Person Charge - Only show for "perRoom" pricing */}
              {property.pricing.type === "perRoom" && (
                <div>
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
              )}

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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
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
                  className={`px-6 py-2 ${
                    isSubmitting ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                  } text-white rounded-md font-semibold transition duration-300`}
                >
                  {isSubmitting ? "Saving..." : "Save Rooms"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}