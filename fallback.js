var config = require('./config'),
	http = require('http');

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
}).listen(config.fallbackServerPort);
