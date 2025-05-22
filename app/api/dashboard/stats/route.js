// Alternative: app/api/dashboard/stats/route.js
// Uses the same pattern as your working bookings API

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/db';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    console.log('=== Dashboard Stats API Called ===');
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'host') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    console.log('Connecting to database...');
    const { db } = await connectToDatabase();
    
    // Use raw MongoDB queries instead of Mongoose (like your bookings API)
    const propertiesCollection = db.collection('properties');
    const bookingsCollection = db.collection('bookings');
    const roomsCollection = db.collection('rooms');

    // Convert string IDs to ObjectId
    const propertyObjectId = new ObjectId(propertyId);
    const userObjectId = new ObjectId(session.user.id);

    console.log('Looking for property:', {
      _id: propertyObjectId,
      host: userObjectId
    });

    // Verify property ownership
    const property = await propertiesCollection.findOne({
      _id: propertyObjectId,
      host: userObjectId
    });

    if (!property) {
      console.log('❌ Property not found');
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    console.log('✅ Property found:', property.name);

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get month range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    console.log('Date ranges:', {
      startOfDay,
      endOfDay,
      startOfMonth,
      endOfMonth
    });

    // Run queries - note: your bookings might store propertyId as string, not ObjectId
    const [todayCheckIns, todayCheckOuts, monthlyBookings, totalRooms] = await Promise.all([
      // Today's check-ins (try both string and ObjectId for propertyId)
      bookingsCollection.countDocuments({
        propertyId: propertyId, // Use string since your logs show propertyId as string
        checkIn: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ['confirmed', 'checked-in'] }
      }),
      
      // Today's check-outs  
      bookingsCollection.countDocuments({
        propertyId: propertyId,
        checkOut: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ['checked-in', 'checked-out'] }
      }),
      
      // Monthly bookings
      bookingsCollection.countDocuments({
        propertyId: propertyId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: 'cancelled' }
      }),
      
      // Total rooms - property field might be ObjectId
      roomsCollection.countDocuments({
        property: propertyObjectId,
        isActive: true
      })
    ]);

    // Calculate occupancy (simple version)
    const currentlyOccupied = await bookingsCollection.countDocuments({
      propertyId: propertyId,
      checkIn: { $lte: today },
      checkOut: { $gt: today },
      status: { $in: ['confirmed', 'checked-in'] }
    });

    const occupancyRate = totalRooms > 0 ? Math.round((currentlyOccupied / totalRooms) * 100) : 0;

    console.log('Stats calculated:', {
      todayCheckIns,
      todayCheckOuts,
      monthlyBookings,
      totalRooms,
      currentlyOccupied,
      occupancyRate
    });

    return NextResponse.json({
      success: true,
      todayCheckIns,
      todayCheckOuts,
      occupancyRate,
      totalBookings: monthlyBookings,
      totalRooms,
      occupiedRooms: currentlyOccupied,
      availableRooms: totalRooms - currentlyOccupied
    });

  } catch (error) {
    console.error('❌ Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}