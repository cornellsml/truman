const Actor = require('../models/Actor.js');
const Script = require('../models/Script.js');
const User = require('../models/User');
var ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');

/**
 * GET /
 * List of Actors.
 
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home'
  });
};
*/

exports.getActors = (req, res) => {
  Actor.find((err, docs) => {


    res.render('actors', { actors: docs });


  });
};

exports.getActor = (req, res, next) => {

  var time_diff = Date.now() - req.user.createdAt;

  console.log("START HERE Our Paramater is:::::");
  console.log(req.params.userId);
  console.log("Time Diff");
  console.log(time_diff);

  User.findById(req.user.id)
  .exec(function (err, user) {

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

	Actor.findOne({ username: req.params.userId}, (err, act) => {
    if (err) { console.log(err); return next(err); }


    ////this is not solving the problem FUCKKKKK@
   if (act == null) {console.log("NULLLLLLLLLLL");  var myerr = new Error('Record not found!'); return next(myerr); }

    //console.log(act);
    //console.log("&&&&&&&&&&&&&&&&&&&&&");

    user.logPage(Date.now(), req.params.userId);

    var isBlocked;

    if (user.blocked.includes(req.params.userId))
    {
      isBlocked = true;
    }
    else
    {
      isBlocked = false;
    }

    Script.find({ actor: act.id})
    .where(scriptFilter).equals("yes")
    .where('time').lte(time_diff)
    .sort('-time')
    .populate('actor')
      .populate({ 
       path: 'comments.actor',
       populate: {
         path: 'actor',
         model: 'Actor'
       } 
    })
    .exec(function (err, script_feed) {
      if (err) { console.log(err); return next(err); }
      
      
      for (var i = script_feed.length - 1; i >= 0; i--) {

        var feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == script_feed[i].id; });

             
          if(feedIndex!=-1)
          {
            //console.log("WE HAVE AN ACTION!!!!!");

            if (Array.isArray(user.feedAction[feedIndex].comments) && user.feedAction[feedIndex].comments) 
              {

                console.log("WE HAVE COMMENTS!!!!!");
                //iterate over all comments in post - add likes, flag, etc
                for (var j = 0; j < user.feedAction[feedIndex].comments.length; j++) {
                  //i is now user.feedAction[feedIndex].comments index

                    //is this action of new user made comment we have to add???
                    if (user.feedAction[feedIndex].comments[j].new_comment)
                    {
                      //comment.new_comment
                      console.log("adding User Made Comment into feed: "+user.feedAction[feedIndex].comments[j].new_comment_id);
                      console.log(JSON.stringify(user.feedAction[feedIndex].comments[j]))
  

                      var cat = new Object();
                      cat.body = user.feedAction[feedIndex].comments[j].comment_body;
                      cat.new_comment = user.feedAction[feedIndex].comments[j].new_comment;
                      cat.time = user.feedAction[feedIndex].comments[j].time;
                      cat.commentID = user.feedAction[feedIndex].comments[j].new_comment_id;
                      cat.likes = 0;

                      script_feed[i].comments.push(cat);
                      console.log("Already have COMMENT ARRAY");
                

                    }

                    else
                    {
                      //Do something
                      //var commentIndex = _.findIndex(user.feedAction[feedIndex].comments, function(o) { return o.comment == script_feed[0].comments[i].id; });
                      var commentIndex = _.findIndex(script_feed[i].comments, function(o) { return o.id == user.feedAction[feedIndex].comments[j].comment; });
                      //If user action on Comment in Script Post
                      if(commentIndex!=-1)
                      {

                        console.log("WE HAVE AN ACTIONS ON COMMENTS!!!!!");
                        //Action is a like (user liked this comment in this post)
                        if (user.feedAction[feedIndex].comments[j].liked)
                        { 
                          script_feed[i].comments[commentIndex].liked = true;
                          script_feed[i].comments[commentIndex].likes++;
                          //console.log("Post %o has been LIKED", script_feed[0].id);
                        }

                        //Action is a FLAG (user Flaged this comment in this post)
                        if (user.feedAction[feedIndex].comments[j].flagged)
                        { 
                          console.log("Comment %o has been LIKED", user.feedAction[feedIndex].comments[j].id);
                          script_feed[i].comments.splice(commentIndex,1);
                        }
                      }
                    }//end of ELSE

                }//end of for loop

              }//end of IF Comments

            if (user.feedAction[feedIndex].readTime[0])
            { 
              script_feed[i].read = true;
              script_feed[i].state = 'read';
              console.log("Post: %o has been READ", script_feed[i].id);
            }

            if (user.feedAction[feedIndex].liked)
            { 
              script_feed[i].like = true;
              script_feed[i].likes++;
              //console.log("Post %o has been LIKED", script_feed[i].id);
            }

            if (user.feedAction[feedIndex].replyTime[0])
            { 
              script_feed[i].reply = true;
              //console.log("Post %o has been REPLIED", script_feed[i].id);
            }

            //If this post has been flagged - remove it from FEED array (script_feed)
            if (user.feedAction[feedIndex].flagTime[0])
            { 
              script_feed.splice(i,1);
              //console.log("Post %o has been FLAGGED", script_feed[i].id);
            }

          }//end of IF we found Feed_action



      }

      user.save((err) => {
        if (err) {
          return next(err);
        }
      });
      console.log("Is block is now "+isBlocked);
      res.render('actor', { script: script_feed, actor: act, blocked:isBlocked, profileFilter: profileFilter });
    });

 // }
	
  });//Actor Find One
});//User.findbyID
};


/**
 * POST /feed/
 * Update user's feed posts Actions.
 */
exports.postBlockOrReport = (req, res, next) => {

  User.findById(req.user.id, (err, user) => {
    //somehow user does not exist here
    if (err) { return next(err); }

    //if we have a blocked user and they are not already in the list, add them now
    if (req.body.blocked && !(user.blocked.includes(req.body.blocked)))
    {
      user.blocked.push(req.body.blocked);

      var log = {};
      log.time = Date.now();
      log.action = "block";
      log.actorName = req.body.blocked
      user.blockAndReportLog.push(log);
    }

    //if we have a reported user and they are not already in the list, add them now
    else if (req.body.reported && !(user.reported.includes(req.body.reported)))
    {
      console.log("@@@Reporting a user now")
      user.reported.push(req.body.reported);
      var log = {};
      log.time = Date.now();
      log.action = "report";
      log.actorName = req.body.reported;
      log.report_issue = req.body.report_issue;
      user.blockAndReportLog.push(log);
    }

    else if (req.body.unblocked && user.blocked.includes(req.body.unblocked))
    {
      var index = user.blocked.indexOf(req.body.unblocked);
      user.blocked.splice(index, 1);

      var log = {};
      log.time = Date.now();
      log.action = "unblock";
      log.actorName = req.body.unblocked
      user.blockAndReportLog.push(log);
    }


    user.save((err) => {
      if (err) {
        return next(err);
      }
      res.send({result:"success"});
    });
  });
};

