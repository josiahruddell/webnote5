/*

____________________________________________
\\\|///
 \\|//   Everyone needs a server.js
  \|/
   |


*/

var express = require('express')
    , io = require('socket.io')
    // , RedisStore = require('connect-redis')
    , csrf = require('express-csrf')
    , Model = require('./lib/domain/models')
    , port = process.env.C9_PORT || 80;


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
    app.use(express.session({ secret: 'super note secret' }));
    // app.use(express.session({
    //   store: new RedisStore({
    //     maxAge: 24 * 60 * 60 * 1000
    //   })
    // }));
    app.use(csrf.check());
    app.use(express.methodOverride());
    app.use(require('stylus').middleware({
        src: __dirname + '/public'
    }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
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
    if(req.session.usr)
        res.render('index', {
            title: 'Notes'
        });
    else
        res.redirect('new');
});

app.get('/category/:name', function(req, res) {
    
});

app.get('/new', function(req, res) {
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
        title: '* untitled note '  
    });
});

app.listen(port);

io = io.listen(app);

io.sockets.on('connection', function(socket){
    socket.on('addnote', function(message){
        //console.log('add note callback says: ', message);
        var note = Model('Note').create(message);
        note.save(function(err, savedNote){
            socket.emit('notesaved', savedNote);
        });
    });
});

console.log("Express server listening at %s:%d", app.address().address, app.address().port);