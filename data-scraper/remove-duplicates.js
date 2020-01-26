/* Command: node restaurants-detail.js 6629 1000 */
require('dotenv').config({
  path: __dirname + '/.env'
});

const MongoModule = require('./mongo');

(async () => {
  const mongo = new MongoModule();
  await mongo.connectToDb();
  
  /* Remove Duplicates businessUrl */
  const restaurants = await mongo.duplicateBusinessUrl('restaurant');
  const restaurantsLength = restaurants.length;
  for(let websiteIndex=0; websiteIndex<restaurantsLength; websiteIndex++) {
    const businessUrl = restaurants[websiteIndex]._id;
    await mongo.deleteManyObject('restaurant', { businessUrl: businessUrl, "createdAt": { $exists: false}});
  }
  await mongo.disconnectToDb();
})();