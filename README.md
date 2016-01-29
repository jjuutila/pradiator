# pradiator
Shows open pull requests from multiple Github repositories.

# Configuration
First create a Github access token for this application at
https://github.com/settings/tokens/new. Check `repo` scope if you want to
access private repositories' pull requests.  Then create a new JSON file to
`./config.json` and fill in the access token and repositories you want
to see pull requests from.

Example config file:
```
{
  "accessToken": "YOUR_ACCESS_TOKEN_HERE",
  "repositories": ["jjuutila/pradiator"]
}
```

# Running
`$ node server.js`
