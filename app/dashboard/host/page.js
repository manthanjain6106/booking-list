"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HostDashboardCalendar from "../../../components/HostDashboardCalendar";

export default function HostDashboard() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState(null);
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (session && session.user?.role) {
      setRole(session.user.role);
      
      // Check if the host has a registered property
      const checkProperty = async () => {
        try {
          const res = await fetch("/api/property/host");
          if (res.ok) {
            const data = await res.json();
            setProperty(data.property);
            setIsLoading(false);
          } else {
            // If status is 404, no property found
            setProperty(null);
            setIsLoading(false);
            
            // Redirect to property registration form
            router.replace("/dashboard/property/register");
          }
        } catch (error) {
          console.error("Failed to check property:", error);
          setProperty(null);
          setIsLoading(false);
        }
      };
      
      checkProperty();
    }
  }, [session, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return <div className="p-6 text-lg text-red-600">Unauthorized Access</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, Host</h1>
      <p className="text-lg text-gray-600 mb-4">
        Hello {session.user.name}, your role is <strong>{role}</strong>.
      </p>

      {property && (
        <div className="mb-6 bg-white rounded-md shadow-md p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-indigo-700 mb-2">Your Property</h2>
            <button 
              onClick={() => router.push("/dashboard/property/edit")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
            >
              Edit Property
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Property Details</h3>
              <p className="text-gray-600"><span className="font-medium">Name:</span> {property.name}</p>
              <p className="text-gray-600"><span className="font-medium">Location:</span> {property.location.address}, {property.location.city}, {property.location.state}</p>
              <p className="text-gray-600"><span className="font-medium">Total Rooms:</span> {property.totalRooms}</p>
              <p className="text-gray-600">
                <span className="font-medium">Pricing:</span> &#8377;{property.pricing?.value} 
                {property.pricing?.type === 'perPerson' ? ' per person' : ' per room'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Payment Information</h3>
              <p className="text-gray-600"><span className="font-medium">UPI ID:</span> {property.paymentId}</p>
              <p className="text-gray-600"><span className="font-medium">Bank Account:</span> {property.bankAccountName}</p>
              <p className="text-gray-600"><span className="font-medium">Primary Phone:</span> {property.phoneNumbers[0]}</p>
              {property.phoneNumbers[1] && (
                <p className="text-gray-600"><span className="font-medium">Alternate Phone:</span> {property.phoneNumbers[1]}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium text-gray-700">Your Unique URL</h3>
            <p className="text-indigo-600 break-all">
              {`${window.location.origin}/stay/${property.uniqueUrl}`}
            </p>
          </div>
        </div>
      )}

{/* Responsive Quick Actions Buttons Component */}
<div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
  <h2 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-3 sm:mb-4">Quick Actions</h2>
  
  <div className="grid gap-3 sm:gap-4">
    {!property ? (
      <button 
        onClick={() => router.push("/dashboard/property/register")}
        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md px-4 py-3 transition-colors flex items-center justify-between group"
      >
        <span className="text-sm sm:text-base">Register a new property</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    ) : (
      <>
        <button 
          onClick={() => router.push("/dashboard/host/rooms")}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md px-4 py-3 transition-colors flex items-center justify-between group"
        >
          <span className="text-sm sm:text-base">Manage your rooms and pricing</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <button 
          onClick={() => router.push("/dashboard/host/bookings")}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md px-4 py-3 transition-colors flex items-center justify-between group"
        >
          <span className="text-sm sm:text-base">View today&apos;s bookings</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <button 
          onClick={() => router.push("/dashboard/host/checkin")}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md px-4 py-3 transition-colors flex items-center justify-between group"
        >
          <span className="text-sm sm:text-base">Check-in / Check-out guests</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </>
    )}
  </div>
</div>

      {property && <HostDashboardCalendar />}
    </div>
  );
}