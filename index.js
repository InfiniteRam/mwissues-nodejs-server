#!/usr/bin/env nodejs

/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('./config.json');

var express = require('express');
var app = express();

var issues = require('./issues-server');

var logger = require('./logger');

app.use(express.static('static'));

app.use('/issue', issues);

app.listen(config.port, function () {
  logger.info('MwIssues server listening on port '+ config.mwissues.port +'!');
});
