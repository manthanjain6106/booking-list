import mongoose from 'mongoose';

// Check if models already exists to prevent overwriting
const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Payment must be associated with a booking'],
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true,
  },
  // The user who made the payment (guest or agent)
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payment must have a user associated with it'],
  },
  // The host who received the payment
  paidTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payment must have a recipient host'],
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'INR', // Indian Rupees as default
    required: [true, 'Currency is required'],
  },
  paymentType: {
    type: String,
    enum: ['advance', 'balance', 'full', 'refund'],
    required: [true, 'Payment type is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  // Custom payment system details (UPI-like)
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['custom-upi'], // For the custom-built UPI-like payment system
    default: 'custom-upi',
  },
  customPaymentDetails: {
    paymentId: {
      type: String, // The host's payment ID in the custom system
      required: [true, 'Host payment ID is required'],
    },
    verificationCode: {
      type: String, // PIN or verification code used for the transaction
      required: [true, 'Verification code is required'],
    },
    // Additional fields specific to the custom payment system can be added here
  },
  // Fields for refunds
  refundDetails: {
    originalPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    reason: {
      type: String,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  notes: {
    type: String,
    trim: true,
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

// Pre-save middleware to generate a unique transaction ID if not already present
Payment.pre('save', async function(next) {
  if (!this.transactionId) {
    // Generate a transaction ID: TXN-[YEAR][MONTH][DAY]-[RANDOM 6 DIGITS]
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(100000 + Math.random() * 900000);
    
    this.transactionId = `TXN-${year}${month}${day}-${random}`;
  }
  next();
});

export default Payment;