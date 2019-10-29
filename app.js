require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://admin-michael:" + process.env.MONGO_PASSWORD + "@cluster0-flcwo.mongodb.net/attendanceDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  firstName: String,
  lastName: String,
  preferredEmail: String,
  cellPhone: String,
  birthDate: String,
  schoolId: String
});

const meetingSchema = new mongoose.Schema({
  title: String,
  date: String,
  time: String,
  notes: String,
  code: Number,
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const User = mongoose.model("User", userSchema);
const Meeting = mongoose.model("Meeting", meetingSchema);

///////////////////// Helper Function ////////////////////////////
function getMeetingCode(count, cb) {
  if (count > 8999) {
    console.log( "Number of meetings: " + count + " exceeds max of 8,999. Code = 10000" );
    cb(10000);
  } else {
    const randNum = Math.floor(9000 * Math.random()) + 1000;
    Meeting.findOne({ code: randNum }, function(err, foundMeeting) {
      if (err) {
        console.log("getMeetingCode err: " + err);
        cb(0);
      } else if (foundMeeting) {
        getMeetingCode(count, cb);
      } else {
        console.log("about to return from getMeetingCode: " + randNum);
        cb(randNum);
      }
    });
  }
}

///////////////////// Requests Targeting All Users ///////////////

app.route("/users")

.get(function(req, res) {
  User.find(function(err, foundUsers) {
    if (!err) {
      res.send(foundUsers);
    } else {
      res.send(err);
    }
  });
})

.post(function(req, res) {
  const newUser = new User({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName
  });
  newUser.save(function(err) {
    if (!err) {
      res.send("Successfully added new user");
    } else {
      res.send(err);
    }
  });
})

.delete(function (req, res) {
  User.deleteMany(function(err) {
    if (!err) {
      res.send("Successfully deleted all users");
    } else {
      res.send(err);
    }
  });
});

///////////////////// Requests Targeting a Specific User ///////////////

app.route("/users/:userId")

.get(function(req, res) {
  User.findOne({_id: req.params.userId}, function(err, foundUser) {
    if (foundUser) {
      res.send(foundUser);
    } else if (err) {
      res.send(err);
    } else {
      res.send("User not found.")
    }
  });
})

.put(function(req, res) {
  User.replaceOne(
    {_id: req.params.userId},
    {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    },
    function(err) {
      if (!err) {
        res.send("Successfully updated user");
      } else {
        res.send(err);
      }
    }
  );
})

.patch(function(req, res) {
  User.updateOne(
    {_id: req.params.userId},
    {$set: req.body},
    function(err) {
      if (!err) {
        res.send("Successfully patched user");
      } else {
        res.send(err);
      }
    }
  );
})

.delete(function(req, res) {
  User.deleteOne({_id: req.params.userId}, function (err) {
    if (!err) {
      res.send("Successfully deleted user");
    } else {
      res.send(err);
    }
  })
});


///////////////////// Requests Targeting All Meetings ///////////////

app.route("/meetings")

.get(function(req, res) {
  Meeting.find().populate("host").populate("attendees").exec(function(err, foundMeetings) {
    if (!err) {
      res.send(foundMeetings);
    } else {
      res.send(err);
    }
  });
})

.post(function(req, res) {
  Meeting.count({}, function(err, count) {
    if (err) {
      console.log("Meeting.count err: " + err);
      res.send(err);
    } else {
      getMeetingCode(count, function(meetingCode) {
        console.log("line new 170: " + meetingCode);
        console.log("My body: " + req.body);
        console.log(req.body);
        console.log(mongoose.Types.ObjectId.isValid(req.body.host));
        User.findById(req.body.host, function(err, foundUser) {
          if (err) {
            console.log("Error finding user of host id: " + err);
            res.send("Error finding user of host id: " + err);
          } else if (!foundUser) {
            console.log("No user with matching ID found.");
          } else {
            const newMeeting = new Meeting({
              title: req.body.title,
              // date: req.body.date,
              // time: req.body.time,
              // notes: req.body.notes,
              host: foundUser._id,
              code: meetingCode
            });
            console.log("New Meeting object: " + newMeeting);
            newMeeting.save(function(err) {
              if (!err) {
                console.log("New meeting saved!");
                res.send(meetingCode.toString());
              } else {
                console.log("New meeting save error: " + err);
                res.send(err);
              }
            });
          }
        });
      });
    }
  });
});

///////////////////// Requests Targeting a Specific Meeting ///////////////

app.route("/meetings/:meetingId")

.get(function(req, res) {
  Meeting.findOne({_id: req.params.meetingId}).populate("host").populate("attendees")
  .exec(function(err, foundMeeting) {
    if (foundMeeting) {
      res.send(foundMeeting);
    } else if (err) {
      res.send(err);
    } else {
      res.send("Meeting not found.")
    }
  });
})

.put(function(req, res) {
  Meeting.replaceOne(
    {_id: req.params.meetingId},
    {
      title: req.body.title,
      date: req.body.date,
      time: req.body.time,
      notes: req.body.notes,
      code: req.body.code,
      host: req.body.host
    },
    function(err) {
      if (!err) {
        res.send("Successfully updated meeting");
      } else {
        res.send(err);
      }
    }
  );
})

.patch(function(req, res) {
  Meeting.updateOne(
    {_id: req.params.meetingId},
    {$set: req.body},
    function(err) {
      if (!err) {
        res.send("Successfully patched meeting");
      } else {
        res.send(err);
      }
    }
  );
})

.delete(function(req, res) {
  Meeting.deleteOne({_id: req.params.meetingId}, function (err) {
    if (!err) {
      res.send("Successfully deleted meeting");
    } else {
      res.send(err);
    }
  })
});

///////////////////// Requests Targeting a Specific Attendance Event ///////////////

app.route("/users/:userId/attendEvent")

.post(function(req, res) {
  Meeting.findOne({code: req.body.code}, function(err, foundMeeting) {
    if (foundMeeting) {
      console.log(foundMeeting.attendees);
      if (foundMeeting.attendees.includes(req.params.userId)) {
        res.json({ success: false, error: "You have already attended meeting with code "
          + req.body.code + "." });
      } else {
        foundMeeting.attendees.push(req.params.userId);
        foundMeeting.save();
        res.json({ success: true, description: foundMeeting.title, code: req.body.code });
      }
    } else if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json({ success: false, error: "Meeting #" + req.body.code + " was not found." });
    }
  });
})

.delete(function(req, res) {
  console.log(req.body);
  Meeting.findOneAndUpdate({code: req.body.meetingCode},
    {$pull: {attendees: req.params.userId}}, function(err, foundMeeting) {
      if (err) {
        res.send(err);
      } else {
        res.json({ success: true, description: "Successfully deleted attendee from meeting",
          code: req.body.meetingCode });
      }
    });
});


///////////////////// Requests Regarding Meetings hosted or attended by a User ///////////////

app.route("/users/:userId/meetingsAttended")
.get(function(req, res) {
  Meeting.find({attendees: req.params.userId}, function(err, foundMeetings) {
    if (err) {
      res.send(err);
    } else if (foundMeetings) {
      res.send(foundMeetings);
    } else {
      res.send("No matching results found.")
    }
  });
});

app.route("/users/:userId/meetingsHosted")
.get(function(req, res) {
  Meeting.find({host: req.params.userId}, function(err, foundMeetings) {
    if (err) {
      res.send(err);
    } else if (foundMeetings) {
      res.send(foundMeetings);
    } else {
      res.send("No matching results found.")
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3001;
}
app.listen(port, function(err) {
  if (!err) {
    console.log("API server started on port " + port + ".");
  } else {
    console.log(err);
  }
});
