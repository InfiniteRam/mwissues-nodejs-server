/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

// Enums from C#
var State = {
  New: 0x01,
  Confirmed: 0x02,
  Pending: 0x04,
  Resolved: 0x08
}

var Category = {
  Red: 0x01,
  Orange: 0x02,
  Yellow: 0x04,
  Green: 0x08,
  Cyan: 0x10,
  Blue: 0x20,
  Purple: 0x40
}

// Conversion utilities
function stateFromInt(i) {
  var s;
  for (s in State) {
    if (State[s] == i) return s;
  }
}

function categoryFromInt(i) {
  var s;
  for (s in Category) {
    if (Category[s] == i) return s;
  }
}


// Global issue list
var issueList = {};


function loadAllIssues(cb) {
  $.ajax({
    method: "GET",
    url: "issue",
    dataType: "json"
  })
    .done(function( result ) {
      issueList = result.list;
      cb();
    });
}

function createDomForIssue(issue) {
  var dom = $("<li>");
  dom.addClass("list-group-item");

  // Title
  var title = $("<h4>").text("#" + issue.id + " " + issue.title);
  dom.append(title);

  // Badge
  var state = stateFromInt(issue.state);
  var category = categoryFromInt(issue.category);

  title.prepend($("<i>").addClass("issue-badge")
    .css("background-image", 
      ("url('img/"+category+"-"+state+".png')").toLowerCase())
    .attr("title", category+" "+state));

  // Screenshot
  if (issue.hasScreenshot) {
    dom.append(
      $("<img>").attr("src", "issue/"+issue.id+"/screenshot"));
  }

  // Scene
  dom.append($("<p>").addClass("issue-scene")
    .text(issue.scene).prepend($("<i>").text("Scene: ")));

  // Description
  if (issue.description) {
    dom.append($("<p>").addClass("issue-description")
      .text(issue.description));
  }

  // Reporter
  dom.append($("<p>").addClass("issue-reporter")
    .text(issue.reporter).prepend($("<i>").text("Reporter: ")));

  // Assignee
  if (issue.assignee) {
    dom.append($("<p>").addClass("issue-assignee")
      .text(issue.assignee).prepend($("<i>").text("Assignee: ")));
  }

  // Add invisible clear at the end to prevent overflow
  dom.append($("<div>").addClass("clear"));

  return dom;
}

function rebuildIssueList() {
  var list = $("#issue-list");
  list.html("");

  issueList.forEach(function(issue) {
    list.append(createDomForIssue(issue));
  });
}


$(document).ready(function() {
  // Load all issues
  loadAllIssues(rebuildIssueList);

  // Install handlers
  // When the user click on a screenshot, enlarge it
  $("#issue-list").delegate("div img", "click", function() {
    $( this ).toggleClass( "enlarge-img" );
  });
})
