"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RoleSelectPage() {
  const { data: session, status } = useSession({ required: true });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Always check latest onboarding status from backend
    const checkOnboarding = async () => {
      if (!session?.user?.email) return;
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.hasOnboarded) {
            router.replace('/dashboard');
          }
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    checkOnboarding();
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const handleRoleSelection = async (role) => {
    setIsLoading(true);
    setError("");

    try {
      // Update user role in database
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to set role");
      }

      // Redirect based on role
      switch (role) {
        // case "guest":
        //   router.push("/guest");
        //   break;
        case "agent":
          router.push("/dashboard/agent");
          break;
        case "host":
          router.push("/dashboard/host");
          break;
        default:
          router.push("/");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
            <Image src="/logo.png" alt="Logo" width={100} height={100} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Booking List</h1>
        </div>

        {/* Welcome message */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome, {session?.user?.name || "User"}
          </h2>
          <p className="mt-2 text-gray-600">
            Please select how you want to continue
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Role selection buttons */}
        <div className="mt-8 space-y-4">

        <button
            onClick={() => handleRoleSelection("host")}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md bg-blue-700 hover:bg-blue-500 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login as Host
          </button>
          
          <button
            onClick={() => handleRoleSelection("agent")}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md bg-blue-700 hover:bg-blue-500 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login as Agent
          </button>
          
          

          
        </div>
      </div>
    </div>
  );
}