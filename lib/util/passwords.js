var crypto = require('crypto');

var SaltLength = 9, 
    prefix = '-hash-';

function createHash(password) {
  var salt = generateSalt(SaltLength);
  var hash = md5(password + salt);
  return prefix + salt + hash;
}

function validateHash(hash, password) {
  hash = hash.replace(prefix, '');
  var salt = hash.substr(0, SaltLength);
  var validHash = salt + md5(password + salt);
  return hash === validHash;
}

function generateSalt(len) {
  var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ',
      setLen = set.length,
      salt = '';
  for (var i = 0; i < len; i++) {
    var p = Math.floor(Math.random() * setLen);
    salt += set[p];
  }
  return salt;
}

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

module.exports = {
  'hash': createHash,
  'validate': validateHash
};