var refNumIn;
var addedWorkRefNum = 0;
var addWorkToast;
var loginToast;
var deleteClicksLeft;
var dontOverrideWarranty = false
var dontOverrideProblem = false;
var checkingInLoaner = false;
var attachModal;


document.addEventListener('drop', (event) => {
	// console.log("drop");
	// console.log(event);
	console.log(event.dataTransfer.files);
	event.preventDefault();
	event.stopPropagation();

	if (loggedInAs == "" || shownPanel != 1) {
		return;
	}
	for (const f of event.dataTransfer.files) {
		// Using the path attribute to get absolute file path
		// console.log('File Path of dragged files: ', f.path);


		var repairWork = JSON.parse("{}");
		repairWork["who"] = loggedInAs;
		repairWork["when"] = new Date().toJSON();
		repairWork["what"] = "Attached File";
		repairWork["note"] = f.path;
		repairWork["isPath"] = true;

		var logEntry = JSON.parse("{}");
		logEntry["who"] = loggedInAs;
		logEntry["when"] = repairWork["when"];
		logEntry["what"] = repairWork["what"] + ": " + f.path;
		currentRepairJSON["workCompleted"].push(repairWork);
		currentRepairJSON["logs"].push(logEntry);
	}
	startLoadingSaving("Attaching " + event.dataTransfer.files.length + " file" + (event.dataTransfer.files.length == 1 ? "" : "s") + "...");
	figureOutColorAndStatus();
	addedWorkRefNum = refNumIn;
	window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
	freezeForm();
});

// $(document).on('drago')

var hideAttachFileModalTimer = -1;
document.addEventListener('dragover', (event) => {
	console.log(event);
	$(".attachmentPokeball").css("left", (event.clientX - 75) + "px");
	$(".attachmentPokeball").css("top", (event.clientY - 100) + "px");
	event.preventDefault();
	event.stopPropagation();
	// console.log("trip");
	if (hideAttachFileModalTimer > 0) {
		clearTimeout(hideAttachFileModalTimer);
	}
	else {
		$(".balltop").css("margin-top", "-145px");
		if (shownPanel == 1) {
			if (loggedInAs != "") {
				$("#attachMessage").text("Attach File");
				$(".attachmentPokeball").fadeIn();
			}
			else {
				attachModal.show();
				$("#attachMessage").text("You have to log in to attach files");
			}
			// attachModal.show();
		}
		// console.log("show");
	}
	hideAttachFileModalTimer = setTimeout(hideAttachFileModal, 200);
	// console.log('dragover');
});
document.addEventListener('dragenter', (event) => {
	console.log(event.dataTransfer.items[0]);
});
function hideAttachFileModal() {
	attachModal.hide();
	$(".attachmentPokeball").fadeOut();
	// console.log("hide");
	hideAttachFileModalTimer = -1;
}


$(document).on("keyup", '#assetTagForm', function (e) {
	if (e.keyCode == 13 && !repairEditFrozen) {
		issueLoaner();
	}
});
$(document).on("keyup", '#noteTextInput', function (e) {
	if (e.keyCode == 13 && !$("#saveWorkButton").is(":disabled")) {
		saveWork();
	}
});
$(document).ready(function () {
	$('#loginToast').on('hidden.bs.toast', function () {
		if (loginToast) {
			loginToast.dispose();
		}
	});
});
function findOtherRepairs() {
	var mySerial = currentRepairJSON["serial"];
	var otherRelatedSerialRefs = [];
	for (var refNum in backendData["repairs"]) {
		var otherSerial = backendData["repairs"][refNum]["serial"];
		if (otherSerial == mySerial) {
			otherRelatedSerialRefs.push(refNum);
		}
	}
	return otherRelatedSerialRefs;
	//console.log(otherRelatedSerialRefs);
}
var repairEditFrozen;
function freezeForm() {
	repairEditFrozen = true;
	$("#repairEditBackButton").prop('disabled', true);
	$(".editWorkButtons").prop('disabled', true);
	$("#repairContextButtons").fadeOut();
	$(".not-active").css("cursor", "default");
}
function unfreezeForm() {
	repairEditFrozen = false;
	$("#repairEditBackButton").prop('disabled', false);
	$(".editWorkButtons").prop('disabled', false);
	$("#repairContextButtons").fadeIn();
	$(".not-active").css("cursor", "pointer");
}
function showRelatedRepairs(refNum) {
	$("#repairNav").children(".nav-repair-item").remove();//remove anything that was there
	var otherRepairs = findOtherRepairs();
	for (var i in otherRepairs) {
		var date = new Date(backendData["repairs"][otherRepairs[i]]["startDate"]);
		var dateText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
		var htmlAppend;
		if (otherRepairs[i] == refNum) {
			htmlAppend = "<li class='nav-item nav-repair-item'><a class='nav-link nav-repair-item-link active'>" + dateText + "</a></li>";
		}
		else {
			htmlAppend = "<li class='nav-item nav-repair-item'><a class='nav-link nav-repair-item-link not-active' onclick='showOtherRepair(" + otherRepairs[i] + ")'>" + dateText + "</a></li>";
		}
		//console.log(htmlAppend);
		$("#repairBackButtonItem").after(htmlAppend);
	}
}
function showOtherRepair(otherRefNum) {
	if (!repairEditFrozen) {
		showRepair(backendData["repairs"], otherRefNum);//show the repair and start a new request for data (for updated info)
		//startUpdate(otherRefNum);
	}
}
function deleteWork() {
	var popover = bootstrap.Popover.getInstance($('#deleteWorkButton'));
	popover.dispose();
	if (deleteClicksLeft == 0) {
		addWorkToast.hide();
		var logEntry = JSON.parse("{}");
		logEntry["who"] = loggedInAs;
		logEntry["when"] = new Date().toJSON();
		logEntry["what"] = "deleted work entry " + editingIndex + ": " + currentRepairJSON["workCompleted"][editingIndex]["what"];
		currentRepairJSON["workCompleted"].splice(editingIndex, 1);
		currentRepairJSON["logs"].push(logEntry);
		//console.log(JSON.stringify(currentRepairJSON["workCompleted"]));
		figureOutColorAndStatus();
		freezeForm();
		startLoadingSaving("Deleting record...");
		addedWorkRefNum = refNumIn;
		window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
	}
	else {
		$('#deleteWorkButton').attr("data-bs-content", "Click " + deleteClicksLeft + " more time" + (deleteClicksLeft == 1 ? "" : "s") + " to delete.");
		var popover = new bootstrap.Popover($("#deleteWorkButton"));
		popover.show();
		deleteClicksLeft--;
	}
}
function closeSaveAsPopover() {
	var popover = bootstrap.Popover.getInstance($('#saveWorkAsButton'));
	if (popover) {
		popover.hide();
	}
}
function startUpdate(refNum) {
	refNumIn = refNum;
	window.api.send("toMain", "updateRepairs");
	startLoadingSaving("Looking for updated information...");
	freezeForm();
}
window.api.receive("fromMainUpdateRepairs", (data) => {
	doneLoadingSaving();
	backendData = JSON.parse(data);
	showRepair(backendData["repairs"], refNumIn);
});
var loggedInAs = "";
var editingIndex = -1;
function editPencil(index) {
	if (loggedInAs == "") {
		showLoginToast();
	}
	else {
		$("#addWorkTitle").text("Edit Work");
		var date = new Date(currentRepairJSON["workCompleted"][index]["when"]);
		date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
		$("#addWorkDate").val(date.toISOString().slice(0, 16));
		$("#noteTextInput").val(currentRepairJSON["workCompleted"][index]["note"]);
		$("#addWorkSelector").val(currentRepairJSON["workCompleted"][index]["what"]);
		editingIndex = index;
		addWorkToast.show();
		var popover = new bootstrap.Popover($("#deleteWorkButton"));
		deleteClicksLeft = 5;
		$("#deleteButtonCol").show();
	}
}
var currentRepairJSON;
function selectRepairPill(name) {
	saveWorkAs(name);
}
function saveWorkAs(name) {
	var date = $("#addWorkDate").val();
	var repairWork = JSON.parse("{}");
	repairWork["who"] = name;
	repairWork["when"] = new Date(date).toJSON();
	repairWork["what"] = $("#addWorkSelector").val();
	repairWork["note"] = $("#noteTextInput").val();

	var logEntry = JSON.parse("{}");
	logEntry["who"] = name;
	logEntry["when"] = repairWork["when"];
	var somethingChanged = false;
	if (editingIndex >= 0) {
		var oldWork = currentRepairJSON["workCompleted"][editingIndex]["what"];
		var oldNote = currentRepairJSON["workCompleted"][editingIndex]["note"];
		var oldName = currentRepairJSON["workCompleted"][editingIndex]["who"];
		var somethingChanged = false;
		if (oldWork != repairWork["what"]) {
			logEntry["what"] = "edited work entry " + editingIndex + ": " + oldWork + " -> " + repairWork["what"];
			somethingChanged = true;
		}
		else if (oldNote != repairWork["note"]) {
			logEntry["what"] = "edited work note " + editingIndex + ": " + oldNote + " -> " + repairWork["note"];
			somethingChanged = true;
		}
		else if (oldName != repairWork["who"]) {
			logEntry["what"] = "edited work author " + editingIndex + ": " + oldName + " -> " + repairWork["who"];
			somethingChanged = true;
		}
		currentRepairJSON["workCompleted"][editingIndex] = repairWork;
		startLoadingSaving("Saving edited work...");
		editingIndex = -1;
	}
	else {
		logEntry["what"] = "added work: " + $("#addWorkSelector").val();
		somethingChanged = true;
		currentRepairJSON["workCompleted"].push(repairWork);
		startLoadingSaving("Saving added work...");
	}
	if (somethingChanged)//false if they opened to edit but didnt change anything
	{
		currentRepairJSON["logs"].push(logEntry);
	}
	figureOutColorAndStatus();
	addedWorkRefNum = refNumIn;
	window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
	addWorkToast.hide();
	closeSaveAsPopover();
	freezeForm();
}
function saveWork() {
	saveWorkAs(loggedInAs);
}
function resetAddWork() {
	$("#addWorkTitle").text("Add Work");
	editingIndex = -1;
	var date = new Date();
	//var dateStr = date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2, '0')+"-"+String(date.getDate()).padStart(2, '0');
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	$("#addWorkDate").val(date.toISOString().slice(0, 16));
	$("#noteTextInput").val("");
	$("#addWorkSelector").val("Submitted Claim");
	$("#deleteButtonCol").hide();
}
function addWork() {
	resetAddWork();
	addWorkToast.show();
}
function selectLoginPill(name) {
	loggedInAs = name;
	$(".workEditPencil").show();
	setRepaColor(config.employees[name].color);
	$("#addWorkButton").text("Add Work");
	$("#addWorkButton").removeClass("btn-secondary");
	$("#addWorkButton").addClass("btn-success");
	$("#loggedInAsLabel").text("Logged in as: " + name);
	$("#issueLoanerButton").prop('disabled', false);
	$("#checkInLoanerButton").prop('disabled', false);
	loginToast.hide();
}
function showLoginToast() {
	loginToast = new bootstrap.Toast($('#loginToast'));
	loginToast.show();
}
function addWorkLogin() {
	if (loggedInAs == "") {
		showLoginToast();
	}
	else {
		addWork();
	}
}
function editRepairPencil() {
	$("#customerNameEditForm").val(currentRepairJSON["name"]);
	$("#emailEditForm").val(currentRepairJSON["email"]);
	$("#phoneEditForm").val(currentRepairJSON["phone"]);
	$("#serialEditForm").val(currentRepairJSON["serial"]);
	$("#makeEditForm").val(currentRepairJSON["make"]);
	$("#modelEditForm").val(currentRepairJSON["model"]);
	$("#warrEditForm").val(currentRepairJSON["warranty"]);
	$("#accEditForm").val(currentRepairJSON["acc"]);
	$("#probEditForm").val(currentRepairJSON["problem"]);
	$("#notesEditForm").val(currentRepairJSON["intakeNotes"]);
	$("#iPadSerialEditForm").val(currentRepairJSON["iPadSN"]);
	$("#purchaseDateEditForm").val(currentRepairJSON["purchaseDate"]);
	if (currentRepairJSON["address"]) {
		$("#address1EditForm").val(currentRepairJSON["address"]["address1"]);
		$("#address2EditForm").val(currentRepairJSON["address"]["address2"]);
		$("#cityEditForm").val(currentRepairJSON["address"]["city"]);
		$("#stateEditForm").val(currentRepairJSON["address"]["state"]);
		$("#zipEditForm").val(currentRepairJSON["address"]["zip"]);
	}
	else {
		$("#address1EditForm").val("");
		$("#address2EditForm").val("");
		$("#cityEditForm").val("");
		$("#stateEditForm").val("");
		$("#zipEditForm").val("");
	}
	setupEditRepairWorkerSelector();
	if (loggedInAs == "") {
		$("#saveEditRepairButton").prop("disabled", true);
		//$("#editRepairGroup").addClass("input-group");
	}
	else {
		$("#editRepairWorkerSelector").val(loggedInAs);
		$("#saveEditRepairButton").prop("disabled", false);
		//$("#editRepairGroup").removeClass("input-group");
	}
}
function saveEditRepair() {
	var logEntry = JSON.parse("{}");
	logEntry["who"] = $("#editRepairWorkerSelector").val();
	logEntry["when"] = new Date().toJSON();
	var buildingLog = "";
	var newName = $("#customerNameEditForm").val();
	if (newName != currentRepairJSON["name"]) {
		buildingLog += " name: '" + currentRepairJSON["name"] + "' -> '" + newName + "'";
	}
	currentRepairJSON["name"] = newName;

	var newEmail = $("#emailEditForm").val();
	if (newEmail != currentRepairJSON["email"]) {
		buildingLog += " email: '" + currentRepairJSON["email"] + "' -> '" + newEmail + "'";
	}
	currentRepairJSON["email"] = newEmail;

	var newPhone = $("#phoneEditForm").val();
	if (newPhone != currentRepairJSON["phone"]) {
		buildingLog += " phone: '" + currentRepairJSON["phone"] + "' -> '" + newPhone + "'";
	}
	currentRepairJSON["phone"] = newPhone;

	var newSerial = $("#serialEditForm").val();
	if (newSerial != currentRepairJSON["serial"]) {
		buildingLog += " serial: '" + currentRepairJSON["serial"] + "' -> '" + newSerial + "'";
	}
	currentRepairJSON["serial"] = newSerial;

	var newMake = $("#makeEditForm").val();
	if (newMake != currentRepairJSON["make"]) {
		buildingLog += " make: '" + currentRepairJSON["make"] + "' -> '" + newMake + "'";
	}
	currentRepairJSON["make"] = newMake;

	var newModel = $("#modelEditForm").val();
	if (newModel != currentRepairJSON["model"]) {
		buildingLog += " model: '" + currentRepairJSON["model"] + "' -> '" + newModel + "'";
	}
	currentRepairJSON["model"] = newModel;

	var newWarr = $("#warrEditForm").val();
	if (newWarr != currentRepairJSON["warranty"]) {
		buildingLog += " warranty: '" + currentRepairJSON["warranty"] + "' -> '" + newWarr + "'";
	}
	currentRepairJSON["warranty"] = newWarr;

	var newAcc = $("#accEditForm").val();
	if (newAcc != currentRepairJSON["acc"]) {
		buildingLog += " acc: '" + currentRepairJSON["acc"] + "' -> '" + newAcc + "'";
	}
	currentRepairJSON["acc"] = newAcc;

	var newProblem = $("#probEditForm").val();
	if (newProblem != currentRepairJSON["problem"]) {
		buildingLog += " problem: '" + currentRepairJSON["problem"] + "' -> '" + newProblem + "'";
	}
	currentRepairJSON["problem"] = newProblem;

	var newiPadSN = $("#iPadSerialEditForm").val();
	if (newiPadSN != currentRepairJSON["iPadSN"]) {
		buildingLog += " iPadSN: '" + currentRepairJSON["iPadSN"] + "' -> '" + newiPadSN + "'";
	}
	currentRepairJSON["iPadSN"] = newiPadSN;

	var newPurch = $("#purchaseDateEditForm").val();
	if (newPurch != currentRepairJSON["purchaseDate"]) {
		buildingLog += " purchaseDate: '" + currentRepairJSON["purchaseDate"] + "' -> '" + newPurch + "'";
	}
	currentRepairJSON["purchaseDate"] = newPurch;

	var newIntakeNotes = $("#notesEditForm").val();
	if (newIntakeNotes != currentRepairJSON["intakeNotes"]) {
		buildingLog += " intakeNotes: '" + currentRepairJSON["intakeNotes"] + "' -> '" + newIntakeNotes + "'";
	}
	currentRepairJSON["intakeNotes"] = newIntakeNotes;

	var newAdd1 = $("#address1EditForm").val();
	var newAdd2 = $("#address2EditForm").val();
	var newCity = $("#cityEditForm").val();
	var newState = $("#stateEditForm").val();
	var newZip = $("#zipEditForm").val();
	if ((newAdd1 != "" || newAdd2 != "" || newCity != "" || newState != "" || newZip != "") && !currentRepairJSON["address"]) {
		currentRepairJSON["address"] = {};//make an address object if we need to so that we can compare stuff later
		createdAddress = true;
		buildingLog += "created address: ";
	}
	if (currentRepairJSON["address"]) {
		if (newAdd1 != currentRepairJSON["address"]["address1"]) {
			buildingLog += " address address1: '" + currentRepairJSON["address"]["address1"] + "' -> '" + newAdd1 + "'";
		}
		currentRepairJSON["address"]["address1"] = newAdd1;

		if (newAdd2 != currentRepairJSON["address"]["address2"]) {
			buildingLog += " address address2: '" + currentRepairJSON["address"]["address2"] + "' -> '" + newAdd2 + "'";
		}
		currentRepairJSON["address"]["address2"] = newAdd2;

		if (newCity != currentRepairJSON["address"]["city"]) {
			buildingLog += " address city: '" + currentRepairJSON["address"]["city"] + "' -> '" + newCity + "'";
		}
		currentRepairJSON["address"]["city"] = newCity;

		if (newState != currentRepairJSON["address"]["state"]) {
			buildingLog += " address state: '" + currentRepairJSON["address"]["state"] + "' -> '" + newState + "'";
		}
		currentRepairJSON["address"]["state"] = newState;

		if (newZip != currentRepairJSON["address"]["zip"]) {
			buildingLog += " address zip: '" + currentRepairJSON["address"]["zip"] + "' -> '" + newZip + "'";
		}
		currentRepairJSON["address"]["zip"] = newZip;
		if ((newAdd1 == "" && newAdd2 == "" && newCity == "" && newState == "" && newZip == "")) {
			currentRepairJSON["address"] = false;
			buildingLog += " and deleted the address";
		}
	}

	if (buildingLog != "")//if anything actually changed, save it
	{
		buildingLog = "edited repair:" + buildingLog;
		logEntry["what"] = buildingLog;
		currentRepairJSON["logs"].push(logEntry);
	}
	addedWorkRefNum = refNumIn;
	window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
	startLoadingSaving("Saving edits to repair...");
	freezeForm();
}
function showRepair(data, refNum) {
	unfreezeForm();
	if (loggedInAs != "") {
		setRepaColor(config.employees[loggedInAs].color);
	}
	var repair = data[refNum];
	currentRepairJSON = repair;
	showRelatedRepairs(refNum);
	$("#nameLabel").text(repair["name"]);
	$("#nameLabel").attr("data-text", repair["name"]);
	$("#emailLabel").text(repair["email"]);
	$("#emailLabel").attr("data-text", repair["email"]);
	$("#phoneLabel").text(repair["phone"]);
	$("#phoneLabel").attr("data-text", repair["phone"]);
	$("#SNLabel").text(repair["serial"]);
	$("#SNLabel").attr("data-text", repair["serial"]);
	$("#refLabel").text(repair["refNum"]);
	$("#refLabel").attr("data-text", repair["refNum"]);
	$("#refLabelLabel").attr("data-text", repair["refNum"]);
	$("#purchLabel").text(repair["purchaseDate"]);
	var model = repair["make"] + " " + repair["model"];
	$("#modelLabel").text(model);
	var date = new Date(repair["startDate"]);
	var dateText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
	$("#startDateLabel").text(dateText);
	$("#warrLabel").text(repair["warranty"]);
	$("#employeeLabel").empty();
	$("#employeeLabel").append("<h5 style='margin-bottom: 0px;'>" + getPill(config.employees[repair["workCompleted"][0]["who"]]["name"], repair["workCompleted"][0]["who"], "employeeLabelPill", "") + "</h5>");
	//$("#datePickedUpLabel").empty();
	if (repair["datePicked"]) {
		$("#pickedUpText").text("Status: Picked Up");
		$("#datePickedUpContext").show();
		$("#datePickedUpButton").hide();
		$("#datePickedUpContext").empty();
		var datePicked = new Date(repair["datePicked"]["when"]);
		var datePickedText = String(datePicked.getMonth() + 1).padStart(2, '0') + "/" + String(datePicked.getDate()).padStart(2, '0') + "/" + datePicked.getFullYear();
		$("#datePickedUpContext").append("<h5 style='margin-bottom: 0px;'>" + getPill(datePickedText, repair["datePicked"]["who"], "pickedupLabelPill", "editDatePickedUp()") + "</h5>");
	}
	else {
		$("#pickedUpText").text("Status: In-Store");
		$("#datePickedUpButton").show();
		$("#datePickedUpContext").hide();
	}

	if (repair["address"]) {
		$("#addressRepairRow").show();
		$("#addressLabel").attr("data-text", repair["address"]["address1"].trim() + (repair["address"]["address2"] ? (" " + repair["address"]["address2"]) : "") + ", " + repair["address"]["city"] + ", " + repair["address"]["state"] + " " + repair["address"]["zip"]);
		$("#address1Label").text(repair["address"]["address1"]);
		$("#address1Label").attr("data-text", repair["address"]["address1"]);
		$("#address2Label").text(repair["address"]["address2"]);
		$("#address2Label").attr("data-text", repair["address"]["address2"]);
		$("#cityLabel").text(repair["address"]["city"]);
		$("#cityLabel").attr("data-text", repair["address"]["city"]);
		$("#stateLabel").text(repair["address"]["state"]);
		$("#stateLabel").attr("data-text", repair["address"]["state"]);
		if (repair["address"]["state"].toLowerCase() == "ohio" || repair["address"]["state"].toLowerCase() == "oh") {
			$("#stateLabel").css("color", "#BA0C2F");
		}
		else {
			$("#stateLabel").css("color", "initial");
		}
		$("#zipLabel").text(repair["address"]["zip"]);
		$("#zipLabel").attr("data-text", repair["address"]["zip"]);
	}
	else {
		$("#addressRepairRow").hide();
	}

	var lastTouchedDate = new Date();
	lastTouchedDate.setTime(Date.parse(repair["lastTouched"]));
	$("#statedProblemLabel").text(repair["problem"]);
	$("#accLabel").text(repair["acc"]);
	$("#intakeNotesLabel").text(repair["intakeNotes"]);
	$("#workTableBody").empty();
	if (repair["iPadSN"]) {
		$(".iPadSerialNumberLabels").show();
		$("#iPadSNLabel").text(repair["iPadSN"]);
		$("#iPadSNLabel").attr("data-text", repair["iPadSN"]);
	}
	else {
		$(".iPadSerialNumberLabels").hide();
	}

	if (repair["loaner"] && repair["loaner"]["has"]) {
		var theLoaner = backendData["loaners"][repair["loaner"]["assetTag"]];
		// console.log(theLoaner);
		var loanerLabelText = theLoaner["make"] + " " + theLoaner["model"] + " : " + repair["loaner"]["assetTag"];
		$("#repairLoanerLabel").text(loanerLabelText);
		$("#issueLoanerButton").hide();
		$("#checkInLoanerButton").show();
	}
	else {
		$("#repairLoanerLabel").text("");
		$("#issueLoanerButton").show();
		$("#checkInLoanerButton").hide();
	}

	var isTop = true;
	for (var i = 0; i < repair["workCompleted"].length; i++) {
		var date = new Date(repair["workCompleted"][i]["when"]);
		//console.log(date);
		var dateTimeText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
		var hours = date.getHours();
		var ampmindicator = "am";
		if (hours > 11) {
			ampmindicator = "pm";
		}
		if (hours > 12) {
			hours -= 12;
		}
		dateTimeText += " " + hours + ":" + String(date.getMinutes()).padStart(2, '0') + " " + ampmindicator;
		var html = "<tr><td scope='row'>" + dateTimeText + "</td>";
		html += "<td>" + repair["workCompleted"][i]["what"] + "</td>";

		if (repair["workCompleted"][i]["isPath"]) {
			var path = repair["workCompleted"][i]["note"];
			path = path.replaceAll("\\", "/");
			var name = path.split("/").pop();
			var link = "<a href=\"javascript:void(0)\" onclick='window.api.send(\"toMain\", \"open" + path + "\");'>" + name + "</a>";
			html += "<td style='max-width: 400px; overflow:auto;'>" + link + "</td>";
		}
		else {
			html += "<td style='max-width: 400px; overflow:auto;'>" + repair["workCompleted"][i]["note"] + "</td>";
		}

		html += "<td>" + getPill(config.employees[repair["workCompleted"][i]["who"]]["name"], repair["workCompleted"][i]["who"], "workCompletedLabelPill" + i, "") + "</td>";
		if (loggedInAs == "") {
			if (i == 0) {
				html += "<td class='workEditPencil' style='display:none;'></td>";
			}
			else {
				html += "<td style='display:none;' class='workEditPencil' onclick='editPencil(" + i + ")'><img src='pencil" + (darkMode ? "-dark" : "") + ".svg' style='width: 20px; height: 20px;'></img></td>";
			}
		}
		else {
			if (i == 0) {
				html += "<td class='workEditPencil'></td>";
			}
			else {
				html += "<td class='workEditPencil' onclick='editPencil(" + i + ")'><img src='pencil" + (darkMode ? "-dark" : "") + ".svg' style='width: 20px; height: 20px'></img></td>";
			}
		}
		html += "</tr>";
		var toAppend = $(html);
		var time = Math.random() * 2000;
		if (isTop) {
			toAppend.css("border-top-width", "0px");
			isTop = false;
		}
		$("#workTableBody").append(toAppend);
	}
}
function showLogs() {
	var allLogs = currentRepairJSON["logs"];
	if (!allLogs) {
		$("#noLogsLabel").show();
		$("#logsTable").hide();
	}
	else {
		$("#noLogsLabel").hide();
		$("#logsTable").show();
	}
	$("#logsTableBody").empty();
	for (i in allLogs) {
		var logEntry = allLogs[i];
		var building = "<tr><th scope='row'>" + logEntry["who"] + "</th>";
		var date = new Date(logEntry["when"]);
		var dateTimeText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
		var hours = date.getHours();
		var ampmindicator = "am";
		if (hours > 11) {
			ampmindicator = "pm";
		}
		if (hours > 12) {
			hours -= 12;
		}
		dateTimeText += " " + hours + ":" + String(date.getMinutes()).padStart(2, '0') + " " + ampmindicator;
		building += "<td>" + dateTimeText + "</td>";
		building += "<td>" + logEntry["what"] + "</td>";
		$("#logsTableBody").append(building);
	}
}
function logOut() {
	loggedInAs = "";
	if (darkMode) {
		setRepaColor("#ccc");
	}
	else {
		setRepaColor("black");
	}
	$("#addWorkButton").text("Log in as a Repair Technician");
	$("#addWorkButton").addClass("btn-secondary");
	$("#addWorkButton").removeClass("btn-success");
	$("#loggedInAsLabel").text("");
	// $("#issueLoanerButton").prop('disabled', true);
	// $("#checkInLoanerButton").prop('disabled', true);
}
function moveToLoanerForm() {
	$("#loanerForm").fadeIn();
	$("#repairEdit").hide();
	shownPanel = 1;
}

function clearLoaner() {
	$("#assetTagForm").val("");
}

function addLoaner() {
	$('#addLoanerModal').modal('show');
	$('#loanerErrorModal').modal('hide');
	$("#addLoanerCheck").hide();
	$("#addLoanerInputs").show();
}


var tryingToStartALoanerForm = false;
var assetNumber;


window.api.receive("fromMainLoanerSaved", (data) => {
	doneLoadingSaving();
	backendData = JSON.parse(data);
	if (tryingToStartALoanerForm) {
		unfreezeForm();
		tryingToStartALoanerForm = false;
		console.log("saved loaner");
		$('#addLoanerModal').modal('hide');
		findAndFillLoanerForm(assetNumber);
	}
	else if (tryingToFinishALoanerForm) {
		unfreezeForm();
		console.log("saved checked out, attaching...");
		if (!currentRepairJSON["loaner"]) {
			currentRepairJSON["loaner"] = {};
		}
		currentRepairJSON["loaner"]["has"] = true;
		currentRepairJSON["loaner"]["assetTag"] = assetNumber;


		var logEntry = {};
		logEntry["who"] = loanerCheckoutJSON["whoStarted"];
		logEntry["when"] = loanerCheckoutJSON["dateReleased"];
		logEntry["what"] = "Issued a loaner: " + assetNumber;
		currentRepairJSON["logs"].push(logEntry);
		addedWorkRefNum = currentRepairJSON["refNum"];
		window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
		freezeForm();
		startLoadingSaving("Attaching loaner to repair...");
		backToRepair();
	}
	else if (checkingInLoaner) {
		currentRepairJSON["loaner"]["has"] = false;
		var logEntry = {};
		logEntry["who"] = loggedInAs;
		logEntry["when"] = new Date().toJSON();
		logEntry["what"] = "Returned a loaner: " + currentRepairJSON["loaner"]["assetTag"];
		currentRepairJSON["logs"].push(logEntry);
		addedWorkRefNum = currentRepairJSON["refNum"];
		window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
		freezeForm();
		startLoadingSaving("Updating loaner status to repair...");
	}
});

function saveNewLoaner() {
	currentLoanerJSON = {};
	currentLoanerJSON["number"] = $("#assetTagForm").val();
	currentLoanerJSON["serial"] = $("#loanerAddSerialNumber").val();
	currentLoanerJSON["make"] = $("#loanerAddMake").val();
	currentLoanerJSON["model"] = $("#loanerAddModel").val();
	currentLoanerJSON["acc"] = $("#loanerAddAccessories").val();
	tryingToStartALoanerForm = true;
	freezeForm();
	startLoadingSaving("Saving Loaner Information...");
	window.api.send("toMain", "z" + JSON.stringify(currentLoanerJSON));
	assetNumber = currentLoanerJSON["number"];
	$('#addLoanerModal').modal('hide');
	// $("#addLoanerCheck").show();
	// $("#addLoanerInputs").hide();
	// setTimeout(function () { $('#addLoanerModal').modal('hide'); findAndFillLoanerForm(assetTag); }, 2000);
}

function findAndFillLoanerForm(assetTag) {
	if (backendData["loaners"] && assetTag in backendData["loaners"]) {
		var date = new Date();
		date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
		fillLoanerForm(backendData["loaners"][assetTag], date);
		moveToLoanerForm();
	}
	else {
		var errorText = "<p>Asset Tag was not found.</p>";
		errorText += "<button class=\"btn btn-primary\" type=\"button\" aria-label=\"Add it\" onclick=\"addLoaner()\">Add it</button>";
		$("#loanerAddAssetTag").val(assetTag);//we can fill this beforehand because they wont see it if they cancel
		$("#loanerErrorModelBody").html(errorText);
		$('#loanerErrorModal').modal('show');
	}
}

function validateloanerDoneButton() {
	var doneEnabled = $("#loanerAddSerialNumber").val() != "" && $("#loanerAddMake").val() != "" && $("#loanerAddModel").val() != "";
	$("#loanerAddDoneButton").prop("disabled", !doneEnabled);
}

function issueLoaner() {
	if (loggedInAs == "") {
		showLoginToast();
	}
	else {
		var value = $("#assetTagForm").val();
		var loanerModalElement = document.getElementById('loanerModal');
		var modal = bootstrap.Modal.getInstance(loanerModalElement);
		modal.hide();
		findAndFillLoanerForm(value);
	}
}
function validateLoanerCheckIn() {
	var enableButton = $("#loanerCheckInAssetTag").val() == currentRepairJSON["loaner"]["assetTag"] && $("#loanerCheckInCondition").val() != "" && $("#loanerCheckInValue").val() != ""
	$("#loanerCheckInDoneButton").prop("disabled", !enableButton);
}
function finishCheckIn() {
	var loanerTag = currentRepairJSON["loaner"]["assetTag"];
	var loanerJSON = backendData["loaners"][loanerTag];
	if (!loanerJSON["history"]) {
		loanerJSON["history"] = [];
	}
	loanerJSON["checkOut"]["conditionReceived"] = $("#loanerCheckInCondition").val();
	loanerJSON["checkOut"]["valueReceived"] = $("#loanerCheckInValue").val();
	loanerJSON["checkOut"]["dateReceived"] = new Date($("#loanerDateForm").val()).toJSON();
	loanerJSON["history"].push(loanerJSON["checkOut"]);
	delete loanerJSON["checkOut"];
	checkingInLoaner = true;
	window.api.send("toMain", "z" + JSON.stringify(loanerJSON));
	freezeForm();
	startLoadingSaving("Checking in loaner...");
	var modal = bootstrap.Modal.getOrCreateInstance('#loanerCheckInModal');
	modal.hide();
}
function checkInLoaner() {
	if (loggedInAs == "") {
		showLoginToast();
	}
	else {
		var loanerTag = currentRepairJSON["loaner"]["assetTag"];
		var loanerJSON = backendData["loaners"][loanerTag];
		$("#loanerCheckInAssetTag").val("");
		$("#loanerCheckInAssetTag").focus();
		$("#loanerCheckInCondition").val(loanerJSON["checkOut"]["conditionReleased"]);
		$("#loanerCheckInValue").val(loanerJSON["checkOut"]["valueReleased"]);
		$("#loanerCheckInTitle").text("Checking in loaner: " + loanerTag);
		var modal = bootstrap.Modal.getOrCreateInstance('#loanerCheckInModal');
		modal.show();
		$("#loanerCheckInDoneButton").prop("disabled", true);
		// currentRepairJSON["loaner"]["has"] = false;

		// var logEntry = JSON.parse("{}");
		// logEntry["who"] = loggedInAs;
		// logEntry["when"] = new Date().toJSON();
		// logEntry["what"] = "Checked loaner in";
		// currentRepairJSON["logs"].push(logEntry);

		// freezeForm();
		// startLoadingSaving("Checking in loaner...");
		// addedWorkRefNum = refNumIn;
		// window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
	}
}
function figureOutColorAndStatus() {
	var color = "default";
	var status = "Unknown";
	var hasOtherWork = false;
	var hasNote = false;
	if (currentRepairJSON["datePicked"]) {
		var date = new Date(currentRepairJSON["datePicked"]["when"]);
		var dateText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
		status = "Picked up on " + dateText;
		color = "datePickedRow";
	}
	else {
		for (var i = currentRepairJSON["workCompleted"].length - 1; i >= 0; i--) {
			var work = currentRepairJSON["workCompleted"][i];
			if (work["what"] == "Note") {
				hasNote = true;
			}
			if (work["what"] == "Sent Out") {
				hasOtherWork = true;
				color = "sentOutRow";
				status = "Sent Out";
				break;
			}
			if (work["what"] == "Diagnosed") {
				hasOtherWork = true;
				color = "diagRow";
				status = "Diagnosed";
				break;
			}
			if (work["what"] == "Submitted Claim") {
				hasOtherWork = true;
				color = "submittedClaimRow";
				status = "Submitted Claim";
				break;
			}
			if (work["what"] == "Submitted RFA") {
				hasOtherWork = true;
				color = "submittedRFARow";
				status = "Submitted RFA";
				break;
			}
			if (work["what"] == "Ordered Parts") {
				hasOtherWork = true;
				color = "orderedPartsRow";
				status = "Ordered Parts";
				break;
			}
			if (work["what"] == "Parts Arrived") {
				hasOtherWork = true;
				color = "partsArrivedRow";
				status = "Parts Arrived";
				break;
			}
			if (work["what"] == "Waiting on DEP") {
				hasOtherWork = true;
				color = "waitingOnDEPRow";
				status = "Waiting on DEP";
				break;
			}
			if (work["what"] == "Finished") {
				hasOtherWork = true;
				color = "finishedRow";
				status = "Finished";
				break;
			}
			if (work["what"] == "Created Repair Form") {
				color = "default";
				status = "Created Repair Form";
				break;
			}
		}
		console.log(hasOtherWork + ":" + hasNote);
		if (!hasOtherWork && hasNote) {
			color = "diagRow";
			status = "See Notes";
		}
	}
	currentRepairJSON["color"] = color;
	currentRepairJSON["status"] = status;
}
function reprintForm() {
	$("#savingDisplay").hide();
	$("#repairForm").show();
	$("#repairEdit").hide();
	address = currentRepairJSON["address"];
	var whoDidIt = currentRepairJSON["workCompleted"][0]["who"];
	$("#RepaPart").css("color", config["employees"][whoDidIt]["color"]);
	fillPrintingFill(whoDidIt);
	$("#RefNumLabel").text("Ref. Number: " + currentRepairJSON["refNum"]);
	$("#serialForm").val(currentRepairJSON["serial"]);
	genbar();
	$("#nameForm").val(currentRepairJSON["name"]);
	var date = new Date(currentRepairJSON["startDate"]);
	$("#dateForm").val(date.toISOString().slice(0, 16));
	$("#emailForm").val(currentRepairJSON["email"]);
	$("#accForm").val(currentRepairJSON["acc"]);
	$("#intakeTextArea").val(currentRepairJSON["intakeNotes"]);
	$("#phoneForm").val(currentRepairJSON["phone"]);
	$("#purchForm").val(currentRepairJSON["purchaseDate"]);
	if (currentRepairJSON["iPadSN"]) {
		$("#iPadSN").val(currentRepairJSON["iPadSN"]);
		$("#iPadSNDiv").show();
		$("#passwordDiv").hide();
	}
	else {
		$("#iPadSNDiv").hide();
		$("#passwordDiv").show();
	}
	dontOverrideProblem = true;
	$("#problemSelector").val("Other");
	$("#problemTextArea").val(currentRepairJSON["problem"]);
	dontOverrideWarranty = true;
	$("#warrantyOtherText").val(currentRepairJSON["warranty"]);
	selectedMakeName = currentRepairJSON["make"];
	selectedModelName = currentRepairJSON["model"];
	subType = "";
	printing = true;
	makeRepairPrintable();
	window.print();
	unMakeRepairPrintable();
	dontOverrideWarranty = false;
	dontOverrideProblem = false;
	$("#repairForm").hide();
	$("#repairEdit").show();
}
function setupEditDateWorkerSelector() {
	$("#editDateWorkerSelector").empty();
	$("#editDateWorkerSelector").append(
		"<option value=\"\" selected></option>"
	);
	for (var employee in config.employees) {
		if (config.employees[employee].active) {
			$("#editDateWorkerSelector").append(
				"<option value=\"" + employee + "\" style=\"background-color: #fff; color: " + config.employees[employee]["color"] + ";\">" + config.employees[employee]["name"] + "</option>"
			);
		}
	}
}
function setupEditRepairWorkerSelector() {
	$("#editRepairWorkerSelector").empty();
	$("#editRepairWorkerSelector").append(
		"<option value=\"\" selected></option>"
	);
	for (var employee in config.employees) {
		if (config.employees[employee].active) {
			$("#editRepairWorkerSelector").append(
				"<option value=\"" + employee + "\" style=\"background-color: #fff; color: " + config.employees[employee]["color"] + ";\">" + config.employees[employee]["name"] + "</option>"
			);
		}
	}
}
function removeFirstEditWorkEmployee() {
	if ($("#editDateWorkerSelector").find("option:first").text() == "") {
		$("#editDateWorkerSelector").find("option:first").remove();
	}
	if (repairEditFrozen) {
		$("#saveDatePickedUpButton").addClass("editWorkButtons");
	}
	else {
		$("#saveDatePickedUpButton").removeClass("editWorkButtons");
		$("#saveDatePickedUpButton").prop("disabled", false);
	}
}
function removeFirstEditRepairEmployee() {
	if ($("#editRepairWorkerSelector").find("option:first").text() == "") {
		$("#editRepairWorkerSelector").find("option:first").remove();
	}
	$("#saveEditRepairButton").prop("disabled", false);
}
function saveDatePickedUp() {
	if ($("#dateEditPickedUpForm").val() == '')//cleared out
	{
		delete currentRepairJSON["datePicked"];

		var logEntry = JSON.parse("{}");
		logEntry["who"] = $("#editDateWorkerSelector").val();
		logEntry["when"] = new Date().toJSON();
		logEntry["what"] = "Un-marked repair as picked up";
		currentRepairJSON["logs"].push(logEntry);
	}
	else {
		var date = new Date($("#dateEditPickedUpForm").val());
		currentRepairJSON["datePicked"] = {};
		currentRepairJSON["datePicked"]["when"] = date.toJSON();
		currentRepairJSON["datePicked"]["who"] = $("#editDateWorkerSelector").val();

		var logEntry = JSON.parse("{}");
		logEntry["who"] = currentRepairJSON["datePicked"]["who"];
		//logEntry["when"] = currentRepairJSON["datePicked"]["when"];
		logEntry["when"] = new Date().toJSON();
		var date = new Date(currentRepairJSON["datePicked"]["when"]);
		var dateText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
		logEntry["what"] = "Marked repair as picked up as " + dateText;
		currentRepairJSON["logs"].push(logEntry);
		if (currentRepairJSON["loaner"] && currentRepairJSON["loaner"]["has"]) {
			var loanerWarningModal = new bootstrap.Modal($('#loanerWarningModal'));
			loanerWarningModal.show();
		}
	}
	figureOutColorAndStatus();
	addedWorkRefNum = refNumIn;
	window.api.send("toMain", "s" + JSON.stringify(currentRepairJSON));
	freezeForm();
	startLoadingSaving("Saving picked up...");
	var myModalEl = document.getElementById('pickupModal');
	var modal = bootstrap.Modal.getInstance(myModalEl);
	modal.hide();
}
function fillPickedUpDate() {
	var date = new Date();
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	$("#dateEditPickedUpForm").val(date.toISOString().slice(0, 16));
	$("#saveDatePickedUpButton").prop("disabled", true);
	setupEditDateWorkerSelector();
}
function editDatePickedUp() {
	if (currentRepairJSON["datePicked"]) {
		setupEditDateWorkerSelector();
		var date = new Date(currentRepairJSON["datePicked"]["when"]);
		date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
		$("#dateEditPickedUpForm").val(date.toISOString().slice(0, 16));
		$("#editDateWorkerSelector").val(currentRepairJSON["datePicked"]["who"]);
	}
	else {
		fillPickedUpDate();
	}
	var pickedUpModal = new bootstrap.Modal($('#pickupModal'));
	pickedUpModal.show();
}
