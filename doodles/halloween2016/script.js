function main() {

  setInterval(() => {
    $('.bulb-container').toggleClass('lit')
  }, 500)

  soundSprite.init(document.getElementById('audio'), {
    knock1: {
      start: 0,
      length: 2
    },
    knock2: {
      start: 2.5,
      length: 2
    },
    open: {
      start: 5,
      length: 1.5
    },
    close: {
      start: 7,
      length: 2
    }
  })

  sequencer.setState('knock')

  $('.door').click(function() {
    sequencer.setState($(this).hasClass('d-open') ? 'knock' : 'open')
  })

  $('.popup').click(() => $('.payment').slideDown())
}

var ball = {
  init: function() {
    this.current = localStorage['hw16_lastBall'] || null
  },
  offsets: [[0, -31], [0, -27], [-7, -18], [-3, -34], [-3, -34], [18, -36], [-4, -36], [-6, -36], [-1, -33], [-2, -35], [-8, -21], [-6, -34], [19, -30], [-26, -33], [-1, -34], [1, -31]],
  placeNew: function(n) {
    if (typeof n !== 'number') {
      n = Math.floor(Math.random()*16)
      while (n == this.current)
        n = Math.floor(Math.random()*16)
    }
    let offset = this.offsets[n]
    $('.ball').attr('src', `balls/${n.toString(16)}.png`).show()
    injector.inject('ball-offset', ['-webkit-', '-ms-', ''].reduce((p, c) => p + `${c}transform: translate(${offset[0]}px, ${offset[1]}px);`, '.ball {')+'}')
    this.current = n
    localStorage['hw16_lastBall'] = n
  },
  hide: function() {
    $('.ball').hide()
    this.current = false
  }
}
ball.init()

var sequencer = {
  states: {
    knock: {
      start: function() {
        $('.door').removeClass('d-open').addClass('d-closed')
        var knock = () => {
          this.knockTimeout = setTimeout(() => {
            soundSprite.play(`knock${_rI(1,2)}`)
            ball.placeNew()
            knock()
          }, _rI(3000, 5000))
        }
        knock()
      },
      stop: function() {
        soundSprite.el.pause()
        clearTimeout(this.knockTimeout)
      }
    },
    open: {
      start: function() {
        clearTimeout(this.goAwayTimeout)
        soundSprite.play(`open`)
        $('.door').removeClass('d-closed').addClass('d-open')
        if ($('.ball').is(':visible'))
          this.popup = setTimeout(() => $('.popup').removeClass('hidden'), 1000)
      },
      stop: function() {
        clearTimeout(this.popup)
        $('.popup').addClass('hidden')
        $('.payment').hide()
        soundSprite.play(`close`)
        this.goAwayTimeout = setTimeout(() => ball.hide(), 1500)
      }
    }
  },
  setState: function(state) {
    if (this.state) {
      this.states[this.state].stop()
    }
    this.states[state].start()
    this.state = state
  }
}

var injector = {
  inject: function(alias, css) {
    var id = `injector:${alias}`
    var existing = document.getElementById(id)
    if (existing) {
      existing.innerHTML = css
      return
    }
    var head = document.head || document.getElementsByTagName('head')[0]
    , style = document.createElement('style');
    style.type = 'text/css'
    style.id = id
    if (style.styleSheet) {
      style.styleSheet.cssText = css
    } else {
      style.appendChild(document.createTextNode(css))
    }
    head.appendChild(style)
  },
  remove: function(alias) {
    var id = `injector:${alias}`
    var style = document.getElementById(id)
    if (style) {
      var head = document.head || document.getElementsByTagName('head')[0]
      if (head)
        head.removeChild(document.getElementById(id))
    }
  }
}

var soundSprite = {
  data: null,
  current: null,
  el: null,
  init: function(el, data) {
    this.data = data
    this.el = el
    this.el.volume = 0.5
    let _this = this
    this.el.addEventListener('timeupdate', function() {
      if (this.currentTime >= _this.current.start + _this.current.length) {
        this.pause()
      }
    }, false)
  },
  play: function(id) {
    let sprite = this.data[id]
    if (sprite && sprite.length) {
      this.current = sprite
      this.el.currentTime = sprite.start
      this.el.play()
    }
  }
}

function _rI(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}