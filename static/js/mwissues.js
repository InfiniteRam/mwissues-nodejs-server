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


// HTML blocks
var bLoading = $("#b-loading");
var bError = $("#b-error");
var bAuth = $("#b-auth");
var bIssues = $("#b-issues");


// Auth
var aAnon;
var aUsername;
var aApiKey;

var aPermissions;


// Global issue list
var issueList;
var issueListFiltered;

var scenes;
var reporters;
var assignees;


// Filters
var fScene = null;
var fReporter = null;
var fAssignee = null;
var fState;
var fCategory;


// Hooks
function mwConnect() {
  bLoading.toggle(true);
  bAuth.toggle(false);

  aAnon = false;
  aUsername = $("#issue-user").val();
  aApiKey = $("#issue-key").val();

  doConnect();

  if ($("#issue-remember").is(':checked')) {
    localStorage.setItem("user", aUsername);
    localStorage.setItem("key", aApiKey);
  }
  else {
    localStorage.clear();
  }
}

function mwConnectAnon() {
  bLoading.toggle(true);
  bAuth.toggle(false);

  aAnon = true;
  aUsername = "Anonymous";
  aApiKey = "";

  doConnect();
}

function mwCloseError() {
  bError.toggle(false);
}

function mwUpdateFilters() {
  updateFilters();
  rebuildIssueList();
}


// Flow
function doConnect() {
  // Load all issues
  ajaxAuth()
    .always(function() {
      bLoading.toggle(false);
    })
    .done(function( result ) {
      if (!aAnon && !result.valid) {
        bAuth.toggle(true);
        showError("Authentication failed");
        return;
      }

      if (aPermissions.indexOf("admin") === -1
        && aPermissions.indexOf("view") === -1) {
        bAuth.toggle(true);
        showError("You don't have the permission to view the issue list");
        return;
      }

      bLoading.toggle(true);
      ajaxRefreshIssues()
        .always(function() {
          bLoading.toggle(false);
        })
        .done(function() {
          bIssues.toggle(true);
        })
        .fail(function() {
          bAuth.toggle(true);
        });
    })
    .fail(function() {
      bAuth.toggle(true);
    });
}


// Content creation
function showError(message) {
  $("#issue-error-text").text(message);
  bError.toggle(true);
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


function refreshIssueList(list) {
  issueList = list;

  // Find every unique scene / reporter / assignee
  scenes = [];
  reporters = [];
  assignees = [];

  issueList.forEach(function(issue) {
    if (scenes.indexOf(issue.scene) === -1)
      scenes.push(issue.scene);
    if (reporters.indexOf(issue.reporter) === -1)
      reporters.push(issue.reporter);
    if (issue.assignee && assignees.indexOf(issue.assignee) === -1)
      assignees.push(issue.assignee);
  });

  scenes.sort();
  reporters.sort();
  assignees.sort();

  // Regex to remove "Assets/"
  var ex = /^Assets\//;

  var sceneSelect = $("#scene-filter");
  sceneSelect.html("");
  sceneSelect.append($("<option>").prop("value", "*").text("Show everything"));
  scenes.forEach(function(scene) {
    sceneSelect.append($("<option>").prop("value", scene).text(
      !!ex.exec(scene) ? scene.substr(7) : scene));
  });
  if (fScene) sceneSelect.val(fScene);

  var reporterSelect = $("#reporter-filter");
  reporterSelect.html("");
  reporterSelect.append($("<option>").prop("value", "*").text("Show everything"));
  reporters.forEach(function(reporter) {
    reporterSelect.append($("<option>").prop("value", reporter).text(reporter));
  });
  if (fReporter) reporterSelect.val(fReporter);

  var assigneeSelect = $("#assignee-filter");
  assigneeSelect.html("");
  assigneeSelect.append($("<option>").prop("value", "*").text("Show everything"));
  assigneeSelect.append($("<option>").prop("value", "-").text("Only show unassigned issues"));
  assignees.forEach(function(assignee) {
    assigneeSelect.append($("<option>").prop("value", assignee).text(assignee));
  });
  if (fAssignee) assigneeSelect.val(fAssignee);

  updateFilters();
}

function updateFilters() {
  fScene = $("#scene-filter").val();
  if (fScene === "*") fScene = null;

  fReporter = $("#reporter-filter").val();
  if (fReporter === "*") fReporter = null;

  fAssignee = $("#assignee-filter").val();
  if (fAssignee === "*") fAssignee = null;

  fState = 0;
  if (!$("#state-new").hasClass("filter-disabled")) fState |= State.New;
  if (!$("#state-confirmed").hasClass("filter-disabled")) fState |= State.Confirmed;
  if (!$("#state-pending").hasClass("filter-disabled")) fState |= State.Pending;
  if (!$("#state-resolved").hasClass("filter-disabled")) fState |= State.Resolved;

  fCategory = 0;
  if (!$("#cat-red").hasClass("filter-disabled")) fCategory |= Category.Red;
  if (!$("#cat-orange").hasClass("filter-disabled")) fCategory |= Category.Orange;
  if (!$("#cat-yellow").hasClass("filter-disabled")) fCategory |= Category.Yellow;
  if (!$("#cat-green").hasClass("filter-disabled")) fCategory |= Category.Green;
  if (!$("#cat-cyan").hasClass("filter-disabled")) fCategory |= Category.Cyan;
  if (!$("#cat-blue").hasClass("filter-disabled")) fCategory |= Category.Blue;
  if (!$("#cat-purple").hasClass("filter-disabled")) fCategory |= Category.Purple;

  issueListFiltered = [];

  // Check each issue against the filters
  issueList.forEach(function(issue) {

    if (fScene && issue.scene !== fScene) return;
    if (fReporter && issue.reporter !== fReporter) return;
    if (fAssignee && ((!issue.assignee && fAssignee !== "-")
        || (issue.assignee && issue.assignee !== fAssignee))) return;
    if ((fState & issue.state) === 0) return;
    if ((fCategory & issue.category) === 0) return;

    issueListFiltered.push(issue);
  });
}

function rebuildIssueList() {
  var list = $("#issue-list");
  list.html("");

  issueListFiltered.forEach(function(issue) {
    list.append(createDomForIssue(issue));
  });
}


// Ajax calls
function ajaxAuth() {
  return $.ajax({
    method: "GET",
    url: "issue/auth",
    dataType: "json",
    data: { user: aUsername, key: aApiKey }
  })
    .done(function( result ) {
      aPermissions = result.permissions;
    })
    .fail(function( xhr ) {
      showError("Request failed : "+ xhr.statusText);
      console.error(xhr);
    });
}

function ajaxRefreshIssues() {
  return $.ajax({
    method: "GET",
    url: "issue",
    dataType: "json",
    data: { user: aUsername, key: aApiKey }
  })
    .done(function( result ) {
      refreshIssueList(result.list);
      rebuildIssueList();
    })
    .fail(function( xhr ) {
      showError("Request failed : "+ xhr.statusText);
      console.error(xhr);
    });
}


$(document).ready(function() {
  bLoading.toggle(false);
  bAuth.toggle(true);

  // Hooks
  $("#issue-cat-cont > a").on("click", function(event) {
    $(this).toggleClass("filter-disabled");
    mwUpdateFilters();
  });
  $("#issue-cat-cont > a").on("dblclick", function(event) {
    $("#issue-cat-cont > a").addClass("filter-disabled");
    $(this).removeClass("filter-disabled");
    mwUpdateFilters();
  });
  $("#issue-state-cont > a").on("click", function(event) {
    $(this).toggleClass("filter-disabled");
    mwUpdateFilters();
  });
  $("#issue-state-cont > a").on("dblclick", function(event) {
    $("#issue-state-cont > a").addClass("filter-disabled");
    $(this).removeClass("filter-disabled");
    mwUpdateFilters();
  });

  // Disable resolved by default
  $("#state-resolved").toggleClass("filter-disabled");

  // Load credentials from localStorage
  var key = localStorage.getItem("key");
  if (key) {
    $("#issue-key").val(key);

    $("#issue-remember").prop('checked', true);

    var user = localStorage.getItem("user");
    if (user) { $("#issue-user").val(user); }
  }

})
