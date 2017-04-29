const Actor = require('../models/Actor.js');

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

exports.getActor = (req, res) => {

	Actor.findOne({ username: req.params.userId}, (err, user) => {
		console.log(user);
		res.render('actor', { actor: user });
	});
};
