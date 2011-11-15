var Model = require('LazyBoy');


var Note = Model.define('Note', {
    id: String,
    body: String,
    title: String,
    date: String,
    time: String,
    userId: String
});

Note.addView('TitleByUserId',{ 
    map: function (doc) {
        if (doc.model_type === 'Note') {
            emit(doc.userId, { id: doc.id || doc._id, title: doc.title });
        }
    }
});