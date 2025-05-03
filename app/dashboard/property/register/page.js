"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PropertyRegistrationForm() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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
    pricingType: "perPerson", // Default value
    // priceValue field removed as requested
  });

  if (status === "loading") {
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
        // value field removed - will be defined per room later
      }
    };

    try {
      const res = await fetch("/api/property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to register property");
      }

      const data = await res.json();
      
      // Update user's onboarding status
      await fetch("/api/users/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          completed: true,
          propertyId: data.propertyId 
        }),
      });
      
      // Show success with the unique URL before redirecting
      alert(`Property registered successfully! Your unique URL is: ${data.uniqueUrl}`);
      
      // Redirect to host dashboard
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
          <h2 className="text-2xl font-bold text-indigo-700">Register Your Property</h2>
          <p className="text-sm text-gray-500">Please enter all the required details to complete your registration.</p>
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

        {/* Pricing Type Radio Buttons - Only keep this section */}
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
        {/* Price Value Field removed as requested */}

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

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${
            isSubmitting ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
          } text-white py-3 rounded-md font-semibold transition duration-300`}
        >
          {isSubmitting ? "Submitting..." : "Register Property"}
        </button>
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