const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function timeStringToNum (v) {
  var timeParts = v.split(":");
  return ((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000));
}

const scriptSchema = new mongoose.Schema({
  body: {type: String, default: '', trim: true},
  class: String, //experimental or normal
  picture: String,
  actor: {type: Schema.ObjectId, ref: 'Actor'},
  reply: {type: Schema.ObjectId, ref: 'Script'},
  time: { type: Number, set: timeStringToNum } //in millisecons
}, { timestamps: true });


const Script = mongoose.model('Script', scriptSchema);

module.exports = Script;
