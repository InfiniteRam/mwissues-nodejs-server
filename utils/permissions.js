/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var idTable = {
  A: 'admin',
  v: 'view',
  c: 'create',
  u: 'update',
  d: 'delete'
};


module.exports = {

  // Convert an array of permissions to a string
  toString: function(array) {
    if (typeof(array) !== 'object')
      return null;

    var ret = '';
    var count = 0;

    for (var key in idTable) {
      if (array.indexOf(idTable[key]) !== -1) {
        ret = ret + key;
        count = count + 1;
      }
    }

    if (array.length !== count)
      return null;

    return ret;
  },

  // Convert a string of permissions to an array
  fromString: function(str) {
    if (typeof(str) !== 'string')
      return null;

    var ret = [];
    var count = 0;

    for (var key in idTable) {
      if (str.indexOf(key) !== -1) {
        ret.push(idTable[key]);
        count = count + 1;
      }
    }

    if (str.length !== count)
      return null;

    return ret;
  }

}