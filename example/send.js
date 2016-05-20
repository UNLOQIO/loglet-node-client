'use strict';
/**
 * Send out log events via the loglet.io node.js client
 * Note that the loglet client is a singleton and only supports one loglet instance per application.
 * Therefore, if the loglet() function is called more than once, it will return the same loglet instance.
 *
 * Note: if you want to outsource the encryption functionality to the loglet API,
 * you can use the long API key (from your application dashboard).
 * If you want encryption to happen on the client, you must use the short API key and
 * the API Secret
 * */
var loglet = require('../lib/loglet');  // require('loglet.io');

loglet({
  key: 'YOUR_Ap_KEY',
  secret: 'YOUR_APP_SECRET'
}, (err) => {
  if (err) {            // could not connect to the server
    console.error(err);
    return;
  }
});

loglet
  .on('error', function(err) {
    console.log("Encountered an error", err);
  })
  .on('connect', function() {
    console.log("Connected to loglet.io");
  }).on('disconnect', function() {
  console.log("Disconnected from loglet.io");
});
/**
 * The log item can contain the following properties:
 *  - name[=default] - the name of the logger or app instance
 *  - namespace[=global] - the namespace of the log event
 *  - level[=debug] - the log level. Values are: trace, debug, info, warn, error, fatal
 *  - message (required) - the message that we want to send.
 *  - data - additional data that can be attached to the log entry as a an object, array, string or number
 *  - tags - additional tags that can be attached to the log entry. Each tag entry must be a string.
 *  - error - additional error information. If we receive an error object, we will also include its stack trace.
 * */
var err = new Error('Loren ipsum dolores');
err.code = 'SQL_ERROR';

loglet.send({
  name: 'api-instance-1',
  namespace: 'sql',
  level: 'trace',
  message: 'Hello world',
  error: err,
  tags: ['store', 'liberty'],
  data: {
    someData: 'associated',
    withThe: 'log item'
  }
}, (err, ack) => {
  if (err) {
    console.error(err);
  } else {
    console.log(ack);
  }
});

// Send a log item with no callback
loglet.send({
  name: 'api-instance-1',
  message: 'John doe has arrived'
});