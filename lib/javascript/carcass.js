var _width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
var _frames = {};
if(localStorage['forceLayout'] == 'horizontal' || _width < 600) _frames.layout = 'horizontal';
if(localStorage['forceLayout'] == 'vertical' || _width >= 600) _frames.layout = 'vertical';
if(in_array(localStorage['frameBehavior'], ['overlay', 'fixed', 'shift'])) _frames.behavior = localStorage['frameBehavior'];
else _frames.behavior = 'fixed';

var _open = true;

function updateLayout() {
	$('body').removeClass('l-v l-h l-fix l-olay l-shift');
	$('html', frames.list.document).removeClass('l-v l-h l-fix l-olay l-shift');

	var newClass = ((_frames.layout == 'horizontal') ? 'l-h' : 'l-v')+ ' ' + 
	((_frames.behavior == 'fixed') ? 'l-fix' : 
		( (_frames.behavior == 'shift') ? 'l-shift' : 'l-olay') 
	);

  try {
    list.$('#pinunpin').attr('title', 'Режим фрейма: '+frameModes[_frames.behavior]+' [сменить]')
  }
	catch(e) { }

	$('body').addClass(newClass);
	$('html', frames.list.document).addClass(newClass);

	localStorage.setItem('frameBehavior', _frames.behavior);
}

function openMenu() {
	if(_open == true) return;
	$('iframe').removeClass('hidden');
	$('html', frames.list.document).removeClass('hidden');
	_open = true;
}

function closeMenu() {
	if(_open == false) return;
	$('iframe').addClass('hidden');
	$('html', frames.list.document).addClass('hidden');
	_open = false;
}

var frameModes = {
	'overlay': 'перекрытие',
	'shift': 'сдвиг',
	'fixed': 'зафиксировано'
}

function toggleBehavior() {
	if(_frames.behavior == 'overlay') _frames.behavior = 'fixed';
	else if(_frames.behavior == 'fixed') _frames.behavior = 'shift';
	else _frames.behavior = 'overlay';
	updateLayout();
}

$(document).ready(function() {
	$(window).resize(function() {
		if($(window).width() < 600 && _frames.layout === 'vertical') _frames.layout = 'horizontal';
		if($(window).width() >= 600 && _frames.layout === 'horizontal') _frames.layout = 'vertical';
		updateLayout();
	});
})


function allReady() {
	updateLayout();
	$(window).hashchange(frames.list.router.follow.bind(frames.list.router));
	$('#list').on('mouseleave', function() {
		if(_frames.layout == 'vertical' && in_array(_frames.behavior, ['overlay', 'shift'])) list.menu.close();
	});
}

function in_array(needle, haystack) {
    if(typeof haystack !== 'object') {
        if(needle === haystack) return true;
        else return false;
    }
    for(var key in haystack) {
        if(needle === haystack[key]) {
            return true;
        }
    }
    return false;
}

function toggleShare() {
	$('#live').toggleClass('shown')
}