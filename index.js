/* jslint node:true */

'use strict';

exports = module.exports = function (prefix) {
    return function (req, res, next) {
        if (req.path.indexOf(prefix) === 0) return res.sendfile(req.path.slice(prefix.length));
        next();
    };
};
