$(document).ready(function () {
	// loadAll();
	lookingToLoad = true;
	checkIfFrontIsLoading();
});
$(document).on("keyup", '#searchInput', function (e) {
	if (e.keyCode == 13 && !freezeFront) {
		search(true);
	}
});
function checkIfFrontIsLoading() {
	if (lookingToLoad && connectionState > 0) {
		lookingToLoad = false;
		loadAll();
	}
}
var lookingToLoad = false;
var refClicked = 0;
var backendData;
var freezeFront = false;
function clickRow(number) {
	if (filterPopover) {
		filterPopover.toggle();
	}
	//console.log("row: "+number);
	if (refClicked == number && !freezeFront) {
		refClicked = 0;
		showRepair(backendData["repairs"], number);//show the repair and start a new request for data (for updated info)
		startUpdate(number);
		$("#mainTable").hide();
		$("#repairContextButtons").hide();
		$("#settingsEdit").hide();
		$("#repairEdit").fadeIn();
		shownPanel = 1;
	}
	else {
		refClicked = number;
	}
}
function getTopRepair(repairs) {
	var topNumber = 0;
	for (var refNum in repairs) {
		//console.log(refNum+":"+topNumber);
		if (parseInt(refNum) > topNumber) {
			topNumber = refNum;
		}
	}
	return topNumber;
}
function getBottomRepair(repairs) {
	var bottomNumber = 0;
	for (var refNum in repairs) {
		//console.log(refNum+":"+topNumber);
		if (parseInt(refNum) < bottomNumber) {
			bottomNumber = refNum;
		}
	}
	return bottomNumber;
}
window.api.receive("fromMainLoadAll", (data) => {
	doneLoadingSaving();
	try {
		backendData = JSON.parse(data);
		/*for(var refNum in backendData["repairs"])
		{
			backendData["repairs"][refNum]["descriptors"] = makeDescriptors(backendData["repairs"][refNum]);
			window.api.send("toMain", "s"+JSON.stringify(backendData["repairs"][refNum]));
		}*/
		if (backendData["repairs"]) {
			if ($("#searchInput").val().toLowerCase().length > 0) {
				search(false);
			}
			else {
				showRepairs(backendData["repairs"], 100);
			}
		}
	}
	catch (e) {
		console.log(e);
		$("#mainError").show();
		$("#container").hide();
		$("#mainError").text("There is an error with the backend json file, can't load (" + e + ")");
	}
	freezeFront = false;
	$("#startNewRepairButton").prop('disabled', false);
	$("#searchButton").prop('disabled', false);
	$("#refreshButton").prop('disabled', false);
	$("#filterButton").prop('disabled', false);
	$(".front-row").css("cursor", "pointer");
	//console.log('Received ${'+data+'} from main process');
});
function loadAll() {
	freezeFront = true;
	topRepair = undefined;
	$("#dtBody").empty();
	$(".front-row").css("cursor", "default");
	$("#searchButton").prop('disabled', true);
	$("#refreshButton").prop('disabled', true);
	$("#filterButton").prop('disabled', true);
	$("#startNewRepairButton").prop('disabled', true);
	$("#saveSpinner").css("visibility", "hidden");
	$("#searchInput").val("");
	$("#tooManyResultsWarning").hide();
	$("#similarResultsWarning").hide();
	startLoadingSaving("Loading repairs...");
	window.api.send("toMain", "loadAll");
}
function createNewRepair() {
	$("#mainTable").hide();
	$("#repairForm").fadeIn();
	filterPopover.hide();
	logOut();
	resetRepairForm();
	resetVersionStyling();
	shownPanel = 2;
}
var repairsToReDraw;
var lengthOfReDraw;
var simple = true;
function reDraw() {
	if (simple) {
		showRepairs(repairsToReDraw, lengthOfReDraw);
	}
	else {
		showSimilarRepairs(repairsToReDraw, lengthOfReDraw);
	}
}
function getEndDate(repairIn) {
	if (repairIn.status.includes("Picked up on")) {
		return new Date(Date.parse(repairIn.status.replace("Picked up on ", "")));
	}
	return null;
}
function sameDay(d1, d2) {
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate();
}
function showRepairs(repairsIn, length) {
	var amount = 0;
	var enableStartDateFilter = changedStatuses["Date Start"];
	var enableEndDateFilter = changedStatuses["Date End"];
	// console.log(start+":"+Object.keys(repairsIn).length+":"+length);
	simple = true;
	repairsToReDraw = repairsIn;
	lengthOfReDraw = length;
	$("#dtBody").empty();
	if (repairsIn.length == 0) {
		topRepair = undefined;
	}
	else {
		var counter = 0;
		var bottomRepair = getBottomRepair(repairsIn);
		topRepair = undefined;
		for (var i = getTopRepair(repairsIn); i >= bottomRepair; i--) {
			var refNum = i;
			if (counter > length) {
				continue;
			}
			var repair = repairsIn[refNum];
			if (!repair)//if the repair does not exist skip
			{
				continue;
			}
			//console.log(refNum);
			var thisStatus = repair.status;
			if (thisStatus.includes("Picked up")) {
				thisStatus = "Picked Up";
			}
			if (changedStatuses[thisStatus]) {//if we have deselected
				continue;
			}
			// console.log(startedDateFilter + "\t" + new Date(repair.startDate) + "\t" + startedDateFilter);
			if (enableStartDateFilter) {
				if (!sameDay(new Date(repair.startDate), startedDateFilter)) {
					continue;
				}
			}
			if (enableEndDateFilter) {
				var endDate = getEndDate(repair);
				// console.log(endDate);
				if (endDate == null || !sameDay(endDate, endedDateFilter)) {
					continue;
				}
			}
			//console.log(counter+":"+length);
			counter++;
			/*if(repairsIn[refNum]["archived"] && !showArchived)
			{
				console.log("archived; skipping");
				continue;
			}*/
			//repair["descriptors"] = makeDescriptors(repair);
			//console.log(repair["descriptors"]);
			var row = "<tr class=\"" + repair.color + " front-row " + (darkMode ? "border-dark text-dark" : "") + "\" onclick=\"clickRow(" + repair.refNum + ")\"><th scope=\"row\">" + repair.name + "</th>";
			row += "<td>" + repair.refNum + "</td>";
			row += "<td>" + repair.make + " " + repair.model + "</td>";
			row += "<td>" + repair.serial + "</td>";
			var date = new Date(repair.startDate);
			var dateText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
			row += "<td>" + dateText + "</td>";
			row += "<td>" + repair.status + "</td></tr>";
			$("#dtBody").append(row);
			amount++;
			if (topRepair == undefined) {
				topRepair = repair;
			}
		}
	}
	return amount;
}
function generateSerialHTML(og, subsitutions) {
	var toReturn = "";
	//console.log(subsitutions);
	for (var i = 0; i < og.length; i++) {
		//console.log(subsitutions[i]);
		if (subsitutions[i] != null) {
			toReturn += "<span style='color: #ff0000'>" + subsitutions[i] + "</span>";
		}
		else {
			toReturn += og[i];
		}
	}
	return toReturn;
}
function showSimilarRepairs(caughtRepairsAndSubstitutions, start, length) {
	var amount = 0;
	simple = false;
	repairsToReDraw = caughtRepairsAndSubstitutions;
	startOfReDraw = start;
	lengthOfReDraw = length;
	$("#dtBody").empty();
	topRepair = undefined;//remove a top repair because we dont want enter to work
	var counter = 0;
	var bottomRepair = getBottomRepair(caughtRepairsAndSubstitutions["caughtRepairs"]);
	for (var i = getTopRepair(caughtRepairsAndSubstitutions["caughtRepairs"]); i >= bottomRepair; i--) {
		if (counter > length) {
			continue;
		}
		var repair = caughtRepairsAndSubstitutions["caughtRepairs"][i];
		if (!repair) {
			continue;
		}
		var thisStatus = repair.status;
		if (thisStatus.includes("Picked up")) {
			thisStatus = "Picked Up";
		}
		if (changedStatuses[thisStatus]) {
			continue;
		}
		counter++;
		var row = "<tr class=\"" + repair.color + " front-row\" onclick=\"clickRow(" + repair.refNum + ")\"><th scope=\"row\">" + repair.name + "</th>";
		row += "<td>" + repair.refNum + "</td>";
		row += "<td>" + repair.make + " " + repair.model + "</td>";
		row += "<td>" + generateSerialHTML(repair.serial, caughtRepairsAndSubstitutions["substitutions"][i]) + "</td>";
		var date = new Date(repair.startDate);
		var dateText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
		row += "<td>" + dateText + "</td>";
		row += "<td>" + repair.status + "</td>";
		$("#dtBody").prepend(row);
		amount++;
	}
	// console.log(amount);
	return amount;
}
var lastSearchFor = "";
var topRepair = undefined;
function catchRepairs(toSearchFor, variance) {
	var caughtRepairs = [];
	for (var refNum in backendData["repairs"]) {
		if (backendData["repairs"][refNum]["archived"]) {
			continue;
		}
		var descriptors = backendData["repairs"][refNum]["descriptors"];
		//console.log(descriptors);
		for (var i in descriptors) {
			if (includes(descriptors[i], toSearchFor, variance)) {
				caughtRepairs.push(backendData["repairs"][refNum]);
				//console.log(backendData["repairs"][refNum]+"  "+descriptors[i]);
				break;
			}
		}
	}
	return caughtRepairs;
}
function catchSerialNumbersIncludingDifferences(toSearchFor, variance, maxHits) {
	toSearchFor = toSearchFor.toUpperCase();
	var caughtRepairs = [];
	var substitutions = [];
	var hits = 0;
	for (var refNum in backendData["repairs"]) {
		if (backendData["repairs"][refNum]["archived"]) {
			continue;
		}
		var serial = backendData["repairs"][refNum]["serial"].toUpperCase();
		//console.log(serial);
		var wordSubstitutions = includesCalculatingDifferences(serial, toSearchFor, variance);
		//console.log(serial+"\t"+wordSubstitutions);
		if (wordSubstitutions != undefined) {
			caughtRepairs.push(backendData["repairs"][refNum]);
			substitutions.push(wordSubstitutions);
			hits++;
			if (hits >= maxHits) {
				break;
			}
			//console.log(backendData["repairs"][refNum]+"  "+descriptors[i]);
		}

	}
	return { "caughtRepairs": caughtRepairs, "substitutions": substitutions };
}
function includes(whole, part, variance) {
	const wArray = Array.from(whole);
	const pArray = Array.from(part);
	for (var i = 0; i < wArray.length; i++) {
		var errors = 0;
		var errored = false;
		for (var k = 0; k < pArray.length; k++) {
			if ((i + k) >= wArray.legnth) {
				errored = true;
				break;
			}
			if (wArray[i + k] != pArray[k]) {
				errors++;
			}
			if (errors > variance) {
				errored = true;
				break;
			}
		}
		if (!errored) {
			return true;
		}
	}
	return false;
}
function includesCalculatingDifferences(whole, part, variance) {
	const wArray = Array.from(whole);
	const pArray = Array.from(part);
	for (var i = 0; i < wArray.length; i++) {
		var errors = 0;
		var errored = false;
		var substitutions = [];
		substitutions.length = wArray.length;
		for (var k = 0; k < pArray.length; k++) {
			if ((i + k) >= wArray.legnth) {
				errored = true;
				break;
			}
			if (wArray[i + k] != pArray[k]) {
				substitutions[i + k] = wArray[i + k];
				errors++;
			}
			if (errors > variance) {
				errored = true;
				break;
			}
		}
		if (!errored) {
			return substitutions;
		}
	}
	return undefined;
}
function putRepairIfNotThere(caughtRepairsAndSubstitutions, newCaughtRepairsAndSubstitutions) {
	for (var i = 0; i < newCaughtRepairsAndSubstitutions["caughtRepairs"].length; i++) {
		var inArray = false;
		for (var k = 0; k < caughtRepairsAndSubstitutions["caughtRepairs"].length; k++) {
			if (caughtRepairsAndSubstitutions["caughtRepairs"][k]["serial"] == newCaughtRepairsAndSubstitutions["caughtRepairs"][i]["serial"]) {
				inArray = true;
			}
		}
		if (!inArray) {
			caughtRepairsAndSubstitutions["caughtRepairs"].push(newCaughtRepairsAndSubstitutions["caughtRepairs"][i]);
			caughtRepairsAndSubstitutions["substitutions"].push(newCaughtRepairsAndSubstitutions["substitutions"][i]);
		}
	}
}
function search(wasEnter) {
	$("#saveSpinner").css("visibility", "visible");
	var caughtRepairs = [];
	var toSearchFor = $("#searchInput").val().toLowerCase();
	if (lastSearchFor == toSearchFor && lastSearchFor != "" && topRepair != undefined && wasEnter)//second search
	{
		lastSearchFor = "";
		refClicked = topRepair.refNum;
		clickRow(refClicked);
	}
	//console.log("Searching For '"+toSearchFor+"'");
	if (toSearchFor == "") {
		showRepairs(backendData["repairs"], 100);
		$("#tooManyResultsWarning").fadeOut();
		$("#similarResultsWarning").fadeOut();
	}
	else {
		caughtRepairs = catchRepairs(toSearchFor, 0);//first try with 0 variance
		var tooMany = false;
		if (caughtRepairs.length == 0)//could not find the repair, search again but add some variance
		{
			var variance = 0;
			var caughtRepairsAndSubstitutions = { "caughtRepairs": [], "substitutions": [] };
			while (caughtRepairsAndSubstitutions["caughtRepairs"].length < 100 && variance <= 3)//while we have less than 10 results, keep searching and adding more variance until we reach 3, then we are SOL
			{
				putRepairIfNotThere(caughtRepairsAndSubstitutions, catchSerialNumbersIncludingDifferences(toSearchFor, variance, 100));
				//console.log(caughtRepairsAndSubstitutions["caughtRepairs"].length);
				variance++;
			}
			var maxRepairs = Object.keys(caughtRepairsAndSubstitutions["caughtRepairs"]).length;
			if (maxRepairs > config["maxRowsAtOnce"]) {
				//tooMany = true;
				maxRepairs = config["maxRowsAtOnce"];
			}
			var shownRepairs = showSimilarRepairs(caughtRepairsAndSubstitutions, 0, maxRepairs);
			if (shownRepairs == 0 && wasEnter) {
				$("#searchInput").select();
			}
			$("#similarResultsWarning").fadeIn();
		}
		else {
			var maxRepairs = Object.keys(caughtRepairs).length;
			if (maxRepairs > config["maxRowsAtOnce"]) {
				tooMany = true;
				maxRepairs = config["maxRowsAtOnce"];
			}
			var shownRepairs = showRepairs(caughtRepairs, maxRepairs);//use the normal function when showing with no variance
			if (shownRepairs == 0 && wasEnter) {
				$("#searchInput").select();
			}
			$("#similarResultsWarning").fadeOut();
		}
		if (tooMany) {
			$("#tooManyResultsWarning").fadeIn();
		}
		else {
			$("#tooManyResultsWarning").fadeOut();
		}
	}
	lastSearchFor = toSearchFor;
	//console.log(caughtRepairs);
	$("#saveSpinner").css("visibility", "hidden");
}
var possibleStatuses = ["Default Selection", "Created Repair Form", "Diagnosed", "Submitted Claim", "Submitted RFA", "Sent Out", "Ordered Parts", "Parts Arrived", "Waiting on DEP", "Finished", "See Notes", "Picked Up", "Date Start", "Date End"];
var idToStatus = {};
var changedStatuses = {};
var filterPopover;
var startedDateFilter = null;
var endedDateFilter = null;


function saveFilterDates() {
	startedDateFilter = new Date($("#filterStartDate").val());
	startedDateFilter.setDate(startedDateFilter.getDate() + 1);
	endedDateFilter = new Date($("#filterEndDate").val());
	endedDateFilter.setDate(endedDateFilter.getDate() + 1);
}
function filterHideListener() {
	console.log("dispose");
	filterPopover.dispose();
	filterPopover = null;
}
function initFilterPopover() {
	var buttonEl = document.getElementById('filterButton');
	var popover = bootstrap.Popover.getInstance(buttonEl);
	console.log(popover);
	if (popover) {
		console.log("hide");
		popover.toggle();
	}
	else {
		console.log("show");
		var body = "<div id='filterOptions'>";
		for (var i in possibleStatuses) {
			if (possibleStatuses[i].includes("Date")) {
				continue;
			}
			var checked = true;
			var checkID = possibleStatuses[i].replace(/\s/g, "").toLowerCase() + "filteroption";
			idToStatus[checkID] = possibleStatuses[i];
			if (possibleStatuses[i] == "Default Selection" && Object.keys(changedStatuses).length > 0) {//if we are creating default and something is changed
				checked = false;
			}
			if (changedStatuses[idToStatus[checkID]]) {//if we are creating not date and that thing is changed
				checked = false;
			}
			var rawHTML = "<div class='form-check'><input class='form-check-input normalFilter' type='checkbox' value='' id='" + checkID + "' onchange='selectFilter($(\"#" + checkID + "\"))' " + (checked ? "checked" : "") + "><label class='form-check-label' for='flexCheckDefault'>" + possibleStatuses[i] + "</label></div>";
			//console.log(rawHTML);
			body += rawHTML;
		}
		idToStatus["datestartfilteroption"] = "Date Start";
		idToStatus["dateendfilteroption"] = "Date End";
		body += "<div class='form-check'><input class='form-check-input dateFilter' type='checkbox' value='' id='datestartfilteroption' onchange='selectFilter($(\"#datestartfilteroption\"))'" + (changedStatuses[idToStatus['datestartfilteroption']] ? "checked" : "") + " >Started: <input class=\"\" style=\"margin-left: 18px; width: 130px;\" id=\"filterStartDate\" type=\"date\" value=\"\" onchange=\"saveFilterDates(); reDraw()\"></div>";
		body += "<div class='form-check'><input class='form-check-input dateFilter' type='checkbox' value='' id='dateendfilteroption' onchange='selectFilter($(\"#dateendfilteroption\"))'" + (changedStatuses[idToStatus['dateendfilteroption']] ? "checked" : "") + " >Picked Up: <input class=\"\" style=\"width: 130px;\" id=\"filterEndDate\" type=\"date\" value=\"\" onchange=\"saveFilterDates(); reDraw()\"></div>";
		body += "</div>";
		var options = { "content": body, "html": true, "sanitize": false };
		filterPopover = new bootstrap.Popover(buttonEl, options);
		filterPopover.show();
		buttonEl.removeEventListener('hidden.bs.popover', filterHideListener);
		buttonEl.addEventListener('hidden.bs.popover', filterHideListener);
	}
	// exampleEl.addEventListener('show.bs.popover', function () {
	// 	console.log("show");
	// 	var content = $(filterPopover._config.content);
	// 	var children = content.find("");
	// 	console.log(content);
	// 	for (var i in possibleStatuses) {

	// 	}
	// 	filterPopover._config.content = content;
	// })
}
function selectFilter(element) {
	console.log(element.attr("id"));
	if (element.attr("id") == "defaultselectionfilteroption") {
		if (element.prop("checked")) {
			changedStatuses = {};
			$("#filterOptions .normalFilter").prop('checked', true);
			$("#filterOptions .dateFilter").prop('checked', false);
			$("#filterEndDate").val("");//clear the dates too
			$("#filterStartDate").val("");
			startedDateFilter = null;
			endedDateFilter = null;
		}
		else {
			for (k in idToStatus) {
				if (idToStatus[k].includes("Date")) {//dont count date
					continue;
				}
				else {
					changedStatuses[idToStatus[k]] = true;
				}
			}
			$("#filterOptions .normalFilter").prop('checked', false);
			//console.log(hiddenStatuses);
		}
		reDraw();
	}
	else {
		if (element.attr("id").includes("date")) {
			console.log(element.attr("id"));
			changedStatuses[idToStatus[element.attr("id")]] = element.prop("checked");
			if (!element.prop("checked") && element.attr("id").includes("start")) {
				$("#filterStartDate").val("");
				startedDateFilter = null;
			}
			if (!element.prop("checked") && element.attr("id").includes("end")) {
				$("#filterEndDate").val("");
				endedDateFilter = null;
			}
		}
		else {
			changedStatuses[idToStatus[element.attr("id")]] = !element.prop("checked");
		}
		// console.log(checkedStatuses[idToStatus[this.id]]);
		var anyChanged = false;
		for (var k in changedStatuses) {
			if (changedStatuses[k]) {
				anyChanged = true;
				break;
			}
		}
		$("#defaultselectionfilteroption").prop('checked', !anyChanged);
		reDraw();
	}

}
function openFilter() {
	initFilterPopover();
}
// function filterTable()
// {
// 	$('#dtBody').children().each(function(i, ele)
// 	{
// 		console.log(ele);
// 		var thisStatus = $(ele).find('.rowStatusLabel').text();
// 		if(thisStatus.includes("Picked up"))
// 		{
// 			thisStatus = "Picked Up";
// 		}
// 		if(hiddenStatuses[thisStatus])
// 		{
// 			$(ele).hide();
// 		}
// 		else
// 		{
// 			$(ele).show();
// 		}
// 	});
// }