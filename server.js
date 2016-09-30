var express = require('express');
const rp = require('request-promise');
const Promise = require('bluebird');
const R = require('ramda');

var DEFAULT_PORT = 8787;

var app = express();

// serve static files from the "public" dir
app.use(express.static('public'));

// read in the config file
var config = require('./config.json');

if ((!config.accessToken) || (config.accessToken === '')) {
    throw new Error('No "accessToken" supplied in config.json!');
}

var port = config.port || DEFAULT_PORT;

app.get('/prs', function getPrs(req, res) {
    const getPrsRequests = config.repositories.map(getPullRequestsFromGithub);
    Promise.all(getPrsRequests)
        .then((pullRequests) => res.status(200).json(R.flatten(pullRequests)))
        .catch((err) => {
            console.error('Github API error', err.statusCode, err.error);
            res.status(500).end();
        });
});

function getPullRequestsFromGithub(repository) {
    const options = {
        method: 'GET',
        uri: `https://api.github.com/repos/${repository}/pulls`,
        headers: {
            'Authorization': 'token ' + config.accessToken,
            'User-Agent': 'PRadiator app', // https://developer.github.com/v3/#user-agent-required
            'Accept': 'application/vnd.github.v3+json'
        },
        json: true,
    };

    return rp(options);
}

app.listen(port, function() {
    console.log('pradiator server started at http://localhost:' + port + '/');
});
