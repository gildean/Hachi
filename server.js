var express = require('express'),
    haibu = require('haibu'),
    RedisStore = require('connect-redis')(express),
    http = require('http'),
    url = require('url'),
    moment = require('moment'),
    userauth = require('./userauth'),
    actions = require('./clientactions')
    app = express(),
    server = http.createServer(app);

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.cookieParser('CaiR0nCult41nenCuning45'));
app.locals.pretty = true;
app.use(express.session({ store: new RedisStore }));

app.get('/drones/:drone', userauth, actions.internalProxy);
app.get('/*', userauth, actions.internalProxy);

app.post('/drones/:drone/:action', userauth, actions.internalProxy);
app.post('/*', userauth, actions.internalProxy);

app.param('drone', actions.droneName);
app.param('action', actions.actionName);
 
server.listen(9090);
