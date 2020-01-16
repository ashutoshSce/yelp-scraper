const mongoose = require('mongoose');

const RestaurantSchema = mongoose.Schema({
  dtRowId: Number,
  name: String,
  phone: String,
  priceRange: String,
  categories: [String],
  address: [String],
  neighborhoods: [String],
  link: String,
  linkText: String,
  rating: Number,
  reviewCount: Number,
  businessUrl: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  localities: [String],
  isAd: Boolean
});

module.exports = mongoose.model('Restaurant', RestaurantSchema, 'restaurant');
