function popit() {
	chpok.init(true)
	document.querySelectorAll('.popit input').forEach(b => b.addEventListener('change', () => chpok.play() ))
}

var chpok = {
  init: function(atLoad = false) {
    document.body.insertAdjacentHTML('beforeend', `<audio id="chpok-audio" style="display:none">
      <source src="/doodles/popit/chpok.mp3">
      <source src="/doodles/popit/chpok.ogg">
    </audio>`)
    this.initiated = true
    this.audio = document.querySelector('#chpok-audio')
  },
  play: function() {
    if (! this.initiated)
      this.init()
    // In chrome the sound won't play, causing a DOM exception, if a user hasn't clicked a page at least once (and it's unfixable)
    this.audio.play().catch(e => _.noop)
  }
}