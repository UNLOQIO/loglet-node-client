'use strict';
var KEY_SIZE = 32,
  SECRET_SIZE = 32;
var io = require('socket.io-client'),
  util = require('./util'),
  path = require('path'),
  CWD = process.cwd().replace(/\\/g, '/'),
  DISPATCH_EVENT = 'dispatch',
  ITEM_TYPE = {
    log: 'application.log'
  };
module.exports = function createServer(loglet, opt, done, emit) {
  var socket,
    shouldEncrypt = false,
    url = opt.url,
    key = opt.key,
    secret = opt.secret;
  delete opt.url;
  delete opt.key;
  delete opt.secret;
  if (!opt.extraHeaders) opt.extraHeaders = {};
  opt.extraHeaders.Authorization = 'Bearer ' + key;
  opt.reconnection = true;
  opt.reconnectionDelay = 500;
  opt.reconnectionAttempts = Infinity;
  opt.timeout = 15000;
  opt.autoConnect = true;
  var client = {
    connected: false
  };
  // If the key is the 34-char one and there is no secret, we do not allow sending.
  if (key.length === KEY_SIZE && (typeof secret !== 'string' || secret.length !== SECRET_SIZE)) {
    console.warn('loglet: When using the ' + KEY_SIZE + '-char key, the secret key is also required.');
    return done(new Error('API Secret is required'));
  }
  var tmpKey = key.substr(key.indexOf('$') + 1);
  if (tmpKey.length === KEY_SIZE && secret) {
    shouldEncrypt = true;
  }

  /* Send a log event */
  client.send = function sendItem(type, item, fn) {
    if (type === 'log') return sendLog(item, fn);
    console.warn('loglet: invalid send type: ' + type);
  };

  function sendLog(item, fn) {
    var data = {
      type: ITEM_TYPE.log,
      payload: item
    };
    // IF we have a secret, we have to encrypt some fields.
    // The fields we encrypt (if present) are: message, data, error
    if (item.error) {
      if (item.error instanceof Array) {
        var res = [];
        for (var i = 0; i < item.error.length; i++) {
          res.push(stringifyError(item.error[i]));
        }
      } else {
        item.error = stringifyError(item.error);
      }
    }
    if (shouldEncrypt) {
      encryptLogField(item, 'message');
      encryptLogField(item, 'data');
      encryptLogField(item, 'error');
    }
    if (typeof fn !== 'function') {
      socket.emit(DISPATCH_EVENT, data);
    } else {
      socket.emit(DISPATCH_EVENT, data, function (err, data) {
        if (err) {
          var e = new Error(err.message);
          e.code = err.code;
          e.status = err.status;
          return fn(e);
        }
        fn(null, data.result);
      });
    }
  }

  /*
  * Tries to stringify the given error and return a json-like object
  * When attaching the stacktrace, we will remove the process.cwd() path from the stack
  * */
  var STACK_ROOT_DIR_REGEX = new RegExp(CWD, "gim");

  function stringifyError(error) {
    if (!(error instanceof Error)) return error;
    var err = JSON.parse(JSON.stringify(error));
    var keys = Object.keys(error);
    if (error.message) {
      err.message = error.message;
    }
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      err[k] = error[k];
    }
    var stackTrace = error.stack;
    if (stackTrace) {
      try {
        stackTrace = stackTrace.replace(/\\/g, "/");
        stackTrace = stackTrace.replace(STACK_ROOT_DIR_REGEX, '');
        err.stacktrace = stackTrace;
      } catch (e) {
      }
    }
    return err;
  }

  /*
  * Encrypts the given field in the log entry
  * */
  function encryptLogField(logData, fieldName) {
    if (typeof logData[fieldName] === 'undefined' || !logData[fieldName]) return;
    if (typeof logData[fieldName] === 'object') {
      try {
        logData[fieldName] = JSON.stringify(logData[fieldName]);
      } catch (e) {
        console.warn('loglet: Could not stringify field ' + fieldName + ' of a log entity.');
        return;
      }
    } else if (typeof logData[fieldName] !== 'string') {
      logData[fieldName] = logData[fieldName].toString();
    }
    var enc = util.encrypt(logData[fieldName], secret, true);
    if (!enc) {
      console.warn('loglet: Could not encrypt field ' + fieldName + ' of a log entity.');
      return;
    }
    logData[fieldName] = enc;
  }


  var wasConnected = false;
  socket = io(url, opt);
  socket
    .on('connect', function () {
      client.connected = true;
      if (!wasConnected) {
        wasConnected = true;
        done();
      }
      emit('connect');
    })
    .on('reconnect', function () {
      client.connected = true;
      emit('connect');
    })
    .on('disconnect', function (e) {
      client.connected = false;
      if (!wasConnected) {
        wasConnected = true;
        var err;
        if (e == 'transport close') {  // invalid auth token
          err = new Error('Invalid authorization key');
        } else {
          err = new Error('Could not connect to server.');
        }
        socket.disconnect();
        return done(err);
      }
      emit('disconnect');
    })
    .on('error', function (e) {
      client.connected = false;
      emit('error', (typeof e === 'string' ? new Error(e) : e));
    });

  return client;
};