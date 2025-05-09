// HostDashboardCalendar.js
'use client';
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { addDays, startOfWeek, format } from 'date-fns';
import Image from 'next/image';

export default function HostDashboardCalendar() {
  const [date, setDate] = useState(new Date());
  const [rooms, setRooms] = useState([]); // [{name: 'Room 1', bookings: [Date, ...]}]
  const [newRoom, setNewRoom] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [message, setMessage] = useState('');
  // Pagination state for week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  // Add a new room
  const handleAddRoom = () => {
    if (!newRoom.trim()) return;
    if (rooms.some(r => r.name === newRoom.trim())) {
      setMessage('Room already exists!');
      return;
    }
    setRooms([...rooms, { name: newRoom.trim(), bookings: [] }]);
    setNewRoom('');
    setMessage('Room added!');
  };

  // Book the selected room for the selected date
  const handleBookRoom = () => {
    if (!selectedRoom) {
      setMessage('Select a room to book!');
      return;
    }
    setRooms(rooms.map(room => {
      if (room.name === selectedRoom) {
        const dateStr = date.toDateString();
        if (room.bookings.includes(dateStr)) {
          setMessage('Room already booked for this date!');
          return room;
        }
        return { ...room, bookings: [...room.bookings, dateStr] };
      }
      return room;
    }));
    setMessage('Room booked!');
  };

  // Clear message after 2 seconds
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(''), 2000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Calculate the start of the current week (Sunday), with offset
  const weekStart = startOfWeek(addDays(date, weekOffset * 7), { weekStartsOn: 0 });
  // Get all 7 days of the week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Helper to check if a room is booked on a date
  const isBooked = (room, d) => room.bookings.includes(d.toDateString());

  // Temporary placeholder image URL
  const placeholderImg = '/window.svg';

  // Pagination handlers
  const handlePrevWeek = () => setWeekOffset(weekOffset - 1);
  const handleNextWeek = () => setWeekOffset(weekOffset + 1);
  const handleThisWeek = () => setWeekOffset(0);

  return (
    <div style={{
      maxWidth: 900,
      margin: '1.5rem auto',
      background: '#f9fafb',
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      padding: '1.5rem',
      textAlign: 'center',
    }}>
      <h3 style={{marginBottom: '1rem', color: '#374151'}}>Host Weekly Room Calendar</h3>
      {/* Add Room UI */}
      <div style={{marginBottom: '1rem'}}>
        <input
          type="text"
          placeholder="New room name"
          value={newRoom}
          onChange={e => setNewRoom(e.target.value)}
          style={{padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc', marginRight: 8}}
        />
        <button onClick={handleAddRoom} style={{padding: '0.5rem 1rem', borderRadius: 4, background: '#6366f1', color: '#fff', border: 'none'}}>Add Room</button>
      </div>
      {/* Room select and book UI */}
      <div style={{marginBottom: '1rem'}}>
        <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={{padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc', marginRight: 8}}>
          <option value="">Select room</option>
          {rooms.map(room => <option key={room.name} value={room.name}>{room.name}</option>)}
        </select>
        <input type="date" value={format(date, 'yyyy-MM-dd')} onChange={e => setDate(new Date(e.target.value))} style={{marginRight: 8, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc'}} />
        <button onClick={handleBookRoom} style={{padding: '0.5rem 1rem', borderRadius: 4, background: '#10b981', color: '#fff', border: 'none'}}>Book Room</button>
      </div>
      {message && <div style={{marginBottom: '1rem', color: '#ef4444'}}>{message}</div>}
      {/* Weekly Calendar Table: Rooms as rows, Dates as columns */}
      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '1rem'}}>
          <thead>
            <tr>
              <th style={{border: '1px solid #ddd', padding: 8, background: '#f3f4f6'}}>Room</th>
              {weekDates.map(d => (
                <th key={d.toDateString()} style={{border: '1px solid #ddd', padding: 8, background: '#f3f4f6'}}>{format(d, 'EEE, MMM d')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.name}>
                <td style={{border: '1px solid #ddd', padding: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8}}>
                  <Image src={placeholderImg} alt="room" style={{width: 32, height: 32, borderRadius: 6, background: '#e5e7eb'}} />
                  {room.name}
                </td>
                {weekDates.map(d => (
                  <td key={d.toDateString()} style={{border: '1px solid #ddd', padding: 8, background: isBooked(room, d) ? '#fca5a5' : '#d1fae5'}}>
                    {isBooked(room, d) ? 'Booked' : 'Available'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls BELOW calendar */}
      <div style={{margin: '1rem 0', display: 'flex', justifyContent: 'center', gap: 8}}>
        <button onClick={handlePrevWeek} style={{padding: '0.5rem 1rem', borderRadius: 4, background: '#e5e7eb', border: 'none', color: '#374151'}}>Previous</button>
        <button onClick={handleThisWeek} style={{padding: '0.5rem 1rem', borderRadius: 4, background: '#6366f1', color: '#fff', border: 'none'}}>This Week</button>
        <button onClick={handleNextWeek} style={{padding: '0.5rem 1rem', borderRadius: 4, background: '#e5e7eb', border: 'none', color: '#374151'}}>Next</button>
      </div>
      <p style={{marginTop: '1rem', color: '#6b7280'}}>
        Viewing week of <b>{format(weekStart, 'MMM d, yyyy')}</b>
      </p>
      <div style={{marginTop: '1rem', textAlign: 'left'}}>
        <b>Room fields:</b>
        <ul style={{fontSize: '0.95em'}}>
          <li><b>name</b>, <b>roomNumber</b>, <b>category</b>, <b>description</b>, <b>capacity</b> (adults, children, total), <b>pricing</b> (perRoom, perPerson, advanceAmount, seasonalPricing), <b>amenities</b>, <b>images</b>, <b>agentCommission</b>, <b>isActive</b>, <b>createdAt</b>, <b>updatedAt</b></li>
        </ul>
      </div>
    </div>
  );
}
