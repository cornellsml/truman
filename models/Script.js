const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function timeStringToNum (v) {
  var timeParts = v.split(":");
  return ((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000));
}

const scriptSchema = new mongoose.Schema({
  body: {type: String, default: '', trim: true},
  post_id: Number,
  class: String, //experimental or normal
  picture: String,
  highread: Number,
  lowread: Number,
  likes: Number,
  actor: {type: Schema.ObjectId, ref: 'Actor'},
  reply: {type: Schema.ObjectId, ref: 'Script'},

  experiment_group: String,

  time: Number, //in millisecons

  comments: [new Schema({
    class: String, //Bully, Marginal, normal, etc
    actor: {type: Schema.ObjectId, ref: 'Actor'},
    body: {type: String, default: '', trim: true}, //body of post or reply
    commentID: Number, //ID of the comment
    time: Number,//millisecons
    new_comment: {type: Boolean, default: false}, //is new comment
    likes: Number
    }, { versionKey: false })]
  
},{ versionKey: false });


const Script = mongoose.model('Script', scriptSchema);

module.exports = Script;
