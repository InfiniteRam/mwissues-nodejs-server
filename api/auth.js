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


// Check authentication, return
// { valid: bool, permissions: [''] }
app.get('/', auth.sanitize, function (req, res) {
  auth.getAuth(req, function(authData) {
    res.json(authData);
  });
});

// TODO Login
app.post('/login', function (req, res) {
  /*auth.login(req, res, function(err) {
    if (err) {
      logger.error(err);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(204);
  });*/
  res.sendStatus(501);
});

// Logout: destroy active session
app.post('/logout', function (req, res) {
  // TODO code should be good
  /*auth.logout(req, res, function(err) {
    if (err) {
      logger.error(err);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(204);
  });*/
  res.sendStatus(501);
});
