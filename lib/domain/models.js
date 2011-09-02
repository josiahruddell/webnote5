/*

____________________________________________
\\\|///
 \\|//   Awesome. Models for for couch db
  \|/
   |


*/

var Model = require('LazyBoy');
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

Model.define('Note', {
    data: String,
    title: String
});

Model.define('User', {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String
});

module.exports = Model;