/**
 * Module dependencies.
 */
var express = require('express')
    , fs = require('fs')
    , io = require('socket.io')
    //, RedisStore = require('connect-redis')(express)
    , csrf = require('express-csrf')
    , couchdb = require('couchdb')
    , repo = require('./lib/Repository')
    , port = process.env.C9_PORT || 3001;

var app = module.exports = express.createServer();

// View Helpers
app.dynamicHelpers({
  csrf: csrf.token,
  flash: function(req) {
    var flash;
    flash = req.flash();
    return flash;
  },
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
    app.use(express.session({ 
        //store: new RedisStore, //({maxAge: 24 * 60 * 60 * 1000 }),
        secret: 'super secret'
    }));
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
// TODO: move routes out of server
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
    // TODO: move date helper to date utils
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

io.on('connection', function(client){
    client.on('message', function(m){
        switch(m.action){
            case 'save':
                repo.save(m.id, m.data);
            break;
            case 'load':
                var data = repo.get(m.id);
                client.send(data);

            break;

        }
    });
});

console.log("Express server listening at %s:%d", app.address().address, app.address().port);