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

            if (user.feedAction[feedIndex].readTime)
            { 
              script_feed[key].read = true;
              console.log("Post: %o has been READ", script_feed[key].id);
            }

            if (user.feedAction[feedIndex].flagTime)
            { 
              script_feed[key].flag = true;
              console.log("Post %o has been FLAGGED", script_feed[key].id);
            }

            if (user.feedAction[feedIndex].likeTime)
            { 
              script_feed[key].like = true;
              console.log("Post %o has been LIKED", script_feed[key].id);
            }

            if (user.feedAction[feedIndex].replyTime)
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

    console.log("postID is  ", req.body.postID);
    //find the object from the right post in feed 

    var feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == req.body.postID; });
    //var feedIndex = _.findIndex(user.feedAction, ['post', req.body.postID]);

    //console.log("index is  ", feedIndex);

    if(feedIndex==-1)
    {
      //Post does not exist yet in User DB, so we have to add it now
      console.log("$$$$$$$$$$$$Making new feedAction Object! at post ", req.body.postID);
      var cat = new Object();
      cat.post = req.body.postID;
      cat.startTime = req.body.start;
      //add new post into feedAction
      user.feedAction.push(cat);

    }
    else
    {
      //we found the right post, and feedIndex is the right index for it
      console.log("####### FOUND post "+req.body.postID+" at index "+ feedIndex);

      //if item is empty, then fill it, else move on
      if ((!user.feedAction[feedIndex].startTime)&& req.body.start)
      { 
        //this should never run or happen
        console.log("@@@@USER.feedAction.startTime  ", user.feedAction[feedIndex].startTime);
        user.feedAction[feedIndex].startTime = req.body.start || '';
        console.log("adding START time now which is  ", req.body.start); 

      }

      if ((!user.feedAction[feedIndex].readTime)&&req.body.read)
      { 
        user.feedAction[feedIndex].readTime = req.body.read || '';
        console.log("adding READ time now which is  ", req.body.read);
      }

      if ((!user.feedAction[feedIndex].flagTime)&&req.body.flag)
      { 
        user.feedAction[feedIndex].flagTime = req.body.flag || '';
        console.log("adding FLAG time now which is  ", req.body.flag);
      }

      if ((!user.feedAction[feedIndex].likeTime)&&req.body.like)
      { 
        user.feedAction[feedIndex].likeTime = req.body.like || '';
        console.log("adding LIKE time now which is  ", req.body.like);
      }

      if ((!user.feedAction[feedIndex].replyTime)&&req.body.reply)
      { 
        user.feedAction[feedIndex].replyTime = req.body.reply || '';
        console.log("adding REPLY time now which is  ", req.body.reply);
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
