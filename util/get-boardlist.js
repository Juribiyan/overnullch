//instant 0chan
var cats = [];
$('body div').each(function() {
	var sect = {name: $(this).prev().text().trim().replace(/(\r\n|\n|\r|\t)/gm,"").replace(/[\−\+]\s/,""), boards: []};
	$(this).find('a').each(function() {
		sect.boards.push({
			dir: $(this).attr('href').split('/')[3],
			desc: $(this).text().trim().replace(/(\r\n|\n|\r|\t)/gm,"").replace(/( \([0-9]+\))/, "")
		});
	});
	cats.push(sect)
})

console.log(JSON.stringify(cats, ' ', 2))

//iichan
var res = []
$$('.category').forEach(cat => {
  var sect = {name: cat.querySelector('.header').textContent, boards: []}
  cat.querySelectorAll('a').forEach(link => {
    var board = {
      desc: link.textContent
    }
    var href = link.getAttribute("href");
    if(href.indexOf('://') !== -1) {
      board.external = true;
      board.url = href
    }
    else 
      board.dir = href.match(/\/(.+)\//)[1]
    sect.boards.push(board)
  })
  res.push(sect)
})
console.log(JSON.stringify(res))

//i0 (from board page)
var cats = []
$('.menu-sect:not(#ms-_options)').each(function() {
  var cat = {
    name: $(this).attr('id').split('ms-')[1],
    boards: []
  }
  $(this).find('.menu-item').each(function() {
    cat.boards.push({
      dir: $(this).attr('href').split('/')[1],
      desc: $(this).attr('title')
    })
  })
  cats.push(cat)
})

JSON.stringify(cats, ' ', 2)


//410
var cats = []
$$('h2').forEach(h => {
  var cat = {
    name: h.textContent.split('− ')[1],
    boards: []
  }
  h.nextElementSibling.querySelectorAll('a').forEach(a => {
    cat.boards.push({
      dir: a.getAttribute('href').split('/')[1],
      desc: a.textContent
    })
  })
  if(cat.name != 'Радио')
    cats.push(cat)
})

JSON.stringify(cats, ' ', 2)

//kusaba
var cats = []
$$('h2').forEach(h => {
  var cat = {
    name: h.textContent.trim(),
    boards: []
  }
  h.nextElementSibling.querySelectorAll('a').forEach(a => {
    cat.boards.push({
      dir: a.getAttribute('href').split('/').reverse()[1],
      desc: a.textContent.trim()
    })
  })
  if(cat.name != 'Радио')
    cats.push(cat)
})

JSON.stringify(cats, ' ', 2)


//crychan
var cats = [];
$('.header__links a').each(function() {
  let dir = $(this).attr('href').split('/')[1]
  if(dir) cats.push({
    dir: dir+'/',
    desc: $(this).attr('title')
  })
})
JSON.stringify(cats, ' ', 2)

//erlach
let boards = []
$$('.group').forEach(s => {
  let sect = {
    name: s.querySelector('div').getAttribute('title'),
    boards: []
  }
  s.querySelectorAll('a').forEach(a => {
    sect.boards.push({
      dir: a.getAttribute('href').replace(/^\//, '').replace(/\/$/, ''),
      desc: a.getAttribute('title')
    })
  })
  boards.push(sect)
})

//xyntach
let boards = []
$$('.navbar a').forEach(a => {
  boards.push({
    dir: a.getAttribute('href').replace(/^\//, '').replace(/\/$/, ''),
    desc: a.getAttribute('title')
  })
})
JSON.parse(JSON.stringify(boards))
