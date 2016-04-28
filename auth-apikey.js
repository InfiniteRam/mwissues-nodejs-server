/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var config = require('./config.json');

var apikeys = config.apikeys;


// mode can be:
//	view
//	create
//	update
//	delete

function check(key, mode) {

  var group = apikeys[key];
  if (!group) {
    group = apikeys['anonymous'];
  
    if (!group) return false;
  }

  if (group.indexOf(mode) !== -1) return true;

  return false;
}


module.exports = function(mode) {

  // Express middleware that verifies the API Key
  // Return an error if auth has failed
	return function(req, res, next) {

		if (check(req.body.key, mode)) {
      delete req.body.key;
			next();
		}
		else {
			res.status(403).send('Premission denied');
      next('Premission denied');
		}
	}

};
