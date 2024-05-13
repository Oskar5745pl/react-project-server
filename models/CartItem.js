import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  // Define order schema fields
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }
});

const CartItem = mongoose.model('Users', cartItemSchema);

export default CartItem