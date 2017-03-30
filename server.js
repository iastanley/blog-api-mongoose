'use strict';
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

//overwrite mongoose Promise object with ES6 Promise
mongoose.Promise = global.Promise;

//import
const {PORT, DATABASE_URL} = require('./config.js');
const {Post} = require('./models.js');

const app = express();
app.use(bodyParser.json());

//ROUTES
//get 10 blog posts
app.get('/blog-posts', (req, res) => {
  Post
    .find()
    .limit(10)
    .exec()
    .then(posts => {
      res.status(200).json(posts.map(post => post.apiReturn()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

//get blog post by id
app.get('/blog-posts/:id', (req, res) => {
  Post
    .findById(req.params.id)
    .exec()
    .then(post => res.status(200).json(post.apiReturn()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});
//create blog post
app.post('/blog-posts', (req, res) => {
  //validate required fields
  const requiredFields = ['title', 'content', 'author'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing '${field}' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  Post
    .create({
      title: req.body.title,
      content: req.body.content,
      author: {
        firstName: req.body.author.substr(0, req.body.author.indexOf(' ')),
        lastName: req.body.author.substr(req.body.author.indexOf(' ') + 1)
      }
    })
    .then(post => res.status(201).json(post.apiReturn()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

//update blog post by id
app.put('/blog-posts/:id', (req, res) => {
  //verify req.params.id and req.body.id
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request path id ${req.params.id} `
                  + `and request body id ${req.body.id} `
                  + `do not match`;
    console.error(message);
    res.status(400).json({message: message});
  }
  //object used for update
  const updatesToPost = {};
  const updateFields = ['title', 'content', 'author'];
  //add updated fields to updatesToPost
  updateFields.forEach(field => {
    if(field in req.body) {
      //assumes author will be input as full name
      if (field === 'author') {
        updatesToPost['author'] = {};
        updatesToPost.author.firstName =
          req.body.author.substr(0, req.body.author.indexOf(' '));
        updatesToPost.author.lastName =
          req.body.author.substr(req.body.author.indexOf(' ') + 1);
      } else {
        updatesToPost[field] = req.body[field];
      }

    }
  });

  //update document and return 201 status code
  Post
    .findByIdAndUpdate(req.params.id, {$set: updatesToPost}, {new: true})
    .exec()
    .then(post => res.status(201).json(post.apiReturn()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

//delete blog post by id
app.delete('/blog-posts/:id', (req, res) => {
  Post
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => res.status(204).end())
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    })
});

//catch all other routes
app.use('*', (req, res) => {
  res.status(404).send('URL Not Found');
});

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
