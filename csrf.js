module.exports = function (req, res, next) {
	res.locals.user = req.session.user;
    res.locals.token = req.session._csrf;
    next();
};
