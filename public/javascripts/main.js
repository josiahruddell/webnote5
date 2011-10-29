/*

____________________________________________
\\\|///
 \\|//   document ready, initialize
  \|/    everything here
   |

        ** This file needs a major refactor - currently it is in get-it-done mode
*/

require([
    'jquery', 
    'class/MenuItem/MenuItem', 
    'lib/socket.io/socket.io.min', 
    'util/extensions'
],
function($, MenuItem) {
    $(function() {
        var socket = io.connect(),
            storage = sessionStorage || localStorage,
            offline = false,
            currentNote;
        // one edit
        $('#bodytext').oneEdit();

        // TODO: move to templates, or use orm
        function applyNote(note, saveLocal){
            currentNote = note;
            $('div#bodytext').html(note.body);
            $('#titletext').html(note.title);
            $('#datetext').html(note.date);
            $('#timetext').html(note.time);
            $('#current-note-id').val(note.id);
            
            if(saveLocal) 
                storage['currentNote'] = JSON.stringify(note);

            markActiveNote(note.id);
            
        }

        function markActiveNote(id){
            id = id || currentNote.id;
            var li = $('#notelist li[data-id="' + id + '"]');
            if(li.length)
                li.addClass('active').siblings().removeClass('active');
        }

        function getNote(){
            var note = {
                body: $('div#bodytext').html(),
                title: $('#titletext').html(),
                date: $('#datetext').html(),
                time: $('#timetext').html()
            };
            
            var id = $('#current-note-id').val();
            if(id)
                note.id = id;
            return note;
        }

        function resetNote(){
            var newNote = {
                body: 'Click to Edit',
                title: 'New Title'
            };
            $('#notelist li.active').removeClass('active');
            applyNote(newNote);
        }
        
        function loadNoteList(){
            socket.emit('note/all', {}, function(err, notes){
                var list = $('#notelist').empty(), cls;
                for(var i = 0; i < notes.length; i++){
                    cls = (currentNote && currentNote.id) == notes[i].id ? 'active' : '';
                    list.append('<li class="' + cls + '" data-id="' + notes[i].id + '"><a class="del">x</a>' + notes[i].title + '</li>');
                }
            });
        }
        
        loadNoteList();

        if(storage['currentNote']){
            applyNote(JSON.parse(storage['currentNote'], true));
        }

        // TODO: improve, loading after view render
        
        

        $('#notelist').delegate('li', 'click', function(){
            // save current?
            console.log('got note', $(this).attr('data-id'));
            var li = $(this);
            socket.emit('note/find', $(this).attr('data-id'), function(err, note){
                applyNote(note);
            });
        });

        $('#notelist').delegate('.del', 'click', function(e){
            var li = $(this).parent(),
                id = li.data('id');
            console.log('del note', id)
            socket.emit('note/delete', id, function(err, note){
                if(!err) li.remove();
                console.log('del note', arguments);
            });
            return false;
        });

        // resize
        var targets = $('#main'), nav = $('#nav');
        $(window).bind('resize', function(){
            var win = $(this);
            nav.height(win.height() - 68);
            nav.css({visibility: 'visible'});
            var navwidth = nav.is(':visible') ? nav.width() : 0;
            targets.css({ width: win.width() - navwidth, left: navwidth, visibility: 'visible'});
        }).triggerHandler('resize');

        // menu item
        $('#bar li > a, #bar a.icon').menuItem({
            on: {
                note5: function(e){
                    if($.trim($(this).html()) == 'About NomNotes'){
                        $('<div />').window({ 
                            url: '/about'
                        });
                    }
                    MenuItem.hideAll(e);
                },
                // once toolbar config comes from json, bind these events using a json select
                // 'window.navigator': function(e){} ...
                window: function(e){
                    if($.trim($(this).html()) == 'Navigator'){
                        MenuItem.hideAll(e);
                        $('#nav').toggle();
                        $(window).triggerHandler('resize');
                    }
                },
                file: function(e){
                    if($.trim($(this).html()) == 'New'){
                        resetNote();
                    }
                    else if($.trim($(this).html()) == 'Save'){
                        // TODO: build better gatherer
                        var note = getNote();

                        // if(offline){
                        //     var exists = $('#notelist li[data-id="' + note.id + '"]');
                        //     if(exists.length) exists.html('<a class="del">x</a>' + note.title);
                        //     else $('#notelist').prepend('<li data-id="' + note.id + '"><a class="del">x</a>' + note.title + '</li>')
                        //     storage['currentNote'] = JSON.stringify(note);
                        // }
                        
                        socket.emit('note/save', note, function(err, note){
                            // ... success then update html and close
                            console.log('done save note', arguments); 
                            storage['currentNote'] = JSON.stringify(note);
                            // save id
                            $('#current-note-id').val(note.id);

                            // update list
                            var exists = $('#notelist li[data-id="' + note.id + '"]');
                            if(exists.length) exists.html('<a class="del">x</a>' + note.title);
                            else $('#notelist').prepend('<li data-id="' + note.id + '"><a class="del">x</a>' + note.title + '</li>');

                            markActiveNote(note.id);
                        });
                    }
                    MenuItem.hideAll(e);
                }
            }
        });

        /*// flash login link if user remains logged out for too long
        var flashLogin = function(ms, att, i){
            if(att >= 3) return;
            if(i === 4){
                att++;
                i = 0;
                ms = 2 * 60 * 1000;
            } 
            
            setTimeout(function(){
                var l = $('#bar .login');
                //if(!l.hasClass('active')){
                    l.toggleClass('active');
                    flashLogin(400, att, ++i);
                //}
            }, ms);
        };

        flashLogin(2 * 60 * 1000, 0, 0);
        */
        $('#login span.spin').spin({ color: '#fff', radius: 14, lines: 12, width: 0, length: 10 });

        // data
        
       
        var $login = $('#login'),
            $form = $('#signed-out'),
            $signedIn = $('#signed-in');
        
        // narrow the scope of span.text
        $signedIn.delegate('span.text', 'click', function(e){
            $('<div />').window({ 
                url: '/session/profile', // GET
                submit: function(e, form){
                    var self = this;
                    e.preventDefault();
                    var data = $(form).serializeObject();
                    socket.emit('user/save', data, function(err, user){
                        // ... success then update html and close
                        console.log('done save', arguments); 
                        self.destroy(); // modal close
                    });
                }
            });
            MenuItem.hideAll(e);
        });
        // jquery validate form
        $form.validate();

        // activate logout
        $signedIn.find('a.signout').click(function(e){
            socket.emit('session/destroy', {}, function(){
                $('a.icon.login .text').html('Sign in');
                $signedIn.hide();
                $form.show().find('input:first').focus();
                delete storage['currentNote'];
                resetNote();
                $('#notelist').empty();
            });
            e.preventDefault();
        });

        $login.find(':input')
            .focus(function(){ $(this).next('.mark').removeClass('check').css('visibility', 'visible'); })
            .blur(function(){ $(this).next('.mark').css('visibility', 'hidden'); });
       
        $login.find('input[name=username]').blur(function(){
            var $this = $(this);
            if(this.value){
                $login.addClass('loading');
                socket.emit('user/exists', { username: this.value }, function(exists){
                    $login.removeClass('loading');
                    if(exists){ // login
                        $login.find('input[name=password]').focus();
                        $login.find('.reg').hide('fast');
                    }
                    else { // register
                        $this.next('.mark').addClass('check').css('visibility', 'visible');
                        $login.find('.reg').show('fast', function(){
                            $login.find('input[name=email]').focus();
                        });
                    }
                });
            }
        });

        $login.find('form').submit(function(e){
            if(true){ // form is valid
                $login.addClass('loading');
                var route = $login.find('.reg:visible').length > 0 ? 'user/save' : 'session/new';
                var formData = $login.find('form').serializeObject();
                socket.emit(route, formData, function(err, user){
                    $login.removeClass('loading');
                    if(user){ 
                        $('a.icon.login .text').html(user.username);
                        $signedIn.find('span.text').html(user.email);
                        $signedIn.find('img').attr('src', "http://www.gravatar.com/avatar/" + user.gravatar);
                        $form.hide()
                            .find('.reg').hide().end() // reset view
                            .find(':input').val('');   // clear
                        $signedIn.show();
                        // delay the hide and slow it down
                        setTimeout(function(){ MenuItem.hideAll(e, 400); }, 1200);
                        loadNoteList();
                    }
                    else { console.log(route, err); }
                });
            }
            e.preventDefault();
        });


        // socket.emit('addnote', { 
        //  data: '<b> this is a test note body. </b>',
        //  title: 'New Note'
        // });

        // socket.on('notesaved', function(note){
        //     console.log(note);
        // });

        // socket.emit('user/save', { 
        //   username: 'josiah',
        //   password: 'lolworld',
        //   firstname: 'josiah',
        //   lastname: 'ruddell',
        //   email: 'jruddell@gmail.com'
        // });

        // socket.on('user/saved', function(user){
        //     console.log('log saved ', user);
            
        // });
        // socket.on('user/authorized', function(user){
        //     console.log('log authorized', user);
            
        // });

        // socket.emit('user/auth', {
        //     username: 'josiah',
        //     password: 'lolworld'
        // });

        // socket.on('user/authorized', function(user){
        //     console.log('log authorized', user);
            
        // });


    });
});
