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
var issueList = {};
var issueListFiltered = {};


// Hooks
function mwConnect() {
  bLoading.toggle(true);
  bAuth.toggle(false);

  aAnon = false;
  aUsername = $("#issue-user").val();
  aApiKey = $("#issue-key").val();

  if ($("#issue-remember").is(':checked')) {
    localStorage.setItem("user", aUsername);
    localStorage.setItem("key", aApiKey);
  }

  doConnect();
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

      if (permissions.indexOf("admin") === -1
        && permissions.indexOf("view") === -1) {
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

function rebuildIssueList() {
  var list = $("#issue-list");
  list.html("");

  issueList.forEach(function(issue) {
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
      issueList = result.list;
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

  var user = localStorage.getItem("user");
  if (user) { $("#issue-user").val(user); }

  var key = localStorage.getItem("key");
  if (key) { $("#issue-key").val(key); }

})

  // Install handlers
  // When the user click on a screenshot, enlarge it
  /*$("#issue-list").delegate("div img", "click", function() {
    $( this ).toggleClass( "enlarge-img" );
  });*/
