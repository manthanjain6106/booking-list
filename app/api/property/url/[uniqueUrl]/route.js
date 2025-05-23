// app/api/property/url/[uniqueUrl]/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/db';

// GET handler for fetching property by unique URL
export async function GET(req, context) {
  try {
    // Fix: Await params if required by Next.js version
    const params = (typeof context.params?.then === 'function') ? await context.params : context.params;
    const uniqueUrl = params.uniqueUrl;
    console.log('DEBUG: Fetching property with uniqueUrl:', uniqueUrl);
    
    if (!uniqueUrl) {
      return NextResponse.json({ message: 'Unique URL is required' }, { status: 400 });
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find property by unique URL
    const property = await db.collection('properties').findOne({ 
      uniqueUrl: uniqueUrl,
      isActive: true // Only return active properties
    });
    console.log('DEBUG: Property found:', property);
    
    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }
    
    // Remove sensitive information before sending
    const sanitizedProperty = {
      ...property,
      bankAccountName: undefined,
      bankAccountNumber: undefined,
      bankIFSC: undefined,
      hostId: undefined,
    };
    
    return NextResponse.json({ property: sanitizedProperty });
    
  } catch (error) {
    console.error('Error fetching property by URL:', error);
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}