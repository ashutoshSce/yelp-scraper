/* Command: node restaurants-detail.js 6629 1000 */
require('dotenv').config({
  path: __dirname + '/.env'
});
const puppeteer = require('puppeteer');
const {
  spawn
} = require('child_process');

const MongoModule = require('./mongo');
const LoggerModule = require('./logger');
let skip = parseInt(process.argv[2]);
let limit = parseInt(process.argv[3]) || 900;
let failCount = 0;

(async () => {
  const logger = new LoggerModule();

  process.on('unhandledRejection', (err) => {
    console.log(require('util').format(err));
    logger.sendMessageToSlack(skip+', '+limit+' Caught exceptionn: ' + err.toString()).then(() => {
      // spawn(process.env.NODE_PATH, [__dirname + '/restaurants-detail.js', skip, limit], {
      //   detached: true
      // });
      process.exit();
    });
  });

  const mongo = new MongoModule();
  await mongo.connectToDb();
  const restaurants = await mongo.queryObjectOffset('restaurant', skip, limit);
  const restaurantsLength = restaurants.length;
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for(let websiteIndex=0; websiteIndex<restaurantsLength; websiteIndex++) {
    const websiteUrl = restaurants[websiteIndex].businessUrl;
    logger.sendMessageToSlack('Scraping Yelp Website Detail.' + websiteUrl);
    const page = await browser.newPage();
    const pageUrl = 'https://www.yelp.com'+websiteUrl;
    await page.goto(pageUrl);

    restaurantDetails = await page.evaluate(() =>  {
      return document.querySelector("body").outerHTML; 
    });
    if(restaurantDetails.indexOf('Sorry, you’re not allowed to access this page.') >= 0) {
      logger.sendMessageToSlack(pageUrl + ' BLOCKED -- Blocked ' + skip +' '+ limit);
      failCount++;
      await page.close();
      break;
    } else {
      const reference = restaurantDetails.split("Business website</p>");
      let tmp1 = [];
      if(reference.length > 1) {
        tmp1 = reference[1].split('</a></div>');
        const linkText = tmp1[0]+'</a>';
        const text = linkText.match(/<a [^>]+>([^<]+)<\/a>/)[1];
        const link = linkText.match(/<a [^>]* href="([^"]*)"/)[1];
        const url = link.match(/url=(.*)&amp;web/)[1];
        const item = restaurants[websiteIndex];
        item.link = decodeURIComponent(url);
        item.linkText = text;
        await mongo.updateObject('restaurant', item, { businessUrl: websiteUrl });
        failCount = 0;
      } else {
        logger.sendMessageToSlack(pageUrl + ' Error in Scraping Yelp Website Detail. ' + skip +' '+ limit);
        failCount++;
      }
    }
    await page.close();
    skip++;
  }
  await browser.close();
  await mongo.disconnectToDb();
  if(failCount === 0) {
    logger.sendMessageToSlack('Finished Scraping Yelp website detail.' + skip+' '+limit);
  }
})();
