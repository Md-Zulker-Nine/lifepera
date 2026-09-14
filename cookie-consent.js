(function(){
  var consentKey='lifeperaConsent';
  var storedConsent=localStorage.getItem(consentKey);
  if(storedConsent){ return; }

  var css=document.createElement('style');
  css.textContent='.cookie-bar{position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#d1d5db;padding:1rem 1.5rem;z-index:9999;border-top:1px solid #374151;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}.cookie-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.cookie-inner p{font-size:.85rem;line-height:1.5;margin:0}.cookie-actions{display:flex;gap:.75rem;flex-wrap:wrap}.cookie-btn{background:#1a73e8;color:#fff;border:none;padding:10px 18px;border-radius:6px;font-weight:600;cursor:pointer;font-size:.82rem;white-space:nowrap}.cookie-btn.secondary{background:transparent;border:1px solid #4b5563;color:#d1d5db}.cookie-btn:hover{background:#1557b0}.cookie-btn.secondary:hover{background:#374151}.cookie-privacy{color:#8ab4f8;text-decoration:none}';
  document.head.appendChild(css);

  var bar=document.createElement('div');
  bar.className='cookie-bar';
  bar.id='cookieBar';
  bar.innerHTML='<div class="cookie-inner"><p>LifePera uses essential cookies to keep the site working. We may use analytics or advertising cookies only with your consent. Review details in our <a class="cookie-privacy" href="/privacy.html">Privacy Policy</a>.</p><div class="cookie-actions"><button class="cookie-btn secondary" onclick="window._lifeperaConsentChoice(\'essential\')">Only essential</button><button class="cookie-btn secondary" onclick="window._lifeperaConsentChoice(\'reject\')">Reject optional</button><button class="cookie-btn" onclick="window._lifeperaConsentChoice(\'all\')">Accept all</button></div></div>';
  document.body.appendChild(bar);

  window._lifeperaConsentChoice=function(choice){
    var normalized=choice==='all'?'all':(choice==='essential'?'essential':'reject');
    localStorage.setItem(consentKey, normalized);
    bar.style.display='none';
  };
})();
