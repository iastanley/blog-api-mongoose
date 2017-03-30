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

function runServer() {
  //return promise that connects database and starts server
}

function closeServer() {
  //return promise that disconnects database and closes server
}

//allow runServer to run only if called directly
if (require.main === module) {
  runServer().catch(err => console.error(err));
}

//export for testing
module.exports = {app, runServer, closeServer};
