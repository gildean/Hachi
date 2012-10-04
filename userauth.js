
var dbinfo = require('./dbinfo'),
    db = require('mongojs').connect(dbinfo),
    userdb = db.collection('user'),
    bcrypt = require('bcrypt');


// check that the user doesn't already exist and then create it with a randomly salted password hash
function addNewUser (req, res) {
    if (req.body.password !== req.body.passwordconf) {
        console.log('Password mismatch error');
        res.send(409, 'Password mismatch!');
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
                res.send(200, 'OK');
            }
        });
    }
};



// logon with bcrypt hash check
function logon (req, res) {
    userdb.findOne({ user : req.body.username },
        function(err, useraccount) {
            var password, passhash;
            if (!err && useraccount) {
                password = req.body.password;
                passhash = useraccount.pass;
                bcrypt.compare(password, passhash, function(err, same) {
                    if (!err && same) {
                        req.session.user = useraccount;
                        res.render('list');
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

// export a function to be used as an entrypoint to the middleware
module.exports = function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        userdb.count(function(err, users) {
            if (err) {
                res.status(err.status || 500);
                res.render('error', { error: err });
            } else if (users === 0 && req.body.username) {
                addNewUser(req, res);
            } else if (users === 0) {
                res.render('users');
            } else if (req.body.username) {
                logon(req, res);
            } else if (req.url === '/users' && req.session.user.rw) {
                userdb.find(function (err, users) {
                    if (!err && users) {
                        res.send(200, users);
                    } else {
                        res.render('error', {error: err || 'Something went wrong.'});
                    } 
                });
            } else {
                res.render('login');
            }
        });
    }
};
