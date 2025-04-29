import mongoose from 'mongoose';

// Check if models already exists to prevent overwriting
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    // Not required when using social login
  },
  role: {
    type: String,
    enum: ['guest', 'agent', 'host', 'admin'],
    default: 'guest',
  },
  image: {
    type: String,
    // For profile image, optional
  },
  phone: {
    type: String,
    // Optional
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
 
}));

export default User;