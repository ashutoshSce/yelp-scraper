const express = require('express');

const router = express.Router();

const RestaurantController = require('../app/controllers/restaurant.controller');
const RestaurantFilterController = require('../app/controllers/restaurant-filter.controller');

/* GET restaurant page. */
router.get('/restaurant', RestaurantController.get);

router.get('/restaurant-filter/categories', RestaurantFilterController.categories);
router.get('/restaurant-filter/neighborhoods', RestaurantFilterController.neighborhoods);
router.get('/restaurant-filter/localities', RestaurantFilterController.localities);

module.exports = router;
