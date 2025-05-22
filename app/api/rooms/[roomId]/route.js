// app/api/rooms/[roomId]/route.js
import { dbConnect } from "../../../utils/mongoose";
import Room from "../../../models/Room";

export async function GET(request, context) {
  try {
    await dbConnect();
    // Await params if it's a Promise (Next.js 14+)
    const params = context?.params && typeof context.params.then === 'function' ? await context.params : context.params;
    const { roomId } = params;
    
    console.log("API: Fetching room with ID:", roomId);
    
    const room = await Room.findById(roomId);
    
    if (!room) {
      console.error("API: Room not found with ID:", roomId);
      return new Response(JSON.stringify({ message: "Room not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log("API: Room found:", room.category, room.roomNumber);
    
    return new Response(JSON.stringify({ room }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("API: Error fetching room:", error);
    return new Response(JSON.stringify({ message: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}