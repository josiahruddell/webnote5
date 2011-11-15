var Model = require('LazyBoy'),
    Note = Model('Note');

var NoteService = function(){
    this.db = Model.connection.connection();
};

NoteService.prototype = {
    all: function(userId, fn){
        if(userId)
            Note.where('userId', userId, fn);
        else
            Note.all(fn);
    },
    titles: function(userId, fn){
        if(userId)
            Note.view('TitleByUserId', { key: userId }, fn);
        else 
            Note.view('TitleByUserId', fn);
    },
    remove: function(noteId, fn){
        this.find(noteId, function(err, note){
            if (err) console.error(err);
            note.remove(fn);
        });
    },
    find: function(noteId, fn){
        Note.find(noteId, fn);
    },
    save: function(note, fn){
        // create or update
        Note.create(note).save(fn);
    }
};

module.exports = new NoteService();