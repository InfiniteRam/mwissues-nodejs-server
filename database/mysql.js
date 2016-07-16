/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('../config.json');

var mysql = require('mysql');

var pool  = mysql.createPool(config.mysqlParams);


var issues = require('../issues');


module.exports = (function() {

  return {

    // Create an issue
    // Issue must be a valid issue object
    // callback is (err, insertId)
    createIssue: function(issue, callback) {

      var set = {
        title: issue.title,
        description: issue.description,
        scene: issue.scene,
        state: issue.state,
        category: issue.category,
        position: issue.position,
        cameraPosition: issue.cameraPosition,
        cameraOrientation: issue.cameraOrientation,
        orthographicSize: issue.orthographicSize,
        reporter: issue.reporter,
        assignee: issue.assignee,
        screenshot: issue.screenshot,
        customData: issue.customData
      };

      pool.query('INSERT INTO issues SET ?', set, function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, result.insertId);
      });

    },

    // Update an issue
    // Issue must be a valid issue object
    updateIssue: function(issue, callback) {

      // Update set is limited to editable values
      var set = {};

      if (typeof(issue.title) !== 'undefined')
        set.title = issue.title;

      if (typeof(issue.description) !== 'undefined')
        set.description = issue.description;

      if (typeof(issue.state) !== 'undefined')
        set.state = issue.state;

      if (typeof(issue.category) !== 'undefined')
        set.category = issue.category;

      if (typeof(issue.assignee) !== 'undefined')
        set.assignee = issue.assignee;

      if (typeof(issue.customData) !== 'undefined')
        set.customData = issue.customData;


      pool.query('UPDATE issues SET ? WHERE ?', [set, {id: issue.id}], function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback(null);
      });

    },

    // Delete an issue
    deleteIssue: function(id, callback) {

      issues.deleteScreenshot(issue);

      pool.query('UPDATE issues SET archived = TRUE, screenshot = NULL WHERE ?', {id: id}, function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback(null);
      });

    },

    // Find an issue by id
    // Return null if not found
    // callback is (err, issue)
    getIssue: function(id, callback) {

      pool.query('SELECT * FROM issues WHERE ?', {id: id}, function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, result[0]);
      });

    },

    // Get multiple issues
    // Retrun an array
    // callback is (err, issueArray)
    listIssues: function(filter, callback) {

      /*if (typeof(filter.count) == 'number' && Number.isInteger(filter.count))
      {
        var start = 1;
        var count = filter.count;

        if (typeof(filter.start) == 'number' && Number.isInteger(filter.start))
          start = filter.start;
      }*/

      pool.query('SELECT * FROM issues WHERE archived = FALSE ORDER BY id ASC', function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, result);
      });

    },

    // Delete old issues
    // On MySql we archive them instead
    deleteOldIssues: function(days, callback) {

      pool.query('SELECT * FROM issues WHERE archived = FALSE AND state = 0x08 AND time < DATE_SUB(NOW(), INTERVAL ? DAY)',
          days, function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        var i = 0;

        // Loop on all issues asynchronously
        function nextStep() {
          // End condition
          if (i >= result.length) {
            callback(null, i);
            return;
          }

          // Get next issue
          var issue = result[i++];

          issues.deleteScreenshot(issue);

          // Archive it and mark the screenshot as deleted
          pool.query('UPDATE issues SET archived = TRUE, screenshot = NULL WHERE ?',
              {id: issue.id}, function(err, result) {
            if (err) {
              callback(err);
              return;
            }

            // Next iteration
            nextStep();
          });

        }
        // First iteration
        nextStep();

      });

    },

    // Rename a scene globally
    renameScene: function(oldName, newName, callback) {

      pool.query('UPDATE issues SET scene = ? WHERE ?',
          newName, {scene: oldName}, function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback(null);
      });

    }

  };
}());
