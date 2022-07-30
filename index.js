const express = require('express')
const app = express()
const mongo = require("mongoose");
const cors = require('cors')
const constants = require("constants");
const parser = require('body-parser');
const {ObjectId} = require("mongodb");
const {now} = require("mongoose");
const underscore = require('underscore');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
var urlencodedParser = parser.urlencoded({ extended: false })
mongo.connect(process.env.MONGO_URL);
const con = mongo.connection;
con.on("error", console.error.bind(console, "connection error: "));
con.once('open', function() {
  console.log("Connected successfully!");
});

const userSchema = new mongo.Schema(
    {username: String}
);
const userModel = mongo.model('user', userSchema);

const exerciseSchema = new mongo.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userid: String
});
const exerciseModel = mongo.model('exercise', exerciseSchema);

app.post('/api/users',urlencodedParser, (req, res) => {
  const users = new userModel({username: req.body.username});
  users.save((err, data) => {
    if (err) console.log(err);
    else
    {
      console.log("USER : ", data._id.toString());
      res.json({username: data.username, _id: data._id.toString()});
    }
  });
})

app.get('/api/users', urlencodedParser, (req, res) => {
  userModel.find({}, (err, data) =>{
    if (err) console.log(err);
    else
      res.json(data);
  })
});

// For Debug
app.get('/api/exercises/', (req, res) => {
  exerciseModel.find({}, (err, data) => {
    if (err) console.log(err);
    else{
      res.json(data);
    }
  })
})

app.post('/api/users/:_id/exercises',urlencodedParser, (req, res) =>{
  console.log("ID = ", req.params._id);
  var date = new Date(req.body.date).toDateString();
  if (date === 'Invalid Date')
    date = new Date().toDateString();
  console.log("date :", date);
  userModel.findById(req.params._id, (err, user) => {
    if (err || !user){
      res.json({error: "The User not Found"});
      return;
    }
    const exercises = new exerciseModel({username: user.username, description: req.body.description, duration: req.body.duration, userid: user._id.toString(), date: date});
    exercises.save((err, data) => {
      if (err) console.log(err);
      else
        res.json({_id: user._id.toString(), username: user.username, date: exercises.date, duration: exercises.duration, description: exercises.description});
    })
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  if (underscore.isEmpty(req.query))
    console.log('Empty');
  else
    console.log('Not Empty');
  console.log("Query = ", req.query);
  var result = {
    _id: String,
    username: String,
    count: Number,
  log:[]
  }
  console.log('id:', id);
  exerciseModel.find({userid: id}, (err, data) => {
    if (err) {
      console.log("Error: ", err);
    }
    else
    {
      result._id = id;
      result.username = data[0].username;
      result.count = data.length;
      for (var i = 0; i < data.length; i++)
        result.log.push({ description: data[i].description, duration: data[i].duration, date: data[i].date});
      res.json(result);
    }
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})