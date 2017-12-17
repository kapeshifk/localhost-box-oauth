# Box.com OAuth 2.0 and Box Content Explorer UI Element
Basic local HTTP and HTTPS Server on NodeJS using Express.js and Restify for Box.com OAuth 2.0 and Box Content Explorer UI Element.
The idea is to let the user log in, grant access and display box.com folder items in box ui.

There is a self-signed SSL certificate included with default `password`

Generate a new one if needed with `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days XXX`

Logs are generated to the console for all requests using node-bunyan

## Install
npm install

## Config
Set Box OAuth credentials, server ports (http, https), SSL certificate and default folder information in config.js

## Run
node server.js
Navigate to http://localhost:8080/ or https://localhost/ to check server status
Navigate to http://localhost:8080/start or https://localhost/start to initiate box.com login
