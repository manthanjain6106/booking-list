import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/app/utils/db";
import Booking from "@/app/models/Booking";
import Room from "@/app/models/Room";
import User from "@/app/models/User";
import Property from "@/app/models/Property"; // Added missing import

export async function POST(request) {
  try {
    await connectDB();

    // Pass request to getServerSession for correct session retrieval
    const session = await getServerSession(authOptions, request);

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

    // Check if the room exists
    const room = await Room.findById(data.roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // Check date validity
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);

    if (checkIn >= checkOut) {
      return NextResponse.json(
        { message: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const existingBooking = await Booking.findOne({
      roomId: data.roomId,
      status: { $nin: ["declined", "cancelled"] },
      $or: [
        { checkIn: { $lte: checkIn }, checkOut: { $gt: checkIn } },
        { checkIn: { $lt: checkOut }, checkOut: { $gte: checkOut } },
        { checkIn: { $gte: checkIn }, checkOut: { $lte: checkOut } },
      ],
    });

    if (existingBooking) {
      return NextResponse.json(
        { message: "Room is not available for the selected dates" },
        { status: 400 }
      );
    }

    // Determine userId from session or guestEmail
    let userId = session?.user?.id;

    if (!userId && data.guestEmail) {
      const existingUser = await User.findOne({ email: data.guestEmail });
      userId = existingUser?._id;
    }

    // Create new booking document
    const newBooking = new Booking({
      propertyId: data.propertyId,
      roomId: data.roomId,
      userId: userId || null,
      checkIn,
      checkOut,
      numAdults: parseInt(data.numAdults) || 1,
      numChildren: parseInt(data.numChildren) || 0,
      youngerChildren: parseInt(data.youngerChildren) || 0,
      olderChildren: parseInt(data.olderChildren) || 0,
      guestInfo: {
        name: data.guestName,
        email: data.guestEmail || "",
        phone: data.guestPhone,
      },
      totalAmount: parseFloat(data.totalAmount) || 0,
      specialRequests: data.specialRequests || "",
      status: "pending",
    });

    await newBooking.save();

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

export async function GET(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions, request);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = {};

    if (session.user.role === "guest") {
      query.userId = session.user.id;
    } else if (session.user.role === "host") {
      const properties = await Property.find({ owner: session.user.id });
      const propertyIds = properties.map((p) => p._id);
      query.propertyId = { $in: propertyIds };
    } else if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

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
