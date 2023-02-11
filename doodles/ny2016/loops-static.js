var defaultPattern = "G|GG|GGG|GGGG|GGGGG|GGGGGG|GGGG|GGGGG|GGGGGG|GGGGGGG|GGGGGGGG|GGGGGG|GGGGGGG|GGGGGGGG|GGGGGGGGG|GGGGGGGGGG|GGGGGGGGGGG|gg|gg";
var urlprefix = "loops/loops/";
var fileFormat = (function() {
	var testAudio  = document.createElement("audio");
	return (typeof testAudio.canPlayType === "function" && testAudio.canPlayType("audio/ogg") !== "")
})() ? 'ogg' : 'mp3';


function readyset() {
	$canvas = $('#bars');
	drawContext = $canvas[0].getContext('2d');

	/*bufferCanvas = $('#bufferCanvas')[0];
	bufferContext = bufferCanvas.getContext('2d');*/
	
	Grid.init('#nullgrid');

	$('body *').mousedown(function() {
		isMouseDown = true;
	})
	.on('mouseup dragend', function() {
		isMouseDown = false;
	});

	// nerdmode inputs
	updateRanges();
	$('.nm-block input[type=range]').on('input', function() {
		var prop = $(this).attr('name');
		if(prop === 'fft_size') {
			conf[prop] = Math.pow(2, $(this).val());
			try {
				visualizer.analyser.fftSize = conf.fft_size;
				$('label[for=fft_size] .indicator').removeClass('illegal')
			}
			catch(e) {
				$('label[for=fft_size] .indicator').addClass('illegal')
			}
		}
		else
			conf[prop] = +$(this).val();
		updateRanges(prop);
	});
	$('.nm-block input[name="domain"]').change(function() {
		conf.domain = $(this).val();
		if(conf.domain === 'time') {
			$('#smoothingBlock').addClass('disabled');
			var $range = $('input[name=treshold]');	
			if($range.val() < 0.5) {
				conf.treshold = 0.5;
				updateRanges('treshold')
			}
			$range.attr('min', 0.5);
		}
		else {
			$('#smoothingBlock').removeClass('disabled');
			$('input[name=treshold]').attr('min', 0);
		}
	})

	$('#enterNerdmode').click(function() {
		$('#nerdmode').slideToggle('fast');
	})

	document.querySelector('#overlays').addEventListener('touchmove', function(ev) {
		_.each(ev.targetTouches, function(touch) {
			var el = document.elementFromPoint(touch.pageX, touch.pageY);
			if(el.hasOwnProperty('_tl'))
				el._tl.progress(0)
		})
	}, false)

	/* Loop library */
	$.getJSON('playlist.json?'+Math.random())
	.done(function(data) {
		loopLibs.default = new TrackList(data, '#default-loops', 'default', true, $('#ltab-default i.sorter'), 'date', 'desc', true, $('#ltab-default i.play-enabler'));
	})
	.fail(console.error);
	$('.scrollable').mCustomScrollbar({theme:"minimal-dark", scrollInertia: 200});

	/* Track name autoscroll */
	$('.lt-contents').on('mouseenter', '.track', function() {
		var $trackName = $(this).find('.track-name');
		if($trackName[0].scrollWidth <= $trackName[0].offsetWidth) return;
		$trackName.stop().addClass('no-overflow');
		$trackName.animate({
			scrollLeft: $trackName.width()
		}, $trackName.width()*15, 'linear');
	})
	.on('mouseleave', '.track', function() {
		var $trackName = $(this).find('.track-name');
		if($trackName[0].scrollWidth <= $trackName[0].offsetWidth) return;
		$trackName.stop().animate({
			scrollLeft: 0
		}, 'slow', 'linear', function() {
			$trackName.removeClass('no-overflow');
		});
	})

	/* Lib header */
	$('.lib-search').click(function() {
		$(this).toggleClass('active').parents('.library').toggleClass('search-active').find('input').focus()
	});
	$('.ltab-close, .ptab-close').click(function() {
		$(this).parents('.library').removeClass('open-lib select-mode');
	});
	$('.tab-switch').click(function() {
		var tabgroup = $(this).data('tabgroup');
		$('.tab-switch.tabgroup-'+tabgroup).removeClass('active');
		if(!$(this).hasClass('active'))
			$(this).addClass('active');
		$('.tab-contents.tabgroup-'+tabgroup).hide();
		$('#'+$(this).data('tab')).show();
	});
	$('.tab-to-select-by-default').click();

	/* track play on click */
	$('#loop-library')
	.on('click', '.track .i-play', function() {
		var hash = $(this).parents('.track').data('hash')		// unique hashname of the track
		, libID = $(this).parents('.tracklist-section').data('id');		//library ID
		loopLibs[libID].playTrackByHash(hash);
	}) /* track download menu */
	.on('click', '.track-options .i-download-menu', function(ev) {
		ev.stopPropagation();
		$('.track').removeClass('dl-track ed-track')
		$(this).parents('.track').addClass('dl-track')
	})
	.on('click', '.track-name', function(ev) {
		$('.track').removeClass('dl-track ed-track')
	})
	.on('click', '.track', function(ev) {
		if($(this).parents('.library').hasClass('select-mode')) {
			ev.stopPropagation();
			var hash = $(this).data('hash');
			if($(this).parents('.library').hasClass('select-mode'))
				$('#loop-toassoc').val(hash);
		}
	});

	/* track search (Jets.js method) */
	$('#loop-search').on('input', function() {
		var query = $(this).val().toLowerCase().replace(/\"/, '\\"');
		try {
			injector.remove('loop-search');
		} catch(e) {}
		if(query.length)
			injector.inject('loop-search', '.search-active#loop-library .track:not([data-name *= "'+query+'"]) { display:none; }');
		else
			injector.inject('loop-search', '.search-active#loop-library .track { display:none; }');
	}).trigger('input');

	/* pattern search (same) */
	$('#pattern-search').on('input', function() {
		var query = $(this).val().toLowerCase().replace(/\"/, '\\"');
		try {
			injector.remove('pattern-search');
		} catch(e) {}
		if(query.length)
			injector.inject('pattern-search', '.search-active#pattern-library .pattern:not([data-name *= "'+query+'"]) { display:none; }');
		else
			injector.inject('pattern-search', '.search-active#pattern-library .pattern { display:none; }');
	}).trigger('input');

	/* Pattern applying and menu */
	$('#pattern-library')
	.on('click', '.pattern-name', function() {
		var libID = $(this).parent().data('lib')
		, patternID = $(this).parent().data('id');

		if($(this).parents('.library').hasClass('select-mode')) 
			$('#pattern-toassoc').val(patternID);
		else
			patternLibs[libID].applyPatternByID(patternID);
	});

	$('body').on('click', '.cell.over', AllTracks.random.bind(AllTracks))
}

var injector = {
  inject: function(alias, css) {
    var head = document.head || document.getElementsByTagName('head')[0]
      , style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'injector:' + alias;
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
  },
  remove: function(alias) {
  	var style = document.getElementById('injector:' + alias);
  	if(style) {
  		var head = document.head || document.getElementsByTagName('head')[0];
  		if(head)
  			head.removeChild(document.getElementById('injector:' + alias));
  	}
  }
}

var loopLibs = {}, patternLibs = {};

function updateRanges(name) {
	var nameSel = (typeof name === "undefined") ? '' : '[name="'+name+'"]';
	if(nameSel !== 'domain')
		$('input[type=range]'+nameSel).each(function() {
			var prop = $(this).attr('name');
			if(prop === 'fft_size') 
				$(this).val(Math.log2(conf[prop]));
			else 
				$(this).val(conf[prop]);
			var val = ((prop === 'tresholdCorrection' && conf[prop] > 0) ? '+' : '')+conf[prop];
			$(this).parent().find('.indicator').text(val);
		});
	if(nameSel === 'domain' || nameSel === '') {
		$('#rb-'+conf.domain).attr('checked', 'checked');
		if(conf.domain === 'time') 
			$('#smoothingBlock').addClass('disabled')
		else 
			$('#smoothingBlock').removeClass('disabled')
	}
};

var $canvas, drawContext;

var isMouseDown = false;

var Colors = {
	g: '#35752e', G: '#59c44d',
	y: '#7b7d25', Y: '#cccf41',
	o: '#805c22', O: '#d2993e',
	b: '#2e6d90', B: '#4eb6f1',
	c: '#7b273d', C: '#cc4368',
	v: '#4e1e84', V: '#8238d8',
	m: '#686868', M: '#d2d2d2',
	j: '#468172', J: '#37C999',
	'.': '_VOID_', '_': '_VOID_'
}
var colorMatch = new RegExp('(['+_.escapeRegExp(_.keys(Colors).join(''))+'])|\\[(.+?)\\]', 'g');
var colorMatchSqBr = new RegExp('(['+_.escapeRegExp(_.keys(Colors).join(''))+'])|(\\[.+?\\])', 'g');

var styles = {
	NY: function(color) {
		var baseColor = color.toHexString(), darkenColor = color.darken(10).toHexString(), darker = color.darken(30).toRgbString();
		return {
			u: 'background: radial-gradient(ellipse at center 7px, '+baseColor+' 0%, '+darkenColor+' 70%);',
			o: 'background: '+baseColor+'; box-shadow: '+baseColor+' 0px 0px 0px 0px, '+baseColor+' 0px 0px 0px 0px, '+darker+' 0px 0px 0px 0px'
		}
	}
}, 
defaultStyle = 'NY';

var globalCSS = {}

function xBrowserIsMouseDown() {
	return isMouseDown;
}
// stupid bug workaround
var isChrome = navigator.userAgent.match(/chrome\/([0-9]+)/i);
if(isChrome) {
	chromeVersion = isChrome[1];
	if(+chromeVersion >= 46)
	xBrowserIsMouseDown = function() {
		return $('body:active').length;
	}
}

var animations = {
  NY: function() {
    var color = this.style.backgroundColor
    , darken = tinycolor(color).darken(30).toRgbString()
    , rand = tinycolor.random().brighten(40).saturate(20)
    , ranDark = rand.darken(20).toRgbString();
    rand = rand.toRgbString();
    this._tl.to(this, 0.1, {
      opacity: 1,
      boxShadow: rand+' 0px 0px 2px 2px, '+rand+' 0px 0px 6px 6px, '+ranDark+' 0px 0px 10px 10px',
      background: rand
    }).to(this, 0.4, {
      opacity: 0,
      boxShadow: color+' 0px 0px 0px 0px, '+color+' 0px 0px 0px 0px, '+darken+' 0px 0px 0px 0px',
      background: color
    })
  }
}

var Grid = {
	init: function(sel) {
		this.$el = $(sel);
		var self = this;
		this.shuffler = new Rarity(50);
		if(this.lastOsc !== 'default')
			this.setOsc(this.lastOsc);
		this.changeStyle(this.baseStyle, this.pattern);
	},
	pattern: defaultPattern,
	baseStyle: defaultStyle,
	lastOsc: 'default',
	revert: function() {
		$('#osc-sel').val('default');
		this.changeStyle(this.baseStyle, this.pattern);
	},
	style: this.baseStyle,
	changeStyle: function(style,thenBuild) {
		if(!_.has(styles, style))
			return console.error('Не существует такого стиля');
		if(typeof thenBuild === 'undefined') thenBuild = false;
		this.style = style;
		injector.remove('cellstyle');
		if(_.has(globalCSS, style)) 
			injector.inject('cellstyle', globalCSS[style]);
		this.build(thenBuild);
	},
	generateCell: function(color, layer, style) {
		if(typeof style === 'undefined') style = this.style;
		var char = color.split(/[\[\]]/)[1] || color.split(/[\[\]]/)[0]
		, color = _.has(Colors, char) ? tinycolor(Colors[char]) : tinycolor(char)
		, cstring = _.has(Colors, char) ? char : ('#'+color.toHex().toLowerCase())
		, style = styles[style](color);
		if(color._format && color._a >= conf.colorAlphaTreshold) {
			if(layer == 'under')
				return $('<div data-c="'+cstring+'" class="cell under" style="'+style.u+'"></div>');
			else {
				var $cell = $('<div data-c="'+cstring+'" class="cell over" style="'+style.o+'"></div>');
				$cell[0]._tl = new TimelineLite()
				var blink = function() {
					this._tl.progress(0)
				}
				$cell[0].addEventListener('mouseenter', blink, false);
				$cell[0].addEventListener('touchstart', blink, false);
				return $cell;
			}
		}
		else {
			if(layer == 'under')
				return $('<div class="cell under void" data-c="_"></div>');
			if(layer == 'over')
				return $('<div class="cell void" data-c="_"></div>');
		}
	},
	lastBuild: {
		pattern: '',
		layer: '',
		style: ''
	},
	build: function(pattern, layer) {
		if(typeof pattern !== 'string') pattern = this.getPattern();
		if(typeof layer === 'undefined') layer = $('#grid-wrap').hasClass('edit-mode') ? 'under' : 'both';
		pattern = pattern
		.replace(/\s+/g, '')
		.replace(/\|{2,}/g, '|')
		.replace(/^\|/g, '')
		.replace(/\|$/g, '');
		// prevent same pattern rebuilding
		if(pattern === this.lastBuild.pattern && layer === this.lastBuild.layer && this.style === this.lastBuild.style) return;
		this.lastBuild.pattern = pattern; this.lastBuild.layer = layer; this.lastBuild.style = this.style;
		var $cells = this.$el.find('#cells'), $overlays = this.$el.find('#overlays');
		if(layer != 'over') $cells.find('.cell, br').remove();
		if(layer != 'under') $overlays.find('.cell, br').remove();
		var lines = pattern.split(/[|\/]/);
		_.each(lines, function(line, li) {
			var chars = _.compact(line.split(colorMatch));
			_.each(chars, function(char, ci) {
				if(layer != 'over')
					this.generateCell(char, 'under').attr('id', 'cu_'+li+'_'+ci).appendTo($cells)
				if(layer != 'under')
					this.generateCell(char, 'over').attr('id', 'co_'+li+'_'+ci).appendTo($overlays)
			}, this) // /each
			if(layer != 'over')
				$('<br>').appendTo($cells)
			if(layer != 'under')
				$('<br>').appendTo($overlays)
		}, this)
		//initial blink
		if(layer !== 'under')
			var style = this.style;
			$('.over').each(animations[style]);
		this.recount(layer);
	},
	getPattern: function() {
		var row = 0, code, output = '';
		this.$el.find('.cell.under').each(function() {
			if($(this).attr('id').split('_')[1] > row) {
				output += '|'; 
				row++;
			}
			code = $(this).data('c');
			if(code.length > 1) code = '['+code+']';
			output += code; 
		})
		return output;
	},
	recount: function(layer) {
		if(typeof layer === 'undefined') layer = $('#grid-wrap').hasClass('edit-mode') ? 'under' : 'over';
		var lc = (layer === 'under') ? 'under' : 'over';
		var cells = document.querySelectorAll('.cell.'+lc+':not(.void)');
		if(layer !== 'under') {
			this.cells = cells; 
			this.reshuffle();
			this.cellCount = this.cells.length;
			this.trimmingConstant = Math.floor(Math.sqrt(this.cellCount));
		}
		
		var primaryColor = (function(cc) {return _.invert(cc)[_.max(cc)]})(_.countBy(_.pluck(_.pluck(cells, 'dataset'), 'c')));
		this.primaryColor = _.has(Colors, primaryColor) ? Colors[primaryColor] : tinycolor(primaryColor).toHexString();
		
		if($('#osc-sel').val() == 'default') 
			this.setOsc('default');
		
		// resample layers
		var selfHeight = this.$el.find('#cells').height(), selfWidth = this.$el.find('#cells').width();
		$('.wrapper-xh').css({'top': ((selfHeight +  70) - conf.barHeight)+'px'});
		$('#shadow').width(selfWidth + 20);
		this.height = selfHeight / 20;
		this.width = selfWidth / 20; // where cell is 20×20
		var _x = this.width, _y = this.height;
		$('#sizeIndicator').text(_x+' × '+_y)
	},
	reshuffle: function() {
		this.cellsShuffled = _.shuffle(this.cells); 
	},
	rareShuffle: function() {
		this.shuffler.do(this.reshuffle.bind(this))
	},
	flash: function(i) {
		if(i+1 <= this.cellCount)
			this.cells[i]._tl.progress(0);
	},
	fuzzyFlash: function(i) {
		if(i+1 <= this.cellCount)
			if(Math.random() > conf.flashFuzziness)
				this.cells[i]._tl.progress(0);
			else {
				this.cellsShuffled[i]._tl.progress(0);
			}
	}
};

/* A U D I O */ 
var audio = {
	buffer: {},
	compatibility: {},
	supported: true,
	source_loop: {},
	source_once: {},
	disabled: true
};

var currentLoop = {};

var expectedLoop;

audio.stop = function(callback) {
	if(audio.source_loop._playing) {
		TweenLite.to(gainNode.gain, 0.2, {value: 0, onComplete: function() {
			audio.source_loop[audio.compatibility.stop](0);
			audio.source_loop._playing = false;
			audio.source_loop._startTime = 0;
			if (audio.compatibility.start === 'noteOn') {
				audio.source_once[audio.compatibility.stop](0);
			}
			if(typeof callback === "function") callback();
		}});
		$('.wrapper-decor').fadeOut();
	}	
	else if(typeof callback === "function") callback();
}

audio.loadLoop = function(immed, loop) {
	audio.disabled = true;
	var newLoop = {};
	if(typeof loop === 'object') {
		newLoop = loop;
	}
	else return console.log('unsupported')

	var req = new XMLHttpRequest();
	
	var expectedToken = ''+loop.original_hash+(new Date().getTime());
	expectedLoop = expectedToken;
		
	req.onload = function() {
		if(expectedToken === expectedLoop)
		audio.context.decodeAudioData(
			req.response,
			function(buffer) {
				conf.tresholdCorrection = +newLoop.treshold_correction || 0;
				audio.buffer = buffer;
				audio.source_loop = {};
				currentLoop  = newLoop;
				audio.disabled = false;
				if(immed) audio.play();
			}
		);
	};

	audio.stop(function() {
		req.open('GET', urlprefix+loop.section+'/'+loop.original_hash+'.'+fileFormat, true);
		req.responseType = 'arraybuffer';
		req.send();
	})
	
}

try {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audio.context = new window.AudioContext();
} catch(e) {
	audio.supported = false;
}

var visualizer = {}, gainNode;

if(audio.supported) {
	(function() {
		var start = 'start',
			stop = 'stop',
			buffer = audio.context.createBufferSource();
		if (typeof buffer.start !== 'function') {
			start = 'noteOn';
		}
		audio.compatibility.start = start;
		if (typeof buffer.stop !== 'function') {
			stop = 'noteOff';
		}
		audio.compatibility.stop = stop;
	})();
	gainNode = audio.context.createGain();
	gainNode.gain.value = 1;
	visualizer = new VisualizerSample();
	gainNode.connect(visualizer.analyser);
}



audio.play = function() {
	TweenLite.to(gainNode.gain, 0, {value: 1});
	if(audio.disabled) return AllTracks.random();

	if (audio.source_loop._playing) {
		audio.stop();
		$('#playSwitcher i').removeClass('i-pause-big').addClass('i-play-big')
	} 
	else {
		$('.wrapper-decor').fadeIn();

		audio.source_loop = audio.context.createBufferSource();
		audio.source_loop.buffer = audio.buffer;
		audio.source_loop.loop = true;
		audio.source_loop.connect(gainNode);
 
		if (audio.compatibility.start === 'noteOn') {
			audio.source_once = audio.context.createBufferSource();
			audio.source_once.buffer = audio.buffer;
			audio.source_once.connect(gainNode);
			audio.source_once.noteGrainOn(0, 0, audio.buffer.duration);

			audio.source_loop[audio.compatibility.start](audio.buffer.duration);
		} else {
			audio.source_loop[audio.compatibility.start](0, 0);
		}
		audio.source_loop._playing = true;

		if(!visualizer._drawing) {
			frame(visualizer.draw.bind(visualizer));
			visualizer._drawing = true;
		}
		$('#playSwitcher i').removeClass('i-play-big').addClass('i-pause-big')
	}

	return false;
};

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

var conf = {
	barWidth: 850,
	barHeight: 240,
	smoothing: 0.9,
	fft_size: 512,
	treshold: 0.78,
	tresholdCorrection: 0,
	domain: 'time',
	flashProbability: 0.3,
	flashFuzziness: 0.35,
	colorAlphaTreshold: 0.5,
	association: false,
	osc: true
};

function VisualizerSample() {
	this.analyser = audio.context.createAnalyser();

	this.analyser.connect(audio.context.destination);
	this.analyser.minDecibels = -100;
	this.analyser.maxDecibels = 0;
	try {
		this.analyser.fftSize = conf.fft_size;
		$('label[for=fft_size] .indicator').removeClass('illegal')
	}
	catch(e) {
		$('label[for=fft_size] .indicator').addClass('illegal')
	}
	this.times = new Uint8Array(this.analyser.frequencyBinCount);
}

VisualizerSample.prototype.draw = function() {
	this.analyser.smoothingTimeConstant = conf.smoothing;

	if(conf.domain === 'time')
		this.analyser.getByteTimeDomainData(this.times);
	else 
		this.analyser.getByteFrequencyData(this.times);

	if(conf.osc)
		drawContext.clearRect(0,0,conf.barWidth,conf.barHeight);
	
	for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
		/*striped osc*/
		drawContext.fillStyle = oscStripes.next();


		var value = this.times[i];
		var percent = value / 256;

		if(percent > (conf.treshold + conf.tresholdCorrection) && Math.random() < conf.flashProbability)
			Grid.fuzzyFlash(i)

		if(conf.osc) {
			var height = conf.barHeight * percent;
			var y = Math.ceil(conf.barHeight - height);
			drawContext.fillRect(i*4, y, 2, height);
		}
	}

	Grid.rareShuffle();

	frame(this.draw.bind(this));
}

VisualizerSample.prototype.getFrequencyValue = function(freq) {
	var nyquist = audio.context.sampleRate/2;
	var index = Math.round(freq/nyquist * this.freqs.length);
	return this.freqs[index];
}

var oscStripes = {
	colors: {
		r: '#ff0000',
		w: '#ffffff'
	},
	pattern: _.repeat('r', 27)+_.repeat('w', 27),
	next: function() {
		if(!this.hasOwnProperty('i'))
			this.i = 0;
		else this.i++;
		if(this.i >= this.pattern.length)
			this.i = 0;
		return this.colors[this.pattern[this.i]];
	}
}

function Rarity(trim) {
	this.n = 0;
	this.trim = trim;
	this.do = function(fn) {
		if(this.n >= this.trim) {
			fn();
			this.n = 0;
		}
		else this.n++;
	}
}

var currentCustomTrack = {
	name: null,
	ftype: null,
	buffer: null,
	blob: null
}


function dataURItoBlob(dataURI) {
  var arr = dataURI.split(','), mime = arr[0].match(/:(.*?);/)[1];
  return new Blob([atob(arr[1])], {type:mime});
}

function TrackList(tracklist, sel, id, flat, $sortButton, sortBy, order, playEnabled, $playEnabler) {
	this.$el = $(sel);
	this.id = id;
	this.isFlat = !!flat;

	this.playEnabled = playEnabled;
	this.$playEnabler = $playEnabler;
	this.$playEnabler.addClass(this.playEnabled ? 'i-play-enabled' : 'i-play-disabled');
	this.$playEnabler.on('click', (function(ev) {
		ev.stopPropagation();
		this.playEnabled = !this.playEnabled;
		this.$playEnabler.toggleClass('i-play-enabled i-play-disabled');
		AllTracks.populate(this.id, this.flatList, this.playEnabled);
	}).bind(this))

	// builds tracklist, sorted
	this.build = function() {
		var html = '';

		if(this.isFlat) {
			html += '<div class="tracklist-section" data-flat="1" data-section="'+this.id+'" data-id="'+this.id+'">';
			html += this.buildSection(this.list, this.id);
			html += '</div>';
		}
		else
			_.each(this.list, function(section, sectIndex) {
				html += '<div class="tracklist-section" data-flat="0" data-section="'+section.sectID+'" data-id="'+this.id+'">';
				html += '<h3 class="tls-title">'+section.title+'</h3>';
				html += this.buildSection(section.contents, section.sectID);
				html += '</div>';
			}, this);
		this.$el.html(html);
		AllTracks.populate(this.id, this.flatList, this.playEnabled);
	}

	this.scrollAdded = false;

	// builds flat tracklist or its section
	this.buildSection = function(list, sectID) {
		order = (typeof this.sortOrder === 'undefined') ? true : ((typeof this.sortOrder === 'string') ? ((this.sortOrder === 'asc') ? true : false) : this.sortOrder);
		var sortedList = _.sortByOrder(list, [this.sortBy, "id"], [order, order])
		, html = ''
		, foradmin = (this.id === 'default') ? ' foradmin-show' : '';

		_.each(sortedList, function(entry) {
			if(entry) {
				var swfName = (entry.hasOwnProperty('swf') && entry.swf) ? entry.swf.split('/').reverse()[0] : false
				, swfLink = swfName ? '<a target="_blank" href="loops/swf/'+entry.swf+'" download="'+swfName+'" class="dlo-dlbutton dlb-swf" title="Скачать оригинальный SWF"><i class="i-download-menu"></i> SWF</a> ' : ''
				, swfClass = swfName ? ' with-swf' : ''
				, fresh = (entry.hasOwnProperty('fresh') && entry.fresh) ? ' fresh' : ''
				, isPlaying = (currentLoop.hasOwnProperty('original_hash') && currentLoop.original_hash === entry.original_hash) ? ' playing' : ''
				, safeName = _.escape(entry.name)
				
				html += 
				'<div class="track'+swfClass+isPlaying+fresh+'" data-name="'+safeName.toLowerCase()+'" data-hash="'+entry.original_hash+'">\
					<i class="i-play"></i>\
					<div class="track-name">'+safeName+'</div>\
					<div class="download-options">'
						+swfLink+
						'<a target="_blank" href="loops/'+sectID+'/'+entry.original_hash+'.mp3" download="'+safeName+'.mp3" class="dlo-dlbutton dlb-mp3"><i class="i-download-menu"></i> MP3</a>\
						<a target="_blank" href="loops/'+sectID+'/'+entry.original_hash+'.ogg" download="'+safeName+'.ogg" class="dlo-dlbutton dlb-ogg"><i class="i-download-menu"></i> OGG</a>\
					</div>\
					<div class="track-duration">'+entry.duration+'</div>\
					<div class="track-options">\
						<i class="i-download-menu"></i>\
					</div>\
				</div>';
			}
			
		}, this);

		return html;
	}

	this.processList = function(list) {
		return _.each(list, function(entry) {
			if(entry.hasOwnProperty('date') && !entry.date instanceof Date)
				entry.date = new Date(entry.date);
			if(entry.hasOwnProperty('duration') && !isNaN(entry.duration)) {
				var totalSecs = +entry.duration;
				var minutes = Math.floor(totalSecs/60)+'';
				if(minutes.length == 1) minutes = '0'+minutes;
				var seconds = Math.round(totalSecs%60)+'';
				if(seconds.length == 1) seconds = '0'+seconds;
				entry.duration = minutes+':'+seconds;
			}
		})
	}

	this.sortOptions = [
		['date', 'desc', 'i-newfirst', "Сначала новые"],
		['date', 'asc', 'i-oldfirst', "Сначала старые"],
		['name', 'asc', 'i-a-z', "По алфавиту"],
		['name', 'desc', 'i-z-a', "По алфавиту"],
	];

	if(this.isFlat) {
		this.list = this.processList(tracklist);
		this.flatList = this.list;
	}
	else {
		this.list = _.map(tracklist, function(section) {
			var processedSection = section;
			processedSection.contents = this.processList(section.contents);
			return processedSection;
		}, this);
		this.flatList = _.flatten(_.pluck(this.list, 'contents'))
	}

	this.sortButton = $sortButton;
	this.sortButton.on('click', (function(ev) {
		ev.stopPropagation();
		this.sort()
	}).bind(this));
	this.sortState = _.findIndex(this.sortOptions, {0: sortBy, 1: order});

	this.sort = function(sortBy, order) {
		var sort;
		if(typeof sortBy === 'undefined') 
			this.sortState++;
		else {
			if(typeof order === 'undefined') order = 'asc';
			this.sortState = _.findIndex(this.sortOptions, {0: sortBy, 1: order});
		}
		if(this.sortState < 0 || this.sortState >= this.sortOptions.length)
			this.sortState = 0;
		sort = this.sortOptions[this.sortState];
		this.sortBy = sort[0];
		this.sortOrder = sort[1];
		this.build();
		this.sortButton.removeClass(_.pluck(this.sortOptions, 2).join(' ')).addClass(sort[2]);
		this.sortButton.attr('title', sort[3]);
	}

	this.sort(sortBy, order);

	this.playTrackByHash = function(hash, disableAssociation) {
		if(typeof disableAssociation === 'undefined') disableAssociation = false;
		var track = _.filter(this.flatList, {original_hash: ''+hash})[0];
		if(track) {
			audio.loadLoop(true, track);
			$('.track').removeClass('playing');
			$('.track[data-hash='+hash+']').addClass('playing');
			if(conf.association && !disableAssociation) {
				if(+track.associated_pattern) {
					_.each(patternLibs, function(lib) {
						lib.applyPatternByID(+track.associated_pattern, true);
					})
				}
				else Grid.revert();
			}
		}
		
	}

	this.getAllHashes = function() {
		return {
			playEnabled: this.playEnabled,
			tracks: _.pluck(this.flatList, 'original_hash')
		}
	}
}

var AllTracks = {
	nameList: [], playList: [],
	populate: function(id, list, enabled) {
		var pl = _.reject(this.playList, {lib: id})
		, nl = _.reject(this.nameList, {lib: id});
		_.each(list, function(track) {
			nl.push({lib: id, hash: track.original_hash, name: track.name})
			if(enabled) pl.push({lib: id, hash: track.original_hash})
		});
		$('#loop-toassoc option[data-lib='+id+']').remove();
		this.nameList = nl;
		this.playList = pl;
		_.each(nl, function(loop) {
			$('#loop-toassoc').append('<option data-lib="'+id+'" value="'+loop.hash+'">'+loop.name+'</option>');
		})
	},
	random: function() {
		if(!this.playList.length) this.init();
		if(!this.playList.length) return;
		if(this.playList.length > 1)
			var reduced = this.playList.filter(function(item) {
				return item.hash !== currentLoop.original_hash
			});
		var newLoop = (this.playList.length > 1) ? reduced[Math.floor(Math.random() * reduced.length)] : this.playList[0];
		loopLibs[newLoop.lib].playTrackByHash(newLoop.hash);
	},
	playTrackByHash: function(hash, disableAssociation) {
		loopLibs[_.find(this.nameList, {hash: ''+hash}).lib].playTrackByHash(''+hash, disableAssociation);
	}
}

function PatternGallery(patterns, sel, id, $sortButton, sortBy, order) {
	this.$el = $(sel);
	this.id = id;

	this.processList = function(list) {
		return _.each(list, function(entry) {
				if(entry.hasOwnProperty('date') && !entry.date instanceof Date)
					entry.date = new Date(entry.date);
					entry.height = +entry.height;
					entry.width = +entry.width;
					entry.id = +entry.id;
				}
			)
	}

	this.list = this.processList(patterns);

	this.patternProbe = function(width, height) {
		var s = (width > height) ? width : height;
		if(s < 60) {
			var n = 1;
			while(s*n <= 60) 
				n++;
			n--;

			var w = n*width
			, h = n*height
			, v_offset = 60 - h
			, h_offset = 60 - w;

			return {
				up: true,
				width: w,
				height: h,
				margins: [Math.floor(v_offset/2), Math.ceil(h_offset/2), Math.ceil(v_offset/2), Math.floor(h_offset/2)]
			}
		}
		else 
			return {
				up: false,
				width: width,
				height: height
			}
	}

	this.refreshAss = function() {
		$('#pattern-toassoc option[data-lib='+this.id+']').remove();
		_.each(this.list, function(pattern) {
			$('#pattern-toassoc').append('<option data-lib="'+this.id+'" value="'+pattern.id+'">'+pattern.name+'</option>');
		}, this)
	}

	this.build = function() {
		var order = (typeof this.sortOrder === 'undefined') ? true : ((typeof this.sortOrder === 'string') ? ((this.sortOrder === 'asc') ? true : false) : this.sortOrder)
		, sortedList = _.sortByOrder(this.list, [this.sortBy, "id"], [order, order])
		, html = '<div class="gallery-section" data-section="'+this.id+'" data-id="'+this.id+'">'
		, foradmin = (this.id === 'default') ? ' foradmin-show' : '';
		
		_.each(sortedList, function(pattern) {
			var probe = this.patternProbe(pattern.width, pattern.height)
			, crisp = probe.up ? ' image-crisp' : ''
			, upstyle = probe.up ? ' style="margin: '+probe.margins.map(function(i) {return i+"px"}).join(' ')+'; width:'+probe.width+'px; height:'+probe.height+'px;"' : ''
			, src = Grid.toCanvas(pattern.string, pattern.width, pattern.height)
			, fresh = (pattern.fresh || false) ? ' fresh' : ''
			, safeName = _.escape(pattern.name)
			, foradmin = (this.id == 'default') ? ' foradmin-show' : '';
			html +=
			'<div class="pattern'+fresh+'" title="'+safeName+'" data-id="'+pattern.id+'" data-lib="'+this.id+'" data-name="'+safeName+'">\
				<img src="'+src+'" class="pattern-pic'+crisp+'"'+upstyle+' alt="'+safeName+'">\
				<div class="pattern-name">'+safeName+'</div>\
				<div class="pattern-options">\
					<a title="Править" href="#" class="pattern-menu-item pmi-left'+foradmin+'"><i class="i-edit"></i></a>\
					<a title="Скачать PNG" target="_blank" href="'+src+'" download="'+safeName+'.png" class="pattern-menu-item pmi-mid"><i class="i-download-menu"></i></a>\
					<a title="Удалить" href="#" class="pattern-menu-item pmi-right'+foradmin+'"><i class="i-x-small"></i></a>\
				</div>\
			</div>'
		}, this)

		html += '</div>';
		this.$el.html(html);

		this.refreshAss();
	}

	this.sortOptions = [
		['date', 'desc', 'i-newfirst', "Сначала новые"],
		['date', 'asc', 'i-oldfirst', "Сначала старые"],
		['name', 'asc', 'i-a-z', "По алфавиту"],
		['name', 'desc', 'i-z-a', "По алфавиту"],
	];

	this.sortButton = $sortButton;
	this.sortButton.on('click', (function(ev) {
		ev.stopPropagation();
		this.sort()
	}).bind(this));
	this.sortState = _.findIndex(this.sortOptions, {0: sortBy, 1: order});

	this.sort = function(sortBy, order) {
		var sort;
		if(typeof sortBy === 'undefined') 
			this.sortState++;
		else {
			if(typeof order === 'undefined') order = 'asc';
			this.sortState = _.findIndex(this.sortOptions, {0: sortBy, 1: order});
		}
		if(this.sortState < 0 || this.sortState >= this.sortOptions.length)
			this.sortState = 0;
		sort = this.sortOptions[this.sortState];
		this.sortBy = sort[0];
		this.sortOrder = sort[1];
		this.build();
		this.sortButton.removeClass(_.pluck(this.sortOptions, 2).join(' ')).addClass(sort[2]);
		this.sortButton.attr('title', sort[3]);
	}

	this.sort(sortBy, order);
	
	this.applyPatternByID = function(id, disableAssociation) {
		if(typeof disableAssociation === 'undefined') disableAssociation = false;
		var pattern = _.find(this.list, {id: +id});
		if(pattern) {
			if(pattern.osc) 
				Grid.setOsc(pattern.osc);
			else {
				$('#osc-sel').val('default')
			}

			if(pattern.style)
				Grid.changeStyle(pattern.style, pattern.string);
			else
				Grid.changeStyle(defaultStyle, pattern.string);
			
			if(pattern.associated_loop && conf.association && !disableAssociation)
				AllTracks.playTrackByHash(pattern.associated_loop, true);
		}
	}
}

Math.log2 = Math.log2 || function(x) {
  return Math.log(x) / Math.LN2;
};