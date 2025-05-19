// app/api/bookings/host/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connect from '@/app/utils/db';
import Booking from '@/app/models/Booking';
import Property from '@/app/models/Property';

// Handler for GET requests to fetch host's bookings
export async function GET(req) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'host') {
      return NextResponse.json({ message: 'Access denied. Host role required.' }, { status: 403 });
    }
    
    // Connect to the database
    await connect();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const status = searchParams.get('status');
    
    // Find the host's property
    const property = await Property.findOne({ hostId: session.user.id });
    
    if (!property) {
      return NextResponse.json({ message: 'No property found for this host' }, { status: 404 });
    }
    
    // Build the query object
    const query = { propertyId: property._id };
    
    // Add date filters if provided
    if (start && end) {
      query.$or = [
        // Check-in date falls within the range
        { checkIn: { $gte: start, $lte: end } },
        // Check-out date falls within the range
        { checkOut: { $gte: start, $lte: end } },
        // Booking spans across the range
        { $and: [{ checkIn: { $lte: start } }, { checkOut: { $gte: end } }] }
      ];
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Get bookings for the property
    const bookings = await Booking.find(query)
      .sort({ checkIn: 1 })
      .lean();
    
    return NextResponse.json({ bookings });
    
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}

// Handler for POST requests to create a new booking
export async function POST(req) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'host') {
      return NextResponse.json({ message: 'Access denied. Host role required.' }, { status: 403 });
    }
    
    // Connect to the database
    await connect();
    
    // Parse the request body
    const body = await req.json();
    
    // Find the host's property
    const property = await Property.findOne({ hostId: session.user.id });
    
    if (!property) {
      return NextResponse.json({ message: 'No property found for this host' }, { status: 404 });
    }
    
    // Validate required fields
    const requiredFields = ['guestName', 'guestPhone', 'checkIn', 'checkOut', 'roomNumber', 'category'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Check if the room is available for the requested dates
    const existingBooking = await Booking.findOne({
      propertyId: property._id,
      roomNumber: body.roomNumber,
      $or: [
        // Check-in date falls within an existing booking
        { checkIn: { $lte: body.checkOut }, checkOut: { $gte: body.checkIn } }
      ],
      status: { $nin: ['Cancelled', 'Completed'] }
    });
    
    if (existingBooking) {
      return NextResponse.json({ 
        message: 'Room is already booked for the requested dates',
        conflict: {
          bookingId: existingBooking._id,
          checkIn: existingBooking.checkIn,
          checkOut: existingBooking.checkOut
        }
      }, { status: 409 });
    }
    
    // Create new booking with property ID
    const newBooking = new Booking({
      ...body,
      propertyId: property._id,
      hostId: session.user.id,
      createdBy: 'host',
      status: body.status || 'Confirmed',
      bookingDate: new Date()
    });
    
    // Save booking
    await newBooking.save();
    
    return NextResponse.json({ 
      message: 'Booking created successfully',
      booking: newBooking
    });
    
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}