import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  // Define order schema fields
  cartItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CartItem', required: true }],
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart