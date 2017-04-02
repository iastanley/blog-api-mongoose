const mongoose = require('mongoose');

//set up schema for a blog post
const postSchema = mongoose.Schema({
  title: String,
  content: String,
  author: {
    firstName: String,
    lastName: String
  }
});

//create a virtual property for fullName
postSchema.virtual('fullName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`;
});

//instance method for return format for API
postSchema.methods.apiReturn = function() {
  return {
    id: this.id,
    title: this.title,
    author: this.fullName,
    content: this.content
  }
}

//create the model for the database
const Post = mongoose.model('Post', postSchema);

//export the model
module.exports = {Post};
