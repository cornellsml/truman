const Actor = require('../models/Actor.js');
const Script = require('../models/Script.js');
const User = require('../models/User');
var ObjectId = require('mongoose').Types.ObjectId;

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
      if (err) { console.log(err); return next(err); }
      
      //console.log("::::::Script::::");
      //console.log(script_feed);
      //save the Page Log
      user.save((err) => {
        if (err) {
          return next(err);
        }
      });
      console.log("Is block is now "+isBlocked);
      res.render('actor', { script: script_feed, actor: act, blocked:isBlocked });
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

