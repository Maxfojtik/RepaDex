const { jsPDF } = window.jspdf;
//report on users, repairs (turn around, amount of work lines, time computer waited for tech to get to it), loopers, customers name.numbers
function updateRepairGeneratorOptions() {
    var selected = $("#generateReportSelector").val();
    $(".reportGeneratorOption").hide();
    $("#" + selected + "ReportGeneratorOptions").show();
}

function generateRepairInclude() {
    $("#generatorRepairsList").text("Only");
}
function generateRepairExclude() {
    $("#generatorRepairsList").text("Exclude");
}
function setReportLastWeek() {
    var end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    for (var i = 0; i < 7; i++) {
        if (end.getDay() == 5) {
            break;
        }
        else {
            end.setDate(end.getDate() - 1);//go back a day
        }
    }
    var start = new Date();
    start.setDate(end.getDate() - 4);//we have friday, now get monday
    start.setUTCHours(0, 0, 0, 0);
    $("#reportStart").val(start.toISOString().slice(0, 16));
    $("#reportEnd").val(end.toISOString().slice(0, 16));

}
function setReportThisWeek() {
    var end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    for (var i = 0; i < 7; i++) {
        if (end.getDay() == 5) {
            break;
        }
        else {
            end.setDate(end.getDate() + 1);//go forward a day
        }
    }
    var start = new Date();
    start.setDate(end.getDate() - 4);//we have friday, now get monday
    start.setUTCHours(0, 0, 0, 0);
    $("#reportStart").val(start.toISOString().slice(0, 16));
    $("#reportEnd").val(end.toISOString().slice(0, 16));

}
function generateReport() {
    // Default export is a4 paper, portrait, using millimeters for units
    var ratio = 876 / 228;
    const doc = new jsPDF();
    // generate top
    /*doc.setFont("WorkSans-Medium", "normal");
    doc.setFontSize(58);
    doc.setTextColor("#ad1417");
    // doc.setTextColor("#00FFFF");
    doc.text("repa", 17, 30);
    doc.setFont("WorkSans-Bold", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("DEX", 61, 30);*/
    doc.setFont("WorkSans-Bold", "normal");
    doc.setFontSize(58);
    doc.setTextColor("#ad1417");
    doc.text("Repa", 10, 30);
    doc.setTextColor(0, 0, 0);
    doc.text("Dex", 61, 30);
    var size = 85;
    doc.addImage("TechLogo.png", "PNG", 115, 15, size, size / ratio);

    //generate meat
    // console.log(doc.getFontList());
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text("Repairs Report", 105, 45, null, null, "center");

    startDate = new Date($("#reportStart").val());
    endDate = new Date($("#reportEnd").val());
    if (startDate && endDate) {
        var repairs = [];
        for (var refNum in backendData["repairs"]) {
            // console.log(repairStartDate + "\t" + startDate + "\t" + endDate);
            if (repairExisted(startDate, endDate, backendData["repairs"][refNum])) {
                repairs.push(backendData["repairs"][refNum]);
            }
        }
        // console.log(repairs);
        var combos = getMakeModelCombos(repairs);
        //do all the data crunching
        var only = $("#generatorRepairsList").text() == "Only";
        console.log(only);
        var customers = $("#repairReportGeneratorCustomers").val().split(",");
        console.log(customers);
        var data = calculateEverything(combos, repairs, only, customers);
        var largestAtTop = $("#generatorRepairsSortBy").val() == "large";
        var idToSortBy = $('#reportGeneratorSortBy input:radio:checked').val();
        var sortingCalculation = $("#" + idToSortBy).val();
        var sortedCombos = sortBy(combos, data, largestAtTop, sortingCalculation);
        console.log(sortedCombos);
        doc.setFontSize(12);
        var pageY = 55;//start down
        var maxWidth = 25;
        var spacing = maxWidth + 2;
        var nameMax = 50;
        var codeToText = {
            "quantity": "QTY",
            "finished": "Finished",
            "unfinished": "Unfinished",
            "turnAround": "ATAT",
            "medianTurnAround": "MeTAT",
            "workLines": "Work Lines",
            "maxTurnAround": "MaTAT",
            "diagTime": "ADT"
        };
        var labels = [
            // { "code": "quantity", "text": "QTY" }
            // { "code": "finished", "text": "Finished" },
            // { "code": "unfinished", "text": "Unfinished" },
            // { "code": "turnAround", "text": "ATAT" },
            // { "code": "medianTurnAround", "text": "MeTAT" },
            // { "code": "workLines", "text": "Work Lines" },
            // { "code": "maxTurnAround", "text": "MaTAT" },
            // { "code": "diagTime", "text": "ADT" }
        ];
        for (var i = 1; i <= 5; i++) {
            var selected = $("#generatorRepairs" + i + "Option").val();
            if (selected != "none") {
                var label = {
                    "code": selected, "text": codeToText[selected]
                };
                labels.push(label);
            }
        }
        console.log(labels);
        generateFirstLine(doc, 12, pageY, labels, spacing, nameMax, maxWidth);
        for (var i = 0; i < sortedCombos.length; i++) {
            if (data[sortedCombos[i]]["quantity"] > 0) {//ignore 0 qty things
                pageY += 8;//move down
                if (pageY > doc.internal.pageSize.height)//if we are greater than the height of the page
                {
                    doc.addPage();
                    pageY = 10;//start at top
                }
                generateLine(doc, data[sortedCombos[i]], labels, spacing, nameMax, maxWidth, 12, pageY, 10, i);
            }
        }
        doc.save("report.pdf");
    }

}

function calculateEverything(combos, repairs, only, customers) {
    data = {};
    //ATAT
    for (var i = 0; i < combos.length; i++) {//go through each and...
        var ATAT = calculateAvgTurnAround(combos[i], repairs, only, customers);
        var MTAT = calculateMedianTurnAround(combos[i], repairs, only, customers);
        var quantity = calculateQuantity(combos[i], repairs, only, customers);
        var maTAT = calculateMaxTurnAround(combos[i], repairs, only, customers);
        var WL = calculateAvgWorkLines(combos[i], repairs, only, customers);
        var diagTime = calculateAvgDiagTime(combos[i], repairs, only, customers);
        var fin = calculateFinished(combos[i], repairs, only, customers);
        var unfin = calculateUnFinished(combos[i], repairs, only, customers);
        data[combos[i]] = {
            "displayName": combos[i],
            "turnAround": ATAT,
            "medianTurnAround": MTAT,
            "quantity": quantity,
            "maxTurnAround": maTAT,
            "workLines": WL,
            "diagTime": diagTime,
            "finished": fin,
            "unfinished": unfin
        };
    }
    return data;
}

function sortBy(combos, data, largestAtTop, code) {
    sortedCombos = [];
    for (var i = 0; i < combos.length; i++) {//go through each and...
        var value = data[combos[i]][code];//get the piece of data we are sorting by
        var inserted = false;
        for (var k = 0; k < sortedCombos.length; k++) {//go through what we have and if we find one that is bigger, we go before it
            // console.log(k, data, data[sortedCombos[k]][code], value);
            if (data[sortedCombos[k]][code] > value) {
                sortedCombos.splice(k, 0, combos[i]);
                inserted = true;
                break;
            }
        }
        if (!inserted)//we did not find anything bigger, we must be biggest and go to the end
        {
            sortedCombos.push(combos[i]);
        }
    }
    if (largestAtTop) {
        sortedCombos.reverse();
    }
    return sortedCombos;
}
function generateSingleCol(doc, textIn, x, y, maxWidth) {
    var text = textIn;
    // console.log(text);
    var textWidth = doc.getTextWidth(text);
    var dotsWidth = doc.getTextWidth("...");
    if (textWidth <= maxWidth) {
        doc.text(x, y, text);
    }
    else {
        while (textWidth + dotsWidth > maxWidth) {
            text = text.substring(0, text.length - 1);
            textWidth = doc.getTextWidth(text);
        }
        doc.text(x, y, text + "...");
    }
}
function generateFirstLine(doc, x, y, labels, spacing, nameMax, maxWidth) {
    var widthOfPage = doc.internal.pageSize.width;
    generateSingleCol(doc, "Device", x, y, nameMax);
    var startLine = x;
    x += nameMax
    for (var i = 0; i < labels.length; i++) {
        generateSingleCol(doc, labels[i]["text"], x, y, maxWidth);
        x += spacing;
    }
    // doc.line(startLine, y + 2, widthOfPage - startLine, y + 2);
}
function generateLine(doc, dataPoint, labels, spacing, nameMax, maxWidth, x, y, height, index) {//generate a line for a specific combo at a x,y position, all data attached: data
    //combo | first | second | third | fourth
    var widthOfPage = doc.internal.pageSize.width;
    if (index % 2 == 0) {
        doc.setFillColor("#ccc");
    }
    else {
        doc.setFillColor("#fff");
    }
    doc.rect(x, y - height / 2, widthOfPage - x * 2, height * 3 / 4, "F");
    generateSingleCol(doc, dataPoint["displayName"], x + 2, y, nameMax);//always the same, 2mm from left
    x += nameMax;
    for (var i = 0; i < labels.length; i++) {
        var roundedData = Math.round((dataPoint[labels[i]["code"]] + Number.EPSILON) * 100) / 100;
        generateSingleCol(doc, roundedData + "", x, y, maxWidth);
        x += spacing;
    }
}

function getDiagTime(repair) {
    if (repair["workCompleted"][1]) {
        var nextLineDate = new Date(repair["workCompleted"][1]["when"]);
        var millisInDay = (1000 * 3600 * 24);
        //https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
        var startTime = new Date(repair["startDate"]).getTime();
        var Difference_In_Time = nextLineDate.getTime() - startTime;
        // To calculate the no. of days between two dates
        var Difference_In_Days = Difference_In_Time / millisInDay;

        //gotta subtract weekends tho
        for (var i = startTime; i < nextLineDate.getTime(); i += millisInDay) {
            var testDate = new Date(i);
            if (testDate.getDay() == 0 || testDate.getDay() == 6)//if we are on a sunday or saturday, remove a day from the calc
            {
                // console.log("sub");
                Difference_In_Days -= 1;
            }
        }
        return Difference_In_Days;
    }
    return null;
}

function getTurnAround(repair) {
    var finishedDate = getFinishedDate(repair);
    if (finishedDate) {
        var millisInDay = (1000 * 3600 * 24);
        //https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
        var startTime = new Date(repair["startDate"]).getTime();
        var Difference_In_Time = finishedDate.getTime() - startTime;
        // To calculate the no. of days between two dates
        var Difference_In_Days = Difference_In_Time / millisInDay;

        //gotta subtract weekends tho
        for (var i = startTime; i < finishedDate.getTime(); i += millisInDay) {
            var testDate = new Date(i);
            if (testDate.getDay() == 0 || testDate.getDay() == 6)//if we are on a sunday or saturday, remove a day from the calc
            {
                // console.log("sub");
                Difference_In_Days -= 1;
            }
        }
        return Difference_In_Days;
    }
    return null;
}
function validCustomer(email, only, customers) {
    var nameNumber = email.replace("@osu.edu", "").replace("@buckeyemail.osu.edu", "").toLowerCase().trim();
    for (var i in customers) {
        var customer = customers[i].toLowerCase().trim();
        if (nameNumber == customer && only) {//if they are and only
            console.log("only");
            return true;
        }
        if (nameNumber == customer && !only) {//if they are and excluded, then no
            console.log("exclude");
            return false;
        }
    }
    // console.log("other " + !only);
    return !only;//if we did not find them, then if only, its not valid, if not only (exclude), then is valud
}
function getValidRepairs(combo, repairs, only, customers) {
    var validRepairs = [];
    for (var i = 0; i < repairs.length; i++) {
        var repair = repairs[i];
        var thisCombo = repair["make"] + " " + repair["model"];
        if (thisCombo == combo && validCustomer(repair["email"], only, customers)) {
            validRepairs.push(repair);
        }
    }
    return validRepairs;
}
function calculateFinished(combo, repairs, only, customers) {
    var validRepairs = getValidRepairs(combo, repairs, only, customers);
    var sum = 0;
    for (var i = 0; i < validRepairs.length; i++) {
        var finishedDate = getFinishedDate(validRepairs[i]);
        if (finishedDate) {
            sum++;
        }
    }
    return sum;
}
function calculateUnFinished(combo, repairs, only, customers) {
    var validRepairs = getValidRepairs(combo, repairs, only, customers);
    var sum = 0;
    for (var i = 0; i < validRepairs.length; i++) {
        var finishedDate = getFinishedDate(validRepairs[i]);
        if (!finishedDate) {
            sum++;
        }
    }
    return sum;
}

function calculateAvgDiagTime(combo, repairs, only, customers) {
    var validRepairs = getValidRepairs(combo, repairs, only, customers);
    var total = 0;
    var sum = 0;
    for (var i = 0; i < validRepairs.length; i++) {
        var diag = getDiagTime(validRepairs[i]);
        if (diag) {
            total++;
            sum += diag;
        }
    }
    return sum / total;
}
function calculateMedianTurnAround(combo, repairs, only, customers) {
    var validRepairs = getValidRepairs(combo, repairs, only, customers);
    var arrayOfTurnAroundTimes = [];
    for (var i = 0; i < validRepairs.length; i++) {
        var turnAround = getTurnAround(validRepairs[i]);
        arrayOfTurnAroundTimes.push(turnAround);
    }
    var middleNumber = arrayOfTurnAroundTimes.length / 2;
    arrayOfTurnAroundTimes.sort((a, b) => a - b);
    var median;
    if (arrayOfTurnAroundTimes.length % 2 == 0) {
        var avgOfMedian = arrayOfTurnAroundTimes[middleNumber];//round down
        avgOfMedian += arrayOfTurnAroundTimes[middleNumber - 1];//round down add one
        median = avgOfMedian / 2;
    }
    else {
        median = arrayOfTurnAroundTimes[(middleNumber | 0)];
    }
    return median;
}

function calculateAvgWorkLines(combo, repairs) {
    var validRepairs = getValidRepairs(combo, repairs);
    var total = 0;
    var sum = 0;
    for (var i = 0; i < validRepairs.length; i++) {
        var workLines = validRepairs[i].workCompleted.length;
        if (workLines) {
            total++;
            sum += workLines;
        }
    }
    return sum / total;
}
function calculateAvgTurnAround(combo, repairs, only, customers) {
    var validRepairs = getValidRepairs(combo, repairs, only, customers);
    var total = 0;
    var sum = 0;
    for (var i = 0; i < validRepairs.length; i++) {
        var turnAround = getTurnAround(validRepairs[i]);
        if (turnAround) {
            total++;
            sum += turnAround;
        }
    }
    return sum / total;
}
function calculateMaxTurnAround(combo, repairs, only, customers) {
    var validRepairs = getValidRepairs(combo, repairs, only, customers);
    var max = 0;
    for (var i = 0; i < validRepairs.length; i++) {
        var turnAround = getTurnAround(validRepairs[i]);
        if (turnAround) {
            if (turnAround > max) {
                max = turnAround;
            }
        }
    }
    return max;
}

function calculateQuantity(combo, repairs, only, customers) {
    var validRepairs = getValidRepairs(combo, repairs, only, customers);
    return validRepairs.length;
}
function getMakeModelCombos(repairs) {
    var combos = [];
    for (var i = 0; i < repairs.length; i++) {
        var combo = repairs[i]["make"] + " " + repairs[i]["model"];
        if (!combos.includes(combo)) {
            combos.push(combo);
        }
    }
    return combos;
}

function getFinishedDate(repair) {
    var workDone = repair["workCompleted"];
    for (var i = 0; i < workDone.length; i++) {
        if (workDone[i]["what"] == "Finished") {
            return new Date(workDone[i]["when"]);
        }
    }
    if (repair["datePicked"]) {
        return new Date(repair["datePicked"]["when"]);
    }
    return null;
}

function repairExisted(startDate, endDate, repair) {
    var repairStartDate = new Date(repair["startDate"]);
    var repairFinishDate = getFinishedDate(repair);
    //rep (start between date S and date E) or (end between date s and date e) or (start < date start and (end > date e or end is null))
    return (
        (repairStartDate > startDate && repairStartDate < endDate) ||
        (repairFinishDate && (repairFinishDate > startDate && repairFinishDate < endDate) ||
            (repairStartDate < startDate && (repairFinishDate == null || repairFinishDate > endDate)))
    );
}