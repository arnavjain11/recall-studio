
(function(){
 function show(error){var app=document.getElementById('app');if(!app)return;
 var msg=String((error&&error.message)||error||'Unknown problem');
 if(app.querySelector('.loading-app')||!app.innerHTML.trim()){
 app.innerHTML='<main style="margin:40px auto;max-width:540px;padding:24px;font:16px system-ui;color:#18213b"><h1>Recall Studio could not start</h1><p>Please reopen the app file. If it still fails, keep your previous version and JSON backup, then share the error for troubleshooting.</p><pre id="recall-error" style="white-space:pre-wrap;overflow-wrap:anywhere;background:#eef0fb;padding:16px;border-radius:12px"></pre><button onclick="location.reload()" style="padding:12px;border-radius:8px">Reload</button></main>';
 document.getElementById('recall-error').textContent=msg;
 }
 }
 window.addEventListener('error',function(e){show(e.error||e.message)});
 window.addEventListener('unhandledrejection',function(e){show(e.reason)});
 setTimeout(function(){var app=document.getElementById('app');if(app&&app.querySelector('.loading-app'))show('Startup timed out. Browser storage may be blocked or the app files may be mismatched.');},12000);
})();
