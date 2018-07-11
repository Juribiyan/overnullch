"use strict";

var IS_ADMIN = false;

const max_ball_size = {width: 300, height: 300}

const main = () => {
	if(LSfetchJSON('IS_ADMIN')) {
		IS_ADMIN = true
		$('body').addClass('is-admin')
	}

	$('#chan-library').toggleClass('expanded', localStorage['chanlib-expanded'] == 1)
	setTimeout(() => injector.inject('lib-collapse', `.collapsible-content {  transition: width 0.3s; }`), 100)

	$.ajaxSetup({
		dataType: 'json'
	})

	$('.tipper').each(function() {
		$(this).prepend(`
			<svg class="icon t-i-q"><use xlink:href="#i-question"></use></svg>
			<svg class="icon t-i-e"><use xlink:href="#i-warning"></use></svg>
			<svg class="icon t-i-s spinning"><use xlink:href="#i-spinner"></use></svg>
			<svg class="icon t-i-ok"><use xlink:href="#i-check"></use></svg>`)
	})
	.append(`<div class="tooltip-wrap error-msg"><div class="tooltip"></div></div>`)
	
	$('.validable')
	.each(function() {
		let $tipper = $(this).parents('.tip-container').find('.tipper')
		this.showErrors = mkErrorShower($tipper)
		this.errorDescriptors = {
			'too-long': 'Слишком длинное значение поля',
			'too-short': 'Слишком короткое значение поля',
			'invalid': 'Неверный формат данных',
			'missing': 'Поле обязательно для ввода',
			'occupied': 'Значение занято'
		}
		if ($(this).attr('pattern'))
			this.patternRX = new RegExp($(this).attr('pattern'))
		this.validate = (silent, isDraft) => {
			return new Promise((resolve, reject) => {
				let $this = $(this)
				, val = $this.val()
				, errors = []

				val = val.trim()
				$this.val(val)

				if (val) {
					let maxlength = $this.attr('maxlength')
					, minlength = $this.attr('minlength')
					
					if (minlength && val.length < minlength)
						errors.push(`Слишком короткое значение поля (нужно минимум ${minlength} симв.)`)

					if (this.patternRX && !val.match(this.patternRX)) 
						errors.push('invalid')

					let vconv = $this.data('valconvert')
					if (vconv && validations.hasOwnProperty(vconv)) {
						val = validations[vconv](val)
					}

					if (maxlength && val.length > maxlength)
						errors.push(`Превышена макс. длина поля (${maxlength} символов)`)
				}
				else {
					if ($(this).prop('required')) {
						errors.push('missing')
					}
				}

				let finalize = () => {
					if (! silent)
						this.showErrors(errors)
					if (! errors.length) {
						$tipper.setTipperState('valid')
						resolve(val)
					}
					else {
						if (isDraft)
							resolve(val)
						else
							reject(errors)
					}
				}

				let afterValid = $this.data('aftervalid')
				if (! errors.length) {
					$tipper.setTipperState('spinner')
					if (afterValid && validations[afterValid]) {
						validations[afterValid](val, $this.data('uniq'))
						.then(() => finalize(), err => {
							errors.push(err)
							finalize()
						})
					}
					else finalize()
				}
				else finalize()
			})
		}
	})
	.on('focus', function() {
		let $this = $(this)
		, $sect = $this.parents('.tip-container')
		, $tipper = $sect.find('.tipper')
	})

	$('.validable:not(.no-val-onblur)').on('blur', function() { 
		this.validate().then(_.noop, _.noop)
	})
	
	$('#color-selector .colorbox').change(gradient.update.bind(gradient))

	$('#change-direction').click(function() {
		let $use = $(this).find('use')
		, minus = $use.attr('transform').indexOf('-90') < 0
		$use.attr('transform', `rotate(${minus ? '-' : ''}90 8 8)`)
		var _from = $('#bgc-from')[0], _to = $('#bgc-to')[0];
		var _ref = [_to.id, _from.id];
		_from.id = _ref[0];
		_to.id = _ref[1];
		gradient.update()
	})

	$('body')
	.on('click', '.add-board', function() {
		tree.addBoard($(this))
	})
	.on('click', '.delboard', function() {
		tree.removeBoard($(this))
	})
	.on('click', '.delcat', function() {
		let $cat = $(this).parents('.tree-cat')
		if ($cat.hasClass('predelete') || $cat.hasClass('empty'))
			tree.removeCategory($(this))
		else
			$cat.addClass('predelete')
	})
	.on('click', '.cat-undelete', function() {
		$(this).parents('.tree-cat').removeClass('predelete')
	})
	.on('click', '.f-minus, .f-plus', function() {
		$(this).parents('.tree-cat').toggleClass('hidden')
	})
	.on('click', '.add-cat', tree.addCategory.bind(tree))
	.on('input', '.board-dir', function() {
		$(this).parents('.cat-brd').toggleClass('external', !! $(this).val().match(/^https?:\/\//))
	})
	.on('mouseup mouseleave blur touchend touchcancel', function(ev) {
		isMouseDown = false
	})
	.on('click', '.delstream', function() { radio.removeStream($(this)) })
	.on('click', '.templatize', function() {
		$(this).parents('.stream').toggleClass('templated').find('.stream-range').focus()
	})
	.on('blur', '#tree input', tree.validateUI.bind(tree))
	.on('click', '.lib-chan', function() {
		libchan.load(this._libdata)
	})
	.on('dragenter dragend dragover drop dragleave', function(ev) {
		ev.preventDefault()
		ev.stopPropagation()
	})
	.on('dragenter', function(ev) {
		$(this).addClass('dropping')
		clearTimeout(this.offTimeout)
	})
	.on('dragend drop dragleave', function(ev) {
		if (ev.currentTarget === ev.target) {
			this.offTimeout = setTimeout(() => {
				$(this).removeClass('dropping')
			}, 100)
		}
	})
	.on('click', '.export-draft', function(ev) {
		ev.stopPropagation()
		let $ch = $(this).parent('.lib-chan')
		, data = $ch[0]._libdata
		downloadJSON(data, data.id)
	})

	$('.chanball-wrap')
	.on('dragenter dragend dragover drop dragleave', function(ev) {
		ev.preventDefault()
		ev.stopPropagation()
	})
	.on('dragenter dragover', function(ev) {
		$(this).addClass('file-over')
		clearTimeout(this.offTimeout)
	})
	.on('dragend drop dragleave', function(ev) {
		this.offTimeout = setTimeout(() => {
			$(this).removeClass('file-over')
		}, 100)
	})
	.on('drop', ball.handleFile.bind(ball))

	$('#radio-editor').on('blur', 'input', () => {
		radio.getData().then(_.noop, _.noop)
	})

	var isMouseDown = false

	$('.chanball-dropzone').click(() => $('#chanballFileInput').click())
	$('#chanballFileInput').on('change', ball.handleFile.bind(ball))

	$('#view-toggle .switch-body').click(() => tree.toggleView())
	$('#view-toggle label').click(function(ev) {
		tree.toggleView($(this).text())
	})

	$('#reup-chanball').click(() => {
		$('#chanballFileInput').click()
	})

	$('.password-reveal').on('mousedown', function() {
		$(this).parent().find('input').attr('type', 'text')
	})
	.on('mouseleave mouseup', function() {
		$(this).parent().find('input').attr('type', 'password')
	});

	$('#pswd').on('focus', function() {
		this.removeAttribute('readonly')
	})
	.on('blur', function() {
		this.setAttribute('readonly', true)
	})

	$('.cb-position-tweaker button')
	.on('mousedown touchstart', function() {
		isMouseDown = true
		let inc = override => {
			if (!override && !isMouseDown)
				return clearInterval(this.incrementor)
			let $input = $(this).parent().find('input')
			, inc = +$(this).data('inc')
			$input.val(+$input.val() + inc)
			ball.offset()
		}
		inc(true)
		this.incrementor = setInterval(inc, 150)
	})
	.parent().find('input').on('input paste change', ball.offset)

	$('#tree-json').on('blur', function() {
		tree.validateJSON()
	})

	$('#chan-name').on('input paste change', function() {
		$('.channame-overlay').text($(this).val())
	})

	$('#color-theme input.color').change(styles.update.bind(styles))
	$('#less-enter').on('input', styles.update.bind(styles))

	$('#less-preamble').html(styles.preamble('html'))
	$('#less-enter').val(styles.base)

	$('.binded').each(function() {
		let $this =  $(this)
		, bindID = $this.data('bind')
		, $b = $(jq`#${bindID}`)
		if (! $b.length) return;
		$b.on('input change paste', function() {
			$this.text($(this).val() || `{${bindID}}`)
		}).trigger('change')
	})
	window.updateBindings = () => {
		$('.binded').each(function() {
			$(jq`#${$(this).data('bind')}`).trigger('change')
		})
	}

	$('#advance-less').change(function() {
		let $area = $('#less-enter');
		if ($(this).prop('checked')) {
			$('.advanced-less').slideDown(() => {
				$area.prop('disabled', 0)
				if ($area[0].preValue)
					$area.val($area[0].preValue)
			})
		}
		else {
			$area[0].preValue = $area.val()
			$area.val(styles.base).prop('disabled', 1)
		}
		styles.update()
	})

	$('.captcha').addClass('not-loaded').click(ev => refreshCaptcha(ev.ctrlKey || ev.altKey))
	
	$('.widget-list input').on('change', function() {
		$(jq`#${$(this).attr('name')}`).toggle($(this).prop('checked'))
	})

	$('.expander').click(function() {
		$(this).parents('.expandee').toggleClass('expanded')
	})

	$('#onchan').on('change', function() {
		$('.chan').toggleClass('onchan', $(this).prop('checked'))
	})

	styles.update()

	$('#add-stream').click(radio.addStream.bind(radio))

	Sortable.create(document.querySelector('#categories'), {
		handle: '.cat-dragger',
		animation: 150
	})

	Sortable.create(document.querySelector('#streams'), {
		handle: '.dragger',
		animation: 150
	})

	$('.sidebar').click(toggleLib)

	let lastTab = 'default'
	$('.tab').click(function() {
		let tabID = $(this).data('tab')
		, $lib = $('#chan-library')
		, f = false
		if (tabID === 'search') {
			if ($lib.hasClass('show-search'))
				tabID = lastTab
			else
				f = true
		}
		else lastTab = tabID
		$lib.find('.tab').removeClass('selected')
		$lib.find(`.tab[data-tab=${tabID}]`).addClass('selected')
		$lib.removeClass('show-custom show-default show-drafts show-search').addClass(`show-${tabID}`)
		f && $('#searchbox').focus()
	})

	$('#searchbox').on('input paste', function() {
		let val = $(this).val().trim().replace(/\"/g, '\\"').toLowerCase()
		if (val.length)
			injector.inject('lib-search', `.show-search .lib-chan[data-search *= "${val}"] {height: 40px}`)
		else
			injector.remove('lib-search')
	})

	upForm.init()

	$.getJSON(`/chans/chans.json?v=${new Date().getTime()}`)
	.done(data => library.build(data.chans)) 

	$('#new-chan').click(() => libchan.clear())
	$('#clone-this').click(() => libchan.clone())
	$('#publish').click(() => upForm.toggle('upload'))
	$('#delete-this').click(() => upForm.toggle('delete'))
	$('#save-draft').click(() => drafts.submit())

	function saveAsNewDraft() {
		libchan.setMode('new', 'drafts')
		drafts.submit(1)
		return false
	}
	$('#draft-saveasnew').click(saveAsNewDraft)
	$('#draft-changeid').click(() => {
		drafts.remove(libchan.current.id)
		saveAsNewDraft()
	})
	$('#draft-savemodifiedid').click(() => {
		$('#chan-id').val($('#proposed-id').text())
		drafts.submit()
		return false
	})
	$('#draft-overwrite').click(() => {
		drafts.remove($('#id-to-overwrite').text())
		drafts.submit()
		return false
	})

	drafts.load()
}

function refreshCaptcha(switch_lang=false) {
	$('.captcha').attr('src', `/captcha.php?color=255,255,255&v=${Math.random()}${switch_lang ? '&switch' : ''}`).removeClass('not-loaded')
	$('#captcha').val('')
}

function toggleLib(on) {
	$('#chan-library').toggleClass('expanded', on)
	localStorage['chanlib-expanded'] = +$('#chan-library').hasClass('expanded')
}

var gradient = {
	make: (direction, stop1, stop2) =>
		(direction !== 'radial') 
			? `linear-gradient(to ${direction}, ${stop1} 0%, ${stop2} 100%)`
			: `radial-gradient(ellipse at center, ${stop1} 0%, ${stop2} 100%)`,
	prefixify: function(input) {
		var res = /(((?:radial|linear)-gradient)\((?:(ellipse) at center|(-?[0-9]+)deg|to (right|bottom)), ?(.+)\));?/i.exec(input);
		if (res === null) return 'background:' + input;
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
	},
	getValue: function() {
		let stop1 = '#' + $('#bgc-from').val()
		, stop2 = '#' + $('#bgc-to').val()
		return this.make('bottom', stop1, stop2)
	},
	update: function() {
		let grad = this.getValue()
		injector.inject('chanball-background', `.chanball-wrap { ${this.prefixify(grad)} }`)
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

var ball = {
	handleFile: function(ev) {
		ev.stopPropagation()
		ev.preventDefault()
		ev = ev.originalEvent

		$('body').removeClass('dropping')

		let files = (ev.type == "drop") ? ev.dataTransfer.files : ev.target.files
		, f = files[0]

		if (f && f.type == 'image/png') {
			var reader = new FileReader()
			
			reader.onload = (function(theFile) {
				return (function(e) {
					this.setBall(e.target.result)
				}).bind(this)
			}).bind(this)(f)

			reader.readAsDataURL(f)
		}
		else if(f)
			this.showErrors('image-not-png')
	},
	setBall: function(chan) {
		let src
		if (typeof chan === 'string') {
			src = chan
		}
		else {
			if (! chan.ball) {
				if(chan.section !== 'drafts') {
					src = `/chans/balls/${chan.section}/${chan.id}.png?uid=${chan._id}${chan.ballv ? `&v=${chan.ballv}` : ''}`
				}
				else {
					this.clear()
					return
				}
			}
			else {
				src = chan.ball
			}
		}

		let $ball = $('#chanball').attr('src', src)
		$ball.one('load', () => {
			if ($ball.width() > max_ball_size.width || $ball.height > max_ball_size.height) 
				this.showErrors('image-too-large')
			else {
				this.file = src
				this.fType = src.indexOf('data:') === 0 ? 'dataURL' : 'file'
				this.showErrors([])
				$('#chanball-sect').addClass('chanball-present')
			}
		})

		gradient.update()
	},
	clear: function() {
		$('#chanball-sect').removeClass('chanball-present')
		this.file = null
	},
	getData: function(isDraft) {
		return new Promise((resolve, reject) => {
			let errors = []
			if (!this.file)
				errors.push('no-file')
			
			let offset = ['left', 'top'].map(pos => {
				let $input = $(jq`#position-tweak-${pos}`)
				, val = +$input.val()
				if (isNaN(val))
					val = 0
				if (Math.abs(val) > 100)
					val = 100 * Math.sign(val)
				$input.val(val)
				return val
			})

			, catbg = ['from', 'to'].map(stop => {
				let $input = $(jq`#bgc-${stop}`)
				, val = $input.val()
				if (! val.match(/[0-9a-f]{6}/i)) {
					val = 'ffffff'
					$input[0].jscolor.fromString(val)
				}
				return val
			})

			this.offset()
			gradient.update()

			this.showErrors(errors)

			if (errors.length && !isDraft) 
				reject(errors)
			else resolve({
				ball: this.fType === 'file' ? 'default' : this.file,
				offset: offset,
				catbg: catbg
			})
		})
		
	},
	toDataURL: function() {
		if (this.fType == 'data' || !this.file)
			return
		getDataUri(this.file, data => {
			this.file = data,
			this.fType = 'data'
		})
	},
	errorDescriptors: {
		'no-file': 'Изображение отсутствует',
		'image-not-png': 'Неверный тип файла (должен быть PNG)',
		'image-too-large': 'Размер файла не должен превышать 200 пкс',
		'upload-error': 'Ошибка при сохраненнии файла'
	},
	file: null, fType: null,
	offset: function() {
		let top = +$('#position-tweak-top').val(),
		left = +$('#position-tweak-left').val()
		$('#chanball').css({
			'transform': `translate(${left}px, ${top}px)`,
			'-webkit-transform': `translate(${left}px, ${top}px)`,
			'-ms-transform': `translate(${left}px, ${top}px)`,
			'-moz-transform': `translate(${left}px, ${top}px)`,
			'-o-transform': `translate(${left}px, ${top}px)`
		})
		return [top, left]
	},
	showErrors: mkErrorShower('ball')
}

var tree = {
	build: function(cats) {
		var htm= ''
		if (cats) {
			if(typeof cats === 'string') {
				try {
					cats = JSON.parse(cats)
				}
				catch (e) {
					this.toggleView('JSON', true)
					$('#tree-json').val(cats)
					return
				}
			}
			if (cats.length && this.isFlat(cats)) 
				cats = [{name: '', boards: cats}]
			cats.forEach(cat => {
				htm += this.buildCat(cat)
			})
		}
		$('#categories').html(htm)
		
		document.querySelectorAll('.tree-cat ul').forEach(this.makeBoardsSortable.bind(this));

		$('#tree-json').val(JSON.stringify(this.deconstruct(), null, '\t'))

		return this.validateUI()
	},
	isFlat: cats => cats[0].hasOwnProperty('dir'),
	boardHeight: 24,
	addBoardButtonHeight: 27,
	buildCat: function(cat) {
		cat.boards = cat.boards || []
		var boards = this.buildBoards(cat.boards)
		, empty = (cat.boards.length === 0)
		, maxHeight = (cat.boards.length+1) * this.boardHeight + this.addBoardButtonHeight
		return `<div class="tree-cat ${empty ? 'empty': ''}">
		<div class="tree-cathead">
			<svg class="icon f-plus" title="Развернуть"><use xlink:href="#i-folder-plus-fill"></use></svg>
			<svg class="icon f-minus" title="Свернуть"><use xlink:href="#i-folder-minus-fill"></use></svg>
			<svg class="icon f-empty"><use xlink:href="#i-folder-empty"></use></svg>
			<input type="text" class="cat-title" value="${_.escape(cat.name) || ''}"></input>
			<button class="b-option cat-undelete" title="Отменить удаление">
				<svg class="icon"><use xlink:href="#i-undo"></use></svg>
			</button>
			<div class="cat-dragger" title="Сортировать категории">
				<svg class="b-option icon"><use xlink:href="#i-drag"></use></svg>
			</div>
			<button class="b-option delb delcat" title="Удалить категорию">
				<svg class="icon"><use xlink:href="#i-x"></use></svg>
			</button>
		</div>
		<div class="tree-catboards" style="max-height: ${maxHeight}px">${boards}</div></div>`
	},
	buildBoards: function(boards) {
		var htm ='<ul>'
		boards.forEach(brd => {
			htm += this.buildBoard(brd)
		})
		htm += `</ul><button class="tree-add add-board" title="Добавить доску">
			<div class="inner-border">
				<svg class="icon"><use xlink:href="#i-slash-plus-slash"></use></svg>
			</div>
		</button>`
		return htm
	},
	buildBoard: brd => escHTML
	`<li class="cat-brd ${brd.external ? 'external' : ''}">
		<input type="text" class="board-dir" value="${brd.dir || brd.url || ''}">
		<input type="text" class="board-desc" value="${brd.desc || ''}">
		<div class="dragger" title="Сортировать доски"><svg class="b-option icon"><use xlink:href="#i-drag"></use></svg></div>
		<button class="b-option delb delboard" title="Удалить доску"><svg class="icon"><use xlink:href="#i-x"></use></svg></button>
	</li>`,
	recalcHeight: function($brds) {
		if (!($brds instanceof jQuery)) 
			$brds = $($brds).parent()
		let n = $brds.find('.cat-brd').length
		, px = (n+1) * this.boardHeight + this.addBoardButtonHeight
		$brds.css({'max-height': `${px}px`})
		$brds.parent().toggleClass('empty', n == 0)
	},
	addBoard: function($btn, board) {
		board = board || {}
		$btn.parent().find('ul').append(this.buildBoard)
		this.recalcHeight($btn.parent())
		$btn.parent().find('.cat-brd:last input:first').focus()
	},
	removeBoard: function($btn) {
		let $parent = $btn.parents('.tree-catboards')
		$btn.parents('.cat-brd').remove()
		this.recalcHeight($parent)
		this.validateUI()
	},
	addCategory: function(cat) {
		if (!cat.hasOwnProperty('boards'))
			cat = {name: '', boards: []}
		let $cat = $(this.buildCat(cat))
		this.makeBoardsSortable($cat.find('ul')[0])
		$('#categories').append($cat)
		$cat.find('.cat-title').focus()
	},
	removeCategory: function($btn) {
		$btn.parents('.tree-cat').remove()
		this.validateUI()
	},
	makeBoardsSortable: function(el) {
		Sortable.create(el, {
			handle: '.dragger',
			animation: 150, 
			group: 'boards',
			onAdd: ev => {
				[ev.from, ev.to].forEach(this.recalcHeight.bind(this))
				this.validateUI()
			}
		})
	},
	validateJSON: function() {
		try {
			let cats = JSON.parse($('#tree-json').val())
			this.build(cats)
			return 1
		}
		catch (e) {
			this.showErrors(e)
			$('#view-toggle').shake()
			return 0
		}
	},
	validateUI: function(isDraft) {
		let errors = []
		, obj = this.deconstruct()

		if ($('#tree .invalid').length)
			_.keys(this.errorDescriptors).forEach(r => {
				if ($(jq`#tree .invalid.inv_${r}`).length) 
					errors.push(r)
			})

		let allDirs = []
		, walkCat = brd => allDirs.push(brd.external ? brd.url : brd.dir)

		let catNames = []
		obj.forEach(cat => {
			catNames.push(cat.name)
			cat.boards.forEach(walkCat)
		})
		let dupCats = findDuplicates(catNames)
		if (dupCats.length) {
			errors.push('mul-cat')
			let $cats = $('.cat-title')
			dupCats.forEach(i => $($cats[i]).addClass('invalid'))
		}

		let dupDirs = findDuplicates(allDirs)
		if (dupDirs.length) {
			errors.push('mul-dir')
			let $dirs = $('.board-dir')
			dupDirs.forEach(i => $($dirs[i]).addClass('invalid'))
		}

		this.showErrors(errors)
		return (errors.length && !isDraft) ? false : obj
	},
	deconstruct: function() {
		$('#tree .invalid').removeClass('invalid ' + 
			_.map(_.keys(this.errorDescriptors), k => `inv_${k}`).join(' '))
		let cats = []
		, $cats = $('.tree-cat')
		, flat = false
		if ($cats.length == 1)
			flat = true
		$('.tree-cat').each(function() {
			var $cat = $(this)
			, boards = []
			, $boards = $cat.find('.cat-brd')
			if (! $boards.length)
				$cat.addClass('invalid inv_empty-dir')
			else $boards.each(function() {
				let $desc = $(this).find('.board-desc')
				, desc = $desc.val().trim()
				if (!desc) 
					$desc.addClass('invalid inv_no-desc')
				let board = {desc: desc}

				let $dir = $(this).find('.board-dir')
				, dir = $dir.val().trim()
				if (!dir)
					$dir.addClass('invalid inv_no-dir')

				let external = !! dir.match(/^https?:\/\//)
				$(this).toggleClass('external', external)
				board[external ? 'url' : 'dir'] = dir
				if (external) 
					board.external = true

				boards.push(board)
			})

			let $name = $cat.find('.cat-title')
			, name = $name.val().trim()
			if (!flat && ! name) {
				$name.addClass('invalid inv_no-name')
			}
			cats.push({
				name: name,
				boards: boards
			})
		})
		return cats
	},
	toggleView: function(to, isDraft) {
		let current = $('#chan-structure').hasClass('sw_UI') ? 'UI' : 'JSON'

		if (typeof to === 'undefined') 
			to = current=='UI' ? 'JSON' : 'UI'

		if (current == to)
			return null

		if (to === 'JSON') {
			$('#tree-json').val(JSON.stringify(this.deconstruct(), null, '\t'))
		}

		else {
			let JSON_valid = this.validateJSON()
			if (isDraft)
				return $('#tree-json').val()/*.replace(/\t|\n/g, '')*/
			else if (! JSON_valid) 
				return false
		}

		$('#chan-structure')
		.removeClass('sw_UI sw_JSON')
		.addClass(`sw_${to}`)

		return 1
	},
	errorDescriptors: {
		'no-name': 'Пустое название раздела',
		'no-dir': 'Пустой путь доски',
		'no-desc': 'Пустое название доски',
		'mul-dir': 'Повторяющиеся имена досок',
		'mul-cat': 'Повторяющиеся имена разделов',
		'empty-dir': 'Пустой раздел',
		'bad-json': 'JSON — инвалид'
	},
	showErrors: mkErrorShower('struct')
}

function mkErrorShower(id) {
	return function(errs) {
		if (! (errs instanceof Array))
			errs = [errs]
		let $tipper = id instanceof jQuery ? id : $(jq`#${id}-tipper`)
		, $msgbox = $tipper.find('.error-msg .tooltip')
		, any = errs.length > 0
		, mul = errs.length > 1
		let htm = (mul ? `Обнаружены ошибки: <ul>` : '')
		+ errs.reduce((htm, er) => htm + escHTML`${mul ? '<li>' : ''}${this.errorDescriptors && this.errorDescriptors[er] || er}${mul ? '</li>' : ''}`, '')
		+ (mul ? '</ul>' : '')
		$msgbox.html(htm)
		$tipper.setTipperState(any ? 'error-tip' : 'question')
		if (any) 
			$tipper.shake()
		if(this instanceof HTMLElement) {
			$(this).toggleClass('invalid', any)
		}
	}
}

$.fn.shake = function() {
	this.addClass('shake')
	setTimeout(() => this.removeClass('shake'), 900)
}
$.fn.setTipperState = function(state) {
	this.removeClass(_.without(['question', 'error-tip', 'spinner', 'valid'], state).join(' '))
	.addClass(state)
}

/*function hasDuplicates(a) {
	return _.uniq(a).length !== a.length; 
}*/

function findDuplicates(arr) {
	let dubs = []
	arr.forEach((el, i) => {
		if (arr.length - _.without(arr, el).length > 1)
			dubs.push(i)
	})
	return dubs
}

var styles = {
	preamble: function(role) {
		let vars = []
		;['chan-id', 'bgColor', 'linkColor'].forEach(v =>
			vars[v] = (role == 'html')
				? `<span class="binded" data-bind="${v}"></span>`
				: $(jq`#${v}`).val()
		)
		if (role == 'less')
			vars['chan-id'] = 'css-preview'
		return `.chan-${vars['chan-id']} {`+
			`\n  @bgcolor: #${vars.bgColor};`+
			`\n  @linkcolor: #${vars.linkColor};`;
	},
	update: function(callback) {
		callback = (typeof callback === 'function') ? callback : null
		let userCode = this.parseInput()
		if (!userCode) {
			if (callback)
				callback(false)
			return
		}
		let lessCode = this.preamble('less') + userCode + '}';
		less.render(lessCode).then(r => {
			injector.inject('chanclass-preview', r.css)
			if (callback)
				callback(true)
		},
		err => {
			this.showErrors(err.message)
			if (callback)
				callback(false)
		})
	},
	getData: function(isDraft) {
		return new Promise((resolve, reject) => {
			let res = {
				colors: ['bg', 'link'].map(c => {
					let $input = $(jq`#${c}Color`)
					, val = $input.val()
					if (! val.match(/[0-9a-f]{6}/i)) {
						val = $input.attr('value')
						$input[0].jscolor.fromString(val)
					}
					return val
				})
			}
			if ($('#advance-less').prop('checked')) {
				res.advanced_less = lessFormatter.minify($('#less-enter').val())
				this.update(succ => {
					if (isDraft || succ) 
						resolve(res) 
					else 
						reject()
				})
			}
			else resolve(res)
		})
	},
	errorDescriptors: {
		'bracket-imbalance': 'Скобки не сбалансированы',
		// 'parent-selector': 'Использование родительского селектора (&) запрещено (за исключением классов и псевдоклассов)'
	},
	parseInput: function() {
		let errors_found = []
		, val = $('#less-enter').val()
		// check for bracket balance | http://codereview.stackexchange.com/a/15339
		let brackets = val.replace(/\/\*.+?\*\/|".+?"|'.+?'/, '').replace(/[^()\[\]{}]/g, '')
		, isBalanced = (function(str) {
			var bracket = {
				"]": "[",
				"}": "{",
				")": "("
			},
			openBrackets = [], 
			isClean = true,
			i = 0,
			len = str.length;

			for(; isClean && i<len; i++ ){
				if ( bracket[ str[ i ] ] ){
					isClean = ( openBrackets.pop() === bracket[ str[ i ] ] );
				}else{
					openBrackets.push( str[i] );
				}
			}
			return isClean && !openBrackets.length;
		})(brackets)
		
		if (!isBalanced)
			errors_found.push('bracket-imbalance')

		// check for parent selectors
		/*if (val.match(/&(?![:\.])/))
			errors_found.push('parent-selector')*/

		this.showErrors(errors_found)

		return errors_found.length ? false : val
	},
	showErrors: mkErrorShower('style'),
	reset: function() {
		;['bg', 'link'].forEach(field => {
			let $input = $(jq`#${field}Color`)
			$input[0].jscolor.fromString($input.data('default'))
		})
		$('#advance-less').prop('checked', 0).trigger('change')
		this.update()
		$('#custom-css').prop('checked', 0).trigger('change')
	}
}

styles.base = `background: @bgcolor;
a, .chan-overlay .icon {
	color: @linkcolor;
}
&:hover {
	background: darken(@bgcolor, 8%);
}
&.onchan {
	box-shadow: inset -2px 0 fadeout(@linkcolor, 25%);
}
& when (lightness(@bgcolor) < 70%) {
	color: #C3C3C3;
	a:hover, .ch-name:hover, .icon:hover, .rw-playpause:hover, .volumeter:hover {
		color: white;
	}
	.board:hover {
		background: rgba(255, 255, 255, .08);
	}
}
& when (lightness(@bgcolor) > 70%) {
	color: #404040;
	a:hover, .ch-name:hover, .icon:hover, .rw-playpause:hover, .volumeter:hover {
		color: black;
	}
	.board:hover {
		background: rgba(0, 0, 0, .08);
	}
}
`;


var radio = {
	buildStream: strm => escHTML
	`<li class="stream${strm.n ? ' templated' : ''}">
		<input type="text" class="stream-name" placeholder="Название стрима" title="Название стрима" maxlength="20" value="${strm.name || ''}">
		<input type="text" class="stream-range" placeholder="Диапазон" title="Диапазон" maxlength="20" value="${strm.n || ''}">
		<div class="stream-options">
			<button class="b-option templatize" title="Размножать по шаблону"><svg class="icon">
				<use class="for-templated-hide" xlink:href="#i-template"></use>
				<use class="for-templated-show" xlink:href="#i-untemplate"></use>
			</svg></button>
			<div class="dragger" title="Сортировать стримы"><svg class="b-option icon"><use xlink:href="#i-drag"></use></svg></div>
			<button class="b-option delstream" title="Удалить стрим"><svg class="icon"><use xlink:href="#i-x"></use></svg></button><br>
		</div>
		<br>
		<input type="text" class="stream-path" placeholder="/path стрима" title="/path стрима" maxlength="50" value="${strm.path || ''}">
		<input type="text" class="stream-mime" placeholder="MIME стрима" title="MIME стрима" maxlength="20" value="${strm.mime || ''}">
	</li>`,
	addStream: function(strm) {
		strm = strm || {}
		let $strm = $(this.buildStream(strm))
		$('#streams').append($strm)
	},
	build: function(r) {
		$('#chan-radiourl').val(r.url)
		$('#streams').html(r.streams.reduce((htm, strm) => htm + this.buildStream(strm), ''))
	},
	removeStream: $btn => $btn.parents('.stream').remove(),
	reset: function() {
		this.build({url: '', streams: []})
		$('#radio-editor').hide()
		$('#radio').prop('checked', false)
	},
	getData: function(isDraft) { //aka validate
		return new Promise((resolve, reject) => {
			let proceed = (url, errors) => {
				errors = errors ? errors.map(v => `URL: ${v}`) : []
				$('#chan-radiourl').toggleClass('invalid', !!errors.length)

				$('#streams input').removeClass('invalid ' + 
					_.map(_.keys(this.errorDescriptors), k => `inv_${k}`).join(' '))
				let streams = []
				, $streams = $('.stream')
				if (! $streams.length)
					errors.push('no-streams')
				else {
					$streams.each(function() {
						let $strm = $(this)
						, stream = {}
						;['name', 'path', 'mime'].forEach(prop => {
							let $input = $strm.find(`.stream-${prop}`)
							, val = $input.val()
							if(!val)
								$input.addClass(`invalid inv_no-${prop}`)
							stream[prop] = val
						})

						streams.push(stream)

						if ($strm.hasClass('templated')) {
							let $range = $strm.find(`.stream-range`)
							, n = $range.val()
							if (! n)
								$range.addClass('invalid inv_no-range')
							else if(! mixedRange(n).length)
								$range.addClass('invalid inv_bad-range')
							else
								stream.n = n
						}
					})

					if ($('#streams .invalid').length)
						_.keys(this.errorDescriptors).forEach(r => {
							if ($(jq`#streams .invalid.inv_${r}`).length) 
								errors.push(r)
						})

					;['name', 'path'].forEach(prop => {
						let dupProps = findDuplicates(_.pluck(streams, prop))
						if (dupProps.length) {
							errors.push(`mul-${prop}`)
							let $inputs = $(jq`.stream-${prop}`)
							dupProps.forEach(i => $($inputs[i]).addClass('invalid'))
						}
					})
				}

				this.showErrors(errors)

				if (!isDraft && errors.length)
					reject(errors)
				else
					resolve({
						url: url,
						streams: streams
					})
			}
			$('#chan-radiourl')[0].validate(true).then(val => {
				proceed(val, null)
			},
			errors => {
				proceed(null, errors)
			})
		})
	},
	showErrors: mkErrorShower('radio'),
	errorDescriptors: {
		'no-streams': 'Добавьте хотя бы один стрим',
		'no-name': 'Пустое имя стрима',
		'no-path': 'Пустая ссылка на стрим',
		'no-mime': 'Отсутствует MIME',
		'mul-name': 'Повторяющиеся имена стримов',
		'mul-path': 'Повторяющиеся ссылки на стримы',
		'no-range': 'Не введен диапазон размножения',
		'bad-range': 'Неверный формат диапазона размножения'
	}
}

var library = {
	build: function(chans, section) {
		chans.forEach(chan => this.addChan(chan, section || (chan.default ? 'default' : 'custom')))
	},
	buildChan: function(chan, section) {
		section = section || chan.section
		if (! section)
			return console.error('No section specified for buildChan()')
		let ballSrc = chan.ball || `/chans/balls/${section}/${section == 'drafts' ? 'no-ball' : chan.id}.png?uid=${chan._id}${chan.ballv ? `&v=${chan.ballv}` : ''}`
		, search = `${chan.id} ${chan.name} ${chan.url.replace(/^https?:\/\//, '')} ${(chan.wiki || '').replace(/^https?:\/\//, '')}`
		.toLowerCase().trim().replace(/[<>""]/g, '')
		, dlbtn = section === 'drafts' ? `
		<button class="btn export-draft">
			<svg class="icon" title="Экспортировать черновик"><use xlink:href="#i-download"></use></svg>
		</button>` : ''
		, htm = escHTML`<li class="lib-chan sect-${section}${!chan.name ? ' no-name' : ''}" id="chan_${chan.id}" data-search="${search}">
			<img src="${ballSrc}" class="lib-chanball">
			<div class="chan-title">${chan.name || 'Без имени'}</div>`+dlbtn+`
		</li>`
		, $chan = $(htm)
		chan.section = section
		$chan[0]._libdata = chan
		return $chan
	},
	addChan: function(chan, section, fresh) {
		if (typeof fresh === 'undefined') fresh = false
		section = section || chan.section
		if (! section)
			return console.error('No section specified for addChan()')
		let $chan = this.buildChan(chan, section)
		$chan.appendTo('#chans')
		fresh && this.highlight($chan)
		let libdata = $chan[0]._libdata
		return libdata
	},
	editChan: function(chan) {
		let $chan = $(jq`#chan_${chan.id}`)
		, libdata = $chan[0]._libdata
		_.assign(libdata, chan)
		$chan.replaceWith(this.buildChan(libdata, libdata.section))
		this.highlight($(jq`#chan_${chan.id}`))
		return libdata
	},
	deleteChan: function(id) {
		$(jq`#chan_${id}`).remove()
	},
	highlight: function($chan) {
		let sect = $chan[0]._libdata.section
		$(jq`.tab[data-tab=${sect}]`).click()
		$chan.addClass('fresh')
		toggleLib(true)
	}
}

var libchan = {
	load: function(chan) {
		upForm.toggle()

		this.current = chan

		this.current.default = +(chan.section == 'default')
		this.current.included = +chan.included

		this.setMode('edit', chan.section)

		$('#chan-id').val(chan.id)
		$('#chan-name').val(chan.name).trigger('input')
		$('#chan-url').val(chan.url)
		$('#chan-wiki').val(chan.wiki || '')
		$('#chan-userboards').val(chan.userboards || '')
		$('#chan-userboards_catname').val(chan.userboards_catname || '2.0')
		$('#chan-userboards_system').val(chan.userboards_system || 'instant')
		
		ball.setBall(chan)

		let offset = chan.offset || [0, 0]
		$('#position-tweak-left').val(offset[0])
		$('#position-tweak-top').val(offset[1])
		ball.offset()

		$('#bgc-from')[0].jscolor.fromString(chan.catbg[0])
		$('#bgc-to')[0].jscolor.fromString(chan.catbg[1])
		gradient.update()

		$('#chan-prefix').val(chan.prefix || '')
		$('#chan-postfix').val(chan.postfix || '')

		tree.build(chan.boards)

		$('#custom-css').prop('checked', !!chan.colors)
		if (chan.colors) {
			$('#color-theme').show()
			$('#bgColor')[0].jscolor.fromString(chan.colors[0])
			$('#linkColor')[0].jscolor.fromString(chan.colors[1])
			if (chan.advanced_less) {
				$('#advance-less').prop('checked', 1).trigger('change')
				$('#less-enter').val(lessFormatter.prettify(chan.advanced_less))
			}
			else {
				$('#less-enter').val(lessFormatter.prettify(styles.base))
				$('#advance-less').prop('checked', 0).trigger('change')
			}
			styles.update()
		}
		else {
			styles.reset()
		}
		
		if (chan.radio) {
			$('#radio-editor').show()
			radio.build(chan.radio)
			$('#radio').prop('checked', true)
		}
		else {
			radio.reset()
		}

		$('#default').prop('checked', chan.section === 'default')
		$('#included').prop('checked', !!chan.included)

		this.rinse()
	},
	_schema: {
		integrity: {
			required: ['id', 'name', 'url', 'boards', 'ball', 'offset', 'catbg'],
			optional: ['userboards', 'prefix', 'postfix', 'wiki', 'radio', 'colors', 'advanced_less', 'userboards_catname', 'userboards_system'],
			adminOnly: ['default', 'included']
		},
		specialComps: {
			pairs: ['catbg', 'offset', 'colors'],
			objects: ['boards', 'radio'],
			isNewBall: ['ball']
		},
		conversions: {
			toFile: ['ball']
		},
		defaults: {
			'': ['userboards', 'prefix', 'postfix', 'wiki'],
			'FFFFFF|FFFFFF': ['catbg'],
			'0|0': ['offset'],
			'2C333D|37C999': ['colors'],
			'2.0': ['userboards_catname'],
			'instant': ['userboards_system']
		},
		fns: {
			objects: _.eq.bind(_),
			pairs: (first, second) => {
				let vals = [first, second].map(val => (val instanceof Array) ? val.join('|').toLowerCase() : val)
				return vals[0] === vals[1]
			},
			isNewBall: (cur, nu) => cur ? (nu===cur) : (nu==='default'),
			toFile: v => v.indexOf('data:') === 0 ? v.toBlob() : v
		}
	},
	init: function() {
		let allProps = []
		, schema = {}

		_.each(this._schema.integrity, (props, intCls) => {
			props.forEach(prop => {
				schema[prop] = {}
				schema[prop][intCls] = true
				if (intCls === 'optional')
					schema[prop].default = null
			})
		})

		_.each(this._schema.specialComps, (props, cmpCls) => {
			props.forEach(prop => {
				schema[prop].eqFn = this._schema.fns[cmpCls]
			})
		})

		_.each(this._schema.conversions, (props, convCls) => {
			props.forEach(prop => {
				schema[prop].conv = this._schema.fns[convCls]
			})
		})

		_.each(this._schema.defaults, (props, defCls) => {
			props.forEach(prop => {
				schema[prop].default = defCls
			})
		})

		/*schema.offset.default = '0|0'
		schema.catbg.default = 'ffffff|ffffff'
*/
		this.schema = schema
	},
	mode: 'new',
	setMode: function(mode, section) {
		this.mode = mode
		$('body').toggleClass('edit-draft', mode === 'edit' && section === 'drafts')
		$('#chan-id, #save-draft').prop('disabled', mode === 'edit' && section !== 'drafts')
		$('#clone-this, #delete-this').prop('disabled', mode === 'new')
	},
	rinse: () => {
		$('.tipper').setTipperState('question')
		$('input').removeClass('invalid')
	},
	collectData: function(role) {
		let isDraft = (role === 'draft')
		return new Promise((resolve, reject) => {
			let chan = {}
			, dataPromises = []
			// basic data
			;['url', 'name', 'id', 'wiki', 'userboards', 'userboards_catname', 'prefix', 'postfix'].forEach(prop => {
				let pr = $(jq`#chan-${prop}`)[0].validate(0, isDraft).then(val => {
					chan[prop] = val
				})
				dataPromises.push(pr)
			})
			// ball data
			dataPromises.push(ball.getData(isDraft).then(data => {
				_.assign(chan, data)
			}))
			// tree data
			dataPromises.push(new Promise((resolve, reject) => {
				let treeToUI = tree.toggleView('UI', isDraft)
				if (treeToUI)
					resolve(treeToUI)
				else {
					if (treeToUI === false)
						reject()
					else {
						let validUI = tree.validateUI(isDraft)
						if (validUI)
							resolve(validUI)
						else
							reject()
					}
				}
				chan.boards = (tree.toggleView('UI') === false) ? false : tree.validateUI()
			}).then(data => {
				chan.boards = data
			}))
			chan.userboards_system = $('#chan-userboards_system').val()
			// options: radio
			if ($('#radio').prop('checked')) {
				dataPromises.push(radio.getData(isDraft).then(data => {
					chan.radio = data
				}))
			}
			// options: styles
			if ($('#custom-css').prop('checked')) {
				dataPromises.push(styles.getData(isDraft).then(data => {
					_.assign(chan, data)
				}))
			}
			// options: admy
			if (IS_ADMIN) {
				let admy = {}
				;['default', 'included'].forEach(prop => {
					admy[prop] = +$(jq`#${prop}`).prop('checked')
				})
				_.assign(chan, admy)
			}

			Promise.all(dataPromises).then(() => resolve(chan), () => reject('fix-errors'))
		})
	},
	proceedWithData: function(role, isUpload) {
		let mode = (isUpload && this.current && this.current.section === 'drafts') ? 'new' : this.mode
		return new Promise((resolve, reject) => {
			let fd = new FormData(), chan = {}
			, errors = []
			this.collectData(role).then(data => {
				if (mode === 'edit' && libchan.current.id !== data.id) {
					errors.push('id-changed')
				}
				_.each(this.schema, (propSchema, prop) => {
					let val

					if (propSchema.adminOnly && !IS_ADMIN)
						return

					if (! data.hasOwnProperty(prop)) {
						if (propSchema.required)
							errors.push('fill-required-fields')
						else
							val = null
					}
					else
						val = data[prop]

					if (mode === 'edit' && prop !== 'id') {
						let cur = libchan.current.hasOwnProperty(prop) ? libchan.current[prop] : propSchema.default
						if (propSchema.eqFn ? propSchema.eqFn(cur, val) : (cur===val))
							return
					}
					else if (val === null)
						return

					chan[prop] = val
					if (role === 'upload') {
						if (propSchema.conv)
							val = propSchema.conv(val)
						fd.apnd(prop, val)
					}
				})

				if (errors.length) {
					reject(_.uniq(errors))
				}
				else {
					if (DO_DEBUG)
						console.log(chan)
					resolve({
						obj: chan,
						fd: fd
					})
				}
			}, 
			errors => {
				reject(errors)
			})
		})
	},
	clone: function() {
		this.setMode('new')
		ball.toDataURL()
		$('#chan-id').val('')
		$('#chan-name')[0].value += ' (клон)'
		$('#chan-name').trigger('input')
	},
	clear: function() {
		;['url', 'name', 'id', 'wiki', 'userboards', 'prefix', 'postfix']
		.forEach(field => $(jq`#chan-${field}`).val(''))
		$('#chan-userboards_catname').val('2.0')
		ball.clear()
		;['from', 'to'].forEach(field => $(jq`#bgc-${field}`)[0].jscolor.fromString('ffffff'))
		gradient.update()
		;[radio, styles].forEach(w => w.reset())
		tree.build('[]')
		tree.toggleView('UI')
		this.rinse()
		this.current = null
		this.setMode('new')
		upForm.toggle()
	}
}

var drafts = {
	model: [],
	load: function() {
		let lsDrafts = localStorage['mydrafts']
		if (lsDrafts) 
			try {
				let parsed = JSON.parse(lsDrafts)
				if (typeof parsed !== 'object' || !parsed.hasOwnProperty('chans'))
					throw new Error()
				this.model = parsed.chans
			}
			catch (e) {
				console.error('Drafts in localStorage are corrupted and will be purged')
				localStorage.removeItem('mydrafts')
			}
		library.build(this.model, 'drafts')
	},
	remove: function(id) {
		this.model.splice(_.findIndex(this.model, {id: id}), 1)
		library.deleteChan(id)
		libchan.setMode('new')
		this.sync()
	},
	add: function(chan, over) {
		let libdata = library.addChan(chan, 'drafts', 1)
		this.model.push(chan)
		libchan.current = libdata
		libchan.setMode('edit', 'drafts')
	},
	edit: function(chan) {
		let edited = library.editChan(chan)
		this.model[_.findIndex(this.model, {id: chan.id})] = edited
	},
	sync: function() {
		localStorage['mydrafts'] = JSON.stringify({
			chans: this.model,
			version: new Date().getTime()
		})
	},
	submit: function(over) {
		let newid = $('#chan-id').val()
		if (libchan.mode === 'edit' && libchan.current.id !== newid) {
			$("#id-to-change").text(libchan.current.id)
			upForm.toggle('prompt pr-idchanged')
			return
		}
		else if (libchan.mode === 'new' && _.find(this.model, {id: newid})) {
			$("#id-to-overwrite").text(newid)
			let guro = /(.+?)(\d+)$/.exec(newid)
			$("#proposed-id").text(guro ? `${guro[1]}${(+guro[2])+1}` : `${newid}2`)
			upForm.toggle('prompt pr-idexists')
			return
		}
		else {
			upForm.toggle()
		}
		libchan.proceedWithData('draft')
		.then(res => {
			let draft = res.obj
			if (libchan.mode === 'edit') {
				this.edit(draft)
			}
			else {
				this.add(draft)
			}
			this.sync()
		}, errors => {
			upForm.showErrors(errors)
		})
	}
}

libchan.init()

var lessFormatter = {
	minify: less => less.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim(),
	prettify: function(less) {
		return css_beautify(this.minify(less).replace(/([;{}])/g, '$1\n').replace(/^\s+/gm, '').trim(), {
			'indent_char': '\t', 
			'indent_size': 1, 
			'newline_between_rules': false
		});
	}
}

var validations = {
	urlencode: val => encodeURI(val),
	checkuniq: (val, prop) => {
		return new Promise((resolve, reject) => {
			if(libchan.mode === 'edit' && libchan.current[prop]===val) {
				resolve()
				return
			}
			$.get(`api.php?checkuniq&prop=${prop}&val=${encodeURIComponent(val)}`)
			.then(data => {
				if (data.error)
					reject('occupied')
				else 
					resolve()
			})
			.fail(er => {
				console.error('XHR error during post-validation', er)
				reject('XHR error')
			})
		})
	}
}

// eeeee prototypes
NodeList.prototype.forEach = Array.prototype.forEach;
NodeList.prototype.map = Array.prototype.map;
FormData.prototype.apnd = function(k, v) {
	if (typeof v === 'object' && !( v instanceof Blob ))
		this.append(k, JSON.stringify(v))
	else
		this.append(k, v)
}
FormData.prototype.inspect = function() {
	for (var pair of this.entries()) {
		console.log(pair[0]+ ' = ' + pair[1]); 
	}
}
// Functions ooriginally from here:
// http://stackoverflow.com/a/30407959/1561204
Blob.prototype.readAsDataURL = function(callback) {
	let fr = new FileReader();
	fr.onload = ev => callback(ev.target.result)
	fr.readAsDataURL(this);
}
String.prototype.toBlob = function() {
	try {
		let arr = this.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		while(n--){
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], {type:mime});
	}
	catch (e) {
		console.error(e)
		return false
	}
}

// https://davidwalsh.name/convert-image-data-uri-javascript
function getDataUri(url, callback) {
	var image = new Image();

	image.onload = function () {
		var canvas = document.createElement('canvas');
		canvas.width = this.naturalWidth;
		canvas.height = this.naturalHeight;
		canvas.getContext('2d').drawImage(this, 0, 0);
		callback(canvas.toDataURL('image/png'));
	};

	image.src = url;
}

function mixedRange(input) {
	var m
	, output = []
	, re = /(?:([0-9]+)(?:\-([0-9]+))?(?:, ?)?)/g;
	
	while ((m = re.exec(input)) !== null) {
		if (m.index === re.lastIndex) {
			re.lastIndex++;
		}
		if(m[2]) {
			output = output.concat(_.range(m[1], +m[2]+1))
		}
		else
			output.push(+m[1])
	}

	return output
}

var upForm = {
	$form: null,
	init: function() {
		this.$form = $('#upload-form').on('submit', this.submit.bind(this))
		_.each(this.actorFieldMap, (fields, actor) => {
			fields.forEach(field => this.fieldActorMap[field] = actor)
		})
	},
	toggle: function(type) {
		if (! type)
			this.$form.removeClass('expanded')
		else {
			this.$form.removeClass('f-upload f-delete f-prompt pr-idchanged pr-idexists').addClass(`f-${type} expanded`)
			let draftDelete = libchan.current && libchan.current.section === 'drafts' && type === 'delete'
			$('#upload-form input').prop('required', !draftDelete)
			if (!draftDelete && $('.captcha').hasClass('not-loaded'))
				refreshCaptcha()
		}
	},
	checkFields: function() {
		return $('#pswd').val() && $('#captcha').val()
	},
	submit: function(ev) {
		ev.preventDefault()
		let action = this.$form.hasClass('f-delete') ? 'delete' : 'upload'
		if (libchan.current && libchan.current.section === 'drafts') {
			if (action === 'delete') {
				drafts.remove(libchan.current.id)
				this.toggle()
				return
			}
		}
		if (! this.checkFields()) 
			return this.showErrors('fill-required-fields')
		this.$form.addClass('busy')
		if (action == 'upload') {
			libchan.proceedWithData(action, true)
			.then(res => {
				this.candidate = res.obj
				this.send(libchan.mode, res.fd)
			}, errors => {
				this.showErrors(errors)
				this.$form.removeClass('busy')
			})
		}
		else {
			let fd = new FormData()
			$('#chan-id')[0].validate(1).then(id => {
				fd.apnd('id', id)
				this.candidate = {id: id}
				this.send('delete', fd)
			}, 
			e => console.error(e))
		}
	},
	send: function(action, fd) {
		if (libchan.current && libchan.current.section === 'drafts')
			action = 'new'
		fd.apnd('action', action)
		fd.apnd('captcha', $('#captcha').val())
		fd.apnd('password', $('#pswd').val())
		if (DO_DEBUG)
			fd.inspect()

		var request = new XMLHttpRequest()
		request.open("POST", "api.php")
		request.send(fd);
		let _this = this
		request.onload = function(e) {
			if(this.status == 200) {
				let res = 0
				try {
					res = JSON.parse(this.response)
				}
				catch (e) {
					console.error(e)
					console.warn(this.response)
					_this.unbusy()
					_this.showErrors('invalid-response')
				}
				if (res)
					_this.handleResponse(res)
			}
			else {
				_this.unbusy()
				_this.showErrors('xhr-error')
				console.error(e)
			}
		}
	},
	showErrors: mkErrorShower('submit'),
	errorDescriptors: {
		'fill-required-fields': 'Заполните необходимые поля',
		'xhr-error': 'Ошибка XHR. Подробности в консоли.',
		'invalid-response': 'Ошибка XHR (неверный формат ответа). Подробности в консоли.',
		'id-changed': 'ID был нелегально изменен.',
		'nothing-to-edit': 'Нечего редактировать',
		'missing': 'Не введен пароль',
		'wrong-captcha': 'Капча введена неверно',
		'wrong-password': 'Неверный пароль',
		'fix-errors': 'Исправьте ошибки!',
		'db-error': 'Ошибка при записи в БД',
		'not-admin': 'Непохоже, что вы администратор',
		'wrong-value': 'Неверное значение',
		'chan-does-not-exist': 'Запись отсутствует в БД'
	},
	actorFieldMap: {
		ball: ['ball', 'catbg', 'offset'],
		styles: ['colors', 'advanced_less'],
		tree: ['boards'],
		radio: ['radio'],
		admin: ['admin']
	},
	fieldActorMap: {},
	unbusy: function() {
		this.$form.removeClass('busy')
		refreshCaptcha()
	},
	handleResponse: function(res) {
		this.unbusy()
		if (res.error) {
			let errors = res.error
			if (! (errors instanceof Array)) 
				errors = [errors]
			errors = errors.map(err => {
				if (! err.field) {
					err = {
						field: this,
						msg: err
					}
				}
				else {
					let $input = $(jq`#chan-${err.field}`)
					if ($input.length && $input[0].showErrors) {
						err.field = $input[0]
					}
					else {
						if (this.fieldActorMap.hasOwnProperty(err.field)) {
							err.field = window[this.fieldActorMap[err.field]]
						}
						else {
							err.field = this
						}
					}
				}				
				return err
			})
			let fields = _.uniq(_.pluck(errors, 'field'))
			if (! _.includes(fields, this)) {
				errors.push({
					field: this,
					msg: 'fix-errors'
				})
				fields.push(this)
			}
			fields.forEach(field => {
				let messages = _.pluck(_.filter(errors, {field: field}), 'msg')
				.map(msg => this.errorDescriptors[msg] || msg)
				field.showErrors(_.uniq(messages))
			})
		}
		else {
			this.showErrors([])
			if (res.action === 'new-success') {
				// library.deleteChan(upForm.candidate.id)
				drafts.remove(upForm.candidate.id)
				delete this.candidate.ball
				let sect = (this.candidate.section && this.candidate.section === 'default') ? 'default' : 'custom'
				let added = library.addChan(this.candidate, sect, true)
				libchan.load(added)
				console.log(upForm.candidate.id, this.candidate, sect);
				// libchan.setMode('edit', sect)
			}
			if (res.action === 'edit-success') {
				if (res.moveto) {
					// console.log(`Gotta move it to ${res.moveto}`);
					this.candidate.section = res.moveto
				}
				let edited = library.editChan(this.candidate)
				libchan.load(edited)
			}
			if (res.action === 'delete-success') {
				library.deleteChan(this.candidate.id)
				libchan.setMode('new', 'draft')
			}
			this.toggle()
		}
	}
}

const DO_DEBUG = false;

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
, escHTML = makeEscapeTagLiteralFn(_.escape)

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

function downloadJSON(obj, name) {
	var dlAnchorElem = document.getElementById('dl-victim')
	dlAnchorElem.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj)))
	dlAnchorElem.setAttribute("download", `${name}.json`)
	dlAnchorElem.click()
}