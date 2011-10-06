/*

____________________________________________
\\\|///
 \\|//   MenuItem is the OSX style menu class
  \|/    TODO: needs json menu feed
   |


*/

define(['jquery'], function($){	
// constructor
	var MenuItem = function(el, opts){
		this.opts = opts || {};
		this.item = $(el);
		this.setup();
	};

	// static class members
	MenuItem.init = function(){
		this.resize = false;
		this.winWidth = $(window).resize(function(){ 
			MenuItem.winWidth = $(this).width(); 
			MenuItem.resize = true;
		}).width();
		this.anyShowing = false;	
	};
	
	MenuItem.hideAll = function(e, duration){
		if(!this.anyShowing) return;
		
		this.anyShowing = false;
		this.items.each(function(){ 
			var t = $(this);
			t.data('showing') && t.data('menuItem').toggleShow(e, duration);
		});
	};

	MenuItem.positionAll = function(e){
		this.items.each(function(){ 
			$(this).data('menuItem').position();
		});
	};

	// global events
	$(document).bind('click', function(){ MenuItem.hideAll(); });

	// instance members
	MenuItem.prototype = {
		setup: function(){
			this.list = $(this.item.data('target')).hide();
			this.inputs = this.list.find(':input');
			this.showing = false;

			this.applyBindings();
			this.position();
		},
		applyBindings: function(){
			this.item
				.bind('click mouseover', $.proxy(this.toggleShow, this));

			this.item.find(':input')
				.bind('keyup', $.proxy(this.typing, this));
			
			this.list
				.bind('click', $.proxy(this.listItemSelected, this));

		},
		position: function(){
			var w = this.item.outerWidth(), h = this.item.outerHeight(),
				position = this.item.offset(),
				xtype = this.item.data('position') || 'left',
				xcoord = xtype == 'left' ? position.left : MenuItem.winWidth - (position.left + w),
				css = {};
			
			// dynamic css
			css[xtype] = xcoord;
			css['top'] = position.top + h; 

			// position css
			this.list.css(css);
		},
		
		toggleShow: function(e, duration){
			// don't toggle for mouseover, leave open
			if(e && e.type == 'mouseover' && (!MenuItem.anyShowing || this.showing)) return;
			
			// Resize
			if(MenuItem.resize){
				MenuItem.positionAll();
				MenuItem.resize = false;
			}
			// hide others
			if(!this.showing) MenuItem.hideAll();
			var self = this;
			this.list.fadeToggle(duration || 80, function(){

				
			});
			self.item.toggleClass('active');
			if(self.showing = self.item.hasClass('active')){
				self.inputs.eq(0).focus().select();
				e && e.stopPropagation();
			}
		
			MenuItem.anyShowing = self.showing;
			self.item.data('showing', self.showing);	
			
			this.group = this.item.data('group');
			e && e.preventDefault();
		},
		typing: function(e){
			if (e.which == 27) return this.toggleShow(e);
			e.stopPropagation();
			this.opts.on && this.opts.on.typing.call(e.target, e);
		},
		listItemSelected: function(e){
			e.stopPropagation();
			this.opts.on && this.opts.on[this.group] && this.opts.on[this.group].call(e.target, e);
		}

	};

	return MenuItem;
});