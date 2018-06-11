"use strict"

function main() {
  if (location.search) {
    let _url = /url=([^&]+)/.exec(location.search)
    , _description = /description=([^&]+)/.exec(location.search)
    if (_url) {
      _url = decodeURIComponent(_url[1])
      $('#url').val(_url)
    }
    if (_description) {
      _description = decodeURIComponent(_description[1])
      $('#description').val(_description)
    }
  }

	$.ajaxSetup({ dataType: 'json' })
  $('#closer').click(parent.toggleShare)
  $('form').on('submit', function(ev) {
  	ev.preventDefault()
  	$(this).addClass('busy')
  	$.post('api.php', {
  		url: $('#url').val(),
  		description: $('#description').val()
  	})
  	.done(handleResponse.bind(this))
  })
  $('#error-wrapper').click(() => $('form').removeClass('error'))
}

function handleResponse(data) {
	$('form').removeClass('busy'); 
	if (data.error) {
		let err = data.error
		$('form').addClass('error'); 
		$('#errorbox')
		.text(typeof err === 'string'
			? errorDescriptors[err] || err
			: (errorDescriptors.hasOwnProperty(err.errtype)
				? errorDescriptors[err.errtype](err.errdata)
				: `${err.errtype} (${err.errdata})`)
		)
	}
	else {
    let inFrame = false;
    if (parent._frames && parent.frames.list && parent.frames.live) {
      parent.frames.list.live.build(data.data)
      parent.frames.list.live.toggle(true)
      if (parent._frames.layout == 'horizontal') {
        parent.frames.list.menu.open()
      }
      inFrame = true;
    }
		$('form').addClass('success'); 
		setTimeout(() => {
      if (inFrame) {
        parent.$('#live').removeClass('shown'); 
      }
			$('input').val('')
		}, 1500)
		setTimeout(() => {
			$('form').removeClass('success');
		}, 2000)
	}
}

const errorDescriptors = {
	'no-data-provided': 'Недостаточно данных',
	'url-too-long': 'Слишком длинный URL',
	'description-too-long': 'Слишком длинное описание',
	'description-too-short': 'Слишком короткое описание',
	'bad-url': 'Неверный формат SQL',
	'url-exists': 'Данная ссылка уже присутствует в списке',
	'timeout': secs => `Таймаут ${secs} сек.`,
	'sql-error': 'Ошибка SQL'
}