(function () {
  var consentKey = 'lifeperaConsent';
  var analyticsId = 'G-SBT0X71YW2';
  var storedConsent = localStorage.getItem(consentKey);
  var pageRoot = document.body || document.documentElement;

  var css = document.createElement('style');
  css.textContent = '.cookie-bar{position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#d1d5db;padding:1rem 1.5rem;z-index:9999;border-top:1px solid #374151;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}.cookie-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.cookie-inner p{font-size:.85rem;line-height:1.5;margin:0}.cookie-actions{display:flex;gap:.75rem;flex-wrap:wrap}.cookie-btn{background:#1a73e8;color:#fff;border:none;padding:10px 18px;border-radius:6px;font-weight:600;cursor:pointer;font-size:.82rem;white-space:nowrap}.cookie-btn.secondary{background:transparent;border:1px solid #4b5563;color:#d1d5db}.cookie-btn:hover{background:#1557b0}.cookie-btn.secondary:hover{background:#374151}.cookie-privacy{color:#8ab4f8;text-decoration:none}.privacy-settings{position:fixed;bottom:1rem;left:1rem;background:#1f2937;color:#d1d5db;border:1px solid #4b5563;border-radius:6px;padding:8px 12px;font:600 .78rem system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;z-index:9998}.privacy-settings:hover{background:#374151}';
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.className = 'cookie-bar';
  bar.id = 'cookieBar';
  bar.innerHTML = '<div class="cookie-inner"><p>LifePera uses essential cookies to keep the site working. We may use analytics or advertising cookies only with your consent. Review details in our <a class="cookie-privacy" href="/privacy.html">Privacy Policy</a>.</p><div class="cookie-actions"><button class="cookie-btn secondary" type="button" data-consent="essential">Only essential</button><button class="cookie-btn secondary" type="button" data-consent="reject">Reject optional</button><button class="cookie-btn" type="button" data-consent="all">Accept all</button></div></div>';
  pageRoot.appendChild(bar);

  var settings = document.createElement('button');
  settings.className = 'privacy-settings';
  settings.type = 'button';
  settings.textContent = 'Privacy settings';
  settings.setAttribute('aria-label', 'Change privacy and analytics consent');
  pageRoot.appendChild(settings);

  function removeAnalyticsCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (/^(_ga|_gid|_gat|AMP_)/.test(name)) {
        document.cookie = name + '=; Max-Age=0; path=/';
      }
    });
  }

  function loadAnalytics() {
    if (document.querySelector('script[data-lifepera-analytics]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', analyticsId);
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + analyticsId;
    script.setAttribute('data-lifepera-analytics', 'true');
    document.head.appendChild(script);
  }

  function showSettings() {
    bar.style.display = 'block';
    settings.style.display = 'none';
  }

  window._lifeperaConsentChoice = function (choice) {
    var normalized = choice === 'all' ? 'all' : (choice === 'essential' ? 'essential' : 'reject');
    localStorage.setItem(consentKey, normalized);
    if (normalized === 'all') {
      loadAnalytics();
    } else {
      removeAnalyticsCookies();
    }
    bar.style.display = 'none';
    settings.style.display = 'block';
  };

  bar.querySelectorAll('[data-consent]').forEach(function (button) {
    button.addEventListener('click', function () {
      window._lifeperaConsentChoice(button.getAttribute('data-consent'));
    });
  });
  settings.addEventListener('click', showSettings);

  if (storedConsent === 'all') {
    loadAnalytics();
    bar.style.display = 'none';
  } else if (storedConsent) {
    bar.style.display = 'none';
  } else {
    settings.style.display = 'none';
  }
})();
