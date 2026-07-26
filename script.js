(function(){
  "use strict";

  /* ---------- guest name from ?to= ---------- */
  var params = new URLSearchParams(window.location.search);
  var to = params.get('to');
  if(to){ document.getElementById('guestName').textContent = decodeURIComponent(to); }

  /* ---------- loader ---------- */
  document.documentElement.classList.add('pre-open');
  window.addEventListener('load', function(){
    setTimeout(function(){
      document.getElementById('loader').classList.add('hide');
    }, 900);
  });

  /* ---------- open invitation ---------- */
  var openBtn = document.getElementById('openBtn');
  var music = document.getElementById('bgMusic');
  var iconPlay = document.getElementById('iconPlay');
  var iconPause = document.getElementById('iconPause');

  openBtn.addEventListener('click', function(){
    document.documentElement.classList.remove('pre-open');
    document.documentElement.classList.add('opened');
    music.play().then(function(){
      iconPlay.style.display='none'; iconPause.style.display='block';
    }).catch(function(){ /* file musik belum tersedia — abaikan */ });
  });

  document.getElementById('music-toggle').addEventListener('click', function(){
    if(music.paused){
      music.play().then(function(){ iconPlay.style.display='none'; iconPause.style.display='block'; }).catch(function(){});
    } else {
      music.pause(); iconPlay.style.display='block'; iconPause.style.display='none';
    }
  });

  /* ---------- scroll progress indicator ---------- */
  var progressBar = document.getElementById('scroll-progress-bar');
  function updateProgress(){
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if(progressBar) progressBar.style.height = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  /* ---------- subtle parallax on hero images ---------- */
  var coverBg = document.querySelector('.cover-bg');
  var heroStrip = document.querySelector('.hero-repeat video');
  function updateParallax(){
    var y = window.scrollY || document.documentElement.scrollTop;
    if(coverBg) coverBg.style.transform = 'scale(1.08) translateY(' + (y * 0.15) + 'px)';
    if(heroStrip){
      var rect = heroStrip.parentElement.getBoundingClientRect();
      var offset = rect.top * 0.12;
      heroStrip.style.transform = 'translateY(' + offset + 'px) scale(1.1)';
    }
  }
  window.addEventListener('scroll', updateParallax, {passive:true});
  updateParallax();

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, {threshold:.18});
  revealEls.forEach(function(el){ io.observe(el); });

  /* ---------- countdown ---------- */
  var target = new Date('2026-08-30T08:00:00+07:00').getTime();
  var cdStatus = document.getElementById('cd-status');
  var eventDurationMs = 6*60*60*1000; // asumsi durasi acara ~6 jam untuk status "selesai"

  function pad(n){ return String(n).padStart(2,'0'); }

  function tickCountdown(){
    var now = Date.now();
    var diff = target - now;

    if(diff <= 0 && diff > -eventDurationMs){
      document.getElementById('cd-days').textContent='00';
      document.getElementById('cd-hours').textContent='00';
      document.getElementById('cd-mins').textContent='00';
      document.getElementById('cd-secs').textContent='00';
      cdStatus.textContent = 'Today is the Day.';
      return;
    }
    if(diff <= -eventDurationMs){
      document.getElementById('cd-days').textContent='00';
      document.getElementById('cd-hours').textContent='00';
      document.getElementById('cd-mins').textContent='00';
      document.getElementById('cd-secs').textContent='00';
      cdStatus.textContent = 'Thank you for celebrating with us.';
      return;
    }

    var d = Math.floor(diff/(1000*60*60*24));
    var h = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
    var m = Math.floor((diff%(1000*60*60))/(1000*60));
    var s = Math.floor((diff%(1000*60))/1000);

    document.getElementById('cd-days').textContent = pad(d);
    document.getElementById('cd-hours').textContent = pad(h);
    document.getElementById('cd-mins').textContent = pad(m);
    document.getElementById('cd-secs').textContent = pad(s);
    cdStatus.textContent = '';
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- copy account number ---------- */
  document.querySelectorAll('.btn-copy').forEach(function(btn){
    btn.addEventListener('click', function(){
      var val = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(val).then(function(){
        var original = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        showToast('Nomor rekening disalin');
        setTimeout(function(){ btn.textContent = original; btn.classList.remove('copied'); }, 1800);
      }).catch(function(){
        showToast('Gagal menyalin, salin manual: '+val);
      });
    });
  });

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function showToast(msg){
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------- RSVP — terhubung ke Formspree ---------- */
  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnjeoekd';
  var wishes = [];
  var form = document.getElementById('rsvpForm');
  var thanks = document.getElementById('rsvpThanks');
  var list = document.getElementById('wishesList');
  var submitBtn = form.querySelector('.btn-solid');

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('rName').value.trim();
    var attend = document.getElementById('rAttend').value;
    var msg = document.getElementById('rMsg').value.trim();
    if(!name || !attend || !msg) return;

    var originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function(res){
      if(res.ok){
        wishes.unshift({name:name, attend:attend, msg:msg});
        renderWishes();
        form.reset();
        form.style.display = 'none';
        thanks.classList.add('show');
        showToast('Ucapan terkirim');
      } else {
        showToast('Gagal mengirim, coba lagi ya');
      }
    }).catch(function(){
      showToast('Gagal mengirim, cek koneksi internet');
    }).finally(function(){
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    });
  });

  function renderWishes(){
    list.innerHTML = '';
    wishes.forEach(function(w){
      var item = document.createElement('div');
      item.className = 'wish-item';
      item.innerHTML = '<div class="wish-name">'+escapeHtml(w.name)+' &middot; '+escapeHtml(w.attend)+'</div><div class="wish-msg">'+escapeHtml(w.msg)+'</div>';
      list.appendChild(item);
    });
  }
  function escapeHtml(str){
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

})();