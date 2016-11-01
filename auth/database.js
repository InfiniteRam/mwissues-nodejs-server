/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

//var config = require('../config.json').auth.database;

var authdb = require('../database');

var crypto = require('crypto');


var pbkdf2_salt_size = 128 / 8
var pbkdf2_iters = 25000
var pbkdf2_size = 1024 / 8
var pbkdf2_algo = 'sha512'


module.exports = {

  // callback(err, valid, userid, username, permissions)
  // valid is true if auth is successful
  // username is the real user name (not required to be the same as login)
  // permissions is permissions table
  checkCredentials: function(login, password, callback) {

    authdb.getUserCredentials(login, function(err, salt, hashedPassword, userid, permissions) {
      if (err) {
        callback(err);
        return;
      }

      crypto.pbkdf2(password, salt, pbkdf2_iters, pbkdf2_size, pbkdf2_algo,
          function(err, key) {
        if (err) {
          callback(err);
          return;
        }

        if (key.compare(hashedPassword) === 0) {
          // Password is valid
          callback(null, true, userid, login, permissions);
        }
        else {
          // Password is incorrect
          callback(null, false);
        }
      });
    });
  },

  // callback(err, id)
  createUser: function (login, password, permissions, callback) {

    crypto.randomBytes(pbkdf2_salt_size, function(err, salt) {

      crypto.pbkdf2(password, salt, pbkdf2_iters, pbkdf2_size, pbkdf2_algo,
          function(err, hashedPassword) {
        if (err) {
          callback(err);
          return;
        }

        authdb.createUser(login, salt, hashedPassword, permissions, function(err, id) {
          if (err) {
            callback(err);
            return;
          }

          callback(null, id);
        });
      });
    });
  },

  // callback(err, username, permissions)
  getUserInfo: function (userid, callback) {

    authdb.getUserInfo(userid, callback);
  },

  // callback(err, userid, username, keyid, keyname?, permissions)
  getKeyInfo: function (key, callback) {

    authdb.getKeyInfo(key, callback);
  }

};
