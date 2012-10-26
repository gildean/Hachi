//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//|************************************************************|//
//|                                                            |//
//|                HACHI APPLICATION CONFIG                    |//
//|                                                            |//
//|____________________________________________________________|//
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// set the mongodb-connection here, syntax as normal mongodb-syntax goes 
// i.e. mongodb://somehost.tld/hachidb
exports.dbinfo = 'haibudb';

// the port that Hachi itself listens
exports.hachiPort = 9090;

// the port that the reverse proxy listens
exports.proxyPort = 10080;

// time the proxy upholds connection stickiness
exports.proxyStickyTime = 3600000;

// the port that the fallback server listens
// this is the server that basically gives a custom error page
exports.fallbackServerPort = 10042;

// host and port that haibu resides, this doesn't have to be localhost
exports.haibu = {
    host: 'localhost',
    port: 9002
};

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
