import mongoose from 'mongoose';

// Check if models already exists to prevent overwriting
const Agent = mongoose.models.Agent || mongoose.model('Agent', new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agent must be associated with a user'],
    unique: true,
  },
  agencyName: {
    type: String,
    required: [true, 'Agency name is required'],
    trim: true,
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
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
  contactNumbers: [{
    type: String,
    required: [true, 'At least one contact number is required'],
    trim: true,
  }],
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  // Visiting card image
  visitingCard: {
    type: String,
    required: [true, 'Visiting card image is required'],
  },
  // Properties this agent is approved to work with
  approvedProperties: [{
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    approvedDate: {
      type: Date,
      default: Date.now,
    },
    commissionRate: {
      type: Number,
      required: [true, 'Commission rate is required for each approved property'],
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100%'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  // Properties the agent has requested approval for
  pendingProperties: [{
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  }],
  // Agent's commission history
  commissions: [{
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Commission amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    paidDate: {
      type: Date,
    },
  }],
  // Agent verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
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
}));

export default Agent;