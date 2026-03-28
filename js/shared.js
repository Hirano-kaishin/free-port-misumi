(function(){
  document.body.classList.add('js-loaded');
  var hdr = document.querySelector('.site-header');
  if(hdr) window.addEventListener('scroll',function(){hdr.classList.toggle('scrolled',window.scrollY>40)});
  var obs = new IntersectionObserver(function(e){
    e.forEach(function(en){if(en.isIntersecting){en.target.classList.add('visible');obs.unobserve(en.target);}});
  },{threshold:0,rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
})();
