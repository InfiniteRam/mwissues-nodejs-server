/*
 * Copyright (c) 2016 Bastien Brunnenstein
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this repository.
 */

var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      json: false,
      timestamp: true
    }),
    new winston.transports.File({
      filename: __dirname + '/mwissues.log',
      json: false,
      timestamp: true,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    })
  ],

  exceptionHandlers: [
    new (winston.transports.Console)({
      json: false,
      timestamp: true,
      humanReadableUnhandledException: true
    }),
    new winston.transports.File({
      filename: __dirname + '/exceptions.log',
      json: false,
      timestamp: true,
      humanReadableUnhandledException: true
    })
  ],

  exitOnError: false
});

module.exports = logger;
