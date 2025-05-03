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
    }
  },
  pricing: {
    // Base pricing
    perRoom: {
      type: Number, // Price per room
      required: function() {
        return !this.pricing.perPerson && !this.pricing.adultRate; // Required if neither perPerson nor adultRate is set
      },
      min: [0, 'Price cannot be negative'],
    },
    perPerson: {
      type: Number, // Price per person (legacy field)
      required: function() {
        return !this.pricing.perRoom && !this.pricing.adultRate; // Required if neither perRoom nor adultRate is set
      },
      min: [0, 'Price cannot be negative'],
    },
    // Enhanced child pricing fields
    adultRate: {
      type: Number, // Price per adult
      required: function() {
        return !this.pricing.perRoom && !this.pricing.perPerson; // Required if neither perRoom nor perPerson is set
      },
      min: [0, 'Adult rate cannot be negative'],
    },
    childRate: {
      type: Number, // Price per child (5-10 years)
      default: function() {
        return this.pricing.adultRate ? Math.floor(this.pricing.adultRate / 2) : 0;
      },
      min: [0, 'Child rate cannot be negative'],
    },
    maxAdults: {
      type: Number,
      default: function() {
        return this.capacity.adults || 1;
      },
      min: [1, 'Room must allow at least 1 adult'],
    },
    maxChildren: {
      type: Number,
      default: function() {
        return this.capacity.children || 0;
      },
      min: [0, 'Children capacity cannot be negative'],
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
      adultRate: {
        type: Number,
        min: [0, 'Seasonal adult rate cannot be negative'],
      },
      childRate: {
        type: Number,
        min: [0, 'Seasonal child rate cannot be negative'],
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

// Virtual for calculating total price based on occupancy
Room.virtual('calculatedPrice').get(function() {
  // If using perRoom pricing
  if (this.pricing.perRoom) {
    return this.pricing.perRoom;
  }
  
  // If using new adult/child rate pricing
  if (this.pricing.adultRate) {
    const adultTotal = this.pricing.adultRate * Math.min(this.capacity.adults, this.pricing.maxAdults || this.capacity.adults);
    const childTotal = this.pricing.childRate * Math.min(this.capacity.children, this.pricing.maxChildren || this.capacity.children);
    return adultTotal + childTotal;
  }
  
  // If using legacy perPerson pricing
  if (this.pricing.perPerson) {
    return this.pricing.perPerson * this.capacity.total;
  }
  
  return 0;
});

export default Room;