// User.js
import mongoose from 'mongoose';
import {productSchema}  from './Product.js';

const userSchema = new mongoose.Schema({
  // Define user schema fields
  username: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: Object
  },
  payment: {
    type: Object
  },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  cart: [{
    product: { 
      type: Object, // Use imported product schema
      required: true // Ensure product is required
    }, 
    quantity: Number
  }],
});


const User = mongoose.model('Users', userSchema);

export default User;