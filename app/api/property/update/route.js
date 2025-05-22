import { connectToDatabase } from "../../../utils/db";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

export async function PUT(req) {
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
    const { propertyId } = data;

    if (!propertyId) {
      return Response.json({ message: "Property ID is required" }, { status: 400 });
    }

    // Find property and verify ownership
    const property = await db.collection('properties').findOne({ 
      _id: new ObjectId(propertyId) 
    });
    
    if (!property) {
      return Response.json({ message: "Property not found" }, { status: 404 });
    }

    // Verify the property belongs to this host
    if (property.host.toString() !== hostUser._id.toString()) {
      return Response.json({ 
        message: "You do not have permission to update this property" 
      }, { status: 403 });
    }

    // Update property details
    const result = await db.collection('properties').updateOne(
      { _id: new ObjectId(propertyId) },
      { 
        $set: {
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
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return Response.json({ 
        message: "No changes were made to the property" 
      }, { status: 400 });
    }

    // Get the updated property
    const updatedProperty = await db.collection('properties').findOne({ 
      _id: new ObjectId(propertyId) 
    });

    return Response.json({ 
      success: true, 
      message: "Property updated successfully",
      property: updatedProperty 
    });
  } catch (error) {
    console.error("Property update error:", error);
    return Response.json({ 
      message: error.message || "Failed to update property",
      success: false 
    }, { 
      status: 500 
    });
  }
}