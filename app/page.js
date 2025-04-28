'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BookingCalendar from './components/BookingCalendar';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('location');

  // For demonstration, we'll just alert the search query
  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for ${searchQuery} by ${searchType}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Hotel Booking Logo" width={70} height={70} className="mr-2" />
            <span className="text-2xl font-bold text-blue-600">BOOKING-LIST</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition duration-300">
              About Us
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition duration-300">
              Contact
            </Link>
            <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-96">
        <div className="absolute inset-0">
          <Image 
            src="/hero-image.jpg" 
            alt="Beautiful hotel view" 
            fill
            style={{ objectFit: 'cover' }}
            className="brightness-75"
            priority
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Find Your Perfect Stay</h1>
          <p className="text-xl text-white mb-8 max-w-2xl">Discover and book accommodations with our seamless booking platform.</p>
          
          {/* Search Form */}
          <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-2xl">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <select 
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="location">Location</option>
                  <option value="property">Property Name</option>
                  <option value="booking">Booking ID</option>
                </select>
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder={`Search by ${searchType}...`}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Demo Calendar Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Interactive Booking Calendar</h2>
          <BookingCalendar propertyId="demo-property" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image src="/logo.png" alt="Hotel Booking Logo" width={40} height={40} className="mr-2" />
              <span className="text-xl font-bold">StayEase</span>
            </div>
            <div className="text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} StayEase. All rights reserved.</p>
              <p className="text-gray-400 text-sm mt-1">A project based on the SRS document</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}