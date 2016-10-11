/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('./config.json').auth;


var session = require('express-session');

var authsession = session({
  name: 'mwissues.sid',
  secret: 'mwissues-secret', // TODO session secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'auto' }
});

var auth_database = require('./auth/database');


module.exports = {

  // Express middleware called for every request receiving auth data
  // Exceptions: /auth/login and /auth/logout
  // TODO req.auth is filled with:
  //  userid
  //  keyid (if apikey is used)
  //  username
  //  permissions
  //  key (if apikey is used)
  //  keyname (if apikey is used)
  sanitize: function(req, res, next) {
    authsession(req, res, function(err) {
      if (err) {
        next(err);
        return;
      }

      req.auth = {};

      // If session is valid, use session data
      if (req.session.userid)
        req.auth.userid = req.session.userid;

      // If session isn't valid, check body & query data for apikey
      else {
        req.auth.key = req.body.key;

        // Check in query if not found in body
        if (!req.auth.key)
          req.auth.key = req.query.key;
      }

      // Delete the auth data from the body so it will never be consumed
      delete req.body.key;

      // If userid is valid, fill auth fields
      if (typeof(req.auth.userid) === 'number') {
        if (req.auth.userid < 0) {
          // Anon user
          if (config.useAnonymous) {
            req.auth.username = 'Anonymous';
            req.auth.permissions = config.anonymousPerms;
          }
          else {
            delete req.auth.userid;
          }
        }
        else {
          // Real user
          auth_database.getUserInfo(req.auth.userid, function(err, username, permissions) {
            if (err) {
              next(err);
              return;
            }
            req.auth.username = username;
            req.auth.permissions = permissions;
            next();
          });
          return; // Prevent next() from being called
        }
      }
      // TODO If key is valid and userid is not set, find API key and fill auth fields
      else if (typeof(req.auth.key) === 'string') {

      }

      next();
    });
  },


  // Login: verify credentials and create session
  // TODO Check code?
  // callback(err, userid, username, permissions)
  // return no error nor credentials if the credentials are invalid
  login: function(req, res, callback) {
    authsession(req, res, function(err) {
      if (err) {
        callback(err);
        return;
      }

      var anon = req.body.anon === 'true';
      var login = req.body.login;
      var password = req.body.password;

      if (anon) {
        // Anon access
        if (config.useAnonymous) {
          req.session.userid = -1;
          callback(null, -1, 'Anonymous', config.anonymousPerms);
        }
        else {
          callback('Anonymous access denied');
        }
      }
      else {
        // Login / pass access
        auth_database.checkCredentials(login, password,
            function(err, valid, userid, username, permissions) {

          if (err) {
            callback(err);
            return;
          }

          if (!valid) {
            callback('Invalid user or password');
          }

          else
          {
            req.session.userid = userid;
            callback(null, userid, username, permissions);
          }
        });
      }
    });
  },

  // Logout: destroy active session
  // callback(err)
  logout: function(req, res, callback) {
    authsession(req, res, function(err) {
      if (err) {
        callback(err);
        return;
      }
      req.session.destroy(callback);
    });
  },




  // Get auth informations
  // callback(err, data)
  // data = {
  //   userid: user id (if connected)
  //   username: username (if connected)
  //   anonAllowed: bool (if not connected)
  //   permissions: ['']
  // }
  getAuthInfos: function(req, callback) {

    if (req.auth.userid < 0 && config.useAnonymous) {
      callback(null, {
        userid: req.auth.userid,
        username: 'Anonymous',
        anonAllowed: true,
        permissions: config.anonymousPerms
      });
      return;
    }

    // TODO Check userid, get username and permissions
    if (req.auth.userid >= 0) {
      callback(null, {
        userid: req.auth.userid,
        username: req.auth.username,
        permissions: req.auth.permissions
      });
      return;
    }

    callback(null, {
      anonAllowed: !!config.useAnonymous,
      permissions: []
    });
  },

  // Express middleware that verifies the API Key
  // Return an error if auth has failed for given mode
  enforce: function(mode) {
    return function(req, res, next) {

      if (req.auth.userid < 0 && !config.useAnonymous) {
        // Send an error
        res.status(403).send('Anonymous access denied');

        // Continue in error (important for cleanup)
        next('Anonymous access denied');
        return;
      }

      // Check auth for mode
      if (typeof(req.auth.permissions) !== 'undefined'
        && (req.auth.permissions.indexOf(mode) !== -1
          || req.auth.permissions.indexOf('admin') !== -1)) {
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
