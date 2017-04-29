const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
  class: String, //normal, bully, victim 
  username: String,
  profile: {
    name: String,
    gender: String,
    age: Number,
    location: String,
    bio: String,
    picture: String
  }
}, { timestamps: true });


const Actor = mongoose.model('Actor', actorSchema);

module.exports = Actor;
