/* TODO:
  WELCOME WINDOW
    set up carousel for welcome with content:
      did you know?
      learn more about wonder unit
      more software
      testimonials
      forum 
    link getting started properly
    IDEAS:
  MAIN WINDOW
    hook up buttons
      padding on buttons
    open close properly
    click scrub
    pref for speaking and save
    menu for help
      getting started
      submit feedback
      forum
  ICON
  

  click to load 
    load file
    close welcome
    open main
  when main window closes, open welcome window



*/

const {app, ipcMain, BrowserWindow} = electron = require('electron')
const {dialog} = require('electron')
const {powerSaveBlocker} = require('electron')
const PDFParser = require("pdf2json");
const fs = require('fs')

const prefModule = require('./prefs')

const fountain = require('./vendor/fountain')
const fountainDataParser = require('./fountain-data-parser')

let mainWindow
let welcomeWindow
let welcomeInprogress

let statWatcher 

let powerSaveId = 0

let previousScript

let prefs = prefModule.getPrefs()

app.on('ready', ()=> {
  // open the welcome window when the app loads up first
  openWelcomeWindow()
})

app.on('activate', ()=> {
  if (!mainWindow && !welcomeWindow) openWelcomeWindow()
})

let openWelcomeWindow = ()=> {
  // RESET PREFS - SHOULD BE COMMENTED OUT
  // console.log(prefs)
  // prefs = {scriptFile: `./outl3ine.txt`}
  // prefModule.savePrefs(prefs)
  welcomeWindow = new BrowserWindow({width: 900, height: 600, show: false, resizable: false, frame: false})
  welcomeWindow.loadURL(`file://${__dirname}/../welcome.html`)
  let recentDocumentsCopy
  if (prefs.recentDocuments) {
    let count = 0
    recentDocumentsCopy = prefs.recentDocuments
    for (var recentDocument of prefs.recentDocuments) {
      try {
        fs.accessSync(recentDocument.path, fs.F_OK);
      } catch (e) {
        // It isn't accessible
        console.log('error file no longer exists.')
        recentDocumentsCopy.splice(count, 1)
      }
      count++
    }
    prefs.recentDocuments = recentDocumentsCopy
  }
  global.sharedObj = {'prefs': prefs}
  
  welcomeWindow.once('ready-to-show', () => {
    setTimeout(()=>{welcomeWindow.show()}, 300)
  })

  welcomeWindow.once('close', () => {
    welcomeWindow = null
    if (!welcomeInprogress) {
      app.quit()
    } else {
      welcomeInprogress = false
    }
  })
}

let openMainWindow = ()=> {
  if (welcomeWindow) {
    // close welcome window if open
    welcomeInprogress = true
    welcomeWindow.close()
  }

  if (mainWindow) {
    mainWindow.webContents.send('reload')
  } else {
    mainWindow = new BrowserWindow({width: 1300, height: 1000, minWidth: 1024, minHeight: 600, show: false, titleBarStyle: 'hidden-inset', title: 'Script Visualizer'})
    mainWindow.loadURL(`file://${__dirname}/../index.html`)
  }

  // Emitted when the window is closed.
  mainWindow.on('close', function () {
    prefModule.savePrefs(prefs)
    openWelcomeWindow()
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    setTimeout(()=>{mainWindow.show()}, 500)
  })
}

function openFile(file) {
  if (file) {
    fs.unwatchFile(prefs.scriptFile)
    prefs.scriptFile = file
    prefs.currentScene = 0
    loadFile(true)
  } else {
    // open dialogue 
    dialog.showOpenDialog({title:"Open Script", filters:[{name: 'Screenplay', extensions: ['fountain', 'pdf']}]}, (filenames)=>{
      if (filenames) {
        fs.unwatchFile(prefs.scriptFile)
        prefs.scriptFile = filenames[0]
        prefs.currentScene = 0
        loadFile(true)
      }
    })
  }
}

function loadFile(create, update) {
  if (update == true) {
    previousScript = global.sharedObj['scriptData']
  }

  let filenameParts = prefs.scriptFile.toLowerCase().split('.')
  let type = filenameParts[filenameParts.length-1]
  if (type == 'pdf') {
    let pdfParser = new PDFParser();
    
    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );

    pdfParser.on('pdfParser_dataReady', pdfData => {
      let pages = pdfData['formImage']['Pages']
      let scriptText = ''
      let currentX = 0
      for (var page of pages) {
        let texts = page['Texts']
        let currentY = -1
        let textCount = 0
        for (var text of texts) {
          if (textCount == 0) {
            if ((text['x'] !== currentX)) {
              scriptText += "\n\n"
            }
            scriptText += decodeURIComponent(text['R'][0]['T'])
            currentX = text['x']
          } else {
            if ((text['y'] - currentY) > 1) {
              // new line
              scriptText += "\n\n"
            } else if (text['y'] == currentY) {
            } else if (text['y'] < currentY) { 
              break
            } else {
              if ((text['x'] !== currentX) && (text['x'] > 10.17)) {
                scriptText += "\n"
              }
            }
            scriptText += decodeURIComponent(text['R'][0]['T'])
            currentX = text['x']
          }
          currentY = text['y']
          textCount++
        }
      }
      processFountainData(scriptText, create, update)
      pdfParser.destroy()
    })

    pdfParser.loadPDF(prefs.scriptFile);

  } else if (type == 'fountain') {
    fs.readFile(prefs.scriptFile, 'utf-8', (err,data)=>{
      if (err) {
        console.log("ERROR: Can't open file.")
        openFile()
        return
      }
      processFountainData(data, create, update)
    })
  }
}

let processFountainData = (data, create, update) => {

  // parse fountain file
  let documentPath = prefs.scriptFile.split('/')
  documentPath.pop()
  documentPath = documentPath.join('/')

  let scriptData = fountain.parse(data, true)

  let locations = fountainDataParser.getLocations(scriptData.tokens)
  let characters = fountainDataParser.getCharacters(scriptData.tokens)
  scriptData = fountainDataParser.parse(scriptData.tokens)

  global.sharedObj = {scriptData: scriptData, locations: locations, characters: characters, documentPath: documentPath, currentNode: 1, prefs: prefs}

  if (!prefs.recentDocuments) {
    prefs.recentDocuments = []
  }

  let currPos = 0

  for (var document of prefs.recentDocuments) {
    if (document.path == prefs.scriptFile) {
      prefs.recentDocuments.splice(currPos, 1)
      break
    }
    currPos++
  }

  let recentDocument = {}
  recentDocument.path = prefs.scriptFile
  
  // generate stats

  let totalWordCount = 0
  for (var node of scriptData) {
    if (node.word_count) totalWordCount += node.word_count
  }
  let totalPageCount
  let totalMovieTime
  switch (scriptData[scriptData.length-1].type) {
    case 'title':
    case 'section':
      totalPageCount = scriptData[scriptData.length-1].page
      totalMovieTime = scriptData[scriptData.length-1].time + scriptData[scriptData.length-1].duration
      break
    case 'scene':
      let lastNode = scriptData[scriptData.length-1]['script'][scriptData[scriptData.length-1]['script'].length-1]
      totalPageCount = lastNode.page
      totalMovieTime = lastNode.time + lastNode.duration
      break
  }
  recentDocument.time = Date.now()
  recentDocument.totalWordCount = totalWordCount
  recentDocument.totalPageCount = totalPageCount
  recentDocument.totalMovieTime = totalMovieTime
  prefs.recentDocuments.unshift(recentDocument)
  // save
  prefModule.savePrefs(prefs)

  if (create) {
    fs.watchFile(prefs.scriptFile, {persistent: false}, (e) => {
      loadFile(false, true)
    })

    openMainWindow()
  }

  if (update == true) {
    let diffScene = getSceneDifference(previousScript, global.sharedObj['scriptData'])
    mainWindow.webContents.send('reload', 1, diffScene)
  }
}

let getSceneDifference = (scriptA, scriptB) => {
  let i = 0
  for (var node of scriptB) {
    if(!scriptA[i]) {
      return i
    }
    if (JSON.stringify(node) !== JSON.stringify(scriptA[i])) {
      return i
    }    
    i++
  }
  return false
}

// ipcMain.on('showWindow', ()=> {
//   mainWindow.show()
// })

ipcMain.on('openFile', (e, arg)=> {
  openFile(arg)
})

ipcMain.on('preventSleep', ()=> {
  powerSaveId = powerSaveBlocker.start('prevent-display-sleep')
})

ipcMain.on('resumeSleep', ()=> {
  powerSaveBlocker.stop(powerSaveId)
})

/// menu pass through

ipcMain.on('togglePlayback', (event, arg)=> {
  mainWindow.webContents.send('togglePlayback')
})

ipcMain.on('goBeginning', (event, arg)=> {
  mainWindow.webContents.send('goBeginning')
})

ipcMain.on('goPreviousScene', (event, arg)=> {
  mainWindow.webContents.send('goPreviousScene')
})

ipcMain.on('goPrevious', (event, arg)=> {
  mainWindow.webContents.send('goPrevious')
})

ipcMain.on('goNext', (event, arg)=> {
  mainWindow.webContents.send('goNext')
})

ipcMain.on('goNextScene', (event, arg)=> {
  mainWindow.webContents.send('goNextScene')
})

ipcMain.on('toggleSpeaking', (event, arg)=> {
  mainWindow.webContents.send('toggleSpeaking')
})