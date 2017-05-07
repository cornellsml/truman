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

actorSchema
.virtual('time_now')
.get(function () {

  var diff = Date.now() - this.time;
  return '/catalog/author/' + this._id;
});
const Actor = mongoose.model('Actor', actorSchema);

module.exports = Actor;
