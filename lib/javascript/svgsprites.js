(function() {
  var div = document.createElement("div");
  div.style.display = 'none';
  document.body.insertBefore(div, document.body.childNodes[0]);

  var currentScript = document.currentScript
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script')
    , index = scripts.length - 1
    currentScript = scripts[index]
  }

  currentScript.getAttribute('url').split(',').forEach(function(url) {
    $.get(url, function(data) {
      div.innerHTML += new XMLSerializer().serializeToString(data.documentElement)
    })
  })
})()