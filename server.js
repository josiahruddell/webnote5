/*

____________________________________________
\\\|///
 \\|//   server.js
  \|/
   |


*/

var express = require('express')
    , Model = require('LazyBoy')
    , io = require('socket.io')
    , connect = require('connect')
    , crypto = require('crypto')
    , csrf = require('express-csrf')
    , MemoryStore = express.session.MemoryStore
    , sessionStore = new MemoryStore()
    , port = process.argv[2] || process.env.C9_PORT || 80;


var app = module.exports = express.createServer();

// View Helpers
app.dynamicHelpers({
    csrf: csrf.token
});

app.dynamicHelpers({
  flash: function(req) {
    var flash;
    flash = req.flash();
    return flash;
  }
});

app.dynamicHelpers({
  current_user: function(req) {
    return req.session.user;
  }
});


// Configuration
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({store: sessionStore
        , secret: 'secret'
        , key: 'express.sid'}));
    app.use(csrf.check());
    app.use(express.methodOverride());
    app.use(require('stylus').middleware({
        src: __dirname + '/public'
    }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    Model.logger.setLogLevel(7);
    Model.create_connection({
        url: 'webnote5.iriscouch.com',
        port: '80',
        db: 'core',
        auth: { // not required
          username: 'admin',
          password: 'n0mNo+es'
        }
        // secure:true,
    });
    Model.load('lib/models');
});

app.configure('development', function() {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

// dynamic helpers
// action filter
// Routes
app.get('/', function(req, res) {
    // if(req.session.usr)
    var d = new Date(),
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        d2 = function(d, ampm){
            return d < 10 ? ('0' + d) : '' + d; 
        }
        hr12 = function(hour){
            return hour > 12 ? '' + (hour - 12) : '' + hour; 
        },
        ampm = function(hour){
            return hour > 12 ? 'PM' : 'AM';
        };

    res.render('new', {
        date: days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(),
        time: hr12(d.getHours()) + ':' + d2(d.getMinutes()) + ampm(d.getHours()),
        title: 'NomNotes - a simple way to take notes'  
    });
});

app.get('/session/profile', function(req, res) {
    if(req.session.user){
        res.render('profile', {
            user: req.session.user,
            layout: false
        });
    }
});

app.get('/about', function(req, res) {
    res.render('about', {
        layout: false
    });
});

app.get('/category/:name', function(req, res) {
    res.render('index')
});

// app.get('/new', function(req, res) {
    
// });

app.listen(port);

io = io.listen(app);

io.configure('production', function(){
    console.log('>> configuring production mode >>');
    //io.enable('browser client minification');
    //io.enable('browser client etag');
    io.set('log level', 1);
    io.set('transports', ['websocket', 'htmlfile', 'xhr-polling']);
});

io.configure('development', function(){
    console.log('>> configuring development mode >>');
    io.set('log level', 1);
    io.set('transports', ['websocket', 'htmlfile', 'xhr-polling']);
});

var parseCookie = connect.utils.parseCookie,
    Session = connect.middleware.session.Session;

io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['express.sid'];
        // save the session store to the data object 
        // (as required by the Session constructor)
        data.sessionStore = sessionStore;
        sessionStore.get(data.sessionID, function (err, session) {
            if (err) {
                accept(err.message, false);
            } else {
                // create a session object, passing data as request and our
                // just acquired session data
                data.session = new Session(data, session);
                accept(null, true);
            }
        });
    } else {
       return accept('No cookie transmitted.', false);
    }
});
var noteService = require('./lib/services/NoteService'),
    userService = require('./lib/services/UserService');

io.sockets.on('connection', function(socket){
    // Notes ...
    var hs = socket.handshake,
        session = hs.session;

    console.log('A socket with hs.sessionID ' + hs.sessionID+ ' connected!');

    socket.on('disconnect', function () {
        console.log('A socket with hs.sessionID ' + hs.sessionID + ' disconnected!');
    });

    socket.on('note/all', function(filter, fn){
        if(session.user){ // user is already logged in
            noteService.all(session.user.id, fn);
        }
    });

    socket.on('note/titles', function(filter, fn){
        if(session.user){ // user is already logged in
            noteService.titles(session.user.id, fn)
        }
    });

    socket.on('note/delete', function(id, fn){
        if(session.user){ // user is already logged in
            noteService.remove(id, fn);
        }
    });

    socket.on('note/find', function(id, fn){
        if(session.user){ // user is already logged in
            noteService.find(id, function(err, note){
                session.note = note;
                fn.apply(null, arguments);
            });
        }
    });

    socket.on('note/save', function(note, fn){
        
        if(session.user){ // user is already logged in;
            note.userId = session.user.id;
            noteService.save(note, function(err, savedNote){
                 if(savedNote){
                    session.note = savedNote;
                    session.save();
                }

                fn.apply(null, arguments);
            });
        }
    });

    // session
    socket.on('session/new', function(data, fn){
        var currentUser = Model('User').create(data);

        currentUser.authenticate(function(err, user){
            
            if (user) { // valid user, set session user
                session.user = user;
                session.save();
            }
            
            fn.apply(null, arguments);
        }); 
    });

    socket.on('session/destroy', function(message, fn){
        session.user = null;
        session.note = null;
        session.save();
        
        fn.apply(null);
    });

    // User create or update
    socket.on('user/save', function(data, fn){
        var onsave = function(err, user){
            if (user) { // valid user, set session user
                session.user = user;
                session.save();
            }
            fn.apply(null, arguments);
        };
        
        if(session.user){ // user is already logged in
            var currentUser = session.user;
            currentUser.firstName = data.firstName;
            currentUser.lastName = data.lastName;
            currentUser.email = data.email;
            currentUser.passwordHashed = true;
            currentUser.save(onsave);
            
            
            // TODO: check for unique email
        }
        else{
            Model('User')
                .create(data)
                .save(onsave);
        }
    });


    socket.on('user/exists', userService.exists);
});


console.log("Express server listening at %s:%d", app.address().address, app.address().port);

