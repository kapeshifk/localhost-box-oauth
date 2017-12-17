const boxSDK = require('box-node-sdk');
exports.boxSDK = boxSDK;

// Server port
const httpPort = exports.httpPort = '8080';
const httpsPort = exports.httpsPort = '443';

// SSL Certificate
const key = exports.key = 'key.pem';
const cert = exports.cert = 'cert.pem';
const passphrase = exports.passphrase = 'password';

// Box App OAuth
const oauthClientId = exports.oauthClientId = 'ADD BOX CLIENT ID HERE';
const oauthClientSecret = exports.oauthClientSecret = 'ADD BOX CLIENT SECRET HERE';

// URLs
const redirectURL = exports.redirectURL = 'https://localhost:443/return';
const oauthEndpoint = exports.oauthEndpoint = 'https://account.box.com/api/oauth2/authorize?';

// Folder information
const folderId = exports.folderId = 'ADD BOX FOLDER ID HERE';
