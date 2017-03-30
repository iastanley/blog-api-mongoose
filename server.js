'use strict';
const express = require('express'),
      mongoose = require('mongoose'),
      bodyParser = require('body-parser');

//overwrite mongoose Promise object with ES6 Promise
mongoose.Promise = global.Promise;

//import
const {PORT, DATABASE_URL} = require('./config.js');
const {Post} = require('./models.js');

const app = express();
app.use(bodyParser.json());

//ROUTES

//STARTING AND STOPPING THE SERVER FUNCTIONS
let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  //return promise that connects database and starts server
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`The server has started. Listening at port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  //return promise that disconnects database and closes server
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

//allow runServer to run only if called directly
if (require.main === module) {
  runServer().catch(err => console.error(err));
}

//export for testing
module.exports = {app, runServer, closeServer};
