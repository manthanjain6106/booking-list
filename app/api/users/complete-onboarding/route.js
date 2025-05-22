import { connectToDatabase } from "../../../utils/db";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { completed, propertyId } = await req.json();

    // Update user with onboarding status
    const updateData = { 
      hasCompletedOnboarding: completed 
    };
    
    // If propertyId is provided (for hosts), save it to user
    if (propertyId) {
      updateData.propertyId = propertyId;
    }

    const result = await db.collection('users').updateOne(
      { email: session.user.email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Onboarding status updated successfully"
    });
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return Response.json({ 
      message: error.message || "Failed to update onboarding status",
      success: false 
    }, { 
      status: 500 
    });
  }
}