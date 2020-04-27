"use strict";

const main = () => {
	$.ajaxSetup({
		dataType: 'json'
	})

	$('#drawer, #hijab').click(() => $('body').toggleClass('list-collapsed'))

	let fetchPromises = [new Promise((resolve, reject) => {
		$.getJSON(`/chans/chans.json?v=${new Date().getTime()}`)
		.done(data => {
			catalog.add(data.chans)
			resolve({
				origin: 'server',
				version: data.version
			})
		})
		.fail(err => reject(err))
	})]
	if (localStorage['mydrafts']) {
		let myDrafts = null
		try {
			myDrafts = JSON.parse(localStorage['mydrafts'])
			catalog.myDraftsRaw = _.cloneDeep(myDrafts.chans)
		}
		catch(e) {
			localStorage.removeItem('mydrafts')
			console.error(e)
		}
		if (myDrafts.chans) {
			fetchPromises.push(new Promise((resolve, reject) => {
				let myDraftsValid = []
				myDrafts.chans.forEach(draft => {
					if (draft.name && draft.url && draft.id && draft.id.match(/^[a-z\-_0-9]+$/)) {
						draft.originalID = draft.id
						draft.id += `!draft`
						myDraftsValid.push(draft)
					}
					else {
						errorBoy.pushError(`Черновик #${draft.id} не добавлен в каталог: недостаточно данных или некорректный ID.`)
					}
				})
				catalog.add(myDraftsValid, 'drafts')
				resolve({
					origin: 'drafts',
					version: myDrafts.version
				})
			}))
		}
	}
	Promise.all(fetchPromises).then(list.init.bind(list), err => console.error(err))

	$('.tab').click(function(ev) {
		let $chev = $(this).parent().find('.icon')
		if ($chev.css('display') === 'block' && $chev.css('opacity') == 1) {
			ev.stopPropagation()
			$('#catalog header').addClass('tab-selecting')
		}
		else {
			let tab = $(this).text().toLowerCase()
			switchTab(tab)
		}
	})

	let ctab = localStorage['cat-tab']
	if (ctab) {
		switchTab(ctab)
	}

	$('#toggle-search').click(function() {
		$('#catalog').addClass('searching')
		$('#search').focus()
	})
	$('#search').on('input', function() {
		let val = $(this).val().trim().toLowerCase()
		$('#catalog').toggleClass('search-filter', !!val.length)
		injector.inject('cat-search', `.search-filter .cat-chan[data-search *= "${val}"] {display: inline-block}`)
	})
	$('#cancel-search').click(function() {
		$('#catalog').removeClass('searching search-filter')
		$('#search').val('')
	})

	$('body')
	.click(() => $('#catalog header').removeClass('tab-selecting'))
	.on('click', '.cc-install', function() {
		let $ch = $(this).parents('.cat-chan')
		list.toggle($ch[0]._libdata)
	})
	.on('click', '.make-embed', function() {
		$(this).parents('.cat-chan').toggleClass('code-on')
	})
	.on('dragenter dragend dragover drop dragleave', function(ev) {
		ev.preventDefault()
		ev.stopPropagation()
	})
	.on('drop', ev => handleFile(ev.originalEvent))

	$('#up-victim').on('change', ev => handleFile(ev.originalEvent))
	$('#import-draft').click(() => $('#up-victim').click())
}

function switchTab(tab) {
	$('.tab').removeClass('tab-selected')
	$(jq`#tab-${tab}`).addClass('tab-selected')
	$('#catalog').removeClass('tab-default tab-custom tab-offline tab-drafts').addClass(`tab-${tab}`)
	localStorage['cat-tab'] = tab
}

/*function displayErrorToggle(text) {
	$('#errmsgbox').fadeToggle('fast').find('.error-message').text(text || '')
}*/

var errorBoy = {
	pushError: function(msg) {
		$('#error-wrapper').append(html`<div class="errmsgbox" onclick="this.remove()">
			<svg id="close-errmsg" class="icon"><use xlink:href="#i-x"></use></svg>
			<p class="error-message">${_.escape(msg)}</p>
		</div>`)
	}
}

var list = {
	init: function(vers) {
		let versMap = {}
		vers.forEach(v => versMap[v.origin] = v.origin)
		this.versions = versMap
		localStorage['catalogVersions'] = JSON.stringify(versMap)

		this.sortable = Sortable.create(document.querySelector('#boardlist'), {
			handle: '.dragger',
			animation: 150,
			onSort: this.sync.bind(this)
		})
		
		let myList = localStorage['myChans_new']
		, myListUpdated = []
		if (myList) {
			try {
				myList = JSON.parse(myList)
			}
			catch(e) {
				console.error(e)
				localStorage.removeItem('myChans_new')
				myList = null
			}
			if (myList && myList.length) {
				myList.forEach(ich => {
					let actual = catalog.chanByID(ich.id)
					if (actual) {
						myListUpdated.push(actual)
					}
				})
			}
		}
		if (!myList) {
			$('.included-chan').each(function() {
				myListUpdated.push(this._libdata)
			})
		}
		this.add(myListUpdated)
	},
	add: function(chans) {
		arrayify(chans).forEach(chan => {
			['catbg', 'offset'/*, 'included'*/].forEach(prop => delete chan[prop])
			let $ch = $(this.buildChan(chan))
			$ch[0]._libdata = chan
			$('#boardlist').append($ch)
			$(jq`#cat_${chan.id}`).addClass('installed')
		})
		this.sync()
	},
	buildChan: function(chan) {
		let name = _.escape(chan.name)
		, ballSrc = chan.ball || html`/chans/balls/${chan.section}/${chan.section == 'drafts' ? 'no-ball' : chan.id}.png?uid=${chan._id}${chan.ballv ? `&v=${chan.ballv}` : ''}`
		return html`<li class="list-chan" id="installed_${chan.id}" data-id="${chan.id}">
			<img src="${ballSrc}" class="list-chanball">
			<div class="dragger"><svg class="icon"><use xlink:href="#i-drag"></use></div>
			<div class="list-chan-title">${name || 'Без имени'}</div>
			<div class="delete-chan" onclick="javascript:list.remove('${chan.id}')"><svg class="icon"><use xlink:href="#i-x"></use></div>
		</li>`
	},
	toggle: function(chan) {
		if (_.includes(this.sortable.toArray(), chan.id)) {
			this.remove(chan.id)
		}
		else {
			this.add(chan)
		}
	},
	remove: function(id) {
		$(jq`#installed_${id}`).remove()
		$(jq`#cat_${id}`).removeClass('installed')
		this.sync()
	},
	sync: function() {
		let res = []
		document.querySelectorAll('.list-chan').forEach(ch => {
			res.push(ch._libdata)
		})
		localStorage.removeItem('compiledCSS')
		localStorage['myChans_new'] = JSON.stringify(res)
	}
}

var catalog = {
	add: function(chans, section) {
		arrayify(chans).forEach(chan => {
			if (!chan.section) {
				chan.section = section || (chan.offline ? 'offline' : (chan.default ? 'default' : 'custom'))
			}
			chan.url = _.escape(chan.url)
			let $ch = $(this.buildChan(chan))
			$ch[0]._libdata = chan
			$('#catalog-contents').append($ch)
			this.css += this.makeOffset(chan)
		})
		$('#import-draft').insertAfter('.cat-chan:last')
		injector.inject('chan-offsets', this.css)
	},
	buildChan: function(chan) {
		console.log(chan.id)
		let name = _.escape(chan.name)
		, wiki = (chan.wiki && chan.wiki.match(/https?:\/\//)) ? chan.wiki : (conf.wiki+(chan.wiki || name))
		, search = `${chan.originalID || chan.id} ${name} ${chan.url.replace(/^https?:\/\//, '')} ${(chan.wiki || '').replace(/^https?:\/\//, '')}`
		, ballSrc = chan.ball || `/chans/balls/${chan.section}/${chan.section == 'drafts' ? 'no-ball' : chan.id}.png?uid=${chan._id}${chan.ballv ? `&v=${chan.ballv}` : ''}`
		return html`<div class="cat-chan sect-${chan.section} ${chan.included ? 'included-chan' : ''}" data-search="${search.toLowerCase()}" id="cat_${chan.id}">
			<div class="cc-ball-wrap" style="${makeGradient(chan.catbg)}">
				<img src="${ballSrc}" class="cc-ball"></img>
				<div class="channame-overlay">
					<a href="${chan.url}">${name}</a>
				</div>
			</div>
			<div class="cc-toolbar">
				<button class="cc-install">
					<span class="cci-i">Добавить</span>
					<span class="cci-u">Удалить</span>
				</button>
			</div>
			<div class="chan-options make-embed" title="Код для кнопки">
				<svg class="icon">
					<use class="co-code" xlink:href="#i-code"></use>
					<use class="co-close" xlink:href="#i-x"></use>
				</svg>
			</div>
			<a class="chan-options info-link" target="_blank" href="${wiki}" title="Информация">
				<svg class="icon"><use xlink:href="#i-info"></use></svg>
			</a>
			<textarea onclick="this.select()">${_.escape(`<script src="${document.location.origin || (document.location.protocol + '//' + document.location.host)}/embed/add.js" chan="${chan.id}"></script>`)}</textarea>
		</div>`
	},
	css: '',
	makeOffset: function(chan) {
		if (! chan.offset)
			return '';
		let left = chan.offset[0], top = chan.offset[1]
		, res = '', hov = ''
		if (left == 0 && top == 0)
			return '';
		;['', '-webkit-', '-ms-', '-moz-', '-o-'].forEach(prefix => {
			res += `${prefix}transform: translate(${left}px, ${top}px) scale(1); `
			hov += `${prefix}transform: translate(${Math.round(left * 0.66)}px, ${Math.round(top * 0.66)}px) scale(0.66); `
		})
		return `#cat_${chan.id.replace(/\!/g, '\\!')} .cc-ball {${res}}
			#cat_${chan.id.replace(/\!/g, '\\!')}:hover .cc-ball {${hov}}`
	},
	chanByID: id => {
		let ch = document.querySelector(jq`#cat_${id}`)
		if (ch && ch._libdata) {
			return ch._libdata
		}
		else return null
	},
	myDraftsRaw: [],
	syncRawDrafts: function() {
		localStorage['mydrafts'] = JSON.stringify({
			version: new Date().getTime(),
			chans: this.myDraftsRaw
		})
	}
}

function arrayify(arr) {
	return (arr instanceof Array) ? arr : [arr]
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

function makeGradient(colors) {
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


NodeList.prototype.forEach = Array.prototype.forEach;

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

var conf = {
	wiki: 'http://wiki.1chan.ca/'
}

function reloadFrame() {
	parent.frames.list.document.location.reload()
	parent.openMenu()
}

window.addEventListener("message", () => {
	parent.frames.live.document.location.reload()
}, false)

function handleFile(ev) {
	let files = (ev.type == "drop") ? ev.dataTransfer.files : ev.target.files
	, f = files[0]

	if (f) {
		var reader = new FileReader()
		
		reader.onload = (function() {
			return (function(e) {
				let imported = null
				try {
					imported = JSON.parse(e.target.result)
				}
				catch(err) {
					errorBoy.pushError('Не удалось разобрать JSON')
				}
				if (imported) {
					if (!(imported.name && imported.url && imported.id && imported.id.match(/^[a-z\-_0-9]+$/))) {
						errorBoy.pushError('Невозможно добавить черновик. Недостаточно данных.')
						return
					}
					if (_.find(catalog.myDraftsRaw, {id: imported.id})) {
						errorBoy.pushError('Черновик с таким id уже существует')
						return
					}
					catalog.myDraftsRaw.push(_.cloneDeep(imported))
					catalog.syncRawDrafts()
					imported.id += `!draft`
					catalog.add(imported, 'drafts')
				}
			}).bind(this)
		}).bind(this)(f)

		reader.readAsText(f)
	}
}

console.info('Я не на ангуляре. Не на ангуляре.')
