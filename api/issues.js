/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('../config.json').mwissues;

var logger = require('../logger');

var issues = require('../issues');
var issuesdb = require('../database');
var auth = require('../auth');


var fs = require('fs');
var crypto = require('crypto');

var express = require('express');
var app = express();

module.exports = app;


var methodOverride = require('method-override');
app.use(methodOverride());


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/screenshots');
  },
  filename: function (req, file, cb) {
    console.log(file.mimetype);

    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (file.mimetype === 'image/png') {
        cb(err, err ? undefined : raw.toString('hex') + '.png');
      }
      else {
        cb(err, err ? undefined : raw.toString('hex') + '.jpg');
      }
    });
  }
})
function fileFilter (req, file, cb) {
  if (file.mimetype === 'image/png'
    || file.mimetype === 'image/jpg'
    || file.mimetype === 'image/jpeg')
  {
    cb(null, true); // Accept
  }
  else
  {
    cb(null, false); // Reject
  }
}
var limits = { fileSize: config.maxScreenshotSize };
var upload = multer({ storage: storage, fileFilter: fileFilter, limits: limits });


// #################################
//          ISSUES LISTING
// #################################

// Get list
app.get('/', auth.sanitize, auth.enforce('view'), function (req, res) {

  issuesdb.listIssues({}, function(err, list) {

    if (err)
    {
      logger.error(err);
      res.status(500).send('Database error');
      return;
    }

    res.json({list: list.map(issues.formatOutput)});
  });

});

// Insert issue
// Upload must happen before auth to extract parameters from formdata
app.post('/', upload.single('screenshot'), auth.sanitize, auth.enforce('create'),
    function (req, res, next) {

  var issue = issues.validateInput(req.body);

  if (!issue || !issues.isComplete(issue))
  {
    res.status(400).send('Malformed request');

    next('Malformed request'); // Delete screenshot
    return;
  }

  if (typeof(req.file) !== 'undefined')
    issues.bindScreenshot(issue, req.file.filename);

  issuesdb.createIssue(issue, function(err, id) {

    if (err)
    {
      logger.error(err);
      res.status(500).send('Database error');

      next('Database error'); // Delete screenshot
      return;
    }

    // TODO
    logger.info('#'+ id +' created by '+ issue.reporter +'@'+ req.ip);
    res.status(201).json({id: id});
  });

}, function(err, req, res, next) {

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).send('Screenshot size limit exceeded');
    return; // Do not use default handler
  }

  // Error handler that delete the screenshot
  if (typeof(req.file) !== 'undefined')
    fs.unlink(req.file.path, function(){});

  next(err); // Default handler for log

});


// #################################
//         INDIVIDUAL ISSUES
// #################################

app.param('issueId', function(req, res, next, id) {

  // Check issue identifier
  if (!/^[1-9][0-9]*$/.test(id))
  {
    res.sendStatus(400);
    return;
  }

  // Load issue from database or fail
  var issueId = Number(id);
  issuesdb.getIssue(issueId, function(err, issue) {

    if (err)
    {
      logger.error(err);
      res.status(500).send('Database error');
      return;
    }

    if (!issue)
    {
      res.status(404).send('Issue not found');
      return;
    }

    // Issue loaded
    req.issue = issue;
    next();
  });

});


app.get('/:issueId', auth.sanitize, auth.enforce('view'),
    function (req, res) {

  res.json(issues.formatOutput(req.issue));
});

app.put('/:issueId', auth.sanitize, auth.enforce('update'),
    function (req, res) {

  var updatedIssue = req.body;

  if (updatedIssue.id != req.issue.id)
  {
    res.sendStatus(400);
    return;
  }

  // TODO Check freshness
  //res.status(409).send('Issue update conflict');

  issuesdb.updateIssue(updatedIssue, function(err, issue) {

    if (err)
    {
      logger.error(err);
      res.status(500).send('Database error');
      return;
    }

    // TODO
    logger.info('#'+ req.issue.id +' updated by '+ 'TODO' +'@'+ req.ip);
    res.status(204).send('Updated');
  });

});

app.delete('/:issueId', auth.sanitize, auth.enforce('delete'),
    function (req, res) {

  issuesdb.deleteIssue(req.issue.id, function(err, issue) {

    if (err)
    {
      logger.error(err);
      res.status(500).send('Database error');
      return;
    }

    // TODO
    logger.info('#'+ req.issue.id +' deleted by '+ 'TODO' +'@'+ req.ip);
    res.status(204).send('Deleted');
  });

});


app.get('/:issueId/screenshot', auth.sanitize, auth.enforce('view'),
    function (req, res) {

  if (typeof(req.issue.screenshot) === 'undefined')
  {
    res.sendStatus(404);
    return;
  }

  var ext = req.issue.screenshot.substring(req.issue.screenshot.length - 4);
  if (ext === '.jpg') {
    res.type('image/jpg');
  }
  else {
    res.type('image/png');
  }

  res.sendFile(
    __dirname + '/screenshots/' + req.issue.screenshot,
    null, function (err) {
      if (err) {
        logger.error(err);
        res.status(err.status).end();
      }
  });
});


// #################################
//          MAINTENANCE
// #################################
// TODO Move?

function maintenance() {

  // Call the maintenance function every 12 hours
  setTimeout(maintenance, 12 * 60 * 60 * 1000);
  
  // Clear old resolved issues
  if (parseInt(config.deleteResolvedIssuesAfterDays) > 0) {
    issuesdb.deleteOldIssues(parseInt(config.deleteResolvedIssuesAfterDays),
      function(err, count) {
        if (err)
        {
          logger.error(err);
          return;
        }
        logger.info('Deleted ' + count + ' issue(s) during maintenance');
      });
  }

}

// Run a maintenance on startup
maintenance();
