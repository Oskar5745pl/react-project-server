import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: Object, required: true}, // Reference to user
  sessionId: { type: String }, // If guest checkout, store sessionId
  cart: [{ 
    product: { 
      type: Object, // Use imported product schema
      required: true // Ensure product is required
    },
    quantity: Number
  }],
  address: {
    type: Object
  },
  payment: {
    type: Object
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
    default: 'Pending'
  }
});

const Order = mongoose.model('Orders', orderSchema);

export default Order