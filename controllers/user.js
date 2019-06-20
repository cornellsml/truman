const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const passport = require('passport');
const moment = require('moment');
const User = require('../models/User');
const Notification = require('../models/Notification.js');

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/*************
Get Notifcation Bell signal
**************/
exports.checkBell = (req, res) => {
if (req.user) {

    var user = req.user;

    Notification.find({ $or: [ { userPost: user.numPosts  }, { actorReply: user.numActorReplies } ] })
    //Notification.find({ $or: [ { userPost: { $lte: user.numPosts } }, { actorReply: { $lte: user.numActorReplies } } ] })
        .populate('actor')
        .exec(function (err, notification_feed) {

          if (err) { return next(err); }

          if (notification_feed.length == 0)
          {
            //peace out - send empty page - 
            //or deal with replys or something IDK
            console.log("No User Posts yet. Bell is black");
            return res.send({result:false}); 
          }

          //We have values we need to check
          //When this happens
          else{

            for (var i = 0, len = notification_feed.length; i < len; i++) {

              //Do all things that reference userPost (read,like, actual copy of ActorReply)
              if (notification_feed[i].userPost >= 0)
              {

                var userPostID = notification_feed[i].userPost;
                //this can cause issues if not found - should check on later
                var user_post = user.getUserPostByID(userPostID);
                var time_diff = Date.now() - user_post.absTime;
                if (user.lastNotifyVisit)
                {
                  var past_diff = user.lastNotifyVisit - user_post.absTime;
                }
                
                else
                {
                  var past_diff = 0;
                }

                if(notification_feed[i].time <= time_diff && notification_feed[i].time > past_diff)
                {
                  
                  if ((notification_feed[i].notificationType == "read") && (user.transparency != "no"))
                    return res.send({result:true});
                  if (notification_feed[i].notificationType != "read")
                    return res.send({result:true});
                }

              }//UserPost

            }//for loop

            //end of for loop and no results, so no new stuff
            console.log("&&Bell Check&& End of For Loop, no Results")
            res.send({result:false});
          }


        });//Notification exec


  }

 else{
  console.log("No req.user")
  return res.send({result:false});
}
};


/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    if (!(user.active)) {
      console.log("FINAL");
      //Need to capture this in a var
      var post_url = process.env.POST_SURVEY+user.mturkID;
      console.log("last url is "+post_url)
      req.flash('final', { msg: post_url });
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      //req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 TODO - add code to take survey?? or check if you have seen experinetal post yet
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/login');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

/*###############################
Place Experimental Varibles Here!
###############################*/
  var var_num = 4;
  var result = ['var1', 'var2','var3', 'var4'][Math.floor(Math.random() * var_num)]
  
  var resultArray = result.split(':');
  //[0] is script_type, [1] is post_nudge
  const user = new User({
    email: req.body.email,
    password: req.body.password,
    mturkID: req.body.mturkID,
    username: req.body.username,
    group: result,
    active: true,
    lastNotifyVisit : (Date.now() - 86400000),
    createdAt: (Date.now() - 86400000)
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) { return next(err); }
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) { return next(err); }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/account/signup_info');
      });
    });
  });
};



/**
 * POST /account/profile
 * Update profile information.
 */
exports.postSignupInfo = (req, res, next) => {


  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    //user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.location = req.body.location || '';
    user.profile.bio = req.body.bio || '';

    if (req.file)
    {
      console.log("Changeing Picture now to: "+ req.file.filename);
      user.profile.picture = req.file.filename;
    }

    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/signup_info');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Profile information has been updated.' });
      res.redirect('/com');
    });
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * GET /signup_info
 * Signup Info page.
 */
exports.getSignupInfo = (req, res) => {

  res.render('account/signup_info', {
    title: 'Add Information'
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getMe = (req, res) => {

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
  .populate({ 
       path: 'posts.comments.actor',
       model: 'Actor'
    })
  .exec(function (err, user) {
    if (err) { return next(err); }

    var allPosts = user.getPostsAndReplies();

    res.render('me', { posts: allPosts.reverse() });

  });


};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.profile.bio = req.body.bio || '';

    if (req.file)
    {
      console.log("Changeing Picture now to: "+ req.file.filename);
      user.profile.picture = req.file.filename;
    }

    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Profile information has been updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.password = req.body.password;
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('info', { msg: `${provider} account has been unlinked.` });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  const resetPassword = () =>
    User
      .findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .then((user) => {
        if (!user) {
          req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
          return res.redirect('back');
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return user.save().then(() => new Promise((resolve, reject) => {
          req.logIn(user, (err) => {
            if (err) { return reject(err); }
            resolve(user);
          });
        }));
      });

  const sendResetPasswordEmail = (user) => {
    if (!user) { return; }
    const transporter = nodemailer.createTransport({
      service: 'SendPulse',
      auth: {
        user: process.env.SENDPULSE_USER,
        pass: process.env.SENDPULSE_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'admin@eatsnap.love',
      subject: 'Your eatsnap.love password has been changed',
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };
    return transporter.sendMail(mailOptions)
      .then(() => {
        req.flash('success', { msg: 'Success! Your password has been changed.' });    
      });
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => { if (!res.finished) res.redirect('/'); })
    .catch(err => next(err));
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};


/**
 * Mail A user a Reminder
 * 
 */
var sendReminderEmail = function(user){
    if (!user) { return; }
    var u_name = user.profile.name || user.email || 'buddy';
    const transporter = nodemailer.createTransport({
      service: '"Mailgun"',
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASSWORD
      },
      debug: true
    });

    const mailOptions = {
      to: user.email,
      from: 'do-not-reply@eatsnap.love',
      subject: 'Remember to Check Out 🍴📷.❤️ Today',
      text: `Hey ${u_name},\n\n
      Just wanted to remind you to visit https://eatsnap.love today.\n
      Your participation in our study is a huge help in beta testing the app.
      Remember to fully participate in the study you must:\n
      * create one new post each day\n 
      * login and view posts twice a day\n\n
      Thanks again for all your help and participation!\n
      Keep Eating, Snapping and Loving!\n 
      🍴📷.❤️ Team
      \n`
    };
    transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log('Error occurred');
              console.log(error.message);
              return;
          }
          console.log('Message sent successfully!');
          console.log('Server responded with "%s"', info.response);
          transporter.close();
      });
      
  };

/**
 * Mail A user a Reminder
 * 
 */
var sendFinalEmail = function(user){
    if (!user) { return; }
    console.log("!!!!!!SENDING FINAL E_MAIL!!!!")
    var u_name = user.profile.name || user.email || 'buddy';
    const transporter = nodemailer.createTransport({
      service: '"Mailgun"',
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASSWORD
      },
      debug: true
    });

    const mailOptions = {
      to: user.email,
      from: 'do-not-reply@eatsnap.love',
      subject: 'Final Survey For Study for 🍴📷.❤️ ',
      text: `Hey ${u_name},\n\n
      Thank you so much for participating in our study!\n
      Your participation has been a huge help in beta testing our app.
      You have one last task to finish the study, and that is to take the final survey here at  `+process.env.POST_SURVEY+user.mturkID+`\n\n
      Thanks again for all your help and participation!\n
      Keep Eating, Snapping and Loving!\n 
      🍴📷.❤️ Team
      \n`
    };
    transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log('Error occurred');
              console.log(error.message);
              return;
          }
          console.log('Message sent successfully!');
          console.log('Server responded with "%s"', info.response);
          transporter.close();
      });
      
  };

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.mailAllActiveUsers = () => {
  console.log('$%^$%$#%$#$%%&^%&^%^&%&^$^%$%$^% MAILING ALL USERS NOW!!!!!!!!!!!!!!!'); 
  User.find().where('active').equals(true).exec(    
    function(err, users){
    
    // handle error
    if (err) {
      console.log('failed: ' + err);
    } else {
      // E-mail all active users
      for (var i = users.length - 1; i >= 0; i--) {   
        //e-mail all non-Admins
        if (!users[i].isAdmin)
        {
          sendReminderEmail(users[i]);
        }
      }  
    }    
  });
};


/**
 * Turn off all old accounts. Groundhog admin accounts
 */
exports.stillActive = () => {
  User.find().where('active').equals(true).exec(    
    function(err, users){
    
    // handle error
    if (err) {
      console.log('failed: ' + err);
    } else {
      // E-mail all active users
      for (var i = users.length - 1; i >= 0; i--) {
        console.log("Looking at user "+users[i].email);      
        var time_diff = Date.now() - users[i].createdAt;
        var three_days = 259200000;

        console.log("Time period is  "+time_diff);  
        console.log("Three days is  "+three_days);
        if (time_diff >= three_days)
        {
            if (users[i].isAdmin)
            {
              users[i].createdAt = Date.now();
              users[i].save((err) => {
                if (err) { return next(err); }
              console.log("Switch over to new day");
              });
            }

            //normal user, turn off
            else
            {
              users[i].active = false;
              console.log("turning off user "+users[i].email);
              sendFinalEmail(users[i]);
              users[i].save((err) => {
                if (err) { return next(err); }
              console.log("Success in turning off");
              });
            }
        }
        
      }  
    }    
  });
};

/**
 * Basic information on Users that Finished the study
 */
exports.userTestResults = (req, res) => {
  //only admin can do this
  if (!req.user.isAdmin)
  {
    res.redirect('/');
  }
  //we are admin
  else
  {

    User.find().where('active').equals(false).exec(    
      function(err, users){
      
      // handle error
      if (err) {
        console.log('failed: ' + err);
      } else {
        // E-mail all active users
        for (var i = users.length - 1; i >= 0; i--) {  
          console.log("@@@@@@@@@@Looking at user "+users[i].email);      
          var time_diff = Date.now() - users[i].createdAt;
          var three_days = 259200000;
          var one_day =     86400000;

          //check if completed or not yet 
          if (!users[i].completed)
          {

            /*
            //check logs
            var day = [0,0,0];
            for (var j = users[i].log.length - 1; j >= 0; j--) {

              var logtime = users[i].log[j].time - users[i].createdAt;
              //console.log("logtime is "+logtime);
              

              //day one
              if (logtime <= one_day)
              {
                day[0]++;
                //console.log("!!!DAY1");
              }
              //day two
              else if ((logtime >=one_day) && (logtime <= (one_day *2))) 
              {
                day[1]++;
                //console.log("!!!DAY2");
              }
              //day 3
              else if ((logtime >=(one_day *2)) && (logtime <= three_days))
              {
                day[2]++;
                //console.log("!!!DAY3");
              }

            }//end of LOG for loop
          
            console.log("@@@@@@@@days are d1:"+day[0]+" d2:"+day[1]+" d3:"+day[2]);
            //Logged in at least twice a day, and posted at least 3 times
            */
            if (users[i].study_days[0] >=2 && users[i].study_days[1] >=2 && users[i].study_days[2] >=2 && users[i].numPosts >= 2)
            {
              users[i].completed = true;
              users[i].save((err) => {
                if (err) { return next(err); }
              console.log("I'm Finished!!!!");
              });
            }
          }//if User.completed
          
        }//for loop for all users!  

        res.render('completed', { users: users });

      }///else no error    
    });//User.Find()
  }
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  const createRandomToken = crypto
    .randomBytesAsync(16)
    .then(buf => buf.toString('hex'));

  const setRandomToken = token =>
    User
      .findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('errors', { msg: 'Account with that email address does not exist.' });
        } else {
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          user = user.save();
        }
        return user;
      });

  const sendForgotPasswordEmail = (user) => {
    if (!user) { return; }
    const token = user.passwordResetToken;
    const transporter = nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'do-not-reply@eatsnap.love',
      subject: 'Reset your password on eatsnap.love',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    return transporter.sendMail(mailOptions)
      .then(() => {
        req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => res.redirect('/forgot'))
    .catch(next);
};
