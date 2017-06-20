const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
  class: String, //normal, bully, victim, highread,cohort
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

//Pretty sure this is dead code
actorSchema
.virtual('url')
.get(function () {

  //var diff = Date.now() - this.time;
  return '/user/' + this.username;
});

const Actor = mongoose.model('Actor', actorSchema);

module.exports = Actor;
