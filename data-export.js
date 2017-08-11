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
  .where('active').equals(false).
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

      mlm_writer.pipe(fs.createWriteStream('mlm_eatsnaplove.csv'));

      for (var i = users.length - 1; i >= 0; i--) {

        var mlm_row = {};
        mlm_row.id = users[i].id;

        //UI
        if (users[i].ui == 'ui')
        {
          mlm_row.ViewNotification = 1;
        }
        else
        {
          mlm_row.ViewNotification = 0;
        }

        //READ NOTIFY
        if (users[i].notify == 'high')
        {
          mlm_row.HighBystanders = 2;
        }
        else if (users[i].notify == 'low')
        {
          mlm_row.HighBystanders = 1;
        }
        else
        {
          mlm_row.HighBystanders = 0;
        }

        //per feedAction
        mlm.VictimNoBullyReplies = 0;
        mlm.VictimNoBullyReplies = 0;
        for (var k = users[i].feedAction.length - 1; k >= 0; k--) {
          
          if (users[i].feedAction[k].actor.id == victim)
          {
            mlm_row.
          }


        }




        //mlm.push(mlm_row);
        mlm_writer.write(mlm_row);

      }




      
      
    mlm_writer.end();
    console.log('Wrote MLM!');

  });

