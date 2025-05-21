// app/api/bookings/route.js (continued)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/app/utils/db";
import Booking from "@/app/models/Booking";
import Room from "@/app/models/Room";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Parse booking data from request
    const data = await request.json();
    
    // Validate required fields
    if (
      !data.propertyId ||
      !data.roomId ||
      !data.checkIn ||
      !data.checkOut ||
      !data.guestName ||
      !data.guestPhone
    ) {
      return NextResponse.json(
        { message: "Missing required booking information" },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if the room exists
    const room = await Room.findById(data.roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    
    // Check if there's an existing booking for this room on the selected dates
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    
    // Validate dates
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { message: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }
    
    const existingBooking = await Booking.findOne({
      roomId: data.roomId,
      status: { $nin: ["declined", "cancelled"] },
      $or: [
        // New booking starts during an existing booking
        { checkIn: { $lte: checkIn }, checkOut: { $gt: checkIn } },
        // New booking ends during an existing booking
        { checkIn: { $lt: checkOut }, checkOut: { $gte: checkOut } },
        // New booking completely overlaps an existing booking
        { checkIn: { $gte: checkIn }, checkOut: { $lte: checkOut } },
      ],
    });
    
    if (existingBooking) {
      return NextResponse.json(
        { message: "Room is not available for the selected dates" },
        { status: 400 }
      );
    }
    
    // If user is not logged in, check if there's an existing user with this email
    let userId = session?.user?.id;
    
    if (!userId && data.guestEmail) {
      const existingUser = await User.findOne({ email: data.guestEmail });
      userId = existingUser?._id;
    }
    
    // Create new booking
    const newBooking = new Booking({
      propertyId: data.propertyId,
      roomId: data.roomId,
      userId: userId || null,
      checkIn,
      checkOut,
      numAdults: parseInt(data.numAdults) || 1,
      numChildren: parseInt(data.numChildren) || 0,
      // Add child age group information
      youngerChildren: parseInt(data.youngerChildren) || 0,
      olderChildren: parseInt(data.olderChildren) || 0,
      guestInfo: {
        name: data.guestName,
        email: data.guestEmail || "",
        phone: data.guestPhone,
      },
      totalAmount: parseFloat(data.totalAmount) || 0,
      specialRequests: data.specialRequests || "",
      status: "pending", // All new bookings start as pending
    });
    
    await newBooking.save();
    
    // Return the created booking
    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: {
          _id: newBooking._id,
          checkIn: newBooking.checkIn,
          checkOut: newBooking.checkOut,
          status: newBooking.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { message: "Failed to create booking", error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve bookings (for logged in users)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    // Build query based on user role
    let query = {};
    
    if (session.user.role === "guest") {
      // Guests can only see their own bookings
      query.userId = session.user.id;
    } else if (session.user.role === "host") {
      // Hosts can see bookings for their properties
      // This should ideally be handled by the host-specific endpoint
      // But included here for completeness
      const properties = await Property.find({ owner: session.user.id });
      const propertyIds = properties.map((p) => p._id);
      query.propertyId = { $in: propertyIds };
    } else if (session.user.role !== "admin") {
      // Non-admin users who aren't guests or hosts cannot access bookings
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("propertyId", "name")
      .populate("roomId", "category roomNumber")
      .lean();
    
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "Failed to fetch bookings", error: error.message },
      { status: 500 }
    );
  }
}