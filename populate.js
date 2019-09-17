#! /usr/bin/env node

console.log('Started data loading script !!');


var async = require('async')
var Actor = require('./models/Actor.js');
var Script = require('./models/Script.js');
var Notification = require('./models/Notification.js');
const _ = require('lodash');
const dotenv = require('dotenv');
var mongoose = require('mongoose');
var fs = require('fs')
const CSVToJSON = require("csvtojson");
//input files
/********
TODO:
Use CSV files instead of json files
use a CSV file reader and use that as input
********/
var actors_list
var posts_list
var comment_list
var notification_list
var notification_reply_list

dotenv.config({ path: '.env' });

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');


//var connection = mongo.connect('mongodb://127.0.0.1/test');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, { useNewUrlParser: true });
var db = mongoose.connection;
mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
    process.exit(1);
});

/*
This is a huge function of chained promises, done to achieve serial completion of asynchronous actions.
There's probably a better way to do this, but this worked.
*/
async function doPopulate() {
  /****
  Dropping collections
  ****/
  let promise = new Promise((resolve, reject) => { //Drop the actors collection
    console.log("Dropping actors...");
    db.collections['actors'].drop(function (err) {
        console.log('actors collection dropped');
        resolve("done");
      });
    }).then(function(result){ //Drop the scripts collection
      return new Promise((resolve, reject) => {
        console.log("Dropping scripts...");
        db.collections['scripts'].drop(function (err) {
            console.log('scripts collection dropped');
            resolve("done");
          });
      });
    }).then(function(result){ //Drop the notifications collection
      return new Promise((resolve, reject) => {
        console.log("Dropping notifications...");
        db.collections['notifications'].drop(function (err) {
            console.log('notifications collection dropped');
            resolve("done");
          });
      });
    /***
    Converting CSV files to JSON
    ***/
    }).then(function(result){ //Convert the actors csv file to json, store in actors_list
      return new Promise((resolve, reject) => {
        console.log("Reading actors list...");
        CSVToJSON().fromFile('./input/actors.csv').then(function(json_array){
          actors_list = json_array;
          console.log("Finished getting the actors_list");
          resolve("done");
        });
      });
    }).then(function(result){ //Convert the posts csv file to json, store in posts_list
      return new Promise((resolve, reject) => {
        console.log("Reading posts list...");
        CSVToJSON().fromFile('./input/posts.csv').then(function(json_array){
          posts_list = json_array;
          console.log("Finished getting the posts list");
          resolve("done");
        });
      });
    }).then(function(result){ //Convert the comments csv file to json, store in comment_list
      return new Promise((resolve, reject) => {
        console.log("Reading comment list...");
        CSVToJSON().fromFile('./input/replies.csv').then(function(json_array){
          comment_list = json_array;
          console.log("Finished getting the comment list");
          resolve("done");
        });
      });
    }).then(function(result){ //Convert the comments csv file to json, store in comment_list\
      return new Promise((resolve, reject) => {
        console.log("Reading notification list...");
        CSVToJSON().fromFile('./input/notifications.csv').then(function(json_array){
          notification_list = json_array;
          console.log("Finished getting the notification list");
          resolve("done");
        });
      });
    }).then(function(result){ //Convert the notification reply csv file to json, store in comment_list\
      return new Promise((resolve, reject) => {
        console.log("Reading notification reply list...");
        CSVToJSON().fromFile('./input/actor_replies.csv').then(function(json_array){
          notification_reply_list = json_array;
          console.log("Finished getting the notification reply list");
          resolve("done");
        });
      });
    /*************************
    Create all the Actors in the simulation
    Must be done before creating any other instances
    *************************/
  }).then(function(result){
        console.log("starting to populate actors...");
        return new Promise((resolve, reject) => {
          async.each(actors_list, function (actor_raw, callback) {
              actordetail = {};
              actordetail.profile = {};

              actordetail.profile.name = actor_raw.name
              actordetail.profile.location = actor_raw.location;
              actordetail.profile.picture = actor_raw.picture;
              actordetail.profile.bio = actor_raw.bio;
              actordetail.profile.age = actor_raw.age;
              actordetail.class = actor_raw.class;
              actordetail.username = actor_raw.username;

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
          function (err) {
              //return response
              console.log("All DONE WITH ACTORS!!!")
              resolve("done");
              return 'Loaded Actors'
          }
        );
      });
    /*************************
    Create each post and upload it to the DB
    Actors must be in DB first to add them correctly to the post
    *************************/
    }).then(function(result){
          console.log("starting to populate posts...");
          return new Promise((resolve, reject) => {
            async.each(posts_list, function (new_post, callback) {
                Actor.findOne({ username: new_post.actor }, (err, act) => {
                    if (err) { console.log("createPostInstances error"); console.log(err); return; }
                    if (act) {
                        var postdetail = new Object();

                        postdetail.likes =  getLikes();
                        postdetail.experiment_group = new_post.experiment_group
                        postdetail.post_id = new_post.id;
                        postdetail.body = new_post.body;
                        postdetail.class = new_post.class;
                        postdetail.picture = new_post.picture;
                        postdetail.lowread = getReads(6, 20);
                        postdetail.highread = getReads(145, 203);
                        postdetail.actor = act;
                        postdetail.time = timeStringToNum(new_post.time);

                        var script = new Script(postdetail);
                        script.save(function (err) {
                            if (err) {
                                console.log("Something went wrong in Saving POST!!!");
                                callback(err);
                            }
                            console.log('Saved New Post: ' + script.id);
                            callback();
                        });
                    }
                    else {
                        //Else no ACTOR Found
                        console.log("No Actor Found!!!");
                        callback();
                    }
                });
              },
              function (err) {
                  if (err) {
                      console.log("END IS WRONG!!!");
                      callback(err);
                  }
                  //return response
                  console.log("All DONE WITH POSTS!!!")
                  resolve("done");
                  return 'Loaded Posts'
              }
            );
        });
    /*************************
    actorNotifyInstances:
    Creates each post and uploads it to the DB
    Actors must be in DB first to add them correctly to the post
    *************************/
    }).then(function(result){
      console.log("starting to do actor notify instances...");
      return new Promise((resolve, reject) => {
        async.each(notification_reply_list, function (new_notify, callback) {
            Actor.findOne({ username: new_notify.actor }, (err, act) => {
                if (err) { console.log("actorNotifyInstances error"); console.log(err); return; }
                // console.log("start post for: "+new_post.id);
                if (act) {
                    //console.log('Looking up Actor ID is : ' + act._id);
                    var notifydetail = new Object();
                    notifydetail.userPost = new_notify.userPostId;
                    notifydetail.actor = act;
                    notifydetail.notificationType = 'reply';
                    notifydetail.replyBody = new_notify.body;
                    notifydetail.time = timeStringToNum(new_notify.time);

                    var notify = new Notification(notifydetail);
                    notify.save(function (err) {
                        if (err) {
                            console.log("Something went wrong in Saving Notify Actor reply!!!");
                            // console.log(err);
                            callback(err);
                        }
                        //console.log('Saved New Post: ' + script.id);
                        console.log("saved a post");
                        callback();
                    });
                }//if ACT

                else {
                    //Else no ACTOR Found
                    console.log("No Actor Found!!!");
                    callback();
                }
                // console.log("BOTTOM OF SAVE");
            });
          },
              function (err) {
                  if (err) {
                      console.log("END IS WRONG!!!");
                      // console.log(err);
                      callback(err);
                  }
                  //return response
                  console.log("All DONE WITH Notification Actor Replies!!!")
                  resolve("done");
                  return 'Loaded Notification Actor Replies'
                  //mongoose.connection.close();
              }
          );
      });
  /*************************
  createNotificationInstances:
  Creates each post and uploads it to the DB
  Actors must be in DB first to add them correctly to the post
  *************************/
  }).then(function(result){
    console.log("starting notifiction instances...");
    return new Promise((resolve, reject) => {
      async.each(notification_list, function (new_notify, callback) {
          Actor.findOne({ username: new_notify.actor }, (err, act) => {
              if (err) { console.log("createNotificationInstances error"); console.log(err); return; }
              // console.log("start post for: "+new_notify.id);
              if (act) {

                  var notifydetail = new Object();

                  if (new_notify.userPost >= 0 && !(new_notify.userPost === ""))
                  {
                    notifydetail.userPost = new_notify.userPost;
                    //console.log('User Post is : ' + notifydetail.userPost);
                  }

                  else if (new_notify.userReply >= 0 && !(new_notify.userReply === ""))
                  {
                    notifydetail.userReply = new_notify.userReply;
                    //console.log('User Reply is : ' + notifydetail.userReply);
                  }

                  else if (new_notify.actorReply >= 0 && !(new_notify.actorReply === ""))
                  {
                    notifydetail.actorReply = new_notify.actorReply;
                    //console.log('Actor Reply is : ' + notifydetail.actorReply);
                  }

                  notifydetail.actor = act;
                  notifydetail.notificationType = new_notify.type;
                  notifydetail.time = timeStringToNum(new_notify.time);

                  var notify = new Notification(notifydetail);
                  notify.save(function (err) {
                      if (err) {
                          console.log("Something went wrong in Saving Notify!!!");
                          // console.log(err);
                          callback(err);
                      }
                       //console.log('Saved New Post: ' + script.id);
                       console.log("saved a post");
                      callback();
                  });
              }//if ACT

              else {
                  //Else no ACTOR Found
                  console.log("No Actor Found!!!");
                  callback();
              }
              // console.log("BOTTOM OF SAVE");
          });
        },
            function (err) {
                if (err) {
                    console.log("END IS WRONG!!!");
                    // console.log(err);
                    callback(err);
                }
                //return response
                console.log("All DONE WITH Notification!!!");
                resolve("done");
                return 'Loaded Notification'

                //mongoose.connection.close();
            }
      );
    });
  /*************************
  createPostRepliesInstances:
  Creates inline comments for each post
  Looks up actors and posts to insert the correct comment
  Does this in series to insure comments are put in, in correct order
  Takes a while because of this
  *************************/
  }).then(function(result){
      console.log("starting post replies instances...");
      return new Promise((resolve, reject) => {
        async.eachSeries(comment_list, function (new_replies, callback) {

            Actor.findOne({ username: new_replies.actor }, (err, act) => {

                if (act) {
                    Script.findOne({ post_id: new_replies.reply }, function (err, pr) {
                        if (pr) {
                            var comment_detail = new Object();

                            comment_detail.body = new_replies.body
                            comment_detail.commentID = new_replies.id;
                            comment_detail.class = new_replies.class;
                            comment_detail.module = new_replies.module;
                            comment_detail.likes = getLikesComment();
                            comment_detail.time = timeStringToNum(new_replies.time);
                            comment_detail.actor = act;
                            pr.comments.push(comment_detail);
                            pr.comments.sort(function (a, b) { return a.time - b.time; });

                            pr.save(function (err) {
                                if (err) {
                                    console.log("@@@@@@@@@@@@@@@@Something went wrong in Saving COMMENT!!!");
                                    console.log("Error IN: " + new_replies.id);
                                    callback(err);
                                }
                                console.log('Added new Comment to Post: ' + pr.id);
                                callback();
                            });
                        }
                        else {
                            //Else no ACTOR Found
                            console.log("############Error IN: " + new_replies.id);
                            console.log("No POST Found!!!");
                            callback();
                        }
                    });
                  }

                  else {
                      //Else no ACTOR Found
                      console.log("****************Error IN: " + new_replies.id);
                      console.log("No Actor Found!!!");
                      callback();
                  }
            });
        },
            function (err) {
                if (err) {
                    console.log("END IS WRONG!!!");
                    console.log(err);
                    callback(err);
                }
                //return response
                console.log("All DONE WITH REPLIES/Comments!!!")
                mongoose.connection.close();
                resolve("done");
                return 'Loaded Post Replies/Comments'

            }
        );

      });
  });
//Done!
}

//capitalize a string
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

//usuful when adding comments to ensure they are always in the correct order
//(based on the time of the comments)
function insert_order(element, array) {
    array.push(element);
    array.sort(function (a, b) {
        return a.time - b.time;
    });
    return array;
}

//Transforms a time like -12:32 (minus 12 minutes and 32 seconds)
//into a time in milliseconds
function timeStringToNum(v) {
    var timeParts = v.split(":");
    if (timeParts[0] == "-0")
        return -1 * parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
    else if (timeParts[0].startsWith('-'))
        return parseInt(((timeParts[0] * (60000 * 60)) + (-1 * (timeParts[1] * 60000))), 10);
    else
        return parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
};

//create a radom number (for likes) with a weighted distrubution
//this is for posts
function getLikes() {
    var notRandomNumbers = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
    var idx = Math.floor(Math.random() * notRandomNumbers.length);
    return notRandomNumbers[idx];
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//create a radom number (for likes) with a weighted distrubution
//this is for comments
function getLikesComment() {
    var notRandomNumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4];
    var idx = Math.floor(Math.random() * notRandomNumbers.length);
    return notRandomNumbers[idx];
}

//Create a random number between two values (like when a post needs a number of times it has been read)
function getReads(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

//Call the function with the long chain of promises
doPopulate();
