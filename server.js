var express = require('express')
var https = require('https');
var path = require('path');
var fs = require('fs');

var PORT = 8888;

var app = express();

// serve static files from the "public" dir
app.use(express.static('public'));

// read in the config file
var config = JSON.parse(fs.readFileSync(path.resolve('./config.json'), 'utf-8'));

if ((!config.accessToken) || (config.accessToken === '')) {
    throw new Error("No 'accessToken' supplied in config.json!");
}

// gets the configured list of repositories
//
// Example: GET /repositories =>
//   [ "foo/bar", "hello/world"]
app.get('/repositories', function(req, res) {
    res.status(200).json(config.repositories);
});

// Retrieves open pull request data from the github API and proxy the github response back to
// the caller.
//
// Example: GET /prs/HBOCodeLabs/Hurley-Bespin =>
//    [
//      { url: "...", id: "...", ...},
//      ...
//    ]
app.get('/prs/:owner/:repo', function(req, res) {

    var repository = [req.params.owner, req.params.repo].join('/');

    var opts = {
        host: 'api.github.com',
        method: 'GET',
        path: '/repos/' + repository + '/pulls',
        headers: {
            'Authorization': 'token ' +  config.accessToken,
            'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
            'Accept': 'application/vnd.github.v3+json'
        }
    }

    function cb(response) {
        var str = '';

        response.on('data', function(chunk) { str += chunk; });

        response.on('error', function(e) {
            res.sendStatus(500);
        });
        response.on('end', function() {
            try {
                // parse the data, then turn around and
                // send it back in the response
                res.status(200).json(JSON.parse(str));
            } catch(e) {
                console.sendStatus(500);
            }
        });
    }

    https.request(opts, cb).end();
});

app.listen(PORT, function() {
    console.log('pradiator server started at http://localhost:' + PORT + '/');
});

