// app/api/rooms/with-images/route.js - FIXED with Native MongoDB

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/db';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    console.log('🚀 Starting room creation process...');
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ Session verified for user:', session.user?.email);

    // Connect to database using your existing method
    const { db } = await connectToDatabase();
    console.log('✅ Database connected via connectToDatabase()');
    
    // Test connection
    const testCount = await db.collection('rooms').countDocuments({});
    console.log('🔍 Total rooms in database:', testCount);
    
    // Parse form data
    const formData = await req.formData();
    console.log('📝 FormData keys:', Array.from(formData.keys()));
    
    // Extract room data
    const roomDataStr = formData.get('roomData');
    if (!roomDataStr) {
      console.log('❌ No roomData found in FormData');
      return NextResponse.json({ message: 'No room data provided' }, { status: 400 });
    }
    
    console.log('📄 Raw roomData:', roomDataStr);
    
    let parsedData;
    try {
      parsedData = JSON.parse(roomDataStr);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return NextResponse.json({ message: 'Invalid JSON in room data' }, { status: 400 });
    }
    
    const { rooms } = parsedData;
    console.log('🏠 Parsed rooms count:', rooms?.length);
    console.log('🏠 First room sample:', JSON.stringify(rooms?.[0], null, 2));
    
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      console.log('❌ Invalid room data format');
      return NextResponse.json({ message: 'Invalid room data format' }, { status: 400 });
    }

    // Verify property belongs to this host (same as your working route)
    const hostUser = await db.collection('users').findOne({ email: session.user.email });
    if (!hostUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const propertyId = rooms[0].propertyId || rooms[0].property;
    const property = await db.collection('properties').findOne({ 
      _id: new ObjectId(propertyId) 
    });
    
    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    if (property.host.toString() !== hostUser._id.toString()) {
      return NextResponse.json({ 
        message: "You do not have permission to manage rooms for this property" 
      }, { status: 403 });
    }

    // Process images and update room data
    console.log('🖼️ Processing images...');
    const processedRooms = await processRoomsWithImages(rooms, formData);
    console.log('✅ Processed rooms:', processedRooms.length);
    
    // Process each room using native MongoDB (like your working route)
    const results = [];
    const errors = [];
    
    for (let i = 0; i < processedRooms.length; i++) {
      const room = processedRooms[i];
      console.log(`\n--- Processing Room ${i + 1}: ${room.roomNumber} ---`);
      
      try {
        // Clean the category
        const cleanCategory = (room.category || '').trim();
        console.log('🏠 Room category (cleaned):', cleanCategory);
        console.log('🚪 Room number:', room.roomNumber);
        
        // Check if this room already exists
        const existingRoom = await db.collection('rooms').findOne({
          property: new ObjectId(propertyId),
          roomNumber: room.roomNumber
        });

        console.log(`🔍 Existing room check for ${room.roomNumber}:`, existingRoom ? `Found ID: ${existingRoom._id}` : 'Not found');

        // Prepare room document (same structure as your working route)
        const roomDoc = {
          property: new ObjectId(propertyId),
          roomNumber: room.roomNumber,
          category: cleanCategory,
          capacity: {
            adults: Math.max(1, room.capacity?.adults || 1),
            children: Math.max(0, room.capacity?.children || 0),
            total: Math.max(1, room.capacity?.total || (room.capacity?.adults || 1) + (room.capacity?.children || 0)),
            capacityText: room.capacity?.capacityText || ''
          },
          amenities: room.amenities || [],
          agentCommission: Number(room.agentCommission || 0),
          pricing: {
            advanceAmount: Number(room.advanceAmount || 0),
            extraPersonCharge: Number(room.extraPersonCharge || 0),
            perPersonPrices: room.perPersonPrices || null,
            adultRate: Number(room.adultRate || 0),
            childRate: Number(room.childRate || 0),
            ...(room.price ? { perRoom: Number(room.price) } : {})
          },
          isActive: true,
          isAvailable: true,
          images: room.imageUrls || room.images || [],
          ...(existingRoom ? { updatedAt: new Date() } : { createdAt: new Date(), updatedAt: new Date() })
        };

        console.log('📋 Room document to save:', {
          property: roomDoc.property.toString(),
          roomNumber: roomDoc.roomNumber,
          category: roomDoc.category,
          capacity: roomDoc.capacity,
          images: roomDoc.images.length,
          pricingKeys: Object.keys(roomDoc.pricing)
        });

        let result;
        if (existingRoom) {
          // Update existing room
          result = await db.collection('rooms').updateOne(
            { _id: existingRoom._id },
            { $set: roomDoc }
          );
          console.log(`✅ Room ${room.roomNumber} UPDATED - Modified count:`, result.modifiedCount);
          
          results.push({
            roomNumber: room.roomNumber,
            roomId: existingRoom._id.toString(),
            action: 'updated',
            success: result.modifiedCount > 0
          });
        } else {
          // Create new room
          result = await db.collection('rooms').insertOne(roomDoc);
          console.log(`✅ Room ${room.roomNumber} CREATED with ID:`, result.insertedId.toString());
          
          results.push({
            roomNumber: room.roomNumber,
            roomId: result.insertedId.toString(),
            action: 'created',
            success: !!result.insertedId
          });
        }

        // Verify the room was actually saved
        const verifyRoom = await db.collection('rooms').findOne({
          _id: existingRoom ? existingRoom._id : result.insertedId
        });
        console.log(`🔍 Verification - Room exists in DB:`, !!verifyRoom);
        if (verifyRoom) {
          console.log(`🔍 Verification - Room data:`, {
            category: verifyRoom.category,
            roomNumber: verifyRoom.roomNumber,
            capacity: verifyRoom.capacity,
            images: verifyRoom.images?.length || 0
          });
        }

      } catch (roomError) {
        console.error(`❌ Error processing room ${room.roomNumber}:`, roomError);
        errors.push({
          roomNumber: room.roomNumber,
          error: roomError.message,
          success: false
        });
      }
    }
    
    // Enhanced final verification
    console.log('\n🔍 Final verification...');
    const allRoomsForProperty = await db.collection('rooms')
      .find({ property: new ObjectId(propertyId) })
      .toArray();
    
    console.log('📊 Total rooms now in DB for this property:', allRoomsForProperty.length);
    console.log('📊 All rooms in database for this property:');
    allRoomsForProperty.forEach((room, index) => {
      console.log(`  ${index + 1}. Room ${room.roomNumber} (${room.category})`);
      console.log(`     - ID: ${room._id}`);
      console.log(`     - Images: ${room.images?.length || 0}`);
      console.log(`     - Created: ${room.createdAt}`);
      console.log(`     - Updated: ${room.updatedAt}`);
    });
    
    const response = {
      success: results.length > 0,
      message: `${results.length} rooms processed successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      results,
      ...(errors.length > 0 && { errors }),
      summary: {
        total: processedRooms.length,
        successful: results.length,
        failed: errors.length,
        totalInDbForProperty: allRoomsForProperty.length
      }
    };
    
    return NextResponse.json(response, { 
      status: errors.length === processedRooms.length ? 400 : 200 
    });
    
  } catch (error) {
    console.error('💥 Main error in POST handler:', error);
    console.error('💥 Error stack:', error.stack);
    return NextResponse.json({ 
      message: error.message || 'An error occurred',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Enhanced processRoomsWithImages function
async function processRoomsWithImages(rooms, formData) {
  console.log('🖼️ Processing rooms with images...');
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rooms');
  await ensureDirectory(uploadDir);
  console.log('📁 Upload directory ready:', uploadDir);
  
  return await Promise.all(rooms.map(async (room, index) => {
    console.log(`\n🖼️ Processing images for room ${index + 1}:`, room.roomNumber);
    
    if (room.images && room.images.length > 0) {
      console.log(`📸 Found ${room.images.length} images to process:`, room.images);
      
      const imageUrls = await Promise.all(room.images.map(async (imageKey, imgIndex) => {
        console.log(`📸 Processing image ${imgIndex + 1}: ${imageKey}`);
        
        const file = formData.get(imageKey);
        if (!file) {
          console.warn(`⚠️ No file found for key: ${imageKey}`);
          return null;
        }
        
        console.log(`📸 File details - name: ${file.name}, type: ${file.type}, size: ${file.size}`);
        
        try {
          const uniqueId = uuidv4();
          const fileExtension = getFileExtension(file.name || file.type);
          const newFilename = `${uniqueId}${fileExtension}`;
          
          const newPath = path.join(uploadDir, newFilename);
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(newPath, buffer);
          
          const publicUrl = `/uploads/rooms/${newFilename}`;
          console.log(`✅ Image saved: ${publicUrl}`);
          return publicUrl;
        } catch (imageError) {
          console.error(`❌ Error processing image ${imageKey}:`, imageError);
          return null;
        }
      }));
      
      const validImageUrls = imageUrls.filter(url => url !== null);
      console.log(`✅ Successfully processed ${validImageUrls.length} images`);
      
      return {
        ...room,
        images: undefined, // Remove image keys
        imageUrls: validImageUrls
      };
    }
    
    console.log(`📸 No images to process for room ${index + 1}`);
    return room;
  }));
}

async function ensureDirectory(directory) {
  try {
    await fsPromises.access(directory);
    console.log('📁 Directory exists:', directory);
  } catch (error) {
    console.log('📁 Creating directory:', directory);
    await mkdir(directory, { recursive: true });
  }
}

function getFileExtension(filename) {
  if (!filename) return '.jpg';
  
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    if (filename.startsWith('image/')) {
      const subtype = filename.split('/')[1];
      return `.${subtype === 'jpeg' ? 'jpg' : subtype}`;
    }
    return '.jpg';
  }
  
  return filename.substring(lastDot);
}