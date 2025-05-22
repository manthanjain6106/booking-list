// app/dashboard/host/page.js
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
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (session && session.user?.role) {
      setRole(session.user.role);
      
      const checkProperty = async () => {
        try {
          const res = await fetch("/api/property/host");
          if (res.ok) {
            const data = await res.json();
            console.log('Property API response:', data);
            
            if (data.property) {
              setProperty(data.property);
              
              // Check if property has a valid ID
              const propertyId = data.property._id || data.property.id;
              console.log('Property ID found:', propertyId);
              
              if (propertyId) {
                await fetchStats(propertyId);
              } else {
                console.error('Property has no ID field');
                setStats({
                  todayCheckIns: 0,
                  todayCheckOuts: 0,
                  occupancyRate: 0,
                  totalBookings: 0
                });
              }
            } else {
              console.log('No property found in response');
              setProperty(null);
              router.replace("/dashboard/property/register");
            }
          } else {
            console.log('Property API failed with status:', res.status);
            setProperty(null);
            router.replace("/dashboard/property/register");
          }
        } catch (error) {
          console.error("Failed to check property:", error);
          setProperty(null);
        } finally {
          setIsLoading(false);
        }
      };

      const fetchStats = async (propertyId) => {
        try {
          console.log('Fetching stats for property ID:', propertyId);
          
          if (!propertyId) {
            console.error('No property ID provided to fetchStats');
            setStats({
              todayCheckIns: 0,
              todayCheckOuts: 0,
              occupancyRate: 0,
              totalBookings: 0
            });
            return;
          }

          const res = await fetch(`/api/dashboard/stats?propertyId=${propertyId}`);
          console.log('API Response status:', res.status);
          
          const data = await res.json();
          console.log('API Response data:', data);
          
          if (res.ok && data.success) {
            setStats({
              todayCheckIns: data.todayCheckIns || 0,
              todayCheckOuts: data.todayCheckOuts || 0,
              occupancyRate: data.occupancyRate || 0,
              totalBookings: data.totalBookings || 0
            });
            console.log('✅ Stats set successfully');
          } else {
            console.error('API Error:', data.error || 'Unknown error');
            setStats({
              todayCheckIns: 0,
              todayCheckOuts: 0,
              occupancyRate: 0,
              totalBookings: 0
            });
          }
        } catch (error) {
          console.error("❌ fetchStats error:", error);
          setStats({
            todayCheckIns: 0,
            todayCheckOuts: 0,
            occupancyRate: 0,
            totalBookings: 0
          });
        }
      };
      
      checkProperty();
    }
  }, [session, router]);

  const copyUrl = async () => {
    if (!property) return;
    const url = `${window.location.origin}/stay/${property.uniqueUrl}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-slate-600">Please sign in to access your host dashboard.</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-700 border-blue-100",
      green: "bg-emerald-50 text-emerald-700 border-emerald-100",
      amber: "bg-amber-50 text-amber-700 border-amber-100",
      purple: "bg-purple-50 text-purple-700 border-purple-100"
    };

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
              <div className="hidden sm:block">
                <nav className="flex space-x-8">
                  <span className="text-blue-600 border-b-2 border-blue-600 px-1 pb-4 text-sm font-medium">
                    Overview
                  </span>
                </nav>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{session.user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{role} Account</p>
              </div>
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-700">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {session.user.name}
          </h2>
          <p className="text-slate-600 mt-1">Here's what's happening with your property today.</p>
        </div>

        {/* No Property State */}
        {!property && (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Property Listed</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Get started by registering your first property. Once added, you'll be able to manage bookings, track occupancy, and more.
            </p>
            <button 
              onClick={() => router.push("/dashboard/property/register")}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Property
            </button>
          </div>
        )}

        {/* Property Dashboard */}
        {property && (
          <div className="space-y-8">
            
            {/* Stats Overview */}
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Today's Check-ins"
                  value={stats.todayCheckIns}
                  subtitle="Guests arriving"
                  color="blue"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  }
                />
                <StatCard
                  title="Today's Check-outs"
                  value={stats.todayCheckOuts}
                  subtitle="Guests departing"
                  color="green"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                />
                <StatCard
                  title="Occupancy Rate"
                  value={`${stats.occupancyRate}%`}
                  subtitle="Current month"
                  color="amber"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
                <StatCard
                  title="Total Bookings"
                  value={stats.totalBookings}
                  subtitle="This month"
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                          <div className="h-8 bg-slate-200 rounded w-16 mb-1"></div>
                          <div className="h-3 bg-slate-200 rounded w-20"></div>
                        </div>
                        <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => router.push("/dashboard/host/rooms")}
                    className="flex items-center p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all group"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Manage Rooms</h4>
                      <p className="text-sm text-slate-500">Update pricing, availability and room details</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => router.push("/dashboard/host/today")}
                    className="flex items-center p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Today's Schedule</h4>
                      <p className="text-sm text-slate-500">View today's check-ins and check-outs</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => router.push("/dashboard/host/checkin")}
                    className="flex items-center p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all group"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-emerald-200 transition-colors">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Guest Check-in</h4>
                      <p className="text-sm text-slate-500">Process guest arrivals and departures</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Property Details */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{property.name}</h3>
                  <button 
                    onClick={() => router.push("/dashboard/property/edit")}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit Property
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Location</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>{property.location.address}</p>
                        <p>{property.location.city}, {property.location.state}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Property Details</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>{property.totalRooms} rooms available</p>
                        <p>₹{property.pricing?.value} {property.pricing?.type === 'perPerson' ? 'per person' : 'per room'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Contact</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>{property.phoneNumbers[0]}</p>
                        {property.phoneNumbers[1] && <p>{property.phoneNumbers[1]}</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Payment</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>UPI: {property.paymentId}</p>
                        <p>Bank: {property.bankAccountName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking URL Card */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Booking Link</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-4">
                    Share this link with guests to book your property directly.
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <code className="text-xs text-slate-700 break-all">
                        {typeof window !== 'undefined' 
                          ? `${window.location.origin}/stay/${property.uniqueUrl}`
                          : `/stay/${property.uniqueUrl}`
                        }
                      </code>
                    </div>
                    <button 
                      onClick={copyUrl}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {copied ? 'Copied to clipboard!' : 'Copy booking link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Booking Calendar</h3>
                <p className="text-sm text-slate-600 mt-1">Overview of your reservations and availability</p>
              </div>
              <div className="p-6">
                <HostDashboardCalendar />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}