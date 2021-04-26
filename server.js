var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
//var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var Movie = require('./Country');
var Review = require('./review');
var User = require('./Users');
var theUser; //this is used to store the user object. Then we can use it again later to assign attributes where we need.

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

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.post('/signup', function(req, res) {
    let Request = require("request");
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        Request('http://ip-api.com/json?fields=continent', function (err, response, body){
            if(!err){
                console.log(body)
            }
        });

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
                theUser = userToken;
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    //POST
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        var aMovie = new Movie();
        aMovie.title = req.body.title;
        aMovie.year = req.body.year;
        aMovie.genre = req.body.genre;
        aMovie.actors = req.body.actors;
        aMovie.imageUrl = req.body.imageUrl;

        // save the movie
        if (Movie.findOne({title: aMovie.title}) != null) {
            aMovie.save(function (err) {
                if (err) {
                    // duplicate entry
                    if (err.code == 11000)
                        res.json({success: false, message: 'The movie already exists in the db. '});
                    else
                        return res.send(err);
                }else res.json({success: true, message: 'Movie Added Successfully'});
            });
        }
    })
    //DELETE
    .delete(authJwtController.isAuthenticated, function (req, res) {
        Movie.deleteOne({title: req.body.title}, function(err, obj) {
            if (err) res.send(err);
            else res.json({success: true, message: 'Movie REMOVED from db'});
        })
    })
    //PUT
    .put(authJwtController.isAuthenticated, function (req, res) {
        var queryTitle = req.query.title;
        if (Movie.findOne({title: queryTitle}) != null) {
            var newVals = { $set: req.body };
            Movie.updateOne({title: queryTitle}, newVals, function(err, obj) {
                if (err) res.send(err);
                else res.json({success: true, message: 'Updated'});
            })
        }
    })

    //GET
    .get(function (req, res) {
        if(req.query.reviews === 'true'){
                Movie.aggregate([
                    {
                        $lookup:{
                            from:'reviews',
                            localField:'title',
                            foreignField:'movieTitle',
                            as: 'reviews'
                        }
                    },
                    {
                        $addFields:{
                            avgRating: {
                                $avg: "$reviews.rating"
                            }
                        }
                    }
                ]).exec(function (err, movie){
                    if(err){
                        return res.send(err);
                    }else{
                        return res.json(movie);
                    }
                })
        }else{
                Movie.aggregate([
                    {
                        $lookup:{
                            from:'reviews',
                            localField:'title',
                            foreignField:'movieTitle',
                            as: 'reviews'
                        }
                    }
                ]).exec(function (err, movie){
                    if(err){
                        return res.send(err);
                    }else{
                        return res.json(movie);
                    }
                })
            }
    })


router.route('/transactions')
    .get( authJwtController.isAuthenticated, function (req, res) {
        let userInfo = {};
        User.aggregate([
            {
                $lookup:
                    {
                        from: 'transactions',
                        localField: 'username',
                        foreignField: 'transUsers[0]',
                        as: 'user_sent_transactions'
                    }
            }
        ]).then( entries =>
        entries.filter(item => item.username === userToken.username).forEach(entry => userInfo.add(entry))); //create userToken with signin method to save user details

        User.aggregate([
            {
                $lookup:
                    {
                        from: 'transactions',
                        localField: 'username',
                        foreignField: 'transUsers[1]',
                        as: 'user_recv_transactions'
                    }
            }
        ]).then( entries =>
        entries.filter(item => item.username === userToken.username).forEach(entry => userInfo.add(entry))); //create userToken with signin method to save user details
        res.json(userInfo);
    })
//REVIEW ONLY NEEDS GET AND POST
router.route('/review')
    //POST
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        var aReview = new Review();
        aReview.username = theUser.username; //this sets the critic name to the username that is logged in.
        aReview.quote = req.body.quote;
        aReview.rating = req.body.rating;
        aReview.movieTitle = req.body.movieTitle;

        Movie.findOne({title: req.body.movieTitle}).exec(function(err, movie){
            if(err){
                return res.json(err);
            }
            if(movie === null){
                return res.json({Success: false, Message: 'No movie exists by that name.'});
            }else{
                aReview.save(function(err, review){
                    if(err){
                        return res.json(err);
                    }else res.json({success: true, message: 'Review Added Successfully'});
                })
            }
        })
    })
    //GET - this needs to be fixed. Right now this just returns all of the reviews.
    //currently needs authentication but thats not a req
    .get(function (req, res) {
        if(req.query.reviews === 'true'){

                Movie.aggregate([
                    {
                        $match:{
                            "title":req.body.movieTitle,
                        }
                    },
                    {
                        $lookup:{
                            from:'reviews',
                            localField:'title',
                            foreignField:'movieTitle',
                            as: 'movieWithReview'
                        }
                    },
                    {$addFields : { avgRating: { $avg: "$reviews.rating" } }}
                ]).exec(function (err, movie){
                    if(err){
                       return res.send(err);
                    }else{
                        return res.json(movie);
                    }
                })
        }else{
                Movie.aggregate([
                    {
                        $match:{
                            "title":req.body.movieTitle,
                        }
                    },
                    {
                        $lookup:{
                            from:'reviews',
                            localField:'title',
                            foreignField:'movieTitle',
                            as: 'reviews'
                        }
                    }
                ]).exec(function (err, movie){
                    if(err){
                        return res.send(err);
                    }else{
                        return res.json(movie);
                    }
                })
            }
    })


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only