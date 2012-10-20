var bouncy = require('bouncy'),
    http = require('http'),
    config = require('./config'),
    db = require('mongojs').connect(config.dbinfo),
    dronedb = db.collection('drones');

bouncy(function (req, bounce) {
    dronedb.findOne({ domain: req.headers.host }, function (err, app) {
        if (!err && app && app.online !== false) {
            var randomPort = app.port[Math.floor(Math.random() * app.port.length)];
            bounce(randomPort);
        } else {
            bounce(10042);
        }
    });
}).listen(config.proxyPort);

http.createServer(function (req, res) {
  res.writeHead(418, { 'Content-Type': 'text/html' });
  res.end(
          '<!DOCTYPE html>\n'
         +'<html>\n<head>\n<meta charset="utf-8">\n'
         +'<title>Cool story bro</title>\n</head>\n'
         +'<body>\n'
         +'<h1 style="font: 90px Ubuntu, Roboto, Helvetica;text-align:center">Cool story bro.</h1>\n'
         +'</body>\n</html>\n'
  );
}).listen(10042);
