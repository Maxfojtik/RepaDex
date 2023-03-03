var backendData;
var config;
var stopShaking = false;

// sort array ascending
const asc = arr => arr.sort((a, b) => a - b);

const sum = arr => arr.reduce((a, b) => a + b, 0);

const mean = arr => sum(arr) / arr.length;

// sample standard deviation
const std = (arr) => {
    const mu = mean(arr);
    const diffArr = arr.map(a => (a - mu) ** 2);
    return Math.sqrt(sum(diffArr) / (arr.length - 1));
};

const quantile = (arr, q) => {
    const sorted = asc(arr);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

function getEndDate(repair)
{
    var endDate = undefined;
    for(var i = 0; i < repair["workCompleted"].length; i++)
    {
        if(repair["workCompleted"][i]["what"]=="Finished")
        {
            endDate = new Date(repair["workCompleted"][i]["when"]);
        }
    }
    return endDate;
}

function calculateTime(start, end)
{
    var Difference_In_Time = end.getTime() - start.getTime();
    return Difference_In_Time / (1000 * 3600 * 24);
}

function getRepairs(startingDate, deviceName)
{
    var days = [];//time to complete in days
    var top = getTopRepair(backendData["repairs"]);
    for(var i = getBottomRepair(backendData["repairs"]); i < top; i++)
    {
        var repair = backendData["repairs"][i];
        if(!repair)
        {
            continue;
        }
        var startDate = new Date(repair["workCompleted"][0]["when"]);//the first work is always the created entry
        var endDate = getEndDate(repair);
        if(endDate && repair["model"].includes(deviceName))//we have a start and end
        {
            if(calculateTime(endDate, startingDate) < 14)//ended in the last 14 days
            {
                // console.log(deviceName+":"+calculateTime(startDate, endDate));
                days.push(calculateTime(startDate, endDate));
            }
            // console.log(calculateTime(startDate, endDate));
        }
    }
    return days;
}

function calculateFancyNumbers(startingDate, perc, deviceName)
{
    var days = getRepairs(startingDate, deviceName);
    var qercent = quantile(days, perc);
    return qercent;
}


function getTopRepair(repairs)
{
	var topNumber = 0;
	for(var refNum in repairs)
	{
		//console.log(refNum+":"+topNumber);
		if(parseInt(refNum) > topNumber)
		{
			topNumber = refNum;
		}
	}
	return topNumber;
}
function getBottomRepair(repairs)
{
	var bottomNumber = 10000000;
	for(var refNum in repairs)
	{
		//console.log(refNum+":"+topNumber);
		if(parseInt(refNum) < bottomNumber)
		{
			bottomNumber = refNum;
		}
	}
	return bottomNumber;
}
function loadConfiguration()
{
	window.api.receive("fromMainConfig", (data) => {
        //doneLoadingSaving();
		try
		{
			config = JSON.parse(data);
		}
		catch(e)
		{
			console.log(e);
			$("#mainError").show();
			$("#container").hide();
			$("#mainError").text("There is an error with configuration.json, can't load");
		}
	});
	window.api.send("toMain", "configPls");
}
function interested(currentRepairJSON)
{
    //console.log(currentRepairJSON["refNum"]+":"+currentRepairJSON["model"]+":"+currentRepairJSON["intakeNotes"]+":"+currentRepairJSON["intakeNotes"].includes("Flagship Device"));
    return currentRepairJSON["intakeNotes"].includes("Flagship Device");
}
function figureOutColorAndStatus(currentRepairJSON)
{
	var status = "Unknown";
	if(currentRepairJSON["datePicked"])
	{
		status = "ignore";
	}
	else
	{
		for(var i = currentRepairJSON["workCompleted"].length-1; i >= 0; i--)
		{
			var work = currentRepairJSON["workCompleted"][i];
			if(work["what"]=="Ordered Parts")
			{
				status = "submittedPanel";
				break;
			}
			if(work["what"]=="Waiting on DEP")
			{
				status = "DEPPanel";
				break;
			}
			if(work["what"]=="Finished")
			{
				status = "finishedPanel";
				break;
			}
			if(work["what"]=="Created Repair Form")
			{
				status = "createdPanel";
				break;
			}
            if(work["what"]=="Sent Out")
			{
				status = "ignore";
				break;
			}
			if(work["what"]=="Diagnosed")
			{
				status = "ignore";
				break;
			}
			if(work["what"]=="Submitted Claim")
			{
				status = "ignore";
				break;
			}
			if(work["what"]=="Submitted RFA")
			{
				status = "ignore";
				break;
			}
			if(work["what"]=="Parts Arrived")
			{
				status = "ignore";
				break;
            }
		}
	}
	return status;
}
function startLoadingSaving(message)
{
    $("#iPadInfo").css("top", "75px");
    $("#pencilInfo").css("top", "105px");
	$("#saveText").text(message);
	$("#savingDisplay").css("color", "black");
	//$("#saveSpinner").css("visibility", "visible");
	$("#savingDisplay").css("display", "flex").hide().fadeIn();
	//$("#savingDisplay").addClass("d-flex");
	$("#pokeImage").addClass("shaker");
	$("#pokeImage").removeClass('shakers');
	$(".starImage").css("visibility", "shown");
	$("#pokeStars").hide();
	stopShaking = false;
}
function doneLoadingSaving()
{
	$("#savingDisplay").css("color", "black");
	stopShaking = true;
}
function generateInnerHTMLForPanel(name, dateStarted, deviceName)
{
    var html = "<h5 style='margin-bottom: 0px; padding-left: 2px; overflow: hidden; height: 25px; margin-bottom: -2px;' class='nameLabel'>"+name+"</h5><h5 style='padding-left: 2px; width: 90px; float:left;' class='dateLabel'>"+dateStarted+"</h5><h5 style='float:right; width: 180px; text-align: right; padding-right: 2px;' class='deviceLabel'>"+deviceName+"</h5>";
    return html;
}
function generateHTMLForPanel(x, y, borderColor, id, thePanel, name, dateStarted, deviceName)
{
    thePanel = thePanel.replace("#", "");
    return "<div class='panel' style='border-color: "+borderColor+"; margin-left:"+x+"; margin-top: "+y+";' id='panel-"+thePanel+"-"+id+"' refnum="+id+">"+generateInnerHTMLForPanel(name, dateStarted, deviceName)+"</div>";
}
var devicesInPanels = {};
var ghostsInPanels = {};
var panelsThatAreMoving = {};
var panelShifts = {};
function calculatePosition(position)
{
    position = position + 3;
    //calculate position
    var x = -1;
    var y = 0;
    for(var i = 0; i < position; i++)
    {
        y++;
        if(y>=3)
        {
            y = 0;
            x++;
        }
    }
    //console.log(x+"::::"+y);
    return [x*300,5+y*58];
}
function compareNames(current, newName)
{
    //console.log(current.toLowerCase()+":"+newName.toLowerCase()+":"+(current.toLowerCase().localeCompare(newName.toLowerCase())));
    return current.toLowerCase().localeCompare(newName.toLowerCase());
}
function figureIndex(arr, newName)
{
    for(var i = 0; i < arr.length; i++)
    {
        var name = backendData["repairs"][arr[i]]["name"];
        if(compareNames(name, newName)>0)
        {
            return i;
        }
    }
    return arr.length;
}
function getHighest(threeMoved)
{
    var highest = threeMoved[0]["y"];//lowest y is highest
    var highestId = 0;
    for(var i = 0; i < threeMoved.length; i++)
    {
        if(highest>threeMoved[i]["y"])
        {
            highest = threeMoved[i]["y"];
            highestId = i;
        }
    }
    return threeMoved[highestId];
}
function calcuatePositionsAndFillGhosts(thePanel, dontAnimate)
{
    if(!panelShifts[thePanel])
    {
        panelShifts[thePanel] = 0;
    }
    var shiftedPos = panelShifts[thePanel];
    var children = $(thePanel).children();
    if(dontAnimate)
    {
        children.addClass("stop-animations");
    }
    else
    {
        children.removeClass("stop-animations");
    }
    // console.log(devicesInPanels[thePanel]);
    // console.log("");
    // console.log("");
    // console.log("");
    var threeMoved = [];
    var first = false;
    var second = false;
    for(var i = 0; i < devicesInPanels[thePanel].length; i++)
    {
        var id = "#panel-"+thePanel.replace("#","")+"-"+devicesInPanels[thePanel][i];
        var oldX;
        if($(id).css("margin-left"))
        {
            oldX = $(id).css("margin-left").replace("px", "");
        }
        [x,y] = calculatePosition(shiftedPos);
        if(shiftedPos<3)//if we are within the first three then write down the first two because those are the two we are going to need to create ghosts for
        {
            threeMoved.push({"y": y, "id": devicesInPanels[thePanel][i]});
        }
        if(!dontAnimate && x>=1800)//if we are animating but then we calcuate the position of the element to be offscreen, fade out instead of moving
        {
            console.log("fading out"+id);
            $(id).fadeOut(200, "linear", function() {
                $(this).addClass("stop-animations");
                $(this).css("margin-left", $(this).attr("targetX"));//move to our target
                $(this).css("margin-top", $(this).attr("targetY"));
                $(this).show();
            });
            $(id).attr("targetX", x+"px");//write down our targets and then fade out
            $(id).attr("targetY", y+"px");
        }
        else if(!dontAnimate && oldX>=1800 && x < 1800)//if we are animating but then we calcuate the position of the element to be onscreen, fade in instead of moving
        {
            console.log("fading in"+id);
            $(id).addClass("stop-animations");//add class to stop animating, move
            $(id).css("margin-left", x+"px");
            $(id).css("margin-top", y+"px");
            $(id).hide()
            $(id).fadeIn(200, "linear")
            // setTimeout(function() {fadeIn(200, "linear"), 50}.bind(this));//fade in?
        }
        else
        {
            $(id).css("margin-left", x+"px");
            $(id).css("margin-top", y+"px");
        }
        //console.log(id+":"+shiftedPos);
        shiftedPos++;
        //console.log(shiftedPos+":"+devicesInPanels[thePanel][shiftedPos]);
        if(shiftedPos>=devicesInPanels[thePanel].length)
        {
            shiftedPos = 0;
        }
    }
    var first;
    var second;
    if(ghostsInPanels[thePanel]>0)//there is any ghosts
    {
        first = getHighest(threeMoved);
        threeMoved.splice(threeMoved.indexOf(first), 1);
        second = getHighest(threeMoved);
        // console.log("first: "+first["id"]+":"+backendData["repairs"][first["id"]]["name"]);
        // console.log("second: "+second["id"]+":"+backendData["repairs"][second["id"]]["name"]);
    }
    var firstGhostPos = 20;
    if(ghostsInPanels[thePanel]>1)//setup 2 ghosts
    {
        firstGhostPos = 19;//move the first one up
        var clonePanel = $("#panel"+second["id"]);
        var name = clonePanel.find(".nameLabel").text();
        var device = clonePanel.find(".deviceLabel").text();
        var date = clonePanel.find(".dateLabel").text();
        var color = clonePanel.css("border-color");
        var theGhost = $("#panel"+thePanel.replace("#","")+"ghost1");
        theGhost.find(".nameLabel").text(name);
        theGhost.find(".deviceLabel").text(device);
        theGhost.find(".dateLabel").text(date);
        theGhost.css("border-color", color);
        [x,y] = calculatePosition(20);
        //console.log(theGhost);
        theGhost.addClass("stop-animations");
        theGhost.css("margin-left", x+"px");
        theGhost.css("margin-top", y+"px");
        theGhost.show();
    }
    if(ghostsInPanels[thePanel]>0)//setup 1 ghost
    {
        var clonePanel = $("#panel"+first["id"]);
        var name = clonePanel.find(".nameLabel").text();
        var device = clonePanel.find(".deviceLabel").text();
        var date = clonePanel.find(".dateLabel").text();
        var color = clonePanel.css("border-color");
        var theGhost = $("#panel"+thePanel.replace("#","")+"ghost0");
        theGhost.find(".nameLabel").text(name);
        theGhost.find(".deviceLabel").text(device);
        theGhost.find(".dateLabel").text(date);
        theGhost.css("border-color", color);
        [x,y] = calculatePosition(firstGhostPos);
        //console.log(theGhost);
        theGhost.addClass("stop-animations");
        theGhost.css("margin-left", x+"px");
        theGhost.css("margin-top", y+"px");
        theGhost.show();
    }
    // for(var i = 0; i < ghostsInPanels[thePanel]; i++)
    // {

    // }
}
var addingTimer = -1;
function removeFromPanel(repair)
{
    adding = true;
    if(addingTimer>=0)
    {
        clearTimeout(addingTimer);
    }
    addingTimer = setTimeout(() => {adding = false; addingTimer = -1;}, 2000);//reset it after
    var thePanel = repair["panel"];
    var refNum = repair["refNum"];
    // console.log(refNum);
    // console.log($("#panel"+refNum).remove); okay so for max when you get back you gotta add the panel to the id, fun times
    $("#panel-"+thePanel.replace("#", "")+"-"+refNum).fadeOut(1000, "linear", function() {
        console.log("removing "+$(this).id);
        $(this).remove();
    });
    devicesInPanels[thePanel].splice(devicesInPanels[thePanel].indexOf(refNum), 1);
}
var adding = false;
function addToPanel(thePanel, refNum, color, name, date, device)
{
    adding = true;
    if(addingTimer>=0)
    {
        clearTimeout(addingTimer);
    }
    addingTimer = setTimeout(() => {adding = false; addingTimer = -1;}, 2000);//reset it after
    if(!devicesInPanels[thePanel])
    {
        devicesInPanels[thePanel] = [];
    }
    var indexOfNewOne = figureIndex(devicesInPanels[thePanel], name);
    devicesInPanels[thePanel].splice(indexOfNewOne, 0, refNum);
    //devicesInPanels[thePanel].push(refNum);
    //[x,y] = calculatePosition(devicesInPanels[thePanel].length-1);
    var x = 0;
    var y = 0;
    if(color=="#000000")
    {
        color = "#ffffff";
    }
    var item = $(generateHTMLForPanel(x, y, color, refNum, thePanel, name, date, device)).hide().delay(1000).fadeIn(1000, "linear", function() {});
    $(thePanel).append(item);
}
function createGhosts(thePanel)
{
    if(!devicesInPanels[thePanel])
    {
        devicesInPanels[thePanel] = 0;
    }
    var totalDevices = devicesInPanels[thePanel].length;
    ghostsInPanels[thePanel] = 0;//remove all ghosts so we can create them again
    $(thePanel+" .ghost").remove();
    if(totalDevices>18 && totalDevices<21)//19-20
    {
        var numCreate = 21-totalDevices;
        for(var i = 0; i < numCreate; i++)
        {
            // var ghostID = 
            var ghost = $("#panel"+devicesInPanels[thePanel][i]).clone();//just clone the first ones 
            ghost.attr("id", "panel"+thePanel.replace("#","")+"ghost"+i);
            // ghost.attr("refnum", refNum);
            ghost.addClass("ghost");
            // var position = (devicesInPanels[thePanel].length + ghostsInPanels[thePanel].length); dont get a position because we will calcuate that later
            // [x,y] = calculatePosition(position);
            // ghost.css("margin-left", x);
            // ghost.css("margin-top", y);
            //console.log(ghost);
            $(thePanel).append(ghost);
            // console.log("created ghost for "+thePanel);
        }
        ghostsInPanels[thePanel] = numCreate;
    }
}
var movingPanel = false;
var movingPanelTimer = -1;
function movePanel(thePanel)
{
    // console.log("move");
    var children = $(thePanel).children();
    if(adding)//just dont move if animating an add
    {
        return;
    }
    movingPanel = true;
    if(movingPanelTimer>=0)
    {
        clearTimeout(movingPanelTimer);
    }
    movingPanelTimer = setTimeout(() => {movingPanel = false; movingPanelTimer = -1;}, 2100);
    children.removeClass("stop-animations");//make sure to animate when moving
    console.log("move");
    if(!devicesInPanels[thePanel])
    {
        devicesInPanels[thePanel] = [];
    }
    var totalDevices = devicesInPanels[thePanel].length;
    if(totalDevices > 18)
    {
        // setTimeout(function (){moveFrontToBackAndRemoveGhosts(thePanel)}, 2500);
        var children = $(thePanel).children();
        panelsThatAreMoving[thePanel] = totalDevices > 18;
        if(panelsThatAreMoving[thePanel])
        {
            panelShifts[thePanel] -= 3;
            if(panelShifts[thePanel]<0)
            {
                panelShifts[thePanel] = (totalDevices)+panelShifts[thePanel];
            }
            setTimeout(function (){calcuatePositionsAndFillGhosts(thePanel,true)}, 2000);
            var children = $(thePanel).children();
            for(var i = 0; i < children.length; i++)
            {
                var currentX = $("#"+children[i].id).css("margin-left").replace("px","");
                currentX -= 300;
                /*  okay so future max, you should remove this stupid code that moves stuff without thinking and actually calcuate the positions using the function and the shifted value
                    and then move them acordingly (have fun with ghosts) okay it took 8 hours but we got there
                */
                // console.log("#"+children[i].id + ":" + currentX);
                $("#"+children[i].id).css("margin-left", currentX+"px");
            }
        }
    }
}
function checkIfNotInHours()
{
    var speed = 2000;
    var date = new Date();
    var hours = date.getHours();
    if(hours==18)
    {
        $("#byePanel").fadeIn();
        $("#mainProgram").fadeOut();
        $("#whitePanel").fadeOut();
    }
    else if(hours>=19 || hours<9)
    {
        if(date.getMinutes()%2==0)
        {
            $("#whitePanel").fadeIn();
        }
        else
        {
            $("#whitePanel").fadeOut();
        }
        $("#mainProgram").fadeOut();
        $("#byePanel").fadeOut();
    }
    else
    {
        $("#mainProgram").fadeIn();
        $("#byePanel").fadeOut();
        $("#whitePanel").fadeOut();
    }
}
$( document ).ready(function() {
    setTimeout(function() {setInterval(function() {movePanel("#finishedPanel")}, 5000)},0);
    setTimeout(function() {setInterval(function() {movePanel("#DEPPanel")}, 5000)},200);
    setTimeout(function() {setInterval(function() {movePanel("#submittedPanel")}, 5000)},400);
    setTimeout(function() {setInterval(function() {movePanel("#createdPanel")}, 5000)},600);
    checkIfNotInHours();
    setInterval(checkIfNotInHours, 1000*5);
    // setTimeout(addRandomTimed, 4000);
    // setInterval(function() {moveRandomPanel()}, 4000);
	loadConfiguration();
	$('#pokeImage').on('animationiteration', function () {
		if(stopShaking)
		{
			var $this = $(this);
			$this.removeClass('shaker');
			$this.addClass('shakers');
			$("#savingDisplay").fadeOut(1000);
			$("#pokeStars").show();
			$("#saveText").text("Done.");
            setTimeout(function() {
                $("#iPadInfo").css("top", "25px");
                $("#pencilInfo").css("top", "55px");
            }, 1000);
			//$this.off();
		}
	});
    //doneLoadingSaving();
    backendData = {};
    backendData["repairs"] = {};
	startLoadingSaving("Loading repairs...");
	window.api.send("toMain", "loadAll");
});
function addRandomTimed()
{
    setTimeout(addRandomTimed,4000);
    // for(var i = 0; i < 11; i++)
    // {
        addRandom();
    //}
}
function addRandom()
{
    console.log("add");
    var name = "Max "+(String.fromCharCode(97 + Math.floor(Math.random() * 26)))+(String.fromCharCode(97 + Math.floor(Math.random() * 26)))+(String.fromCharCode(97 + Math.floor(Math.random() * 26)))+(String.fromCharCode(97 + Math.floor(Math.random() * 26)));
    var refNum = Math.floor(Math.random() * 100000);
    backendData["repairs"][refNum] = {"refNum": refNum, "model": "iPad Air", "name": name, "intakeNotes": "Digital Flagship", "intakeNotes": "Flagship Device", "workCompleted": [{"who":"fojtik.6", "when":"2022-03-28T20:01:50.291Z", "what": "Finished"},{"who":"fojtik.6", "when":"2022-03-29T20:01:50.291Z", "what": "Finished"}]};
    setTimeout(() => {backendData["repairs"][refNum]["datePicked"] = true; console.log("picked up"); scheduleShowRepairs();}, 61000);
    //console.log(backendData);
    //addToPanel("#finishedPanel", refNum, "#0000ff", name, "04/12/22", "Apple Pencil");
    scheduleShowRepairs();
    //calcuatePositions("#finishedPanel");
}
function showRepair(repair, panel)
{
    //console.log(repair["name"]);
    //addToPanel(thePanel, refNum, color, name, date, device)
    var whoCreated = repair["workCompleted"][0]["who"];
    var dateStarted = repair["workCompleted"][0]["when"];
    var date = new Date(dateStarted);
    var dateText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
    var color = config["employees"][whoCreated]["color"];
    if(!devicesInPanels[panel])
    {
        devicesInPanels[panel] = [];
    }
    if(devicesInPanels[panel].indexOf(repair.refNum)==-1)
    {
        // console.log("adding: "+repair["name"]);
        addToPanel(panel, repair.refNum, color, repair["name"], dateText, repair["model"]);
    }
}
function getRefNums(thePanel)
{
    var refNums = [];
    var children = $(thePanel).children();
    for(var i = 0; i < children.length; i++)
    {
        var child = children[i];
        refNums.push({"panel": thePanel, "refNum": parseInt($("#"+child.id).attr("refnum"))});
    }
    // console.log(thePanel+":"+refNums.length);
    return refNums;
}
function getAllShownRefNumbers()
{
    var allRefs = getRefNums("#finishedPanel");
    allRefs = allRefs.concat(getRefNums("#DEPPanel"));
    allRefs = allRefs.concat(getRefNums("#submittedPanel"));
    allRefs = allRefs.concat(getRefNums("#createdPanel"));
    return allRefs;
}
function mostRecentRepair()
{
    var refNum = getBottomRepair(backendData["repairs"]);
    var date = new Date(backendData["repairs"][refNum]["workCompleted"][0]["when"]);
    var top = getTopRepair(backendData["repairs"]);
    for(var i = getBottomRepair(backendData["repairs"]); i <= top; i++)
    {
        if(!backendData["repairs"][i])
        {
            continue;
        }
        var repair = backendData["repairs"][i];
        var thisDate = new Date(repair["workCompleted"][0]["when"]);
        if(date.getTime()<thisDate.getTime())
        {
            date = thisDate;
            refNum = i;
        }
    }
    return backendData["repairs"][refNum];
}
function repairInPanel(allRepairs, refNum, targetPanel)//1 = right panel, 0 = wrong panel, -1 not shown
{
    for(var i = 0; i < allRepairs.length; i++)
    {
        if(allRepairs[i]["refNum"]==refNum)
        {
            if(allRepairs[i]["panel"] == targetPanel)
            {
                return 1;
            }
            return allRepairs[i]["panel"];
        }
    }
    return -1;
}
function showRepairs(repairs)
{
    var allRepairs = getAllShownRefNumbers();
    var repairsToRemove = [];
    
    console.log(allRepairs);
    var topRepair = getTopRepair(repairs);
    for(var i = getBottomRepair(repairs); i <= topRepair; i++)
    {
        if(!repairs[i])
        {
            continue;
        }
        var show = interested(repairs[i]);
        var status = figureOutColorAndStatus(repairs[i]);
        if(status!="ignore" && show)
        {
            console.log(repairs[i]["refNum"]+":"+status);
            showRepair(repairs[i], "#"+status);
        }
        var toRemoveFrom = repairInPanel(allRepairs, repairs[i]["refNum"], "#"+status);
        if(typeof toRemoveFrom == "string")//if we get a string that means it is not supposed to be in this panel
        {
            // console.log(status+":"+repairs[i]["refNum"]);
            repairsToRemove.push({"refNum": repairs[i]["refNum"], "panel": toRemoveFrom});
        }
        // else//we need to not just check if it is gone but also if it is in the wrong panel
        // {
        //     //console.log(allRepairs.indexOf(parseInt(repairs[i]["refNum"])));
        //     // if(allRepairs.indexOf(parseInt(repairs[i]["refNum"]))!=-1)//if we should ignore it but we still have it, remove it this wont work anymore
        //     // {
        //     //     repairsToRemove.push(allRepairs[allRepairs.indexOf(repairs[i]["refNum"])]);
        //     // }
        // }
    }
    console.log(repairsToRemove);
    for(var i = 0; i < repairsToRemove.length; i++)
    {
        removeFromPanel(repairsToRemove[i]);
    }
    var recentRepair = mostRecentRepair();
    var color = config.employees[recentRepair["workCompleted"][0]["who"]].color;
    if(color=="#000000")
    {
        color = "#ffffff"
    }
    setRepaColor(color);
    createGhosts("#finishedPanel");
    createGhosts("#DEPPanel");
    createGhosts("#submittedPanel");
    createGhosts("#createdPanel");
    //console.log("Calc poses");
    calcuatePositionsAndFillGhosts("#finishedPanel", false);
    calcuatePositionsAndFillGhosts("#DEPPanel", false);
    calcuatePositionsAndFillGhosts("#submittedPanel", false);
    calcuatePositionsAndFillGhosts("#createdPanel", false);
}
var showRepairTimer = -1;
function scheduleShowRepairs()
{
    if(!movingPanel)
    {
        showRepairsCalled();//if we are not moving show them now
    }
    else
    {
        if(showRepairTimer==-1)
        {
            showRepairTimer = setTimeout(showRepairsCalled, 2100);//else wait for any movement to stop and then show them
        }
    }
}
var backendData = {};
function elimOutliers(data, cutOff)
{
    for(var i = 0; i < data.length; i++)
    {
        if(data[i]>cutOff)
        {
            console.log("removing: "+data[i]+":"+cutOff);
            data.splice(i, 1);//remove it
            i--;
        }
    }
    return data;
}
function showRepairsCalled()
{
    showRepairTimer = -1;
    showRepairs(backendData["repairs"]);
    //calculate fancy numbers:
    var date = new Date();
    var padRepairs = getRepairs(date, "iPad");
    var padMean = mean(padRepairs);
    var padSTD = std(padRepairs);
    var padTwoUp = padMean + padSTD*2;
    padRepairs = elimOutliers(padRepairs, padTwoUp);
    padMean = mean(padRepairs);
    padSTD = std(padRepairs);
    var padOneUp = padMean + padSTD;
    padTwoUp = padMean + padSTD*2;
    var penRepairs = getRepairs(date, "Pencil");
    var penMean = mean(penRepairs);
    var penSTD = std(penRepairs);
    var penTwoUp = penMean + penSTD*2;
    penRepairs = elimOutliers(penRepairs, penTwoUp);
    penMean = mean(penRepairs);
    penSTD = std(penRepairs);
    var penOneUp = penMean + penSTD;
    penTwoUp = penMean + penSTD*2;

    // var padOneDown = padMean - padSTD;
    $("#iPadInfo").text("iPads: "+Math.ceil(padMean)+" to "+Math.ceil(padOneUp)+" maybe "+Math.ceil(padTwoUp)+" real days");
    $("#pencilInfo").text("Accessories: "+Math.ceil(penMean)+" to "+Math.ceil(penOneUp)+" maybe "+Math.ceil(penTwoUp)+" real days");
    // var penstd = calculateFancyNumbers(new Date(1648673662), .68, "Pencil");
    // console.log(padMedian+":"+padqstd);
    // console.log(padq95+":"+penq95);
}
window.api.receive("fromMainLoadfile", (data) => 
{
    startLoadingSaving("Loading Repairs...");
	window.api.send("toMain", "loadAll");
});
window.api.receive("fromMainLoadAll", (data) => 
{
	doneLoadingSaving();
	try
	{
		backendData = JSON.parse(data);
		if(backendData["repairs"])
		{
			scheduleShowRepairs();
		}
	}
	catch(e)
	{
		console.log(e);
		$("#mainError").show();
		$("#container").hide();
		$("#mainError").text("There is an error with the backend json file, can't load ("+e+")");
	}
});
function removeTransision()
{
	$("#RepaPart").css("color", oldColor);
	$("#RepaPartTop").removeClass("RepaPartTrans");
	timer = 0;
}
var oldColor = "#000000";
var timer = 0;
function setRepaColor(newColor)
{
	//$("#RepaPartTop").removeClass("RepaPartTrans");
	//$("#RepaPart").css("background", "linear-gradient(to right, "+oldColor+", "+oldColor+" 50%, "+newColor+" 50%);");
	//$("#RepaPart").css("background-position", "100%");
	$("#RepaPartTop").css("color", newColor);
	$("#RepaPartTop").addClass("RepaPartTrans");
	oldColor = newColor;
	if(timer!=0)
	{
		clearTimeout(timer);
	}
	timer = setTimeout(removeTransision, 500);
	//$("#RepaPart").css("color", newColor);
}