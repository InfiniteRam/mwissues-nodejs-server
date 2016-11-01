/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */


// This function allows you to handle custom data
// For example, you can add text or other visual elements to the issue
// * dom is a jQuery dom element representing the issue
//   It's a <li> already filled with the usual "issue" data
// * data is your custom data as a string
var customDataView = function(dom, data) {
  // Add code to handle your custom data here
}


// MwIssues web interface code
var mw = (function(){

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
  var bAdmin = $("#b-admin");


  // TODO Auth
  // This data is filled by ajax auth calls
  var aUserid;
  var aUsername;
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


  // Flow
  function doLogin(anon, login, key) { // TODO Complete redo with new login
    // Load all issues
    ajaxLogin(anon, login, key)
      .always(function() {
        bLoading.toggle(false);
      })
      .done(function( result ) {
        if (result.valid === false) {
          bAuth.toggle(true);
          showError("Authentication failed");
          return;
        }

        bLoading.toggle(true);
        ajaxRefreshIssues()
          .always(function() {
            bLoading.toggle(false);
          })
          .done(function() {
            bIssues.toggle(true);
            showTabs();
            setActiveTab("issues");
          })
          .fail(function() {
            bAuth.toggle(true);
          });
      })
      .fail(function() {
        bAuth.toggle(true);
      });
  }

  function doRefresh() {
    $("#refresh-btn").toggle(false);
    $("#refresh-wait").toggle(true);

    ajaxRefreshIssues()
      .always(function() {
        $("#refresh-btn").toggle(true);
        $("#refresh-wait").toggle(false);
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
        $("<p>").addClass("issue-screenshot").on("click", function(event) {
          mw.ShowScreenshot(issue.id);
        }));
    }

    // Scene
    dom.append($("<p>").addClass("issue-scene")
      .text(issue.scene).prepend($("<i>").text("Scene: ")));

    // Description
    if (issue.description) {
      dom.append($("<p>").addClass("issue-description")
        .html(
          $("<div>").text(issue.description).html().replace(/\n/g, "<br>")
        ));
    }

    // Reporter
    if (issue.reporterKeyName) {
      dom.append($("<p>").addClass("issue-reporter")
        .text(issue.reporterName + " (" + issue.reporterKeyName + ")").prepend($("<i>").text("Reporter: ")));
    }
    else {
      dom.append($("<p>").addClass("issue-reporter")
        .text(issue.reporterName).prepend($("<i>").text("Reporter: ")));
    }

    // Assignee
    if (issue.assigneeName) {
      dom.append($("<p>").addClass("issue-assignee")
        .text(issue.assigneeName).prepend($("<i>").text("Assignee: ")));
    }

    // Custom data
    if (issue.customData && customDataView) {
      customDataView(dom, issue.customData);
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

    if (issueListFiltered.length > 0) {
      issueListFiltered.forEach(function(issue) {
        list.append(createDomForIssue(issue));
      });
    }
    else {
      list.append($("<p>").text("No issues found"));
    }

  }


  // Ajax calls
  function ajaxCheckAuth() {
    return $.ajax({
      method: "GET",
      url: "auth",
      dataType: "json"
    })
      .done(function( result ) {
        // TODO fill all auth data including username and anon state
        aUserid = result.userid;
        aUsername = result.username;
        aPermissions = result.permissions;

        $("#anon-connect-button").toggle(!!result.anonAllowed);
      })
      .fail(function( xhr ) {
        showError("Request failed : "+ xhr.statusText);
        console.error(xhr);
      });
  }

  function ajaxLogin(anon, login, key) {
    return $.ajax({
      method: "POST",
      url: "auth/login",
      dataType: "json",
      data: { anon:anon, login: login, password: key } // TODO param names
    })
      .done(function( result ) {
        // Fill all auth data
        aUserid = result.userid;
        aUsername = result.username;
        aPermissions = result.permissions;
      })
      .fail(function( xhr ) {
        showError("Request failed : "+ xhr.statusText);
        console.error(xhr);
      });
  }

  // TODO ajaxLogout and logout button

  function ajaxRefreshIssues() {

    // If we don't have view permissions, empty the list
    if (aPermissions.indexOf("admin") === -1
      && aPermissions.indexOf("view") === -1) {
      $("#issue-list").html("").append($("<p>").text("You are not allowed to view the issue list"));

      // Resolve instantly
      return $.Deferred(function(d){d.resolve();});
    }

    return $.ajax({
      method: "GET",
      url: "issue",
      dataType: "json"
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

  function ajaxRenameScene(oldScene, newScene) {
    return $.ajax({
      method: "POST",
      url: "admin/renameScene",
      dataType: "json",
      data: { oldScene: oldScene, newScene: newScene }
    })
      .fail(function( xhr ) {
        showError("Request failed : "+ xhr.statusText);
        console.error(xhr);
      });
  }


  function hideAllBlocks() {
    bIssues.toggle(false);
    bAdmin.toggle(false);
  }

  function showTabs() {
    $("#nav-tabs > li[id]").toggle(true);

    if (aPermissions.indexOf("admin") === -1) {
      $("#tab-admin").toggle(false);
    }
  }

  function hideTabs() {
    $("#nav-tabs > li[id]").toggle(false);
  }

  function lockTabs(locked) {
    if (locked) {
      $("#nav-tabs > li[id]").addClass("disabled");
    }
    else {
      $("#nav-tabs > li[id]").removeClass("disabled");
    }
  }

  function setActiveTab(tab) {
    $("#nav-tabs > li").removeClass("active");
    $("#tab-" + tab).addClass("active");
  }


  $(document).ready(function() {
    // Hooks
    $("#issue-cat-cont > a").on("click", function(event) {
      $(this).toggleClass("filter-disabled");
      mw.UpdateFilters();
    });
    $("#issue-cat-cont > a").on("dblclick", function(event) {
      $("#issue-cat-cont > a").addClass("filter-disabled");
      $(this).removeClass("filter-disabled");
      mw.UpdateFilters();
    });
    $("#issue-state-cont > a").on("click", function(event) {
      $(this).toggleClass("filter-disabled");
      mw.UpdateFilters();
    });
    $("#issue-state-cont > a").on("dblclick", function(event) {
      $("#issue-state-cont > a").addClass("filter-disabled");
      $(this).removeClass("filter-disabled");
      mw.UpdateFilters();
    });

    // Disable resolved by default
    $("#state-resolved").toggleClass("filter-disabled");

    // Load credentials from localStorage
    var key = localStorage.getItem("key");
    if (key) {
      $("#issue-key").val(key);

      $("#issue-remember").prop("checked", true);

      var user = localStorage.getItem("user");
      if (user) { $("#issue-user").val(user); }
    }

    // Check session
    // Draw auth form if not connected or on error
    ajaxCheckAuth()
      .done(function() {
        if ( typeof(aUserid) === "undefined" ) {
          bLoading.toggle(false);
          bAuth.toggle(true);
          return;
        }

        ajaxRefreshIssues()
          .always(function() {
            bLoading.toggle(false);
          })
          .done(function() {
            bIssues.toggle(true);
            showTabs();
            setActiveTab("issues");
          })
          .fail(function() {
            bAuth.toggle(true);
          });
      })
      .fail(function() {
        bLoading.toggle(false);
        bAuth.toggle(true);
      });

  });

  // TODO
  var isLoading = false;


  // Exported functions
  return {

    Connect: function() {
      bLoading.toggle(true);
      bAuth.toggle(false);

      var login = $("#issue-user").val();
      var key = $("#issue-key").val();

      doLogin(false, login, key);

      if ($("#issue-remember").is(":checked")) {
        localStorage.setItem("user", login);
        localStorage.setItem("key", key);
      }
      else {
        localStorage.clear();
      }
    },

    ConnectAnon: function() {
      bLoading.toggle(true);
      bAuth.toggle(false);

      doLogin(true);
    },

    CloseError: function() {
      bError.toggle(false);
    },

    UpdateFilters: function() {
      updateFilters();
      rebuildIssueList();
    },

    Refresh: function() {
      doRefresh();
    },

    ShowScreenshot: function(issueId) {
      $("body").append(
        $("<div>").addClass("modal-overlay")
          .append($("<img>").attr("src", "issue/"+issueId+"/screenshot")
            .addClass("modal-ss"))
          .on("click", function(event) {
            $(this).remove();
          }));
    },


    TabIssues: function() {
      if (isLoading) return; // TODO

      setActiveTab("issues");

      hideAllBlocks();

      bIssues.toggle(true);

      isLoading = true;
      lockTabs(true);

      ajaxRefreshIssues()
        .always(function() {
          isLoading = false;
          lockTabs(false);
        });
    },

    TabAdmin: function() {
      if (isLoading) return;

      setActiveTab("admin");

      hideAllBlocks();

      bAdmin.toggle(true);
    },

    SubmitRenameScene: function() {
      var srcSceneField = $("#admin-renamescene input[name=srcScene]");
      var newSceneField = $("#admin-renamescene input[name=newScene]");

      var srcScene = srcSceneField.val();
      var newScene = newSceneField.val();

      if (srcScene.length === 0 || newScene.length === 0) return;

      $("#admin-renamescene input").prop("disabled", true);

      ajaxRenameScene(srcScene, newScene)
        .always(function() {
          $("#admin-renamescene input").prop("disabled", false);
        })
        .done(function( result ) {
          srcSceneField.val("");
          newSceneField.val("");
          $("#admin-renamescene-res").text(result.affectedIssues + " issue(s) have been updated.");
        })
        .fail(function() {
          $("#admin-renamescene-res").text("Request failed.");
        });
    }

  };

})();
