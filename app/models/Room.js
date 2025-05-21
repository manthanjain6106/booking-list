import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Room must belong to a property'],
    index: true,
  },
  name: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Room category is required'],
    trim: true,
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
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
      min: 1,
    },
    children: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: 1,
    },
    capacityText: {
      type: String, // For flexible display like "5+"
      default: '',
    },
  },

  // Flexible pricing structure
  pricing: {
    // Per room
    perRoom: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    extraPersonCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Per person mapping
    perPersonPrices: {
      type: Map,
      of: Number,
      default: null,
    },
    // Per adult/child
    adultRate: {
      type: Number,
      min: 0,
    },
    childRate: {
      type: Number,
      min: 0,
    },
    maxAdults: {
      type: Number,
      min: 1,
    },
    maxChildren: {
      type: Number,
      min: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: [0, 'Advance amount cannot be negative'],
    },
    seasonalPricing: [{
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      perRoom: Number,
      perPerson: Number,
      adultRate: Number,
      childRate: Number,
    }]
  },

  amenities: [{
    type: String,
    trim: true,
  }],

  images: [{
    type: String,
    trim: true,
  }],

  agentCommission: {
    type: Number,
    default: 0,
    min: [0, 'Commission cannot be negative'],
  },

  isAvailable: {
    type: Boolean,
    default: true,
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
});

// Compound index for uniqueness
roomSchema.index({ property: 1, category: 1, roomNumber: 1 }, { unique: true });

// Virtual: Bookings
roomSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'room',
  localField: '_id',
});

// Virtual: maxGuests (based on text field)
roomSchema.virtual('maxGuests').get(function () {
  if (!this.capacity) return 0;
  if (this.capacity.capacityText === '5+') return 10;
  return this.capacity.total || 0;
});

// Virtual: calculated price
roomSchema.virtual('calculatedPrice').get(function () {
  if (!this.pricing || !this.capacity) return 0;
  if (this.pricing.perRoom) {
    return this.pricing.perRoom;
  }
  if (this.pricing.adultRate) {
    const adults = Math.min(this.capacity.adults || 0, this.pricing.maxAdults || 0);
    const children = Math.min(this.capacity.children || 0, this.pricing.maxChildren || 0);
    return (this.pricing.adultRate * adults) + (this.pricing.childRate * children);
  }
  if (this.pricing.perPersonPrices) {
    const key = String(this.capacity.total || 0);
    return this.pricing.perPersonPrices.get(key) || 0;
  }
  return 0;
});

// Instance method: calculate price dynamically
roomSchema.methods.calculatePrice = function (numAdults, numChildren) {
  if (!this.pricing || !this.capacity) return 0;
  if (this.pricing.perRoom) {
    const extraPeople = Math.max(0, (numAdults + numChildren) - (this.capacity.total || 0));
    return this.pricing.perRoom + (this.pricing.extraPersonCharge || 0) * extraPeople;
  }
  const adultRate = this.pricing.adultRate || (this.pricing.perPersonPrices?.get('1')) || 0;
  const childRate = this.pricing.childRate || Math.floor(adultRate / 2);
  return (numAdults * adultRate) + (numChildren * childRate);
};

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

export default Room;
