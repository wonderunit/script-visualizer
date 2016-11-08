var remote = nodeRequire('electron').remote 
const {shell} = nodeRequire('electron')
const {ipcRenderer} = nodeRequire('electron')

const moment = nodeRequire('moment')

$(document).ready(function() {
  let recentDocuments = remote.getGlobal('sharedObj').prefs['recentDocuments']
  let count = 0
  let html = []
  
  if (recentDocuments) {
    for (var recentDocument of recentDocuments) {
      html.push(`<div class="recent-item" data-path="${recentDocument.path}"><img src="./img/fileicon.png"><div class="text">`)
      let path = recentDocument.path.split('/')
      path = path[path.length-1]
      html.push(`<h2>${path}</h2>`)
      html.push(`${moment(recentDocument.time).fromNow().toUpperCase()} // ${msToTime(recentDocument.totalMovieTime)} / ${recentDocument.totalPageCount} PAGES / ${String(recentDocument.totalWordCount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} WORDS`)
      html.push('</div></div>')
      count++
    }

    $('#recent').html(html.join(''))
    $('.recent').html("RECENT SCRIPTS")

    $('.recent-item').click((e)=>{
      console.log(e.currentTarget.dataset.path)
      ipcRenderer.send('openFile', e.currentTarget.dataset.path)
    })
  }


  $('#close-button').click((e) => {
       var window = remote.getCurrentWindow();
       window.close();
  })

  $('iframe').contents().delegate('a','click',(e)=>{
    shell.openExternal(e.currentTarget.href)
    e.preventDefault()
  })

  $('#open-script').click( ()=> {
    ipcRenderer.send('openFile')
  })

  $('#getting-started').click( ()=> {
    shell.openExternal("https://wonderunit.com")
  })

})

let msToTime = (s)=> {
  if(!s) s = 0
  s = Math.max(0, s)
  function addZ(n) {
    return (n<10? '0':'') + n;
  }
  var ms = (s % 1000);
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  if (hrs) {
    return hrs + ':' + addZ(mins) + ':' + addZ(secs);
  } else {
    return mins + ':' + addZ(secs); //+ '.' + ms.toString().substring(0,1);
  }
};