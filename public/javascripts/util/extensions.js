/*

____________________________________________
\\\|///
 \\|//   Require classes, and activate jquery
  \|/    plugins for easy element integration
   |


*/
define(['jquery', 'class/MenuItem/MenuItem', 'class/OneEdit/OneEdit'], function($, MenuItem, OneEdit){
	
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


	// gatherer coming soon (and will be renamed)
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
});