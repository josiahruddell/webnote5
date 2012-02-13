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
    'util/helpers',
    'util/data',
    'class/MenuItem/MenuItem',
    'util/extensions'
],
function($, ui, data, MenuItem) {
    $(function() {
        // alias
        var socket = data.socket,
            storage = data.storage,
            offline = false,
            currentNote;
        // one edit
        $('div.page').oneEdit();

        ui.loadNoteList();

        if(storage['currentNote']){
            ui.applyNote(JSON.parse(storage['currentNote'], true));
        }
        $('.data-field').bind('focus', function() {
            var $this = $(this);
            $this.data('before', $this.html());
            return $this;
        }).bind('blur keyup paste', function() { /// meh, no likey
            var $this = $(this);
            if ($this.data('before') !== $this.html()) {
                $this.data('before', $this.html());
                $this.trigger('change');
            }
            return $this;
        }).bind('change', function(){
            ui.saveDelayed(7000);
        });

        $('#notelist').delegate('li', 'click', function(e){
            // save current?
            console.log('loading note', $(this).attr('data-id'));
            var li = $(this),
                win = $('<div />').window({ html: '<span class="text">Loading...</span>' });
            socket.emit('note/find', $(this).attr('data-id'), function(err, note){
                ui.applyNote(note);
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
                            History.pushState({ command: 'openwindow' }, null, '/about');
                        break;
                        case 'Preferences...':
                            History.pushState({ command: 'openwindow' }, null, '/preferences');
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
                        ui.resetNote();
                    }
                    else if($.trim($(this).html()) == 'Save'){
                        ui.saveNote();
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
                ui.resetNote();
                $('#notelist').empty();
                ui.applyTheme();
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
                        ui.loadNoteList();
                        ui.applyTheme(user.theme || 'default');
                    }
                    else { console.log(route, err); }
                });
            }
            e.preventDefault();
        });
    });
});