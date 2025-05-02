import { connectToDatabase } from "@/app/utils/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find user
    const hostUser = await db.collection('users').findOne({ email: session.user.email });
    if (!hostUser) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Find property belonging to this host
    const property = await db.collection('properties').findOne({ host: hostUser._id });
    
    if (!property) {
      return Response.json({ 
        message: "No property found for this host", 
        property: null
      }, { status: 404 });
    }

    return Response.json({ 
      success: true, 
      property: property 
    });
  } catch (error) {
    console.error("Property fetch error:", error);
    return Response.json({ 
      message: error.message || "Failed to fetch property",
      success: false 
    }, { 
      status: 500 
    });
  }
}