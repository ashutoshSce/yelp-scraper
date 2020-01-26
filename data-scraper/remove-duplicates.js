/* Command: node restaurants-detail.js 6629 1000 */
require('dotenv').config({
  path: __dirname + '/.env'
});

const MongoModule = require('./mongo');

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

(async () => {
  const mongo = new MongoModule();
  await mongo.connectToDb();
  
  /* Unique localities */
  // const restaurants = await mongo.queryFullObject('restaurant', {localities: "Suffolk County"});
  // const restaurantsLength = restaurants.length;
  // for(let websiteIndex=0; websiteIndex<restaurantsLength; websiteIndex++) {
  //   const item = restaurants[websiteIndex];
  //   if(item.localities.length > 1) {
  //     item.localities = item.localities.filter(onlyUnique);
  //     await mongo.updateObject('restaurant', item, {businessUrl: item.businessUrl});
  //   }
  // }

  // /* Remove Duplicates businessUrl */
  // const restaurants = await mongo.duplicateBusinessUrl('restaurant');
  // const restaurantsLength = restaurants.length;
  // for(let websiteIndex=0; websiteIndex<restaurantsLength; websiteIndex++) {
  //   const businessUrl = restaurants[websiteIndex]._id;
  //   await mongo.deleteManyObject('restaurant', { businessUrl: businessUrl, "createdAt": { $exists: false}});
  // }
  await mongo.disconnectToDb();
})();