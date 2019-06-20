const Script = require('../models/Script.js');
const User = require('../models/User');
const Notification = require('../models/Notification.js');
const _ = require('lodash');

/**
 * GET /
 * List of Script posts for Notification Feed

*/
exports.getNotifications = (req, res) => {

  //get all posts

  //could Get all notes > numPosts (so I get everything) all at once, sort and organzie it myself

  //creat new data struct to hold everything
  //check if time if ok
  console.log("START Notification");

  User.findById(req.user.id)
  .populate({ 
       path: 'posts.reply',
       model: 'Script',
       populate: {
         path: 'actor',
         model: 'Actor'
       } 
    })
  .populate({ 
       path: 'posts.actorAuthor',
       model: 'Actor'
    })
  .exec(function (err, user) {

    //This is the actual array of Posts from User
    //does not have COMMENTS in it yet - maybe have no likes or reads on USER made Comments
    var user_posts = user.getPosts();

    if (user.script_type == "study3_n20")
    {
      scriptFilter = "study3_n20";
      profileFilter = "study3_n20_p60";
    }
    else if (user.script_type == "study3_n80")
    {
      scriptFilter = "study3_n80";
      profileFilter = "study_n80_p60";
    }

    //Log our visit to Notifications
    user.logPage(Date.now(), "Notifications");
    user.lastNotifyVisit = Date.now();

    //Also get all reply posts as well

    console.log("Past user_posts now");

    if (user.posts.length == 0)
    {
        //peace out - send empty page - 
        //or deal with replys or something IDK
        console.log("No User Posts yet. Sending to -1 to PUG");
        res.render('notification', { notification_feed: -1 });
    }

    //actually get, format and send the notifications
    else{
      console.log("User_posts has content - checking now");
      /*
      userPost: Number, //which user post this action is for (0,1,2....n)
      userReply: Number, //for replys from User
      actorReply: Number,

      CHANGED: TOOK OUT userReply (no longer in system)
      */
      console.log("RECORD IS NOW: numPost - "+user.numPosts+"| numReplies - "+user.numPosts+"| numActorReplies - "+user.numActorReplies);
      //Notification.find({ $or: [ { userPost: { $lte: user.numPosts } }, { actorReply: { $lte: user.numActorReplies } } ] })
      Notification.find({ $or: [ { userPost: { $lte: user.numPosts } } ] })
        .populate('actor')
        .exec(function (err, notification_feed) {
          if (err) { return next(err); }

          if (notification_feed.length == 0)
          {
            //peace out - send empty page - 
            //or deal with replys or something IDK
            console.log("No User Posts yet. Sending to -1 to PUG");
            res.render('notification', { notification_feed: -1 });
          }

          var final_notify = [];

          console.log("Before For LOOP: notification_feed size is");
          console.log(notification_feed.length)

          for (var i = 0, len = notification_feed.length; i < len; i++) {

            //ADD big IF/ELSE IF on userpost/user Reply/ Actor Reply/ Actor Reply Read
            console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
            console.log("@@@@@@@@Notification is "+notification_feed[i].id);
            console.log("########Notification is type "+notification_feed[i].notificationType);

            //Do all things that reference userPost (read,like, actual copy of ActorReply)
            if (notification_feed[i].userPost >= 0)
            {
              var userPostID = notification_feed[i].userPost;
              //console.log("Looking at user post number: "+ userPostID)
              var user_post = user.getUserPostByID(userPostID);
              
              //!!!!!!!!@@@@@@@@@@@@@@@This needs to change ()
              var time_diff = Date.now() - user_post.absTime;

              console.log("USER POST NOTIFICATION");
              console.log("########Notification is UserPostID "+notification_feed[i].userPost);
              console.log("########TIME in UserPostID is "+notification_feed[i].time);
              console.log("########General Time is "+time_diff);
              
              //check if we show this notification yet
              if(notification_feed[i].time <= time_diff)
              { 
                console.log("USER POST Time is Now READY!!!!");

                //do stuff for notification read junks (there is no low or high anymore)
                if ((notification_feed[i].notificationType == "read") && (user.transparency != "no"))
                {
                  var readKey = "read_"+ userPostID;

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == readKey; });

                  //transparency is new user.notify
                  //Does all transparency have high read???

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let read_tmp = {};
                    read_tmp.key = readKey;
                    read_tmp.action = 'read';
                    read_tmp.postID = userPostID;
                    read_tmp.body = user_post.body;
                    read_tmp.picture = user_post.picture;
                    read_tmp.time = Date.parse(user_post.absTime) + notification_feed[i].time;
                    console.log("TIME  is");
                    console.log(read_tmp.time)
                    read_tmp.actors = [];
                    read_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(read_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    
                    //if cohort actor, shift ahead of the line (to be seen first)
                    if (notification_feed[i].actor.class == "cohort")
                      {
                        final_notify[notifyIndex].actors.unshift(notification_feed[i].actor);
                      }
                    else
                      {
                        final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                      }

                    if ((user_post.absTime + notification_feed[i].time) > final_notify[notifyIndex].time)
                    { final_notify[notifyIndex].time = user_post.absTime + notification_feed[i].time;}
                  }
                }//end of READ

                //do stuff for notification LIKE 
                else if (notification_feed[i].notificationType == "like")
                {
                  var likeKey = "like_"+ userPostID;

                  console.log("Now in LIKE Area");

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == likeKey; });

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let like_tmp = {};
                    like_tmp.key = likeKey;
                    like_tmp.action = 'like';
                    like_tmp.postID = userPostID;
                    like_tmp.body = user_post.body;
                    like_tmp.picture = user_post.picture;
                    like_tmp.time = Date.parse(user_post.absTime) + notification_feed[i].time;
                    like_tmp.actors = [];
                    like_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(like_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                    final_notify[notifyIndex].time = Date.parse(user_post.absTime) + notification_feed[i].time;
                  }
                }//end of LIKE

                else if (notification_feed[i].notificationType == "reply")
                {
                  var replyKey = "actorReply_"+ userPostID;

                  console.log("Now creating REPLY");

                  let reply_tmp = {};
                  reply_tmp.key = replyKey;
                  reply_tmp.action = 'reply';
                  reply_tmp.postID = userPostID;
                  reply_tmp.body = user_post.body;//OBody
                  reply_tmp.picture = user_post.picture;//OPicture
                  reply_tmp.replyBody = notification_feed[i].replyBody;//replybody
                  reply_tmp.time = Date.parse(user_post.absTime) + notification_feed[i].time;
                  reply_tmp.Originaltime = user_post.relativeTime;
                  reply_tmp.actor = notification_feed[i].actor;//reply Actor

                  final_notify.push(reply_tmp);
                }//end of REPLY

              }//end of check for time_diff

            }//end of User Post

            /*
            ###################################################################
            All things reference a User Reply (read like, etc)
            ###################################################################
            
            else if (notification_feed[i].userReply >= 0)
            {

              var userReplyID = notification_feed[i].userReply;

              //If in future, want this to work on COMMENTS, need to change this function
              var user_reply = user.getUserReplyByID(userReplyID);
              console.log("USER REPLY NOTIFICATION");
              console.log("########Notification is UserReplyID "+notification_feed[i].userReply);
              
              //!!!!!!!!@@@@@@@@@@@@@@@This needs to change ()
              var time_diff = Date.now() - user_reply.absTime;
              
              //check if we show this notification yet
              if(notification_feed[i].time <= time_diff)
              {
                console.log("TIME IS READY FOR USER REPLY");
                //do stuff for notification (low) read junks
                if ((notification_feed[i].notificationType == "read") && (notification_feed[i].actor.class != "high_read") && (user.notify != "no"))
                {
                  var readKey = "reply_read_"+ userReplyID;

                  console.log("USER REPLY READ READY AREA");

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == readKey; });

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let read_tmp = {};
                    read_tmp.key = readKey;
                    read_tmp.action = 'reply_read';
                    read_tmp.postID = userReplyID;
                    read_tmp.body = user_reply.body;
                    read_tmp.picture = user_reply.reply.picture;
                    read_tmp.originalBody = user_reply.reply.body;
                    read_tmp.originalActor = user_reply.reply.actor;
                    read_tmp.time = Date.parse(user_reply.absTime) + notification_feed[i].time;
                    read_tmp.actors = [];
                    read_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(read_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    
                    if (notification_feed[i].actor.class == "cohort")
                      {
                        final_notify[notifyIndex].actors.unshift(notification_feed[i].actor);
                      }
                    else
                      {
                        final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                      }

                    if ((user_reply.absTime + notification_feed[i].time) > final_notify[notifyIndex].time)
                    { final_notify[notifyIndex].time = user_reply.absTime + notification_feed[i].time;}
                  }


                }//end of READ

                 //do stuff for notification (high) read junks
                if ((notification_feed[i].notificationType == "read") && (notification_feed[i].actor.class == "high_read") && (user.notify == "high"))
                {
                  var readKey = "reply_read_"+ userReplyID;

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == readKey; });

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let read_tmp = {};
                    read_tmp.key = readKey;
                    read_tmp.action = 'reply_read';
                    read_tmp.postID = userReplyID;
                    read_tmp.body = user_reply.body;
                    read_tmp.picture = user_reply.reply.picture;
                    read_tmp.originalBody = user_reply.reply.body;
                    read_tmp.originalActor = user_reply.reply.actor;
                    read_tmp.time = Date.parse(user_reply.absTime) + notification_feed[i].time;
                    read_tmp.actors = [];
                    read_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(read_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                    if ((user_reply.absTime + notification_feed[i].time) > final_notify[notifyIndex].time)
                    { final_notify[notifyIndex].time = user_reply.absTime + notification_feed[i].time;}
                  }


                }//end of high READ

                //do stuff for notification LIKE 
                else if (notification_feed[i].notificationType == "like")
                {
                  var likeKey = "reply_like_"+ userReplyID;

                  console.log("USER REPLY LIKE READY AREA");

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == likeKey; });

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let like_tmp = {};
                    like_tmp.key = likeKey;
                    like_tmp.action = 'reply_like';
                    like_tmp.postID = userReplyID;
                    like_tmp.body = user_reply.body;
                    like_tmp.picture = user_reply.reply.picture;
                    like_tmp.originalBody = user_reply.reply.body;
                    like_tmp.originalActor = user_reply.reply.actor;
                    like_tmp.time = Date.parse(user_reply.absTime) + notification_feed[i].time;
                    like_tmp.actors = [];
                    like_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(like_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                    final_notify[notifyIndex].time = Date.parse(user_reply.absTime) + notification_feed[i].time;
                  }


                }//end of LIKE

              }//end of time_diff

            }//end of User Reply

            /*
            ###################################################################
            All things reference an Actor Reply (read, like, etc)
            ###################################################################
            
            else if (notification_feed[i].actorReply >= 0)
            {

              var actorReplyID = notification_feed[i].actorReply;

              var actor_reply = user.getActorReplyByID(actorReplyID);
              
              var time_diff = Date.now() - actor_reply.absTime;

              console.log("ACTOR REPLY NOTIFICATION");
              console.log("########Notification is ActorReplyID "+notification_feed[i].actorReply);
              
              //check if we show this notification yet
              if(notification_feed[i].time <= time_diff)
              {

                console.log("MADE TIME IN ACTOR REPLY");
                //do stuff for notification (low) read junks
                if ((notification_feed[i].notificationType == "read") && (notification_feed[i].actor.class != "high_read") && (user.notify != "no"))
                {
                  var readKey = "actor_reply_read_"+ actorReplyID;

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == readKey; });

                  console.log("ACTOR REPLY Inside Read");

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let read_tmp = {};
                    read_tmp.key = readKey;
                    read_tmp.action = 'actor_reply_read';
                    read_tmp.postID = actorReplyID;
                    read_tmp.body = actor_reply.body;
                    read_tmp.picture = actor_reply.actorReplyOPicture;
                    read_tmp.originalActor = actor_reply.actorAuthor;
                    read_tmp.time = Date.parse(actor_reply.absTime) + notification_feed[i].time;
                    read_tmp.actors = [];
                    read_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(read_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    
                    if (notification_feed[i].actor.class == "cohort")
                      {
                        final_notify[notifyIndex].actors.unshift(notification_feed[i].actor);
                      }
                    else
                      {
                        final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                      }

                    if ((actor_reply.absTime + notification_feed[i].time) > final_notify[notifyIndex].time)
                    { final_notify[notifyIndex].time = actor_reply.absTime + notification_feed[i].time;}
                  }


                }//end of READ

                 //do stuff for notification (high) read junks
                else if ((notification_feed[i].notificationType == "read") && (notification_feed[i].actor.class == "high_read") && (user.notify == "high"))
                {
                  var readKey = "actor_reply_read_"+ actorReplyID;

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == readKey; });

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let read_tmp = {};
                    read_tmp.key = readKey;
                    read_tmp.action = 'actor_reply_read';
                    read_tmp.postID = actorReplyID;
                    read_tmp.body = actor_reply.body;
                    read_tmp.picture = actor_reply.actorReplyOPicture;
                    read_tmp.originalActor = actor_reply.actorAuthor;
                    read_tmp.time = Date.parse(actor_reply.absTime) + notification_feed[i].time;
                    console.log("TIME  is");
                    console.log(read_tmp.time)
                    read_tmp.actors = [];
                    read_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(read_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                    if ((actor_reply.absTime + notification_feed[i].time) > final_notify[notifyIndex].time)
                    { final_notify[notifyIndex].time = actor_reply.absTime + notification_feed[i].time;}
                  }


                }//end of high READ

                //do stuff for notification LIKE 
                else if ((notification_feed[i].notificationType == "like") && (user.notify != "no"))
                {
                  var likeKey = "actor_reply_like_"+ actorReplyID;

                  //find element in our final data structure
                  let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == likeKey; });

                  console.log("ACTOR REPLY Inside Like");

                  //this does not exist yet, so create it
                  if (notifyIndex == -1)
                  {
                    let like_tmp = {};
                    like_tmp.key = likeKey;
                    like_tmp.action = 'actor_reply_like';
                    like_tmp.postID = actorReplyID;
                    like_tmp.body = actor_reply.body;
                    like_tmp.picture = actor_reply.actorReplyOPicture;
                    like_tmp.originalActor = actor_reply.actorAuthor;
                    like_tmp.time = Date.parse(actor_reply.absTime) + notification_feed[i].time;
                    like_tmp.actors = [];
                    like_tmp.actors.push(notification_feed[i].actor);

                    final_notify.push(like_tmp);
                  }

                  //find element and add actor/update time
                  else
                  {
                    final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                    final_notify[notifyIndex].time = Date.parse(actor_reply.absTime) + notification_feed[i].time;
                  }


                }//end of LIKE for Actor Reply

              }//Time Diff

            }//Actor Reply
            */


            //not post, reply or actor reply
            else
            {
              console.log("%$%$%$%$%$%$%$%$%$Crazy error should never see$%$%$%$%$%$%$%$%$%$%$%$%$%$%")
            }


          }//end of for FOR LOOP



          final_notify.sort(function (a, b) {
            return b.time - a.time;
          });


          //save the Page Log
          user.save((err) => {
            if (err) {
              return next(err);
            }
            //req.flash('success', { msg: 'Profile information has been updated.' });
          });
          res.render('notification', { notification_feed: final_notify, profileFilter: profileFilter });




      });//end of NOTIFICATION exec

    }//end of ELSE
  });//end of USER exec

  };//end of function