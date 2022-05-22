const { to } = require('await-to-js');
const fp = require('lodash/fp');

const restaurant = require('../models/restaurant.model');

const categories = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let categoriesList = {};
  let err = {};
  let categoriesResponse = [];
  [err, categoriesList] = await to(restaurant.distinct('categories').lean());
  if (!err) {
    categoriesList.forEach((value) => {
      categoriesResponse.push({
        id: value,
        name: value,
      });
    });
    categoriesResponse = fp.sortBy('name')(categoriesResponse);
  }
  res.status(200).json(categoriesResponse);
};

const neighborhoods = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let neighborhoodsList = {};
  let err = {};
  let neighborhoodsResponse = [];
  [err, neighborhoodsList] = await to(restaurant.distinct('neighborhoods').lean());
  if (!err) {
    neighborhoodsList.forEach((value) => {
      neighborhoodsResponse.push({
        id: value,
        name: value
      });
    });
    neighborhoodsResponse = fp.sortBy('name')(neighborhoodsResponse);
  }
  res.status(200).json(neighborhoodsResponse);
};

const localities = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let localitiesList = {};
  let err = {};
  let localitiesResponse = [];
  [err, localitiesList] = await to(restaurant.distinct('localities').lean());
  if (!err) {
    localitiesList.forEach((value) => {
      localitiesResponse.push({
        id: value,
        name: value,
      });
    });
    localitiesResponse = fp.sortBy('name')(localitiesResponse);
  }
  res.status(200).json(localitiesResponse);
};

module.exports.categories = categories;
module.exports.neighborhoods = neighborhoods;
module.exports.localities = localities;
