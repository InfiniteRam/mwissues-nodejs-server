/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('./config.json');


module.exports = (function() {

  // Issue object has:
    // id*
    // title
    // description*
    // scene
    // state
    // category
    // cameraPosition
    // cameraOrientation
    // orthographicSize*
    // reporter
    // assignee*
    // screenshot*

  return {

    // Check that the data retreived from the client is valid
    // Return the processed data or null
    validateInput: function(data) {

      var issue = {};

      // Check parameters

      if (Number.isFinite(parseInt(data.id)))
        issue.id = parseInt(data.id);

      if (typeof(data.title) === "string")
        issue.title = data.title;

      if (typeof(data.description) === "string")
        issue.description = data.description;

      if (typeof(data.scene) === "string")
        issue.scene = data.scene;

      if (typeof(data.reporter) === "string")
        issue.reporter = data.reporter;

      if (typeof(data.assignee) === "string")
        issue.assignee = data.assignee;

      // TODO Better check for these parameters

      if (Number.isFinite(parseInt(data.state)))
        issue.state = parseInt(data.state);

      if (Number.isFinite(parseInt(data.category)))
        issue.category = parseInt(data.category);

      if (typeof(data.position) === "string")
        issue.position = data.position;

      if (typeof(data.cameraPosition) === "string")
        issue.cameraPosition = data.cameraPosition;

      if (typeof(data.cameraOrientation) === "string")
        issue.cameraOrientation = data.cameraOrientation;

      if (Number.isFinite(parseFloat(data.orthographicSize)))
        issue.orthographicSize = parseFloat(data.orthographicSize);

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
    },

    // Check if the issue is complete
    // A complete issue has no missing required field
    isComplete: function(issue) {
      if (typeof(issue.title) !== "undefined"
        && typeof(issue.scene) !== "undefined"
        && typeof(issue.state) !== "undefined"
        && typeof(issue.category) !== "undefined"
        && typeof(issue.cameraPosition) !== "undefined"
        && typeof(issue.cameraOrientation) !== "undefined"
        && typeof(issue.reporter) !== "undefined")
        return true;

      return false;
    }

  };
}());
