// app/api/bookings/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connect from '@/app/utils/db';
import Booking from '@/app/models/Booking';
import Room from '@/app/models/Room';
import Property from '@/app/models/Property';

// GET handler for fetching bookings (with auth check)
export async function GET(req) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Connect to the database
    await connect();
    
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    // Build query
    const query = {};
    
    if (propertyId) {
      query.propertyId = propertyId;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Check permissions
    if (session.user.role === 'guest') {
      // Guests can only see their own bookings
      query.userId = session.user.id;
    } else if (session.user.role === 'host') {
      // Hosts can only see bookings for their properties
      const hostProperty = await Property.findOne({ hostId: session.user.id });
      if (!hostProperty) {
        return NextResponse.json({ message: 'No property found for this host' }, { status: 404 });
      }
      
      query.propertyId = hostProperty._id;
    }
    // Admins can see all bookings (no filter needed)
    
    // Get bookings
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ bookings });
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}

// POST handler for creating a new booking
export async function POST(req) {
  try {
    // Connect to the database
    await connect();
    
    // Parse request body
    const body = await req.json();
    
    // Check for required fields
    const requiredFields = ['propertyId', 'roomNumber', 'checkIn', 'checkOut', 'guestName', 'guestPhone'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate dates
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json({ 
        message: 'Invalid date format'
      }, { status: 400 });
    }
    
    if (checkIn >= checkOut) {
      return NextResponse.json({ 
        message: 'Check-out date must be after check-in date'
      }, { status: 400 });
    }
    
    // Check if property exists
    const property = await Property.findById(body.propertyId);
    
    if (!property) {
      return NextResponse.json({ 
        message: 'Property not found'
      }, { status: 404 });
    }
    
    // Check if room exists
    const room = await Room.findOne({
      propertyId: body.propertyId,
      roomNumber: body.roomNumber,
      isActive: true
    });
    
    if (!room) {
      return NextResponse.json({ 
        message: 'Room not found or not available'
      }, { status: 404 });
    }
    
    // Check if room is available for requested dates
    const existingBooking = await Booking.findOne({
      propertyId: body.propertyId,
      roomNumber: body.roomNumber,
      status: { $nin: ['Cancelled', 'Completed'] },
      $or: [
        // Check-in date falls within an existing booking
        { 
          $and: [
            { checkIn: { $lte: checkOut } },
            { checkOut: { $gte: checkIn } }
          ]
        }
      ]
    });
    
    if (existingBooking) {
      return NextResponse.json({ 
        message: 'Room is not available for the selected dates',
        conflict: {
          bookingId: existingBooking._id,
          checkIn: existingBooking.checkIn,
          checkOut: existingBooking.checkOut
        }
      }, { status: 409 });
    }
    
    // If user is logged in, get session
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      // Continue without session
    }
    
    // Create booking
    const booking = new Booking({
      ...body,
      // Add user ID if available
      userId: body.userId || (session && session.user.id) || null,
      // Default values
      status: 'Pending',
      bookingDate: new Date(),
      // Additional info
      hostId: property.hostId,
      propertyName: property.name,
      roomCategory: body.category || room.category,
      roomImageUrl: room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls[0] : null,
      paymentStatus: 'Not Paid'
    });
    
    // Save booking
    await booking.save();
    
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
    
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}