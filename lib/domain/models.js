/*

____________________________________________
\\\|///
 \\|//   Awesome. Models for for couch db
  \|/
   |


*/

var Model = require('LazyBoy'),
    passwordUtil = require('../util/passwords'),
    crypto = require('crypto');

Model.logger.setLogLevel(7);
Model.create_connection({
    url: 'webnote5.iriscouch.com',
    port: '80',
    db: 'core'
    // auth: { // not required
    //   username: 'username',
    //   password: 'awesome_unique_password'
    // },
    // secure:true,
});

var Note = Model.define('Note', {
    data: String,
    title: String
});

var User = Model.define('User', {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    gravatar: { type: String, default: "00000000000000000000000000000000?d=mm"},
});

User.beforeSave(function(user){
    this.hashPassword();
    this.setGravatar();
});

User.addMethod('hashPassword', function(){
    if(!this.passwordHashed && this.password){
        this.password = passwordUtil.hash(this.password);
        this.passwordHashed = true;
    }
});

User.addMethod('setGravatar', function(){
    if(this.email){
        this.gravatar = crypto.createHash('md5').update(this.email).digest('hex');
    }
});

User.addMethod('authenticate', function(cb){
    var self = this;
    User.where('username', this.username, function(err, usrs){
        if(err) return console.log(err);
        for(var i = 0, usr; usr = usrs[i]; i++){
            if(passwordUtil.validate(usr.password, self.password))
                return cb.call(null, null, usr)
            else 
                return cb.call(null, 'Password does not match', null);
        }
        return cb.call(null, 'Unable to find user');
    });
});

module.exports = Model;