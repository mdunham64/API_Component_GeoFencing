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

//country schema!
var CountrySchema = new Schema({
    name: {type: String, required: true, index: { unique: true }},
    continent: { type: String, required: true},
});

module.exports = mongoose.model('Country', CountrySchema);