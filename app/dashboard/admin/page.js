import React from 'react';
import AdminBookingCalendar from '@/components/AdminBookingCalendar';

export default function AdminDashboardPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f7fafc', padding: '2rem 0' }}>
      <h1 style={{ textAlign: 'center', color: '#2d3748', marginBottom: '2rem' }}>
        Admin Dashboard
      </h1>
      <AdminBookingCalendar />
    </main>
  );
}