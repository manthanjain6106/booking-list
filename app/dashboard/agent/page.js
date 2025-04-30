"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AgentDashboard() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (session && session.user?.role) {
      setRole(session.user.role); // Directly use role from session
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
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, Agent</h1>
      <p className="text-lg text-gray-600 mb-4">
        Hello {session.user.name}, your role is <strong>{role}</strong>.
      </p>

      <div className="mt-6 bg-white rounded-md shadow-md p-4">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">Your Tools</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>View available homestays</li>
          <li>Make bookings for clients</li>
          <li>Track your commissions</li>
          <li>Manage approvals</li>
        </ul>
      </div>
    </div>
  );
}
