import mongoose from 'mongoose';

// Check if models already exists to prevent overwriting
const Room = mongoose.models.Room || mongoose.model('Room', new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Room must belong to a property'],
  },
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Room category is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  capacity: {
    adults: {
      type: Number,
      required: [true, 'Adult capacity is required'],
      min: [1, 'Room must accommodate at least 1 adult'],
    },
    children: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Room must have a capacity of at least 1'],
    },
  },
  pricing: {
    // Base pricing
    perRoom: {
      type: Number, // Price per room
      required: function() {
        return !this.pricing.perPerson; // Required if perPerson is not set
      },
      min: [0, 'Price cannot be negative'],
    },
    perPerson: {
      type: Number, // Price per person
      required: function() {
        return !this.pricing.perRoom; // Required if perRoom is not set
      },
      min: [0, 'Price cannot be negative'],
    },
    advanceAmount: {
      type: Number,
      required: [true, 'Advance amount is required'],
      min: [0, 'Advance amount cannot be negative'],
    },
    // Seasonal pricing can be implemented with an array of price periods
    seasonalPricing: [{
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      perRoom: {
        type: Number,
        min: [0, 'Seasonal price cannot be negative'],
      },
      perPerson: {
        type: Number,
        min: [0, 'Seasonal price cannot be negative'],
      },
    }],
  },
  amenities: [{
    type: String,
    trim: true,
  }],
  images: [{
    type: String, // URLs to room images
  }],
  agentCommission: {
    type: Number, // Percentage or fixed amount
    default: 0,
    min: [0, 'Commission cannot be negative'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}));

// Virtual populate bookings for this room
Room.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'room',
  localField: '_id',
});

export default Room;