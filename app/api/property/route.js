import { connectToDatabase } from "@/app/utils/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { nanoid } from 'nanoid';

export async function POST(req) {
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

    // Parse request data
    const data = await req.json();
    
    // Generate a unique URL
    const baseSlug = data.name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 40);
    
    const uniqueId = nanoid(8);
    const uniqueUrl = `${baseSlug}-${uniqueId}`;

    // Create the property
    const newProperty = await db.collection('properties').insertOne({
      host: hostUser._id,
      name: data.name,
      location: {
        address: data.location.address,
        city: data.location.city,
        state: data.location.state,
        country: data.location.country,
        pinCode: data.location.pinCode,
      },
      paymentId: data.paymentId,
      bankAccountName: data.bankAccountName,
      phoneNumbers: data.phoneNumbers,
      totalRooms: data.totalRooms,
      pricing: {
        type: data.pricing.type,
        value: data.pricing.value
      },
      description: data.description || "",
      amenities: data.amenities || [],
      images: [],
      uniqueUrl: uniqueUrl,
      createdAt: new Date(),
      isVerified: false,
      status: 'active',
      isActive: true // Ensure isActive is set to true
    });
    
    // Update user to mark onboarding as completed
    await db.collection('users').updateOne(
      { _id: hostUser._id },
      { $set: { hasCompletedOnboarding: true } }
    );
    
    // Get the inserted property
    const insertedProperty = await db.collection('properties').findOne({ _id: newProperty.insertedId });
    
    // Return success response
    return Response.json({
      success: true,
      propertyId: newProperty.insertedId.toString(),
      uniqueUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://booklist.app'}/stay/${uniqueUrl}`,
      property: insertedProperty
    });
  } catch (error) {
    console.error("Property creation error:", error);
    
    // Return proper error response
    return Response.json({
      message: error.message || "Failed to create property",
      success: false
    }, {
      status: 500
    });
  }
}