#! /usr/bin/env node

console.log('This script is running!!!!');

const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
var async = require('async')
var Actor = require('./models/Actor.js');
var Script = require('./models/Script.js');
var Notification = require('./models/Notification.js');
const _ = require('lodash');
const dotenv = require('dotenv');
var mongoose = require('mongoose');
var fs = require('fs')

var actors_list = require('./input/actors.json');
var posts_list = require('./input/posts.json');
var comment_list = require('./input/comments.json');

var replies_list = require('./input/replies.json');
var notifications_list = require('./input/notifications.json');

dotenv.load({ path: '.env' });

var MongoClient = require('mongodb').MongoClient
 , assert = require('assert');


//var connection = mongo.connect('mongodb://127.0.0.1/test');
mongoose.connect(process.env.MONGOLAB_TEST);
var db = mongoose.connection;
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});



String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function insert_order(element, array) {
  array.push(element);
  array.sort(function(a, b) {
    return a.time - b.time;
  });
  return array;
}

function timeStringToNum (v) {
  var timeParts = v.split(":");
  if (timeParts[0] =="-0")
    return -1*parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
  else if (timeParts[0].startsWith('-'))
    return parseInt( ((timeParts[0] * (60000 * 60)) + (-1*(timeParts[1] * 60000))), 10);
  else
    return parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
};

function getLikes() {
  var notRandomNumbers = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
  var idx = Math.floor(Math.random() * notRandomNumbers.length);
  return notRandomNumbers[idx];
}

function  randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getLikesComment() {
  var notRandomNumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4];
  var idx = Math.floor(Math.random() * notRandomNumbers.length);
  return notRandomNumbers[idx];
}

function getReads(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}


function createActorInstances() {
  async.each(actors_list, function(actor_raw, callback) {

    actordetail = {};
    actordetail.profile = {};

    actordetail.profile.name = actor_raw.name
    actordetail.profile.gender = actor_raw.gender;
    actordetail.profile.location = actor_raw.location;
    actordetail.profile.picture = actor_raw.picture;
    actordetail.profile.bio = actor_raw.bio;
    actordetail.profile.age = actor_raw.age;
    actordetail.class = actor_raw.class;
    actordetail.username = actor_raw.username;

    actordetail.study2_n0_p0 = actor_raw.study2_n0_p0;
    actordetail.study2_n0_p20 = actor_raw.study2_n0_p20;
    actordetail.study2_n0_p80 = actor_raw.study2_n0_p80;
    actordetail.study2_n20_p0 = actor_raw.study2_n20_p0;
    actordetail.study2_n20_p20 = actor_raw.study2_n20_p20;
    actordetail.study2_n20_p80 = actor_raw.study2_n20_p80;
    actordetail.study2_n80_p0 = actor_raw.study2_n80_p0;
    actordetail.study2_n80_p20 = actor_raw.study2_n80_p20;
    actordetail.study2_n80_p80 = actor_raw.study2_n80_p80;

    actordetail.study3_n20_p60 = actor_raw.study3_n20_p60;
    actordetail.study_n80_p60 = actor_raw.study_n80_p60;

    var md5 = crypto.createHash('md5').update(actor_raw.username).digest('hex');
    actordetail.profile.fakepic = `https://gravatar.com/avatar/${md5}?s=200&d=retro`;

    
    var actor = new Actor(actordetail);
         
    actor.save(function (err) {
      if (err) {
        console.log("Something went wrong!!!");
        return -1;
      }
      console.log('New Actor: ' + actor.username);
      callback();
    });

    },
    function(err){
      //return response
      console.log("All DONE!!!")
    }
  );
}

function createPostInstances() {
  async.each(posts_list, function(new_post, callback) {

    Actor.findOne({ username: new_post.actor}, (err, act) => {
        if (err) { console.log("createPostInstances"); console.log(err); return; }
        console.log("start post for: "+new_post.id);

        if(act)
        {
          console.log('Looking up Actor username is : ' + act.username); 
          var postdetail = new Object();

          //postdetail.module = new_post.module;
          postdetail.body = new_post.body

          //postdetail.module = new_post.module;
          //postdetail.likes = new_post.likes || getLikes();

          //only for likes posts
          postdetail.post_id = new_post.id;

          postdetail.class = new_post.class;
          postdetail.picture = new_post.picture;
          postdetail.likes = getLikes();
          //postdetail.likes = getLikes();
          postdetail.lowread = getReads(6,20);
          postdetail.highread = getReads(145,203);
          postdetail.actor = act;
          postdetail.time = timeStringToNum(new_post.time);

          postdetail.study3_n20 = new_post.study3_n20;
          postdetail.study3_n80 = new_post.study3_n80;
          postdetail.study2_n0 = new_post.study2_n0;
          postdetail.study2_n20 = new_post.study2_n20;
          postdetail.study2_n80 = new_post.study2_n80;

          postdetail.study3_n20 = new_post.study3_n20;
          postdetail.study3_n80 = new_post.study3_n80;

          //console.log('Looking up Actor: ' + act.username); 
          //console.log(mongoose.Types.ObjectId.isValid(postdetail.actor.$oid));
          //console.log(postdetail);
          
          var script = new Script(postdetail);

          script.save(function (err) {
          if (err) {
            console.log("Something went wrong in Saving POST!!!");
            console.log(err);
            callback(err);
          }
          console.log('Saved New Post: ' + script.id);
          callback();
        });
      }//if ACT

      else
      {
        //Else no ACTOR Found
        console.log("No Actor Found!!!");
        callback();
      }
      console.log("BOTTOM OF SAVE");

      });
    },
      function(err){
        if (err) {
          console.log("END IS WRONG!!!");
          console.log(err);
          callback(err);
        }
        //return response
        console.log("All DONE WITH POSTS!!!")
        //mongoose.connection.close();
      }
  );
}

function NotifyCreate() {
  
  async.each(notifications_list, function(new_notify, callback) {

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

      notifydetail.actor = act;
      notifydetail.notificationType = new_notify.type;
      notifydetail.time = timeStringToNum(new_notify.time);

      var notify = new Notification(notifydetail);

      notify.save(function (err) {
          if (err) {
            console.log("Something went wrong in Saving Notify!!!");
            console.log(err);
             callback(err);
          }
          console.log('Saved New Notification: ' + notify.id);
          callback();
        });   

    });

  },
    function(err){
      if (err) {
        console.log("END Of NOTIFICATION IS WRONG!!!");
        console.log(err);
         callback(err);
      }
      //return response
      console.log("All DONE WITH Notifications!!!")
      //mongoose.connection.close();
    }
  );

};



function actorNotifyCreate() {

  async.each(replies_list, function(new_notify, callback) {
    Actor.findOne({ username: new_notify.actor}, (err, act) => {
      if (err) { console.log(err); return next(err); }

      console.log('Looking up Actor ID is : ' + act._id); 
      var notifydetail = new Object();
      notifydetail.userPost = new_notify.userPostId;
      notifydetail.actor = act;
      notifydetail.notificationType = 'reply';
      notifydetail.replyBody = new_notify.body;
      notifydetail.time = timeStringToNum(new_notify.time);

      var notify = new Notification(notifydetail);

      notify.save(function (err) {
          if (err) {
            console.log("Something went wrong in Saving Notify!!!");
            console.log(err);
             callback(err);
          }
          console.log('Saved New User Reply - Notification: ' + notify.id);
          callback();
        });   

    });

  },
    function(err){
      if (err) {
        console.log("END Of ACTOR NOTIFICATION IS WRONG!!!");
        console.log(err);
         callback(err);
      }
      //return response
      console.log("All DONE WITH ACTOR REPLIES!!!")
      //mongoose.connection.close();
    }
  );

};

//replies_list
function createPostRepliesInstances() {
  async.eachSeries(comment_list, function(new_replies, callback) {

    //console.log("start REPLY for: "+new_replies.id);
    Actor.findOne({ username: new_replies.actor}, (err, act) => {

      if(act)
      {
          Script.findOne({ post_id: new_replies.reply}, function(err, pr){

            if(pr){    
        
              //console.log('Looking up Actor ID is : ' + act._id); 
              //console.log('Looking up OP POST ID is : ' + pr._id); 
              var comment_detail = new Object();
              //postdetail.actor = {};
              comment_detail.body = new_replies.body
              comment_detail.commentID = new_replies.id;
              comment_detail.class = new_replies.class;

              //add bullying to top level post
              if(new_replies.class == "bullying")
              {
                console.log('####BULLY COMMENT!');
                pr.class = "bullying";
                comment_detail.likes = 0;
                console.log('Time is of POST is: ' + new_replies.time)
                comment_detail.time = timeStringToNum(new_replies.time);
                console.log('NEW Bully Time is : ' + comment_detail.time);
              }
              else{
                //console.log('####NORMAL COMMENT!');
                comment_detail.likes = getLikesComment();
                //1 hr is 3600000
                //console.log('Time is of POST is: ' + pr.time); 
                let comment_time = pr.time + randomIntFromInterval(300000,3600000)
                //console.log('New Comment time is: ' + comment_time); 
                comment_detail.time = comment_time;
                //console.log('NEW NON BULLY Time is : ' + comment_detail.time);
                
                //console.log('NEW Time is : ' + comment_detail.time);
              }

              //console.log('Adding in Actor: ' + act.username);
              comment_detail.actor = act;

              //pr.comments = insert_order(comment_detail, pr.comments);
              //console.log('Comment'+comment_detail.commentID+' on Post '+pr.post_id+' Length before: ' + pr.comments.length); 
              pr.comments.push(comment_detail);
              pr.comments.sort(function(a, b) {return a.time - b.time;});
              //console.log('Comment'+comment_detail.commentID+' on Post '+pr.post_id+' Length After: ' + pr.comments.length); 
              

               
              
              
              //var script = new Script(postdetail);

              pr.save(function (err) {
              if (err) {
                console.log("@@@@@@@@@@@@@@@@Something went wrong in Saving COMMENT!!!");
                console.log("Error IN: "+new_replies.id);
                console.log('Looking up Actor: ' + act.username);
                console.log('Looking up OP POST ID: ' + pr._id); 
                console.log('Time is : ' + new_replies.time); 
                console.log('NEW Time is : ' + comment_detail.time);
                console.log(err);
                callback(err);
              }
              //console.log('Added new Comment to Post: ' + pr.id);
              callback();
            });
            }// if PR

            else
            {
              //Else no ACTOR Found
              console.log("############Error IN: "+new_replies.id);
              console.log("No POST Found!!!");
              callback();
            }
          });//Script.findOne
      }//if ACT

      else
      {
        //Else no ACTOR Found
        console.log("****************Error IN Comment: "+new_replies.id);
        console.log("No Actor Found!!!");
        console.log("Can't find "+new_replies.actor)
        callback();
      }
      console.log("BoTTom REPLY for: "+new_replies.id);
      console.log("BOTTOM OF SAVE");

      });
    },
      function(err){
        if (err) {
          console.log("END IS WRONG!!!");
          console.log(err);
          callback(err);
        }
        //return response
        console.log("All DONE WITH REPLIES/Comments!!!")
        //mongoose.connection.close();
      }
  );
}


/*async.series([
    createPostInstances,
    createPostRepliesInstances
],
// Optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('ALL DONE - Close now');
        
    }
    // All done, disconnect from database
    mongoose.connection.close();
});*/

//createActorInstances()
//createPostInstances()
//createPostRepliesInstances()
//actorNotifyCreate();
NotifyCreate();


//PostReplyCreate(posts1[0]);
//PostCreate(posts1[1]);
//actorNotifyCreate(actorReply[i]);
console.log('After Lookup:');




    //All done, disconnect from database
    //mongoose.connection.close();
