// app/api/bookings/host/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "../../../utils/db";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    // Authenticate the host
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "host") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the URL query parameters
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter');
    const statusFilter = url.searchParams.get('status');
    
    console.log(`Fetching bookings for host with filter: ${filter}, status: ${statusFilter}`);
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Get host ID
    const hostId = session.user.id;
    
    // Find ALL properties owned by this host
    const propertiesCollection = db.collection("properties");
    const hostProperties = await propertiesCollection.find({ 
      host: new mongoose.Types.ObjectId(hostId) 
    }).toArray();
    
    console.log(`Found ${hostProperties.length} properties for host ${hostId}`);
    
    if (hostProperties.length === 0) {
      return NextResponse.json({ bookings: [] }, { status: 200 });
    }
    
    // Get property IDs
    const propertyIds = hostProperties.map(property => property._id.toString());
    
    // Build the query for bookings
    const query = { propertyId: { $in: propertyIds } };
    
    // Add date filter if "today" is specified
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Show bookings checking in today, checking out today, or staying today
      query.$or = [
        { checkIn: { $gte: today, $lt: tomorrow } }, // Check-ins today
        { checkOut: { $gte: today, $lt: tomorrow } }, // Check-outs today
        { $and: [{ checkIn: { $lt: today } }, { checkOut: { $gt: today } }] } // Staying today
      ];
    }
    
    // Add status filter if provided
    if (statusFilter) {
      query.status = statusFilter;
    }
    
    console.log("Bookings query:", JSON.stringify(query));
    
    // Fetch bookings
    const bookingsCollection = db.collection("bookings");
    const bookings = await bookingsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    console.log(`Found ${bookings.length} bookings for host's properties`);
    
    // Fetch room details for each booking
    const roomsCollection = db.collection("rooms");
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        try {
          const room = await roomsCollection.findOne({ 
            _id: new mongoose.Types.ObjectId(booking.roomId)
          });
          
          // Format guest info to match your frontend expectations
          const guestInfo = {
            name: booking.guestName,
            phone: booking.guestPhone,
            email: booking.guestEmail
          };
          
          return {
            ...booking,
            guestInfo: guestInfo,
            roomDetails: room || {}
          };
        } catch (err) {
          console.error(`Error enriching booking ${booking._id}:`, err);
          return booking;
        }
      })
    );
    
    return NextResponse.json({ bookings: enrichedBookings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching host bookings:", error);
    return NextResponse.json({ 
      message: "Failed to fetch bookings", 
      error: error.message 
    }, { status: 500 });
  }
}