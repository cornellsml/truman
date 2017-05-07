const Script = require('../models/Script.js');

/**
 * GET /
 * List of Script posts.
 
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home'
  });
};
*/

exports.getScript = (req, res) => {

  //req.user.createdAt
  var time_diff = Date.now() - req.user.createdAt;
  console.log("time_diff  is now "+time_diff);
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
      //res.render('book_list', { title: 'Book List', book_list: list_books });
      //console.log(script_feed);
      res.render('script', { script: script_feed });
    });
};

exports.getScriptPost = (req, res) => {

	Script.findOne({ _id: req.params.id}, (err, post) => {
		console.log(post);
		res.render('script_post', { post: post });
	});
};
