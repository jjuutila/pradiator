var createResultHtml = R.pipe(R.flatten, R.sort(compareDate), R.map(pullRequestsToHtml));

var responseFeedbackBus = new Bacon.Bus();

var configProp = Bacon.combineAsArray(getConfig(), getDomReadyStream())
  .map(R.prop(0));

var initialApiResponses = configProp.flatMap(getPullRequestsForRepositories);
var pollRequestStarts = configProp.sampledBy(initialApiResponses.merge(responseFeedbackBus).debounce(30000));
var pollApiResponses = pollRequestStarts.flatMap(getPullRequestsForRepositories);

responseFeedbackBus.plug(pollApiResponses.flatMapError(alwaysTrue));

var apiResponses = initialApiResponses.merge(pollApiResponses);
apiResponses.onValue(showResults);
apiResponses.onError(showError);

pollRequestStarts.onValue(setSpinning, true);

function compareDate(a, b) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function pullRequestsToHtml(pr) {
  return $('<div>', {class: 'pull-request'})
    .append($('<span>', {class: 'repository', text: pr.repository}))
    .append($('<span>', {class: 'pr-title', text: pr.title}))
    .append($('<div>', {class: 'meta', text: getMetaText(pr)}));
}

function getMetaText(pr) {
  return '#' + pr.number + ' opened ' + moment(pr.created_at).fromNow() + ' by ' + pr.user.login;
}

function alwaysTrue() {
  return true;
}

function setSpinning(isSpinning) {
  if (isSpinning) {
    $('.github-logo').addClass('spinning');
  } else {
    $('.github-logo').removeClass('spinning');
  }
}

function showResults(results) {
  var html = createResultHtml(results);
  $('#result-container').html(html);
  setSpinning(false);
}

function showError(error) {
  setSpinning(false);
  console.log('ERROR', error);
}

function getDomReadyStream() {
  return Bacon.fromCallback(function(callback) {
    $(document).ready(callback);
  });
}

function getConfig() {
    return Bacon.fromPromise($.ajax({
      url: 'config.json',
      type: 'GET',
      dataType: 'json'
    }));
}

function getPullRequestsForRepositories(config) {
  return Bacon.combineAsArray(config.repositories.map(R.partial(toRequestStream, config.accessToken)))
    .toEventStream();
}

function toRequestStream(accessToken, repository) {
  return Bacon.fromPromise(getPullRequest(accessToken, repository))
    .map(R.map(R.merge({repository: repository})));
}

function getPullRequest(accessToken, repository) {
    return $.ajax({
      url: 'https://api.github.com/repos/' + repository + '/pulls',
      type: 'GET',
      headers: {
        Authorization: 'token ' + accessToken
      },
      dataType: 'json',
      timeout: 10000
    });
}
