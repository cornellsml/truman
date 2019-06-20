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
async function readData() {
    try {        
        //synchronously read all csv files and convert them to JSON
        await console.log("Start reading data from .csv files")
         actors_list = await CSVToJSON().fromFile('./input/actors.csv');
         posts_list = await CSVToJSON().fromFile('./input/posts.csv');
         comment_list = await CSVToJSON().fromFile('./input/replies.csv');
         notification_list = await CSVToJSON().fromFile('./input/notifications.csv');
         notification_reply_list = await CSVToJSON().fromFile('./input/actor_replies.csv');

        //synchronously write all converted JSON output to .json files incase for future use
        // fs.writeFileSync("./input/bots.json", JSON.stringify(actors_list));
        // fs.writeFileSync("./input/allposts.json", JSON.stringify(posts_list));
        // fs.writeFileSync("./input/allreplies.json", JSON.stringify(comment_list));
        await console.log("Converted data to json")
    } catch (err) {
        console.log('Error occurred in reading data from csv files', err);
    }
}


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
drop existing collections before loading
to make sure we dont overwrite the data 
incase we run the script twice or more
*/
function dropCollections() {
    db.collections['actors'].drop(function (err) {
        console.log('actors collection dropped');
    });
    db.collections['scripts'].drop(function (err) {
        console.log('scripts collection dropped');
    });
    db.collections['notifications'].drop(function (err) {
        console.log('notifications collection dropped');
    });
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

/*************************
createActorInstances:
Creates all the Actors in the simulation
Must be done first!
*************************/
function createActorInstances() {           
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
            return 'Loaded Actors'
        }
    );
}

/*************************
createPostInstances:
Creates each post and uploads it to the DB
Actors must be in DB first to add them correctly to the post
*************************/
function createPostInstances() {
    async.each(posts_list, function (new_post, callback) {
        Actor.findOne({ username: new_post.actor }, (err, act) => {
            if (err) { console.log("createPostInstances error"); console.log(err); return; }
            // console.log("start post for: "+new_post.id);
            if (act) {  
                var postdetail = new Object();
                
                postdetail.likes =  getLikes();

                
                postdetail.experiment_group = new_post.experiment_group
                postdetail.post_id = new_post.id;
                postdetail.class = new_post.class;
                postdetail.picture = new_post.picture;
                postdetail.lowread = getReads(6, 20);
                postdetail.highread = getReads(145, 203);
                postdetail.actor = act;
                postdetail.time = timeStringToNum(new_post.time);

                //console.log('Looking up Actor: ' + act.username);
                //console.log(mongoose.Types.ObjectId.isValid(postdetail.actor.$oid));
                //console.log(postdetail);

                var script = new Script(postdetail);
                script.save(function (err) {
                    if (err) {
                        console.log("Something went wrong in Saving POST!!!");
                        // console.log(err);
                        callback(err);
                    }
                    // console.log('Saved New Post: ' + script.id);
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
            console.log("All DONE WITH POSTS!!!")
            return 'Loaded Posts'
            //mongoose.connection.close();
        }
    );
}

/*************************
actorNotifyInstances:
Creates each post and uploads it to the DB
Actors must be in DB first to add them correctly to the post
*************************/
function actorNotifyInstances() {
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
                    // console.log('Saved New Post: ' + script.id);
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
            return 'Loaded Notification Actor Replies'
            //mongoose.connection.close();
        }
    );
}

/*************************
createNotificationInstances:
Creates each post and uploads it to the DB
Actors must be in DB first to add them correctly to the post
*************************/
function createNotificationInstances() {
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
                    // console.log('Saved New Post: ' + script.id);
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
            console.log("All DONE WITH Notificatio !!!")
            return 'Loaded Notification'
            //mongoose.connection.close();
        }
    );
}

/*************************
createPostRepliesInstances:
Creates inline comments for each post
Looks up actors and posts to insert the correct comment
Does this in series to insure comments are put in, in correct order
Takes a while because of this
*************************/
function createPostRepliesInstances() {

    async.eachSeries(comment_list, function (new_replies, callback) {

        // console.log("start REPLY for: "+new_replies.id);
        Actor.findOne({ username: new_replies.actor }, (err, act) => {


            if (act) {
                Script.findOne({ post_id: new_replies.reply }, function (err, pr) {
                    if (pr) {
                        // console.log('Looking up Actor ID is : ' + act._id); 
                        // console.log('Looking up OP POST ID is : ' + pr._id); 
                        var comment_detail = new Object();
                        //postdetail.actor = {};
                        comment_detail.body = new_replies.body
                        comment_detail.commentID = new_replies.id;
                        comment_detail.class = new_replies.class;
                        comment_detail.module = new_replies.module;
                        comment_detail.likes = getLikesComment();
                        comment_detail.time = timeStringToNum(new_replies.time);
                        comment_detail.actor = act;
                        //pr.comments = insert_order(comment_detail, pr.comments);
                        //console.log('Comment'+comment_detail.commentID+' on Post '+pr.post_id+' Length before: ' + pr.comments.length); 
                        pr.comments.push(comment_detail);
                        pr.comments.sort(function (a, b) { return a.time - b.time; });
                        //console.log('Comment'+comment_detail.commentID+' on Post '+pr.post_id+' Length After: ' + pr.comments.length); 
                        //var script = new Script(postdetail);

                        pr.save(function (err) {
                            if (err) {
                                console.log("@@@@@@@@@@@@@@@@Something went wrong in Saving COMMENT!!!");
                                console.log("Error IN: " + new_replies.id);
                                // console.log('Looking up Actor: ' + act.username);
                                // console.log('Looking up OP POST ID: ' + pr._id); 
                                // console.log('Time is : ' + new_replies.time); 
                                // console.log('NEW Time is : ' + comment_detail.time);
                                // console.log(err);
                                callback(err);
                            }
                            console.log('Added new Comment to Post: ' + pr.id);
                            callback();
                        });
                    }// if PR
                    else {
                        //Else no ACTOR Found
                        console.log("############Error IN: " + new_replies.id);
                        console.log("No POST Found!!!");
                        callback();
                    }
                });//Script.findOne
            }//if ACT

            else {
                //Else no ACTOR Found
                console.log("****************Error IN: " + new_replies.id);
                console.log("No Actor Found!!!");
                callback();
            }
            // console.log("BoTTom REPLY for: "+new_replies.id);
            // console.log("BOTTOM OF SAVE");
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
            return 'Loaded Post Replies/Comments'
        }
    );
}


/*
promisify function will convert a function call to promise 
which will eventually resolve when function completes its execution,
additionally it will wait for 2 seconds before starting.
*/

function promisify(inputFunction) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(inputFunction());
        }, 2000);
    });
}

/*
TODO: Async function that runs 
all these functions in serial, in this order
Once all done, stop the program (Be sure to close the mongoose connection)
*/
async function loadDatabase() {
    try {
        await readData(); //read data from csv files and convert it to json for loading
        await promisify(dropCollections); //drop existing collecions before loading data
        await promisify(createActorInstances);
        await promisify(actorNotifyInstances);
        await promisify(createNotificationInstances);
        await promisify(createPostInstances);
        await promisify(createPostRepliesInstances);
    } catch (err) {
        console.log('Error occurred in Loading', err);
    }
}

// createActorInstances()
// createPostInstances()
// createPostRepliesInstances()
loadDatabase()