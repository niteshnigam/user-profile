// import the express module
const express = require("express");

// import the bodyparser module//
const bodyparser = require('body-parser')

//import the user file//
const user = require('./user/user');

const userprofile = require('../profile/user/user-profile');

//make an instances 
const app = express();

// using middlewares
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());

app.use('/', user);
app.use('/', userprofile);





//export this file//
module.exports = app;
