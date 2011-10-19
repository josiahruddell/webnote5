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
    'lib/jquery/Plugins/jquery.hotkeys'
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
            Window.closeAll();
            this.el = $(el);
            $.extend(this, opts);
            if(this.url)
                this.load()
            else
                this.setup();

        };
        Window.items = [];
        Window.closeAll = function(){
            for (var i = 0; i < Window.items.length; i++){
                Window.items[i].destroy();
                Window.items = Window.items.splice(i + 1, 1);
            }
        }
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
                this.el.addClass('window')
                    .appendTo('body').append(this.inner);
                this.inner.load(this.url, function(){
                    self.setup();
                });
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