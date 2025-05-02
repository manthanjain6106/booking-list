import mongoose from 'mongoose';

// Define the schema first
const PropertySchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Property must belong to a host'],
  },
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true,
    maxlength: [100, 'Property name cannot exceed 100 characters'],
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
    },
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  paymentId: {
    type: String,
    required: [true, 'Payment ID for the custom payment system is required'],
    trim: true,
  },
  bankAccountName: {
    type: String,
    required: [true, 'Bank account name is required'],
    trim: true,
  },
  phoneNumbers: [{
    type: String,
    required: [true, 'At least one phone number is required'],
    trim: true,
  }],
  uniqueUrl: {
    type: String,
    required: [true, 'Unique URL is required'],
    unique: true,
    trim: true,
  },
  totalRooms: {
    type: Number,
    required: [true, 'Total number of rooms is required'],
    min: [1, 'Property must have at least 1 room'],
  },
  pricing: {
    type: {
      type: String,
      enum: ['perPerson', 'perRoom'],
      required: [true, 'Pricing type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Price value is required'],
      min: [1, 'Price must be at least 1'],
    }
  },
  amenities: [{
    type: String,
    trim: true,
  }],
  images: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active',
  },
  bookingModificationTimeframe: {
    type: Number,
    default: 10,
    min: [0, 'Booking modification timeframe cannot be negative'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Add virtuals to the schema before model creation
PropertySchema.virtual('rooms', {
  ref: 'Room',
  foreignField: 'property',
  localField: '_id',
});

PropertySchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'property',
  localField: '_id',
});

// Create the model
const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);

export default Property;