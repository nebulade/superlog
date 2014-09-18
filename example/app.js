#!/usr/bin/env node

'use strict';

var express = require('express'),
    superlog = require('../index.js');

var app = express();

app.use(superlog('/logs'));

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});