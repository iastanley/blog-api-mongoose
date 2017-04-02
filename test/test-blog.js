'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const {Post} = require('../models.js');
const {app, runServer, closeServer} = require('../server.js');
const {TEST_DATABASE_URL} = require('../config.js');

const should = chai.should();
chai.use(chaiHttp);

//HELPER FUNCTIONS

//seed blog-post data
function seedTestBlogData() {
  console.log('seeding blost post data');
  const seedData = [];
  //push 10 fake blog posts to seedData array
  for(let i=0; i < 10; i++) {
    seedData.push(createPostData());
  }
  return Post.insertMany(seedData);
}

//creates single blog post
function createPostData() {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    }
  }
}

//create apiReturn formatted object
function createPostApiReturn() {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    author: faker.name.firstName() + ' ' + faker.name.lastName()
  }
}

//tear down database
function tearDownDb() {
  console.log('Deleting database');
  //return promise to drop database
  return mongoose.connection.dropDatabase();
}

describe('Blog API', function() {
  before(function() {
    //runServer needs to use the test database rather than real database
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    //seed test-blog-app db with data
    return seedTestBlogData();
  });

  afterEach(function() {
    //tear down test-blog-app db
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  //test for GET requests
  describe('tests for GET requests', function() {
    //test for retrieving all posts
    it('should return all posts', function() {
      return chai.request(app)
        .get('/blog-posts')
        .then(res => {
          res.should.have.status(200);
          Post.count()
            .then(count => {
              res.body.should.have.length.of(count);
            });
        });
    });

    //test for fields returned
    it('should return posts with right fields', function() {
      let testPost;
      return chai.request(app)
        .get('/blog-posts')
        .then(res => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.not.be.empty;
          res.body.forEach(post => {
            post.should.be.a('object');
            post.should.include.keys('id', 'title', 'author', 'content');
          });
          testPost = res.body[0];
          return Post.findById(testPost.id);
        })
        .then(post => {
          //note that db schema doesn't match res body structure
          testPost.id.should.equal(post.id);
          testPost.title.should.equal(post.title);
          testPost.content.should.equal(post.content);
          testPost.author.should.equal(post.fullName);
        });
    });

    //test for retrieving post with specific id
    it('should return post with correct id', function() {
      let postID;
      let testPost;
      return Post
        .findOne()
        .exec()
        .then(post => {
          postID = post.id;
          testPost = post.apiReturn();
          return chai.request(app)
            .get(`/blog-posts/${postID}`)
        })
        .then(res => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.include.keys('id', 'title', 'author', 'content');
          res.body.id.should.equal(postID);
          res.body.should.deep.equal(testPost);
        });
    });
  }); //end of GET tests

  describe('tests for POST requests', function() {
    it('should add a new post', function() {
      //post data sent in same for as apiReturn() gives
      const newPost = createPostApiReturn();
      return chai.request(app)
        .post('/blog-posts')
        .send(newPost)
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys('id', 'title', 'content', 'author');
          res.body.title.should.equal(newPost.title);
          res.body.content.should.equal(newPost.content);
          res.body.author.should.equal(newPost.author);
          return Post
            .findById(res.body.id)
            .exec();
        })
        .then(post => {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.fullName.should.equal(newPost.author);
        });
    });
  }); //end of POST tests

  describe('tests for PUT request', function() {
    it('should update fields', function() {
      const updateData = {
        title: 'The Updated Title',
        content: 'This is the updated content.'
      };

      return Post
        .findOne()
        .exec()
        .then(post => {
          //add id to the updateData object to be used in PUT request
          updateData.id = post.id;
          return chai.request(app)
            .put(`/blog-posts/${post.id}`)
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys('id', 'title', 'content', 'author');
          res.body.id.should.equal(updateData.id);
          res.body.title.should.equal(updateData.title);
          res.body.content.should.equal(updateData.content);
          return Post
            .findById(updateData.id)
            .exec();
        })
        .then(post => {
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
        });
    });
  }); //end of PUT tests

  describe('tests for DELETE request', function() {
    
  }); //end of DELETE tests
  // //test for DELETE request
  // it('should delete post on DELETE', function() {
  //   return chai.request(app)
  //     .get('/blog-posts')
  //     .then(function(res) {
  //       return chai.request(app)
  //         .delete(`/blog-posts/${res.body[0].id}`);
  //     }).then(function(res) {
  //       res.should.have.status(204);
  //     });
  // }); //end of DELETE tests

}); //end of describe
