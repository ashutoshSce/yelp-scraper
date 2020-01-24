/* node restaurants.js "New%20York%2C%20NY" "New York" 0 */
/* node restaurants.js "Bronx%2C%20NY" "Bronx" 0 */
/* node restaurants.js "Brooklyn%2C%20NY" "Brooklyn" 0 */
/* node restaurants.js "Queens%2C%20NY" "Queens" 0 */
/* node restaurants.js "Manhattan%2C%20NY" "Manhattan" 0 */
/* node restaurants.js "Staten%20Island%2C%20NY" "Staten Island" 0 */
/* node restaurants.js "Nassau%20County%2C%20NY" "Nassau Country" 0 */
/* node restaurants.js "Suffolk%20County%2C%20NY" "Suffolk Country" 0 */

require('dotenv').config({
  path: __dirname + '/.env'
});
const puppeteer = require('puppeteer');
const {
  spawn
} = require('child_process');

const MongoModule = require('./mongo');
const LoggerModule = require('./logger');
let loc = process.argv[2];
let locality = process.argv[3];
let count = parseInt(process.argv[4]);

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

(async () => {
  const logger = new LoggerModule();

  process.on('unhandledRejection', (err) => {
    logger.sendMessageToSlack('Caught exceptionn: ' + err.toString()).then(() => {
      spawn(process.env.NODE_PATH, [__dirname + '/restaurants.js', loc, locality, count], {
        detached: true
      });
      process.exit();
    });
  });

  const mongo = new MongoModule();
  await mongo.connectToDb();

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  while (count < 961) {
    logger.sendMessageToSlack('Scraping Yelp.' + count);
    const page = await browser.newPage();
    const pageUrl = 'https://www.yelp.com/search/snippet?cflt=restaurants&find_loc='+loc+'&start='+count;
    await page.goto(pageUrl);
    restaurantDetails = await page.evaluate(() =>  {
      return JSON.parse(document.querySelector("body").innerText); 
    });
    if(typeof restaurantDetails !== 'undefined' && 
        typeof restaurantDetails.searchPageProps !== 'undefined' && 
        typeof restaurantDetails.searchPageProps.searchResultsProps !== 'undefined' && 
        restaurantDetails.searchPageProps.searchResultsProps !== null &&
        typeof restaurantDetails.searchPageProps.searchResultsProps.searchResults !== 'undefined' &&
        restaurantDetails.searchPageProps.searchResultsProps.searchResults !== null &&
        Array.isArray(restaurantDetails.searchPageProps.searchResultsProps.searchResults) &&
        restaurantDetails.searchPageProps.searchResultsProps.searchResults.length > 0) {
      const businessAddressData = {};
      const businessMapData = {};
      if(typeof restaurantDetails.searchPageProps.headerProps !== 'undefined' && 
          typeof restaurantDetails.searchPageProps.headerProps.pagerData !== 'undefined' &&
          typeof restaurantDetails.searchPageProps.headerProps.pagerData.end !== 'undefined'){
            count = parseInt(restaurantDetails.searchPageProps.headerProps.pagerData.end) + 1;
      }

      if(typeof restaurantDetails.searchPageProps.searchMapProps !== 'undefined') {
        
        if(typeof restaurantDetails.searchPageProps.searchMapProps.hovercardData !== 'undefined') {
          const mapData = restaurantDetails.searchPageProps.searchMapProps.hovercardData;
          Object.keys(mapData).forEach(key => {
            businessAddressData[key] = {
              address: mapData[key].addressLines,
              businessUrl: mapData[key].businessUrl,
            }
          });
        }

        if(typeof restaurantDetails.searchPageProps.searchMapProps.mapState !== 'undefined' &&
          typeof restaurantDetails.searchPageProps.searchMapProps.mapState.markers !== 'undefined' && 
          Array.isArray(restaurantDetails.searchPageProps.searchMapProps.mapState.markers) &&
          restaurantDetails.searchPageProps.searchMapProps.mapState.markers.length > 0) {
          restaurantDetails.searchPageProps.searchMapProps.mapState.markers.filter(item => typeof item.location !== 'undefined' && item.location !== null).forEach(item => {
            const id = item.hovercardId;
            if(typeof businessAddressData[id] !== 'undefined') {
              businessMapData[businessAddressData[id].businessUrl] = {
                location: item.location,
                address:  businessAddressData[id].address
              }
            }
          });
        }
      }

      const businesses = restaurantDetails.searchPageProps.searchResultsProps.searchResults.filter(item => typeof item.searchResultBusiness !== 'undefined').map(item => {
        const vendor = item.searchResultBusiness;
        let categories = [];
        if(typeof vendor.categories !== 'undefined') {
          categories = vendor.categories.map(category => category.title);
        }

        let address = [];
        let location = {};
        if(typeof businessMapData[vendor.businessUrl] !== 'undefined') {
          if(typeof businessMapData[vendor.businessUrl].address !== 'undefined') {
            address = businessMapData[vendor.businessUrl].address
          }
          if(typeof businessMapData[vendor.businessUrl].location !== 'undefined') {
            location = businessMapData[vendor.businessUrl].location
          }
          delete(businessMapData[vendor.businessUrl]);
        }
        if(vendor.isAd) {
          const urlParams = new URLSearchParams(vendor.businessUrl);
          if(urlParams.has('redirect_url')) {
            const businessUrl = urlParams.get('redirect_url').split('biz');
            vendor.businessUrl = `/biz${businessUrl[1]}`;
          }
        }

        return {
          name: vendor.name,
          reviewCount: vendor.reviewCount,
          rating: vendor.rating,
          businessUrl: vendor.businessUrl,
          phone: vendor.phone,
          priceRange: vendor.priceRange,
          address: address,
          neighborhoods: vendor.neighborhoods,
          categories: categories,
          location: location,
          isAd: vendor.isAd,
          localities:[locality]
        }
      });

      const businessesLength =businesses.length;
      for(let index=0; index < businessesLength; index++) {
        const item = businesses[index];
        const queryObj = {
          businessUrl: item.businessUrl
        };
        const oldValue = await mongo.queryObject('restaurant', queryObj);
        if(oldValue === null) {
          await mongo.writeObject('restaurant', item)
        }
        else {
          if(oldValue.link !== undefined) {
            item.link = oldValue.link;
            item.linkText = oldValue.linkText;
          }
          if(oldValue.localities !== undefined){
            item.localities = item.localities.concat(oldValue.localities).filter(onlyUnique);
          }
          await mongo.updateObject('restaurant', item, queryObj);
        }
      }
    } else {
      logger.sendMessageToSlack('Scraping Yelp Error. ' + pageUrl);
      await page.close();
      break;
    }
    await page.close();
  }

  await browser.close();
  await mongo.disconnectToDb();
  logger.sendMessageToSlack('Finished Scraping Yelp.' + count);
})();
