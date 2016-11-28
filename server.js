var express = require('express');
const rp = require('request-promise');
const Promise = require('bluebird');

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
    const getPrsRequests = config.repositories.reduce(getPullRequestsFromGithub, {});
    Promise.props(getPrsRequests)
        .then((pullRequests) => res.status(200).json(pullRequests))
        .catch((err) => {
            console.error('Github API error', err);
            res.status(500).end();
        });
});

function getPullRequestsFromGithub(acc, repository) {
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

    acc[repository] = rp(options);
    return acc;
}

app.listen(port, function() {
    console.log('pradiator server started at http://localhost:' + port + '/');
});
