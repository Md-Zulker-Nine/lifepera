(function(){
  if(localStorage.getItem('cookiesAccepted'))return;
  var css=document.createElement('style');
  css.textContent='.cookie-bar{position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#d1d5db;padding:1rem 1.5rem;z-index:9999;border-top:1px solid #374151;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}.cookie-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}.cookie-inner p{font-size:.85rem;line-height:1.5;margin:0}.cookie-btn{background:#1a73e8;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:600;cursor:pointer;font-size:.88rem;white-space:nowrap}.cookie-btn:hover{background:#1557b0}';
  document.head.appendChild(css);
  var bar=document.createElement('div');
  bar.className='cookie-bar';
  bar.id='cookieBar';
  bar.innerHTML='<div class="cookie-inner"><p>Cookie uses cookies to improve your experience and serve personalized ads. By continuing, you agree to our <a href="/privacy.html" style="color:#8ab4f8">Privacy Policy</a>.</p><button class="cookie-btn" onclick="window._acceptCookies()">Accept All</button></div>';
  document.body.appendChild(bar);
  window._acceptCookies=function(){bar.style.display='none';localStorage.setItem('cookiesAccepted','true')};
})();
