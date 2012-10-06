var express = require('express'),
    haibu = require('haibu'),
    RedisStore = require('connect-redis')(express),
    http = require('http'),
    url = require('url'),
    moment = require('moment'),
    userauth = require('./userauth'),
    actions = require('./clientactions'),
    csrf = require('./csrf'),
    app = express(),
    server = http.createServer(app);

app.configure(function () {
    app.use(express.static(__dirname + '/public'));
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.cookieParser('CaiR0nCult41nenCuning45'));
    app.use(express.session({ store: new RedisStore }));
    app.use(app.router);
    app.use(express.csrf());
    app.locals.pretty = true;
    app.locals.errors = {};
    app.locals.messages = {};
    app.use(function (req, res) {
        res.status(418);
        res.render('error', {error: 'No java here'});
    });
});

app.get('/drones*', userauth.checkLogin, actions.allDrones);
app.get('/drone/:drone', userauth.checkLogin, actions.internalProxy);
app.get('/users*', userauth.checkLogin, userauth.getUsers);
app.get('/logout', function (req, res) {
    req.session.destroy();
    res.render('login');
});
app.get('/*', userauth.checkLogin, csrf, actions.internalProxy);

app.post('/adduser', userauth.checkLogin, userauth.addNewUser);
app.post('/drone/:drone/:action', userauth.checkLogin, actions.internalProxy);
app.post('/*', userauth.checkLogin, actions.internalProxy);

app.param('drone', actions.droneName);
app.param('action', actions.actionName);

server.listen(9090);
