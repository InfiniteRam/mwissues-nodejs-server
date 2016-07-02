/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('../config.json');

var apikeys = config.apikeys;


// Permissions can be:
//  admin
//  view
//  create
//  update
//  delete


var anonymousPerms = apikeys['anonymous'];
if (!anonymousPerms) anonymousPerms = [];

function getPerms(key) {
  return apikeys[key];
}

function check(key, perm) {

  var permissions = getPerms(key);
  if (!permissions) {
    permissions = anonymousPerms;
  }

  if (permissions.indexOf('admin') !== -1) return true;
  if (permissions.indexOf(perm) !== -1) return true;

  return false;
}


module.exports = {

  // Express middleware called for every request
  // Use this to sanitize the user / key
  // Do not perform auth checks here
  sanitize: function(req, res, next) {
    // Only key is used, user is ignored
    //req.auth_user = req.body.user;
    req.auth_key = req.body.key;

    // Check in query if not found in body
    //if (!req.auth_user) req.auth_user = req.query.user;
    if (!req.auth_key) req.auth_key = req.query.key;

    // Delete the auth data from the body so it will never be consumed
    delete req.body.user;
    delete req.body.key;

    next();
  },

  // Validate a request and callback with param:
  // { valid: bool, permissions: [''] }
  // Callback must always be called
  getAuth: function(req, callback) {
    var valid = true;
    var perms = getPerms(req.auth_key);

    if (!perms) {
      valid = false;
      perms = anonymousPerms;
    }

    callback({ valid: valid, permissions: perms });
  },

  // Express middleware that verifies the API Key
  // Return an error if auth has failed for given mode
  enforce: function(mode) {
    return function(req, res, next) {

      if (check(req.auth_key, mode)) {
        next(); // OK, continue
      }
      else {
        // Send an error
        res.status(403).send('Permission denied');

        // Continue in error (important for cleanup)
        next('Permission denied');
      }
    }
  }

};
