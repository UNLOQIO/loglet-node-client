'use strict';
var createConnection = require('./connection');
const DEFAULT_OPTIONS = {
  url: 'https://stream.loglet.io', // stream.loglet.io
  path: '/ws',
  timeout: 5000
};
var clientObj = null,
  EVENTS = {},
  PENDING_QUEUE = [];   // an array of pending items that are to be sent once connected.
/**
 * This is the loglet interface.
 * Possible events:
 *    connect -> fired when we're connected
 *    disconnect -> fired when we've disconnected
 *    error -> fired when we encountered an error.
 */
function loglet(opt, _done) {
  var done = (typeof _done === 'function' ? _done : noop);
  if (typeof opt !== 'object' || !opt) {
    console.warn('loglet: missing options. Usage: loglet({key, secret})');
    return done(new Error('Invalid loglet.io configuration'));
  }
  if(typeof opt.key !== 'string') {
    console.warn('loglet: missing key. Usage: loglet({key, secret})');
    return done(new Error('Invalid loglet.io configuration'));
  }
  if (clientObj) {
    console.warn('loglet: already initialized.');
    return done();
  }
  opt = Object.assign({}, opt, DEFAULT_OPTIONS);
  clientObj = createConnection(this, opt, done, emit);
  loglet.on('connect', flushEvents);
  return loglet;
}

/* Send a log event to the server to be processed */
loglet.send = function sendLog(logItem, fn) {
  if (typeof logItem !== 'object' || !logItem) {
    console.warn('loglet: send() requires the log to be an object.');
    return loglet;
  }
  if (!clientObj || !clientObj.connected) {
    PENDING_QUEUE.push({
      item: logItem,
      fn: fn
    });
    return this;
  }
  if (typeof fn !== 'function') fn = undefined;
  clientObj.send('log', logItem, fn);
  return loglet;
};

/*
 * Event listeners
 * */
loglet.on = function on(event, fn) {
  if (typeof event === 'string' && typeof fn === 'function') {
    if (typeof EVENTS[event] === 'undefined') EVENTS[event] = [];
    EVENTS[event].push(fn);
  }
  return this;
};
loglet.off = loglet.removeListener = function off(event, fn) {
  if (typeof event !== 'string' || typeof EVENTS[event] === 'undefined') return this;
  if (typeof fn === 'undefined') {
    delete EVENTS[event];
  } else {
    for (var i = 0; i < EVENTS[event].length; i++) {
      if (EVENTS[event][i] === fn) {
        EVENTS[event].splice(i, 1);
        if (EVENTS[event].length === 0) {
          delete EVENTS[event];
        }
        break;
      }
    }
  }
  return this;
};
loglet.removeAllListeners = function(event) {
  return this.off(event);
};

/* Private function for event flushing */
function flushEvents() {
  var tmp = PENDING_QUEUE;
  PENDING_QUEUE = [];
  for (var i = 0; i < tmp.length; i++) {
    clientObj.send('log', tmp[i].item, tmp[i].fn);
  }
}

/* Private function for event emitting */
function emit(event) {
  if (typeof EVENTS[event] === 'undefined') return;
  var args = Array.prototype.slice.call(arguments);
  args.splice(0, 1);
  for (var i = 0; i < EVENTS[event].length; i++) {
    EVENTS[event][i].apply(loglet, args);
  }
}

function noop() {
}
module.exports = loglet;