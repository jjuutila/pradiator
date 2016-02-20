var createPullRequestListHtml = R.pipe(R.filter(isOpen), R.sort(compareDate), R.map(pullRequestsToHtml));

var configProp = Bacon.combineAsArray(getRepositoryList(), getDomReadyStream())
  .map(R.prop(0));

var apiResponses = configProp.flatMap(getPullRequestsForRepositories);

apiResponses.onValue(showResults);
apiResponses.onError(showError);

function isOpen(pr) {
  return pr.state === 'open';
}

function mergedOnly(pr) {
  return pr.state === 'closed' && pr.merged_at;
}

function compareDate(a, b) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function pullRequestsToHtml(pr) {
  return $('<div>', {class: 'pull-request'})
    .append($('<span>', {class: 'repository', text: pr.repository}))
    .append($('<a>', {class: 'pr-title', href: pr.html_url, target: '_blank', text: pr.title}))
    .append($('<div>', {class: 'meta', text: getMetaText(pr)}));
}

function getMetaText(pr) {
  return '#' + pr.number + ' opened ' + moment(pr.created_at).fromNow() + ' by ' + pr.user.login;
}

function setSpinning(isSpinning) {
  if (isSpinning) {
    $('.github-logo').addClass('spinning');
  } else {
    $('.github-logo').removeClass('spinning');
  }
}

function prDuration(pr) {
  var res = new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime();
  return res;
}

var getPrMergeDurations = R.pipe(R.filter(mergedOnly), R.map(prDuration));

function calculateAverageDuration(durations) {
  return R.sum(durations) / durations.length;
}

function averageDurationToHtml(averageDurationInMs) {
  var text = 'Average time took to merge a pull request: ' +
    Math.floor(moment.duration(averageDurationInMs).as('hours')) +
    ' hours';

  return $('<div>').text(text);
}

function showResults(results) {
  var durations = getPrMergeDurations(results);
  var statisticsHtml = averageDurationToHtml(calculateAverageDuration(durations));
  $('#statistics').html(statisticsHtml);

  var pullRequestHtml = createPullRequestListHtml(results);
  $('#pull-requests').html(pullRequestHtml);

  setSpinning(false);
}

function showError(error) {
  setSpinning(false);
  console.log('ERROR', error);
}

function getDomReadyStream() {
  setSpinning(true);
  return Bacon.fromCallback(function(callback) {
    $(document).ready(callback);
  });
}

function getRepositoryList() {
    return Bacon.fromPromise($.ajax({
      url: 'repositories',
      type: 'GET',
      dataType: 'json'
    }));
}

function getPullRequestsForRepositories(repositories) {
  return Bacon.combineAsArray(repositories.map(toRequestStream))
    .map(R.flatten)
    .toEventStream();
}

function toRequestStream(repository) {
  return Bacon.fromPromise(getPullRequests(repository))
    .map(R.map(R.merge({repository: repository})));
}

function getPullRequests(repository) {
    return $.ajax({
      url: '/prs/' + repository,
      type: 'GET',
      dataType: 'json',
      timeout: 10000
    });
}
