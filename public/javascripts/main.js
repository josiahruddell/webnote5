require(['jquery', 'class/MenuItem/MenuItem', 'lib/socket.io/socket.io.min', 'util/extensions'], function($, MenuItem) {
    $(function() {
        // one edit
        $('#bodytext').oneEdit();
        
        // resize
        var targets = $('#main'), nav = $('#nav');
        $(window).bind('resize', function(){
            var win = $(this), navwidth = nav.is(':visible') ? nav.width() : 0;
            nav.height(win.height() - 68);
            targets.css({ width: win.width() - navwidth, left: navwidth});
        }).triggerHandler('resize');

        // menu item
        $('#bar li > a, #bar a.icon').menuItem({
            on: {
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
                    if($.trim($(this).html()) == 'Save'){
                        console.log('save');
                        MenuItem.hideAll(e);
                    }
                }
            }
        });

        // data
        var socket = io.connect();
        
        socket.emit('addnote', { 
         data: '<b> this is a test to disprove Johnny skepticism. </b>',
         title: 'johnny sucks'
        });

        socket.on('notesaved', function(note){
            console.log(note);
        });

    });
});
