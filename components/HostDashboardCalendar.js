// app/components/HostDashboardCalendar.js
"use client";

import { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';

export default function HostDashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState([]);
  
  // Fetch bookings for the current month
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
        
        const res = await fetch(`/api/bookings/host?start=${monthStart}&end=${monthEnd}`);
        
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        } else {
          console.error('Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [currentDate]);
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };
  
  // Calculate days to display (for current month)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for the first day of month (0 = Sunday, 6 = Saturday)
  const startDay = monthStart.getDay();
  
  // Calculate days from previous month to display
  const daysFromPreviousMonth = [];
  for (let i = 0; i < startDay; i++) {
    daysFromPreviousMonth.unshift(subDays(monthStart, i + 1));
  }
  
  // Calculate days from next month to display
  const endDay = 6 - monthEnd.getDay();
  const daysFromNextMonth = [];
  for (let i = 0; i < endDay; i++) {
    daysFromNextMonth.push(addDays(monthEnd, i + 1));
  }
  
  // Combine all days to display
  const allDays = [...daysFromPreviousMonth, ...daysInMonth, ...daysFromNextMonth];
  
  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
    
    // Find bookings for this date
    const dayBookings = bookings.filter(booking => {
      const checkInDate = parseISO(booking.checkIn);
      const checkOutDate = parseISO(booking.checkOut);
      
      // Check if the selected date falls within the booking period
      return (
        (date >= checkInDate && date <= checkOutDate) ||
        isSameDay(date, checkInDate) ||
        isSameDay(date, checkOutDate)
      );
    });
    
    setSelectedBookings(dayBookings);
  };
  
  // Get booking status for a specific date
  const getBookingStatusForDate = (date) => {
    // Find bookings that include this date
    const dayBookings = bookings.filter(booking => {
      const checkInDate = parseISO(booking.checkIn);
      const checkOutDate = parseISO(booking.checkOut);
      
      return (
        (date >= checkInDate && date <= checkOutDate) ||
        isSameDay(date, checkInDate) ||
        isSameDay(date, checkOutDate)
      );
    });
    
    if (dayBookings.length === 0) return null;
    
    // Check if any check-ins on this date
    const hasCheckIn = dayBookings.some(booking => 
      isSameDay(date, parseISO(booking.checkIn))
    );
    
    // Check if any check-outs on this date
    const hasCheckOut = dayBookings.some(booking => 
      isSameDay(date, parseISO(booking.checkOut))
    );
    
    if (hasCheckIn && hasCheckOut) return 'change'; // Room changes
    if (hasCheckIn) return 'checkin';
    if (hasCheckOut) return 'checkout';
    return 'booked'; // Date falls within a booking period
  };

  // Get color class based on booking status
  const getColorForStatus = (status) => {
    switch (status) {
      case 'checkin':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'checkout':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'change':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'booked':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'hover:bg-gray-100';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Booking Calendar</h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToCurrentMonth}
            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium text-gray-700">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-md overflow-hidden">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={index} className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {allDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const bookingStatus = getBookingStatusForDate(day);
              const colorClass = getColorForStatus(bookingStatus);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    py-3 bg-white relative
                    ${!isCurrentMonth ? 'text-gray-400' : ''}
                    ${isToday ? 'font-bold' : ''}
                    ${isSelected ? 'ring-2 ring-indigo-500' : ''}
                    ${colorClass}
                  `}
                >
                  <div className="text-center">
                    {format(day, 'd')}
                  </div>
                  
                  {/* Booking indicators */}
                  {bookingStatus && (
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-0.5">
                      <span className="h-1 w-1 rounded-full bg-current"></span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Check-in</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Check-out</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-100 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Room Change</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Booked</span>
            </div>
          </div>
          
          {/* Selected Date Bookings */}
          {selectedDate && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Bookings for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              
              {selectedBookings.length === 0 ? (
                <p className="text-gray-500 text-sm">No bookings for this day.</p>
              ) : (
                <div className="space-y-3">
                  {selectedBookings.map((booking, index) => {
                    const checkInDate = parseISO(booking.checkIn);
                    const checkOutDate = parseISO(booking.checkOut);
                    const isCheckIn = isSameDay(selectedDate, checkInDate);
                    const isCheckOut = isSameDay(selectedDate, checkOutDate);
                    
                    return (
                      <div 
                        key={index}
                        className={`
                          p-3 rounded-md border 
                          ${isCheckIn && isCheckOut 
                            ? 'bg-purple-50 border-purple-200' 
                            : isCheckIn 
                              ? 'bg-green-50 border-green-200' 
                              : isCheckOut 
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-blue-50 border-blue-200'
                          }
                        `}
                      >
                        <div className="flex justify-between mb-1">
                          <h4 className="font-medium">
                            {booking.guestName}
                          </h4>
                          <div className="text-sm">
                            {booking.roomType || booking.category} - Room {booking.roomNumber}
                          </div>
                        </div>
                        
                        <div className="text-sm grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-600">Check-in:</span> {format(checkInDate, 'MMM d')}
                          </div>
                          <div>
                            <span className="text-gray-600">Check-out:</span> {format(checkOutDate, 'MMM d')}
                          </div>
                          <div>
                            <span className="text-gray-600">Guests:</span> {booking.numGuests || 1}
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span> {booking.status || 'Confirmed'}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            onClick={() => window.location.href = `/dashboard/host/bookings/${booking._id}`}
                            className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                          >
                            View Details
                          </button>
                          
                          {isCheckIn && booking.status !== 'Checked-in' && (
                            <button
                              onClick={() => window.location.href = `/dashboard/host/checkin?id=${booking._id}`}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                            >
                              Check In
                            </button>
                          )}
                          
                          {isCheckOut && booking.status === 'Checked-in' && (
                            <button
                              onClick={() => window.location.href = `/dashboard/host/checkout?id=${booking._id}`}
                              className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}