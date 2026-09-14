(function () {
  var formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  document.querySelectorAll('[data-current-date]').forEach(function (element) {
    element.textContent = formatter.format(new Date());
  });
})();
