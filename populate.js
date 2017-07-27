#! /usr/bin/env node

console.log('This script is running!!!!');


var async = require('async')
var Actor = require('./models/Actor.js');
var Script = require('./models/Script.js');
const _ = require('lodash');
const dotenv = require('dotenv');
var mongoose = require('mongoose');
var fs = require('fs')


var highUsers = require('./highusers.json');
var actors1 = require('./actorsv1.json');
var posts1 = require('./postsv1.json');
var post_reply1 = require('./post_replyv1.json');
var actorReply = require('./actorReply.json');
var notify = require('./notify.json');
var dd = require('./upload_post_replyv1.json');

dotenv.load({ path: '.env' });

var MongoClient = require('mongodb').MongoClient
 , assert = require('assert');


//var connection = mongo.connect('mongodb://127.0.0.1/test');
mongoose.connect(process.env.PRO_MONGODB_URI || process.env.PRO_MONGOLAB_URI);
var db = mongoose.connection;
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});



String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function timeStringToNum (v) {
  var timeParts = v.split(":");
  return parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
}

function getLikes() {
  var notRandomNumbers = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
  var idx = Math.floor(Math.random() * notRandomNumbers.length);
  return notRandomNumbers[idx];
}

function getReads(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
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

function ActorCreate(actor1) {
  actordetail = {};
  actordetail.profile = {};

  actordetail.profile.name = actor1.name
  actordetail.profile.gender = actor1.gender;
  actordetail.profile.location = actor1.location;
  actordetail.profile.picture = actor1.picture;
  actordetail.profile.bio = actor1.bio;
  actordetail.profile.age = actor1.age;
  actordetail.class = actor1.class;
  actordetail.username = actor1.username;
  

  
  var actor = new Actor(actordetail);
       
  actor.save(function (err) {
    if (err) {
      console.log("Something went wrong!!!")
      return -1;
    }
    console.log('New Actor: ' + actor.username);
  });

}

function PostCreate(new_post) {
  
  Actor.findOne({ username: new_post.actor}, (err, act) => {
    if (err) { console.log(err); return next(err); }

    console.log('Looking up Actor ID is : ' + act._id); 
    var postdetail = new Object();
    postdetail.actor = {};
    postdetail.body = new_post.body
    postdetail.post_id = new_post.id;
    postdetail.class = new_post.class;
    postdetail.picture = new_post.picture;
    postdetail.likes = getLikes();
    postdetail.lowread = getReads(6,20);
    postdetail.highread = getReads(145,203);
    postdetail.actor.$oid = act._id.toString();
    //postdetail.actor=`${act._id}`;
    //postdetail.actor2=act;
    postdetail.time = timeStringToNum(new_post.time);

    console.log('Looking up Actor: ' + act.username); 
    //console.log(mongoose.Types.ObjectId.isValid(postdetail.actor.$oid));
    //console.log(postdetail);

    fs.appendFileSync('upload_postsv1.json', JSON.stringify(postdetail));


  });

};
function PostReplyCreateFinal(new_post){

Script.findOne({ post_id: new_post.replyID}, function(err, pr){
      if(err) {
        console.log(err);
        return
      }

      console.log('In SCRIPT');
      console.log('In Reply: ' + pr._id);

      //console.log('Looking up Actor ID is : ' + act._id); 
      var postdetail = new Object();
      postdetail.actor = {};
      postdetail.reply = {};
      postdetail.body = new_post.body
      postdetail.post_id = new_post.id;
      postdetail.class = new_post.class;
      postdetail.picture = new_post.picture;
      postdetail.likes = new_post.likes;
      postdetail.lowread = new_post.lowread;
      postdetail.highread = new_post.highread;
      postdetail.actor.$oid = new_post.actor.$oid;
      postdetail.reply.$oid = pr._id.toString();
      
      postdetail.time = new_post.time;

      fs.appendFileSync('upload_post_replyv2.json', JSON.stringify(postdetail));

      
    });


}

function PostReplyCreate(new_post) {

   Actor.findOne({ username: new_post.actor}, function(err, act){
    if(err) {
      console.log(err);
      return
    }
    console.log('Looking up Actor: ' + act.username); 
    console.log('Try for post: ' + new_post.reply);
    var postdetail = new Object();
    postdetail.actor = {};
    postdetail.replyID = new_post.reply;
    postdetail.body = new_post.body
    postdetail.post_id = 300 + new_post.id;
    postdetail.class = new_post.class;
    postdetail.picture = new_post.picture;
    postdetail.likes = getLikes();
    postdetail.lowread = getReads(6,20);
    postdetail.highread = getReads(145,203);
    postdetail.actor.$oid = act._id.toString();
    //postdetail.reply.$oid = pr._id.toString();
    console.log('Time is now: ' + new_post.time);
    postdetail.time = timeStringToNum(new_post.time);
    fs.appendFileSync('upload_post_replyv0.json', JSON.stringify(postdetail));
  });
    
    

};

function NotifyCreate(new_notify) {
  
  Actor.findOne({ username: new_notify.actor}, (err, act) => {
    if (err) { console.log(err); return next(err); }

    console.log('Looking up Actor ID is : ' + act._id); 
    var notifydetail = new Object();

    if (new_notify.userPost >= 0 && !(new_notify.userPost === ""))
    {
      notifydetail.userPost = new_notify.userPost;
      console.log('User Post is : ' + notifydetail.userPost);
    }

    else if (new_notify.userReply >= 0 && !(new_notify.userReply === ""))
    {
      notifydetail.userReply = new_notify.userReply;
      console.log('User Reply is : ' + notifydetail.userReply);
    }

    else if (new_notify.actorReply >= 0 && !(new_notify.actorReply === ""))
    {
      notifydetail.actorReply = new_notify.actorReply;
      console.log('Actor Reply is : ' + notifydetail.actorReply);
    }

    notifydetail.actor = {};
    notifydetail.notificationType = new_notify.type;
    notifydetail.actor.$oid = act._id.toString();
    notifydetail.time = timeStringToNum(new_notify.time);

    //console.log('Looking up Actor: ' + act.username); 
    //console.log(mongoose.Types.ObjectId.isValid(notifydetail.actor.$oid));
    //console.log(notifydetail);

    fs.appendFileSync('upload_replyv2.json', JSON.stringify(notifydetail));

  });

};

function actorNotifyCreate(new_notify) {
  
  Actor.findOne({ username: new_notify.actor}, (err, act) => {
    if (err) { console.log(err); return next(err); }

    console.log('Looking up Actor ID is : ' + act._id); 
    var notifydetail = new Object();
    notifydetail.userPost = new_notify.userPostId;
    notifydetail.actor = {};
    notifydetail.notificationType = 'reply';
    notifydetail.replyBody = new_notify.body;
    notifydetail.actor.$oid = act._id.toString();
    notifydetail.time = timeStringToNum(new_notify.time);

    //console.log('Looking up Actor: ' + act.username); 
    //console.log(mongoose.Types.ObjectId.isValid(notifydetail.actor.$oid));
    //console.log(notifydetail);

    fs.appendFileSync('upload_actorReplyV2.json', JSON.stringify(notifydetail));

  });

};
/*
for (var i = 0, len = actors1.length; i < len; i++) {
  
      console.log("@@@Looking at "+actors1[i].username);
      ActorCreate(actors1[i]);

}
/*
for (var i = 0, len = highUsers.results.length; i < len; i++) {
  
      highActorCreate(highUsers.results[i]);
}

for (var i = 0, len = notify.length; i < len; i++) {
      
      NotifyCreate(notify[i]);
}
for (var i = 0, len = posts1.length; i < len; i++) {
      
      PostCreate(posts1[i]);
}
for (var i = 0, len = post_reply1.length; i < len; i++) {
      
      PostReplyCreate(post_reply1[i]);
}

for (var i = 0, len = dd.length; i < len; i++) {
      
      PostReplyCreateFinal(dd[i]);
}
for (var i = 0, len = actorReply.length; i < len; i++) {
      
      actorNotifyCreate(actorReply[i]);
}
*/


for (var i = 0, len = actorReply.length; i < len; i++) {
      
      actorNotifyCreate(actorReply[i]);
}

//PostReplyCreate(posts1[0]);
//PostCreate(posts1[1]);
//actorNotifyCreate(actorReply[i]);
console.log('After Lookup:');




    //All done, disconnect from database
    mongoose.connection.close();
