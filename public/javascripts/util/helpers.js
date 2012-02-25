define(['jquery', 'util/data'], function($, data){
    var currentNote, saveTimeoutId; // private

    var helpers = {
        getCurrentNote: function(){ return currentNote },
        applyTheme: function(theme){
            $('head link[id]').remove();
            $('head').prepend('<link rel="stylesheet" id="user_css" href="/user.css?no_cache=' + (new Date).getTime() + '" />');    
        },
        applyNote: function(note, saveLocal){
            currentNote = note;
            $('div#bodytext').html(note.body);
            $('#titletext').html(note.title);
            $('#datetext').html(note.date);
            $('#timetext').html(note.time);
            $('#current-note-id').val(note.id);
            
            if(saveLocal) 
                data.storage['currentNote'] = JSON.stringify(note);

            this.markActiveNote(note.id);
        },
        markActiveNote: function(id){
            id = id || currentNote.id;
            var li = $('#notelist li[data-id="' + id + '"]');
            if(li.length)
                li.addClass('active').siblings().removeClass('active');
        },
        getNote: function(){
            var note = {
                body: $('div#bodytext').html(),
                title: $('#titletext').html(),
                date: $('#datetext').html(),
                time: $('#timetext').html()
            };
            
            var id = $('#current-note-id').val();
            if(id) note.id = id;
            return note;
        },
        resetNote: function(){
            var newNote = {
                body: 'Click to Edit',
                title: 'New Title'
            };
            $('#notelist li.active').removeClass('active');
            this.applyNote(newNote);
        },
        loadNoteList: function(){
            data.socket.emit('note/titles', {}, function(err, notes){
                var list = $('#notelist').empty(), cls;
                for(var i = 0; i < notes.length; i++){
                    cls = (currentNote && currentNote.id) == notes[i].id ? 'active' : '';
                    list.append('<li class="' + cls + '" data-id="' + notes[i].id + '"><a class="del">x</a>' + notes[i].title + '</li>');
                }
            });
        },
        saveNote: function(){
            var self = this,
                note = this.getNote(),
                win = $('.window').length == 0 ? $('<div />').window({ html: '<span class="text">Saving...</span>' }) : null;
            data.socket.emit('note/save', note, function(err, note){
                // ... success then update html and close
                console.log('done save note', arguments); 
                data.storage['currentNote'] = JSON.stringify(note);
                // save id
                $('#current-note-id').val(note.id);

                // update list
                var exists = $('#notelist li[data-id="' + note.id + '"]');
                if(exists.length) exists.html('<a class="del">x</a>' + note.title);
                else $('#notelist').prepend('<li data-id="' + note.id + '"><a class="del">x</a>' + note.title + '</li>');

                self.markActiveNote(note.id);
                if(win) win.data('window') && win.data('window').destroy();
            });
        },
        saveDelayed: function(ms){
            if(saveTimeoutId) clearTimeout(saveTimeoutId);
            var self = this;
            saveTimeoutId = setTimeout(function(){
                self.saveNote();
            }, ms);
        }
    };

    return helpers;
});
