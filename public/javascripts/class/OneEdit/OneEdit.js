/*

________________________________________________________
\\\|///
 \\|//   A new editor
  \|/    contenteditable rich text editor
   |


*/


define([
    'jquery'
    //, 'lib/jquery/Plugins/jquery.textselect' // (see selection helper instead)
], 
function($){
    
    var SelectionHelper = {
        insertNodeAtCursor: function(node) {
            var sel = SelectionHelper.saveSelection(), range, html;
            
            if (sel.insertNode) {
                sel.insertNode(node);
            } else if (sel.pasteHTML) {
                html = (node.nodeType == 3) ? node.data : node.outerHTML;
                sel.pasteHTML(html);
            }
            SelectionHelper.restoreSelection(sel);
        },
        saveSelection: function () {
            if (window.getSelection) {
                var sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    return sel.getRangeAt(0);
                }
            } else if (document.selection && document.selection.createRange) {
                return document.selection.createRange();
            }
            return null;
        },
        restoreSelection: function (range) {
            if (range) {
                if (window.getSelection) {
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else if (document.selection && range.select) {
                    range.select();
                }
            }
        },
        // http://stackoverflow.com/a/987376/39013
        selectElement: function(element) {
            var doc = document;
            var text = element;//doc.getElementById(element);    

            if (doc.body.createTextRange) { // ms
                var range = doc.body.createTextRange();
                range.moveToElementText(text);
                range.select();
            } else if (window.getSelection) { // moz, opera, webkit
                var selection = window.getSelection();            
                var range = doc.createRange();
                range.selectNodeContents(text);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    };

    var ToolbarItem = function(el, opts){
        this.el = el;
        this.opts = opts;
        this.init();
    }

    ToolbarItem.prototype = {
        init: function(){
            
        },

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
            this.doc = document;
            this.cache = {
                'mousemove.doc': { el: document, fn: $.proxy(self.opacityInterest, self) },
                'mouseup.doc': { el: document, fn: $.proxy(self.close, self) },
                'mouseup.el': { el: this.el, fn: $.proxy(self.open, self) },
                'keydown.el': { el: this.el, fn: $.proxy(self.checkKeySelect, self) }
            };
            this._build();
            this._bind();
            // moved to body so that when the mouse is out of the container the event
            // is still captured
            // this.el.bind('mouseup', $.proxy(self.open, self));
            
            this.wrapper.hover(function(e){
                self.mouseIsOver = true;
            }, function(e){
                self.mouseIsOver = false;
            });
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
            // this.el.unbind("mouseup");
        },
        _getIcons: function(){
            var ul = $('<ul class="toolbar">');
            var self = this;
            for (var i in this.opts.toolbar){
                var item = this.opts.toolbar[i], prompt = ('prompt' in item);
                item.command = i;
                //console.log(item)
                var $li = $('<li>')
                    .append(item.text)
                    .attr('alt', item.alt).attr('title', item.alt)
                    .mousedown((function(item){
                        return function(e){
                            item.el = this;
                            if(item.action)
                                item.action.call(item, e, function(e, v){
                                    item.value = v;
                                    defaultToolbarAction.call(item, e);
                                })
                            else 
                                defaultToolbarAction.call(item, e);
                        }
                    })(item))
                    .appendTo(ul);

                if(item.keys) self.el.bind('keydown', item.keys[0], (function(li){
                    return function(e){
                        li.trigger('mousedown', e);
                        return false;
                    }
                })($li));
            }
            return ul;
        },
        _build: function(e){
            this.wrapper = $('<div class="oneformat">')
                .append(this._getIcons())
                .css({
                    opacity: '.5',
                    position: 'absolute',
                    visibility: 'hidden'
                })
                .appendTo(document.body)
                .mouseup(false);
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
        position: function(e){
            // if(e.type == 'mouseup')
            //     this.wrapper.css({
            //         top: e.pageY + 15,
            //         left: e.pageX  
            //     });
            // else{ // position for selected element
                console.log('positioning');
                var n = $('<span />');
                SelectionHelper.insertNodeAtCursor(n[0]);
                var p = n.offset();
                n.remove();
                this.wrapper.css({
                    top: p.top - 25, // offset by text size?
                    left: p.left
                });
            //}
            this.offset = this.wrapper.offset();
            this.width = this.wrapper.width();
            this.height = this.wrapper.height();
            console.log('positioning', this.offset);
            this.box = new Box([
                this.offset.top, 
                this.offset.left + this.width, 
                this.offset.top + this.height, 
                this.offset.left
            ]);
        },
        open: function(e){
            console.log('open', e);
            var self = this;
            setTimeout(function(){
                if(self.isOpen) self.close();
                self.range = SelectionHelper.saveSelection();
                console.log('open if: ', self.range && !self.range.collapsed)
                if (self.range && !self.range.collapsed){
                    self.isOpen = true;
                    self.position(e);
                    self.wrapper.css({
                        visibility: 'visible',
                        opacity: e.type == 'mouseup' ? '.5' : '.9'
                    });
                    // show formatter
                }
            }, 10)
            e.stopPropagation();
        },
        close: function(destroy){
            if(!this.isOpen) return;
            //console.log('close');
            this.isOpen = false;
            this.wrapper.css('visibility', 'hidden');
            if(destroy === true) this._destroy();
        },
        checkKeySelect: function(e){
            if(e.shiftKey){
                this.deferShow(e);
            }
            else if (!e.ctrlKey && !e.altKey) // other keys to not close for
                this.close();
        },
        deferShow: function(e){
            if(this.shiftKeyShowTimeoutId) clearTimeout(this.shiftKeyShowTimeoutId);
            var self = this;
            this.shiftKeyShowTimeoutId = setTimeout(function(){
                self.open(e);
            }, 250);
        },
        opacityInterest: function(e){
            if(!this.isOpen) return;
            
            var mousePoint = [e.pageX, e.pageY];

            if(this.mouseIsOver || this.box.hasPoint(mousePoint, 10)){
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
    var defaultToolbarAction =  function(e){
        var $t = $(this.el).addClass('icon-hover');
        setTimeout(function(){ $t.removeClass('icon-hover'); }, 150)
        e.stopPropagation();
        console.log(this.command, this.value);
        document.execCommand(this.command, false, this.value);
        e.preventDefault();
    } 
    var defaultToolbarItems = {
        'bold': { 
            alt: 'Bold',
            text: '<b>B</b>',
            keys: ["ctrl+b"]
        },
        'italic': {
            alt: 'Italic',
            text: '<b><i>I</i></b>',
            keys: ["ctrl+i"]
        },
        'underline': {
            alt: 'Underline',
            text: '<b><u>U</u></b>',
            keys: ["ctrl+u"]
        },
        'increaseFontSize': {
            alt: 'Increase Font Size',
            keys: ["ctrl+["],
            text: 
                '<div class="icon icon-increase-font">' +
                    '<div class="icon-increase-font-text">A</div>' +
                    '<div class="icon-increase-font-arrow"></div>' +
                '</div>'
            // action: function(e, fn){
            //     e.preventDefault();
            //     e.stopPropagation();
            //     debugger;
            //     var sel = SelectionHelper.saveSelection();
            //     if(sel.endContainer == sel.startContainer){
            //         var t = $(sel.endContainer).text();
            //         t = t.substring(0, sel.endOffset)
            //         var newT = $('<font style="font-size: 110%">'+ t +'</font>');
                    
            //         $(sel.endContainer).replaceWith(newT);
            //         SelectionHelper.selectElement(newT[0]);
            //     }
            //     else{
            //         var allText = sel.startContainer.wholeText || $(sel.startContainer).text();

            //         var startText = allText.substring(0, sel.startOffset);
            //         var selectedText = allText.substring(sel.startOffset, sel.endOffset);
            //         var endText = allText.substring(sel.endOffset);

            //         var formatted = $('<font style="font-size: 110%" />').append(selectedText);
            //         var wrap = $('<span />')
            //             .append(startText)
            //             .append(formatted)
            //             .append(endText);
            //         $(sel.startContainer).replaceWith(wrap);
            //         SelectionHelper.selectElement(wrap[0]);
            //     }

                
                
            // }
            
        },
        'decreaseFontSize': {
            alt: 'Decrease Font Size',
            keys: ["ctrl+]"],
            text: 
                '<div class="icon icon-decrease-font">' +
                    '<div class="icon-decrease-font-text">A</div>' +
                    '<div class="icon-decrease-font-arrow"></div>' +
                '</div>'
        },
        // 'strikeThrough': {
        //     alt: 'Strike Through',
        //     text: '<b><s>S</s></b>'
        // },
        'foreColor': {
            alt: 'Fore Color',
            text: 
                '<div class="icon icon-colors">' +
                 '<div class="icon-colors-1"></div>' +
                 '<div class="icon-colors-2"></div>' +
                 '<div class="icon-colors-3"></div>' +
                 '<div class="icon-colors-4"></div>' +
                 '<div class="icon-colors-5"></div>' +
                 '<div class="icon-colors-6"></div>' +
                 '<div class="icon-colors-7"></div>' +
                 '<div class="icon-colors-8"></div>' +
                 '<div class="icon-colors-9"></div>' +
                '</div>',
            action: function(e, fn){
                e.preventDefault();
                e.stopPropagation();
                var prompt = $(this.prompt),
                    parent = $(e.target).parents('li');
                
                if(parent.find('ul').length == 0){
                    prompt.appendTo(parent);
                    prompt.mousedown(function(e){
                        var value = $(e.target).attr('data-color');
                        setTimeout(function(){ parent.find('ul').toggle(); }, 10);
                        fn(e, value);
                    });
                }
                else{
                    parent.find('ul').toggle();
                }
                
            },
            prompt: '<ul class="sub-toolbar">' +
                        '<li class="color" data-color="#fff" style="background-color: #fff"></li>' +
                        '<li class="color" data-color="#eeece1" style="background-color: #eeece1"></li>' +
                        '<li class="color" data-color="#595959" style="background-color: #595959"></li>' +
                        '<li class="color" data-color="#000000" style="background-color: #000000"></li>' +
                        '<li class="color" data-color="#262626" style="background-color: #262626"></li>' +
                        '<li class="color" data-color="#1f497d" style="background-color: #1f497d"></li>' +
                        '<li class="color" data-color="#4f81bd" style="background-color: #4f81bd"></li>' +
                        '<li class="color" data-color="#c0504d" style="background-color: #c0504d"></li>' +
                        '<li class="color" data-color="#9bbb59" style="background-color: #9bbb59"></li>' +
                        '<li class="color" data-color="#8064a2" style="background-color: #8064a2"></li>' +
                        '<li class="color" data-color="#4bacc6" style="background-color: #4bacc6"></li>' +
                        '<li class="color" data-color="#f79646" style="background-color: #f79646"></li>' +
                    '</ul>'
        },
        'insertOrderedList': {
            alt: 'Ordered List',
            keys: ["ctrl+shift+o"],
            text: 
                '<div class="icon icon-ordered-list">' +
                    '<div class="icon-ordered-list-bullet-1">1</div>'+
                    '<div class="icon-ordered-list-line-1"></div>'+
                    '<div class="icon-ordered-list-bullet-2">2</div>'+
                    '<div class="icon-ordered-list-line-2"></div>'+
                    '<div class="icon-ordered-list-bullet-3">3</div>'+
                    '<div class="icon-ordered-list-line-3"></div>'+
                '</div>'
        },
        'insertUnorderedList': {
            alt: 'Unordered List',
            keys: ["ctrl+shift+u"],
            text: 
                '<div class="icon icon-unordered-list">' +
                    '<div class="icon-unordered-list-bullet-1"></div>' +
                    '<div class="icon-unordered-list-line-1"></div>' +
                    '<div class="icon-unordered-list-bullet-2"></div>' +
                    '<div class="icon-unordered-list-line-2"></div>' +
                    '<div class="icon-unordered-list-bullet-3"></div>' +
                    '<div class="icon-unordered-list-line-3"></div>' +
                '</div>'
        }
    };
    var defaults = {
        toolbar: defaultToolbarItems
    }

    return OneEdit;
});



// var text = this.range.startElement.data ? this.range.startElement : this.range.endElement, 
//     left, top, maxWidth = this.el.width();
// if(text && /text/.test(text.nodeName)){
//     //console.log(this.range);
//     var testEl = $('<span style="visiblity: hidden">' + text.data.substring(0, this.range.start) + '</span>')
//         .appendTo(this.el);
//     left = testEl.width();
//     // if this is wrapping text
//     //console.log(left, maxWidth);
//     if(left >= (maxWidth - 30)){ // position at the end
//         var end = $('<span style="visiblity: hidden"></span>'), p;
//         $(text).parents('div').append(end);
//         p = end.position()
//         left = p.left;
//         top = p.top;
//         end.remove();
//     }
//     testEl.remove();
// }
// else debugger;

// var elOffset = $(text.parentNode).offset();