$(function(){
	$('#bodytext').oneEdit();

	// format main width
	var targets = $('#main'), nav = $('#nav');
	$(window).bind('resize', function(){
		var win = $(this), navwidth = nav.is(':visible') ? nav.width() : 0;
		nav.height(win.height() - 68);
		targets.css({ width: win.width() - navwidth, left: navwidth});
	}).triggerHandler('resize');

	// search icon
	$('#bar li > a, #bar a.icon').menuItem({
		on: {
			// once toolbar config comes from json, bind these events using a json select
			// 'window.navigator': function(e){} ...
			window: function(e){
				if($.trim($(this).html()) == 'Navigator'){
					window.MenuItem.hideAll(e);
					$('#nav').toggle();
					$(window).triggerHandler('resize');
				}
			},
			file: function(e){
				if($.trim($(this).html()) == 'Save'){
					
				}
			}
		}
	});

	// establish connection
	// new socket.io WOOT!
	var socket = io.connect();
	
	// socket.emit('addnote', { 
	// 	data: '<b> this is a new note data added from socket </b>'
	// });

	socket.on('notesaved', function(note){
		console.log(note);
	});
});

$.fn.menuItem = (function($, win){
	// TODO: move out of global ns
	// constructor
	var MenuItem = win.MenuItem = function(el, opts){
		this.opts = opts || {};
		this.item = $(el);
		this.setup();
	};

	
	
	MenuItem.hideAll = function(e){
		if(!this.anyShowing) return;
		
		this.anyShowing = false;
		this.items.each(function(){ 
			var t = $(this);
			t.data('showing') && t.data('menuItem').toggleShow(e);
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
		
		toggleShow: function(e){
			// don't toggle for mouseover, leave open
			if(e && e.type == 'mouseover' && (!MenuItem.anyShowing || this.showing)) return;
			
			// Resize
			if(MenuItem.resize){
				MenuItem.positionAll();
				MenuItem.resize = false;
			}
			// hide others
			if(!this.showing) MenuItem.hideAll();

			this.list.fadeToggle(80);
			
			this.item.toggleClass('active');
			if(this.showing = this.item.hasClass('active')){
				this.inputs.eq(0).focus().select();
				e && e.stopPropagation();
			}
			
			MenuItem.anyShowing = this.showing;
			this.item.data('showing', this.showing);
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
	
	return function(opts){ // on plugin call
		// TODO: make items an array of elements to support multiple menus on one page
		// shared members
		MenuItem.resize = false;
		MenuItem.winWidth = $(win).resize(function(){ 
			MenuItem.winWidth = $(this).width(); 
			MenuItem.resize = true;
		}).width();
		MenuItem.anyShowing = false;
		MenuItem.items = this.each(function(){ 
			$(this).data('menuItem', new MenuItem(this, opts));
		});
	}
})(jQuery, this);


$.fn.gatherer = (function($, root){
	// TODO: move out of global ns
	// constructor
	var Gatherer = root.Gatherer = function(el, opts){
		this.opts = opts || {};
		this.item = $(el);
		this.setup();
	};

	// global events
	$(document).bind('click', function(){ MenuItem.hideAll(); });

	// instance members
	Gatherer.prototype = {
		setup: function(){
			this.list = $(this.item.data('target')).hide();
			this.inputs = this.list.find(':input');
			this.showing = false;

			this.applyBindings();
			this.position();
		},
		applyBindings: function(){


		},
		position: function(){

		},
		
		toggleShow: function(e){
			// don't toggle for mouseover, leave open

		}
	};
	
	return function(opts){ // on plugin call
		return this.each(function(){ 
			$(this).data('gatherer', new Gatherer(this, opts));
		});
	}
})(jQuery, this);
