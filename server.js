const path = require("path");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const db = require("./models");
// const routes = require("./routes");
const cors = require("cors");

const app = express();

// models
const Items = require("./models/item");

// PORT
const PORT = process.env.PORT || 3001;

const ObjectId = require("mongoose").Types.ObjectId;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// Serve up static assets (Heroku)
app.use(express.static("client/build"));

// Connect to the Mongo DB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/food-saver", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB!!!  Huzzah!");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB :-( NOOOOOOO", err);
  });

app.get("/api/config", (req, res) => {
  res.json({
    success: true,
  });
});


// Register route
app.post("/register", (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  db.User.findOne({ username }).then((user) => {
    if (user) {
      console.log(user);
      // res.status(500);
      return res.json({
        message: "user already exists",
      });
    }
      db.User.create({ username, password }).then((user) => {
        res.json({
          message: "Successfully Registered",
          id: user._id,
          username: user.username,
          password: user.password,
        });
      });
    
  });

});

// Log In Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  db.User.findOne({ username }).then((user) => {
    console.log("user", user);
    if (!user || user.password !== password) {
      res.status(403);
      res.json({
        message: "Invalid Login",
      });
      return;
    }
    res.json({
      message: "Successfully Logged into the Food Saver",
      id: user._id,
      username: user.username,
      password: user.password,
    });
  });
});

app.get("/users", (req, res) => {
  db.User.find({})
    .then((response) => {
      console.log(response);
      res.send(response);
    })
    .catch((err) => {
      res.send(err);
    });
});


// Item Page Route
app.post("/api/users/:userId/items", async (req, res) => {
  db.Item.create(req.body)
    .then((newItem) => {
      console.log(newItem);
      db.User.findByIdAndUpdate(
        req.params.userId,
        { $push: { items: newItem._id } },
        { new: true }
      )
        .populate("items")
        .then((updatedUser) => {
          console.log(updatedUser);
          res.json(updatedUser.items);
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).end();
    });
});

// Items get Route
app.get("/api/users/:userId/items", async (req, res) => {
  db.User.findById(req.params.userId)
    .populate("items")
    .then((foundUser2) => {
      if (foundUser2) {
        console.log(foundUser2.items);
        res.json(foundUser2.items);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(404).end();
    });
});

app.put("/api/foods/:id", (req, res) => {
  console.log(req.body);
  db.Item.findByIdAndUpdate({ _id: req.params.id }, req.body)
  .then((dbModel) => res.json(dbModel))
  .catch((err) => res.status(422).json(err));
})

// DELETE food item
app.delete("/api/foods/:id", (req, res) => {
  db.Item.findById({ _id: req.params.id })
            .then((dbModel) => dbModel.remove())
            .then((dbModel) => res.json(dbModel))
            .catch((err) => res.status(422).json(err));
}),

//EDIT food item
app.put("/api/foods/:id", (req, res) => {
  console.log(req.body);
  db.Item.findByIdAndUpdate({ _id: req.params.id }, req.body)
            .then((dbModel) => res.json(dbModel))
            .catch((err) => res.status(422).json(err));
}),


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});


// Listener
app.listen(PORT, () => {
  console.log(`Back end server running on http://localhost:${PORT}`);
});
