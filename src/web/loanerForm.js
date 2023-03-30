var tryingToFinishALoanerForm = false;
function resetLoanerForm() {
	selectedLoanerEmployee = "";
	selectLoanerPill("");
	$("#loanerCheckBox1").prop("checked", false);
	$("#loanerCheckBox2").prop("checked", false);
	$("#loanerCheckBox3").prop("checked", false);
	$("#loanerDeviceValue").val("");
	$("#loanerConditionTextArea").val("");
}
var loanerCheckoutJSON = {};
function saveLoaner() {
	var assetTag = $("#loanerTagForm").val();
	var loanerJSON = backendData["loaners"][assetTag];
	loanerCheckoutJSON["whoStarted"] = selectedLoanerEmployee;
	loanerCheckoutJSON["refNum"] = $("#loanerRefNum").val();
	loanerCheckoutJSON["valueReleased"] = $("#loanerDeviceValue").val();
	loanerCheckoutJSON["conditionReleased"] = $("#loanerConditionTextArea").val();
	loanerCheckoutJSON["dateReleased"] = new Date($("#loanerDateForm").val()).toJSON();
	loanerJSON["checkOut"] = loanerCheckoutJSON;
	assetNumber = assetTag;
	tryingToFinishALoanerForm = true;
	window.api.send("toMain", "z" + JSON.stringify(loanerJSON));
	freezeForm();
	startLoadingSaving("Checking out loaner...");
	// console.log(loanerJSON);
}
function fillLoanerForm(assetJSON, date) {
	resetLoanerForm();
	if (date) {
		$("#loanerDateForm").val(date.toISOString().slice(0, 16));
	}
	$("#loanerTagForm").val(assetJSON["number"]);
	$("#loanerMakeModel").val(assetJSON["make"] + " " + assetJSON["model"]);
	$("#loanerSerialForm").val(assetJSON["serial"]);
	$("#loanerAccForm").val(assetJSON["acc"]);
	$("#loanerRefNum").val(currentRepairJSON["refNum"]);
	$("#loanerNameForm").val(currentRepairJSON["name"]);
	$("#loanerEmailForm").val(currentRepairJSON["email"]);
	$("#loanerPhoneForm").val(currentRepairJSON["phone"]);
	genLoanerBar();
	$("#LoanerRefNumLabel").text("Ref. Number: " + currentRepairJSON["refNum"]);
	$("#saveAndPrintLoanerForm").prop("disabled", true);
	$("#saveLoanerForm").prop("disabled", true);


	//look at most recent history and autofill condition and value

	if (assetJSON["history"]) {
		var last = assetJSON["history"].length - 1;
		var mostRecent = assetJSON["history"][last];
		$("#loanerDeviceValue").val(mostRecent["valueReceived"]);
		$("#loanerConditionTextArea").val(mostRecent["conditionReceived"]);
	}
	validateLoanerSaveButtons();


}
function fillLoanerPrintingFill(theName) {
	if (theName != "") {
		$("#printingPillLoaner").css("background-color", config.employees[theName].color);
		$("#printingPillLoaner").css("border-color", config.employees[theName].color);
		$("#printingPillLoaner").text(config.employees[theName]["name"]);
		if (config.employees[theName]["black-text"]) {
			$("#printingPillLoaner").addClass("text-dark");
		}
		else {
			$("#printingPillLoaner").removeClass("text-dark");
		}
	}
}
function genLoanerBar() {
	JsBarcode("#loanerBarcode", currentRepairJSON["serial"], {
		width: 1,
		height: 20,
		displayValue: false,
		fontSize: 10
	});
	$("#loanerBarcode").css("float", "right");
}
function saveAndPrintLoanerForm() {
	makeLoanerFormPrintable();
	window.print();
	unMakeLoanerPrintable();
	saveLoaner();
}
function saveLoanerForm() {
	saveLoaner();
}
function unMakeLoanerPrintable() {
	changeStyleOfProgram(false);
	$("#loanerConditionTextArea").css("width", "initial");
	$("#loanerConditionTextArea").css("flex", "");
	$(".loanerCheckboxes").css("font-size", "30px");
	$(".hideWhenPrint").each(function () {
		$(this).show();
	});
	$(".showWhenPrint").each(function () {
		$(this).hide();
	});
	$(".enableWhenPrint").each(function () {
		$(this).prop("disabled", true);
	});
	$("#mainTitle").css("font-size", "");
	$("#techLogo").css("height", "");
	$("#versionLabel").css("margin-top", "94px");
	$("#versionLabel").css("font-size", "1.25rem");
	$("#versionLabel").css("margin-left", "425px");
}
function makeLoanerFormPrintable() {
	changeStyleOfProgram(true);
	$("#mainTitle").css("font-size", "75px");
	$("#techLogo").css("height", "80px");
	$("#loanerDateFormPrint").val(new Date($("#loanerDateForm").val()).toDateString());
	const d = new Date();
	var dateTimeText = String(d.getMonth() + 1).padStart(2, '0') + "/" + String(d.getDate()).padStart(2, '0') + "/" + d.getFullYear();
	var hours = d.getHours();
	var ampmindicator = "am";
	if (hours > 11) {
		ampmindicator = "pm";
	}
	if (hours > 12) {
		hours -= 12;
	}
	dateTimeText += " " + hours + ":" + String(d.getMinutes()).padStart(2, '0') + " " + ampmindicator;
	$("#loanerDateTimeLabel").text(dateTimeText);
	$("#loanerDateTimeLabel2").text(dateTimeText);
	$("#versionLabel").css("margin-top", "77px");
	$("#versionLabel").css("font-size", "1rem");
	$("#versionLabel").css("margin-left", "315px");
	$(".loanerCheckboxes").css("font-size", "20px");
	$(".hideWhenPrint").each(function () {
		$(this).hide();
	});
	$(".showWhenPrint").each(function () {
		$(this).show();
	});
	$(".enableWhenPrint").each(function () {
		$(this).prop("disabled", false);
	});
}
function backToRepair() {
	tryingToFinishALoanerForm = false;
	$("#loanerForm").hide();
	$("#repairEdit").fadeIn();
	shownPanel = 3;
}
function loanerValueInput(id) {
	var value = $("#" + id).val();
	if (value.length > 0 && value.charAt(0) != "$") {
		$("#" + id).val("$" + value);
	}
	validateLoanerSaveButtons();
}
function validateLoanerSaveButtons() {
	var enableLoaner = $("#loanerDeviceValue").val() != "" && selectedLoanerEmployee != "" && $("#loanerConditionTextArea").val() != "" &&
		$("#loanerCheckBox1").is(":checked") && $("#loanerCheckBox2").is(":checked") && $("#loanerCheckBox3").is(":checked");

	var loanerJSON = backendData["loaners"][$("#loanerTagForm").val()];
	if (loanerJSON["checkOut"]) {
		enableLoaner = false;
		$("#saveAndPrintLoanerForm").removeClass("btn-primary");
		$("#saveLoanerForm").removeClass("btn-primary");
		$("#saveAndPrintLoanerForm").addClass("btn-danger");
		$("#saveLoanerForm").addClass("btn-danger");
	}
	else {
		$("#saveAndPrintLoanerForm").addClass("btn-primary");
		$("#saveLoanerForm").addClass("btn-primary");
		$("#saveAndPrintLoanerForm").removeClass("btn-danger");
		$("#saveLoanerForm").removeClass("btn-danger");
	}
	$(".loanerButtonEnableable").prop("disabled", !enableLoaner);
}
var selectedLoanerEmployee = "";
function selectLoanerPill(name)//pass null if you want to reset pills
{
	selectedLoanerEmployee = name;
	fillLoanerPrintingFill(name);
	var allPills = $("#loanerWorkerSelector").children();
	var thePill;
	for (var i = 0; i < allPills.length; i++) {
		var theName = allPills[i].getAttribute("employee");
		markDeselectedPill(allPills[i], theName);
		if (theName == name) {
			thePill = allPills[i];
		}
	}
	if (thePill) {
		markSelectedPill(thePill, name);
		validateLoanerSaveButtons();
	}
}
