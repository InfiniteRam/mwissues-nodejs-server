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


var methodOverride = require('method-override');
app.use(methodOverride());


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Everything here requires admin access
app.use(auth.sanitize, auth.enforce('admin'));


// Rename a scene
app.post('/renameScene', function (req, res) {

  var oldScene = req.body.oldScene;
  var newScene = req.body.newScene;

  if (typeof(oldScene) !== "string"
    || typeof(newScene) !== "string")
  {
    res.sendStatus(400);
    return;
  }

  issuesdb.renameScene(oldScene, newScene, function(err, affectedIssues) {
    if (err) {
      logger.error(err);
      res.sendStatus(500);
      return;
    }

    res.json({affectedIssues: affectedIssues});
  });

});
