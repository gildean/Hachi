var haibu = require('haibu'),
    http = require('http')
    dbinfo = require('./dbinfo'),
    db = require('mongojs').connect(dbinfo),
    dronedb = db.collection('drones');

exports.droneName = function (req, res, next, drone) {
    console.log(drone);
    if (drone !== '/') {
        req.drone = drone.toString();
        console.log(req.drone);
        next();
    } else {
        next();
    }
};

exports.actionName = function (req, res, next, action) {
    req.droneaction = action.toString();
    console.log(req.droneaction);
    next();
};

exports.internalProxy = function (req, res) {
    var client = new haibu.drone.Client({ host: 'localhost', port: 9002 }), 
        options,
        proxy;
    res.locals.user = req.session.user;
    if (req.url === '/login') {
        res.redirect('/');
    } else if (req.url === '/') {
        res.render('list');
    } else if (req.drone && !req.droneaction) {
        client.get(req.drone, function (err, results) {
            if (!err) {
                res.send(200, results);
            } else {
                res.send(err.status || 500, err || 'error!');
            }
        });
    } else if (req.droneaction) {
        if (req.droneaction === 'stop') {
            client.stop(req.drone, function (err, results) {
                if (!err) {
                    res.send(200, results);
                } else {
                    res.send(err.status || 500, err || 'error!');
                }
            });
        } else if (req.droneaction === 'start') {
            client.start(req.drone, function (err, results) {
                if (!err) {
                    res.send(200, results);
                } else {
                    res.send(err.status || 500, err || 'error!');
                }
            });
        } else if (req.droneaction === 'restart') {
            client.restart(req.drone, function (err, results) {
                if (!err) {
                    res.send(200, results);
                } else {
                    res.send(err.status || 500, err || 'error!');
                }
            });
        } else if (req.droneaction === 'delete') {
            client.clean(req.drone, function (err, results) {
                if (!err) {
                    res.send(200, results);
                } else {
                    res.send(err.status || 500, err || 'error!');
                }
            });
        }
    } 
};

exports.allDrones = function (req, res) {
    options = {
        host: 'localhost',
        port: 9002,
        path: req.url
    };
    proxy = http.request(options, function (proxyres) {
        proxyres.pipe(res);
    });
    req.pipe(proxy);
};