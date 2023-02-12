'use strict';

var chanTop = {
	vstep: 50,
	init: function($el, list) {
		this.$el = $el.addClass('chantop')
		this.$el.empty()
		this.chans = list
		this.load()
	},
	makeCSS: function(count) {
		var css = '', vstep = this.vstep
		_.range(count).forEach(function(p) {
			var props = ''
			if(has3d) {
				['', '-webkit-'].forEach(function(prefix) {
					props += `${prefix}transform: translate3d(0, ${vstep*p}px, 0);\n`
				})
			}
			else
				props += `top: ${vstep*p + 10}px;`
			css += `#co-${p} {\n${props}}\n`
		})
		css += `.chantop { height: ${count*vstep}px }`
		injector.inject('chantop-positions', css)
	},
	load: function() {
		this.makeCSS(this.chans.length)
		this.chans.forEach(chan => {
			chan.$el = $(this.buildChan(chan))
			chan.$el.find('.adder-remover').click(() => {
				installer.toggle(chan.id)
			})
			this.$el.append(chan.$el)
		})
		API.getRates()
		this.upd = setInterval(() => {
			if(new Date().getTime() - this.lastUpdated > this.interval/2 
			&& !$('#chantop').is(':hover') 
			&& $('#chantop').css('visibility') !== 'hidden')
				API.getRates()
		}, this.interval)
	},
	stahp: function() {
		clearInterval(this.upd)
	},
	updateRatings: function(data) {
		this.lastUpdated = new Date().getTime()
		let oldIDs = _.map(this.chans, 'id')
		, newIDs = _.map(data, 'id')
		if (newIDs.length !== oldIDs.length || _.difference(oldIDs, newIDs).length) {
			document.location.reload()
			return
		}
		this.chans.forEach(chan => {
			chan.rating = +_.find(data, {id: chan.id}).rating
			chan.$el.find('.chan-rating').text(chan.rating)
		})
		this.arrange()
	},
	interval: 5000,
	buildChan: function(chan) {
		let isInstalled = installer.isInstalled(chan.id)
		, xPlus = isInstalled ? '×' : '+'
		, addRemove = isInstalled ? 'Удалить' : 'Добавить'
		, name = _.escape(chan.name)
		, wiki = (chan.wiki && chan.wiki.match(/https?:\/\//)) ? chan.wiki : (conf.wiki+(chan.wiki || name))
		return html`<div class="ct-chan">
			<img src="/chans/balls/${chan.section}/${chan.id}.png${chan.ballv ? `?v=${chan.ballv}` : ''}" alt="${name}" class="chan-avatar">
			<div class="catc-addremove adder-remover" title="${addRemove}">${xPlus}</div>
			<a href="${_.escape(chan.url)}" target="_blank" class="chan-name"><span>${name}</span></a>
			<div class="chan-rating">${chan.rating}</div>
			<div class="chan-rating-delta"></div>
			<a target="_blank" href="${wiki}" class="catc-info" title="Информация">i</a>
		</div>`
	},
	arrange: function() {
		_.sortByOrder(chanTop.chans, ['rating', 'name'], ['desc', 'asc'])
		.forEach((chan, i) => {
			chan.$el.attr('id', `co-${i}`)
			if(this.arranged) {
				var hov = ' hovering'
				if(i < chan.order)
					hov += ' going-up'
				else if(i > chan.order)
					hov += ' going-down'
				else
					hov = ''
				if(chan.rating !== chan.oldRating) {
					var delta = chan.rating - chan.oldRating
					, deltaClass
					if(delta > 0) {
						deltaClass = 'plus'
						delta= '+'+delta
					}
					else 
						deltaClass = 'minus'
					chan.$el.find('.chan-rating-delta').text(`${delta}`)
					.removeClass('plus minus').addClass(deltaClass)
				}
				chan.$el.addClass(hov+(delta ? ' delta-show' : ''))
				setTimeout(() => chan.$el.removeClass('hovering going-down going-up delta-show'), 1000)
			}
			chan.order = i
			chan.oldRating = chan.rating
		})
		this.arranged = true
	},
	arranged: false,
	mockRandOrder: function(rand) {
		rand = rand || 0.3
		this.chans.forEach(chan => {
			if(Math.random() < rand) {
				chan.rating = Math.round(Math.random() * 1000)
				chan.$el.find('.chan-rating').text(`${chan.rating}`)
			}
		})
		this.arrange()
	}
}

var API = {
	getRates: function() {
		this.request('rates')
	},
	getChallenge: function() {
		this.request('challenge')
	},
	captcha: function(code) {
		this.request('captcha', 'POST', {captcha: code})
	},
	vote: function(lr) {
		if(lr !== 'left' && lr !== 'right')
			this.handleError('You can only vote Left or Right')
		this.request('vote', 'POST', {v: lr})
	},
	request: function(act, method, toSend) {
		$.ajax({
			url: `api.php?act=${act}`,
			type: method || 'GET',
			data: toSend || null,
		}).done(data => {
			if(data.error)
				return this.handleError(data.error)
			this.handleData(data.data)
		})
		.fail(e => this.handleError('XHR error: ', e))
	},
	handleData: function(data) {
		if(data.hasOwnProperty('vote_success')) {
			$('body').removeClass('enter-captcha')
		}
		if(data.hasOwnProperty('rates'))
			chanTop.updateRatings(data.rates)
		if(data.hasOwnProperty('challengers'))
			Masher.setNewChallenge(data.challengers)
		if(data.hasOwnProperty('debug'))
			console.log(data.debug)
	},
	handleError: function(er) {
		if(this.specialErrors.hasOwnProperty(er))
			this.specialErrors[er]()
		else
			console.error(er)
		return false
	},
	specialErrors: {
		enter_captcha: function() {
			$('body').addClass('enter-captcha')
			updateCaptcha()
		},
		wrong_captcha: function() {
			$('#captcha-panel').addClass('wrong')
			setTimeout(() => $('#captcha-panel').removeClass('wrong'), 1000)
			updateCaptcha()
		},
		force_reload: () => document.location.reload()
	}
}

function updateCaptcha() {
	$('#cpanel-wrap img').attr('src', '/captcha.php?color=200,200,200')
	$('input[name=captcha]').val('').focus()
}

var Masher = {
	init: function($el, list) {
		this.$el = $el
		var css = ''
		list.forEach(chan => {
			var $el = $(this.buildChan(chan))
			$el.find('a, .chan-options').click(ev => {
				ev.stopPropagation()
			})
			$el.find('.adder-remover').click(() => {
				installer.toggle(chan.id)
			})
			this.pool[chan.id] = $el
			css += `\n#ch_${chan.id} {\n ${this.gradient(chan.catbg)} \n}`
		})
		injector.inject('catalog-gradients', css)
		$('.challenger').click(function() {
			$('.catalog-chan').addClass('post')
			API.vote($(this).attr('id').split('c-')[1])
		})
		API.getChallenge()
	},
	pool: {},
	buildChan: chan => {
		let isInstalled = installer.isInstalled(chan.id)
		, xPlus = isInstalled ? '×' : '+'
		, addRemove = isInstalled ? 'Удалить' : 'Добавить'
		, name = _.escape(chan.name)
		, wiki = (chan.wiki && chan.wiki.match(/https?:\/\//)) ? chan.wiki : (conf.wiki+(chan.wiki || name))
		return html`<div class="catalog-chan">
		  <div class="cc-ball-wrap" id="ch_${chan.id}">
		    <img src="/chans/balls/${chan.section}/${chan.id}.png${chan.ballv ? `?v=${chan.ballv}` : ''}" alt="${name}" class="cc-ball">
		    <a href="${_.escape(chan.url)}" target="_blank" class="channame-overlay">${name}</a>
		    <div class="chan-options co-add adder-remover" title="${addRemove}">${xPlus}</div>
		    <a href="${wiki}" target="_blank" class="chan-options co-info" title="Информация">i</a>
		  </div>
		</div>`
	},
	setNewChallenge: function(pair) {
		var [left, right] = pair.map(lr => lr = this.pool[lr.id].addClass('pre').removeClass('post'))
		$('#c-left').append(left)
		$('#c-right').append(right)
		setTimeout(() => {
			$('.challenger .catalog-chan').removeClass('pre')
		}, 500)
	},
	gradient: function(colors) {
		let unprefixed = `linear-gradient(to bottom, #${colors[0]} 0%, #${colors[1]} 100%)`
		, res = /(((?:radial|linear)-gradient)\((?:(ellipse) at center|(-?[0-9]+)deg|to (right|bottom)), ?(.+)\));?/i.exec(unprefixed);
		if (res === null) return 'background:' + unprefixed;
		res = _.rest(_.without(res, undefined));
		var ret = res[0]+'; ';
		var gradientType = res[1];
		var gradientDirection;
		if (!isNaN(res[2])) gradientDirection = (90 - parseFloat(res[2])) + 'deg, ';
		else if (res[2] == 'bottom') gradientDirection = 'top, ';
		else if (res[2] == 'right') gradientDirection = 'left, ';
		else gradientDirection = 'center, ellipse cover, ';
		var gradientStops = res[3];
		_.each(['-o-', '-webkit-', '-moz-'], function(prefix) {
			ret += 'background:' + prefix + gradientType + '(' + gradientDirection + gradientStops + '); ';
		});
		return 'background:' + ret;
	}
}

function main() {
	$.ajaxSetup({
		dataType: 'json'
	})

	$.getJSON(`/chans/chans.json?v=${new Date().getTime()}`)
	.done(data => {
		if (data.chans && data.version) {
			initAll(data.chans, data.version)
		}
		else {
			console.error('bad-json')
		}
	})
	.fail(err => console.error(err))

	has3d = has3d()
}

function initAll(chans, version) {
	chans = chans.filter(chan => !chan.offline)
	chans.forEach(chan => {
		chan.section = chan.default ? 'default' : 'custom'
	})	
	installer.init(chans, version)
	chanTop.init($('#chantop'), chans)
	Masher.init($('#battleground'), chans)

	$('header').click(() => {
		if($(window).width() <= 640) {
			var unexpand = $('body').hasClass('xpnd')
			$('body').toggleClass('xpnd')
			if(!unexpand)
				$('#battleground-wrap').scrollTop(0)
		}
	})
	$('#cpanel-wrap img').click(updateCaptcha)
	$('#captcha-panel').submit(ev => {
		ev.preventDefault()
		API.captcha($('input[name=captcha]').val())
	})
	$(window).keydown(function(ev) {
		if($('body').hasClass('enter-captcha'))
			return
		if(ev.key == 'ArrowLeft' || ev.key == 'a')
			API.vote('left')
		else if(ev.key == 'ArrowRight' || ev.key == 'd')
			API.vote('right')
		else return;
		$('.catalog-chan').addClass('post')
	})
}

var installer = {
	installed: [],
	init: function(list, version) {
		this.list = list
		this.versions = LSfetchJSON('catalogVersions') || {}
		this.versions.server = version
		let myChans = LSfetchJSON('myChans_new')
		, freshList = []
		if (myChans && myChans.length) {
			myChans.forEach(mych => {
				let found = _.find(list, {id: mych.id})
				this.installed.push(found || mych)
			})
		}
		else {
			this.installed = _.filter(list, {'included': true})
		}
		this.sync(true)
	},
	sync: function(withVersions) {
		localStorage['myChans_new'] = JSON.stringify(this.installed)
		if (withVersions) {
			localStorage['catalogVersions'] = JSON.stringify(this.versions)
		}
	},
	isInstalled: function(chid) {
		return !!_.find(this.installed, {id: chid})
	},
	indicate: function(chid, xp, ar) {
		[Masher.pool[chid], _.find(chanTop.chans, {id: chid}).$el].forEach($el => {
			$el.find('.adder-remover').text(xp).attr('title', ar)
		})
	}, 
	install: function(chid) {
		let toInstall = _.find(this.list, {id: chid})
		if (toInstall) {
			this.installed.push(toInstall)
			this.sync()
			this.indicate(chid, '×', 'Удалить')
		}
	},
	uninstall: function(chid) {
		var removed = _.remove(this.installed, {id: chid})
		if (removed) {
			this.sync()
			this.indicate(chid, '+', 'Добавить')
		}
	},
	toggle: function(chid) {
		if(this.isInstalled(chid))
			this.uninstall(chid)
		else
			this.install(chid)
	}
}

var conf = {
	wiki: 'http://wiki.1chan.ca/'
}

var injector = {
  inject: function(alias, css) {
    var id = `injector:${alias}`
    var existing = document.getElementById(id)
    if(existing) {
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
    if(style) {
      var head = document.head || document.getElementsByTagName('head')[0]
      if(head)
        head.removeChild(document.getElementById(id))
    }
  }
}

function has3d() {
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