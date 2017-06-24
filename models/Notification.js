const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function timeStringToNum (v) {
  var timeParts = v.split(":");
  return ((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000));
}

const notificationSchema = new mongoose.Schema({
  notificationType: String, //(like, read, reply)
  userPost: Number, //which user post this action is for (0,1,2....n) - includes actual Actor Reply (since it refs a user post)
  userReply: Number, //for replys from User
  actorReply: Number, //Ref for an Action on a Actor reply (like reads, likes, etc)
  actor: {type: Schema.ObjectId, ref: 'Actor'}, //actor who did the action (read,likes, replied)
  time: Number, //in millisecons
  replyBody: {type: String, default: '', trim: true},//body of actor's reply
  //reply: {type: Schema.ObjectId, ref: 'Script'} //this will need to be something else (like the actual user post I guess?)
  
}, { timestamps: true });


const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
