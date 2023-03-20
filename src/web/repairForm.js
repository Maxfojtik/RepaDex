var address;


$(document).ready(function () {
	attachModal = new bootstrap.Modal($('#attachModal'));
	copyComputerModal = new bootstrap.Modal($('#copyComputerModal'));
	$('#addAddressModal').on('hidden.bs.modal', function () {//when hidden save any information in it to a variable for when saved and also when printed, throw it in the intake notes
		address = {};
		address["address1"] = $("#addressForm1").val();
		address["address2"] = $("#addressForm2").val();
		address["city"] = $("#cityForm").val();
		address["state"] = $("#stateForm").val();
		address["zip"] = $("#zipForm").val();
		// console.log(address);

		if (address["address1"] == "" && address["address2"] == "" && address["city"] == "" && address["state"] == "" && address["zip"] == "") {
			address = false;
			$("#addAddressButton").text("Add an address");
			$("#addAddressButton").addClass("btn-primary");
			$("#addAddressButton").removeClass("btn-success");
			$("#addAddressButton").removeClass("btn-danger");
		}
		else if (address["address1"] == "" || address["city"] == "" || address["state"] == "" || address["zip"] == "") {
			$("#addAddressButton").text("Edit Address!!");
			$("#addAddressButton").removeClass("btn-primary");
			$("#addAddressButton").removeClass("btn-success");
			$("#addAddressButton").addClass("btn-danger");
		}
		else {
			$("#addAddressButton").text("Edit Address");
			$("#addAddressButton").removeClass("btn-primary");
			$("#addAddressButton").addClass("btn-success");
			$("#addAddressButton").removeClass("btn-danger");
		}
		// console.log(address);
	});
	// $('#copyComputerSelector').change(function () {
	// 	var serial = $("#copyComputerSelector option:selected").val();
	// 	var otherOpen = checkSNForOtherOpen(serial);
	// 	$("#copyComputerModalYesButton").prop("disabled", otherOpen);
	// });
});
$(document).on('input', '.validable', function () {
	//console.log(event.target.value);
	validateInputElement(event.target);
});
function validateInputElement(ele) {
	if (ele.value != "") {
		$("#" + ele.id).addClass("is-valid");
		$("#" + ele.id).removeClass("is-invalid");
	}
	else {
		$("#" + ele.id).removeClass("is-valid");
		$("#" + ele.id).addClass("is-invalid");
	}
}
$(document).on('input', '.phoneValidable', function () {
	//console.log(event.target.value);
	if (phoneRequired) {
		validatePhoneElement();
	}
});
function validatePhoneElement(ele) {
	if ($("#phoneForm").val().length == 14) {
		$("#phoneForm").addClass("is-valid");
		$("#phoneForm").removeClass("is-invalid");
	}
	else {
		$("#phoneForm").removeClass("is-valid");
		$("#phoneForm").addClass("is-invalid");
	}
}
var emailValid = false;
function validateEmail() {
	var value = $("#emailForm").val();
	// console.log(value);
	if (/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(value)) {
		$("#emailForm").addClass("is-valid");
		$("#emailForm").removeClass("is-invalid");
		emailValid = true;
	}
	else {
		$("#emailForm").removeClass("is-valid");
		$("#emailForm").addClass("is-invalid");
		emailValid = false;
	}
	validateSaveButtons();
}
$(document).on("keyup", '#emailForm', function (e) {
	var value = $("#emailForm").val().toLowerCase();
	$("#emailForm").val(value);
	if (e.keyCode == 13) {
		// findPerson();
	}
	else {
		validateEmail();
	}
});
$(document).on("change", "#problemSelector", function () {
	//text = event.target.innerHTML;
	//alert();
	var value = $(this).find("option:selected").attr("showproblem");
	if (value == "true") {
		$("#problemBox").show();
	}
	else {
		$("#problemBox").hide();
	}
});
function departmentalSwitched() {
	if ($("#flexSwitchCheckCheckedDepartmental").is(":checked")) {
		phoneRequired = false;
		$("#phoneForm").removeClass("is-invalid");
		$("#phoneForm").removeClass("is-valid");
	}
	else {
		phoneRequired = true;
		validatePhoneElement();
	}
	validateSaveButtons();
}
function resetRepairForm() {
	gettingNextRefNum = false;
	emailValid = false;
	phoneValid = false;
	referenceNumber = -1;
	$("#RefNumLabel").text("Ref. Number: ???");
	saveNow = false;
	var date = new Date();
	//var dateStr = date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2, '0')+"-"+String(date.getDate()).padStart(2, '0');
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	$("#dateForm").val(date.toISOString().slice(0, 16));
	//alert(dateStr);
	//$("#dateForm").val(dateStr);
	//$("#repairFormBack").prop("disabled", true);
	setupMakes();
	setupWarranties();
	selectPill();
	clearAddressForm();
	address = false;//reset address
	$("#addAddressButton").text("Add an address");
	$("#addAddressButton").addClass("btn-primary");
	$("#addAddressButton").removeClass("btn-success");
	$("#addAddressButton").removeClass("btn-danger");
	$("#iPadSN").val("");
	$("#intakeTextArea").val("");
	$("#nameForm").val("");
	$("#serialForm").val("");
	$("#emailForm").val("");
	$("#warrantyOtherText").val("");
	$("#makeOtherBox").val("");
	$("#typeOtherBox").val("");
	$("#accForm").val("");
	$("#purchForm").val("");
	$("#phoneForm").val("");
	$("#problemTextArea").val("");
	$("#problemBox").hide();
	$("#makeOtherBox").hide();
	$("#problemSelector").hide();
	$("#typeSelectors").empty();
	$("#typeOtherBox").show();
	$("#ACAck").prop("checked", false);
	$("#FMAck").prop("checked", false);
	$("#flexSwitchCheckCheckedDepartmental").prop("checked", false);
	$("#flexSwitchCheckCheckedFlagship").prop("checked", false);
	$("#digitalFlagshipSwitch").hide();
	$("#nameForm").addClass("is-invalid");
	$("#emailForm").addClass("is-invalid");
	$("#serialForm").addClass("is-invalid");
	$("#warrantySelector").addClass("is-invalid");
	$("#typeOtherBox").addClass("is-invalid");
	$("#phoneForm").addClass("is-invalid");
	$("#workerSelector").focus();
	$(".saveButton").prop('disabled', true);
}
function warrantySelected() {
	if ($("#warrantySelector").val() == "Other") {
		$("#warrantyOtherText").show();
	}
	else {
		$("#warrantyOtherText").hide();
	}
	$("#warrantySelector").addClass("is-valid");
	$("#warrantySelector").removeClass("is-invalid");
}
function loadCopy() {
	var refNum = $("#copyComputerSelector option:selected").val();
	var repair = backendData["repairs"][refNum];
	//json["employee"] = selectedEmployee; taken care of in first work entry
	//json["dotNumber"] = $("#dotForm").val();
	//json["dateForm"] = $("#dateForm").val();
	if (!checkSNForOtherOpen(repair["serial"])) {
		$("#serialForm").val(repair["serial"]);
	}
	else {
		$("#serialForm").val("");
	}
	$("#accForm").val(repair["acc"]);
	$("#purchForm").val(repair["purchaseDate"]);
	$("#iPadSN").val(repair["iPadSN"]);
	var intakeNotes = repair["intakeNotes"];
	if (repair["intakeNotes"].endsWith("Departmental Device")) {
		intakeNotes = intakeNotes.replace("Departmental Device", "");
		$("#flexSwitchCheckCheckedDepartmental").prop("checked", true);
	}
	$("#intakeTextArea").val(intakeNotes);

	var warranty = repair["warranty"];
	var options = $('#warrantySelector option');

	var warranies = $.map(options, function (option) {
		return option.value;
	});
	if (warranies.indexOf(warranty) != -1) {
		$("#warrantySelector").val(repair["warranty"]);
		warrantySelected();
	}
	else {
		$("#warrantySelector").val("Other");
		warrantySelected();
		$("#warrantyOtherText").val(repair["warranty"]);
	}
	validateInputElement($("#warrantyOtherText")[0]);
	validateInputElement($("#serialForm")[0]);

	var options = $('#problemSelector option');

	var problems = $.map(options, function (option) {
		return option.value;
	});
	makeSelect(repair["make"]);
	// console.log("type" + repair["model"].toLowerCase());

	// we need to have a nested for loop, look for available types that have the full repair["model"] lowercased and removed of spaces ofc,
	//then if we dont find one, remove the last word from repair["model"] and search again (removing subtype hopefully). repeat while we dont have a match
	//if we dont come up with anything from there then it must have been an other and just dont copy because the use case is probably gonna happen like once in 5 years and I dont care


	var configBrand = "Other";
	for (var brand in config.repairables) {
		if (config.repairables[brand].commonName == repair["make"]) {
			configBrand = brand;
		}
	}
	var modelOptions = config.repairables[configBrand]["devices"];
	var splitModel = repair["model"].split(" ");
	var theType = null;
	var splitPlace;
	for (var i = splitModel.length; i > 0 && theType == null; i--) {//dont need to include an empty array when searching
		var splitModelSmaller = splitModel.slice(0, i);
		var testDeviceCommonName = splitModelSmaller.join(" ");
		for (var device in modelOptions) {
			var deviceInfo = modelOptions[device];
			if (deviceInfo["commonName"] == testDeviceCommonName) {
				theType = device;
				splitPlace = i;
				break;
			}
		}
	}
	if (theType != null) {
		typeSelect("type" + theType, true);
		if (hasSubType) {//gotta figure out the subtype if there is one
			subType = " " + splitModel.slice(splitPlace, splitModel.length);
		}
	}

	var problem = repair["problem"];
	if (problems.indexOf(problem) != -1) {
		$("#problemSelector").val(problem);
		removeFirstProblem();
		$("#problemTextArea").val("");
	}
	else {
		$("#problemSelector").val("Other");
		removeFirstProblem();
		$("#problemBox").show();
		$("#problemTextArea").val(problem);
	}
}
var searchingNameN;
window.api.receive("fromMainLoadSearch", (data) => {
	backendData = JSON.parse(data);
	var repairs = backendData["repairs"];
	var foundComputer = false;
	var repairsUnderThisName = [];
	for (var refNum in repairs) {
		var repair = repairs[refNum];
		var email = repair["email"];
		var nameN = email.replace("@osu.edu", "");
		if (nameN == searchingNameN) {
			foundComputer = true;
			$("#nameForm").val(repair["name"]);
			$("#emailForm").val(repair["email"]);
			$("#phoneForm").val(repair["phone"]);
			repairsUnderThisName.push(repair);
		}
	}
	if (foundComputer) {
		$("#copyComputerSelector").empty();
		// $("#copyComputerModalYesButton").prop("disabled", checkSNForOtherOpen(repairsUnderThisName[0]["serial"]));//disable the yes button if the top one is open
		for (var i in repairsUnderThisName) {
			var repair = repairsUnderThisName[i];
			var otherOpen = checkSNForOtherOpen(repair["serial"]) ? " - OPEN" : "";

			$("#copyComputerSelector").append(
				"<option value=\"" + repair["refNum"] + "\">" + repair["make"] + " " + repair["model"] + " - " + repair["serial"] + otherOpen + "</option>"
			);
		}
		copyComputerModal.show();
	}
	validateInputElement($("#nameForm")[0]);
	validateEmail();
	validateInputElement($("#phoneForm")[0]);
	doneLoadingSaving();
});
function findPerson() {
	// var osuFindPeopleURL = "https://www.osu.edu/findpeople/";
	$("#nameForm").removeClass("is-valid");
	$("#nameForm").removeClass("is-invalid");
	$("#emailForm").removeClass("is-valid");
	$("#emailForm").removeClass("is-invalid");
	$("#phoneForm").removeClass("is-valid");
	$("#phoneForm").removeClass("is-invalid");

	searchingNameN = $("#emailForm").val().toLowerCase().replace("@osu.edu", "");
	window.api.send("toMain", "loadForSearch");
	startLoadingSaving("Searching...");
	// $.get("https://www.osu.edu/search/?view=people&query=fojtik.6", function (data, status) {
	// 	console.log("Data: " + data + "\nStatus: " + status);
	// });
	// 	$.post(osuFindPeopleURL,
	// 		{
	// 			lastname: "",
	// 			firstname: "",
	// 			name_n: $("#emailForm").val().toLowerCase(),
	// 			filter: "All"
	// 		},
	// 		function (data, status) {
	// 			//console.log(data);
	// 			returnedElements = $($.parseHTML(data));
	// 			var table = returnedElements.find("#person1");
	// 			var name = "";
	// 			var email = "";
	// 			var child = table.children().eq(1).children().first();
	// 			//console.log("start");
	// 			while (child.html()) {
	// 				var type = child.children().first().text();
	// 				if (type.trim() == "Name:") {
	// 					name = child.children().eq(1).text();
	// 				}
	// 				if (type.trim() == "Published Email Address:") {
	// 					email = child.children().eq(1).text();
	// 				}
	// 				//console.log(type);
	// 				//console.log(":"+child.html());
	// 				child = child.next();
	// 			}
	// 			//validateInputElement($("#dotForm")[0]);
	// 			if (email != "") {
	// 				$("#emailForm").val(email);
	// 			}
	// 			validateInputElement($("#emailForm")[0]);
	// 			//$("#emailForm").trigger("input");
	// 			if (name != "") {
	// 				$("#nameForm").val(name);
	// 				validateInputElement($("#nameForm")[0]);
	// 			}
	// 			else {
	// 				$("#nameForm").removeClass("is-valid");
	// 				$("#nameForm").addClass("is-invalid");
	// 			}
	// 			//$("#nameForm").trigger("input");
	// 			//alert(name+"\t"+email);
	// 			//alert("Data: " + data + "\nStatus: " + status);
	// 			validateEmail();
	// 		});
}
var selectedEmployee;
function selectPill(name)//pass null if you want to reset pills
{
	selectedEmployee = name;
	var allPills = $(".workerSelect").children();
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
		validateSaveButtons();
	}
}
function fillPrintingFill(theName) {
	$("#printingPill").css("background-color", config.employees[theName].color);
	$("#printingPill").css("border-color", config.employees[theName].color);
	$("#printingPill").text(config.employees[theName]["name"]);
	if (config.employees[theName]["black-text"]) {
		$("#printingPill").addClass("text-dark");
	}
	else {
		$("#printingPill").removeClass("text-dark");
	}
}
function markSelectedPill(thePill, theName) {
	setRepaColor(config.employees[theName].color);
	//$("#RepaPart").css("color", config.employees[theName].color);
	var styling = 'background-color: ' + config.employees[theName].color + '; ' + 'border-color: ' + config.employees[theName].color + ';';
	thePill.style = styling;
	fillPrintingFill(theName);
	if (config.employees[theName]["black-text"]) {
		thePill.className = 'badge rounded-pill badge-spaced text-dark';
	}
	else {
		thePill.className = 'badge rounded-pill badge-spaced';
	}
}
function markDeselectedPill(thePill, theName) {
	thePill.className = 'badge rounded-pill badge-not-selected ' + (darkMode ? "label-light" : "text-dark") + ' badge-spaced';
	thePill.style = 'border-color: ' + config.employees[theName].color + ';';
}
var phoneRequired = true;
function validateSaveButtons() {
	var pillSelected = false;
	var allPills = $(".workerSelect").children();
	for (var i = 0; i < allPills.length; i++) {
		if (!allPills[i].className.includes("badge-not-selected")) {
			pillSelected = true;
		}
	}
	//console.log($("#emailForm").val()!="");
	var good = $("#problemSelector").is(":visible") && $("#nameForm").val() != "" && $("#warrantySelector").val() != "" && $("#serialForm").val() != "" && ($("#phoneForm").val().length == 14 || !phoneRequired) && emailValid && pillSelected && ((neediPadSN && $("#iPadSN").val() != "") || !neediPadSN);
	var makeGood = ($("#makeOtherBox").is(":visible") && $("#makeOtherBox").val() != "") || !$("#makeOtherBox").is(":visible");
	var typeGood = ($("#typeOtherBox").is(":visible") && $("#typeOtherBox").val() != "") || !$("#typeOtherBox").is(":visible");
	var warrantyGood = ($("#warrantyOtherText").is(":visible") && $("#warrantyOtherText").val() != "") || !$("#warrantyOtherText").is(":visible");
	//console.log(hasSubType);
	var subTypeGood = !hasSubType || (hasSubType && subType != "");
	var problemGood = $("#problemSelector").val() != "Click here to enter problem";
	good = good && makeGood && typeGood && warrantyGood && subTypeGood && problemGood;
	if (good) {
		getNextRefNum();
		$(".saveButton").prop('disabled', false);
	}
	else {
		$(".saveButton").prop('disabled', true);
	}
	var warning = ($("#problemSelector").val() == "" && $("#problemSelector").is(":visible")) || ($("#problemTextArea").val() == "" && $("#problemTextArea").is(":visible"));
	if (warning) {
		$(".saveButton").removeClass("btn-primary");
		$(".saveButton").addClass("btn-warning");
	}
	else {
		$(".saveButton").addClass("btn-primary");
		$(".saveButton").removeClass("btn-warning");
	}
}
var commonProblems;
var selectedMake;
var selectedMakeName;
function makeSelect(name) {
	var configBrand = "Other";
	for (var brand in config.repairables) {
		//console.log(config.repairables[brand].commonName+"\t"+selectedMake);
		if (config.repairables[brand].commonName == name) {
			configBrand = brand;
		}
	}
	$("#problemSelector").empty();
	$("#problemSelector").hide();
	$("#problemBox").hide();
	//$("#problemSelectorRow").removeClass("hideWhenPrint");
	//console.log(commonProblems);
	var allMakes = $("#makeSelector").children();
	var theMake;
	for (var i = 0; i < allMakes.length; i++) {
		var theName = allMakes[i].innerHTML;
		allMakes[i].className = 'btn btn-outline-success';
		if (theName == name) {
			theMake = allMakes[i];
		}
	}
	$("#digitalFlagshipSwitch").hide();
	if (theMake.innerHTML == 'Other') {
		$("#makeOtherBox").show();
		showProblemSelector(["Click here to enter problem"]);
		neediPadSN = false;
		$("#iPadSNDiv").hide();
		$("#passwordDiv").show();
	}
	else {
		$("#makeOtherBox").hide();
	}
	selectedMake = theMake.innerHTML;
	selectedMakeName = selectedMake;
	theMake.className = 'btn btn-success';
	updateTypes();
	validateSaveButtons();
	disposePopover();
}
var subType = "";
var subTypePopover;
var hasSubType = false;
function subTypeSelect(index) {
	var subTypeChildren = $("#subTypeButtonGroup").children();
	for (var i = 0; i < subTypeChildren.length; i++) {
		$("#" + subTypeChildren[i].id).addClass("is-valid");
		$("#" + subTypeChildren[i].id).removeClass("is-invalid");
	}
	disposePopover();
	subType = " " + indexToName[index];
	validateSaveButtons();
}
var indexToName = [];
function updateTypes() {
	$("#typeSelectors").empty();
	subType = "";
	/*$("#typeSelectors").append(
		"<span class=\"input-group-text\" id=\"basic-addon11\">Type</span>"
	);*/
	var theMake = "Other";
	for (var brand in config.repairables) {
		//console.log(config.repairables[brand].commonName+"\t"+selectedMake);
		if (config.repairables[brand].commonName == selectedMake) {
			theMake = brand;
		}
	}
	if (theMake == "Other") {
		$("#typeOtherBox").show();
		//$("#typeSelectors").append(
		//"<input id='typeOtherBox' type=\text\" class=\"form-control validable\" placeholder=\"Specify\" aria-label=\"Specify\">"
		//);
	}
	else {
		var typeCounter = 0;
		for (var device in config.repairables[theMake].devices) {
			var deviceProperties = config.repairables[theMake].devices[device];
			if (device == "Other" && deviceProperties) {
				$("#typeSelectors").append(
					"<button id=\"typeOther\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"typeSelect('typeOther')\">Other</button>"
				);
			}
			else {
				if (deviceProperties.types) {
					var content = "<div class='input-group' id='subTypeButtonGroup'>";
					for (var i = 0; i < deviceProperties.types.length; i++) {
						var subTypeName = deviceProperties.types[i];
						indexToName[typeCounter] = subTypeName;
						content += ("<button id='subtype" + subTypeName + "' type='button' class='btn btn-outline-danger' onclick='subTypeSelect(" + typeCounter + ")'>" + subTypeName + "</button>");
						typeCounter++;//have to do this hacky way of talking about types because I cant " or '
					}
					content += "</div>";
					$("#typeSelectors").append(
						"<button id=\"type" + device + "\" type=\"button\" class=\"btn btn-outline-danger\" data-bs-container=\"body\" data-bs-toggle=\"popover\" data-bs-placement=\"bottom\" data-bs-content=\"" + content + "\" onclick=\"typeSelect('type" + device + "')\">" + deviceProperties.commonName + "</button>"
					);
					$("#type" + device).on('hidden.bs.popover', function (arg) {
						//console.log(arg);
						bootstrap.Popover.getInstance(arg.target).dispose();
					});
				}
				else {
					$("#typeSelectors").append(
						"<button id=\"type" + device + "\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"typeSelect('type" + device + "')\">" + deviceProperties.commonName + "</button>"
					);
				}
			}
		}
		$("#typeOtherBox").hide();
		/*$("#typeSelectors").append(
			""
		);*/
	}
	//<button id="typeOtherMicrosoft" type="button" class="btn btn-outline-primary" onclick="typeSelect('typeOtherMicrosoft')">Other</button>
}
function showProblemSelector(commonProblems) {
	$("#problemSelector").addClass("is-invalid");
	$("#problemSelector").removeClass("is-valid");
	for (var i = 0; i < commonProblems.length; i++)//compile them all
	{
		$("#problemSelector").append(
			"<option value=\"" + commonProblems[i] + "\" class=\"clickableProblem\">" + commonProblems[i] + "</option>"
		);
	}
	$("#problemSelector").append(//add the ends
		"<option value=\"Multiple\" class=\"clickableProblem\" showproblem=\"true\">Multiple Issues, written in problem box</option>"
	);
	$("#problemSelector").append(
		"<option value=\"Other\" class=\"clickableProblem\" showproblem=\"true\">Other, written in problem box</option>"
	);
	$("#problemSelector").show();//always show
	validateSaveButtons();
}
var neediPadSN = false;
var selectedModelName;
var findMyWarningRequired;
var appleCareWarningRequired;
var popoverDisposed = true;
function disposePopover() {
	if (!popoverDisposed) {
		subTypePopover.hide();
		popoverDisposed = true;
	}
}
function typeSelect(id, ignoreSubtype) {
	subType = "";
	$("#problemBox").hide();
	//$("#problemSelectorRow").removeClass("hideWhenPrint");
	var allTypes = $("#typeSelectors").find('button');
	var theTypeElement;
	for (var i = 0; i < allTypes.length; i++) {
		var theName = allTypes[i].id;
		allTypes[i].className = 'btn btn-outline-success';
		//var exampleEl = document.getElementById('example');
		if (theName == id) {
			selectedModel = theName.replace("type", "");
			//console.log(selectedModel);
			theTypeElement = allTypes[i];
		}
	}
	disposePopover();
	//console.log(theTypeElement);
	hasSubType = false;
	if (theTypeElement.getAttribute('data-bs-toggle') == "popover")//has popover stuff
	{
		var popovertype = new bootstrap.Popover(theTypeElement, {
			html: true,
			sanitize: false,
		});
		popovertype.update();
		if (!ignoreSubtype) {
			popovertype.show();
		}
		//console.log(subTypePopover);
		subTypePopover = popovertype;
		popoverDisposed = false;
		hasSubType = true;
	}
	var theMake = "Other";
	for (var brand in config.repairables) {
		//console.log(config.repairables[brand].commonName+"\t"+selectedMake);
		if (config.repairables[brand].commonName == selectedMake) {
			theMake = brand;
		}
	}
	commonProblems = ["Click here to enter problem"];//all devices start with nothing selected
	if (theMake != "Other") {
		var theType = "Other";
		for (var type in config.repairables[theMake].devices) {
			if (config.repairables[theMake].devices[type].commonName == theTypeElement.innerHTML) {
				theType = type;
			}
		}
		//console.log(config.repairables[theMake].devices[theType]);
		findMyWarningRequired = config.repairables[theMake].devices[theType].findMy == true;
		selectedModelName = theTypeElement.innerHTML;
		$("#problemSelector").empty();
		if (config.repairables[theMake].commonProblems)//get common problems of brand
		{
			for (var i = 0; i < config.repairables[theMake].commonProblems.length; i++) {
				commonProblems.push(config.repairables[theMake].commonProblems[i]);
			}
		}
		if (theType != "Other") {
			if (config.repairables[theMake].devices[theType].iPadSerialNumber) {
				neediPadSN = true;
				$("#iPadSNDiv").show();
				$("#passwordDiv").hide();
			}
			else {
				neediPadSN = false;
				$("#iPadSNDiv").hide();
				$("#passwordDiv").show();
			}
			if (config.repairables[theMake].devices[theType].commonProblems)//get common problems of type
			{
				for (var i = 0; i < config.repairables[theMake].devices[theType].commonProblems.length; i++) {
					commonProblems.push(config.repairables[theMake].devices[theType].commonProblems[i]);
				}
			}
			//console.log(commonProblems);
			i++;
			if (config.repairables[theMake].devices[theType].digitalFlagshipSwitch) {
				$("#digitalFlagshipSwitch").show();
			}
			else {
				$("#digitalFlagshipSwitch").hide();
			}
		}
		else {
			neediPadSN = false;
			$("#iPadSNDiv").hide();
			$("#passwordDiv").show();
		}
	}
	else {
		$("#digitalFlagshipSwitch").hide();
		neediPadSN = false;
		$("#iPadSNDiv").hide();
		$("#passwordDiv").show();
	}
	showProblemSelector(commonProblems);
	if (theTypeElement.innerHTML == 'Other') {
		$("#typeOtherBox").show();
	}
	else {
		$("#typeOtherBox").hide();
	}
	theTypeElement.className = 'btn btn-success';
	validateSaveButtons();
}
function removeFirstProblem() {
	//console.log("\""+$("#problemSelector").find("option:first")+"\"");
	if ($("#problemSelector").find("option:first").text() == "Click here to enter problem") {
		$("#problemSelector").find("option:first").remove();
	}
	$("#problemSelector").addClass("is-valid");
	$("#problemSelector").removeClass("is-invalid");
}
function removeFirstWarranty() {
	//console.log("\""+$("#problemSelector").find("option:first")+"\"");
	if ($("#warrantySelector").find("option:first").text() == "") {
		$("#warrantySelector").find("option:first").remove();
	}
}
window.api.receive("fromMainSaveFail", (data) => {
	console.log(e);
	$("#mainError").show();
	$("#container").hide();
	$("#mainError").text("There is an error with the backend json file, can't load");
});
window.api.receive("fromMainSaveSuc", (data) => {
	//console.log(wasSavingDatePickedOld);
	doneLoadingSaving();
	if (addedWorkRefNum > 0) {
		backendData = JSON.parse(data);
		showRepair(backendData["repairs"], addedWorkRefNum);
		addedWorkRefNum = 0;
	}
	else if (wasSavingDatePickedOld)//hacky but should be fine???? news flash: it wasnt, but wait maybe it does and something else died
	{
		wasSavingDatePickedOld = false;
	}
	else {
		setTimeout(backToMain, 400);
	}
});
var tryingToGoBack = false;
function backToMain() {
	if (blockProgress) {
		tryingToGoBack = true;
		return;
	}
	if (printing) {
		unMakeRepairPrintable();
	}
	loadAll();
	$(".panel").hide();
	$("#mainTable").fadeIn();
	$("#startNewRepairButton").prop('disabled', true);
	$("#searchInput").select();
	addWorkToast.hide();
	shownPanel = 0;
	checkVersion();
	disposePopover();
	copyComputerModal.hide();
}
var appleCareWarningRequired;
function showRelaText() {
	var none = true;
	if (appleCareWarningRequired && appleCareRequiresFee) {
		none = false;
		$("#appleCareWarning").show();
	}
	else {
		$("#appleCareWarning").hide();
	}
	if (findMyWarningRequired && appleFindMyWarning) {
		none = false;
		$("#findWarning").show();
	}
	else {
		$("#findWarning").hide();
	}
	if (none) {
		console.log("configuartion says disable findmy or applecare warning but we need one to show, failsafing....");
		appleWarningEnabled = false;
		saveRepairForm();
	}
}
var printing = false;
function saveRepairForm() {
	appleCareWarningRequired = $("#warrantySelector").val() == "AppleCare+";
	//console.log(appleWarningEnabled+":"+appleCareWarningRequired+":"+findMyWarningRequired);
	printing = false;
	if (appleWarningEnabled && (appleCareWarningRequired || findMyWarningRequired)) {
		showRelaText();
		$("#container").hide();
		$("#repairFormWarning").show();
		shownPanel = 4;
	}
	else {
		okayWarning();
	}
}
function saveAndPrintRepairForm() {
	appleCareWarningRequired = $("#warrantySelector").val() == "AppleCare+";
	printing = true;
	if (appleWarningEnabled && (appleCareWarningRequired || findMyWarningRequired)) {
		showRelaText();
		$("#container").hide();
		$("#repairFormWarning").show();
		shownPanel = 4;
	}
	else {
		okayWarning();
	}
}
function warningAck() {
	var acgood = (($("#ACAck").is(":checked") && appleCareWarningRequired) || !appleCareWarningRequired);
	var fmgood = (($("#FMAck").is(":checked") && findMyWarningRequired) || !findMyWarningRequired);
	var good = acgood && fmgood;
	if (good) {
		okayWarning();
	}
}
function sendSave() {
	//put the stuff in the stupid thing that i am mad about, so much wasted information
	var isFlagship = $("#flexSwitchCheckCheckedFlagship").is(":checked") && $("#flexSwitchCheckCheckedFlagship").is(":visible");
	var isDepartmental = $("#flexSwitchCheckCheckedDepartmental").is(":checked") && $("#flexSwitchCheckCheckedDepartmental").is(":visible");
	var intakeText = $("#intakeTextArea").val();
	var hasText = $("#intakeTextArea").val() != "";
	intakeText += isFlagship ? (hasText ? ", " : "") + "Flagship Device" : "";
	hasText = intakeText != "";
	intakeText += isDepartmental ? (hasText ? ", " : "") + "Departmental Device" : "";
	$("#intakeTextArea").val(intakeText);

	startLoadingSaving("Saving...");
	window.api.send("toMain", "s" + jsonifyTheRepairForm());
	if (printing) {
		makeRepairPrintable();
		window.print();
	}
}
var saveNow = false;
function okayWarning() {
	$("#container").show();
	$("#repairFormWarning").hide();
	$(".saveButton").prop('disabled', true);
	shownPanel = 2;
	if (referenceNumber == -1) {
		getNextRefNum();
		saveNow = true;
	}
	else {
		sendSave();
	}
}
var referenceNumber = -1;
function jsonifyTheRepairForm() {
	var json = JSON.parse("{}");
	json["refNum"] = referenceNumber;
	//json["employee"] = selectedEmployee; taken care of in first work entry
	//json["dotNumber"] = $("#dotForm").val();
	//json["dateForm"] = $("#dateForm").val();
	json["name"] = $("#nameForm").val();
	json["serial"] = $("#serialForm").val();
	json["email"] = $("#emailForm").val();
	json["startDate"] = new Date($("#dateForm").val()).toJSON();
	json["acc"] = $("#accForm").val();
	json["intakeNotes"] = $("#intakeTextArea").val();
	// console.log($("#intakeTextArea").val());
	json["phone"] = $("#phoneForm").val();
	json["purchaseDate"] = $("#purchForm").val();
	json["color"] = "default";
	if (neediPadSN && $("#iPadSN").val() != "") {
		json["iPadSN"] = $("#iPadSN").val();
	}
	else {
		json["iPadSN"] = "";
	}
	//json["lastTouched"] = new Date().toJSON();
	var problem = $("#problemSelector").val();
	if (problem == "Other" || problem == "Multiple") {
		json["problem"] = $("#problemTextArea").val();
	}
	else {
		json["problem"] = problem;
	}
	var warranty = $("#warrantySelector").val();
	if (warranty == "Other") {
		json["warranty"] = $("#warrantyOtherText").val();
	}
	else {
		json["warranty"] = warranty;
	}
	if (selectedMakeName == "Other") {
		json["make"] = $("#makeOtherBox").val();
	}
	else {
		json["make"] = selectedMakeName;
	}
	if (selectedModelName == "Other" || selectedMakeName == "Other") {
		json["model"] = $("#typeOtherBox").val();
	}
	else {
		json["model"] = selectedModelName + subType;
	}
	json["status"] = "Created Repair Form";
	var date = new Date();
	json["logs"] = [{ "who": selectedEmployee, "what": "Created the repair", "when": date.toJSON() }];
	//date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	json["workCompleted"] = [{ "who": selectedEmployee, "when": date.toJSON(), "what": "Created Repair Form", "note": "" }];

	if (address) {
		json["address"] = address;
	}

	return JSON.stringify(json);
}
window.api.receive("fromMainRefNum", (data) => {
	doneLoadingSaving();
	$("#RefNumLabel").text("Ref. Number: " + data);
	referenceNumber = data;
	$("#repairFormBack").prop("disabled", false);
	if (saveNow) {
		sendSave();
	}
});
var gettingNextRefNum = false;
function getNextRefNum() {
	if (referenceNumber == -1 && !gettingNextRefNum) {
		if (!blockProgress) {//if we are not doing something, if what we are doing validates after it is done (which is does if it is searching) then we will get called again
			gettingNextRefNum = true;
			$("#RefNumLabel").text("Ref. Number: ???");
			startLoadingSaving("Getting next reference number...");
			window.api.send("toMain", "incRefNum");
		}
	}
}

function changeStyleOfProgram(printing) {
	if (printing) {
		$(".navbar").hide();
		$("html").attr("data-bs-theme", "light");
		$("body").get(0).style.setProperty("--h5-color", "initial");
		$(".label-light").addClass("label-light-print");
		$(".label-light-print").removeClass("label-light");
		$("#dex").css("color", "#000");
	}
	else {
		$(".navbar").show();
		if (darkMode) {
			$("html").attr("data-bs-theme", "dark");
			$("body").get(0).style.setProperty("--h5-color", "#ccc");
			$(".label-light-print").addClass("label-light");
			$(".label-light").removeClass("label-light-print");
			$("#dex").css("color", "#ccc");
		}
	}
}

function makeRepairPrintable() {
	changeStyleOfProgram(true);
	genbar();
	$("#intakeTextArea").css("width", "587px");
	$("#intakeTextArea").css("flex", "initial");
	$("#intakeTextArea").css("height", "auto");
	$("#intakeTextArea").css("height", $("#intakeTextArea").prop("scrollHeight") + "px");//resize intake, resize problem
	$("#problemTextArea").css("width", "587px");
	$("#problemTextArea").css("flex", "initial");
	$("#problemTextArea").css("height", "auto");
	$("#problemTextArea").css("height", $("#problemTextArea").prop("scrollHeight") + "px");
	$("#warrantySelector").hide();
	if ($("#warrantySelector").val() != "Other" && !dontOverrideWarranty) {
		//console.log("overriding");
		$("#warrantyOtherText").val($("#warrantySelector").val());
	}
	var needToOverrideProblem = $("#problemSelector").find("option:selected").attr("showproblem") != "true";
	if (needToOverrideProblem && !dontOverrideProblem) {
		$("#problemTextArea").val($("#problemSelector").val());
	}
	$(".is-invalid").each(function () {
		$(this).addClass("is-invalid-printed");
		$(this).removeClass("is-invalid");
	});
	$(".is-valid").each(function () {
		$(this).addClass("is-valid-printed");
		$(this).removeClass("is-valid");
	});
	$("#phoneForm").prop("placeholder", "");
	$("#allTheMakes").hide();
	if (selectedMakeName == "Other") {
		$("#printMake").val($("#makeOtherBox").val());
	}
	else {
		$("#printMake").val(selectedMakeName);
	}
	$("#allTheModels").hide();
	if (selectedModelName == "Other" || selectedMakeName == "Other") {
		$("#printModel").val($("#typeOtherBox").val());
	}
	else {
		$("#printModel").val(selectedModelName + subType);
	}
	$(".hideWhenPrint").each(function () {
		$(this).hide();
	});
	$(".showWhenPrint").each(function () {
		$(this).show();
	});
	$("#passwordForm").prop('disabled', false);
	$("#passwordForm").val("");
	$("#mainTitle").css("font-size", "75px");
	$("#techLogo").css("height", "80px");
	$("#dateFormPrint").val(new Date($("#dateForm").val()).toDateString());
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
	$("#dateTimeLabel").text(dateTimeText);
	$("#nameLabelBottom").text($("#nameForm").val());
	$("#versionLabel").css("margin-top", "77px");
	$("#versionLabel").css("font-size", "1rem");
	$("#versionLabel").css("margin-left", "315px");

	var intakeText = $("#intakeTextArea").val();
	var hasText = $("#intakeTextArea").val().trim() != "";
	//throw the address information into intake text as well
	if (address) {
		intakeText += (hasText ? ", " : "") + address["address1"] + " " + address["address2"] + ", " + address["city"] + ", " + address["state"] + " " + address["zip"];
	}
	$("#intakeTextArea").val(intakeText);
	//$("#loggedInAsLabel").text("v"+version);
}
function unMakeRepairPrintable() {
	changeStyleOfProgram(false);
	$("#intakeTextArea").css("width", "initial");
	$("#intakeTextArea").css("flex", "");
	$("#problemTextArea").css("width", "initial");
	$("#problemTextArea").css("flex", "1 1 auto");
	$("#warrantySelector").show();
	$(".is-invalid").each(function () {
		$(this).addClass("is-invalid-printed");
		$(this).removeClass("is-invalid");
	});
	$(".is-valid").each(function () {
		$(this).addClass("is-valid-printed");
		$(this).removeClass("is-valid");
	});
	$("#phoneForm").prop("placeholder", "(614) 292-8883");
	$("#allTheMakes").show();
	$("#allTheModels").show();
	$("#intakeTextArea").val("");
	$(".hideWhenPrint").each(function () {
		$(this).show();
	});
	$(".showWhenPrint").each(function () {
		$(this).hide();
	});
	$("#passwordForm").prop('disabled', true);
	$("#passwordForm").val("Written in after printing");
	$("#mainTitle").css("font-size", "");
	$("#techLogo").css("height", "");
	$("#versionLabel").css("margin-top", "94px");
	$("#versionLabel").css("font-size", "1.25rem");
	$("#versionLabel").css("margin-left", "425px");
	//$("#loggedInAsLabel").text("");
}
function genbar() {
	JsBarcode("#repairBarcode", $("#serialForm").val(), {
		width: 1,
		height: 20,
		displayValue: false,
		fontSize: 10
	});
	$("#repairBarcode").css("float", "right");
}
var oldRepairOpenModal;
var oldRepairRefNum;
var wasSavingDatePickedOld;
function cancelRepairForm() {
	blockProgress = false;
	oldRepairOpenModal.hide();
	backToMain();
}
function clearSerialOldRepair() {
	$("#serialForm").val("");
	blockProgress = false;
	oldRepairOpenModal.hide();
	validateInputElement(document.getElementById("serialForm"));
}
function closeOldRepair() {
	blockProgress = false;
	oldRepairOpenModal.hide();
	currentRepairJSON = backendData["repairs"][oldRepairRefNum];
	wasSavingDatePickedOld = true;
	editDatePickedUp();
}
function checkSerialClosed() {
	var serial = $("#serialForm").val();
	console.log("checking: " + serial);
	var otherOpen = checkSNForOtherOpen(serial);
	if (otherOpen) {
		unfreezeForm();//for some reason if it is
		oldRepairRefNum = otherOpen;
		oldRepairOpenModal = new bootstrap.Modal($('#oldRepairOpenModal'));
		oldRepairOpenModal.show();
		blockProgress = true;
	}
}
function checkSNForOtherOpen(serial) {
	for (var refNum in backendData["repairs"]) {
		//console.log(backendData["repairs"][refNum]);
		var checkRepair = backendData["repairs"][refNum];
		var checkSN = checkRepair["serial"];
		if (checkSN == serial && !checkRepair["datePicked"]) {
			return refNum;
		}
	}
	return false;
}


// $('#addAddressModal').on('show.bs.modal', function () {

// });
function clearAddressForm() {
	$("#addressForm1").val("");
	$("#addressForm2").val("");
	$("#cityForm").val("");
	$("#stateForm").val("");
	$("#zipForm").val("");
}








//code from https://stackoverflow.com/questions/30058927/format-a-phone-number-as-a-user-types-using-pure-javascript, modified by me
const isNumericInput = (event) => {
	const key = event.keyCode;
	return ((key >= 48 && key <= 57) || // Allow number line
		(key >= 96 && key <= 105) // Allow number pad
	);
};

const isModifierKey = (event) => {
	const key = event.keyCode;
	return (event.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
		(key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
		(key > 36 && key < 41) || // Allow left, up, right, down
		(
			// Allow Ctrl/Command + A,C,V,X,Z
			(event.ctrlKey === true || event.metaKey === true) &&
			(key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
		)
};

const enforceFormat = (event) => {
	// Input must be of a valid number format or a modifier key, and not longer than ten digits
	if (!isNumericInput(event) && !isModifierKey(event)) {
		event.preventDefault();
	}
};

const formatToPhone = (event) => {
	if (isModifierKey(event)) { return; }

	const input = event.target.value.replace(/\D/g, ''); // First ten digits of input only
	const areaCode = input.substring(0, 3);
	const middle = input.substring(3, 6);
	const last = input.substring(6);

	if (input.length > 6) { event.target.value = '(' + areaCode + ') ' + middle + '-' + last; }
	else if (input.length > 3) { event.target.value = '(' + areaCode + ') ' + middle; }
	else if (input.length > 0) { event.target.value = '(' + areaCode; }
	validatePhoneElement();
};
const upperSerial = (event) => {
	event.target.value = event.target.value.toUpperCase();
};
