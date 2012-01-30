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
        var socket = io.connect(null, {
            reconnect: true,
            transports: [/*'websocket',*/'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'] //websocket is not working with joyent hosting
        }),
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

        function applyTheme(theme){
            if(theme == 'default'){
                $('head link[id]').remove();
            }
            else{
                $('head link[id]').remove();
                $('head').prepend('<link rel="stylesheet" id="current-theme-style" href="/stylesheets/themes/' + theme + '.css" />');
            }
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
            socket.emit('note/titles', {}, function(err, notes){
                console.log(notes);
                var list = $('#notelist').empty(), cls;
                for(var i = 0; i < notes.length; i++){
                    cls = (currentNote && currentNote.id) == notes[i].id ? 'active' : '';
                    list.append('<li class="' + cls + '" data-id="' + notes[i].id + '"><a class="del">x</a>' + notes[i].title + '</li>');
                }
            });
        }

        function saveNote(){
            console.log('save');
            var note = getNote();
            var win = $('<div />').window({ html: '<span class="text">Saving...</span>' });
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
                win.data('window') && win.data('window').destroy();
            });
        }
        var saveTimeoutId;
        function saveDelayed(ms){
            if(saveTimeoutId) clearTimeout(saveTimeoutId);
            
            saveTimeoutId = setTimeout(function(){
                saveNote();
            }, ms);
        }
        
        loadNoteList();

        if(storage['currentNote']){
            applyNote(JSON.parse(storage['currentNote'], true));
        }
        $('.data-field').bind('focus', function() {
            var $this = $(this);
            $this.data('before', $this.html());
            return $this;
        }).bind('blur keyup paste', function() {
            var $this = $(this);
            if ($this.data('before') !== $this.html()) {
                $this.data('before', $this.html());
                $this.trigger('change');
            }
            return $this;
        }).bind('change', function(){
            saveDelayed(7000);
        });

        $('#notelist').delegate('li', 'click', function(e){
            // save current?
            console.log('loading note', $(this).attr('data-id'));
            var li = $(this),
                win = $('<div />').window({ html: '<span class="text">Loading...</span>' });
            socket.emit('note/find', $(this).attr('data-id'), function(err, note){
                applyNote(note);
                console.log('applied note, closing window');
                win.data('window') && win.data('window').destroy();
            });
            return false;
        });

        $('#notelist').delegate('.del', 'click', function(e){
            var li = $(this).parent(),
                id = li.data('id');
            var win = $('<div />').window({ html: '<span class="text">Deleting...</span>'});
            socket.emit('note/delete', id, function(err, note){
                if(!err) li.remove();
                win.data('window') && win.data('window').destroy();
            });
            return false;
        });

        // resize
        var targets = $('#main'), nav = $('#nav');
        // console.log('storage says', storage['sidebarVisible'])
        //if(nav.find('li').length)
        // if(!storage['sidebarVisible'])
        //     nav.css('display', 'none');
        // else nav.css('display', 'block');

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
                    switch($.trim($(this).html())){
                        case 'About NomNotes':
                            $('<div />').window({ url: '/about' });
                        break;
                        case 'Preferences...':
                            $('<div />').window({ 
                                url: '/user/preferences', 
                                submit: function(e, form){
                                    var self = this;
                                    e.preventDefault();
                                    var data = $(form).serializeObject();
                                    console.log('save theme', data); 
                                    socket.emit('user/save', data, function(err, user){
                                        console.log('done save user', arguments); 
                                        self.destroy(); // modal close
                                    });
                                },
                                beforeShow: function(){
                                    this.inner.find('select').change(function(){
                                        applyTheme($(this).val());
                                    });
                                } 
                            });
                        break;
                    }
                    MenuItem.hideAll(e);
                },
                // once toolbar config comes from json, bind these events using a json select
                // 'window.navigator': function(e){} ...
                window: function(e){
                    if($.trim($(this).html()) == 'Navigator'){
                        MenuItem.hideAll(e);
                        var nav = $('#nav').toggle();
                        storage['sidebarVisible'] = nav.is(':visible');
                        $(window).triggerHandler('resize');
                    }
                },
                file: function(e){
                    if($.trim($(this).html()) == 'New'){
                        resetNote();
                    }
                    else if($.trim($(this).html()) == 'Save'){
                        saveNote();
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
       
        var $login = $('#login'),
            $form = $('#signed-out'),
            $signedIn = $('#signed-in'),
            toggleLoginView = function(e){
                if($form.find('.reg:visible').length){ // reg view
                    showLoginView.call(this);
                }
                else{ // login view
                    showRegView.call(this);
                }
                return false;   
            },
            showRegView = function(fn){
                $login.find('.reg').css({ height: 0, opacity: 0})
                    .show()
                    .animate({ height: 29, opacity: 1}, fn || function(){
                        $login.find('input[name=username]').focus();
                    });
                $(this).html('Already have an account?');
            },
            showLoginView = function(fn){
                $login.find('.reg').animate({ height: 0, opacity: 0}, function(){ 
                    $(this).hide(); 
                    if(fn) fn()
                    else $login.find('input[name=username]').focus();
                        
                });
                $(this).html("Don't have an account?");
            };
        
        $form.find('a.toggleView').click(toggleLoginView);

        // narrow the scope of span.text
        $signedIn.delegate('span.text', 'click', function(e){
            $('<div />').window({ 
                url: '/session/profile', // GET
                submit: function(e, form){
                    var self = this;
                    e.preventDefault();
                    var data = $(form).serializeObject();
                    console.log('saving user', data); 
                    socket.emit('user/save', data, function(err, user){
                        // ... success then update html and close
                        console.log('done save user', arguments); 
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
                $('head link[id]').remove();
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
                        if($login.find('.reg:visible').length > 0)
                            showLoginView.call($form.find('a.toggleView'), function(){
                                $login.find('input[name=password]').focus(); 
                            });
                    }
                    else { // register
                        $this.next('.mark').addClass('check').css('visibility', 'visible');
                        if($login.find('.reg:visible').length == 0)
                            showRegView.call($form.find('a.toggleView'), function(){
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
                        applyTheme(user.theme || 'default');
                    }
                    else { console.log(route, err); }
                });
            }
            e.preventDefault();
        });

    });
});
