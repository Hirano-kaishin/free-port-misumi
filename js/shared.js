(function(){
  document.body.classList.add('js-loaded');
  var hdr = document.querySelector('.site-header');
  if(hdr) window.addEventListener('scroll',function(){hdr.classList.toggle('scrolled',window.scrollY>40)});
  var obs = new IntersectionObserver(function(e){
    e.forEach(function(en){if(en.isIntersecting){en.target.classList.add('visible');obs.unobserve(en.target);}});
  },{threshold:0,rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
  // Mobile menu
  var menuBtn = document.querySelector('.h-menu-btn');
  var nav = document.querySelector('.h-nav');
  if(menuBtn && nav){
    menuBtn.addEventListener('click',function(){
      menuBtn.classList.toggle('open');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){
        menuBtn.classList.remove('open');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
})();
