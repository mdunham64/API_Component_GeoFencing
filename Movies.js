//first few lines takes from Users, dropped the encryption for the movies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

//need to connect to the database, again taken from Users
try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

//movie schema!
var MovieSchema = new Schema({
    title: {type: String, required: true, index: { unique: true }},
    year: { type: Date, required: true},
    genre: {type: String, required:true, enum: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"]},
    actors: {type: Array, required: true, items: {actorName: String, characterName: String}, minItems: 3}, //minItems is three because each film must list at least 3 actors
});

module.exports = mongoose.model('Movie', MovieSchema);