(function () {
  var ac = null;
  function ctx() {
    try { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = ac || new C(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; }
  }

  // Contact bell: ring + tilt
  var bell = document.querySelector('button.bell[aria-label="Ring the bell"]');
  if (bell) bell.addEventListener('click', function () {
    var a = ctx();
    if (a) { var t = a.currentTime;
      [[2093, 1, 1.8], [4186, 0.35, 0.9], [3136, 0.25, 1.2], [6272, 0.08, 0.4]].forEach(function (x) {
        var o = a.createOscillator(), v = a.createGain(); o.type = 'sine'; o.frequency.value = x[0];
        v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(x[1] * 0.22, t + 0.004); v.gain.exponentialRampToValueAtTime(0.0001, t + x[2]);
        o.connect(v); v.connect(a.destination); o.start(t); o.stop(t + x[2] + 0.05); });
    }
    bell.style.transform = 'rotate(-5deg) translateY(2px)';
    setTimeout(function () { bell.style.transform = 'none'; }, 140);
  });

  // Homepage vault: spin with sound, then open the Archive
  var vault = document.querySelector('#archive button.bell');
  if (vault) vault.addEventListener('click', function (ev) {
    ev.preventDefault();
    if (vault.dataset.busy) return; vault.dataset.busy = '1';
    var wheel = vault.querySelector('span img:last-child');
    if (!wheel) { location.href = '/archive/'; return; }
    wheel.style.animation = 'none'; void wheel.offsetWidth;
    wheel.style.animation = 'vaultSpinA 1.8s cubic-bezier(0.45, 0, 0.3, 1) both';
    try {
    var a = ctx();
      if (a) { var t = a.currentTime, out = a.createGain(); out.gain.value = 0.9; out.connect(a.destination);
        var b = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        var burst = function (at, dur, type, freq, q, vol) { var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
          var g = a.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
          s.connect(f); f.connect(g); g.connect(out); s.start(at, Math.random()); s.stop(at + dur + 0.02); };
        burst(t + 0.05, 1.55, 'lowpass', 160, 0.7, 0.35);
        [0.32, 0.42, 0.51, 0.59, 0.66, 0.73, 0.8, 0.87, 0.94, 1.01, 1.09, 1.18, 1.28, 1.4].forEach(function (c) { burst(t + c, 0.035, 'bandpass', 1800 + Math.random() * 600, 4, 0.22); });
        var at = t + 1.52, o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(85, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.25);
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.7, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45); o.connect(g); g.connect(out); o.start(at); o.stop(at + 0.5);
        burst(at, 0.08, 'lowpass', 900, 0.8, 0.45);
      }
    } catch (e) {}
    setTimeout(function () { location.href = '/archive/'; }, 1900);
  });

  // Storyboard lightbox
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('button.sb'));
  if (thumbs.length) {
    var srcs = thumbs.map(function (b) { var i = b.querySelector('img'); return i.getAttribute('data-full') || i.getAttribute('src'); });
    var cur = -1, opener = null, box = null, big = null;
    var btn = 'all:unset;position:absolute;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    function build() {
      box = document.createElement('div');
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Storyboard viewer'); box.tabIndex = -1;
      box.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.94);outline:none;';
      box.innerHTML = '<div style="position:absolute;top:56px;bottom:56px;left:76px;right:76px;pointer-events:none;"><img alt="Storyboard frame from The Strip, enlarged" style="display:block;width:100%;height:100%;object-fit:contain;"></div>' +
        '<button type="button" class="lbb" aria-label="Close" data-a="close" style="' + btn + 'top:8px;right:12px;"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 3 L19 19 M19 3 L3 19" stroke="#fff" stroke-width="2" fill="none"/></svg></button>' +
        '<button type="button" class="lbb" aria-label="Previous storyboard frame" data-a="prev" style="' + btn + 'left:16px;top:50%;margin-top:-22px;"><svg width="16" height="28" viewBox="0 0 16 28" aria-hidden="true"><path d="M14 2 L2 14 L14 26" stroke="#fff" stroke-width="2" fill="none"/></svg></button>' +
        '<button type="button" class="lbb" aria-label="Next storyboard frame" data-a="next" style="' + btn + 'right:16px;top:50%;margin-top:-22px;"><svg width="16" height="28" viewBox="0 0 16 28" aria-hidden="true"><path d="M2 2 L14 14 L2 26" stroke="#fff" stroke-width="2" fill="none"/></svg></button>';
      big = box.querySelector('img');
      box.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('[data-a]');
        if (a) { var k = a.getAttribute('data-a'); if (k === 'close') close(); else show(cur + (k === 'next' ? 1 : -1)); }
        else if (e.target === box) close();
      });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
      });
    }
    function show(i) { var n = srcs.length; cur = (i + n) % n; big.src = srcs[cur]; }
    function close() { if (box && box.parentNode) box.parentNode.removeChild(box); document.body.style.overflow = ''; cur = -1; if (opener) opener.focus(); }
    thumbs.forEach(function (b, i) { b.addEventListener('click', function () {
      if (!box) build(); opener = b; show(i); document.body.appendChild(box); document.body.style.overflow = 'hidden'; box.focus(); }); });
  }

  // Jacques "More episodes": pull each episode's Vimeo thumbnail
  document.querySelectorAll('img[data-vimeo-thumb]').forEach(function (img) {
    var id = img.getAttribute('data-vimeo-thumb');
    fetch('https://vimeo.com/api/oembed.json?width=640&url=' + encodeURIComponent('https://vimeo.com/' + id))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.thumbnail_url) img.src = d.thumbnail_url; })
      .catch(function () {});
  });
})();
