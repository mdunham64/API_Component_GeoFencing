/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var Movie = require('./Movies');
var User = require('./Users');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }
            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    //GET
    //I made this just like Shawn's get for users
    .get(authJwtController.isAuthenticated, function(req, res) {
        Movie.find(function (err, movies) {
                if (err) res.send(err);
                // return the movies
                res.json(movies);
            });
    }
    )

//POST
    .post(authJwtController.isAuthenticated ,function(req, res) {
        var aMovie = new Movie();
        aMovie.title = req.body.title;
        aMovie.year = req.body.year;
        aMovie.genre = req.body.genre;
        aMovie.actors = req.body.actors;

        if(Movie.findOne({title: aMovie.title}) != null) {
            //these next lines are very similar to the signup method from Shawn's code, 52-60
            aMovie.save(function(err){
                if (err) {
                    if (err.code == 11000)
                        return res.json({ success: false, message: 'A movie with that username already exists.'});
                    else
                        return res.json(err);
                }
                res.json({success: true, msg: 'Successfully created new movie.'})
            });
        }})

//DELETE
    .delete(authJwtController.isAuthenticated, function (req, res){
        Movie.deleteOne({title:req.body.title}, function (err, obj){
            if (err) res.send(err);
            else res.json({success: true, message: 'Deleted Movie Object from the DB'});
        })
    });

//PUT(MODIFY)
router.put(authJwtController.isAuthenticated, function (req, res) {
    var queryMovie = req.query.title;
    if(Movie.findOne({title: queryMovie.title}) != null){
        var updateValue = {$set: req.body};
        Movie.updateOne({title: queryMovie}, updateValue, function (err, obj){
            if (err) res.send(err);
            else res.json({success: true, message: 'Updated the Movie Successfully'});
        })
    }
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


