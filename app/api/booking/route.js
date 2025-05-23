import { dbConnect } from "../../../utils/mongoose";
import Booking from "../../../models/Booking";
import Room from "../../../models/Room";
import Property from "../../../models/Property";

// In app/api/booking/route.js
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, phone, child0to5, child6to10, numChild0to5, numChild6to10, roomId, propertyId } = body;

    // Validate required fields
    if (!name || !email || !phone || !roomId || !propertyId) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), { status: 400 });
    }

    // Find room and property
    const room = await Room.findById(roomId);
    const property = await Property.findById(propertyId);
    if (!room || !property) {
      return new Response(JSON.stringify({ message: "Room or property not found" }), { status: 404 });
    }

    // Check if the room belongs to the property
    if (room.property.toString() !== property._id.toString()) {
      return new Response(JSON.stringify({ message: "Room does not belong to property" }), { status: 400 });
    }

    // Calculate total price using your Room model's logic
    let totalPrice = 0;
    if (room.pricing?.perRoom) {
      totalPrice = room.pricing.perRoom;
    } else {
      const adultRate = room.pricing?.adultRate || 0;
      const childRate = room.pricing?.childRate || Math.floor(adultRate / 2);
      totalPrice = adultRate + (child6to10 ? numChild6to10 * childRate : 0);
    }

    // Create booking
    const booking = await Booking.create({
      property: propertyId, // Use 'property' to match your model's field
      room: roomId, // Use 'room' to match your model's field
      guest: { name, email, phone },
      children: {
        child0to5: child0to5 ? numChild0to5 : 0,
        child6to10: child6to10 ? numChild6to10 : 0,
      },
      totalPrice,
      status: "pending",
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ message: "Booking successful", bookingId: booking._id }), { status: 201 });
  } catch (err) {
    console.error("Booking API error:", err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}