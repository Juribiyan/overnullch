(function() {
  var ch = document.currentScript.getAttribute('chan')
  if(ch)
    document.write('<iframe class="overnullch-button" name="overbutton_'+ch+'" frameborder="0" hspace="0" marginheight="0" marginwidth="0" scrolling="no" style="height:20px; width:88px" tabindex="0" vspace="0" title="Добавить в Овернульч" src="http://overnullch/embed/embed.html"></iframe>')
  else
    console.error('Overnullch button error: chan not specified.')
})()