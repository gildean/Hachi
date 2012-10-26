var haibu = require('haibu-api'),
    http = require('http'),
    config = require('./config'),
    db = require('mongojs').connect(config.dbinfo),
    dronedb = db.collection('drones'),
    client = haibu.createClient({ host: config.haibu.host, port: config.haibu.port }).drone;


exports.listDrones = function (req, res) {
    if (req.url === '/') {
        res.render('list');
    } else {
        res.status(418);
        res.render('error', { error: 'No java here.' });
    }
};


exports.getDrone = function (req, res) {
    dronedb.findOne({ name: req.drone }, function (err, getApp) {
        if (!err && getApp && getApp.online !== false) {
            client.get(req.drone, function (err, results) {
                if (!err && results) {
                    res.send(200, results);
                } else {
                    res.send(500, { error: err || 'No drones found?'});
                }
            });
        } else if (!err && getApp && getApp.online === false) {
            res.send(200, getApp);
        } else {
            res.send(500, err || 'No drones found?');
        }
    });
};


exports.stopDrone = function (req, res) {
    client.stop(req.drone, function (err, results) {
        if (!err) {
            dronedb.update({ name: req.drone }, { $set: { online: false, running: 0, ports: [] } }, function (err) {
                if (!err) {
                    res.send(200, results);
                } else {
                    res.send(200, { error: err, results: results });
                }
            });
        } else {
            res.send(500, err);
        }
    });
};


exports.restartDrone = function (req, res) {
    client.restart(req.drone, function (err, results) {
        var ports = [],
            i;
        if (!err && results) {
            for (i = 0; i < results.length; i += 1) {
                ports.push(results[i].port);
                if (i === (results.length - 1)) {
                    dronedb.update({ name: req.drone }, { $set : { online: new Date(), port: ports, running: results.length } }, function (err) {
                        if (!err) {
                            res.send(200, results);
                        } else {
                            res.send(200, { error: err, results: results });
                        }
                    });
                }
            };
        } else {
            res.send(500, err);
        }
    });
};


exports.updateDrone = function (req, res) {
    dronedb.findOne({ name: req.drone }, function (err, getApp) {
        if (!err && getApp) {
            client.update(getApp, function (err, results) {
                if (!err) {
                    dronedb.update({ name: req.drone }, { $set : { online : new Date(), running : 1, port : results.drone.port } }, function (err) {
                        if (!err) {
                            res.send(200, results);
                        } else {
                            res.send(200, { error: err, results: results });
                        }
                    });
                } else {
                    res.send(500, err);
                }
            });
        } else {
            res.send(500, { error: err });
        }
    });
};


exports.deleteDrone = function (req, res) {
    dronedb.findOne({ name: req.drone }, function (err, getApp) {
        if (!err && getApp) {
            client.clean(getApp, function (err, results) {
                if (!err) {
                    dronedb.remove({ name: req.drone }, function (err) {
                        if (!err) {
                            res.send(200, results);
                        } else {
                            res.send(200, { error: err, results: results });
                        }
                    });
                } else {
                    res.send(500, err);
                }
            });
        } else {
            res.send(500, err);
        }
    });
};


function droneStart(appDrone, callback) {
    client.start(appDrone, function (err, results) {
        if (!err && results) {
            if (appDrone.ondb === true) {
                callback(false, results);
            } else {
                dronedb.insert(appDrone, function (dberr) {
                    if (!dberr) {
                        callback(false, results);
                    } else {
                        callback(err, results);
                    }
                });
            }
        } else {
            callback(err, false);
        }
    });
};


function droneToStart(req, callback) {
    var appDrone = {};
    appDrone.ondb = false;
    dronedb.findOne({ name: req.drone }, function (error, appresults) {
        if (!error && appresults) {
            appDrone = appresults;
            appDrone.ondb = true;
            callback(false, appDrone);
        } else if ((!error) && (!appresults)) {
            if (req.drone && req.body.domain && req.body.location && req.body.repo && req.body.scripts) {
                dronedb.findOne({ domain: req.body.domain }, function (error, domresults) {
                    if ((!error) && (!domresults)) {
                        appDrone = {
                            user: req.session.user.user,
                            name: req.drone,
                            domain: req.body.domain || 'node.local',
                            repository: {
                                type: req.body.repo || 'git'
                            },
                            scripts: {
                                start: req.body.scripts || 'server.js'
                            }
                        };
                        if (appDrone.repository.type === 'local') {
                            appDrone.repository['directory'] = req.body.location || './tmp';
                        } else {
                            if (appDrone.repository.type === 'git' && req.body.location) {
                                if (/.\.git$/.test(req.body.location)) {
                                    appDrone.repository['url'] = req.body.location;
                                } else {
                                    appDrone.repository['url'] = req.body.location + '.git';
                                }
                            } else {
                                appDrone.repository['url'] = 'https://github.com/gildean/InfoNode.git';
                            }
                        }
                        callback(false, appDrone);
                    } else if (domresults) {
                        callback('Domain already exists', false);
                    } else {
                        callback(error, false);
                    }
                });
            } else {
                callback('Insufficient data.', false);
            }
        }
    });
};


exports.startDrone = function (req, res) {
    droneToStart(req, function (err, appDrone) {
        if (!err) {
            droneStart(appDrone, function (err, done) {
                if (!err && done) {
                    dronedb.ensureIndex({ name : 1, domain : 1, user : 1 });
                    dronedb.update({ name: appDrone.name }, { $set : { online : new Date() }, $inc : { running : 1 }, $push : { port: done.drone.port } }, function (err) {
                        if (!err) {
                            res.send(200, done);
                        } else {
                            res.send(200, { error: err, results: done });
                        }
                    });
                } else if (err && done) {
                    res.send(200, { error: err, results: done });
                } else {
                    res.send(500, err);
                }
            });
        } else {
            res.send(500, err)
        }
    });
};


exports.allDrones = function (req, res) {
    if (req.session.user.rw) {
        dronedb.find(function (err, results) {
            if (!err && results) {
                res.send(200, results);
            } else {
                res.send(500, err);
            }
        });
    } else {
        dronedb.find({ user : req.session.user.user }, function (err, results) {
            if (!err && results) {
                res.send(200, results);
            } else {
                res.send(500, err);
            }
        });
    }
};


exports.checkPerms = function (req, res, next) {
    if (req.session.user.rw) {
        next();
    } else if (req.drone) {
        dronedb.findOne({ name: req.drone }, function (err, getApp) {
            if (!getApp) {
                next();
            } else if (!err && getApp && getApp.user === req.session.user.user) {
                next();
            } else if (err) {
                res.send(500, err);
            } else {
                res.send(403, 'Forbidden');
            }
        });
    }
};
