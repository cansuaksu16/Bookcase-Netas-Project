// Widely Used:
// -Stack Overflow
// -Udemy, Web Development Bootcamp by Colt Steele
// -Node.js and express.js' document page

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const mongodb = require("mongodb");
const User = require("./models/user.js");
const Book = require("./models/book.js");
const session = require("express-session");
var bcrypt = require("bcrypt");

const port = process.env.PORT || 3030;
app.listen(port, function() {
  console.log(`Runs on port ${port}`);
});

var mydb;

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  session({
    secret: "work hard",
    resave: true,
    saveUninitialized: false,
    cookie: {}
  })
);

////////////////////////////////////////////////////////
//////////////// DB Connection Area Start //////////////
////////////////////////////////////////////////////////
var mydb;
const url = "mongodb://bookcase:bookcase123@ds149593.mlab.com:49593/bookcase";
mongodb.connect(
  url,
  { useNewUrlParser: true },
  function(err, database) {
    if (err) {
      console.log("DB Connection Error!");
    } else {
      console.log("DB Connection Successful!");
      console.log("connected to " + url);
      //database.close();
      mydb = database.db("bookcase");
    }
  }
);
////////////////////////////////////////////////////////
//////////////// DB Connection Area End //////////////
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
//////////////// Authentication Area Start /////////////
////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  var email = req.body.email;
  var pass = req.body.password;

  if (req.body.email && req.body.password) {
    mydb.collection("users").findOne({ email: email }, function(err, result) {
      if (err) {
        console.log(err);
        throw err;
      } else {
        if (result) {
          bcrypt.compare(pass, result.password, function(err2, result2) {
            if (err2) {
              console.log(err2);
              throw err;
            } else {
              if (result2 === true) {
                req.session.userMail = req.body.email;

                res.redirect("/books");
              } else {
                res.render("error", {
                  message: "Password or email is not correct!"
                });
              }
            }
          });
        } else {
          res.render("error", { message: "Email address is not valid!" });
        }
      }
    });
  } else {
    res.render("error", { message: "All fields are required!" });
  }
});
///////////////////////////////////////////////////////////////////////////////////

//Create a new user
app.get("/signup", (req, res) => {
  res.render("signUp");
});

app.post("/signup", function(req, res) {
  if (req.body.password !== req.body.passwordConf) {
    res.render("error", { message: "Passwords dont match" });
  } else {
    if (
      req.body.email &&
      req.body.username &&
      req.body.password &&
      req.body.passwordConf
    ) {
      mydb
        .collection("users")
        .findOne({ email: req.body.email }, function(err, result) {
          if (err) {
            throw err;
          } else {
            if (!result) {
              console.log("This e-mail is available!");
              bcrypt.hash(req.body.password, 10, function(err, hash) {
                if (err) {
                  console.log(err);
                  res.status(200).send({
                    success: "false",
                    message: "Password encryption part error!",
                    data: err
                  });
                } else {
                  var userData = new User({
                    email: req.body.email,
                    username: req.body.username,
                    password: hash,
                    passwordConf: hash
                  });
                  mydb
                    .collection("users")
                    .insertOne(userData, function(err, result2) {
                      if (err) {
                        console.log(err);
                        throw err;
                      } else {
                        console.log(result2);
                        res.redirect("/login");
                      }
                    });
                }
              });
            } else {
              res.render("error", {
                message: "This email has already been used!"
              });
            }
          }
        });
    } else {
      res.render("error", { message: "All fields are required!" });
    }
  }
});
///////////////////////////////////////////////////////////////////////////////////

app.get("/logout", function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        console.log("Logout successful!");
        return res.redirect("/");
      }
    });
  }
});
////////////////////////////////////////////////////////
//////////////// Authentication Area End ///////////////
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
//////////////////// CRUD Area  Start///////////////////
////////////////////////////////////////////////////////

app.get("/books", (req, res) => {
  mydb
    .collection("books")
    .find({ userMail: req.session.userMail })
    .toArray(function(err, result) {
      if (err) {
        console.log(err);
        throw err;
      } else {
        console.log(result);
        res.render("books", { books: result });
      }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/books/add", (req, res) => {
  res.render("add");
});

app.post("/books/add", (req, res) => {
  if (req.session) {
    if (
      req.body.name &&
      req.body.author &&
      req.body.list &&
      req.session.userMail
    ) {
      mydb
        .collection("books")
        .findOne(
          { name: req.body.name, userMail: req.session.userMail },
          function(err, result) {
            if (err) {
              throw err;
            } else {
              if (!result) {
                console.log("This book is suitable for adding operation!");
                var bookData = new Book({
                  name: req.body.name,
                  author: req.body.author,
                  list: req.body.list,
                  userMail: req.session.userMail
                });
                mydb
                  .collection("books")
                  .insertOne(bookData, function(err, result2) {
                    if (err) {
                      console.log(err);
                      throw err;
                    } else {
                      //console.log(result2);
                      res.redirect("/books");
                    }
                  });
              } else {
                res.render("error", { message: "This book already exists!" });
              }
            }
          }
        );
    } else {
      console.log("All fields are required.");
      res.render("error", { message: "All fields are required!" });
    }
  } else {
    res.render("error", { message: "Login first!" });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/books/delete", (req, res) => {
  mydb
    .collection("books")
    .find({ userMail: req.session.userMail })
    .toArray(function(err, result) {
      if (err) {
        console.log(err);
        throw err;
      } else {
        console.log(result);
        res.render("delete", { books: result });
      }
    });
});

app.post("/books/delete", (req, res) => {
  if (req.session) {
    console.log(req);

    if (req.body.name && req.session.userMail) {
      mydb
        .collection("books")
        .findOne(
          { userMail: req.session.userMail, name: req.body.name },
          function(err, result) {
            if (err) {
              throw err;
            } else {
              if (result) {
                console.log("This book is suitable for deleting operation!");

                mydb
                  .collection("books")
                  .deleteOne(
                    { userMail: req.session.userMail, name: req.body.name },
                    (err, result) => {
                      if (err) {
                        console.log(err);
                        throw err;
                      } else {
                        if (!result) {
                          console.log(result);
                          res.render("error", {
                            message: "Cannot found this book!"
                          });
                        } else {
                          console.log(result);
                          console.log(req.body.name);
                          console.log(req.session.userMail);
                          res.redirect("/books");
                        }
                      }
                    }
                  );
              } else {
                res.render("error", { message: "Cannot found this book!" });
              }
            }
          }
        );
    } else {
      res.render("error", { message: "All fieldsa are required!" });
    }
  } else {
    res.render("error", { message: "Login first!" });
  }
});
////////////////////////////////////////////////////////
//////////////////// CRUD Area  End ////////////////////
////////////////////////////////////////////////////////
