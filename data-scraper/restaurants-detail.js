/* Command: node restaurants-detail.js 0 500 */
require('dotenv').config({
  path: __dirname + '/.env'
});
const puppeteer = require('puppeteer');

const MongoModule = require('./mongo');
const LoggerModule = require('./logger');
let skip = parseInt(process.argv[2]);
let limit = parseInt(process.argv[3]) || 1000;

(async () => {
  const logger = new LoggerModule();

  process.on('unhandledRejection', (err) => {
   logger.sendMessageToSlack('Caught exceptionn: ' + err.toString());
    process.exit();
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
    console.log(skip + websiteIndex);
    const websiteUrl = restaurants[websiteIndex].businessUrl;
    logger.sendMessageToSlack('Scraping Yelp Website Detail.' + websiteUrl);
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    const pageUrl = 'https://www.yelp.com'+websiteUrl;
    await page.goto(pageUrl);

    const website = await page.evaluate(() => {
      const link = document.querySelector('aside > section p > a[rel=noopener]');
      if(link) {
        const current_url = new URL(link.href);
        const search_params = current_url.searchParams;
        const url = search_params.get('url');
        return {link: url, linkText: link.textContent } 
      }

      if (document.querySelector('p')?.textContent === "You may need permission to access this page. Request permission") {
        return "-";
      }
      
      return null;
    });

    await page.close();
    if(website) {
      if(website === "-") {
        logger.sendMessageToSlack('Permission Denied. Skip: '+ (skip + websiteIndex)+' '+ websiteUrl);
        break;
      } else {
        const item = restaurants[websiteIndex];
        item.link = website.link
        item.linkText = website.linkText;
        await mongo.updateObject('restaurant', item, { businessUrl: websiteUrl });
      }
    }
  }

  await browser.close();
  await mongo.disconnectToDb();
})();
