/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var logger = require('../logger');

var issuesdb = require('../database');
var auth = require('../auth');


var express = require('express');
var app = express();

module.exports = app;


// Everything here requires admin access
app.use(auth.sanitize, auth.enforce('admin'));


// Rename a scene
app.post('/renameScene', function (req, res) {
  // TODO
  res.sendStatus(501);
});
