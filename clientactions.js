var haibu = require('haibu'),
    http = require('http'),
    dbinfo = require('./dbinfo'),
    db = require('mongojs').connect(dbinfo),
    dronedb = db.collection('drones');

exports.droneName = function (req, res, next, drone) {
    console.log(drone);
    if (drone !== '/') {
        req.drone = drone.toString();
        next();
    } else {
        next();
    }
};

exports.actionName = function (req, res, next, action) {
    req.droneaction = action.toString();
    next();
};

exports.internalProxy = function (req, res) {
    var client = new haibu.drone.Client({ host: 'localhost', port: 9002 }),
        appDrone;
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
            var appname = req.body.name.toString() || 'test',
                appdomain = req.body.domain.toString() || 'node.local',
                apprepo = req.body.repo.toString() || 'git',
                applocation = req.body.location.toString() || 'https://github.com/Marak/hellonode.git',
                appscripts = req.body.scripts.toString() || 'server.js';
            dronedb.findOne({ name: appname }, function (err, appresults) {
                if (!err && appresults) {
                    appDrone = appresults;
                } else if (err) {
                    res.send(500, {error: err || 'Database Error!'});
                } else {
                    if (apprepo === 'local') {
                        repotype = 'directory';
                    } else {
                        repotype = 'url';
                    }
                    appDrone = {
                        "user": req.session.user.user,
                        "name": appname,
                        "domain": appdomain,
                        "repository": {
                            "type": apprepo,
                            repotype: applocation,
                        },
                        "scripts": {
                            "start": appscripts
                        },
                        "online": false
                    };
                }
                client.start(appDrone, function (err, results) {
                    if (!err) {
                        dronedb.update({ name: appname }, appDrone, { upsert: true }, function (err) {
                            if (!err) {
                                res.send(200, results);
                                dronedb.update({ name: appname }, {$set: {online: true}}, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            } else {
                                console.log(err);
                                res.send(200, { "error": err, results: results });
                            }
                        });
                    } else {
                        res.send(err.status || 500, err || 'error!');
                    }
                });
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
    var options = {
        host: 'localhost',
        port: 9002,
        path: req.url
    },
    proxy = http.request(options, function (proxyres) {
        proxyres.pipe(res);
    });
    req.pipe(proxy);
};
