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

var csvWriter = require('csv-write-stream');
var mlm_writer = csvWriter();
var s_writer = csvWriter();

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

      for (var i = users.length - 1; i >= 0; i--) {

        var mlm = {};
        mlm.id = users[i].id;

        //UI
        if (users[i].ui == 'ui')
        {
          mlm.ViewNotification = 1;
        }
        else
        {
          mlm.ViewNotification = 0;
        }

        //READ NOTIFY
        if (users[i].notify == 'high')
        {
          mlm.HighBystanders = 2;
        }
        else if (users[i].notify == 'low')
        {
          mlm.HighBystanders = 1;
        }
        else
        {
          mlm.HighBystanders = 0;
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
        //per feedAction
        console.log("In User "+ users[i].email);
        for (var k = users[i].feedAction.length - 1; k >= 0; k--) 
        {
          console.log("In User "+ users[i].email);
          console.log("Checking post "+ users[i].feedAction[k].id);
          console.log("Checking post actor "+ users[i].feedAction[k].post.actor.profile.name);
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
            console.log("For Row - first read time is "+ users[i].feedAction[k].readTime[0]);
            mlm.TotalNumberRead++;
            mlm.AveReadTime += users[i].feedAction[k].readTime.sum() / users[i].feedAction[k].readTime.length;
            console.log("For Row - avg time is "+ mlm.AveReadTime);
          }


        }//for Per FeedAction

        //get totalAverage
        mlm.AveReadTime = mlm.AveReadTime/mlm.TotalNumberRead;

        mlm.GeneralReplyNumber = users[i].numReplies +1;
        mlm.GeneralPostNumber = users[i].numPosts +1;

        for (var n = bully_messages.length - 1; n >= 0; n--) 
        {  

          var feedIndex = _.findIndex(users[i].feedAction, function(o) { return o.post == bully_messages[n]; });

          if(feedIndex!=-1)
          {
            mlm.BullyingPost  = n + 1;
            //last read time
            mlm.ReadTime = users[i].feedAction[feedIndex].readTime[users[i].feedAction[feedIndex].readTime.length - 1];
            mlm.AverageReadTime = users[i].feedAction[feedIndex].readTime.sum() / users[i].feedAction[feedIndex].readTime.length;
            mlm.ReadTimes = users[i].feedAction[feedIndex].readTime.length;

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
              mlm.LikeTime = users[i].feedAction[feedIndex].flagTime[0];
            }
            else 
            {
              mlm.Like = 0;
              mlm.LikeTime = 0;
            }

            if(users[i].feedAction[feedIndex].replyTime[0])
            {
              mlm.Reply = 1;
              mlm.ReplyTime = users[i].feedAction[feedIndex].flagTime[0];
            }
            else 
            {
              mlm.Reply = 0;
              mlm.ReplyTime = 0;
            }

          }

          else
          {
            mlm.BullyingPost  = n + 1;
            mlm.ReadTime = 0;
            mlm.AverageReadTime = 0;
            mlm.ReadTimes = 0;
            mlm.Flag = 0;
            mlm.FlagTime = 0;
            mlm.Like = 0;
            mlm.LikeTime = 0;
            mlm.Reply = 0;
            mlm.ReplyTime = 0;
          }

          mlm_writer.write(mlm);
        }//for Bully Messages





        //mlm.push(mlm_row);

      }




      
      
    mlm_writer.end();
    console.log('Wrote MLM!');
    mongoose.connection.close();

  });

