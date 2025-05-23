// /app/api/users/route.js
import { connectToDatabase } from "../../utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    // 1. Get logged-in user's session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // 2. Get role from client request
    const { role } = await req.json();
    if (!role || !["guest", "host", "agent", "admin"].includes(role)) {
      return Response.json({ success: false, message: "Invalid role" }, { status: 400 });
    }

    // 3. Connect to MongoDB
    const { db } = await connectToDatabase();

    // 4. Find user and update role
    console.log("Session email for update:", session.user.email);
    const userInDb = await db.collection('users').findOne({ email: session.user.email });
    console.log("User found in DB:", userInDb);

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { email: session.user.email },
      { $set: { role } },
      { returnDocument: 'after', upsert: true }
    );
    console.log("Updated user result:", updatedUser);

    // Fix: Use updatedUser directly, not updatedUser.value
    if (!updatedUser) {
      return Response.json(
        { success: false, message: "User not found or update failed" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Role updated successfully",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("User Role Update Error:", error);
    
    return Response.json(
      { success: false, message: "Server error while updating role" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // Use connectToDatabase instead of dbConnect
    const { db } = await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find user in the database
    const user = await db.collection('users').findOne({ email: session.user.email });
    
    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    return Response.json({ 
      success: true, 
      hasOnboarded: user.hasOnboarded,
      user: {
        name: user.name,
        email: user.email,
        role: user.role || 'guest',
        hasOnboarded: user.hasOnboarded || false
      }
    });
  } catch (error) {
    console.error("User GET Error:", error);
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}