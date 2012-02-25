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


var User = Model.define('User', {
    id: String,
    activeNote: String,
    activeTheme: String,
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    theme: { type: String, default: "default"},
    background: { type: String, default: "/images/backgrounds/Pinstripe-med.jpg"},
    gravatar: { type: String, default: "00000000000000000000000000000000?d=retro"}
});

User.beforeSave(function(user){
    this.hashPassword();
    this.setGravatar();
});

User.addMethod('hashPassword', function(){
    if(!this.passwordHashed && this.password && !/-hash-/.test(this.password)){
        console.log('hashing password!!!!');
        this.password = passwordUtil.hash(this.password);
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

//module.exports = Model;