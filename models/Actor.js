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
    fakepic: String,
    picture: String

  },
  
  study2_n0_p0: String,
  study2_n0_p20: String,
  study2_n0_p80: String,
  study2_n20_p0: String,
  study2_n20_p20: String,
  study2_n20_p80: String,
  study2_n80_p0: String,
  study2_n80_p20: String,
  study2_n80_p80: String,

  study3_n20_p60: String,
  study_n80_p60: String
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
