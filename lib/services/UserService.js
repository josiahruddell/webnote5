var Model = require('LazyBoy'),
    User = Model('User');

var UserService = function(){
    this.db = Model.connection.connection();
};

UserService.prototype = {
    exists: function(user, fn){
        User.where('username', user.username, function(err, users){
            // if a user with this username was found send true
            users[0] ? fn(true) : fn(false);
        });
    },
    find: function(userId, fn){
        User.find(userId, fn);
    },
    save: function(user, fn){
        // create or update
        User.create(user).save(fn);
    }
};

module.exports = new UserService();