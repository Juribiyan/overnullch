var audioCtx = new (window.AudioContext || window.webkitAudioContext)()
, audio, source, analyser, freqs, gainNode
, oggSrc, mp3Src
// , canvas, canvasCtx
, volFactor = 1.5, smoothing = 0.2, tresh = .4
, defaultVolume = 0.58 // 3 squiggles out of 4
, animatee
, positionInput, volumeInput, volI, volOff, volLine, prevVol, playPause
, smil = false, plays, pauses
, revealOnPlay
, pList

function go() {
  //set vars
  positionInput = document.querySelector('#song-position')
  volumeInput = document.querySelector('#volume-input')
  volI = document.querySelector('#volume-icon')
  volOff = document.querySelector('.volume-off')
  volLine = document.querySelector('.volume-indicator')
  audio = document.querySelector('audio')
  oggSrc = document.querySelector('#ogg-src'), mp3Src = document.querySelector('#mp3-src')
  // canvas = document.querySelector('canvas')
  animatee = document.querySelector('#animatee')
  playPause = document.querySelector('#playpause')
  revealOnPlay = document.querySelector('.reveal-on-play')
  pList = document.querySelector('#playlist')
  //setup audio
  source = audioCtx.createMediaElementSource(audio)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 2048;
  gainNode = audioCtx.createGain()
  controls.gain = defaultVolume
  source.connect(analyser)
  analyser.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  analyser.smoothingTimeConstant = smoothing
  freqs = new Uint8Array(analyser.frequencyBinCount)
  //setup test canvas
  // canvasCtx = canvas.getContext('2d')
  playList.init()

  draw()
  //setup UI
  audio.ontimeupdate = function() {
    if(positionInput.ownerDocument.activeElement != positionInput) {
      positionInput.value = this.currentTime / this.duration
    }
  }
  positionInput.onchange = function() {
    controls.position = this.value
  }
  volumeInput.oninput = function() {
    controls.gain = this.value
  }
  volI.onclick = function() {
    if(gainNode.gain.value) {
      prevVol = gainNode.gain.value
      controls.gain = 0
    }
    else {
      controls.gain = prevVol || defaultVolume
    }
  }
  playpause.onclick = controls.playPause

  if ('beginElement' in document.getElementById("play-to-pause-1")) 
    smil = true
  if(!smil) {
    plays = document.querySelectorAll(".nosmil-play")
    pauses = document.querySelectorAll(".nosmil-pause")
  }
}

function draw() {
  analyser.getByteFrequencyData(freqs);

  /*canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < freqs.length; i++) {
    canvasCtx.fillRect(i, canvas.height - freqs[i], 1, canvas.height);
  }*/
  var relativeVolume = getAverageVolume(freqs) / 255
  // maximum volume is ~0.5, so
  var vol = relativeVolume * volFactor
  if(vol > 1) vol = 1
  // modify the volume curve to make visuals more acute
  vol = easeIOQ(vol, tresh)
  animatee.style.opacity = vol

  frame(draw)
}

//ease InOutQuart (http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/)
//tresh=0.5
function easeIOQ(t, tresh) { return t<tresh ? 8*t*t*t*t : 1-8*(--t)*t*t*t }

// x-browser requestAnimationFrame
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

// (http://themaninblue.com/writing/perspective/2012/09/18/)
function getAverageVolume(array) {
  var values = 0;
  var average;
  var length = array.length;
  for (var i = 0; i < length; i++) {
    values += array[i];
  }
  average = values / length;
  return average;
}

var controls = {
  set gain(val) {
    gainNode.gain.value = val
    volumeInput.value = val
    if(val == 0) {
      volOff.style.opacity = 1
      volLine.style.opacity = 0
      volLine.style.strokeDashoffset = 70000
    }
    else {
      volOff.style.opacity = 0
      volLine.style.opacity = 1
      volLine.style.strokeDashoffset = (1-val)*70000
    }
  },
  set position(pos) {
    audio.currentTime = audio.duration * pos
  },
  playPause: function() {
    if(audio.paused) {
      revealOnPlay.style.opacity = 1
      audio.play()
      if(smil) {
        document.getElementById("play-to-pause-1").beginElement()
        document.getElementById("play-to-pause-2").beginElement()
      }
      else {
        Array.prototype.forEach.call(plays, function(el){
          el.style.opacity = 0
        });
        Array.prototype.forEach.call(pauses, function(el){
          el.style.opacity = 1
        });
      }
    }
    else {
      audio.pause()
      if(smil) {
        document.getElementById("pause-to-play-1").beginElement()
        document.getElementById("pause-to-play-2").beginElement()
      }
      else {
        Array.prototype.forEach.call(plays, function(el){
          el.style.opacity = 1
        });
        Array.prototype.forEach.call(pauses, function(el){
          el.style.opacity = 0
        });
      }
    }
  }
}

var playList = {
  current: 0,
  init: function() {
    var c = this.current
    tracklist.forEach(function(track, id) {
      var html = '<div id="plel-'+id+'" class="pl-element'+(c==id ? ' current' : '')+'" onclick="playList.play('+id+')">'+track.name+'</div>'
      pList.innerHTML += html
    })
  },
  play: function(id) {
    if(id == this.current) {
      controls.playPause()
      return
    }
    var track = tracklist[id]
    if(typeof track === 'undefined')
      return
    document.querySelector('#plel-'+this.current).classList.remove('current')
    this.current = id
    audio.pause()
    oggSrc.src = 'tracks/'+track.filename+'.ogg'
    mp3Src.src = 'tracks/'+track.filename+'.mp3'
    audio.load()
    controls.playPause()
    document.querySelector('#plel-'+this.current).classList.add('current')
  }
}
