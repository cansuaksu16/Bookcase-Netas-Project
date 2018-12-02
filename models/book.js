var mongoose = require("mongoose");
var BookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  list: {
    type: String,
    required: true
  },
  userMail: {
    type: String,
    required: true
  }
});

var Book = mongoose.model("Book", BookSchema);
module.exports = Book;
