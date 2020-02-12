require('dotenv').config();
const express = require("express"),
  app = express(),
  port = process.env.PORT || 3001,
  bodyParser = require("body-parser"),
  meetingRoutes = require('./routes/meetings'),
  userRoutes = require('./routes/users');

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/meetings', meetingRoutes);
app.use('/users', userRoutes);

app.listen(port, function(err) {
  if (!err) {
    console.log("API server started on port " + port + ".");
  } else {
    console.log(err);
  }
});
