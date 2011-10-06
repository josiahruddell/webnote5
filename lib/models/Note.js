var Model = require('LazyBoy');


var Note = Model.define('Note', {
    body: String,
    title: String,
    date: String,
    time: String,
    userId: String
});