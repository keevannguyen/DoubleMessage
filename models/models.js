var mongoose = require("mongoose");
var connect = process.env.MONGODB_URI;
var findOrCreate = require('mongoose-findorcreate');

mongoose.connection.on("connected", function(){
  console.log("Connected to MongoDB!");
});

mongoose.connection.on("error", function(){
  console.log("Failed to connect to MongoDB.");
});

mongoose.connect(connect);

// Schemas
var userSchema = new mongoose.Schema({
  username: String,
  password: String,
  phone: String,
  facebookId: String,
  pictureURL: String,
  twitterId: String
});

var contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
})

var messageSchema = new mongoose.Schema({
  created: Date,
  content: String,
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  contact: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contact'
  },
  channel: String,
  status: String,
  from: String
});

// Functions
userSchema.plugin(findOrCreate);

// Models
var User = mongoose.model("User", userSchema);
var Contact = mongoose.model("Contact", contactSchema);
var Message = mongoose.model("Message", messageSchema);

// Exports
module.exports = {
  User: User,
  Contact: Contact,
  Message: Message
}
