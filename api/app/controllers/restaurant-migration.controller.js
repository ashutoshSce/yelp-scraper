const { to } = require('await-to-js');
const fs = require('fs');

const restaurant = require('../models/restaurant.model');

const exportData = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let restaurantList = [];
  const restaurants = [];
  let err = {};
  const skip = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 5;
  [err, restaurantList] = await to(
    restaurant
      .find()
      .skip(skip)
      .limit(limit)
  );
  if (!err) {
    restaurantList.forEach(vendor => {
      const item = {
        name: vendor.name,
        reviewCount: vendor.reviewCount,
        rating: vendor.rating,
        businessUrl: vendor.businessUrl,
        phone: vendor.phone,
        priceRange: vendor.priceRange,
        address: vendor.address,
        neighborhoods: vendor.neighborhoods,
        categories: vendor.categories,
        location: vendor.location,
        isAd: vendor.isAd,
        localities: vendor.localities
      };
      if (vendor.link !== undefined) {
        item.link = vendor.link;
        item.linkText = vendor.linkText;
      }
      restaurants.push(item);
    });
    const path = `./migrations/${skip}-${limit}.json`;
    fs.writeFile(path, JSON.stringify(restaurants), e => {
      if (e) {
        throw e;
      }
    });
  } else {
    console.log(err);
  }
  res.status(200).json({
    count: restaurants.length,
    first: restaurants[0],
    last: restaurants[restaurants.length - 1]
  });
};

const importData = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let restaurantList = [];
  const skip = req.query.skip || 0;
  const limit = req.query.limit || 5;
  const path = `./migrations/${skip}-${limit}.json`;
  const data = fs.readFileSync(path);
  restaurantList = JSON.parse(data.toString());
  await to(restaurant.collection.insertOne(restaurantList));
  res.status(200).json({
    count: restaurantList.length,
    first: restaurantList[0],
    last: restaurantList[restaurantList.length - 1]
  });
};

module.exports.exportData = exportData;
module.exports.importData = importData;
