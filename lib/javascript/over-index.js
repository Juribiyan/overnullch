var doodles = [
	{url: 'avatarsday/', desc: '1 Мая — День аватарок'},
	{url: 'halloween/', desc: 'Хэллоуин 2015'},
	{url: 'ny2016/', desc: 'Новый Год 2016'},
	{url: 'bday2016/', desc: '8 лет Нульчану'},
	{url: 'resurrection/', desc: 'POWERNULLCH'},
	{url: 'fagday/', desc: 'День борьбы с гомофобией'},
	// {url: 'election2016/', desc: 'Выборы в госдуму 2016'},
	{url: 'halloween2016/', desc: 'Хэллоуинский маскарад 2016'},
	{url: 'bday2017/', desc: '9 лет Нульчану'},
	{url: 'overchan/', desc: 'Overchan'},
]

var doodles_html = '<div id="doodles">'
, $doodles = null;

doodles.map(function(doodle) {
	doodles_html += 
	'<a target="_blank" href="/doodles/'+doodle.url+'">'+doodle.desc+'</a>';
});
doodles_html += '</div>';

function $ready() {
	$doodles = $(doodles_html).appendTo('#show_doodles');
	$('#show_doodles')
	.on('mouseenter', function() {
		$doodles.addClass('doodle-appear')
	}) 
	.on('mouseleave', function() {
		$doodles.removeClass('doodle-appear')
	})
	if(parent.script_installed)
		scriptInstalled()
	$('.help-toggler').click(function(ev) {
		ev.preventDefault()
		faq.on()
	})
	$('.faq-container').click(function() {
		faq.off()
	})
	$('.faq-window').click(function(ev) {
		ev.stopPropagation()
	})
	$('.close-faq').click(function(ev) {
		ev.stopPropagation()
		faq.off()
	})
	if (parent.frames['list'])
		parent.frames['list'].window.postMessage(document.location.href, document.location.origin || (document.location.protocol + '//' + document.location.host))
}

function scriptInstalled() {
	$('.download-button').addClass('installed')
}

var faq = {
	on: function() {
		$('body').addClass('faq-active')
		$('.faq-container').show().addClass('overlaying')
		$('.faq-window').addClass('open')
	},
	off: function() {
		$('.faq-container').removeClass('overlaying')
		$('.faq-window').removeClass('open')
		setTimeout(function() {
			$('body').removeClass('faq-active')
			$('.faq-container').hide()
		}, 300)
		
	}
}