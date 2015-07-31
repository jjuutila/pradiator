var static = require('node-static');
var http = require('http');

var PORT = 8080;
var fileServer = new static.Server('./public');

http.createServer(function (request, response) {
  request.addListener('end', function () {
    fileServer.serve(request, response);
  }).resume();
}).listen(PORT);

console.log('pradiator server started at http://localhost:' + PORT + '/');
