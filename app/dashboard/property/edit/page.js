"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EditPropertyForm() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    paymentId: "",
    bankAccountName: "",
    phone1: "",
    phone2: "",
    totalRooms: "",
    pricingType: "perPerson",
    priceValue: "",
  });

  useEffect(() => {
    // Fetch property details to populate the form
    const fetchProperty = async () => {
      try {
        const res = await fetch("/api/property/host");
        if (res.ok) {
          const data = await res.json();
          const property = data.property;
          setProperty(property);
          
          // Populate form with existing data
          setFormData({
            name: property.name || "",
            address: property.location.address || "",
            city: property.location.city || "",
            state: property.location.state || "",
            country: property.location.country || "",
            pinCode: property.location.pinCode || "",
            paymentId: property.paymentId || "",
            bankAccountName: property.bankAccountName || "",
            phone1: property.phoneNumbers[0] || "",
            phone2: property.phoneNumbers[1] || "",
            totalRooms: property.totalRooms || "",
            pricingType: property.pricing?.type || "perPerson",
            priceValue: property.pricing?.value || "",
          });
        } else {
          // Handle case where property is not found
          setError("Could not load property details. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch property:", error);
        setError("An error occurred while loading property details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProperty();
    }
  }, [session]);

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

  if (!property && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">No property found. Please register a property first.</div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === "radio") {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.name.trim()) return "Property name is required";
    if (!formData.paymentId.trim()) return "Payment ID is required";
    if (!formData.bankAccountName.trim()) return "Bank account name is required";
    if (!formData.phone1.trim()) return "Primary phone number is required";
    if (!/^\d{10}$/.test(formData.phone1.trim())) return "Phone number must be 10 digits";
    if (formData.phone2.trim() && !/^\d{10}$/.test(formData.phone2.trim())) return "Alternate phone number must be 10 digits";
    if (!formData.totalRooms || formData.totalRooms <= 0) return "Total rooms must be at least 1";
    if (!formData.priceValue || formData.priceValue <= 0) return `Price ${formData.pricingType === 'perPerson' ? 'per person' : 'per room'} must be greater than 0`;
    
    // Location validation
    if (!formData.address.trim()) return "Address is required";
    if (!formData.city.trim()) return "City is required";
    if (!formData.state.trim()) return "State is required";
    if (!formData.country.trim()) return "Country is required";
    if (!formData.pinCode.trim()) return "PIN code is required";
    
    return null; // No errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    const payload = {
      propertyId: property._id,
      name: formData.name,
      location: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pinCode: formData.pinCode,
      },
      paymentId: formData.paymentId,
      bankAccountName: formData.bankAccountName,
      phoneNumbers: [formData.phone1, formData.phone2].filter(Boolean),
      totalRooms: Number(formData.totalRooms),
      pricing: {
        type: formData.pricingType,
        value: Number(formData.priceValue)
      }
    };

    try {
      const res = await fetch("/api/property/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update property");
      }
      
      // Show success message
      alert("Property updated successfully!");
      
      // Redirect back to host dashboard
      router.push("/dashboard/host");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-indigo-700">Edit Your Property</h2>
          <p className="text-sm text-gray-500">Update your property details below.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Property Name" name="name" value={formData.name} onChange={handleChange} required />
          <Input 
            label="UPI ID" 
            name="paymentId" 
            value={formData.paymentId} 
            onChange={handleChange} 
            placeholder="e.g., yourname@upi" 
            required 
          />
          <Input 
            label="Name in Bank Account" 
            name="bankAccountName" 
            value={formData.bankAccountName} 
            onChange={handleChange} 
            placeholder="Name as per bank records" 
            required 
          />
          <Input 
            label="Phone Number (WhatsApp)" 
            name="phone1" 
            value={formData.phone1} 
            onChange={handleChange} 
            type="tel" 
            pattern="[0-9]{10}" 
            placeholder="10-digit number" 
            required 
          />
          <Input 
            label="Alternate Phone" 
            name="phone2" 
            value={formData.phone2} 
            onChange={handleChange} 
            type="tel" 
            pattern="[0-9]{10}" 
            placeholder="10-digit number (optional)" 
          />
          <Input 
            label="Total Rooms" 
            name="totalRooms" 
            value={formData.totalRooms} 
            onChange={handleChange} 
            type="number" 
            min="1" 
            required 
          />
        </div>

        {/* Pricing Type Radio Buttons */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">Pricing Type</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="pricingType"
                value="perPerson"
                checked={formData.pricingType === "perPerson"}
                onChange={handleChange}
                className="form-radio text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Per Person</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="pricingType"
                value="perRoom"
                checked={formData.pricingType === "perRoom"}
                onChange={handleChange}
                className="form-radio text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Per Room</span>
            </label>
          </div>
        </div>

        {/* Price Value Field */}
        <div className="w-full sm:w-1/2">
          <Input 
            label={`Price ${formData.pricingType === 'perPerson' ? 'Per Person' : 'Per Room'}`}
            name="priceValue" 
            value={formData.priceValue} 
            onChange={handleChange} 
            type="number" 
            min="1" 
            required 
          />
        </div>

        <h3 className="text-md font-semibold text-gray-700 mt-6">Property Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Address" name="address" value={formData.address} onChange={handleChange} required />
          <Input label="City" name="city" value={formData.city} onChange={handleChange} required />
          <Input label="State" name="state" value={formData.state} onChange={handleChange} required />
          <Input label="Country" name="country" value={formData.country} onChange={handleChange} required />
          <Input 
            label="PIN Code" 
            name="pinCode" 
            value={formData.pinCode} 
            onChange={handleChange} 
            type="text" 
            pattern="[0-9]{6}" 
            placeholder="6-digit PIN code" 
            required 
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 ${
              isSubmitting ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
            } text-white py-3 rounded-md font-semibold transition duration-300`}
          >
            {isSubmitting ? "Updating..." : "Update Property"}
          </button>
          
          <button
            type="button"
            onClick={() => router.push("/dashboard/host")}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-md font-semibold hover:bg-gray-400 transition duration-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}