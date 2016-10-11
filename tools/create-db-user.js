#!/usr/bin/env nodejs

/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var db_auth = require('../auth/database');
var perm_ut = require('../utils/permissions');


if (process.argv.length < 5) {
  console.log('Usage: node create-db-user.js <login> <password> <permissions>');
  return;
}

var login = process.argv[2];
var password = process.argv[3];
var permissions = perm_ut.fromString(process.argv[4]);

if (permissions === null) {
  console.log('Invalid <permissions> string');
  return;
}

db_auth.createUser(login, password, permissions, function(err, id) {
  if (err) {
    console.error(err);
    process.exit();
    return;
  }

  console.log('Created user '+ login +' with id: '+ id);
  process.exit();
});
