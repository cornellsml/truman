/**
 * Module dependencies.
 */
const express = require('express');
const _ = require('lodash');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
var schedule = require('node-schedule');

const multer = require('multer');
//Math.random().toString(36)+'00000000000000000').slice(2, 10) + Date.now()

var m_options = multer.diskStorage({ destination : path.join(__dirname, 'uploads') ,
  filename: function (req, file, cb) {
    var prefix = req.user.id + Math.random().toString(36).slice(2, 10);
    cb(null, prefix + file.originalname.replace(/[^A-Z0-9]+/ig, "_"));
  }
});

var userpost_options = multer.diskStorage({ destination : path.join(__dirname, 'uploads/user_post') ,
  filename: function (req, file, cb) {
    var lastsix = req.user.id.substr(req.user.id.length - 6);
    var prefix = lastsix + Math.random().toString(36).slice(2, 10);
    cb(null, prefix + file.originalname.replace(/[^A-Z0-9]+/ig, "_"));
  }
});

var useravatar_options = multer.diskStorage({ destination : path.join(__dirname, 'uploads/user_post') ,
  filename: function (req, file, cb) {
    var prefix = req.user.id + Math.random().toString(36).slice(2, 10);
    cb(null, prefix + file.originalname.replace(/[^A-Z0-9]+/ig, "_"));
  }
});

//const upload = multer({ dest: path.join(__dirname, 'uploads') });
const upload= multer({ storage: m_options });
const userpostupload= multer({ storage: userpost_options });
const useravatarupload= multer({ storage: useravatar_options });


/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
//dotenv.config({ path: '.env.example' });
dotenv.config({ path: '.env' });

/**
 * Controllers (route handlers).
 */
const actorsController = require('./controllers/actors');
const scriptController = require('./controllers/script');
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const notificationController = require('./controllers/notification');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, { useNewUrlParser: true });
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

//userController.mailAllActiveUsers()
/****
**CRON JOBS
** Mailing Users
*/
var rule = new schedule.RecurrenceRule();
rule.hour = 4;
rule.minute = 55;
 
var j = schedule.scheduleJob(rule, function(){
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  console.log('@@@@@@######@@@@@@@@Sending Mail to All ACTIVE USERS!!!!!');
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  userController.mailAllActiveUsers();
}); 


/****
**CRON JOBS 
**Check if users are still active 12 and 20
*/
var rule1 = new schedule.RecurrenceRule();
rule1.hour = 4;
rule1.minute = 30;
 
var j = schedule.scheduleJob(rule1, function(){
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  console.log('@@@@@@######@@@@@@@@Checking if Users are active!!!!!');
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  userController.stillActive();
}); 

/****
**CRON JOBS 
**Check if users are still active 12 and 20
*/
var rule2 = new schedule.RecurrenceRule();
rule2.hour = 12;
rule2.minute = 30;
 
var j2 = schedule.scheduleJob(rule2, function(){
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  console.log('@@@@@@######@@@@@@@@2222 Checking if Users are active 2222!!!!!');
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  userController.stillActive();
}); 

/****
**CRON JOBS 
**Check if users are still active 12 and 20
*/
var rule3 = new schedule.RecurrenceRule();
rule3.hour = 20;
rule3.minute = 30;
 
var j3 = schedule.scheduleJob(rule3, function(){
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  console.log('@@@@@@######@@@@@@@@3333 Checking if Users are active 3333!!!!!');
  console.log('@@@@@@######@@@@@@@@#########@@@@@@@@@@@@########');
  userController.stillActive();
}); 


/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(expressStatusMonitor());
//app.use(compression());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  rolling: false,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    maxAge: 7200000
  },
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true,
    clear_interval: 3600
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());



app.use((req, res, next) => {
  if ((req.path === '/api/upload') || (req.path === '/post/new') || (req.path === '/account/profile') || (req.path === '/account/signup_info_post')) {
    console.log("Not checking CSRF - out path now");
    //console.log("@@@@@request is " + req);
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});

//app.use(lusca.xframe('SAMEORIGIN'));
//allow-from https://example.com/
//add_header X-Frame-Options "allow-from https://cornell.qualtrics.com/";
//app.use(lusca.xframe('allow-from https://cornell.qualtrics.com/'));
app.use(lusca.xssProtection(true));

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      req.path !== '/bell' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
    console.log("@@@@@path is now");
    console.log(req.path);
    req.session.returnTo = req.path;
  } else if (req.user &&
      req.path == '/account') {
    console.log("!!!!!!!path is now");
    console.log(req.path);
    req.session.returnTo = req.path;
  }
  next();
});

var csrf = lusca({ csrf: true });

function check(req, res, next) {
    console.log("@@@@@@@@@@@@Body is now ");
    console.log(req.body);
    next();
}


app.use('/public',express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/semantic',express.static(path.join(__dirname, 'semantic'), { maxAge: 31557600000 }));
app.use(express.static(path.join(__dirname, 'uploads'), { maxAge: 31557600000 }));
app.use('/post_pictures', express.static(path.join(__dirname, 'post_pictures'), { maxAge: 31557600000 }));
app.use('/profile_pictures',express.static(path.join(__dirname, 'profile_pictures'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', passportConfig.isAuthenticated, scriptController.getScript);

app.get('/newsfeed/:caseId', scriptController.getScriptFeed);

app.post('/post/new', userpostupload.single('picinput'), check, csrf, scriptController.newPost);

app.post('/account/profile', passportConfig.isAuthenticated, useravatarupload.single('picinput'), check, csrf, userController.postUpdateProfile);
//app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);

app.get('/tos', function (req, res) {
  res.render('tos', {
    title: 'TOS'
  });
})

app.get('/com', function (req, res) {
  res.render('com', {
    title: 'Community Rules'
  });
});

app.get('/info', passportConfig.isAuthenticated, function (req, res) {
  res.render('info', {
    title: 'User Docs'
  });
});

app.get('/profile_info', passportConfig.isAuthenticated, function (req, res) {
  res.render('profile_info', {
    title: 'Profile Introductions'
  });
});


//User's Page
app.get('/me', passportConfig.isAuthenticated, userController.getMe);

app.get('/completed', passportConfig.isAuthenticated, userController.userTestResults);

app.get('/notifications', passportConfig.isAuthenticated, notificationController.getNotifications);

app.get('/test_comment', function (req, res) {
  res.render('test', {
    title: 'Test Comments'
  });
});

app.get('/pri', function (req, res) {
  console.log("@@@@@query    ",req.query.c);
  res.render('pri', {
    title: 'Test Privacy',
    condis: req.query.c
  });
});

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);

app.get('/account/signup_info', passportConfig.isAuthenticated, userController.getSignupInfo);
app.post('/account/signup_info_post', passportConfig.isAuthenticated, useravatarupload.single('picinput'), check, csrf, userController.postSignupInfo);

app.post('/account/profile', passportConfig.isAuthenticated, useravatarupload.single('picinput'), check, csrf, userController.postUpdateProfile);


app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);

app.get('/user/:userId', passportConfig.isAuthenticated, actorsController.getActor);
app.post('/user', passportConfig.isAuthenticated, actorsController.postBlockOrReport);

app.get('/bell', passportConfig.isAuthenticated, userController.checkBell);

//getScript
app.get('/feed', passportConfig.isAuthenticated, scriptController.getScript);
app.post('/feed', passportConfig.isAuthenticated, scriptController.postUpdateFeedAction);
app.post('/pro_feed', passportConfig.isAuthenticated, scriptController.postUpdateProFeedAction);
app.post('/userPost_feed', passportConfig.isAuthenticated, scriptController.postUpdateUserPostFeedAction);

/**
 * Error Handler.
 */
app.use(errorHandler());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env')); 
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
