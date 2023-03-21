var blockProgress = false;
var stopShaking = false;
var building = "";
var version = "1.1.0b";
var newVersion = "";
var shownPanel = 0;//0 = main table, 1 = repairEdit, 2 = repairForm, 3 = loanerForm, 4 = repair warning, 5 = updating, -1 = settings
var darkMode = true;
var emButtonModal;
var refreshTimer;

$(window).focus(function () { clearInterval(refreshTimer); });
$(window).blur(function () { refreshTimer = setInterval(loadAll, 10 * 60 * 1000); });

$(document).ready(function () {
	loadConfiguration();
	$("#searchInput").select();
	document.addEventListener('keydown', keyDownHandler);
	setTimeout(initPopovers, 500);
	setInterval(changeReception, 200)
	checkVersion();
	setInterval(checkVersion, 60 * 1000);//every minute
	$("#versionLabel").text("v" + version);
	$('#pokeImage').on('animationiteration', function () {
		if (stopShaking) {
			var $this = $(this);
			$this.removeClass('shaker');
			$this.addClass('shakers');
			$("#savingDisplay").fadeOut(1000);
			$("#pokeStars").show();
			$("#saveText").text("Done.");
			//$this.off();
		}
	});
	$("textarea").each(function () {
		if (this.id != "repairNotesArea") {
			this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
		}
	}).on("input", function () {
		if (this.id != "repairNotesArea") {
			this.style.height = "auto";
			this.style.height = (this.scrollHeight) + "px";
		}
	});
	$('#phoneForm').on('keydown', enforceFormat);
	$('#phoneForm').on('keyup', formatToPhone);
	$('#serialForm').on('keyup', upperSerial);
	$('#iPadSN').on('keyup', upperSerial);
	addWorkToast = new bootstrap.Toast($('#addWorkToast'));
	emButtonModal = new bootstrap.Modal($('#emButtonModal'));
	initFilterPopover();
	$(".maximize").click(function (e) { window.api.send("toMain", "actionMaximize"); });
	$(".minimize").click(function (e) { window.api.send("toMain", "actionMinimize"); });
	$(".restore").click(function (e) { window.api.send("toMain", "actionRestore"); });
	$(".close").click(function (e) { window.api.send("toMain", "actionClose"); });
});
var copyComputerModal;
function checkVersion() {
	//console.log("check");
	window.api.send("toMain", "checkVersion");
}
function resetVersionStyling() {
	$("#versionLabel").removeClass("versionClickable");
	$("#versionLabel").addClass("text-muted");
	//$("#versionLabel").css("color", "yellow");
}
var versionPopover;
function versionUnhover() {
	versionPopover.hide();
	//console.log("hidden");
}
function versionHover() {
	if ($("#versionLabel").hasClass("versionClickable")) {
		var versionElement = document.getElementById('versionLabel');
		var options = { "placement": "bottom", "title": version + " -> " + newVersion };
		if (versionPopover != null) {
			//console.log("disposed");
			versionPopover.dispose();
		}
		versionPopover = new bootstrap.Popover(versionElement, options);
		versionPopover.show();
		//console.log("shown");
	}
}
function versionClick() {
	if (!blockProgress) {
		shownPanel = 5;
		$("#container").hide();
		$("#updatingMessage").fadeIn();
		window.api.send("toMain", "update");
	}
}
window.api.receive("fromMainAction", (data) => {
	if (data == "maximize") {
		$(".maximize").hide();
		$(".restore").show();
	}
	else if (data == "minimize") {
		// $(".minimu").hide();
		// $(".restore").show();
	}
	else if (data == "unmaximize") {
		$(".maximize").show();
		$(".restore").hide();
	}
});
window.api.receive("fromMainUpdateProgress", (data) => {
	$("#updateProgressInside").css("width", data + "%");
});
window.api.receive("fromMainRemoteVersion", (data) => {
	//console.log("callback");
	if (data.trim() != version) {
		newVersion = data;
		if (shownPanel < 2) {
			$("#versionLabel").addClass("versionClickable");
			$("#versionLabel").removeClass("text-muted");
			$("#versionLabel").css("color", "#46c46e");
		}
		//console.log("update");
	}
	else {
		$("#versionLabel").removeClass("versionClickable");
		$("#versionLabel").addClass("text-muted");
	}
});
var numberWaits;
function startLoadingSaving(message) {
	numberWaits = 0;
	$("#saveText").text(message);
	$("#waitReason").text("");
	$("#savingDisplay").css("color", "#ddd");
	//$("#saveSpinner").css("visibility", "visible");
	$("#savingDisplay").css("display", "flex").hide().fadeIn();
	//$("#savingDisplay").addClass("d-flex");
	$("#pokeImage").addClass("shaker");
	$("#pokeImage").removeClass('shakers');
	$(".starImage").css("visibility", "shown");
	$("#pokeStars").hide();
	$("#savingDisplay").removeClass("versionClickable");
	stopShaking = false;
	blockProgress = true;
}
function doneLoadingSaving() {
	$("#savingDisplay").css("color", "#ddd");
	$("#waitReason").text("");
	//$("#saveSpinner").css("visibility", "hidden");
	blockProgress = false;
	stopShaking = true;
	if (tryingToGoBack) {
		tryingToGoBack = false;
		backToMain();
	}
}
function tryOverride() {
	if (numberWaits >= 30) {//we are ready to try
		emButtonModal.show();
	}
}
function overrideSafe() {
	var audio = new Audio('emSound.mp3');
	audio.play();
	window.api.send("toMain", "override");
	emButtonModal.hide();
}
window.api.receive("fromMainWaiting", (data) => {
	numberWaits += 2;
	$("#waitReason").text("(" + data + "), " + numberWaits + "s");
	if (numberWaits >= 30) {
		$("#savingDisplay").css("color", "#cc0000");
		$("#savingDisplay").addClass("versionClickable");
	}
	else {
		$("#savingDisplay").css("color", "#cccc00");
	}
});
function keyDownHandler(event) {
	if (event.key == 'Escape' && !blockProgress && shownPanel < 4)//hacky but works?, does not allow esc when showing the warning and updating
	{
		backToMain();
	}
	if (collectKeyboard) {
		building += event.key;
		for (employee in config.employees) {
			var em = config.employees[employee];
			if (building.includes(em.abr)) {
				building = "";
				selectPill(employee);
				//alert(employee);
			}
		}
	}
	//console.log(event);
}
function initPopovers() {
	$.fn.tooltip.Constructor.Default.allowList['*'].push('style');
	$.fn.tooltip.Constructor.Default.allowList['*'].push('onclick');
	var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
	var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
		return new bootstrap.Popover(popoverTriggerEl);
	});
}
$(document).on('click', '.copiable', function () {
	text = event.target.getAttribute("data-text");
	copyTextToClipboard(text);
	$('#toastText').text("Copied \"" + text + "\" to clipboard");
	new bootstrap.Toast($('#liveToast')).show();
});
var config;
var selectedModel;
var selectedMake;
var appleWarningEnabled;
var appleCareRequiresFee;
var appleFindMyWarning;
function setupMakes() {
	$("#makeSelector").empty();
	for (var brand in config.repairables) {
		if (brand == "apple") {
			appleWarningEnabled = config.repairables[brand].warningOnAppleDevices == true;
			appleCareRequiresFee = config.repairables[brand].appleCareRequiresFee == true;
			appleFindMyWarning = config.repairables[brand].findMyWarning == true;
		}
		//<button id="makeOther" type="button" class="btn btn-outline-primary" onclick="makeSelect('Other')">Other</button>
		brandCommonName = config.repairables[brand].commonName;
		$("#makeSelector").append(
			"<button id=\"make" + brandCommonName + "\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"makeSelect('" + brandCommonName + "')\">" + brandCommonName + "</button>"
		);
	}
	$("#makeSelector").append(
		"<button id=\"makeOther\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"makeSelect('Other')\">Other</button>"
	);
}
function setupWarranties() {
	$("#warrantySelector").empty();
	$("#warrantySelector").append(
		"<option value=\"\" selected></option>"
	);
	for (var i = 0; i < config.warranties.length; i++) {
		var warranty = config.warranties[i];
		$("#warrantySelector").append(
			"<option value=\"" + warranty + "\">" + warranty + "</option>"
		);
	}
	$("#warrantySelector").append(
		"<option value=\"Other\">Other</option>"
	);
}
function getPill(innerName, name, id, functionSelect) {
	var styling = 'background-color: ' + config.employees[name].color + '; ' + 'border-color: ' + pSBC(0, config.employees[name].color) + ';';
	if (functionSelect == "") {
		styling += " cursor: initial;"
	}
	var classes;
	if (config.employees[name]["black-text"]) {
		classes = 'badge rounded-pill badge-spaced text-dark';
		//$("#printingPill").addClass("text-dark");
	}
	else {
		classes = 'badge rounded-pill badge-spaced';
		//$("#printingPill").removeClass("text-dark");
	}
	return "<span id=\"" + id + "\" employee=\"" + name + "\" style=\"" + styling + "\" class=\"" + classes + "\" onclick=\"" + functionSelect + "\">" + innerName + "</span>";
}
function getOutlinedPill(name, id, functionSelect) {
	var styling = "border-color: " + config.employees[name].color;
	if (functionSelect == "") {
		styling += " cursor: initial;"
	}
	var classes = 'badge rounded-pill badge-not-selected' + (darkMode ? "" : "text-dark");
	return "<span id=\"" + id + "\" employee=\"" + name + "\" style=\"" + styling + "\" class=\"" + classes + "\" onclick=\"" + functionSelect + "\">" + config.employees[name]["name"] + "</span>";
}
function exportDatabase() {
	JSONToCSVConvertor(backendData["repairs"], "RepaDexDatabase")
}
//code from https://stackoverflow.com/questions/28892885/javascript-json-to-excel-file-download
function JSONToCSVConvertor(JSONData, fileName) {
	var CSV = '';

	var row = "Reference Number, Name, Email, Serial Number, Phone, Warranty, Make, Model, Problem, Intake Notes, Start Date, Who Created Repair, Purchase Date, Accessories, Date Picked Up, Who Picked Up, Line Color, Current Status, iPadSN, Created Repair Form, Diagnosed, Submitted Claim, Submitted RFA, Ordered Parts, Sent Out, Parts Arrived, Waiting on DEP, Finished, Attached File, Notes";


	//append Label row with line break
	CSV += row + '\r\n';
	console.log(JSONData);
	for (var refNum in JSONData) {
		var repair = JSONData[refNum];
		var row = refNum + ",";
		row += repair["name"].replaceAll(",", "") + ",";
		row += repair["email"].replaceAll(",", "") + ',';
		row += repair["serial"].replaceAll(",", "") + ',';
		row += repair["phone"].replaceAll(",", "") + ',';
		row += repair["warranty"].replaceAll(",", "") + ',';
		row += repair["make"].replaceAll(",", "") + ',';
		row += repair["model"].replaceAll(",", "") + ',';
		row += repair["problem"].replaceAll(",", "") + ',';
		row += repair["intakeNotes"].replaceAll(",", "") + ',';
		row += repair["startDate"].replaceAll(",", "") + ',';
		row += repair["workCompleted"][0]["who"].replaceAll(",", "") + ',';
		row += repair["purchaseDate"].replaceAll(",", "") + ',';
		row += repair["acc"].replaceAll(",", "") + ',';
		if (repair["datePicked"]) {
			row += repair["datePicked"]["when"].replaceAll(",", "") + ',';
			row += repair["datePicked"]["who"].replaceAll(",", "") + ',';
		}
		else {
			row += ",,";
		}
		row += repair["color"].replaceAll(",", "") + ',';
		row += repair["status"].replaceAll(",", "") + ',';
		row += repair["iPadSN"].replaceAll(",", "") + ',';

		var workCompleted = repair["workCompleted"];
		var createdRepairForm = '';
		var diagnosed = '';
		var submittedClaim = '';
		var submittedRFA = '';
		var orderedParts = '';
		var sentOut = '';
		var partsArrived = '';
		var waitingOnDEP = '';
		var finished = '';
		var attachedFile = '';
		var notes = '';
		for (var i in workCompleted) {
			var work = workCompleted[i];
			if (work["what"] == "Created Repair Form") {
				if (createdRepairForm != '') {
					createdRepairForm += ";";
				}
				createdRepairForm += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Diagnosed") {
				if (diagnosed != '') {
					diagnosed += ";";
				}
				diagnosed += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Submitted Claim") {
				if (submittedClaim != '') {
					submittedClaim += ";";
				}
				submittedClaim += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Submitted RFA") {
				if (submittedRFA != '') {
					submittedRFA += ";";
				}
				submittedRFA += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Ordered Parts") {
				if (orderedParts != '') {
					orderedParts += ";";
				}
				orderedParts += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Sent Out") {
				if (sentOut != '') {
					sentOut += ";";
				}
				sentOut += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Parts Arrived") {
				if (partsArrived != '') {
					partsArrived += ";";
				}
				partsArrived += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Waiting on DEP") {
				if (waitingOnDEP != '') {
					waitingOnDEP += ";";
				}
				waitingOnDEP += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Finished") {
				if (finished != '') {
					finished += ";";
				}
				finished += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Attached File") {
				if (attachedFile != '') {
					attachedFile += ";";
				}
				attachedFile += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
			if (work["what"] == "Note") {
				if (notes != '') {
					notes += ";";
				}
				notes += work["who"] + " " + work["when"] + " " + work["note"] + " ";
			}
		}
		row = row + createdRepairForm.replaceAll(",", "") + ",";
		row = row + diagnosed.replaceAll(",", "") + ",";
		row = row + submittedClaim.replaceAll(",", "") + ",";
		row = row + submittedRFA.replaceAll(",", "") + ",";
		row = row + orderedParts.replaceAll(",", "") + ",";
		row = row + sentOut.replaceAll(",", "") + ",";
		row = row + partsArrived.replaceAll(",", "") + ",";
		row = row + waitingOnDEP.replaceAll(",", "") + ",";
		row = row + finished.replaceAll(",", "") + ",";
		row = row + attachedFile.replaceAll(",", "") + ",";
		row = row + notes.replaceAll(",", "") + ",";


		CSV += row + '\r\n';
	}

	//Initialize file format you want csv or xls
	var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

	// Now the little tricky part.
	// you can use either>> window.open(uri);
	// but this will not work in some browsers
	// or you will not get the correct file extension    

	//this trick will generate a temp <a /> tag
	var link = document.createElement("a");
	link.href = uri;

	//set the visibility hidden so it will not effect on your web-layout
	link.style = "visibility:hidden";
	link.download = fileName + ".csv";

	//this part will append the anchor tag and remove it after automatic click
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
function loadConfiguration() {
	// Called when message received from main process
	window.api.receive("fromMainConfig", (data) => {
		try {
			config = JSON.parse(data);
			if (!config["searchRequiresSubmit"]) {
				$("#searchButton").remove();
				$("#searchInput").attr("oninput", "search()");
				//$("#searchInput").css("height: 38px; width:100%");
				//$("#searchInputGroup").removeClass("input-group");
			}
			var amountDim = -0.3;
			if (darkMode) {
				amountDimDarkMode = .5;
				amountDim = .70;
				var otherColor = "#222529";
				$("body").get(0).style.setProperty("--defaultColor", pSBC(amountDimDarkMode, config["defaultColor"], otherColor));
				$("body").get(0).style.setProperty("--defaultColorHover", pSBC(amountDim, config["defaultColor"], otherColor));
				$("body").get(0).style.setProperty("--datePickedColor", pSBC(amountDimDarkMode, config["pickedColor"], otherColor));
				$("body").get(0).style.setProperty("--datePickedColorHover", pSBC(amountDim, config["pickedColor"], otherColor));
				$("body").get(0).style.setProperty("--sentOutColor", pSBC(amountDimDarkMode, config["sentOutColor"], otherColor));
				$("body").get(0).style.setProperty("--sentOutColorHover", pSBC(amountDim, config["sentOutColor"], otherColor));
				$("body").get(0).style.setProperty("--diagColor", pSBC(amountDimDarkMode, config["diagColor"], otherColor));
				$("body").get(0).style.setProperty("--diagColorHover", pSBC(amountDim, config["diagColor"], otherColor));
				$("body").get(0).style.setProperty("--submittedClaimColor", pSBC(amountDimDarkMode, config["submittedClaimColor"], otherColor));
				$("body").get(0).style.setProperty("--submittedClaimColorHover", pSBC(amountDim, config["submittedClaimColor"], otherColor));
				$("body").get(0).style.setProperty("--submittedRFAColor", pSBC(amountDimDarkMode, config["submittedRFAColor"], otherColor));
				$("body").get(0).style.setProperty("--submittedRFAColorHover", pSBC(amountDim, config["submittedRFAColor"], otherColor));
				$("body").get(0).style.setProperty("--orderedPartsColor", pSBC(amountDimDarkMode, config["orderedPartsColor"], otherColor));
				$("body").get(0).style.setProperty("--orderedPartsColorHover", pSBC(amountDim, config["orderedPartsColor"], otherColor));
				$("body").get(0).style.setProperty("--partsArrivedColor", pSBC(amountDimDarkMode, config["partsArrivedColor"], otherColor));
				$("body").get(0).style.setProperty("--partsArrivedColorHover", pSBC(amountDim, config["partsArrivedColor"], otherColor));
				$("body").get(0).style.setProperty("--waitingOnDEPColor", pSBC(amountDimDarkMode, config["waitingForDEPColor"], otherColor));
				$("body").get(0).style.setProperty("--waitingOnDEPColorHover", pSBC(amountDim, config["waitingForDEPColor"], otherColor));
				$("body").get(0).style.setProperty("--finishedColor", pSBC(amountDimDarkMode, config["finishedColor"], otherColor));
				$("body").get(0).style.setProperty("--finishedColorHover", pSBC(amountDim, config["finishedColor"], otherColor));
			}
			else {
				$("body").get(0).style.setProperty("--datePickedColor", config["pickedColor"]);
				$("body").get(0).style.setProperty("--datePickedColorHover", pSBC(amountDim, config["pickedColor"]));
				$("body").get(0).style.setProperty("--sentOutColor", config["sentOutColor"]);
				$("body").get(0).style.setProperty("--sentOutColorHover", pSBC(amountDim, config["sentOutColor"]));
				$("body").get(0).style.setProperty("--diagColor", config["diagColor"]);
				$("body").get(0).style.setProperty("--diagColorHover", pSBC(amountDim, config["diagColor"]));
				$("body").get(0).style.setProperty("--submittedClaimColor", config["submittedClaimColor"]);
				$("body").get(0).style.setProperty("--submittedClaimColorHover", pSBC(amountDim, config["submittedClaimColor"]));
				$("body").get(0).style.setProperty("--submittedRFAColor", config["submittedRFAColor"]);
				$("body").get(0).style.setProperty("--submittedRFAColorHover", pSBC(amountDim, config["submittedRFAColor"]));
				$("body").get(0).style.setProperty("--orderedPartsColor", config["orderedPartsColor"]);
				$("body").get(0).style.setProperty("--orderedPartsColorHover", pSBC(amountDim, config["orderedPartsColor"]));
				$("body").get(0).style.setProperty("--partsArrivedColor", config["partsArrivedColor"]);
				$("body").get(0).style.setProperty("--partsArrivedColorHover", pSBC(amountDim, config["partsArrivedColor"]));
				$("body").get(0).style.setProperty("--waitingOnDEPColor", config["waitingForDEPColor"]);
				$("body").get(0).style.setProperty("--waitingOnDEPColorHover", pSBC(amountDim, config["waitingForDEPColor"]));
				$("body").get(0).style.setProperty("--finishedColor", config["finishedColor"]);
				$("body").get(0).style.setProperty("--finishedColorHover", pSBC(amountDim, config["finishedColor"]));
			}

			//<span id="selectEmployeeTodd" class="badge rounded-pill badge-not-selected text-dark badge-spaced" onclick="selectPill('Todd')">Todd</span>
			var building = "<div class=\"overflow-auto insideSaveAs\">";
			var buildingLogin = "<h5>";
			setupSettingsUsers(config);
			for (var employee in config.employees) {

				if (!config.employees[employee].active)//skip if not active
				{
					continue;
				}
				$(".workerSelect").append(
					getOutlinedPill(employee, "selectEmployee" + employee, "selectPill('" + employee + "')")
				);
				if (config.employees[employee].manager || config.employees[employee].repairTeam) {
					$("#loanerWorkerSelector").append(
						getOutlinedPill(employee, "selectLoanerEmployee" + employee, "selectLoanerPill('" + employee + "')")
					);
				}
				if (config.employees[employee].repairTeam) {
					/*var pillStyle = 'background-color: '+config.employees[employee].color+'; '+'border-color: '+config.employees[employee].color+';';
					var pillClasses = '';
					if(config.employees[employee]["black-text"])
					{
						pillClasses = 'badge rounded-pill badge-spaced text-dark';
					}
					else
					{
						pillClasses = 'badge rounded-pill badge-spaced';
					}
					building += "<span id=\"repairEmployee"+employee+"\" class=\""+pillClasses+"\" onclick=\"selectRepairPill('"+employee+"')\" style=\""+pillStyle+"\">"+employee+"</span>"*/
					building += getPill(config.employees[employee]["name"], employee, "repairEmployee" + employee, "selectRepairPill('" + employee + "')");;
					buildingLogin += getPill(config.employees[employee]["name"], employee, "repairEmployeeLogin" + employee, "selectLoginPill('" + employee + "')");;
				}
			}
			$("#workerSelector").css("font-size", config["workerSelectorFontSize"]);
			$("#loanerWorkerSelector").css("font-size", config["workerSelectorFontSize"]);
			building += "</div>";
			buildingLogin += "</h5>";
			$('#saveWorkAsButton').attr("data-bs-content", building);
			$("#toastTextLogin").append(buildingLogin);
			//setupMakes(); called with resetRepairForm
			//setupWarranties(); called like above
			$("#dropOffStatement").text(config.dropOffStatement);
			$("#pickUpStatement").text(config.pickUpStatement);
			$("#loanerPickupStatement").text(config.loanerPickupStatement);
			$("#tooManyResultsWarning").text("There are more than " + config["maxRowsAtOnce"] + " results for your search, please refine your parameters");
			//console.log(config);
		}
		catch (e) {
			console.log(e);
			$("#mainError").show();
			$("#container").hide();
			$("#mainError").text("There is an error with configuration.json, can't load");
			//console.log("it seems like there is a problem with the json");
		}
		//console.log('Received ${'+data+'} from main process');
	});

	// Send a message to the main process
	window.api.send("toMain", "configPls");
	if (darkMode) {
		$("body").get(0).style.setProperty("color-scheme", "dark");
		$("body").get(0).style.setProperty("--h5-color", "#ddd");
		$("#dex").css("color", "#ccc");
		oldColor = "#ccc";
		$("#RepaPart").css("color", "#ccc");
		$(".repairEditPencilImage").prop("src", "pencil-dark.svg");
		$(".repairLogImage").prop("src", "journal-dark.svg");
		$(".repairReprintImage").prop("src", "printer-dark.svg");
		$(".repairReprintImage").prop("src", "printer-dark.svg");
		for (var i = 1; i <= 5; i++) {
			$("#reception-" + i).prop("src", "reception-" + (i - 1) + "-dark.svg");
		}
		$("#settings-gear").prop("src", "gear-fill-dark.svg");
		// $("body").css("background", "#303338");
		// $("th").css("color", "#ccc");
		// $("td").css("color", "#ccc");
		$("html").attr("data-bs-theme", "dark");
	}
}
var connectionState = 0;//-1 = disconnected, 0 = connecting, 1 = connected
var receptionNumber = 0;
function changeReception() {
	$(".reception").hide();
	receptionNumber++;
	$("#reception-" + receptionNumber).show();
	if (receptionNumber == 5) {
		receptionNumber = 0;
	}
}
window.api.receive("fromMainDisconnected", (data) => {
	if (shownPanel < 4) {
		$("#container").hide();
		$("#connectingMessage").hide();
		$("#disconnectedMessage").fadeIn();
		connectionState = -1;
	}
});
window.api.receive("fromMainConnected", (data) => {
	checkIfFrontIsLoading();
	$("#disconnectedMessage").hide();
	if (shownPanel < 4) {
		$("#container").show();
		$("#connectingMessage").hide();
		connectionState = 1;
	}
	else {
		//$("#container").show();
	}
});
var collectKeyboard = false;
function startCollectKeyboard() {
	collectKeyboard = true;
	//console.log(collectKeyboard);
}
function stopCollectKeyboard() {
	collectKeyboard = false;
	//console.log(collectKeyboard);
}
function changeEmployee() {
	//var elementEl = $("#saveAsButton");;
	//var tooltip = new bootstrap.Tooltip(elementEl);
}
/*function backToTable()
{
	$( "#mainTable" ).show();
	$( "#repairForm" ).hide();
	$( "#repairEdit" ).hide();
}*/
function fallbackCopyTextToClipboard(text) {
	var textArea = document.createElement("textarea");
	textArea.value = text;

	// Avoid scrolling to bottom
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.position = "fixed";

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';
		console.log('Fallback: Copying text command was ' + msg);
	} catch (err) {
		console.error('Fallback: Oops, unable to copy', err);
	}
	document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text);
		return;
	}
	navigator.clipboard.writeText(text).then(function () {
		//console.log('Async: Copying to clipboard was successful!');
	}, function (err) {
		//console.error('Async: Could not copy text: ', err);
	});
}
function removeTransision() {
	$("#RepaPart").css("color", oldColor);
	$("#RepaPartTop").removeClass("RepaPartTrans");
	timer = 0;
}
var oldColor = "#000000";
var timer = 0;
function setRepaColor(newColor) {
	//$("#RepaPartTop").removeClass("RepaPartTrans");
	//$("#RepaPart").css("background", "linear-gradient(to right, "+oldColor+", "+oldColor+" 50%, "+newColor+" 50%);");
	//$("#RepaPart").css("background-position", "100%");
	$("#RepaPartTop").css("color", newColor);
	$("#RepaPartTop").addClass("RepaPartTrans");
	oldColor = newColor;
	if (timer != 0) {
		clearTimeout(timer);
	}
	timer = setTimeout(removeTransision, 500);
	//$("#RepaPart").css("color", newColor);
}
function makeid(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
var aboutModal;
function showAbout() {
	if (!aboutModal) {
		aboutModal = new bootstrap.Modal(document.getElementById('aboutModal'));
	}
	aboutModal.show();
}

function makeDescriptors(repair) {
	var descriptors = [];
	if (repair["phone"]) {
		descriptors.push(repair["phone"].toLowerCase());
	}
	descriptors.push(repair["email"].toLowerCase());
	descriptors.push(repair["serial"].toLowerCase());
	descriptors.push(repair["name"].toLowerCase());
	descriptors.push((repair["refNum"] + "").toLowerCase());//convert to string
	if (repair["iPadSN"]) {
		descriptors.push(repair["iPadSN"].toLowerCase());
	}
	return descriptors;
}
function generateRandomRepair(refNum) {
	var json = {};
	json["refNum"] = refNum;
	json["name"] = "name" + refNum;
	json["serial"] = "serial" + makeid(10);
	json["email"] = "email" + makeid(10) + "@osu.edu";
	json["startDate"] = new Date().toJSON();
	json["acc"] = "acc" + makeid(10);
	json["intakeNotes"] = "notes" + makeid(10);
	json["phone"] = "phone" + makeid(3) + "-" + makeid(3) + "-" + makeid(4);
	json["purchaseDate"] = "purch" + makeid(3);
	//json["lastTouched"] = new Date().toJSON();
	var problem = "prob" + makeid(10);
	var warranty = "warr" + makeid(10);
	json["make"] = "Apple";
	json["model"] = "iPad Something";
	json["status"] = "Created Repair Form";
	var date = new Date();
	json["logs"] = [{ "who": "fojtik.6", "what": "Created the repair", "when": date.toJSON() }];
	//date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	json["workCompleted"] = [{ "who": "fojtik.6", "when": date.toJSON(), "what": "Created Repair Form", "note": "" }];
	json["descriptors"] = makeDescriptors(json);
	//json["archived"] = false;
	return json;
}
function generateLots(amount) {
	var repairs = {};
	for (var i = 0; i < amount; i++) {
		repairs[(i + 1) + ""] = generateRandomRepair(i + 1);
	}
	console.log(JSON.stringify(repairs));
}
//https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
// Version 4.0
const pSBC = (p, c0, c1, l) => {
	let r, g, b, P, f, t, h, i = parseInt, m = Math.round, a = typeof (c1) == "string";
	if (typeof (p) != "number" || p < -1 || p > 1 || typeof (c0) != "string" || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
	if (!this.pSBCr) this.pSBCr = (d) => {
		let n = d.length, x = {};
		if (n > 9) {
			[r, g, b, a] = d = d.split(","), n = d.length;
			if (n < 3 || n > 4) return null;
			x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1
		} else {
			if (n == 8 || n == 6 || n < 4) return null;
			if (n < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
			d = i(d.slice(1), 16);
			if (n == 9 || n == 5) x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = m((d & 255) / 0.255) / 1000;
			else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1
		} return x
	};
	h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == "c" ? !h : false : h, f = this.pSBCr(c0), P = p < 0, t = c1 && c1 != "c" ? this.pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }, p = P ? p * -1 : p, P = 1 - p;
	if (!f || !t) return null;
	if (l) r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
	else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
	a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
	if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
	else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
}
