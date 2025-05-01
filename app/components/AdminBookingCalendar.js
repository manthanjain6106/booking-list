// AdminBookingCalendar.js
'use client';
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function AdminBookingCalendar() {
  const [date, setDate] = useState(new Date());

  return (
    <div style={{
      maxWidth: 600,
      margin: '2rem auto',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h2 style={{marginBottom: '1.5rem', color: '#2d3748'}}>Bookings Calendar</h2>
      <Calendar
        onChange={setDate}
        value={date}
        tileClassName={({ date, view }) =>
          view === 'month' && date.toDateString() === new Date().toDateString()
            ? 'react-calendar__tile--active'
            : null
        }
      />
      <p style={{marginTop: '1.5rem', color: '#4a5568'}}>
        Selected date: <b>{date.toDateString()}</b>
      </p>
    </div>
  );
}
