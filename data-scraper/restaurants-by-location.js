/* node restaurants-by-location.js 0 0*/

require('dotenv').config({
  path: __dirname + '/.env'
});
const puppeteer = require('puppeteer');

const MongoModule = require('./mongo');
const LoggerModule = require('./logger');
const locations = {
  "New+York%2C+NY%2C+United+States": "New York",
  "Nassau+County%2C+NY%2C+United+States": "Nassau County, NY",
  "Nassau+County%2C+FL%2C+United+States": "Nassau County, FL",
  "Suffolk+County%2C+NY%2C+United+States": "Suffolk County, NY",
  "Suffolk+County%2C+MA%2C+United+States": "Suffolk County, MA",
  "Westchester+County%2C+NY%2C+United+States": "Westchester County",
  "Rockland+County%2C+NY%2C+United+States": "Rockland County",
}

let skipLocation = process.argv[2];
let pageCount = parseInt(process.argv[3]) || 0;

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

(async () => {
  const logger = new LoggerModule();

  process.on('unhandledRejection', (err) => {
    logger.sendMessageToSlack('Caught exceptionn: ' + err.toString());
    process.exit();
  });

  const mongo = new MongoModule();
  await mongo.connectToDb();

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let start = 0;
  let isBreak = false;
  for (const loc in locations) {
    start++;
    if(start <= skipLocation) {
      continue;
    }

    skipLocation = 0;
    let locality =locations[loc];
    let count = 0;
    if(pageCount > 0) {
      count = pageCount;
      pageCount = 0;
    }
    
    logger.sendMessageToSlack('Scraping restaurants in '+locality+' '+ count);
    while (count < 240) {
      const pageUrl = 'https://www.yelp.com/search/snippet?find_desc=Restaurants&find_loc='+loc+'&start='+count;
     
      const page = await browser.newPage();
      await page.goto(pageUrl);
      
      restaurantDetails = await page.evaluate(() =>  {
        const textContent = document.querySelector("body").innerText;
        return textContent.indexOf("You may need permission to access this page. Request permission") >= 0 ? "-" : JSON.parse(textContent);
      });
      await page.close();

      if(restaurantDetails === "-") {
        logger.sendMessageToSlack('Permission Denied. Index: '+ (start - 1)+' '+ pageUrl);
        isBreak = true;
        break;
      }
      
      if(typeof restaurantDetails !== 'undefined' && 
          typeof restaurantDetails.searchPageProps !== 'undefined' &&
          Array.isArray(restaurantDetails.searchPageProps.mainContentComponentsListProps) &&
          restaurantDetails.searchPageProps.mainContentComponentsListProps.length > 0) {
        const businessAddressData = {};
        const businessMapData = {};

        if(typeof restaurantDetails.searchPageProps.rightRailProps !== 'undefined' &&
          typeof restaurantDetails.searchPageProps.rightRailProps.searchMapProps !== 'undefined') {
          
          if(typeof restaurantDetails.searchPageProps.rightRailProps.searchMapProps.hovercardData !== 'undefined') {
            const mapData = restaurantDetails.searchPageProps.rightRailProps.searchMapProps.hovercardData;
            Object.keys(mapData).forEach(key => {
              businessAddressData[key] = {
                address: mapData[key].addressLines,
                businessUrl: mapData[key].businessUrl,
              }
            });
          }

          if(typeof restaurantDetails.searchPageProps.rightRailProps.searchMapProps.mapState !== 'undefined' &&
            typeof restaurantDetails.searchPageProps.rightRailProps.searchMapProps.mapState.markers !== 'undefined' && 
            Array.isArray(restaurantDetails.searchPageProps.rightRailProps.searchMapProps.mapState.markers) &&
            restaurantDetails.searchPageProps.rightRailProps.searchMapProps.mapState.markers.length > 0) {
            restaurantDetails.searchPageProps.rightRailProps.searchMapProps.mapState.markers
            .filter(item => typeof item.location !== 'undefined' && item.location !== null)
            .forEach(item => {
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

        const businesses = restaurantDetails.searchPageProps.mainContentComponentsListProps.filter(item => typeof item.searchResultBusiness !== 'undefined').map(item => {
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

          // Remove non utf characters from name
          let output = "";
          if(vendor.name) {
            for (let i=0; i<vendor.name.length; i++) {
                if (vendor.name.charCodeAt(i) <= 127) {
                    output += vendor.name.charAt(i);
                }
            }
          }

          let services = [];
          if(item.serviceOfferings &&
             Array.isArray(item.serviceOfferings) &&
             item.serviceOfferings.length > 0) {
            services = item.serviceOfferings.filter(item => item?.icon?.name === "18x18_checkmark").map(item => item.label.text);
          }

          return {
            name: output,
            ranking: vendor.ranking,
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
            localities:[locality],
            services: services,
          }
        });

        const businessesLength = businesses.length;
        for(let index=0; index < businessesLength; index++) {
          const item = businesses[index];
          if(item.services.length === 0) {
            delete(item.services);
          }

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
        logger.sendMessageToSlack('Scraping restaurants Error. '+(start - 1)+' '+ pageUrl);
        isBreak = true;
        break;
      }
      count += 10;
    }

    if(isBreak) {
      break;
    }
  }

  await browser.close();
  await mongo.disconnectToDb();

  if(!isBreak) {
    logger.sendMessageToSlack('Finished Scraping All Locations.');
  }
})();
