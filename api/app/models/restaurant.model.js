const mongoose = require('mongoose');

const RestaurantSchema = mongoose.Schema({
  dtRowId: Number,
  name: String,
  phone: String,
  priceRange: String,
  categories: [String],
  services: [String],
  facebook: [String],
  instagram: [String],
  youtube: [String],
  twitter: [String],
  address: [String],
  neighborhoods: [String],
  link: String,
  linkText: String,
  rating: Number,
  reviewCount: Number,
  emails: [String],
  ranking: Number,
  businessUrl: String,
  location: {
    latitude: Number,
    longitude: Number,
  },
  localities: [String],
  isAd: Boolean,
});

module.exports = mongoose.model('Restaurant', RestaurantSchema, 'restaurant');
