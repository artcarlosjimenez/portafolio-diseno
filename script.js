  // hamburger menu (mobile)
  (function(){
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if(!toggle || !menu) return;

    var links = menu.querySelectorAll('a');

    function openMenu(){
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');
    }
    function closeMenu(){
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
    }

    toggle.addEventListener('click', function(){
      if(menu.classList.contains('open')){ closeMenu(); } else { openMenu(); }
    });

    links.forEach(function(link){
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeMenu();
    });

    // close automatically if the viewport is resized back to desktop
    window.addEventListener('resize', function(){
      if(window.innerWidth > 640) closeMenu();
    });
  })();

  // running timecode in the HUD, cosmetic — like a scrubbing playhead
  (function(){
    var el = document.getElementById('timecode');
    var start = Date.now();
    function pad(n){ return String(n).padStart(2,'0'); }
    function tick(){
      var elapsed = Date.now() - start;
      var totalSec = Math.floor(elapsed/1000);
      var h = Math.floor(totalSec/3600);
      var m = Math.floor((totalSec%3600)/60);
      var s = totalSec%60;
      var f = Math.floor((elapsed%1000)/1000*24); // pseudo-frames at 24fps
      el.textContent = pad(h)+':'+pad(m)+':'+pad(s)+':'+pad(f);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // scroll reveal
  (function(){
    var items = document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){
      items.forEach(function(i){ i.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.14 });
    items.forEach(function(i){ io.observe(i); });
  })();

  // animate layer bars once visible
  (function(){
    var bars = document.querySelectorAll('.layer-fill');
    if(!('IntersectionObserver' in window)){
      bars.forEach(function(b){ b.style.width = b.dataset.pct + '%'; });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var bar = entry.target;
          bar.style.width = bar.dataset.pct + '%';
          io.unobserve(bar);
        }
      });
    }, { threshold:0.3 });
    bars.forEach(function(b){ io.observe(b); });
  })();

  // contact form -> submits directly to Web3Forms, which forwards it to
  // the inbox tied to the access key below. Falls back to a prefilled
  // mailto + clipboard copy only if the request itself fails (e.g. offline
  // or the access key hasn't been set yet).
  (function(){
    var form = document.getElementById('contactForm');
    var status = document.getElementById('formStatus');
    var btn = form ? form.querySelector('button[type="submit"]') : null;
    if(!form) return;

    function fallbackCopy(text){
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try{ document.execCommand('copy'); }catch(err){}
      document.body.removeChild(ta);
    }

    function setStatus(text){
      status.textContent = text;
      status.classList.add('show');
    }

    function offlineFallback(name, email, message){
      var plainMessage = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message;
      var mailto = 'mailto:cjimenezsrdg@gmail.com'
        + '?subject=' + encodeURIComponent('Portfolio inquiry from ' + name)
        + '&body=' + encodeURIComponent(plainMessage);

      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(plainMessage).catch(function(){ fallbackCopy(plainMessage); });
      } else {
        fallbackCopy(plainMessage);
      }

      var link = document.createElement('a');
      link.href = mailto;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus('Could not reach the server — message copied and your email app is opening as a backup.');
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();

      if(form.access_key && form.access_key.value === 'YOUR_ACCESS_KEY_HERE'){
        setStatus('Form not activated yet — add your Web3Forms access key in index.html.');
        return;
      }

      if(btn) btn.disabled = true;
      setStatus('Sending…');

      var formData = new FormData(form);
      var payload = Object.fromEntries(formData);

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res){ return res.json().then(function(data){ return { ok: res.ok, data: data }; }); })
      .then(function(result){
        if(result.ok && result.data && result.data.success){
          setStatus('Message sent — thanks! I\u2019ll reply to ' + email + ' soon.');
          form.reset();
        } else {
          offlineFallback(name, email, message);
        }
      })
      .catch(function(){
        offlineFallback(name, email, message);
      })
      .finally(function(){
        if(btn) btn.disabled = false;
      });
    });
  })();
