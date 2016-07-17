#!/usr/bin/env nodejs

/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('./config.json').mwissues;

var logger = require('./logger');

var express = require('express');
var app = express();


app.use(express.static('static'));

var issues = require('./api/issues');
app.use('/issue', issues);

var auth = require('./api/auth');
app.use('/auth', auth);

var admin = require('./api/admin');
app.use('/admin', admin);


app.listen(config.port, function () {
  logger.info('MwIssues server listening on port '+ config.port +'!');
});
