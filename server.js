#!/usr/bin/env node

//server libs
var express = require('express');
var fs = require('fs');
//box config
const appConfig = require('./config.js');
const boxSDK = appConfig.boxSDK;
const bodyParser = require('body-parser'); //allow JSON and URL encoded HTTP responses
const querystring = require('querystring'); //querystring stringifier
const TokenStore = require('./token-store.js'); //token storage 

//init server
var server = express();
//init box basic client
var box;

//create a new Box SDK instance
const sdk = new boxSDK({
   clientID: appConfig.oauthClientId,
   clientSecret: appConfig.oauthClientSecret
});

//create logger and http server
var Logger = require('bunyan'),
   restify = require('restify'),
   log = new Logger.createLogger({
      name: 'Http Logs',
      serializers: {
         req: Logger.stdSerializers.req
      }
   }),
   server = restify.createServer({
      name: 'HTTP Server',
      version: '1.0.0',
      log: log
   });

//set SSL options
var https_options = {
   name: 'HTTPS Server',
   log: log,
   key: fs.readFileSync(appConfig.key),
   cert: fs.readFileSync(appConfig.cert),
   passphrase: appConfig.passphrase
};

//create https server
var https_server = restify.createServer(https_options);

//set log of requests on both servers
server.pre(function(request, response, next) {
   request.log.info({
      req: request
   }, 'REQUEST');
   next();
});

https_server.pre(function(request, response, next) {
   request.log.info({
      req: request
   }, 'REQUEST');
   next();
});

//setup server endpoints
var setup_server = function(app) {
   //set parsers
   app.use(restify.plugins.queryParser());
   app.use(bodyParser.json());
   app.use(bodyParser.urlencoded({
      extended: true
   }));

   //login endpoint
   app.get('/start', function(req, res, next) {
      // Build Box auth object
      const payload = {
         'response_type': 'code',
         'client_id': appConfig.oauthClientId,
         'redirect_uri': appConfig.redirectURL
      };

      // Build redirect URI and redirect
      const qs = querystring.stringify(payload);
      const authEndpoint = appConfig.oauthEndpoint + `${qs}`;
      res.redirect(authEndpoint, next);
   });

   //folder list endpoint
   app.get('/folder_items', function(req, res, next) {

      if (!box) {
         res.redirect('/', next);
      }

      //print to log sample folders, not really required
      box.folders.getItems(appConfig.folderId, {
         fields: 'name',
         limit: 10
      }, function(err, data) {
         if (data == null || data.entries == null) return '';
         var items = [];

         data.entries.forEach(function(item, index) {
            if (item.type === 'folder') item.type = 'folders'; // required for the common ground
            items.push(item.name);
         });
         console.log('----SAMPLE FOLDERS LIST BEGIN----');
         console.log(items);
         console.log('----SAMPLE FOLDERS LIST END----');
         //create box-ui form to be displayed
         displayFolders(res);
      });
   });

   //box-ui elements html page
   function displayFolders(res) {
      fs.readFile('box-ui.html', function(err, data) {
         res.writeHead(200, {
            'Content-Type': 'text/html'
         });
         res.write(data);
         res.end();
      });
   }

   //redirect endpoint URL
   app.get('/return', function(req, res, next) {
      // extract auth code
      const code = req.query.code;

      //exchange auth code for an access token
      sdk.getTokensAuthorizationCodeGrant(code, null, function(err, tokenInfo) {
         if (err) {
            console.error(err);
         }

         //create new token store instance, and write to it, not required but good to test token storage
         var tokenStore = new TokenStore();
         tokenStore.write(tokenInfo, function(storeErr) {
            if (err) {
               console.error(err);
            }

            //create new persistent client with token storage
            var client = sdk.getPersistentClient(tokenInfo, tokenStore);

            //get current user information and display
            client.users.get(client.CURRENT_USER_ID, null, function(err, currentUser) {
               if (err) throw err;
               console.log('Logged user: ' + currentUser.name);
            });
         });

         //initialize box basic client to be used folder_items
         box = sdk.getBasicClient(tokenInfo.accessToken);

         //redirect user to list of folders
         res.redirect('/folder_items?folderId=' + appConfig.folderId + '&accessToken=' + tokenInfo.accessToken, next);
      });
   });

   // root endpoint
   function rootResponse(req, res, next) {
      //res.send('Server App is listening!');
      var body = '<html><body>Box local server is listening!</body></html>';
      res.writeHead(200, {
         'Content-Length': Buffer.byteLength(body),
         'Content-Type': 'text/html'
      });
      res.write(body);
      res.end();
      console.log('URL ' + req.url);
      next();
   }

   //root endpoint
   app.get('/', rootResponse);

   //static assets
   app.get(/\/public\/?.*/, restify.plugins.serveStatic({
      directory: __dirname
   }));
}

//register get on both servers
setup_server(server);
setup_server(https_server);

//start http server
server.listen(appConfig.httpPort, function() {
   console.log('%s listening at %s', server.name, server.url);
});

//start https server
https_server.listen(appConfig.httpsPort, function() {
   console.log('%s listening at %s', https_server.name, https_server.url);
});