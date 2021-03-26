//first few lines takes from Users, dropped the encryption for the movies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise; // do i need this here?

//need to connect to the database, again taken from Users
try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

//create the schema
var ReviewSchema = new Schema({
    criticName: {type:String, required: true},
    quote: {type: String, required: true},
    rating: {type: Number, min:0, max: 5},
    movieTitle:{type: String, required: true}
});

module.exports = mongoose.model('Review', ReviewSchema);