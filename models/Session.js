import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  cart: [{
    product: { 
      type: Object, // Use imported product schema
      required: true // Ensure product is required
    }, 
    quantity: Number
  }],
  createdAt: { type: Date, expires: 24 * 60 * 60, default: Date.now } // TTL index configuration
});

const Session = mongoose.model('Sessions', sessionSchema);

export default Session;