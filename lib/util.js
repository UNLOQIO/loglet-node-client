'use strict';
var crypto = require('crypto');
/*
 * Utility functions
 * */
var utils = {};
var ALPHA_NUMERIC_CHARS = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890",
  RANDOM_STRING = '';
(function() {
  for (var i = 0; i <= 255; i++) {
    var r = Math.floor(Math.random() * ALPHA_NUMERIC_CHARS.length);
    RANDOM_STRING += ALPHA_NUMERIC_CHARS.charAt(r);
  }
})();

/*
 * Generate a cryptographically stable random string
 * */
utils.randomString = function(length) {
  if (typeof length !== 'number') length = 16; // random 16 by default.
  var gen = Math.abs(parseInt(length));
  try {
    var buf = crypto.randomBytes(gen);
  } catch (e) {
    console.warn('loglet.randomString: failed to generate crypto random buffer: ', e);
    return null;
  }
  var res = '';
  for (var i = 0; i < gen; i++) {
    var _poz = buf.readUInt8(i);
    res += RANDOM_STRING.charAt(_poz);
  }
  return res;
};

/*
 * Synchronously encrypts the given data with the given key, by default WITH NO INITIALIZATION VECTOR.
 * If the IV is specified and present, it will be used.
 * IF the IV is present, we hex encode it and prepend it to the ciphertext, followed by a $
 * Returns hex-encrypted text or false, if failed.
 * */
utils.encrypt = function encrypt(data, encryptionKey, _useIv) {
  try {
    let cipher,
      iv;
    if(_useIv === true) {
      iv = crypto.randomBytes(16);
    } else if(typeof _useIv === 'string') {
      try {
        iv = new Buffer(_useIv, 'hex');
      } catch(e) {}
    } else if(typeof _useIv === 'object') {
      iv = _useIv;
    }
    if (typeof iv !== 'undefined') {
      cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    } else {
      cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    }
    if (!(data instanceof Buffer) && typeof data !== 'string') {
      if (typeof data === 'object' && data != null) {
        data = JSON.stringify(data);
      } else {
        data = data.toString();
      }
    }
    var encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    if(typeof iv !== 'undefined') {
      encrypted = iv.toString('hex') + '$' + encrypted;
    }
    return encrypted;
  } catch (err) {
    console.warn('loglet.encrypt: Failed to synchronously encrypt data', err);
    return false;
  }
};


module.exports = utils;