import mongoose from 'mongoose';

// Check if models already exists to prevent overwriting
const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient'],
  },
  type: {
    type: String,
    enum: [
      'new_booking',
      'booking_modification',
      'booking_cancellation',
      'check_in_today',
      'check_out_today',
      'payment_received',
      'agent_request',
      'agent_approval',
      'agent_rejection',
      'system_notification',
      'other'
    ],
    required: [true, 'Notification type is required'],
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
  },
  // Links to related resources
  relatedResource: {
    resourceType: {
      type: String,
      enum: ['booking', 'property', 'agent', 'payment', 'user', null],
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      // This can refer to different collections based on resourceType
    },
  },
  // For deep linking within the app
  actionUrl: {
    type: String,
    trim: true,
  },
  // Additional data that might be needed by the frontend
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  // Is this an email notification, in-app notification, or both
  deliveryChannels: {
    email: {
      type: Boolean,
      default: false,
    },
    inApp: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: false,
    },
  },
  // If this is an email notification, store delivery status
  emailDelivery: {
    isSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  expiresAt: {
    type: Date,
    // Optional, for notifications that are time-sensitive
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

// Indexes for better query performance
Notification.index({ recipient: 1, isRead: 1 });
Notification.index({ recipient: 1, createdAt: -1 });
Notification.index({ 'relatedResource.resourceType': 1, 'relatedResource.resourceId': 1 });

export default Notification;