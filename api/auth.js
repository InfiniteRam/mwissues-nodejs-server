/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('../config.json').mwissues;

var logger = require('../logger');

var auth = require('../auth');


var express = require('express');
var app = express();

module.exports = app;


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Check authentication, return
// TODO Improve result to give more info (anon state etc)
// TODO Document API
app.get('/', auth.sanitize, function (req, res) {
  auth.getAuthInfos(req, function(err, data) {
    if (err) {
      logger.error(err);
      res.sendStatus(500);
      return;
    }

    res.json(data);
  });
});

// TODO Login
// TODO Document API
app.post('/login', function (req, res) {
  auth.login(req, res, function(err, userid, username, permissions) {
    if (err) {
      logger.error(err);
      // SPECIAL CASE: For login send valid=false instead of errors
      res.json({valid: false});
      return;
    }
    res.json({
      userid: userid,
      username: username,
      permissions: permissions
    });
  });
});

// Logout: destroy active session
// TODO Document API
app.post('/logout', function (req, res) {
  // TODO code should be good, check
  auth.logout(req, res, function(err) {
    if (err) {
      logger.error(err);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(204);
  });
});
