/*

____________________________________________
\\\|///
 \\|//   Require classes, and activate jquery
  \|/    plugins for easy element integration
   |


*/
define([
    'jquery', 
    'class/MenuItem/MenuItem', 
    'class/OneEdit/OneEdit', 
    'lib/spin.js/spin', 
    'lib/jquery/Plugins/jquery.validate.min',
    'lib/jquery/Plugins/jquery.hotkeys',
    'lib/jquery/Plugins/jquery.history'
], 
function($, MenuItem, OneEdit){
    $.fn.oneEdit = function(options){
        return this.each(function(){
            $(this).data('OneEdit', new OneEdit(this, options));
        });
    }


    $.fn.menuItem = function(opts){ // on plugin call
        // TODO: make items an array of elements to support multiple menus on one page
        // shared members
        MenuItem.init();
        MenuItem.items = this.each(function(){ 
            $(this).data('menuItem', new MenuItem(this, opts));
        });

        return MenuItem.items;
    };

    $.fn.spin = function(opts) {
      this.each(function() {
        var $this = $(this),
            data = $this.data();

        if (data.spinner) {
          data.spinner.stop();
          delete data.spinner;
        }
        if (opts !== false) {
          data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
        }
      });
      return this;
    };

    $.fn.serializeObject = function(){
        var o = {},
            a = this.serializeArray();
        
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    $(window).on('statechange', function(){
        var state = History.getState(),
            command = state.data.command;
        
        //console.log('statechange', state)
        
        if(command == 'openwindow'){
            var o = $.extend(state.data.opts || {}, {
                url: state.cleanUrl,
                history: true
            });
            
            $(state.data.el || '<div />').window(o);
        }
        else if(command == 'closewindow'){
            $('div.window').each(function(){
                var win = $(this).data('window');
                if(win) win.destroy(); // close all?
            });
        }
    })

    // var $divinput = $('div.input'),
    //         $fakeinput = $('#fake').bind('keypress.divinput', function(e){
    //             console.log('keydown');
    //             e.stopPropagation();
    //         });

    //     $('button.dev').click(function(){
    //         if(this.innerHTML == 'activate'){
    //             bindinput();
    //             this.innerHTML = 'deactivate';
    //         }
    //         else
    //         {
    //             unbindinput();
    //             this.innerHTML = 'activate';
    //         }
    //     });
    //     var bindinput = function(){
    //         $(document).bind('keypress.divinput', function(e){
    //             var val = $fakeinput.val(),
    //                 char = String.fromCharCode(e.which);
    //             $fakeinput.val(val + char);
    //             $divinput.html($fakeinput.val());
    //             return false;
    //         });
    //     };
    //     var unbindinput = function(){
    //         $(document).unbind('keypress.divinput');
    //     };
    //     // develop

    // gatherer coming soon (and will be renamed)
    $.fn.window = (function($, root){
        // TODO: move out of global ns
        // constructor
        var Window = function(el, opts){
            Window.closeAll(opts.history);
            this.el = $(el).attr('id', opts.id || new Date().getTime());
            $.extend(this, opts);
            this.load();
        };
        Window.items = [];
        Window.closeAll = function(pushNext){
            // console.log('closing all windows from constructor: %s', constructor);
            // if pushNext is true do not invoke the history to close the modal
            for (var i = 0; i < Window.items.length; i++){
                // don't
                Window.items[i].beginClose(pushNext);
                delete Window.items[i];
            }

            Window.items = [];
        };
        // global events
        $(document).bind('click', function(){ Window.closeAll(); });

        // instance members
        Window.prototype = {
            setup: function(){
                this.showing = false;
                this.applyBindings();
                this.position();
                Window.items.push(this);
                this.show();
            },
            load: function(){
                var self = this;
                this.inner = $('<div class="inner" />');
                var compact = this.html ? ' compact' : '';
                this.el.addClass('window' + compact)
                    .appendTo('body').append(this.inner);
                if(this.url){
                    this.inner.load(this.url, function(){
                        if(self.beforeShow) self.beforeShow.call(self);
                        self.setup();
                    });
                }
                else{

                    this.inner.append(this.html ? this.html : $(this.content));
                    this.setup();
                }
            },
            show: function(){
                this.el.fadeIn('fast');
            },
            applyBindings: function(){
                var self = this;
                this.el.click(function(e){
                    e.stopPropagation();
                });
                this.el.find('.cancel').click(function(){
                    self.destroy();
                    return false;
                });
                // if there is a from bind it to the submit function
                this.el.find('form').submit(function(e){
                    self.submit(e, this); // call submit, pass the form
                });

            },
            position: function(){
                var winW = $(window).width(),
                    w = this.el.width();
                this.el.css('left', winW/2 - w/2);
            },
            beginClose: function(pushNext){
                if(this.history && !pushNext){
                    History.pushState({ 
                        command: 'closewindow', 
                        el: '#' + this.el.attr('id') 
                    }, null, '/');
                }
                else{
                    this.destroy();
                }
            },
            destroy: function(){
                this.el.fadeOut('fast', function(){ $(this).remove(); })  
            },
            toggleShow: function(e){
                // don't toggle for mouseover, leave open

            }
        };
        
        return function(opts){ // on plugin call
            return this.each(function(){ 
                $(this).data('window', new Window(this, opts));
            });
        }
    })(jQuery, this);
});

(function(){
    // remove layerX and layerY
    var all = $.event.props,
        len = all.length,
        res = [];
    while (len--) {
      var el = all[len];
      if (el != 'layerX' && el != 'layerY') res.push(el);
    }
    $.event.props = res;
}());