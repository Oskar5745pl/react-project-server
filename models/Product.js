import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Define product schema fields
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  nutrition: String,
  sectionId: String,
  servings: Number,
  hexColor: String,
  displayName: String,
  productType:String
});

const Product = mongoose.model('Product', productSchema);
export {productSchema}
export default Product;