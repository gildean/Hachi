var bouncy = require('bouncy'),
    config = require('./config'),
    db = require('mongojs').connect(config.dbinfo),
    dronedb = db.collection('drones'),
    connections = {};


function getClientIp(req) {
  var ipAddress;
  var forwardedIpsStr = req.headers['x-forwarded-for']; 
  if (forwardedIpsStr) {
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};


bouncy(function (req, bounce) {
    var ip = getClientIp(req),
        session = {},
        port;
    dronedb.findOne({ domain: req.headers.host }, function (err, app) {
        if (!err && app && app.online !== false) {
            if (connections[ip]) {
                session = connections[ip];
            } else {
                session = connections[ip] = { port: app.port[Math.floor(Math.random() * app.port.length)] };
            }
            port = session.port;
            session.time = Date.now();
            bounce(config.haibu.host + ':' + port + '/');
        } else {
            bounce(config.fallbackServerPort);
        }
    });
}).listen(config.proxyPort);


setInterval(function () {
    var checkTime = Date.now();
    Object.keys(connections).forEach(function(id) {
        var connection = connections[id];
        if ((checkTime - +connection.time) > config.proxyStickyTime) {
            delete connections[id];
        }
    });
}, 15000);
