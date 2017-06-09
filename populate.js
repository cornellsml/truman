#! /usr/bin/env node

console.log('This script is running!!!!');


var async = require('async')
const _ = require('lodash');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.load({ path: '.env' });

const Actor = require('./models/Actor.js');
const Script = require('./models/Script.js');
var highUsers = require('./highusers.json');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

//var db = mongoose.connection;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function highActorCreate(random_actor) {
  actordetail = {};
  actordetail.profile = {};

  actordetail.profile.name = random_actor.name.first.capitalize() +' '+random_actor.name.last.capitalize();
  actordetail.profile.gender = random_actor.gender;
  actordetail.profile.location = random_actor.location.city.capitalize() +', '+random_actor.location.state.capitalize();
  actordetail.profile.picture = random_actor.picture.large;
  actordetail.class = 'high_read';
  actordetail.username = random_actor.login.username;
  

  
  var actor = new Actor(actordetail);
       
  actor.save(function (err) {
    if (err) {
      console.log("Something went wrong!!!")
      return -1;
    }
    console.log('New high Actor: ' + actor.username);
  });

}

for (var i = 1, len = highUsers.results.length; i < len; i++) {
  highActorCreate(highUsers.results[i]);

}


    //All done, disconnect from database
    mongoose.connection.close();
