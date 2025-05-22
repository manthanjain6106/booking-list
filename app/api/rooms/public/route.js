// app/api/rooms/public/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/db';
import { ObjectId } from 'mongodb';

// GET handler for fetching public room information
export async function GET(req) {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    
    if (!propertyId) {
      return NextResponse.json({ message: 'Property ID is required' }, { status: 400 });
    }
    
    // Verify the property exists and is active
    const property = await db.collection('properties').findOne({
      _id: new ObjectId(propertyId),
      isActive: true
    });
    
    if (!property) {
      return NextResponse.json({ message: 'Property not found or inactive' }, { status: 404 });
    }
    
    // Build query
    // Try both propertyId and property fields for backward compatibility
    let rooms = await db.collection('rooms')
      .find({ propertyId: new ObjectId(propertyId) })
      .sort({ category: 1, roomNumber: 1 })
      .toArray();
    if (rooms.length === 0) {
      rooms = await db.collection('rooms')
        .find({ property: new ObjectId(propertyId) })
        .sort({ category: 1, roomNumber: 1 })
        .toArray();
    }
    return NextResponse.json({ rooms });
    
  } catch (error) {
    console.error('Error fetching public rooms:', error);
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}