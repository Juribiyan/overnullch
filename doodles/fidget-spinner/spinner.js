const spinner = {
  init: function() {
    this.loadChans()
    .then(() => {
      this.putChans()
      $('.spinner-container').on('dblclick', this.putChans.bind(this))
    }, err => console.error(err))
    $('#spinner').propeller({
      inertia: 0.9993, 
      speed: -1
    })
  },
  loadChans: function() {
    return new Promise((resolve, reject) => {
      $.getJSON(`/chans/chans.json?v=${new Date().getTime()}`)
      .done(data => {
        data.chans.shift()
        this.chans = data.chans
        resolve()
      })
      .fail(err => reject(err))
    })
  },
  putChans: function() {
    if (! this.chans) return;
    let cell = 0
    while (cell < 3) {
      let newIndex = this.getRandomIndex()
      if (this.checkIfNewChan(newIndex)) {
        this.indexes[cell] = newIndex
        this.putChan(this.chans[newIndex], cell)
        cell++
      }
    }
  },
  getRandomIndex: function() {
    return Math.floor(Math.random() * this.chans.length)
  },
  checkIfNewChan: function(newIndex) {
    let unique = true
    this.indexes.forEach(oldIndex => {
      if (newIndex === oldIndex)
        unique = false
    })
    return unique
  },
  indexes: [],
  putChan: (chan, cell) => {
    let section = chan.default ? 'default' : 'custom'
    , ballSrc = `/chans/balls/${section}/${chan.id}.png?uid=${chan._id}${chan.ballv ? `&v=${chan.ballv}` : ''}`
    $(`#bc-${cell+1} img`)
    .attr('src', ballSrc)
    .attr('style', makeOffset(chan.offset))
  }
}

function makeOffset(offset) {
  if (! offset) return '';
  let left = offset[0], top = offset[1]
  , ret = ''
  if (left == 0 && top == 0) {
    return ret
  }
  ;['', '-webkit-', '-ms-', '-moz-', '-o-'].forEach(prefix => {
    ret += `${prefix}transform: translate(${left}px, ${top}px); `
  })
  return ret
}