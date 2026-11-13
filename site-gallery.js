/* =========================================================================
   ASK — gallery dialog (ASK-local, not vendored)

   The one gallery dialog for this site's image galleries: ASKproduKtion's
   production portfolio, the apex solar kiss design portfolio and the
   sociedade mecânica de futebol page. It was
   inline on the ASKproduKtion page until the design portfolio became its
   second use; the behavior is unchanged for that page.

   A page supplies the dialog markup (#lightbox with .lb-close, .lb-prev,
   .lb-next, an <img> and .lb-cap) and one or more galleries. A gallery is an
   element carrying a <script type="application/json" class="gal-data"> with
   {title, credit, images}. Two triggers open it:

     .gal-card-trigger  inside a .gal-card  opens the card's gallery at its first image
     .gal-thumb[data-index] inside a [data-gal] container  opens that container's
                        gallery at the thumbnail's own image

   An image is either a path string, captioned "title // credit (n / total)" —
   ASKproduKtion's form — or an object {src, alt, caption, full}: the caption
   then names the artifact itself, the alt text describes it, and `full` is the
   full-resolution copy that an optional .lb-full link in the dialog opens for
   close inspection of dense interface and diagram work.

   Open: everything behind the dialog, the shell's seated mark included, is
   inert, and focus moves to Close. Close: only what open made inert is
   restored, and focus returns to the control that opened it.
   ========================================================================= */
(function(){
  var lb=document.getElementById('lightbox');
  if(!lb) return;
  var img=lb.querySelector('img'),cap=lb.querySelector('.lb-cap'),full=lb.querySelector('.lb-full'),set=[],i=0,meta={},from=null,held=[];
  function item(k){var x=set[k];return typeof x==='string'?{src:x}:x;}
  function show(){
    var it=item(i);
    img.src=it.src;
    img.alt=it.alt||'';
    var c=it.caption||meta.credit; cap.textContent=meta.title+(c?' // '+c:'')+'  ('+(i+1)+' / '+set.length+')';
    if(full){full.href=it.full||it.src;}
  }
  function open(t,data,start){
    set=data.images;meta={title:data.title,credit:data.credit};i=start||0;from=t;
    lb.classList.add('open');lb.removeAttribute('aria-hidden');
    held=[].filter.call(document.body.children,function(e){return e!==lb&&!e.inert;});
    held.forEach(function(e){e.inert=true;});
    document.body.style.overflow='hidden';show();lb.querySelector('.lb-close').focus();
  }
  function close(){
    lb.classList.remove('open');lb.setAttribute('aria-hidden','true');
    held.forEach(function(e){e.inert=false;});held=[];
    img.src='';img.alt='';document.body.style.overflow='';
    if(from){from.focus({preventScroll:true});from=null;}
  }
  function nav(d){i=(i+d+set.length)%set.length;show();}
  function read(scope){var s=scope&&scope.querySelector('.gal-data');return s?JSON.parse(s.textContent):null;}
  document.addEventListener('click',function(e){
    var trig=e.target.closest('.gal-card-trigger');
    if(trig){var card=read(trig.closest('.gal-card'));if(card){open(trig,card,0);}return;}
    var thumb=e.target.closest('.gal-thumb[data-index]');
    if(thumb){var g=read(thumb.closest('[data-gal]'));if(g){open(thumb,g,parseInt(thumb.getAttribute('data-index'),10)||0);}return;}
    if(e.target.closest('.lb-next')){nav(1);return;}
    if(e.target.closest('.lb-prev')){nav(-1);return;}
    if(e.target===lb||e.target.closest('.lb-close')){close();}
  });
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();else if(e.key==='ArrowRight')nav(1);else if(e.key==='ArrowLeft')nav(-1);});
})();
