var mongoose = require("mongoose");
var connect = process.env.MONGODB_URI;

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
  phone: String
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
