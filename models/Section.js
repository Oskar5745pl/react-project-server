import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  // Define product schema fields
  name: {
    type: String,
    required: true
  },
  min_price: {
    type: Number,
    required: true
  },
  products: [{
      productName: {
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
    }
  ],
  description: String,
  overview: String,
  details: String

});

const Section = mongoose.model('Sections', sectionSchema);

export default Section;