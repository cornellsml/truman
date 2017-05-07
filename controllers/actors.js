const Actor = require('../models/Actor.js');
const Script = require('../models/Script.js');
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

	Actor.findOne({ username: req.params.userId}, (err, act) => {
    if (err) { console.log(err); return next(err); }


    ////this is not solving the problem FUCKKKKK@
   if (act == null) {console.log("NULLLLLLLLLLL");  var myerr = new Error('Record not found!'); return next(myerr); }

    //console.log(act);
    //console.log("&&&&&&&&&&&&&&&&&&&&&");

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
      res.render('actor', { script: script_feed, actor: act });
    });

 // }
	
  });
};
