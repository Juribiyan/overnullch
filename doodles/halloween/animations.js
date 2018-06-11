function readyset() {
  setOpacity();
}

function setOpacity() {
  $('.lit').each(function() {
    if(Math.random() > 0.9)
      $(this).animate({opacity: Math.random()})
  });
  if(Math.random() > 0.9) {
    $('#heavenly-father').animate({opacity: Math.random()*0.4 + 0.6}, 2000)
  }
  
  frame(setOpacity);
}

var frame = (function() {
return  window.requestAnimationFrame || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame    || 
  window.oRequestAnimationFrame      || 
  window.msRequestAnimationFrame     || 
  function( callback ) {
    window.setTimeout(callback, 1000 / 60);
  };
})();