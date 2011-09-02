define(['jquery', 'lib/jquery/plugins/jquery.textselect'], function($){	
	var ToolbarItem = function(el, opts){
        this.el = el;
        this.opts = opts;
        this.init();
    }

    ToolbarItem.prototype = {
        init: function(){
            //
        },
        // 
        apply: function(){
            throw Error('Not Implemented Error');
        }
    }

    var Box = function(plane){
        this.plane = plane
    }

    Box.prototype = {
        hasPoint: function(point, padd){
            if(padd === undefined) padd = 0;
            return point[1] >= this.plane[0] - padd  // top
                && point[0] <= this.plane[1] + padd  // right
                && point[1] <= this.plane[2] + padd  // bottom
                && point[0] >= this.plane[3] - padd; // left   
        }
    }

    var OneEdit = function(el, opts){
        this.el = $(el);
        this.doc = $(document);
        this.opts = $.extend({}, defaults, opts); 
        this.init();
    }

    OneEdit.prototype = {
        init: function(){
            var self = this;
            this.cache = {
                'mousemove': { el: document, fn: $.proxy(self.opacityInterest, self) },
                'mouseup': { el: document, fn: $.proxy(self.close, self) }
            };
            this._bind();

            this.el.bind("mouseup", $.proxy(self.open, self));
        },
        _bind: function(){
            for(var name in this.cache){
                $(this.cache[name].el).bind(name, this.cache[name].fn);
            }
        },
        _unbind: function(){
            for(var name in this.cache){
                $(this.cache[name].el).unbind(name, this.cache[name].fn);
            }
            this.el.unbind("mouseup");
        },
        _getIcons: function(){
            var ul = $('<ul class="toolbar">');
            var self = this;
            for (var i in this.opts.toolbar){
                var item = this.opts.toolbar[i];
                console.log(item)
                $('<li>')
                    .append(item.text)
                    .attr('alt', item.alt).attr('title', item.alt)
                    .click($.proxy(item.action, self))
                    .appendTo(ul);
            }
            return ul;
        },
        _build: function(e){
            this.wrapper = $('<div class="oneformat">')
                .append(this._getIcons())
                .css({
                    opacity: '.5',
                    position: 'absolute',
                    top: e.pageY + 15,
                    left: e.pageX
                })
                .appendTo(document.body)
                .mouseup(false);
            // save info
            this.offset = this.wrapper.offset();
            this.width = this.wrapper.width();
            this.height = this.wrapper.height();
            this.box = new Box([
                this.offset.top, 
                this.offset.left + this.width, 
                this.offset.top + this.height, 
                this.offset.left
            ]);
        },
        _destroy: function(){
            //this._unbind();
            if(this.wrapper)
                this.wrapper.animate({opacity: 0}, 150, function(){
                    $(this).remove();
                });
            this.offset = null;
            this.height = null;
            this.width = null;
        },
        open: function(e){
            console.log('open');
            if(this.isOpen) this.close();
            this.range = this.el.textSelect('getRange');
            if (this.range.start !== this.range.end){
                this.isOpen = true;
                this._build(e);
                // show formatter
            }
            e.stopPropagation();
        },
        close: function(){
            if(!this.isOpen) return;
            console.log('close');
            this.isOpen = false;
            this._destroy();
        },
        opacityInterest: function(e){
            if(!this.isOpen) return;
            
            var mousePoint = [e.pageX, e.pageY];
            
            if(this.box.hasPoint(mousePoint, 10)){
                if(this.opacity !== 1) {
                    this.opacity = 1;
                    this.wrapper.animate({ opacity: this.opacity }, 110);
                }
            }
            else if(this.box.hasPoint(mousePoint, 85)){ // has point with 80px padding on box
                if(this.opacity !== 0.4) {
                    this.opacity = 0.4;
                    this.wrapper.animate({ opacity: this.opacity }, 110);
                }
            }
            else{
                //this.close();
                if(this.opacity !== 0.0) {
                    this.opacity = 0.0;
                    this.wrapper.animate({ opacity: this.opacity }, 110);
                }
            }
        }
    }

    // TODO: make class for toolbar item so this association is clean
    var defaults = {
        toolbar: {
            bold : {
                alt: 'Bold',
                text: '<b>B</b>',
                action: function(e){
                    e.stopPropagation();
                    if(this.range.startElement == this.range.endElement && this.range.start !== this.range.end){
                        var wholeText = this.range.endElement.data,
                            left = wholeText.substring(0, this.range.start), 
                            right = wholeText.substring(this.range.end, wholeText.length),
                            data = $('<b>' + wholeText.substring(this.range.start, this.range.end) + '</b>');
                        $(this.range.startElement).replaceWith($('<span>').append(left).append(data).append(right));
                        data.textSelect('select');
                        this.range = $.textSelect('getRange');
                    }
                    //so then what is the point in doing the start != var wholeText = this.range....
                }   
            },
            italic : {
                alt: 'Italic',
                text: '<b><i>I</i></b>',
                action: function(e){
                    e.stopPropagation();
                    if(this.range.startElement == this.range.endElement && this.range.start !== this.range.end){
                        var wholeText = this.range.endElement.data,
                            left = wholeText.substring(0, this.range.start), 
                            right = wholeText.substring(this.range.end, wholeText.length),
                            data = $('<i>' + wholeText.substring(this.range.start, this.range.end) + '</i>');
                        $(this.range.startElement).replaceWith($('<span>').append(left).append(data).append(right));
                        data.textSelect('select');
                        this.range = $.textSelect('getRange');
                    }
                }   
            }
        }
    }

    return OneEdit;
});