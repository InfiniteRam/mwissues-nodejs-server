/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('./config.json');


module.exports = (function() {

  // Issue object has:
    // title
    // description*
    // scene
    // state
    // category
    // cameraPosition
    // cameraOrientation
    // orthographicSize
    // reporter
    // assignee*
    // screenshot*

  // Input validation
  var fieldsValidation = {

  };

  return {

    // Check that the data retreived from the client is valid
    // Return the processed data or null
    validateInput: function(data) {

      var issue = {
        id: data.id,
        title: data.title,
        description: data.description,
        scene: data.scene,
        state: data.state,
        category: data.category,
        position: data.position,
        cameraPosition: data.cameraPosition,
        cameraOrientation: data.cameraOrientation,
        orthographicSize: data.orthographicSize,
        reporter: data.reporter,
        assignee: data.assignee,
        screenshot: data.screenshot
      };

      // TODO Check parameters

      return issue;
    },

    // Format an issue for output
    // The returned object will be serialized using JSON and sent to the client
    formatOutput: function(issue) {
      return {
        id: issue.id,
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
        hasScreenshot: !!issue.screenshot
      };
    },

    // Bind a screenshot to an issue
    // screenshot is a filename
    bindScreenshot: function(issue, screenshot) {
      issue.screenshot = screenshot;
    }

  };
}());
