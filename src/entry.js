const electron = require('electron')
const { app, BrowserWindow, ipcMain, Menu, MenuItem, nativeTheme } = electron;
const { spawn } = require('child_process');
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const os = require("os");
var win;
// function getExe() {
// 	return path.join(process.env.APPDATA, '..', 'Local', 'RepaDex', 'app-1.1.0', 'RepaDex.exe');
// }
// const createDesktopShortcut = require('create-desktop-shortcuts');
// const shortcutsCreated = createDesktopShortcut(getExe());
if (require('electron-squirrel-startup')) {
	app.quit();//if this is first time running
}

var remotePath = "K:/BF/PRSM/TechHub/RepaDex";
// var remotePath = "C:/Users/Maxwell/Documents/GitHub/Repadex";
var iPad = fs.existsSync("C:/IAmiPad");

if (iPad) {
	remotePath = remotePath.replace("K:/BF/PRSM", "K:");
}
var configPath = remotePath + "/configuration.json";
var configPathLocalFolder = path.join(process.env.APPDATA, '..', 'Local', 'RepaDex');
var configPathLocal = path.join(configPathLocalFolder, "configuration.json");
var backendPath = "";//JSON.parse(configTxt).backendPath;
var lockedPath = "";//JSON.parse(configTxt).lockFilePath;
var versionFile = "";

var saving = false;
var goodToSave = false;
var doneSaving = true;
const id = os.hostname() + "-" + os.userInfo().username + "-" + crypto.randomBytes(1).toString("hex");
// console.log(id);

var repairJSON;
var isALoaner = false;
var savingTimer;
var loadingTimer;


function sendBack(key, val) {
	// console.log(key);
	try {
		win.webContents.send(key, val);
	} catch (e) {
		console.log(e);
	}
}

function lockFile() {
	fs.access(lockedPath, fs.F_OK, (err) => {
		//console.log("try");
		if (err) {
			try {
				fs.closeSync(fs.openSync(lockedPath, 'w'));//create it
			} catch (e) {
				// sendBack("fromMainDisconnected", "");
				setTimeout(lockFile, 2000);//try again in 2
				console.log(e);
				return;
			}
		}
		// console.log("fromMainConnected");
		sendBack("fromMainConnected", "");
		//file exists now
		if (saving) {
			fs.readFile(lockedPath, 'utf8', (err, txt) => {
				if (err) {
					setTimeout(lockFile, 5000);//try again in 5
					console.error(err);
					return;
				}
				if (txt != "") {
					if (id != txt) {
						sendBack("fromMainWaiting", txt);
						console.log("waiting on lock");
						goodToSave = false;
						setTimeout(lockFile, 2000);
						return;
					}
					else {
						goodToSave = true;
						if (doneSaving) {
							fs.writeFile(lockedPath, "", err => {	//unlock it to us
								if (err) {
									setTimeout(lockFile, 2000);//try again in 2
									console.error(err);
									return;
								}
								doneSaving = false;
								saving = false;
								console.log("unlocked");
								setTimeout(lockFile, 1000);
								if (closeAfterSave) {
									win.close();
								}
								return;
							});
						}
						else {
							setTimeout(lockFile, 1000);
							return;
						}
					}
				}
				else										//if the file is empty...
				{
					fs.writeFile(lockedPath, id, err => {	//lock it to us
						if (err) {
							setTimeout(lockFile, 5000);//try again in 5
							console.error(err);
							return;
						}
						console.log("locked");
						setTimeout(lockFile, 100);
						return;
					});
				}
			});
		}
		else {
			setTimeout(lockFile, 100);
			return;
		}
	});
}
function makeDescriptors(repair) {
	var descriptors = [];
	if (repair["phone"]) {
		descriptors.push(repair["phone"].toLowerCase());
	}
	descriptors.push(repair["email"].toLowerCase());
	descriptors.push(repair["serial"].toLowerCase());
	descriptors.push(repair["name"].toLowerCase());
	descriptors.push(repair["model"].toLowerCase());
	descriptors.push(repair["make"].toLowerCase());
	descriptors.push((repair["refNum"] + "").toLowerCase());//convert to string
	if (repair["iPadSN"]) {
		descriptors.push(repair["iPadSN"].toLowerCase());
	}
	return descriptors;
}
function saveRepairPart() {
	//console.log("check");
	if (goodToSave) {
		clearInterval(savingTimer);
		try {
			var txt = fs.readFileSync(backendPath, 'utf8');
			//console.log(repairJSON);
			var jsonData = JSON.parse(txt);
			if (isALoaner) {
				var jsonLoaner = JSON.parse(repairJSON);
				if (!jsonData["loaners"]) {
					jsonData["loaners"] = {};
				}
				jsonData["loaners"][jsonLoaner.number] = jsonLoaner;
				var stringified = JSON.stringify(jsonData);
				fs.writeFileSync(backendPath, stringified);
				doneSaving = true;
				sendBack("fromMainLoanerSaved", stringified);
			}
			else {
				var jsonRepair = JSON.parse(repairJSON);
				jsonRepair["descriptors"] = makeDescriptors(jsonRepair);//just easier to do it "backend"
				if (!jsonData["repairs"]) {
					jsonData["repairs"] = {};
				}
				jsonData["repairs"][jsonRepair.refNum] = jsonRepair;
				var stringified = JSON.stringify(jsonData);
				fs.writeFileSync(backendPath, stringified);
				doneSaving = true;
				sendBack("fromMainSaveSuc", stringified);
			}
		}
		catch (err) {
			//savingTimer = setInterval(saveRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			if (isALoaner) {
				sendBack("fromMainLoanerSaveFail", "");
			}
			else {
				sendBack("fromMainSaveFail", "");
			}
		}
	}
}
function saveRepair(inJSON) {
	console.log("saving repair");
	saving = true;
	doneSaving = false;
	isALoaner = false;
	repairJSON = inJSON;
	savingTimer = setInterval(saveRepairPart, 1000);
}

function saveLoaner(inJSON) {
	console.log("saving loaner");
	saving = true;
	doneSaving = false;
	isALoaner = true;
	repairJSON = inJSON;
	savingTimer = setInterval(saveRepairPart, 1000);
}

var loadMessageName;
function loadRepairPart() {
	//console.log("check");
	if (goodToSave) {
		clearInterval(loadingTimer);
		try {
			var txt = fs.readFileSync(backendPath, 'utf8');
			//console.log(repairJSON);
			//repairJSONIn = JSON.parse(txt);
			doneSaving = true;
			sendBack(loadMessageName, txt);
		}
		catch (err) {
			//loadingTimer = setInterval(loadRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			sendBack("fromMainSaveFail", "");
		}
	}
}
function loadRepairs() {
	console.log("loading repairs");
	saving = true;
	doneSaving = false;
	loadingTimer = setInterval(loadRepairPart, 1000);
}

function incRefPart() {
	//console.log("check");
	if (goodToSave) {
		clearInterval(loadingTimer);
		try {
			var txt = fs.readFileSync(backendPath, 'utf8');
			//console.log(repairJSON);
			var jsonData = JSON.parse(txt);
			var refNum;
			if (jsonData.nextRefNumber) {
				refNum = jsonData.nextRefNumber;
			}
			else {
				refNum = 1;
			}
			jsonData.nextRefNumber = refNum + 1;
			fs.writeFileSync(backendPath, JSON.stringify(jsonData));
			doneSaving = true;
			sendBack("fromMainRefNum", refNum);
		}
		catch (err) {
			//loadingTimer = setInterval(loadRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			sendBack("fromMainRefNumFail", "");
		}
	}
}
var closeAfterSave = false;
function incRefNum() {
	console.log("inc ref num");
	saving = true;
	doneSaving = false;
	loadingTimer = setInterval(incRefPart, 1000);
}
var errorWin;
function displayError(errorText) {
	sendBack("fromMainDisconnected", errorText);
	// if (!errorWin) {
	// 	errorWin = new BrowserWindow(
	// 		{
	// 			minWidth: 1220,
	// 			width: 1600,
	// 			height: 900,
	// 			autoHideMenuBar: true,
	// 			icon: __dirname + '/RepaDexFin.ico',
	// 			webPreferences: {
	// 				nodeIntegration: false, // is default value after Electron v5
	// 				contextIsolation: true, // protect against prototype pollution
	// 				enableRemoteModule: false, // turn off remote
	// 			}
	// 		});
	// 	errorWin.loadFile("error.html");
	// }
	setTimeout(copyConfigAndStart, 1000);
}
function cancelError() {
	if (errorWin) {
		errorWin.close();
	}
}
function copyConfigAndStart() {
	if (!win) {
		createWindow();//create the window
	}
	fs.copyFile(configPath, configPathLocal, (err) => {
		if (err) {
			displayError(); return;
		}//throw err};
		cancelError();
		// console.log('File was copied to destination');
		var txt = fs.readFileSync(configPathLocal, 'utf8');
		backendPath = JSON.parse(txt).backendPath;
		lockedPath = JSON.parse(txt).lockFilePath;
		versionFile = JSON.parse(txt).versionFilePath;
		if (iPad) {
			backendPath = backendPath.replace("K:/BF/PRSM", "K:");
			lockedPath = lockedPath.replace("K:/BF/PRSM", "K:");
			versionFile = versionFile.replace("K:/BF/PRSM", "K:");
		}
		startup();
	});
}
app.whenReady().then(() => {
	copyConfigAndStart();
});
function overrideSync() {
	fs.unlinkSync(lockedPath);//delete the lock file!!!
}
function checkAndSendRemoteVersion() {
	fs.readFile(versionFile, 'utf8', (err, txt) => {
		if (err) {
			console.log("version read error: " + err);
		}
		else {
			sendBack("fromMainRemoteVersion", txt);
		}
	});
}

function saveConfig(toSaveConfig) {
	fs.writeFileSync(configPath, toSaveConfig);
	console.log("saved config");
}

ipcMain.on("toMain", (event, args) => {
	if (args == "checkVersion") {
		checkAndSendRemoteVersion();
	}
	else if (args == "actionMaximize") {
		win.maximize();
	}
	else if (args == "actionRestore") {
		win.unmaximize();
	}
	else if (args == "actionMinimize") {
		win.minimize();
	}
	else if (args == "actionClose") {
		tryClose(null);
	}
	else if (args == "override") {
		overrideSync();
	}
	else if (args.startsWith("saveConfig")) {
		saveConfig(args.replace("saveConfig", ""));
	}
	else if (args.substr(0, 4) == "open") {
		var url = args.substr(4);
		electron.shell.openExternal(url);
	}
	else {
		if (!doneSaving && saving) {
			console.log("ignoring " + args + " because we are already loading something...");
			return;
		}
		if (args == "configPls") {
			var txt = fs.readFileSync(configPathLocal, 'utf8');
			sendBack("fromMainConfig", txt);
		}
		else if (args == "loadAll") {
			loadMessageName = "fromMainLoadAll";
			loadRepairs();
			//var txt = fs.readFileSync(backendPath, 'utf8');
			//jsonData = JSON.parse(txt);
		}
		else if (args == "loadForSearch") {
			loadMessageName = "fromMainLoadSearch";
			loadRepairs();
			//var txt = fs.readFileSync(backendPath, 'utf8');
			//jsonData = JSON.parse(txt);
		}
		else if (args == "updateRepairs") {
			loadMessageName = "fromMainUpdateRepairs";
			loadRepairs();
		}
		else if (args == "incRefNum") {
			incRefNum();
		}
		else if (args == "update") {
			update();
		}
		else if (args.substr(0, 1) == "s") {
			saveRepair(args.substr(1));
		}
		else if (args.substr(0, 1) == "z") {
			saveLoaner(args.substr(1));
		}
	}
});

function tryClose(e) {
	if (saving) {
		closeAfterSave = true;
		if (e) {
			e.preventDefault();
		}
	}
	else {
		win.close();
	}
}
function createWindow() {
	nativeTheme.themeSource = 'dark';
	win = new BrowserWindow(
		{
			show: false,
			// titleBarStyle: 'hidden',
			// titleBarOverlay: true,
			frame: false,
			minWidth: 1220,
			minHeight: 500,
			width: 1600,
			height: 900,
			autoHideMenuBar: true,
			icon: path.join(__dirname, '/RepaDexFin.ico'),
			webPreferences: {
				nodeIntegration: false, // is default value after Electron v5
				contextIsolation: true, // protect against prototype pollution
				enableRemoteModule: false, // turn off remote
				preload: path.join(__dirname, "preload.js") // use a preload script
			}
		});
	console.log(__dirname + '/RepaDexFin.ico' + ":" + fs.existsSync(__dirname + '\\RepaDexFin.ico'));
	// win.setIcon(__dirname + "/RepaDexFin.ico");
	win.on('close', (e) => {
		tryClose(e);
	});
	win.once('ready-to-show', () => {
		win.show();
	});
	win.on('unmaximize', () => {
		sendBack("fromMainAction", "unmaximize");
	});
	win.on('maximize', () => {
		sendBack("fromMainAction", "maximize");
	});
	win.on('minimize', () => {
		sendBack("fromMainAction", "minimize");
	});
	win.webContents.on('context-menu', (event, params) => {
		//console.log(params);
		const menu = new Menu();

		// Add each spelling suggestion
		for (const suggestion of params.dictionarySuggestions) {
			menu.append(new MenuItem({
				label: suggestion,
				click: () => win.webContents.replaceMisspelling(suggestion)
			}));
		}

		// Allow users to add the misspelled word to the dictionary
		/*if (params.misspelledWord) {
		  menu.append(
			new MenuItem({
			  label: 'Add to dictionary',
			  click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
			})
		  )
		}*/

		menu.popup();
	});
	if (iPad) {
		win.loadFile('src/web/iPads.html');
		setInterval(() => {
			win.setPosition(1920, 0);
			win.setFullScreen(true);
		}, 5000);
	}
	else {
		win.loadFile('src/web/index.html');
	}
}
var totalFilesToDelete = 0;
var filesDeleted = 0;
// function deleteMyself() {
// 	console.log("deleteMyself");
// 	var directory = configPathLocalFolder + "/resources/app";
// 	fs.readdir(directory, (err, files) => {
// 		if (err) throw err;
// 		totalFilesToDelete = files.length;
// 		filesDeleted = 0;
// 		for (const file of files) {
// 			fs.unlink(path.join(directory, file), err => {
// 				if (err) throw err;
// 				filesDeleted++;
// 				sendBack("fromMainUpdateProgress", ((filesDeleted / totalFilesToDelete) / 2 * 100) + "");
// 				if (filesDeleted == totalFilesToDelete) {
// 					copyANewVersion();
// 				}
// 			});
// 		}
// 	});
// }
function copyANewVersion() {
	console.log("copyANewVersion");
	var directoryRemote = remotePath + "/repadex/resources/app";
	var directoryLocal = configPathLocalFolder + "/resources/app";
	fs.readdir(directoryRemote, (err, files) => {
		if (err) throw err;
		totalFilesToCopy = files.length;
		filesCopied = 0;
		for (const file of files) {
			fs.copyFile(path.join(directoryRemote, file), path.join(directoryLocal, file), err => {
				if (err) throw err;
				filesCopied++;
				sendBack("fromMainUpdateProgress", ((filesCopied / totalFilesToCopy) / 2 * 100 + 50) + "");
				if (filesCopied == totalFilesToCopy) {
					restartMyself();
				}
			});
		}
	});
}
function runSetup() {
	var directoryRemote = remotePath + "/setup.exe";
	const subprocess = spawn(directoryRemote, [''], {
		detached: true,
		stdio: 'ignore'
	});
	subprocess.unref();
	setTimeout(function () { sendBack("fromMainUpdateProgress", "100") }, 200);
}
function update() {
	runSetup();
	// deleteMyself();
}
function restartMyself() {
	console.log("restartMyself");
	const subprocess = spawn(configPathLocalFolder + "/app-1.0.0/RepaDex.exe", [''], {
		detached: true,
		stdio: 'ignore'
	});
	subprocess.unref();
	app.quit();
}
function startup() {
	// console.log(electron.screen.getPrimaryDisplay());
	fs.watchFile(backendPath, function (event, filename) {
		// if(event=="change")
		// {
		sendBack("fromMainLoadfile", "");
		// }
		// console.log('event is: ' + event);
		// if (filename) {
		// 	console.log('filename provided: ' + filename);
		// } else {
		// 	console.log('filename not provided');
		// }
	});
	fs.watchFile(configPath, function (event, filename) {
		// console.log(event);
		// if (event == "change") {
		restartMyself();
		// }
		// console.log('event is: ' + event);
		// if (filename) {
		// 	console.log('filename provided: ' + filename);
		// } else {
		// 	console.log('filename not provided');
		// }
	});
	setTimeout(lockFile, 1000);//start the lockfile routine after copying
}
