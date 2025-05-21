import mongoose from 'mongoose';

// Define the schema separately
const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    // Generate a unique booking ID (BID)
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Booking must belong to a property'],
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Booking must be for a room'],
  },
  // Who made the booking - can be a guest or agent
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must have a user associated with it'],
  },
  // Role of the person who made the booking
  bookedByRole: {
    type: String,
    enum: ['guest', 'agent'],
    required: [true, 'Booking role is required'],
  },
  // If booked by agent, this refers to the actual guest
  guestDetails: {
    name: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Guest email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Guest phone is required'],
      trim: true,
    },
    adults: {
      type: Number,
      required: [true, 'Number of adults is required'],
      min: [1, 'At least one adult is required per booking'],
    },
    children: {
      type: Number,
      default: 0,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
  },
  // Booking dates
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required'],
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required'],
  },
  // Number of rooms booked (could be multiple of the same type)
  numberOfRooms: {
    type: Number,
    required: [true, 'Number of rooms is required'],
    min: [1, 'At least one room must be booked'],
  },
  // Pricing details
  pricing: {
    roomRate: {
      type: Number,
      required: [true, 'Room rate is required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
    },
    advanceAmount: {
      type: Number,
      required: [true, 'Advance amount is required'],
    },
    balanceAmount: {
      type: Number,
      required: [true, 'Balance amount is required'],
    },
    agentCommission: {
      type: Number,
      default: 0,
    },
  },
  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show', 'declined'],
    default: 'pending',
  },
  // Payment details
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  // For bookings by agents
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
  },
  // Booking history for modifications/cancellations
  history: [{
    action: {
      type: String,
      enum: ['created', 'modified', 'rescheduled', 'cancelled'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    details: {
      type: String,
    },
  }],
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
});

// Pre-save middleware to generate a unique booking ID if not already present
BookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    // Generate a booking ID: BID-[YEAR][MONTH][DAY]-[RANDOM 4 DIGITS]
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    
    this.bookingId = `BID-${year}${month}${day}-${random}`;
  }
  next();
});

// Use existing model if already compiled, else create new
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

export default Booking;