"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import HostDashboardCalendar from "../../../components/HostDashboardCalendar";

export default function HostDashboard() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (session && session.user?.role) {
      setRole(session.user.role);
    }
  }, [session]);

  if (status === "loading") {
    return <div className="p-6 text-lg">Loading...</div>;
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

      <div className="mt-6 bg-white rounded-md shadow-md p-4">
        <h2 className="text-xl font-semibold text-indigo-700 mb-2">Quick Actions</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>Register a new property</li>
          <li>Manage your rooms and pricing</li>
          <li>View today’s bookings</li>
          <li>Check-in / Check-out guests</li>
        </ul>
      </div>

      {/* Host Calendar View */}
      <HostDashboardCalendar />
    </div>
  );
}
