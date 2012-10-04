var haibu = require('haibu'),
    http = require('http');

exports.droneName = function (req, res, next, drone) {
    req.drone = drone.toString();
    console.log(req.drone);
    next();
};

exports.actionName = function (req, res, next, action) {
    req.droneaction = action.toString();
    console.log(req.droneaction);
    next();
};

exports.internalProxy = function (req, res) {
    console.log('request for ' + req.url);
    var client = new haibu.drone.Client({
        host: 'localhost',
        port: 9002
    }), proxy, options;

    if (req.url === '/' || req.url === '/login') {
        res.render('list');
    } else if (req.url === '/logout') {
        req.session.destroy();
        res.send(200, 'Logout ok');
    } else if (req.drone && !req.droneaction) {
        client.get(req.drone, function (err, results) {
            console.log(results);
            res.send(200, results);
        });
    } else if (req.droneaction) {
        if (req.droneaction === 'stop') {
            client.stop(req.drone, function (err, results) {
                console.log(results);
                res.send(200, results);
            });
        } else if (req.droneaction === 'restart') {
            client.restart(req.drone, function (err, results) {
                console.log(results);
                res.send(200, results);
            });
        } else if (req.droneaction === 'delete') {
            client.clean(req.drone, function (err, results) {
            console.log(results);
                console.log(results);
                res.send(200, results);
            });
        }
    } else if (req.url === '/drones') {
        options = {
            host: 'localhost',
        	port: 9002,
        	path: req.url,
        	method: req.method
        };
        proxy = http.request(options, function (proxyres) {
    		proxyres.pipe(res);
    	});
        req.pipe(proxy);
    }
};
