/*

________________________________________________________
\\\|///
 \\|//   Window is the basic modal dialog
  \|/    used for UX separation of concerns
   |


*/


define(['jquery'], function($){ 
    var Window = function(el, opts){
        this.el = $(el);
        this.doc = $(document);
        this.opts = $.extend({}, defaults, opts); 
        this.init();
    }

    Window.prototype = {
        init: function(){
            var self = this;
            this.cache = {
                'document': [ { 'click' : $.proxy(self.close, self) } ]
            };
            this._bind();
        },
        _bind: function(){
            for(var name in this.cache){
                $(name).bind(name, this.cache[name].fn);
            }
        },
        _unbind: function(){
            for(var name in this.cache){
                $(this.cache[name].el).unbind(name, this.cache[name].fn);
            }
        },
        
        _build: function(e){
        
        },
        _destroy: function(){
        
        },
        open: function(e){
            
            if(this.isOpen) this.close();
            
        },
        close: function(){
            if(!this.isOpen) return;
            this.isOpen = false;
            this._destroy();
        }
    }

    var defaults = {
    
    }

    return Window;
});