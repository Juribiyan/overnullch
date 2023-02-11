const hv = {
	start: function() {
		let i = 0
			, container = document.querySelector('#space')
			, css = '', html = ''
		while(i < this.viralLoad) {
			let id = `v_${i}`
			html += this.makeVirus(id)
			css += this.makeAnimation(id)
			i++
		}
		container.innerHTML = html
		injector.inject('viral-animations', css)
		injector.inject('img-size', `.virus img {width: ${this.baseImgSize}px}`)
		this.initViruses()
		this.play()
	},
	makeVirus: function(id) {
		let spinSpeed = getRandomArbitrary(...this.spinDuration)
		return `<div class="virus" id="${id}" style="animation: rot_${id} ${spinSpeed}s linear infinite;">
			<img src="${this.src}" ${this.colorVariation ? `style="filter: hue-rotate(${getRandomArbitrary(0, 360)}deg)"` : ''}>
		</div>`
	},
	makeAnimation: function(id) {
		let angle = getRandomInt(0, 360)
			, direction = getRandomInt(0,1) ? 360 : -360
			, duration = getRandomArbitrary(...this.spinDuration)
			, flip = !!getRandomInt(0,1) ? 'scale: -1 1' : ''
		return `@keyframes rot_${id} {
			from {
				transform: translate(-50%,-50%) rotate(${angle}deg) ${flip}
			}
			to {
				transform: translate(-50%,-50%) rotate(${angle+direction}deg) ${flip}
			}
		}
		`
	},
	initViruses: function() {
		this.viruses = document.querySelectorAll('.virus')
		this.viruses.forEach(v => {
			let newStyle = this.get3DPosition(v)
			Object.assign(v.style, newStyle.container)
			Object.assign(v.firstElementChild.style, newStyle.img)
		})
	},
	get3DPosition: function(o) {
		let initialSeed = o.dataset.seed
			, seed = initialSeed
				? getRandomArbitrary(
					Math.max(0, (+initialSeed)-this.diffWindow),
					Math.min(1, (+initialSeed)+this.diffWindow),
					Math.random()
				)
				: Math.random()
			, scale = getRandomArbitrary(...this.scale, seed)
			, blur = getRandomArbitrary(...this.blur, seed)
			, brightness = getRandomArbitrary(...this.brightness, seed)
			, contrast = getRandomArbitrary(...this.contrast, seed) 
			, perspectiveFactor = getRandomArbitrary(...this.perspectiveRange, seed)
			, perspectiveCorrection = (1 - perspectiveFactor)/2
			, perspectiveRangePercent = [Math.round(perspectiveCorrection*100), Math.round((perspectiveFactor+perspectiveCorrection)*100)]
		o.dataset.seed = seed
		return {
			container: {
				left: getRandomInt(...perspectiveRangePercent) + '%',
				top: getRandomInt(...perspectiveRangePercent) + '%',
				zIndex: getRandomInt(0, 10000, seed),
				filter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`
			},
			img: {
				transform: `scale(${scale})`
			}
		}
	},
	play: function() {
		this.viruses.forEach(v => {
			this.moveVirus(v)
		})
	},
	moveVirus: function(v) {
		// console.log('move')
		let newStyle = this.get3DPosition(v),
		params = {
			// ease: "power3.inOut",
			delay: getRandomArbitrary(...this.moveTimeout),
			duration: getRandomArbitrary(...this.moveDuration)
		}
		gsap.to(v, Object.assign(newStyle.container, Object.assign(params, {
			onComplete: this.moveVirus.bind(this),
			onCompleteParams: [v]
		})))
	},
	src: 'hirudovirus.png',
	viralLoad: 100,
	spinDuration: [2, 30],
	scale: [.01, .8],
	diffWindow: .2,
	blur: [4, 0],
	brightness: [.1, 1],
	contrast: [.4, 1],
	perspectiveRange: [1, 2],
	baseImgSize: 150,
	moveDuration: [10,30],
	moveTimeout: [0,5],
	fadeOut: [1500, 7000],
	colorVariation: 0
}

function getRandomArbitrary(min, max, seed=Math.random()) {
  return seed * (max - min) + min
}
function getRandomInt(min, max, seed=Math.random()) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(seed * (max - min + 1)) + min;
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