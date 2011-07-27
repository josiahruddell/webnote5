var couchdb = require('couchdb')
  , client = couchdb.createClient(null, 'webnote5.iriscouch.com') // move to configuration
  , userdb = client.db('_users')
  ;

exports = {
	save: function(id, data){
		
	},
	load: function(id){
		
	}

}