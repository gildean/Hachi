var config = require('./config'),
    db = require('mongojs').connect(config.dbinfo),
    userdb = db.collection('user'),
    bcrypt = require('bcrypt');


var init = (function () {
    userdb.count(function (err, users) {
        if (!err && users !== 0) {
            return;
        } else if (users === 0) {
            newInstall = true;
            var values = {
                user: "admin",
                pass: bcrypt.hashSync("admin", 8),
                rw: true,
                lastlogin: new Date()
            };
            userdb.insert(values, function (err) {
                if (err) {
                    throw(err);
                } else {
                    userdb.ensureIndex({ user : 1, rw : 1 });
                    return;
                }
            });
        } else {
            throw(err);
        }
    });
}());


exports.getUsers = function (req, res) {
    if (req.session.user.rw) {
            userdb.find(function (err, users) {
                if (!err && users) {
                    res.send(200, users);
                } else {
                    res.send(500, { error: err || 'Something went wrong.' });
                } 
            });
    } else {
        res.send(403, { error: 'Forbidden' })
    }
};


// logon with bcrypt hash check
exports.logon = function (req, res) {
    userdb.findOne({ user : req.body.username.toString() },
        function(err, useraccount) {
            var password, passhash;
            if (!err && useraccount) {
                password = req.body.password;
                passhash = useraccount.pass;
                bcrypt.compare(password, passhash, function (err, same) {
                    if (!err && same) {
                        userdb.update({ user: useraccount.user }, { $set : { lastlogin: new Date() }}, function (err) {
                            if (!err) {
                                req.session.user = useraccount;
                                res.redirect('/');
                            } else {   
                                res.status(500);
                                res.render('error', { error: err || 'Database error!' });
                            }
                        });
                    } else if (err) {                  
                        res.status(err.status || 500);
                        res.render('error', { error: err || 'Database error!' });
                    } else {                  
                        res.status(401);
                        res.render('error', { error: 'loginerror' });
                    }
                });
            } else if (err) {                        
                res.status(err.status || 500);
                res.render('error', { error: err || 'Database error!' });
            } else {                        
                res.status(401);
                res.render('error', { error: 'loginerror' });
            }
        }
    );
};


exports.logout = function (req, res) {
    req.session.destroy();
    res.send(200, 'Logout OK');
};


exports.checkLogin = function (req, res, next) {
    if (req.session.user) {
        next();
    } else if (req.url === '/login' && req.method === 'POST' && req.body.username && req.body.password) {
        next();
    } else {
        res.locals.token = req.session._csrf;
        res.render('login');
    }
};


// check that the user doesn't already exist and then create it with a randomly salted password hash
exports.addNewUser = function (req, res) {
    if (req.session.user.rw) {
        userdb.findOne({ user: req.body.username }, function (err, user) {
            if (user) {
                res.send(409, { error: 'User already exists!' });
            } else if (req.body.password !== req.body.passwordconf) {
                res.send(409, { error: 'Password mismatch!' });
            } else if (!err) {
                var values = {
                    user: req.body.username,
                    pass: bcrypt.hashSync(req.body.password, 8),
                    rw: req.body.rw,
                    lastlogin: new Date()
                };
                userdb.insert(values, function (err) {
                    if (!err) {
                        res.send(200, 'User added!');
                    } else {
                        res.send(500, { error: err || 'Database error!'});
                    }
                });
            } else {
                res.status(500);
                res.send(500, { error: err || 'Database error!'});
            } 
        });
    } else {
        res.send(403, { error: 'Forbidden' });
    };
};


exports.changePass = function (req, res) {
    var changingUser = req.session.user.user;
    if (req.session.user.rw && req.body.username !== undefined) {
        changingUser = req.body.username;
    }
    userdb.findOne({ user: changingUser }, function (err, user) {
        if (!err && user) {
            if (req.body.password && req.body.passwordconf && req.body.password === req.body.passwordconf) {
                userdb.update({ user: changingUser }, { $set : { password: bcrypt.hashSync(req.body.password, 8) }}, function (err) {
                    if (!err) {
                        res.send(200, 'ok');
                    } else {
                        res.send(500, { error: err });
                    }
                });
            } else {
                res.send(409, { error: 'Password mismatch!' });
            }
        } else {
            res.send(500, { error: err || 'User not found!' });
        }
    });
};


exports.editUser = function (req, res) {
    var rw;
    if (req.session.user.rw && req.body.username) {
        userdb.findOne({ user: req.body.username }, function (err, user) {
            if (!err && user) {
                if (req.body.rw) {
                    userdb.update({ user: req.body.username }, { $set : { rw : true }}, function (err) {
                        if (!err) {
                            res.send(200, 'ok');
                        } else {
                            res.send(500, { error: err });
                        }
                    });
                } else {
                    res.send(200, user);
                }
            } else {
                res.send(500, { error: err || 'User not found!' });
            }
        });
    } else {
        res.send(403, 'Forbidden');
    }
};
