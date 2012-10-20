var express = require('express'),
    RedisStore = require('connect-redis')(express),
    http = require('http'),
    url = require('url'),
    userauth = require('./userauth'),
    actions = require('./clientactions'),
    reverseProxy = require('./proxy'),
    config = require('./config'),
    csrf = require('./csrf'),
    app = express(),
    server = http.createServer(app);

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.cookieParser('salasana'));
app.use(express.session({ store: new RedisStore }));
app.use(express.csrf());
app.use(app.router);
app.locals.pretty = true;
app.locals.errors = {};
app.locals.messages = {};
app.use(function (req, res) {
    res.status(418);
    res.render('error', {error: 'No java here'});
});

app.get('*', csrf);
app.all('*', userauth.checkLogin);

app.get('/drones', actions.allDrones);
app.get('/drone/:drone', actions.checkPerms, actions.getDrone);
app.get('/users', userauth.getUsers);
app.get('/logout', userauth.logout);
app.get('/*', actions.listDrones);

app.post('/login', userauth.logon);
app.post('/adduser', userauth.addNewUser);
app.post('/edituser', userauth.editUser);
app.post('/password', userauth.changePass);
app.post('/drone/:drone/start', actions.checkPerms, actions.startDrone);
app.post('/drone/:drone/restart', actions.checkPerms, actions.restartDrone);
app.post('/drone/:drone/stop', actions.checkPerms, actions.stopDrone);
app.post('/drone/:drone/update', actions.checkPerms, actions.updateDrone);
app.post('/drone/:drone/delete', actions.checkPerms, actions.deleteDrone);

app.param('drone', function (req, res, next, drone) {
    req.drone = drone;
    next();
});


server.listen(config.hachiPort, function () {
    process.stdout.write('\r\n'                           
        + '     `:                  .  \r\n'
        + '     `.:                .`  \r\n'
        + '    ``..               ;..` \r\n'
        + '    `..`:             ...   \r\n'
        + '    ```.,            ,....  \r\n'
        + '    `....;          ....;`  \r\n'
        + '   .`....:          .....`  \r\n'
        + '     `::::  ..`.`   ;...``  \r\n'
        + '     ``:.:`,;;;.;. .....:`  \r\n'
        + ' .+#:,`:;;;@#;#@;#;;.:;`,:+.\r\n'
        + '   `#+;:,:+@#####@@#;;#+:   \r\n'
        + '     ;+;,,#@@##@@@@#;#++    \r\n'
        + '      `:;,#@#@+@@@@@#:,     \r\n'
        + '        .#@####@@@@@#       \r\n'
        + '        #@@;;;;;;;;@@       \r\n'
        + '       `+#@;;;;;;;;#@+`     \r\n'
        + '       @, :;;;;;;;;: @@:    \r\n'
        + '      #   .#@@@@@@#.   @.   \r\n'
        + '      +    ;###@@@;     :   \r\n'
        + '     :    ,+#@@@@##+     :  \r\n'
        + '     .    #++@@@@#,#     :  \r\n'
        + '     ,    # ;@##+ +,       \r\n'
        + '        `+   ,+,.  #       \r\n'
        + '        #          +`      \r\n'
        + '       `;           :      \r\n'
        + '      `             .      \r\n'
        + '        HACHI by: ok       \r\n'
    );
});
