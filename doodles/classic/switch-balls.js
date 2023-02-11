var boys, father,
current_set = 8

function switch_balls(index) {
	boys.src = 'index-balls/balls-'+index+'.png'
	father.src = 'index-balls/heavenly-father'+(index==8 ? '_mono' : '')+'.png'
	current_set = index
}

function bs_init() {
	boys = document.querySelector('#the-boys')
	father = document.querySelector('#heavenly-father')
	document.querySelectorAll('.switcher').forEach(sw => {
		sw.onclick = function() {
			var index = (this.classList.contains('sw-left')) ? current_set-1 : current_set+1
			if (index ==0) index = 8;
			if (index > 8) index = 1;
			switch_balls(index)
		}
	})
}