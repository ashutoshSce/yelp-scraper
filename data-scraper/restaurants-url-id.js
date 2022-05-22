/* Command: node restaurants-url-id.js businessUrl */
require('dotenv').config({
  path: __dirname + '/.env'
});
const puppeteer = require('puppeteer');

const MongoModule = require('./mongo');
const LoggerModule = require('./logger');
const { text } = require('express');
let businessUrl = process.argv[2];

(async () => {
  const logger = new LoggerModule();

  process.on('unhandledRejection', (err) => {
   logger.sendMessageToSlack('Caught exceptionn: ' + err.toString());
    process.exit();
  });

  const mongo = new MongoModule();
  await mongo.connectToDb();
  const restaurants = await mongo.queryObjectOffsetWithCondition('restaurant', {"businessUrl": businessUrl}, 0, 1);

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  if(restaurants.length === 1) {
    const url = restaurants[0].link;
    logger.sendMessageToSlack('Scraping Restaurant Url.' + url);
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(url);

    const links = await page.evaluate(() => {      
      const textContent = document.querySelector('body').textContent;
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      let emails = Array.from(new Set(textContent.match(emailRegex)));

      // remove unwanted email-ids
      for (let index=0; index<emails.length; index++) {
        if(emails[index].startsWith("CONTACT@") || emails[index].startsWith("contact@")) {
          continue;
        }

        if(emails[index].startsWith("CONTACT") || emails[index].startsWith("contact")) {
          emails[index] = emails[index].slice(7);
        }  
      }
      emails = emails.filter((element) => !(element.endsWith(".gif") || element.endsWith(".mp4") || element.endsWith(".png") || element.endsWith(".jpg") || element.endsWith(".jpeg")));
    
      const content = document.querySelector('body').outerHTML;

      const facebookRegex = /(https:\/\/www\.facebook\.com\/).[^\"]+/gi;
      const facebook = Array.from(new Set(content.match(facebookRegex)));

      const instagramRegex = /(https:\/\/www\.instagram\.com\/).[^\"]+/gi;
      const instagram = Array.from(new Set(content.match(instagramRegex)));

      const twitterRegex = /(https:\/\/twitter\.com\/).[^\"]+/gi;
      const twitter = Array.from(new Set(content.match(twitterRegex)));

      const youtubeRegex = /(https:\/\/www\.youtube\.com\/).[^\"]+/gi;
      const youtube = Array.from(new Set(content.match(youtubeRegex)));

      return {emails, facebook, instagram, twitter, youtube};
    });

    await page.close();

    const item = restaurants[0];
    if(links.emails.length > 0) {
        item.emails = links.emails
    } else if(item.emails) {
      item.emails = [];
    }

    if(links.facebook.length > 0) {
        item.facebook = links.facebook
    }

    if(links.instagram.length > 0) {
        item.instagram = links.instagram
    }

    if(links.twitter.length > 0) {
        item.twitter = links.twitter
    }

    if(links.youtube.length > 0) {
        item.youtube = links.youtube
    }

    console.log(item);
    await mongo.updateObject('restaurant', item, { businessUrl: restaurants[0].businessUrl });
  }

  await browser.close();
  await mongo.disconnectToDb();
})();
