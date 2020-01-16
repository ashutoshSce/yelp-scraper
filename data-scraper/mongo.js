const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT;

module.exports = class Mongo {

  constructor() {
    this.db = {};
    this.client = {};
  }

  connectToDb() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true
      }, (err, client) => {
        if (err) throw err;
        this.client = client;
        this.db = this.client.db(process.env.DB_NAME);
        resolve();
      });
    });
  }

  queryObject(collectionName, query) {
    return new Promise((resolve, reject) => {
      this.db.collection(collectionName).findOne(query, function (err, result) {
        if (err) throw err;
        resolve(result);
      });
    });
  }

  queryObjectOffset(collectionName, skip, limit) {
    return new Promise((resolve, reject) => {
      this.db.collection(collectionName).find().skip(skip).limit(limit).toArray(function (err, result) {
        if (err) throw err;
        resolve(result);
      });
    });
  }

  writeObject(collectionName, obj) {
    obj['createdAt'] = new Date();
    return new Promise((resolve, reject) => {
      this.db.collection(collectionName).insertOne(obj, function (err, result) {
        if (err) throw err;
        resolve();
      });
    });
  }
  
  updateObject(collectionName, obj, query) {
    return new Promise((resolve, reject) => {
      obj['updatedAt'] = new Date();
      this.db.collection(collectionName).updateOne(query, {
        $set: obj
      }, function (err, res) {
        if (err) throw err;
        resolve();
      });
    });
  }

  disconnectToDb() {
    return new Promise((resolve, reject) => {
      this.client.close();
      resolve();
    });
  }

};
