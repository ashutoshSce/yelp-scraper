# yelp-scraper/data-scraper

## Getting Started

### Installation

To run data-scraper copy .env.example to .env file.
update required environment variable in it.

```bash
npm install
# or "yarn"
```

Note: It will install Puppeteer along with other dependencies, it downloads a recent version of Chromium (~170MB Mac, ~282MB Linux, ~280MB Win) that is guaranteed to work with the API.

Run code in terminal to get New York, NY Restaurants
```bash
node restaurants.js "New%20York%2C%20NY" "New York" 0 
```
Run code in terminal to get Bronx, NY Restaurants
```bash
node restaurants.js "Bronx%2C%20NY" "Bronx" 0 
```
Run code in terminal to get Brooklyn, NY Restaurants
```bash
node restaurants.js "Brooklyn%2C%20NY" "Brooklyn" 0 
```
Run code in terminal to get Queens, NY Restaurants
```bash
node restaurants.js "Queens%2C%20NY" "Queens" 0 
```

Here 0 represents first page, and then it increases in multiple of 30, So 2nd page is 30, 3rd Page is 90 and so on.
It will continue till 990 Or page results count whichever is less and then it terminates.

It will record below details in mondo db restaurants collection
```bash
{
    "name" : "Sushi By M",
    "reviewCount" : 379,
    "rating" : 4.5,
    "businessUrl" : "/biz/sushi-by-m-new-york",
    "phone" : "(347) 688-8101",
    "priceRange" : "$$$",
    "address" : [ 
        "75 E 4th St", 
        "New York, NY 10003"
    ],
    "neighborhoods" : [ 
        "East Village"
    ],
    "categories" : [ 
        "Sushi Bars"
    ],
    "location" : {
        "latitude" : 40.7266887,
        "longitude" : -73.9902341
    },
    "isAd" : false,
    "localities" : [ 
        "Staten Island", 
        "Manhattan", 
        "New York"
    ]
}
```

To get restaurants website url all yelp restaurant url needs to be crawlled one by one.
```bash
node restaurants-detail.js 0 100
```
Here Skip = 0, limit = 100
It will record `link` and `linkText` in above document from 0th document to 100th.
Next time increase skip and limit value.


kindly refer original website [Yelp](https://www.yelp.com/). Type area name in Near Text box.