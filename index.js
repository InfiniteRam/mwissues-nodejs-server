#!/usr/bin/env nodejs

/*
 * Copyright (c) 2016 Bastien Brunnenstein
 */

var config = require('./config.json');

var express = require('express');
var app = express();

var issues = require('./issues-server');

app.use(express.static('static'));

app.use('/issue', issues);

app.listen(config.port, function () {
  console.log('MwIssues server listening on port '+ config.port +'!');
});
