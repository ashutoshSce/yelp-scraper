const { to } = require('await-to-js');
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;

const config = require('../../config');
const restaurant = require('../models/restaurant.model');

const get = async (req, res) => {
  if (req.query.exportExcel !== undefined && req.query.exportExcel === '1') {
    res.status(200).json(req.url);
    return;
  }

  const sort = {};
  const where = {};
  const csvHeaderFields = [];
  let filterMap = {};
  let intervalMap = {};
  let skip = 0;
  let limit = 0;
  const select = {
    _id: 0
  };

  let count;
  let filtered;

  const keysList = Object.keys(restaurant.schema.paths);

  // calculations of skip and limit
  if (req.query.meta !== undefined) {
    const meta = JSON.parse(req.query.meta);
    skip = parseInt(meta.start, 10);
    limit = parseInt(meta.length, 10);
    if (Number.isNaN(skip) || skip < 0) {
      skip = 0;
    }
    if (Number.isNaN(limit) || limit === 0 || limit > config.pagination.max_size) {
      limit = config.pagination.size;
    }
  } else {
    skip = 0;
    limit = config.pagination.size;
  }

  if (req.query.filters !== undefined) {
    filterMap = JSON.parse(req.query.filters);
  }

  if (req.query.intervals !== undefined) {
    intervalMap = JSON.parse(req.query.intervals);
  }

  // calculations of sorting, filter and intervals condition
  req.query.columns.forEach(column => {
    const detail = JSON.parse(column);
    if (keysList.includes(detail.name)) {
      if (detail.meta.visible) {
        csvHeaderFields.push(detail.name);
        select[detail.name] = 1;
      }

      if (detail.meta.sort !== null) {
        sort[detail.name] = detail.meta.sort === 'ASC' ? 1 : -1;
      }

      if (
        filterMap[detail.name] !== undefined &&
        detail.meta.array &&
        filterMap[detail.name].length
      ) {
        where[detail.name] = {
          $in: filterMap[detail.name]
        };
      }

      let isInterval = false;
      if (intervalMap[detail.name] !== undefined) {
        where[detail.name] = {
          $gte: '',
          $lte: ''
        };

        if (intervalMap[detail.name].min !== undefined && intervalMap[detail.name].min !== null) {
          let value = intervalMap[detail.name].min;
          if (detail.meta.date) {
            value = new Date(
              intervalMap[detail.name].min
                .split('-')
                .reverse()
                .join('-')
            );
          }
          where[detail.name].$gte = value;
          isInterval = true;
        } else {
          delete where[detail.name].$gte;
        }

        if (intervalMap[detail.name].max !== undefined && intervalMap[detail.name].max !== null) {
          let value = intervalMap[detail.name].max;
          if (detail.meta.date) {
            value = new Date(
              intervalMap[detail.name].max
                .split('-')
                .reverse()
                .join('-')
            );
          }
          where[detail.name].$lte = value;
          isInterval = true;
        } else {
          delete where[detail.name].$lte;
        }

        if (!isInterval) {
          delete where[detail.name];
        }
      }
    }
  });

  if (req.query.exportExcel === undefined) {
    [, count] = await to(restaurant.countDocuments());
    [, filtered] = await to(restaurant.countDocuments(where));
    select.businessUrl = 1;
    select.linkText = 1;
    select.location = 1;
  } else {
    skip = 0;
    limit = 0;
  }

  const [, restaurantList] = await to(
    restaurant
      .find(where)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
  );

  for (let index = 0; index < restaurantList.length; index += 1) {
    if (restaurantList[index].localities !== undefined) {
      restaurantList[index].localities = restaurantList[index].localities.join(', ');
    }

    if (restaurantList[index].categories !== undefined) {
      restaurantList[index].categories = restaurantList[index].categories.join(', ');
    }

    if (restaurantList[index].neighborhoods !== undefined) {
      restaurantList[index].neighborhoods = restaurantList[index].neighborhoods.join(', ');
    }

    if (restaurantList[index].address !== undefined) {
      restaurantList[index].address = restaurantList[index].address.join(', ');
    }

    if (req.query.exportExcel === undefined) {
      restaurantList[index].dtRowId = index + 1;

      restaurantList[index].name = `<a href="https://www.yelp.com${
        restaurantList[index].businessUrl
      }" target="_blank">${restaurantList[index].name}</a>`;

      if (restaurantList[index].linkText === undefined) {
        restaurantList[index].link = '';
      } else {
        restaurantList[index].link = `<a href="${restaurantList[index].link}" target="_blank">${
          restaurantList[index].linkText
        }</a>`;
      }

      if (
        restaurantList[index].location !== undefined &&
        restaurantList[index].location.latitude !== undefined
      ) {
        restaurantList[index].address = `<a href="https://www.latlong.net/c/?lat=${
          restaurantList[index].location.latitude
        }&long=${restaurantList[index].location.longitude}" target="_blank">${
          restaurantList[index].address
        }</a>`;
      }
    }
  }

  if (req.query.exportExcel !== undefined) {
    const json2csvParser = new Json2csvParser({
      csvHeaderFields
    });
    const csv = json2csvParser.parse(restaurantList);
    const path = `./logs/${Date.now()}.csv`;
    fs.writeFile(path, csv, e => {
      if (e) {
        throw e;
      } else {
        res.download(path);
      }
    });
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      data: restaurantList,
      filtered,
      count,
      filters: count !== filtered,
      fullRecordInfo: true
    });
  }
};

module.exports.get = get;
