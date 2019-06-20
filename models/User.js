const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  username: String,
  active: {type: Boolean, default: true},
  isAdmin: {type: Boolean, default: false},

  completed: {type: Boolean, default: false},

  numPosts: { type: Number, default: -1 }, //not including replys
  numReplies: { type: Number, default: -1 }, //not including posts
  numComments: { type: Number, default: -1 }, //not including posts
  numActorReplies: { type: Number, default: -1 }, //not including posts

  numPostLikes: { type: Number, default: 0 }, 
  numCommentLikes: { type: Number, default: 0 }, 

  lastNotifyVisit: Date,

  mturkID: String,

  group: String, //full group type
  ui: String,    //just UI type (no or ui)
  notify: String, //notification type (no, low or high)
  script_type: String, //type of script they are running in
  post_nudge: String, //yes/no on post nudge

  transparency: String,    //just UI type (no or yes)
  profile_perspective: String, //notification type (no, low or high)
  comment_prompt: String, //notification type (no or yes)

  tokens: Array,

  blocked: [String],
  reported: [String],

  study_days: {
      type: [Number],
      default: [0, 0, 0]
    },

  posts: [new Schema({
    type: String, //post, reply, actorReply

    postID: Number,  //number for this post (1,2,3...) reply get -1 maybe should change to a String ID system
    body: {type: String, default: '', trim: true}, //body of post or reply
    picture: String, //picture for post
    liked: {type: Boolean, default: false}, //has the user liked it?

    //Actor Comments for User Made Posts
    comments: [new Schema({
      //class: String, //Bully, Marginal, normal, etc
      actor: {type: Schema.ObjectId, ref: 'Actor'},
      body: {type: String, default: '', trim: true}, //body of post or reply
      commentID: Number, //ID of the comment
      time: Number,//millisecons
      absTime: Number,//millisecons
      new_comment: {type: Boolean, default: false}, //is new comment
      isUser: {type: Boolean, default: false}, //is this a comment on own post
      liked: {type: Boolean, default: false}, //has the user liked it? 
      flagged: {type: Boolean, default: false},//is Flagged?
      likes: Number
      }, { versionKey: false })],

    replyID: Number, //use this for User Replies
    reply: {type: Schema.ObjectId, ref: 'Script'}, //Actor Post reply is to =>

    actorReplyID: Number, //An Actor reply to a User Post
    actorReplyOBody: String, //Original Body of User Post
    actorReplyOPicture: String, //Original Picture of User Post
    actorReplyORelativeTime: Number,
    actorAuthor: {type: Schema.ObjectId, ref: 'Actor'},

    absTime: Date,
    relativeTime: {type: Number}
    })],

  log: [new Schema({
    time: Date,
    userAgent: String,
    ipAddress: String
    })],

  pageLog: [new Schema({
    time: Date,
    page: String
    })],

  postStats: [new Schema({
    postID: Number,
    citevisits: Number,
    generalpagevisit: Number,
    DayOneVists: Number,
    DayTwoVists: Number,
    DayThreeVists: Number,
    GeneralLikeNumber: Number,
    GeneralPostLikes:Number,
    GeneralCommentLikes:Number,
    GeneralFlagNumber: Number,
    GeneralPostNumber: Number,
    GeneralCommentNumber: Number
    })],

  blockAndReportLog: [new Schema({
    time: Date,
    action: String,
    report_issue: String,
    actorName: String
    })],

  profile_feed: [new Schema({
    profile: String,
    startTime: Number, //always the newest startTime (full date in ms)
    rereadTimes: Number,
    readTime : [Number],
    picture_clicks : [Number],
    })],

  feedAction: [new Schema({
        post: {type: Schema.ObjectId, ref: 'Script'},
        //add in object to see which comments were linked and flagged
        postClass: String,
        rereadTimes: Number, //number of times post has been viewed by user
        startTime: {type: Number, default: 0}, //always the newest startTime (full date in ms)
        liked: {type: Boolean, default: false},
        readTime : [Number],
        flagTime  : [Number],
        likeTime  : [Number],
        replyTime  : [Number],
        
        comments: [new Schema({
          comment: {type: Schema.ObjectId},//ID Reference for Script post comment
          liked: {type: Boolean, default: false}, //is liked?
          flagged: {type: Boolean, default: false},//is Flagged?
          flagTime  : [Number], //array of flag times
          likeTime  : [Number], //array of like times

          new_comment: {type: Boolean, default: false}, //is new comment
          new_comment_id: Number,//ID for comment
          comment_body: String, //Original Body of User Post
          absTime: Date,
          commentTime: {type: Number},
          time: {type: Number}
          },{_id: true, versionKey: false })]
    }, {_id: true, versionKey: false })],

  profile: {
    name: String,
    gender: String,
    location: String,
    bio: String,
    website: String,
    picture: String
  }
}, { timestamps: true, versionKey: false });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Add Log to User if access is 1 hour from last use.
 */
userSchema.methods.logUser = function logUser(time, agent, ip) {
  
  if(this.log.length > 0)
  {
    var log_time = new Date(this.log[this.log.length -1].time);

    if(time >= (log_time.getTime() + 3600000))
    {
      var log = {};
      log.time = time;
      log.userAgent = agent;
      log.ipAddress = ip;
      this.log.push(log);
    }
  }
  else if(this.log.length == 0)
  {
    var log = {};
    log.time = time;
    log.userAgent = agent;
    log.ipAddress = ip;
    this.log.push(log);
  }

};

userSchema.methods.logPage = function logPage(time, page) {

    let log = {};
    log.time = time;
    log.page = page;
    this.pageLog.push(log);
};

userSchema.methods.logPostStats = function logPage(postID) {

    let log = {};
    log.postID = postID;
    log.citevisits = this.log.length;
    log.generalpagevisit = this.pageLog.length;

    if (this.study_days.length > 0)
        {
          log.DayOneVists = this.study_days[0];
          log.DayTwoVists = this.study_days[1];
          log.DayThreeVists = this.study_days[2];
        }

    log.GeneralLikeNumber = this.numPostLikes + this.numCommentLikes;
    log.GeneralPostLikes = this.numPostLikes;
    log.GeneralCommentLikes = this.numCommentLikes;
    log.GeneralFlagNumber = 0;


    for (var k = this.feedAction.length - 1; k >= 0; k--) 
    {    
      if(this.feedAction[k].post != null)
      {
        if(this.feedAction[k].liked)
        {
          //log.GeneralLikeNumber++;
        }
        //total number of flags
        if(this.feedAction[k].flagTime[0])
        {
          log.GeneralFlagNumber++;
        }
      }
    }

    log.GeneralPostNumber = this.numPosts + 1;
    log.GeneralCommentNumber = this.numComments + 1;

    this.postStats.push(log);
};

/**
 * Helper method for getting all User Posts.
 */
userSchema.methods.getPosts = function getPosts() {
  var temp = [];
  for (var i = 0, len = this.posts.length; i < len; i++) {
    if (this.posts[i].postID >= 0)
     temp.push(this.posts[i]);
  }

  //sort to ensure that posts[x].postID == x
  temp.sort(function (a, b) {
    return a.postID - b.postID;
  });

  return temp;

};

/**
 * Helper method for getting all User Posts and replies.
 */
userSchema.methods.getPostsAndReplies = function getPostsAndReplies() {
  var temp = [];
  for (var i = 0, len = this.posts.length; i < len; i++) {
    if (this.posts[i].postID >= 0 || this.posts[i].replyID >= 0)
     temp.push(this.posts[i]);
  }

  //sort to ensure that posts[x].postID == x
  temp.sort(function (a, b) {
    return a.absTime - b.absTime;
  });

  return temp;

};

//Return the user post from its ID
userSchema.methods.getUserPostByID = function(postID) {
  
  return this.posts.find(x => x.postID == postID);

};


//Return the user reply from its ID
userSchema.methods.getUserReplyByID = function(replyID) {
  
  return this.posts.find(x => x.replyID == replyID);

};

//Return the user reply from its ID
userSchema.methods.getActorReplyByID = function(actorReplyID) {
  
  return this.posts.find(x => x.actorReplyID == actorReplyID);

};

//get user posts within the min/max time period 
userSchema.methods.getPostInPeriod = function(min, max) {
    //concat posts & reply
    return this.posts.filter(function(item) {
        return item.relativeTime >= min && item.relativeTime <= max;
    });
}

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

/* Garbage snips
    new Schema({ //{type: Schema.ObjectId, ref: 'Script'},
      body: {type: String, default: '', trim: true},
      picture: String,
      time: Number,
      actorName: String,
      actorPicture: String,
      actorUserName: String}),
    */
