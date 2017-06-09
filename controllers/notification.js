const Script = require('../models/Script.js');
const User = require('../models/User');
const Notification = require('../models/Notification.js');
const _ = require('lodash');

/**
 * GET /
 * List of Script posts for Feed
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
  .exec(function (err, user) {

    //This is the actual array of Posts from User
    var user_posts = user.getPosts();

    console.log("Past user_posts now");

    if (user_posts.length == 0)
    {
        //peace out - send empty page - 
        //or deal with replys or something IDK
        console.log("No User Posts yet. Sending to -1 to PUG");
        res.render('notification', { notification_feed: -1 });
    }

    //actually get, format and send the notifications
    else{
      console.log("User_posts has content - checking now");
      Notification.find()
        .where('userPost').lte(user.numPosts)
        .populate('actor')
        .exec(function (err, notification_feed) {
          if (err) { return next(err); }

          var final_notify = [];

          console.log("Before For LOOP: notification_feed size is");
          console.log(notification_feed.length)

          for (var i = 0, len = notification_feed.length; i < len; i++) {

            var userPostID = notification_feed[i].userPost;
            
            var time_diff = Date.now() - user_posts[userPostID].absTime;
            
            //check if we show this notification yet
            if(notification_feed[i].time <= time_diff)
            {

              //do stuff for notification (low) read junks
              if ((notification_feed[i].notificationType == "read") && (notification_feed[i].actor.class != "high_read") && (user.notify != "no"))
              {
                var readKey = "read_"+ userPostID;

                //find element in our final data structure
                let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == readKey; });

                //this does not exist yet, so create it
                if (notifyIndex == -1)
                {
                  let read_tmp = {};
                  read_tmp.key = readKey;
                  read_tmp.action = 'read';
                  read_tmp.postID = userPostID;
                  read_tmp.body = user_posts[userPostID].body;
                  read_tmp.picture = user_posts[userPostID].picture;
                  read_tmp.time = Date.parse(user_posts[userPostID].absTime) + notification_feed[i].time;
                  console.log("TIME  is");
                  console.log(read_tmp.time)
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

                  if ((user_posts[userPostID].absTime + notification_feed[i].time) > final_notify[notifyIndex].time)
                  { final_notify[notifyIndex].time = user_posts[userPostID].absTime + notification_feed[i].time;}
                }


              }//end of READ

               //do stuff for notification (high) read junks
              if ((notification_feed[i].notificationType == "read") && (notification_feed[i].actor.class == "high_read") && (user.notify == "high"))
              {
                var readKey = "read_"+ userPostID;

                //find element in our final data structure
                let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == readKey; });

                //this does not exist yet, so create it
                if (notifyIndex == -1)
                {
                  let read_tmp = {};
                  read_tmp.key = readKey;
                  read_tmp.action = 'read';
                  read_tmp.postID = userPostID;
                  read_tmp.body = user_posts[userPostID].body;
                  read_tmp.picture = user_posts[userPostID].picture;
                  read_tmp.time = Date.parse(user_posts[userPostID].absTime) + notification_feed[i].time;
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
                  if ((user_posts[userPostID].absTime + notification_feed[i].time) > final_notify[notifyIndex].time)
                  { final_notify[notifyIndex].time = user_posts[userPostID].absTime + notification_feed[i].time;}
                }


              }//end of READ

              //do stuff for notification LIKE 
              if (notification_feed[i].notificationType == "like")
              {
                var likeKey = "like_"+ userPostID;

                //find element in our final data structure
                let notifyIndex = _.findIndex(final_notify, function(o) { return o.key == likeKey; });

                //this does not exist yet, so create it
                if (notifyIndex == -1)
                {
                  let like_tmp = {};
                  like_tmp.key = likeKey;
                  like_tmp.action = 'like';
                  like_tmp.postID = userPostID;
                  like_tmp.body = user_posts[userPostID].body;
                  like_tmp.picture = user_posts[userPostID].picture;
                  like_tmp.time = user_posts[userPostID].absTime + notification_feed[i].time;
                  like_tmp.actors = [];
                  like_tmp.actors.push(notification_feed[i].actor);

                  final_notify.push(like_tmp);
                }

                //find element and add actor/update time
                else
                {
                  final_notify[notifyIndex].actors.push(notification_feed[i].actor);
                  final_notify[notifyIndex].time = user_posts[userPostID].absTime + notification_feed[i].time;
                }


              }//end of LIKE



              //TODO other notification checks

            }//end of check for time_diff


          }//end of for LOOP



          final_notify.sort(function (a, b) {
            return b.time - a.time;
          });




          res.render('notification', { notification_feed: final_notify });




      });//end of NOTIFICATION exec

    }//end of ELSE
  });//end of USER exec

  };