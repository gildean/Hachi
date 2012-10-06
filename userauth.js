
var dbinfo = require('./dbinfo'),
    db = require('mongojs').connect(dbinfo),
    userdb = db.collection('user'),
    bcrypt = require('bcrypt');


// check that the user doesn't already exist and then create it with a randomly salted password hash
exports.addNewUser = function (req, res) {
    if (req.body.password !== req.body.passwordconf) {
        res.status(409);
        res.render('error', { error: 'Password mismatch!'});
    } else {
        var values = {
            user: req.body.username,
            pass: bcrypt.hashSync(req.body.password, 8),
            rw: req.body.rw,
            lastlogin: {
                time: new Date()
            }
        };
        userdb.insert(values, function(err) {
            if (err) {
                res.status(err.status || 500);
                res.render('error', { error: err });
            } else {
                if (req.session.user) {
                    res.send(200, 'User added!');
                } else {
                    res.render('login');
                }
            }
        });
    }
};



// logon with bcrypt hash check
function logon (req, res) {
    userdb.findOne({ user : req.body.username.toString() },
        function(err, useraccount) {
            var password, passhash;
            if (!err && useraccount) {
                password = req.body.password;
                passhash = useraccount.pass;
                bcrypt.compare(password, passhash, function(err, same) {
                    if (!err && same) {
                        req.session.user = useraccount;
                        res.redirect('/');
                    } else if (err) {                  
                        res.status(err.status || 500);
                        res.render('error', { error: err });
                    } else {                  
                        res.status(401);
                        res.render('error', { error: 'loginerror' });
                    }
                });
            } else if (err) {                        
                res.status(err.status || 500);
                res.render('error', { error: err });
            } else {                        
                res.status(401);
                res.render('error', { error: 'loginerror' });
            }
        }
    );
};

exports.getUsers = function (req, res) {
    if (req.session.user.rw) {
            userdb.find(function (err, users) {
                if (!err && users) {
                    res.send(200, users);
                } else {
                    res.send(500, err || 'Something went wrong.');
                } 
            });
    } else {
        res.send(401, 'Not ok!')
    }
};

// export a function to be used as an entrypoint to the middleware

exports.checkLogin = function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        userdb.count(function(err, users) {
            if (err) {
                res.status(err.status || 500);
                res.render('error', { error: err });
            } else if (users === 0) {
                if (req.body.username && req.body.password && req.body.passwordconf) {
                    addNewUser(req, res);
                } else {
                    res.render('adduser');
                }
            } else if (req.body.username) {
                logon(req, res);
            } else {
                res.render('login');
            }
        });
    }
};
