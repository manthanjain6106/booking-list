// app/booking/host/route.js - API route for host bookings
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/app/utils/db";
import Booking from "@/app/models/Booking";
import Property from "@/app/models/Property";

export async function GET(request) {
  try {
    // Check if user is authenticated and is a host
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get the host's property
    const property = await Property.findOne({ owner: session.user.id });
    if (!property) {
      return NextResponse.json({ message: "No property found for this host" }, { status: 404 });
    }

    // Get filter from query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    // Prepare date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build query based on filter
    let query = { propertyId: property._id };

    if (filter === "today") {
      // Bookings for today (check-in today or check-out today or staying today)
      query.$or = [
        { checkIn: { $gte: today, $lt: tomorrow } },
        { checkOut: { $gte: today, $lt: tomorrow } },
        { $and: [{ checkIn: { $lt: today } }, { checkOut: { $gt: today } }] }
      ];
    } else if (filter === "pending") {
      // Bookings with pending status
      query.status = "pending";
    } else if (filter === "upcoming") {
      // Future bookings (check-in date is after today)
      query.checkIn = { $gt: today };
      query.status = { $nin: ["cancelled", "declined"] };
    } else if (filter === "past") {
      // Past bookings (check-out date is before today)
      query.checkOut = { $lt: today };
    }

    // Fetch bookings
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("roomId", "category roomNumber capacity")
      .lean();

    // Format bookings for response
    const formattedBookings = bookings.map(booking => {
      // Calculate nights from check-in and check-out dates
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

      return {
        _id: booking._id.toString(),
        propertyId: booking.propertyId.toString(),
        roomId: booking.roomId._id.toString(),
        category: booking.roomId.category,
        roomNumber: booking.roomId.roomNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights,
        numAdults: booking.numAdults,
        numChildren: booking.numChildren || 0,
        youngerChildren: booking.youngerChildren || 0,
        olderChildren: booking.olderChildren || 0,
        guestInfo: booking.guestInfo,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
        specialRequests: booking.specialRequests || ""
      };
    });

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error("Error fetching host bookings:", error);
    return NextResponse.json({ message: "Failed to fetch bookings" }, { status: 500 });
  }
}