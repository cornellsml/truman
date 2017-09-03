#! /usr/bin/env node

console.log('This data export is running!!!!');


const async = require('async')
const Actor = require('./models/Actor.js');
const Script = require('./models/Script.js');
const User = require('./models/User.js');
const _ = require('lodash');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs')
var UAParser = require('ua-parser-js');


var csvWriter = require('csv-write-stream');
var mlm_writer = csvWriter();
var s_writer = csvWriter();
var summary_writer = csvWriter();

var bully_messages = ["59794b948ecab254bb6a7c92",
"59794b948ecab254bb6a7c93",
"59794b948ecab254bb6a7c94",
"59794b948ecab254bb6a7c95"];
var bully_stats = [];

Array.prototype.sum = function() {
    return this.reduce(function(a,b){return a+b;});
};



var victim = "5978ffc618bf097f8cf39ac4";
var bully = "5978ffc618bf097f8cf39ab4";
var bully_name = "bblueberryy";

var mlm_array = [];

dotenv.load({ path: '.env' });

var MongoClient = require('mongodb').MongoClient
 , assert = require('assert');


//var connection = mongo.connect('mongodb://127.0.0.1/test');
mongoose.connect(process.env.PRO_MONGODB_URI || process.env.PRO_MONGOLAB_URI);
var db = mongoose.connection;
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

User.find()
  .where('active').equals(false)
  .populate({ 
         path: 'feedAction.post',
         model: 'Script',
         populate: {
           path: 'actor',
           model: 'Actor'
         } 
      })
  .exec(    
    function(err, users){

      mlm_writer.pipe(fs.createWriteStream('results/mlm_eatsnaplove.csv'));
      s_writer.pipe(fs.createWriteStream('results/sur_eatsnaplove.csv'));
      summary_writer.pipe(fs.createWriteStream('results/sum_eatsnaplove.csv'));

      for (var i = users.length - 1; i >= 0; i--) 
      {

        var mlm = {};
        var sur = {};
        var sums = {};
        mlm.id = users[i].mturkID;
        sur.id = users[i].mturkID;
        sums.id = users[i].mturkID;


        mlm.email = users[i].email;
        sur.email = users[i].email;
        sums.email = users[i].email;

        mlm.StartDate = users[i].createdAt;
        sur.StartDate = users[i].createdAt;
        sums.StartDate = users[i].createdAt;

        console.log("In User "+ users[i].email);

        //UI
        if (users[i].ui == 'ui')
        {
          mlm.ViewNotification = 1;
          sur.ViewNotification = 1;
        }
        else
        {
          mlm.ViewNotification = 0;
          sur.ViewNotification = 0;
        }

        //READ NOTIFY
        if (users[i].notify == 'high')
        {
          mlm.HighBystanders = 2;
          sur.HighBystanders = 2;
        }
        else if (users[i].notify == 'low')
        {
          mlm.HighBystanders = 1;
          sur.HighBystanders = 1;
        }
        else
        {
          mlm.HighBystanders = 0;
          sur.HighBystanders = 0;
        }

        if (users[i].profile.name)
        {
          mlm.ProfileName = 1;
          sur.ProfileName = 1;
        }
        else
        {
          mlm.ProfileName = 0;
          sur.ProfileName = 0;
        }

        if (users[i].profile.location)
        {
          mlm.ProfileLocation = 1;
          sur.ProfileLocation = 1;
        }
        else
        {
          mlm.ProfileLocation = 0;
          sur.ProfileLocation = 0;
        }

        if (users[i].profile.bio)
        {
          mlm.ProfileBio = 1;
          sur.ProfileBio = 1;
        }
        else
        {
          mlm.ProfileBio = 0;
          sur.ProfileBio = 0;
        }

        if (users[i].profile.picture)
        {
          mlm.ProfilePicture = 1;
          sur.ProfilePicture = 1;
        }
        else
        {
          mlm.ProfilePicture = 0;
          sur.ProfilePicture = 0;
        }

        var parser = new UAParser();

        if(users[i].log[0])
        {

          if (parser.setUA(users[i].log[0].userAgent).getDevice().type)
          {
            mlm.Device = parser.setUA(users[i].log[0].userAgent).getDevice().type;
          }
          else
            mlm.Device = "Computer";
        

        
          sur.Device = mlm.Device;

          mlm.Broswer = parser.setUA(users[i].log[0].userAgent).getBrowser().name;
          sur.Broswer = mlm.Broswer;

          mlm.OS = parser.setUA(users[i].log[0].userAgent).getOS().name;
          sur.OS = mlm.OS;
        }//if Log exists
        else{
          mlm.Device = "NA";
          mlm.Broswer = "NA";
          mlm.OS = "NA";

          sur.Device = "NA";
          sur.Broswer = "NA";
          sur.OS = "NA";

        }
        

        mlm.notificationpage = 0;
        mlm.numberbullypage = 0;
        mlm.numbervictimpage = 0;
        mlm.generalpagevisit = 0;
        for(var z = 0; z < users[i].pageLog.length; ++z){
            if(users[i].pageLog[z].page == "Notifications")
              mlm.notificationpage++;
            else if (users[i].pageLog[z].page == bully_name)
              mlm.numberbullypage++;
            else if (users[i].pageLog[z].page == "casssssssssie")
              mlm.numbervictimpage++;
            else
              mlm.generalpagevisit++;
        }
        sur.notificationpage = mlm.notificationpage;
        sur.numberbullypage = mlm.numberbullypage;
        sur.numbervictimpage = mlm.numbervictimpage;
        sur.generalpagevisit = mlm.generalpagevisit;

        mlm.citevisits = users[i].log.length;
        sur.citevisits = users[i].log.length;
        sums.citevisits = users[i].log.length;

        if (users[i].completed)
        {
          mlm.CompletedStudy = 1;
          sur.CompletedStudy = 1;
        }
        else
        {
          mlm.CompletedStudy = 0;
          sur.CompletedStudy = 0;
        }

        //per feedAction
        mlm.VictimNoBullyReplies = 0;
        mlm.VictimNoBullyLikes = 0;
        mlm.BullyNoBullyReplies = 0;
        mlm.BullyNoBullyLikes = 0;
        mlm.GeneralLikeNumber = 0;
        mlm.GeneralFlagNumber = 0;
        mlm.AveReadTime = 0;
        mlm.TotalNumberRead = 0;
        mlm.TotalNonBullyPostRead = 0;
        var bullyLikes = 0;
        var bullyReplies = 0;
        var bullyReads = 0;
        var bullyReadTimes = 0;
        var bullyFlag = 0;
        
        //per feedAction
        for (var k = users[i].feedAction.length - 1; k >= 0; k--) 
        {
          //is a bully message
          if(users[i].feedAction[k].post.id == bully_messages[0] || users[i].feedAction[k].post.id == bully_messages[1] || users[i].feedAction[k].post.id == bully_messages[2]||users[i].feedAction[k].post.id == bully_messages[3])
          {
            if(users[i].feedAction[k].replyTime[0])
            {
              bullyReplies++;
            }

            if(users[i].feedAction[k].liked)
            {
              bullyLikes++;
            }

            if(users[i].feedAction[k].flagTime[0])
            {
              bullyFlag++;
            }

            if(users[i].feedAction[k].readTime[0])
            {
              bullyReads++;
              bullyReadTimes += users[i].feedAction[k].readTime.sum() / users[i].feedAction[k].readTime.length; 
            }

          }

          //not a bully message
          else 
          {
            //Victim stats
            if (users[i].feedAction[k].post.actor.id == victim)
            {
              if(users[i].feedAction[k].replyTime[0])
              {
                mlm.VictimNoBullyReplies++;
              }

              if(users[i].feedAction[k].liked)
              {
                mlm.VictimNoBullyLikes++;
              }
            }

            //bully stats
            if (users[i].feedAction[k].post.actor.id == bully)
            {
              if(users[i].feedAction[k].replyTime[0])
              {
                mlm.BullyNoBullyReplies++;
              }

              if(users[i].feedAction[k].liked)
              {
                mlm.BullyNoBullyLikes++;
              }
            }

            //total number of likes
            if(users[i].feedAction[k].liked)
            {
              mlm.GeneralLikeNumber++;
            }

            //total number of flags
            if(users[i].feedAction[k].flagTime[0])
            {
              mlm.GeneralFlagNumber++;
            }

            //total read times, and average of all reads
            if(users[i].feedAction[k].readTime[0])
            {
              mlm.TotalNonBullyPostRead++;
              mlm.AveReadTime += users[i].feedAction[k].readTime.sum() / users[i].feedAction[k].readTime.length;
              
            }
          }


        }//for Per FeedAction

        //get totalAverage
        mlm.AveReadTime = mlm.AveReadTime/mlm.TotalNonBullyPostRead;
        mlm.TotalNumberRead = mlm.TotalNonBullyPostRead + bullyReads;
        mlm.GeneralReplyNumber = users[i].numReplies + 1 - bullyReplies;
        mlm.GeneralPostNumber = users[i].numPosts + 1;

        //per bully post 1-4
        for (var n = 0; n < bully_messages.length; n++) 
        {  

          console.log("I (user) is now "+i);
          console.log(" Bully message  "+ n);
          

          var feedIndex = _.findIndex(users[i].feedAction, function(o) { return o.post.id == bully_messages[n]; });

          if(feedIndex!=-1)
          {
            mlm.BullyingPost  = n + 1;
            console.log(":"+mlm.BullyingPost+" IF FI MLM Bully message");
            //last read time
            if(users[i].feedAction[feedIndex].readTime[0])
            {
              mlm.BullyPostLastReadTime = users[i].feedAction[feedIndex].readTime[users[i].feedAction[feedIndex].readTime.length - 1];
              mlm.BullyPostAverageReadTime = users[i].feedAction[feedIndex].readTime.sum() / users[i].feedAction[feedIndex].readTime.length;
              mlm.BullyPostNumOfReadTimes = users[i].feedAction[feedIndex].readTime.length;
            }
            else 
            {
              mlm.BullyPostLastReadTime = -1;
              mlm.BullyPostAverageReadTime = 0
              mlm.BullyPostNumOfReadTimes = 0
            }

            if(users[i].feedAction[feedIndex].flagTime[0])
            {
              mlm.Flag = 1;
              mlm.FlagTime = users[i].feedAction[feedIndex].flagTime[0];
            }
            else 
            {
              mlm.Flag = 0;
              mlm.FlagTime = 0;
            }

            if(users[i].feedAction[feedIndex].likeTime[0])
            {
              mlm.Like = 1;
              mlm.LikeTime = users[i].feedAction[feedIndex].likeTime[0];
            }
            else 
            {
              mlm.Like = 0;
              mlm.LikeTime = 0;
            }

            if(users[i].feedAction[feedIndex].replyTime[0])
            {
              mlm.Reply = 1;
              mlm.ReplyTime = users[i].feedAction[feedIndex].replyTime[0];
            }
            else 
            {
              mlm.Reply = 0;
              mlm.ReplyTime = 0;
            }

            mlm_array.push(mlm);
            console.log(":"+mlm.BullyingPost+" Before WRITE MLM Bully message");
            mlm_writer.write(mlm_array[mlm_array.length - 1]);
            console.log(":"+mlm.BullyingPost+" After WRITE MLM Bully message");

          }//end of if FI != 1

          else
          {
            mlm.BullyingPost  = n + 1;
            console.log(":"+mlm.BullyingPost+" ELSE MLM Bully message");
            
            mlm.BullyPostLastReadTime = 0;
            mlm.BullyPostAverageReadTime = 0;
            mlm.BullyPostNumOfReadTimes = 0;
            mlm.Flag = 0;
            mlm.FlagTime = 0;
            mlm.Like = 0;
            mlm.LikeTime = 0;
            mlm.Reply = 0;
            mlm.ReplyTime = 0;

            mlm_array.push(mlm);
            
            console.log(":"+mlm.BullyingPost+" Before WRITE MLM Bully message");
            mlm_writer.write(mlm_array[mlm_array.length - 1]);
            console.log(":"+mlm.BullyingPost+" After WRITE MLM Bully message");
            
          }

          //console.log("Before WRITE MLM Bully message  "+ mlm.BullyingPost);
          //mlm_writer.write(mlm);
          //console.log("After WRITE MLM Bully message  "+ mlm.BullyingPost);
        }//for Bully Messages





      //time to do survival
      if (users[i].blocked.includes(bully_name))
      {
        var block_index = _.findIndex(users[i].blockAndReportLog, function(o) { return (o.actorName == bully_name && o.action =="block"); });
        sur.blocked = 1;
        sur.BlockMilliSeconds = users[i].blockAndReportLog[block_index].time - users[i].createdAt;
      }
      else
      {
        sur.blocked = 0;
        sur.BlockMilliSeconds = 259200000;
      }

      if (users[i].reported.includes(bully_name))
      {
        var report_index = _.findIndex(users[i].blockAndReportLog, function(o) { return (o.actorName == bully_name && o.action =="report"); });
        sur.reported = 1;
        sur.ReportMilliSeconds = users[i].blockAndReportLog[report_index].time - users[i].createdAt;
        sur.reportIssue = users[i].blockAndReportLog[report_index].report_issue;
      }
      else
      {
        sur.reported = 0;
        sur.ReportMilliSeconds = 259200000;
        sur.reportIssue = "";
      }

      sur.VictimNoBullyReplies = mlm.VictimNoBullyReplies;
      sur.VictimNoBullyLikes = mlm.VictimNoBullyLikes;
      sur.BullyNoBullyReplies = mlm.BullyNoBullyReplies + bullyReplies;
      sur.BullyNoBullyLikes = mlm.BullyNoBullyLikes + bullyLikes;
      sur.GeneralLikeNumber = mlm.GeneralLikeNumber + bullyLikes;
      sur.GeneralFlagNumber = mlm.GeneralFlagNumber + bullyFlag;
      sur.GeneralReplyNumber = mlm.GeneralReplyNumber + bullyReplies;
      sur.GeneralPostNumber = mlm.GeneralPostNumber;
      sur.TotalNumberRead = mlm.TotalNumberRead;
      sur.AveReadTime = mlm.AveReadTime;
      sur.ReplyBullyPost = bullyReplies;
      sur.LikeBullyPost = bullyLikes;
      sur.FlagBullyPost = bullyFlag;


      s_writer.write(sur);

      sums.GeneralPostNumber = mlm.GeneralPostNumber;
      sums.GeneralReplyNumber = mlm.GeneralReplyNumber + bullyReplies;
      summary_writer.write(sums);

    }//for each user
      
    mlm_writer.end();
    s_writer.end();
    summary_writer.end();
    console.log('Wrote MLM!');
    mongoose.connection.close();

  });

