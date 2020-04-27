"use strict"

const _WIKI = 'https://wiki.1chan.ca/'
, _SITENAME = "Овернульч"

function main() {
  parent.allReady()

  lazyBoy.init()

  $.ajaxSetup({ dataType: 'json' })

  // Colorization mode selector
  $('body')
  .on('click', '.toggler', function() {
    $(jq`#${$(this).data('toggle')}`).slideToggle('fast', function() {
      settings.onToggle($(this))
    })
  })
  

  $('#pinunpin').click(parent.toggleBehavior)

  $('.menu-toggle').click(menu.toggle)
  $('#menu-show').on('mouseenter', function() {
    if(parent._frames.layout == 'vertical' && _.contains(['overlay', 'shift'], parent._frames.behavior)) {
      menu.open()
    }
  })

  settings.init()
  chans.init()
  live.init()

  $('#refresh').click(function() {
    if ($(this).hasClass('script-installed')) {
      parent.$('#main').attr('src', router.noFollow)
    }
    else {
      $('#noscript-warning').fadeToggle('fast')
    }
  })

  if (('netscape' in window) && / rv:/.test(navigator.userAgent)) {
    injector.inject('no-shadow-for-you', `.showlive #live-toggle svg, #live-panel svg {filter: none!important; -webkit-filter: none!important;}`)
  }
}

// Produces a function which applies fn() to all values
function makeEscapeTagLiteralFn(fn = v => v) {
  return function(strings, ...values) {
    let result = ""
    for (let i = 0; i < strings.length; i++) {
      result += strings[i]
      if (i < values.length) {
        result += fn(''+values[i])
      }
    }
    return result
  }
}
// Escape tag literal functions for jQuery queries and regular expressions
var jq = makeEscapeTagLiteralFn(v => v.replace(/([!"#$%&'()*+,\-./:;<=>?@[\\\]^`{|}~ ])/g, "\\$1"))
, rx = makeEscapeTagLiteralFn(_.escapeRegExp)

var menu = {
  open: function() {
    parent.openMenu()
  },
  close: function() {
    parent.closeMenu()
  },
  toggle: function() {
    if(parent._open) menu.close()
    else menu.open()
  }
}

var settings = {
  flatProps: ['hiddenChans', 'showDirs', 'useAnonym', 'headOnly'],
  assocProps: ['hiddenCats', 'deletedCats', 'cachedUserboards'],
  init: function() {
    this.allProps = this.flatProps.concat(this.assocProps)
    ;['flatProps', 'assocProps'].forEach((propGroup) => {
      this[propGroup].forEach(param => {
        let val = LSfetchJSON(param)
        this[param] = _.isEmpty(val) ? (propGroup==='flatProps' ? [] : {}) : val
      })
    })
  },
  getChanSpecificPreferences: function(chid) {
    let ret = {}
    this.flatProps.forEach(prop => {
      ret[prop] = !!_.includes(this[prop], chid)
    })
    this.assocProps.forEach(prop => {
      ret[prop] = this[prop][chid] || []
    })
    return ret
  },
  handleCheck: function(prop, chid) {
    let on = !_.includes(this[prop], chid)

    let $ch = $(jq`.chan_${chid}`)
    if (prop === 'showDirs' || prop === 'headOnly') {
      $ch.toggleClass(prop, !!on)
    }
    if (prop === 'useAnonym') {
      $ch.find('a[data-href]').each(function() {
        let href = (on ? 'https://anonym.to?' : '') + $(this).data('href')
        $(this).attr('href', href)
      })
    }

    this.toggle(chid, prop, on)

    return false
  },
  toggle: function(chid, prop, on) {
    if (!on) {
      this[prop] = _.without(this[prop], chid)
    }
    else {
      this[prop].push(chid)
    }
    this.save()
  },
  toggleAssoc: function(prop, chid, catname, on) {
    if (! this[prop].hasOwnProperty(chid)) {
      if (on) {
        this[prop][chid] = [catname]
      }
    }
    else {
      if (on) {
        this[prop][chid].push(catname)
      }
      else {
        this[prop][chid] = _.without(this[prop][chid], catname)
      }
    }
    this.save()
    return this[prop][chid].length
  },
  save: function(key) {
    let props = key ? [key] : this.allProps
    props.forEach(prop => localStorage[prop] = JSON.stringify(this[prop]))
  },
  onToggle: function($el) {
    let on = $el.is(':visible')
    if ($el.hasClass('boards')) {
      let chid = $el.attr('id').match(/^boards_(.+)/)[1]
      this.toggle(chid, 'hiddenChans', !on)
    }
    if ($el.hasClass('cat-boards')) {
      this.toggleAssoc('hiddenCats', $el.data('chid'), $el.data('catname'), !on)
    }
  },
  deleteCategory: function(chid, catname) {
    let $cat = $(jq`#cat_${chid}_${catname}`).parents('.category')
    $cat.hide()
    this.toggleAssoc('deletedCats', chid, catname, true)
    $cat.parents('.chan').find('.restore-cats').show()
  },
  restoreCats: function(chid) {
    let $ch = $(jq`.chan_${chid}`)
    $ch.find('.category').show()
    $ch.find('.restore-cats').hide()
    if (this.deletedCats.hasOwnProperty(chid)) {
      this.deletedCats[chid] = []
      this.save()
    }
  }
}

function handleBoardClick(brd) {
  handleLinkClick(brd)
  $(brd).addClass('boardover').parents('.chan').addClass('onchan')
}

function handleHomeClick(a) {
  handleLinkClick(a)
  $(a).parents('.chan').addClass('onchan')
}

function handleLinkClick(a) {
  $('.boardover').removeClass('boardover')
  $('.onchan').removeClass('onchan')
  if(parent._frames.layout == 'horizontal') {
    menu.close()
  }
  parent.history.replaceState(null, null, `/#/${a.href}`);
}

var chans = {
  own: {
    own: true,
    id: '!OWN',
    wiki: 'Овернульч',
    boards: [
      {
        "name": "",
        "boards": [
          /*{
            "desc": "Метадоска",
            "dir": "meta"
          },*/
          {
            "desc": "Каталог сайтов",
            "dir": "catalog"
          },
          {
            "desc": "Редактор сайтов",
            "dir": "editor"
          },
          {
            "desc": "Ballsmash",
            "dir": "mash"
          },
          {
            "desc": "Библиотека лупов",
            "dir": "loops"
          }
        ]
      }
    ],
    // colors:["aaaaaa","bbbbbb"],
    name: "Овернульч",
    url: '//0chan.one'
  },
  build: function(chans) {
    this.model = chans
    $('#content').html([this.own].concat(chans).reduce((htm, ch) => htm + this.buildChan(ch), ''))
    this.insertWidgets()
    let cssCache = localStorage['compiledCSS']
    if (cssCache) {
      injector.inject('framestyles', cssCache)
    }
    else {
      lessCompiler.compile(this.model.concat(this.own))
    }
  },
  rebuildChan: function(chan) {
    this.model[_.findIndex(this.model, {id: chan.id})] = chan
    $(jq`.chan_${chan.id}`).html(this.buildChan(chan))
    this.insertWidgets()
    this.sync()
  },
  buildChan: function(chan) {
    _.assign(chan, settings.getChanSpecificPreferences(chan.id))
    if (! (chan.wiki && chan.wiki.match(/https?:\/\//))) {
      chan.wiki = _WIKI+(chan.wiki || chan.name)
    }
    if (chan.prefix === '') {
      delete chan.prefix
    }
    _.defaults(chan, this.defaults)

    let hasBoards = (chan.boards && chan.boards.length) || chan.userboards
    , url = chan.own ? `${chan.url}/index.html` : (((!chan.own && chan.useAnonym) ? 'https://anonym.to?' : '') + chan.url)
    , name = _.escape(chan.name)
    , htm = html`
    <div class="chan chan_${chan.id}${!chan.colors ? ' uncolorized' : ''}${chan.headOnly ? ' headOnly' : ''}${chan.showDirs ? ' showDirs' : ''}${!hasBoards ? ' no-boards' : ''}">
      <a onclick="handleHomeClick(this)" target="main" href="${url}" class="chan-header head-link" data-href="${chan.url}"${chan.own ? ' onclick="router.clearHash()"' : ''}>
        <div class="chan-name">${name}</div>
      </a>
      <div class="chan-header">
        <div class="chan-name toggler" data-toggle="boards_${chan.id}">${name}</div>
      </div>
      <div class="chan-overlay chan-overlay-left">
        ${hasBoards ? html`<a onclick="handleHomeClick(this)" class="iconic-link home-link" target="main" href="${url}" data-href="${chan.url}" title="Домашняя страница"${chan.own ? ' onclick="router.clearHash()"' : ''}>
          <svg class="icon"><use xlink:href="#i-home"></use></svg>
        </a>` : ''}
        <a class="iconic-link" target="main" href="${chan.wiki}" title="Информация на вики">
          <svg class="icon"><use xlink:href="#i-info"></use></svg>
        </a>
      </div>
      <div class="chan-overlay chan-overlay-right">
        <button class="toggler" data-toggle="settings_${chan.id}" title="Меню сайта">
          <svg class="icon"><use xlink:href="#i-dots"></use></svg>
        </button>
      </div>
      <div class="chan-menu" style="display:none" id="settings_${chan.id}">
        <div class="settings-entry ifnoboards-hide">
          <label for="showdirs_${chan.id}">
          <input type="checkbox" id="showdirs_${chan.id}" ${chan.showDirs ? 'checked' : ''} onchange="settings.handleCheck('showDirs', '${chan.id}')">
          <span>Показывать директории</span>
          </label>
        </div>
        <div class="settings-entry ifnoboards-hide">
          <label for="headonly_${chan.id}">
          <input type="checkbox" id="headonly_${chan.id}" ${chan.headOnly ? 'checked' : ''} onchange="settings.handleCheck('headOnly', '${chan.id}')">
          <span>Скрыть доски</span>
          </label>
        </div>
        ${!chan.own ? 
        html`<div class="settings-entry">
          <label for="useanonym_${chan.id}">
          <input type="checkbox" id="useanonym_${chan.id}" ${chan.useAnonym ? 'checked' : ''} onchange="settings.handleCheck('useAnonym', '${chan.id}')">
          <span>Использовать anonym.to</span>
          </label>
        </div>
        <div class="settings-entry restore-cats" ${chan.deletedCats.length ? '' : 'style="display:none"'}>
          <button class="trash-btn" onclick="settings.restoreCats('${chan.id}')">
            <svg class="icon">
              <use class="i-trash" xlink:href="#i-trash"></use>
              <use class="i-trash-open" xlink:href="#i-trash-open"></use>
            </svg>
            <span>Восстановить категории</span>
          </button>
        </div>
        <div class="settings-entry">
          <button onclick="chans.remove('${chan.id}')">
            <svg class="icon"><use xlink:href="#i-delete"></use></svg>
            <span>Удалить из фрейма</span>
          </button>
        </div>` : ''}
      </div>`

    if (!this.preventRouterRegistering) {
    	router.register(chan)
    }

    let cats = chan.boards

    widgets.supported.forEach(wiType => {
      if (chan.hasOwnProperty(wiType)) {
        cats = [{
          name: widgets[wiType].name,
          widgetType: wiType,
          widgetID: widgets[wiType].newWidget(chan[wiType], chan.id)
        }].concat(cats)
      }
    })

    if (chan.userboards) {
      if (!chan.userboards_system) {
        chan.userboards_system = 'instant'
      }

      cats = [{
        name: chan.userboards_catname,
        boards: chan.cachedUserboards,
        userboards: true
      }].concat(cats)

      let proceedUbrds = data => {
        let ubrds = normalizeUbrds[chan.userboards_system](data)
        if (! _.eq(chan.cachedUserboards, ubrds)) {
          this.updateUserboards(chan, ubrds)
        }
      }

      $.get(chan.userboards)
      .done(proceedUbrds.bind(this))
      .fail(err => {
        console.error(err)
        $.get(`/cors-proxy.php?url=${chan.userboards}`)
        .done(data => {
          if(data.status.http_code == 200) {
            proceedUbrds(data.contents)
          }
        })
        .fail(function(err) {
          console.error(err)
        })
      })
    }

    if (cats && cats.length) {
      htm += `<div class="boards" id="boards_${chan.id}" ${chan.hiddenChans ? 'style="display:none"' : ''}>`
      + cats.reduce((h, cat) => h + this.buildCat(chan, cat, !(cats.length > 1)), '')
      + '</div>'
    }

    htm += `</div>`

    return htm
  },
  buildCat: function(chan, cat, flat) {
    cat.name = _.escape(cat.name).replace(' ', ' ')
    let catID = cat.widgetType ? `!${cat.widgetType}` : cat.name
    , hidden = _.includes(chan.hiddenCats, catID)
    , hasBoards = (cat.boards && cat.boards.length)
    , hide = ' style="display:none"'
    , hiddenCompletely = (!cat.widgetID && !hasBoards) || _.includes(chan.deletedCats, catID)
    , htm = `<div class="category${cat.userboards ? ' userboards' : ''}"${hiddenCompletely ? hide : ''}${cat.widgetID ? ` data-widget="${cat.widgetID}"` : ''}>`
    if (!flat) {
      htm += html`
      <div class="cat-header toggler" data-toggle="cat_${chan.id}_${catID}">
        <div class="ch-name">${cat.name}</div>
        <div class="cat-options">
          <svg class="icon i-delete del-cat" onclick="event.stopPropagation();settings.deleteCategory('${chan.id}', '${catID}')"><use xlink:href="#i-delete"></use></svg>
        </div>
      </div>`
    }
    if (hasBoards || cat.widgetID) {
      htm += `<div class="cat-boards"${hidden ? hide : ''}${!flat ? ` id="cat_${chan.id}_${catID}" data-chid="${chan.id}" data-catname="${catID}"` : ''}>`
    }
    if (hasBoards) {
      cat.boards.forEach(board => {
        let desc = _.escape(board.desc)
        , dir = _.escape(board.dir)
        , cleanURL = board.external ? board.url : (chan.url + chan.prefix + dir + chan.postfix)
        , url = (chan.useAnonym ? 'https://anonym.to?' : '') + cleanURL
        htm += html`
        <a target="main" href="${url}" class="board${board.external ? ' external' : ''}" data-href="${cleanURL}" data-dir="${dir}" onclick="handleLinkClick(this)">
          ${board.external ? '' : `<span class="board-dir">/${dir}/ - </span>`}<span class="board-name">${desc}</span>
        </a>`
      })
      htm += '</div>'
    }
    if(cat.widgetID) {
      htm += `<div class="widget-placeholder" id="${cat.widgetID}"></div></div>` // /.widget-placeholder /.cat-boards
    }
    
    htm += `</div>` // /.category

    return htm
  },
  defaults: {
    userboards_catname: '2.0',
    prefix: '/',
    postfix: ''
  },
  init: function() {
    // Build frame from cache
    let chansCache = LSfetchJSON('myChans_new')
    if (chansCache) {
      // Style frame from cache
      this.build(chansCache)
    }
    // Get some fress JSON
    let fetchPromises = [new Promise((resolve, reject) => {
      $.getJSON(`/chans/chans.json?v=${new Date().getTime()}`)
      .done(data => {
        data.origin = 'server'
        resolve(data)
      })
      .fail(reject)
    })]
    let myDrafts = LSfetchJSON('mydrafts')
    if (myDrafts && myDrafts.chans) {
      fetchPromises.push(new Promise((resolve, reject) => {
        let myDraftsValid = []
        myDrafts.chans.forEach(draft => {
          if (draft.name && draft.url) {
            draft.id = `${draft.id}!draft`
            myDraftsValid.push(draft)
          }
        })
        resolve({
          origin: 'drafts',
          chans: myDraftsValid,
          version: myDrafts.version || 'unknown'
        })
      }))
    }
    // Versions from the last update
    let catalogVersions = LSfetchJSON('catalogVersions')
    Promise.all(fetchPromises).then(data => {
      let versMap = {}
      , allChans = []
      , changed = []
      data.forEach(sect => {
        versMap[sect.origin] = sect.version
        allChans = allChans.concat(sect.chans)
        let ver = catalogVersions ? (+catalogVersions[sect.origin] || null) : null
        if (chansCache && chansCache.length) {
          // Check if data for currect origin is newer
          if (ver !== +sect.version) {
            changed.push({
              origin: sect.origin,
              version: sect.version
            })
            let filter = sect.origin == 'drafts' ? {section: 'drafts'} : (i => (i.section == 'default' || i.section == 'custom' || i.section == 'offline'))
            // Update all installed chans
            _.map(_.filter(chansCache, filter), 'id').forEach(id => {
              let ch = _.find(sect.chans, {id: id})
              if (ch) {
                this.rebuildChan(ch)
              }
              else {
                this.remove(id)
                console.warn(`Removed unknown chan #${id} from frame`)
              }
            })
          }
        }
      })
      // Register chans in router to properly display name
      allChans.forEach(router.register.bind(router))
      this.preventRouterRegistering = true

      if (!(chansCache && chansCache.length)) {
        localStorage.removeItem('compiledCSS')
        let onlinechans = _.filter(allChans, 'offline', null)
        this.build(_.filter(onlinechans, 'included'))
      }
      if (changed.length) {
        // Restyle chans if needed
        lessCompiler.compile(this.model.concat(this.own))
        changed.forEach(chg => {
          console.info(`Updated ${chg.origin}-originated chans' cache to v.=${chg.version}`)
        })
      }
      this.versions = versMap
      this.sync()
    })
  },
  preventRouterRegistering: false,
  remove: function(chid) {
    _.remove(this.model, {id: chid})
    $(jq`.chan_${chid}`).remove()
    this.sync()
    return false
  },
  updateUserboards: function(chan, boards) {
    let cat = {
      name: chan.userboards_catname,
      boards: boards,
      userboards: true
    }
    $(jq`.chan_${chan.id} .userboards`).replaceWith(this.buildCat(chan, cat, false))
    settings.cachedUserboards[chan.id] = boards
    settings.save('cachedUserboards')
  },
  sync: function() {
    _.each(this.model, ch => delete ch.cachedUserboards)
    localStorage['catalogVersions'] = JSON.stringify(this.versions)
    localStorage['myChans_new'] = JSON.stringify(this.model)
  },
  insertWidgets: function() {
    document.querySelectorAll('.widget-placeholder').forEach(wph => {
      let widgetID = wph.getAttribute('id')
      if(widgets.pool.hasOwnProperty(widgetID)) {
        let widget = widgets.pool[widgetID]
        wph.parentNode.replaceChild(widget.el, wph)
      }
    })
  }
}

var normalizeUbrds = {
  'instant': data => data.map(brd => {
    if (brd.name) {
      brd.dir = brd.name
    }
    delete brd.postcount
    delete brd.name
    return brd
  }),
  '0chan': data => data.boards.map(brd => {
    brd.desc = brd.name
    delete brd.name
    return brd
  }),
  'meguca': data => data.map(brd => {
    brd.dir = brd.id
    brd.desc = brd.title
    delete brd.title
    delete brd.id
    return brd
  }),
  'lynxchan': data => data.boards.map(brd => {
    brd.dir = brd.boardUri
    brd.desc = brd.boardName
    delete brd.boardDescription
    delete brd.postsPerHour
    delete brd.lastPostId
    delete brd.uniqueIps
    delete brd.inactive
    delete brd.tags
    return brd
  }),
// vichan will work only if board owner enabled vichan's/infinity's/openib's API support
  'vichan': data => data.map(brd => {
    brd.dir = brd.uri
    brd.desc = brd.title
    delete brd.uri
    delete brd.title
    if (brd.subtitle) {
      delete brd.subtitle
    }
    if (brd.indexed) {
      delete brd.indexed
    }
    if (brd.sfw) {
      delete brd.sfw
    }
    if (brd.posts_total) {
      delete brd.posts_total
    }
    if (brd.time) {
      delete brd.time
    }
    if (brd.weight) {
      delete brd.weight
    }
    if (brd.locale) {
      delete brd.locale
    }
    if (brd.tags) {
      delete brd.tags
    }
    if (brd.max) {
      delete brd.max
    }
    if (brd.active) {
      delete brd.active
    }
    if (brd.pph) {
      delete brd.pph
    }
    if (brd.ppd) {
      delete brd.ppd
    }
    if (brd.pph_average) {
      delete brd.pph_average
    }
    return brd
  }),
  '4chan': data => data.boards.map(brd => {
    brd.dir = brd.board
    brd.desc = brd.title
    delete brd.board
    delete brd.title
    delete brd.ws_board
    delete brd.per_page
    delete brd.pages
    delete brd.max_filesize
    delete brd.max_webm_filesize
    delete brd.max_comment_chars
    delete brd.max_webm_duration
    delete brd.bump_limit
    delete brd.image_limit
    delete brd.cooldowns
    delete brd.meta_description
    delete brd.is_archived
    return brd
  }),
  'sosach': data => data.boards.map(brd => {
    brd.dir = brd.id
    brd.desc = brd.name
    delete brd.id
    delete brd.name
    delete brd.bump_limit
    delete brd.category
    delete brd.default_name
    delete brd.enable_names
    delete brd.enable_sage
    delete brd.info
    delete brd.last_num
    delete brd.speed
    delete brd.threads
    delete brd.unique_posters
    return brd
  })   
}

function LSfetchJSON(key) {
  let val = null, data = localStorage[key]
  if (typeof data !== 'undefined') {
    try {
      val = JSON.parse(data)
    }
    catch(e) {
      console.error(e)
      localStorage.removeItem(key)
    }
  }
  return val
}

var lessCompiler = {
  compile: function(chans) {
    let res = ''
    chans.forEach(ch => {
      if (ch.colors) {
        let idClassEscaped = ('chan_'+ch.id).replace('!', '\\!')
        res += `.${idClassEscaped} { 
          @bgcolor: #${ch.colors[0]};  @linkcolor: #${ch.colors[1]}; `
          + (ch.advanced_less || this.base) + '}\n\n'
      }
    })
    less.render(res, (err, output) => {
      if (err) {
        console.error(err)
      }
      else {
        localStorage['compiledCSS'] = output.css
        injector.inject('framestyles', output.css)
      }
    })
  },
  base: "background: @bgcolor; a, .chan-overlay .icon { color: @linkcolor; } &:hover { background: darken(@bgcolor, 8%); } &.onchan { box-shadow: inset -2px 0 fadeout(@linkcolor, 25%); } & when (lightness(@bgcolor) < 70%) { color: #C3C3C3; a:hover, .ch-name:hover, .icon:hover, .rw-playpause:hover, .volumeter:hover { color: white; } .board:hover { background: rgba(255, 255, 255, .08); } } & when (lightness(@bgcolor) > 70%) { color: #404040; a:hover, .ch-name:hover, .icon:hover, .rw-playpause:hover, .volumeter:hover { color: black; } .board:hover { background: rgba(0, 0, 0, .08); } }"
}

NodeList.prototype.forEach = Array.prototype.forEach
// NodeList.prototype.map = Array.prototype.map

var injector = {
  inject: function(alias, css) {
    var id = `injector:${alias}`
    var existing = document.getElementById(id)
    if (existing) {
      existing.innerHTML = css
      return
    }
    var head = document.head || document.getElementsByTagName('head')[0]
    , style = document.createElement('style')
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

var widgets = {
  pool: {},
  supported: ['radio']
}
widgets.radio = {
  name: "Радио",
  newWidget: function(props, id) {
    var widget = {
      streams: [],
      currentStream: null,
      url: props.url, 
      $el: $(`<div class="radio-widget disabled"></div>`)
    }

    var saved = {
      volume: +(localStorage[`radio_${id}_volume`] || 1),
      stream: +(localStorage[`radio_${id}_streamid`] || 0),
    }

    props.streams.forEach(stream => {
      if(stream.hasOwnProperty('n')) {
        var $_name = _.template(stream.name)
        , $_path = _.template(stream.path)
        this.mixedRange(stream.n).forEach(n => {
          widget.streams.push({
            name: $_name({n: n}),
            path: $_path({n: n}),
            mime: stream.mime
          })
        })
      }
      else
        widget.streams.push(stream)
    })

    widget.audio = $('<audio controls>')
    .appendTo(widget.$el)[0]
    widget.playPause = this.playPause.bind(widget)
    widget.audio.volume = saved.volume
    widget.audio.onloadeddata = () => widget.$el.removeClass('disabled')

    $(html`<div class="rw-playpause">
      <div class="pause-icon"></div>
      <div class="play-icon"></div>
    </div>`)
    .appendTo(widget.$el)
    .click(widget.playPause)

    var $selectWrapper = $('<div class="select-wrapper">')
    var options = []
    widget.streams.forEach((stream, ix) => {
      options.push(`<option value="${ix}">${stream.name}</option>`)
    })
    widget.setStream = this.setStream.bind(widget)
    $('<select>')
    .append(options)
    .val(saved.stream)
    .change(function() {
      widget.setStream(+this.value)
      localStorage[`radio_${id}_streamid`] = +this.value
    })
    .appendTo($selectWrapper)
    $selectWrapper.appendTo(widget.$el)
    
    lazyBoy.addJob(() => widget.setStream(saved.stream))
 
    var $volumeter = this.buildVolumeter(id, 70, 20, v => {
       widget.audio.volume = v
       localStorage[`radio_${id}_volume`] = v
    }, saved.volume)
    widget.$el.append($volumeter)
    widget.reflectVolumeChange = $volumeter.setV
    widget.setVolume = this.setVolume.bind(widget)

    widget.onCategoryClose = () => {
      if(!widget.audio.paused)
        widget.playPause()
    }

    widget.el = widget.$el[0]
    widgets.pool[`radio_${id}`] = widget
    return `radio_${id}`
  },
  all: {},
  setStream: function(streamID, play) {
    if(this.currentStream === streamID)
      return
    var stream = this.streams[streamID]
    , playing = !this.audio.paused
    this.audio.setAttribute('src', this.url + stream.path)
    this.audio.setAttribute('type', stream.mime)
    if(playing)
      this.audio.play()
  },
  setVolume: function(v) {
    this.audio.volume = v
    this.reflectVolumeChange(v)
  },
  playPause: function(force) {
    force = force || null
    if(this.audio.networkState == 3) {
      this.audio.pause()
      this.$el.removeClass('streaming')
    }
    else if(this.audio.paused) {
      $('.radio-widget audio').each(function() {
        this.pause()
      })
      this.audio.play()
      this.$el.addClass('streaming')
    }
    else {
      this.audio.pause()
      this.$el.removeClass('streaming')
    }
  },
  buildVolumeter: function(id, width, height, onchange, baseV) {
    baseV = baseV || 1

    var $vm = $('<div class="volumeter">')

    var buildSVG = cls => {
      var cns = tag => document.createElementNS("https://www.w3.org/2000/svg", tag)

      var svg = cns('svg')
      svg.setAttribute('width', width)
      svg.setAttribute('height', height)
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
      svg.classList.add(cls)

      var poly = cns('polygon')
      poly.setAttribute('points', `0,${height} ${width},0 ${width},${height}`)
      svg.appendChild(poly)

      return svg
    }

    var bg = buildSVG('vm-bg')
    , fg = buildSVG('vm-fg')

    var $w = $('<div class="vm-fg-wrapper">')
    $w[0].appendChild(fg)

    $vm.append($w)
    $vm[0].appendChild(bg)

    $vm.setV = val => $w.css({width: `${val * width}px`})
    $vm.setV(baseV)

    var down = false

    function evToVal(ev) {
      if(down) {
        var val = (ev.pageX - $vm.offset().left) / width
        if(val < 0) val = 0
        if(val > 1) val = 1
        $vm.setV(val)
        if(onchange) 
          onchange(val)
      }
    }

    $vm.mousedown(function(ev) {
      down = true
      evToVal(ev)
    })
    
    $('body')
    .mousemove(evToVal)
    .on('mouseup mouseleave blur', ev => {
      down = false
    })

    return $vm
  },
  mixedRange: function(input) {
    var m
    , output = []
    , re = /(?:([0-9]+)(?:\-([0-9]+))?(?:, ?)?)/g
    
    while ((m = re.exec(input)) !== null) {
      if (m.index === re.lastIndex) {
        re.lastIndex++
      }
      if(m[2]) {
        output = output.concat(_.range(m[1], +m[2]+1))
      }
      else
        output.push(+m[1])
    }

    return output
  }
}

var router = {
  chans: {},
  register: function(chan) {
    this.chans[chan.id] = {
      exp: new RegExp(rx`^(https?:\/\/${chan.url.split(/^https?:\/\//)[1] || chan.url})(?:${chan.prefix || chans.defaults.prefix}([^\/\?#]+))?`),
      name: chan.name,
      boards: _.flatten(_.map(chan.boards, 'boards'))
    }
  },
  currentHash: '',
  determineIdentity: function(url) {
    let result = null
    // console.log('router.chans:', this.chans)
    _.find(this.chans, (chan, chid) => {
      // console.log(`Checking ${chid}...`)
      let guro = chan.exp.exec(url)
      if (guro !== null) {
        let dir = guro[2] || null
        result = {
          id: chid,
          name: chan.name
        }
        if (dir) {
          result.dir = dir
          let brd = _.find(chan.boards, {dir: dir})
          if (brd) {
            result.desc = brd.desc
          }
        }
        return 1
      }
      else return false
    })
    return result
  },
  indicateOn: function(i) { 
    let $chan = $(jq`.chan_${i.id}`)
    , isOWN = (i.id === '!OWN')
    , title = !isOWN ? i.name : ''
    $('.onchan').removeClass('onchan')
    $('.boardover').removeClass('boardover')
    if($chan.length) {
      $chan.addClass('onchan')
    }
    if (i.dir) {
      i.dir = decodeURIComponent(i.dir)
      var $brd = $chan.find(jq`a[data-dir="${i.dir}"]`)
      if($brd.length) {
        $brd.addClass('boardover')
        if (!i.desc) {
          i.desc = $brd.find('.board-name').text()
        }
      }
      if (i.desc) {
        title += (!isOWN ? ':' : '') + i.desc
      }
    }
    parent.document.title = (title ? `${title} • ` : '') + _SITENAME
  },
  sync: function(event) {
    if (typeof event.data !== 'string') return;

    if(event.data.match(/overnullchlive\.html/)) {
      parent.script_installed = true;
      scriptInstalled()
      try {
        parent.frames.main.scriptInstalled()
      }
      catch(e) {  }
      return
    }
    //prevent frame nesting
    if (event.data.split(/\/$/)[0] == parent.location.protocol + '//' + parent.location.host) {
      parent.frames['main'].location.href = '/index.html'
      this.noFollow = '/index.html'
      return
    }
    //prevent follow
    router.noFollow = event.data;
    // set the hash
    parent.history.replaceState(null, null, '/#/'+event.data)
    // define chan
    var identity = router.determineIdentity(event.data)
    if(identity) {
      router.indicateOn(identity)
    }
    else parent.document.title = _SITENAME;
  },
  follow: function() {
  	if (parent.location.hash && this.noFollow.split(/#\/?/)[1] !== parent.location.hash) {
  		let url = parent.location.hash.split(/#\/?/)[1]
  		parent.frames['main'].location.href = url
  		this.noFollow = url
  	}
  },
  clearHash: function() {
    parent.document.title = _SITENAME;
    parent.history.replaceState({}, parent.document.title, "/");
  },
  noFollow: false
}

function scriptInstalled() {
  $('#refresh').addClass('script-installed').attr('title', 'Обновить')
}

var lazyBoy = {
  init: function() {
    $(window).load(this.execute.bind(this))
  },
  que: [],
  execute: function() {
    this.ready = true
    while (this.que.length) {
      this.que.splice(0, 1)[0]()
    }
  },
  addJob: function(job) {
    if (this.ready) {
      job()
    }
    else {
      this.que.push(job)
    }
  },
  ready: false
}

window.addEventListener("message", router.sync, false)

try {
  if (parent.frames.main.document.location.pathname.match(/catalog/)) {
    parent.frames.main.window.postMessage('overnullchlive.html', chans.own.url)
  }
}
catch(e) {}


function check3d() {
  if (!window.getComputedStyle) {
    return false;
  }
  
  var el = document.createElement('p'),
  has3d,
  transforms = {
    'webkitTransform':'-webkit-transform',
    'OTransform':'-o-transform',
    'msTransform':'-ms-transform',
    'MozTransform':'-moz-transform',
    'transform':'transform'
  };

  // Add it to the body to get the computed style
  document.body.insertBefore(el, null);

  for(var t in transforms){
    if( el.style[t] !== undefined ){
      el.style[t] = 'translate3d(1px,1px,1px)';
      has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
    }
  }

  document.body.removeChild(el);

  return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
}

var live = {
  init: function() {
    let transform = `transform: translate${check3d() ? '3d' : ''}(-50%${check3d() ? ',0,0' : ''});`
    injector.inject('paneshift', `.showlive .pane-container { ${transform} -o-${transform} -webkit-${transform} -moz-${transform} -ms-${transform} }`)
    this.update()
    $('#live-toggle').click(() => {
      if(parent._frames.layout == 'horizontal' && !parent._open) {
        menu.open()
        this.toggle(true)
        return
      }
      this.toggle()
    })
    $('#live-add').click(this.showForm.bind(this))
    $('#live-refresh').click(this.update.bind(this))
    this.scheduleUpdate(60 * 1000)
  },
  update: function() {
    $.get(`/live/live.json?v=${new Date().getTime()}`)
    .done((data, textStatus, jqXHR) => {
      if (this.hasOwnProperty('currentList') && this.currentList === jqXHR.responseText) {
        return
      }
      this.build(data)
      this.currentList = jqXHR.responseText
    })
  },
  toggle: function(onoff) {
    $('body').toggleClass('showlive', onoff)
  },
  build: function(data) {
    $('#live-content').html(data.reduce((htm, link) => htm + this.buildLink(link), ''))
  },
  buildLink: function(link) {
    return html`<a target="main" href="${_.escape(link.url)}" class="board external" onclick="handleBoardClick(this)">
      <span class="board-name">${_.escape(link.description)}</span>
      <span class="link-domain">${_.escape(this.getDomainName(link.url))}</span>
    </a>`
  },
  showForm: function() {
    if (parent._frames.layout == 'horizontal') {
      menu.close()
    }
    parent.frames.live.$('#url').val(parent.location.hash.split(/^#\/?/)[1])
    parent.toggleShare()
    parent.frames.live.$('#description').focus()
  },
  getDomainName: url => url.match(/^https?:\/\/(?:www\.)?([^\/#\?]+)/i)[1],
  scheduleUpdate: function(ms) {
    clearInterval(this.interval)
    this.interval = setInterval(this.update.bind(this), ms)
  }
}
