/* jslint node:true */

'use strict';

var fs = require('fs'),
    debug = require('debug')('superlog');

exports = module.exports = function (prefix) {
    if (typeof process.env.SUPERLOG === 'undefined') {
        debug('superlog is disabled');
        return function (req, res, next) { next(); };
    }

    debug('superlog is enabled');

    return function (req, res, next) {
        if (req.path.indexOf(prefix) !== 0) return next();

        var filePath = req.path.slice(prefix.length);

        debug('sending log file %s.', filePath);

        var stat = fs.statSync(filePath);
        if (!stat.isFile()) return res.status(404).send('Not found');

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no' // disable nginx buffering
        });

        fs.open(filePath, 'r', function (error, fd) {
            fs.readFile(filePath, function (error, buffer) {
                if (error) return res.status(500).send(error);

                debug('sending data over eventsource...');
                res.write('data: ' + JSON.stringify({ data: buffer.toString('utf8') }) + '\n\n');

                fs.watchFile(filePath, function(curr, prev) {
                    if (curr.size > prev.size) {
                        debug('size: %d -> %d', prev.size, curr.size);

                        var size = curr.size - prev.size;
                        var data = new Buffer(size);

                        fs.read(fd, data, 0, size, prev.size, function(err, bytesRead, buffer) {
                            debug('sending data over eventsource...', buffer.toString('utf8'));

                            res.write('data: ' + JSON.stringify({ data: buffer.toString('utf8') }) + '\n\n');
                        });
                    }
                });

                res.on('close', function () {
                    fs.unwatchFile(filePath);
                    fs.close(fd);
                });
            });
        });
    };
};
