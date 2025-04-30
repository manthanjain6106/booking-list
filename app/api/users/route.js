import { connectToDatabase } from "@/app/utils/db";
import User from "@/app/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    // 1. Get logged-in user's session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // 2. Get role from client request
    const { role } = await req.json();
    if (!role || !["guest", "host", "agent", "admin"].includes(role)) {
      return new Response(JSON.stringify({ message: "Invalid role" }), {
        status: 400,
      });
    }

    // 3. Connect to MongoDB
    const { db } = await connectToDatabase();

    // 4. Find user and update role
    const updatedUser = await db.collection('users').findOneAndUpdate(
      { email: session.user.email },
      { $set: { role } },
      { returnDocument: 'after', upsert: true } // Ensures the user is updated or created
    );

    if (!updatedUser.value) {
      return new Response(
        JSON.stringify({ message: "User not found or update failed" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Role updated successfully",
        user: {
          name: updatedUser.value.name,
          email: updatedUser.value.email,
          role: updatedUser.value.role,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("User Role Update Error:", error);
    
    // Handling specific MongoDB connection errors or timeouts
    if (error.name === 'MongoError') {
      return new Response(
        JSON.stringify({ message: "Database error while updating role" }),
        { status: 500 }
      );
    }

    // Catch all for other errors
    return new Response(
      JSON.stringify({ message: "Server error while updating role" }),
      { status: 500 }
    );
  }
}
