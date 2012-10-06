module.exports = function (req, res, next) {
    res.locals.token = req.session._csrf;
    console.log(res.locals.token);
    next();
};
