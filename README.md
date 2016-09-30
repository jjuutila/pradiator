# pradiator
Shows open pull requests from multiple Github repositories.

# Configuration
First create a Github access token for this application at
https://github.com/settings/tokens/new. Check `repo` scope if you want to
access private repositories' pull requests.  Then create a new JSON file to
`./config.json` and fill in the access token and repositories you want
to see pull requests from. You can also add port to the config.json if you 
want to use a different port locally, this is optional though.

Example config file:
```
{
  "accessToken": "YOUR_ACCESS_TOKEN_HERE",
  "repositories": ["jjuutila/pradiator"],
  "port": 8787		// This is optional. Use this if you want a different port.
}
```

# Running
`$ npm start`
