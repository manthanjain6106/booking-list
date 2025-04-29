"use client";

import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function LandingPage() {
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/role-select' });
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

        {/* Description */}
        <div className="mt-10">
          <p className="text-gray-500 text-center">
            Your seamless hotel booking experience starts here.
          </p>
        </div>

        {/* Login Button */}
        <div className="mt-10">
          <button
            onClick={handleGoogleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g transform="translate(2, 2)" fill="none">
                  <path
                    d="M10,0 C15.5228475,0 20,4.4771525 20,10 C20,15.5228475 15.5228475,20 10,20 C4.4771525,20 0,15.5228475 0,10 C0,4.4771525 4.4771525,0 10,0 Z"
                    fill="#FFF"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M19.6,10.2272727 C19.6,9.61818182 19.5454545,9.00909091 19.4454545,8.42727273 L10,8.42727273 L10,12.0863636 L15.4090909,12.0863636 C15.1818182,13.2909091 14.4454545,14.2863636 13.3272727,14.9409091 L13.3272727,17.4 L16.5181818,17.4 C18.3909091,15.6818182 19.6,13.1727273 19.6,10.2272727 L19.6,10.2272727 Z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M10,20 C12.7,20 14.9636364,19.1045455 16.5181818,17.4 L13.3272727,14.9409091 C12.4363636,15.5181818 11.3090909,15.8636364 10,15.8636364 C7.39090909,15.8636364 5.19090909,14.1363636 4.40454545,11.8 L1.10909091,11.8 L1.10909091,14.3454545 C2.65454545,17.7590909 6.05454545,20 10,20 L10,20 Z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M4.40454545,11.8 C4.20454545,11.2 4.09090909,10.56 4.09090909,9.90909091 C4.09090909,9.25818182 4.20454545,8.61818182 4.40454545,8.01818182 L4.40454545,5.47272727 L1.10909091,5.47272727 C0.499090909,6.79090909 0.109090909,8.30454545 0.109090909,9.90909091 C0.109090909,11.5136364 0.499090909,13.0272727 1.10909091,14.3454545 L4.40454545,11.8 L4.40454545,11.8 Z"
                  ></path>
                  <path
                    fill="#EA4335"
                    d="M10,4.05454545 C11.4681818,4.05454545 12.7863636,4.55454545 13.8227273,5.52727273 L16.6363636,2.71363636 C14.9636364,1.18181818 12.7,0.109090909 10,0.109090909 C6.05454545,0.109090909 2.65454545,2.35 1.10909091,5.76363636 L4.40454545,8.30909091 C5.19090909,5.97272727 7.39090909,4.05454545 10,4.05454545 L10,4.05454545 Z"
                  ></path>
                </g>
              </svg>
            </span>
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
}