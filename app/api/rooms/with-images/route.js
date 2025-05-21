// app/api/rooms/with-images/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/utils/db';
import Room from '@/app/models/Room';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Handler for multipart/form-data with images in Next.js App Router
export async function POST(req) {
  await ensureMongooseConnected();
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Using a FormData approach for Next.js App Router
    const formData = await req.formData();
    
    // Extract room data from formData
    const roomDataStr = formData.get('roomData');
    if (!roomDataStr) {
      return NextResponse.json({ message: 'No room data provided' }, { status: 400 });
    }
    
    const parsedData = JSON.parse(roomDataStr);
    const { rooms } = parsedData;
    
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return NextResponse.json({ message: 'Invalid room data format' }, { status: 400 });
    }

    // Process images and update room data with image URLs
    const processedRooms = await processRoomsWithImages(rooms, formData);
    
    // Map imageUrls to images and ensure price/calculatedTotalPrice are included
    const bulkOps = processedRooms.map(room => {
      // Accept both 'property' and 'propertyId' from frontend
      let { propertyId, property, imageUrls, price, calculatedTotalPrice, extraPersonCharge, perPersonPrices, adultRate, childRate, numAdults, numChildren, advanceAmount, ...rest } = room;
      // Prefer propertyId, fallback to property
      const propertyObjId = propertyId ? new ObjectId(propertyId) : (property ? new ObjectId(property) : undefined);
      // Remove any nested updates to capacity if present
      if (rest.capacity && (rest['capacity.adults'] || rest['capacity.children'] || rest['capacity.total'])) {
        delete rest['capacity.adults'];
        delete rest['capacity.children'];
        delete rest['capacity.total'];
      }
      // Build pricing object
      const pricing = { ...room.pricing };
      if (typeof price !== 'undefined' && price !== null) pricing.perRoom = price;
      if (typeof extraPersonCharge !== 'undefined' && extraPersonCharge !== null) pricing.extraPersonCharge = extraPersonCharge;
      if (typeof perPersonPrices !== 'undefined' && perPersonPrices !== null) pricing.perPersonPrices = perPersonPrices ? new Map(Object.entries(perPersonPrices)) : null;
      if (typeof adultRate !== 'undefined' && adultRate !== null) pricing.adultRate = adultRate;
      if (typeof childRate !== 'undefined' && childRate !== null) pricing.childRate = childRate;
      if (typeof advanceAmount !== 'undefined' && advanceAmount !== null) pricing.advanceAmount = advanceAmount;
      // Remove undefined/null fields from pricing
      Object.keys(pricing).forEach(key => {
        if (pricing[key] === undefined || pricing[key] === null) {
          delete pricing[key];
        }
      });
      // Prepare update payload
      const updatePayload = {
        ...rest,
        property: propertyObjId, // Always set 'property' field
        ...(imageUrls ? { images: imageUrls } : {}),
        ...(Object.keys(pricing).length > 0 ? { pricing } : {}),
        ...(typeof calculatedTotalPrice !== 'undefined' ? { calculatedTotalPrice } : {})
      };
      return {
        updateOne: {
          filter: {
            property: propertyObjId, // Always use 'property' field
            category: room.category,
            roomNumber: room.roomNumber
          },
          update: { $set: updatePayload },
          upsert: true // Create if doesn't exist
        }
      };
    });
    
    // Execute bulk operations
    const result = await Room.bulkWrite(bulkOps);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rooms saved successfully',
      result: {
        created: result.upsertedCount,
        updated: result.modifiedCount,
        total: processedRooms.length
      }
    });
    
  } catch (error) {
    console.error('Error saving rooms with images:', error);
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}

// Function to process rooms and their images
async function processRoomsWithImages(rooms, formData) {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rooms');
  await ensureDirectory(uploadDir);
  
  // Process each room
  return await Promise.all(rooms.map(async (room) => {
    // Handle images if present
    if (room.images && room.images.length > 0) {
      const imageUrls = await Promise.all(room.images.map(async (imageKey) => {
        const file = formData.get(imageKey);
        if (!file) return null;
        
        // Generate unique filename
        const uniqueId = uuidv4();
        const fileExtension = getFileExtension(file.name || file.type);
        const newFilename = `${uniqueId}${fileExtension}`;
        
        // Save file to uploads directory
        const newPath = path.join(uploadDir, newFilename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(newPath, buffer);
        
        // Return the public URL
        return `/uploads/rooms/${newFilename}`;
      }));
      
      // Filter out null values
      const validImageUrls = imageUrls.filter(url => url !== null);
      
      // Update room object with image URLs
      return {
        ...room,
        images: undefined, // Remove the image keys
        imageUrls: validImageUrls
      };
    }
    
    return room;
  }));
}

// Ensure Mongoose is connected before using Mongoose models
async function ensureMongooseConnected() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

// Helper function to ensure directory exists
async function ensureDirectory(directory) {
  try {
    await fsPromises.access(directory);
  } catch (error) {
    // Directory doesn't exist, create it
    await mkdir(directory, { recursive: true });
  }
}

// Helper function to get file extension
function getFileExtension(filename) {
  if (!filename) return '.jpg'; // Default extension
  
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    // If it's a MIME type
    if (filename.startsWith('image/')) {
      const subtype = filename.split('/')[1];
      return `.${subtype === 'jpeg' ? 'jpg' : subtype}`;
    }
    return '.jpg'; // Default extension
  }
  
  return filename.substring(lastDot);
}