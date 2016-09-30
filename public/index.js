var createPullRequestListHtml = R.pipe(R.sort(compareDate), R.map(pullRequestsToHtml));

var apiResponses = Bacon.combineAsArray(getPullRequests(), getDomReadyStream())
  .map(R.prop(0));

apiResponses.onValue(showResults);
apiResponses.onError(showError);

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

function showResults(results) {
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

function getPullRequests() {
    return Bacon.fromPromise($.ajax({
        url: '/prs/',
        type: 'GET',
        dataType: 'json',
        timeout: 10000
    }));
}
