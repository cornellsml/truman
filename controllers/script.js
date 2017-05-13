const Script = require('../models/Script.js');
const User = require('../models/User');
const _ = require('lodash');

/**
 * GET /
 * List of Script posts for Feed
*/
exports.getScript = (req, res) => {

  //req.user.createdAt
  var time_diff = Date.now() - req.user.createdAt;
  console.log("time_diff  is now "+time_diff);

  User.findById(req.user.id, (err, user) => {

    Script.find()
      .where('time').lte(time_diff)
      .sort('-time')
      .populate('actor')
      .populate({ 
       path: 'reply',
       populate: {
         path: 'actor',
         model: 'Actor'
       } 
    })
      .exec(function (err, script_feed) {
        if (err) { return next(err); }
        //Successful, so render
        //console.log(script_feed);
        //update script feed to see if reading and posts has already happened
        for (var key in script_feed) {
          //check if read/liked/etc
          var feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == script_feed[key].id; });

          //we found a matching post
          if(feedIndex!=-1)
          {

            if (user.feedAction[feedIndex].readTime[0])
            { 
              script_feed[key].read = true;
              console.log("Post: %o has been READ", script_feed[key].id);
            }

            if (user.feedAction[feedIndex].flagTime[0])
            { 
              script_feed[key].flag = true;
              console.log("Post %o has been FLAGGED", script_feed[key].id);
            }

            if (user.feedAction[feedIndex].likeTime[0])
            { 
              script_feed[key].like = true;
              console.log("Post %o has been LIKED", script_feed[key].id);
            }

            if (user.feedAction[feedIndex].replyTime[0])
            { 
              script_feed[key].reply = true;
              console.log("Post %o has been REPLIED", script_feed[key].id);
            }

          }
        }


        res.render('script', { script: script_feed });

      });

    
  });//end of User.findByID

};//end of .getScript

exports.getScriptPost = (req, res) => {

	Script.findOne({ _id: req.params.id}, (err, post) => {
		console.log(post);
		res.render('script_post', { post: post });
	});
};

/**
 * POST /feed/
 * Update user's feed posts Actions.
 */
exports.postUpdateFeedAction = (req, res, next) => {

  User.findById(req.user.id, (err, user) => {
    //somehow user does not exist here
    if (err) { return next(err); }

    console.log("@@@@@@@@@@@ TOP postID is  ", req.body.postID);

    //find the object from the right post in feed 
    var feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == req.body.postID; });

    //console.log("index is  ", feedIndex);

    if(feedIndex==-1)
    {
      //Post does not exist yet in User DB, so we have to add it now
      console.log("$$$$$$$$$$$$Making new feedAction Object! at post ", req.body.postID);
      var cat = new Object();
      cat.post = req.body.postID;
      cat.startTime = req.body.start;
      cat.rereadTimes = 0;
      //add new post into feedAction
      user.feedAction.push(cat);

    }
    else
    {
      //we found the right post, and feedIndex is the right index for it
      console.log("####### FOUND post "+req.body.postID+" at index "+ feedIndex);

      //update to new StartTime
      if (req.body.start && (req.body.start > user.feedAction[feedIndex].startTime))
      { 
        console.log("%%%%%% USER.feedAction.startTime  ", user.feedAction[feedIndex].startTime);
        user.feedAction[feedIndex].startTime = req.body.start;
        user.feedAction[feedIndex].rereadTimes++;
        console.log("%%%%%% NEW START time is now  ", user.feedAction[feedIndex].startTime);
        console.log("%%%%%% reRead counter is now  ", user.feedAction[feedIndex].rereadTimes); 

      }

      //array of readTimes is empty and we have a new READ event
      else if ((!user.feedAction[feedIndex].readTime)&&req.body.read && (req.body.read > user.feedAction[feedIndex].startTime))
      { 
        let read = req.body.read - user.feedAction[feedIndex].startTime
        console.log("!!!!!New FIRST READ Time: ", read);
        user.feedAction[feedIndex].readTime = [read];
        console.log("!!!!!adding FIRST READ time [0] now which is  ", user.feedAction[feedIndex].readTime[0]);
      }

      //Already have a readTime Array, New READ event, need to add this to readTime array
      else if ((user.feedAction[feedIndex].readTime)&&req.body.read && (req.body.read > user.feedAction[feedIndex].startTime))
      { 
        let read = req.body.read - user.feedAction[feedIndex].startTime
        console.log("%%%%%Add new Read Time: ", read);
        user.feedAction[feedIndex].readTime.push(read);
      }

      //array of flagTime is empty and we have a new (first) Flag event
      else if ((!user.feedAction[feedIndex].flagTime)&&req.body.flag && (req.body.flag > user.feedAction[feedIndex].startTime))
      { 
        let flag = req.body.flag - user.feedAction[feedIndex].startTime
        console.log("!!!!!New FIRST FLAG Time: ", flag);
        user.feedAction[feedIndex].flagTime = [flag];
        console.log("!!!!!adding FIRST FLAG time [0] now which is  ", user.feedAction[feedIndex].flagTime[0]);
      }

      //Already have a flagTime Array, New FLAG event, need to add this to flagTime array
      else if ((user.feedAction[feedIndex].flagTime)&&req.body.flag && (req.body.flag > user.feedAction[feedIndex].startTime))
      { 
        let flag = req.body.flag - user.feedAction[feedIndex].startTime
        console.log("%%%%%Add new FLAG Time: ", flag);
        user.feedAction[feedIndex].flagTime.push(flag);
      }

      //array of likeTime is empty and we have a new (first) LIKE event
      else if ((!user.feedAction[feedIndex].likeTime)&&req.body.like && (req.body.like > user.feedAction[feedIndex].startTime))
      { 
        let like = req.body.like - user.feedAction[feedIndex].startTime
        console.log("!!!!!!New FIRST LIKE Time: ", like);
        user.feedAction[feedIndex].likeTime = [like];
        console.log("!!!!!!!adding FIRST LIKE time [0] now which is  ", user.feedAction[feedIndex].likeTime[0]);
      }

      //Already have a likeTime Array, New LIKE event, need to add this to likeTime array
      else if ((user.feedAction[feedIndex].likeTime)&&req.body.like && (req.body.like > user.feedAction[feedIndex].startTime))
      { 
        let like = req.body.like - user.feedAction[feedIndex].startTime
        console.log("%%%%%Add new LIKE Time: ", like);
        user.feedAction[feedIndex].likeTime.push(like);
      }

      //array of replyTime is empty and we have a new (first) REPLY event
      else if ((!user.feedAction[feedIndex].replyTime)&&req.body.reply && (req.body.reply > user.feedAction[feedIndex].startTime))
      { 
        let reply = req.body.reply - user.feedAction[feedIndex].startTime
        console.log("!!!!!!!New FIRST REPLY Time: ", reply);
        user.feedAction[feedIndex].replyTime = [reply];
        console.log("!!!!!!!adding FIRST REPLY time [0] now which is  ", user.feedAction[feedIndex].replyTime[0]);
      }

      //Already have a replyTime Array, New REPLY event, need to add this to replyTime array
      else if ((user.feedAction[feedIndex].replyTime)&&req.body.reply && (req.body.reply > user.feedAction[feedIndex].startTime))
      { 
        let reply = req.body.reply - user.feedAction[feedIndex].startTime
        console.log("%%%%%Add new REPLY Time: ", reply);
        user.feedAction[feedIndex].replyTime.push(reply);
      }

      else
      {
        console.log("Got a POST that did not fit anything. Possible Error.")
      }

       console.log("####### END OF ELSE post at index "+ feedIndex);

    }
    console.log("@@@@@@@@@@@ ABOUT TO SAVE TO DB on Post ", req.body.postID);
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'Something in feedAction went crazy. You should never see this.' });
          return res.redirect('/account');
        }
        return next(err);
      }
      //req.flash('success', { msg: 'Profile information has been updated.' });
      //res.redirect('/account');
      console.log("@@@@@@@@@@@ SAVED TO DB!!!!!!!!! ");
      res.send({result:"success"});
    });
  });
};
