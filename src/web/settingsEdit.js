function openSettings() {
    shownPanel = -1;
    $(".panel").hide();
    $("#settingsEdit").fadeIn();
    var modal = bootstrap.Modal.getInstance('#aboutModal');
    modal.hide();
    $("#v-pills-users-tab").click();
    setupSettingsLoaners();
}

function applyPillColor(employee) {
    var color = document.getElementById("settings-employee-" + employee + "-color").value;
    console.log(color);
    // console.log($("#settings-pill-" + employee));
    $("#settings-pill-" + employee).css("background-color", color);
    $("#settings-pill-" + employee).css("border-color", color);
    determineIfUsersChanged();
}

function changedBlackText(employee) {
    // console.log($("#settings-employee-" + employee + "-check-bl  ack"));
    if ($("#settings-employee-" + employee + "-check-black").is(":checked")) {
        $("#settings-pill-" + employee).addClass("text-dark");
    }
    else {
        $("#settings-pill-" + employee).removeClass("text-dark");
    }
    determineIfUsersChanged();
}

function addNewUser() {
    var modal = bootstrap.Modal.getOrCreateInstance('#addUserModal');
    modal.show();
}

function saveNewUser() {
    addingANewEmployee = true;
    var modal = bootstrap.Modal.getOrCreateInstance('#addUserModal');
    modal.hide();
    var modal = bootstrap.Modal.getOrCreateInstance('#saveConfirmModal');
    modal.show();
}
function clickRefNum(refNum) {
    refClicked = refNum;
    clickRow(refNum);
}
function setupSettingsLoaners() {
    $("#accordionLoaners").empty();
    for (var tag in backendData["loaners"]) {
        var loaner = backendData["loaners"][tag];
        var backgroundColor = "background: var(--bs-success-border-subtle);";
        var insideButton = loaner["make"] + " " + loaner["model"] + " : " + tag;
        if (loaner["checkOut"]) {
            backgroundColor = "background: " + (darkMode ? "#3f6893" : "var(--bs-warning-border-subtle)");
            var date = new Date(loaner["checkOut"]["dateReleased"]);
            var dateReleasedText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
            insideButton += "<span style=\"padding-left: 100px;\">Ref Num: <a href='javascript:void(0)' onclick='clickRefNum(" + loaner["checkOut"]["refNum"] + ")'>" + loaner["checkOut"]["refNum"] + "</a>;  " + loaner["checkOut"]["whoStarted"] + " checked it out on " + dateReleasedText + " to " + backendData["repairs"][loaner["checkOut"]["refNum"]]["name"] + "</span>";
        }
        var accordionItem = "<div class=\"accordion-item\" style=\"" + backgroundColor + "\">";
        var header = "<h2 class=\"accordion-header\" id=\"heading" + tag + "\">";
        var accordionButton = "<button style=\"" + backgroundColor + "\" class=\"accordion-button collapsed\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#collapse" + tag + "\" aria-expanded=\"false\" aria-controls=\"collapse" + tag + "\">" + insideButton + "</button>";
        var headerEnd = "</h2>";
        var accordionInside = "<div id=\"collapse" + tag + "\" class=\"accordion-collapse collapse\" aria-labelledby=\"headingOne\" data-bs-parent=\"#accordion" + tag + "\">";
        var accordionBody = "<div class=\"accordion-body\">";

        var accordionBodyText = "<ul class=\"list-group list-group-flush\">";
        if (loaner["history"]) {
            for (var i in loaner["history"]) {
                var historyEntry = loaner["history"][i];
                var innerAccord = "";
                var date = new Date(historyEntry["dateReleased"]);
                var dateRelText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
                date = new Date(historyEntry["dateReceived"]);
                var dateReceText = String(date.getMonth() + 1).padStart(2, '0') + "/" + String(date.getDate()).padStart(2, '0') + "/" + date.getFullYear();
                innerAccord += "<div class=\"settings-history-who-started\">" + getPill(config.employees[historyEntry["whoStarted"]]["name"], historyEntry["whoStarted"], "", "") + "</div>";
                innerAccord += "<div class=\"settings-history-ref\"><a href='javascript:void(0)' onclick='clickRefNum(" + historyEntry["refNum"] + ")'>" + historyEntry["refNum"] + "</a></div>";
                innerAccord += "<div class=\"settings-history-value-released\">" + historyEntry["valueReleased"] + "</div>";
                innerAccord += "<div class=\"settings-history-valueReceived\">" + historyEntry["valueReceived"] + "</div>";
                innerAccord += "<div class=\"settings-history-conditionReleased\">" + historyEntry["conditionReleased"] + "</div>";
                innerAccord += "<div class=\"settings-history-conditionReceived\">" + historyEntry["conditionReceived"] + "</div>";
                innerAccord += "<div class=\"settings-history-dateReleased\">" + dateRelText + "</div>";
                innerAccord += "<div class=\"settings-history-dateReceived\">" + dateReceText + "</div>";
                accordionBodyText += "<li class=\"list-group-item settings-loaner-line\">" + innerAccord + "</li>";
                // <ul class="list-group list-group-flush">
                //     <li class="list-group-item">An item</li>
                //     <li class="list-group-item">A second item</li>
                //     <li class="list-group-item">A third item</li>
                //     <li class="list-group-item">A fourth item</li>
                //     <li class="list-group-item">And a fifth one</li>
                // </ul>
            }
        }
        else {
            accordionBodyText = "No History.";
        }

        var accordionBodyEnd = "</div>";
        var accordionInsideEnd = "</div>";
        var accordionItemEnd = "</div>";
        var accordionHTML = accordionItem + header + accordionButton + headerEnd + accordionInside + accordionBody + accordionBodyText + accordionBodyEnd + accordionInsideEnd + accordionItemEnd;
        $("#accordionLoaners").append(accordionHTML);

    }
}

function setupSettingsUsers(config) {
    $("#usersSettingsData").empty();
    for (var employee in config.employees) {
        var innerHTML = "<div class=\"settings-employee-label\">" + employee + "</div>";

        var smallEm = employee.replace(/\./g, "");
        // console.log(smallEm);
        var pill = getPill(config.employees[employee]["name"], employee, "settings-pill-" + smallEm, "");

        innerHTML += "<div class=\"settings-employee-name\">" + pill + "</div>";

        var checkManager = "<div class=\"form-check\" onclick=\"determineIfUsersChanged()\"><input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"settings-employee-" + smallEm + "-check-manager\" " + (config.employees[employee].manager ? "checked" : "") + "><label class=\"form-check-label\" for=\"settings-employee-" + employee + "-check-manager\">Manager</label></div>";
        innerHTML += "<div class=\"settings-employee-is-manager\">" + checkManager + "</div>";

        var checkRepairTeam = "<div class=\"form-check\" onclick=\"determineIfUsersChanged()\"><input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"settings-employee-" + smallEm + "-check-repair\" " + (config.employees[employee].repairTeam ? "checked" : "") + "><label class=\"form-check-label\" for=\"settings-employee-" + employee + "-check-repair\">Repair Team</label></div>";
        innerHTML += "<div class=\"settings-employee-is-repair\">" + checkRepairTeam + "</div>";

        var checkActive = "<div class=\"form-check\" onclick=\"determineIfUsersChanged()\"><input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"settings-employee-" + smallEm + "-check-active\" " + (config.employees[employee].active ? "checked" : "") + "><label class=\"form-check-label\" for=\"settings-employee-" + employee + "-check-active\">Active</label></div>";
        innerHTML += "<div class=\"settings-employee-is-active\">" + checkActive + "</div>";

        var colorPicker = "<input type=\"color\" class=\"form-control form-control-color form-control-color-custom\" id=\"settings-employee-" + smallEm + "-color\" value=\"" + config.employees[employee]["color"] + "\" title=\"Choose your color\" oninput=\"applyPillColor('" + smallEm + "')\">";
        innerHTML += "<div class=\"settings-employee-color\">" + colorPicker + "</div>";

        var blackText = "<div class=\"form-check\" onclick=\"changedBlackText('" + smallEm + "')\"><input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"settings-employee-" + smallEm + "-check-black\" " + (config.employees[employee]["black-text"] ? "checked" : "") + "><label class=\"form-check-label\" for=\"settings-employee-" + smallEm + "-check-black\">Black Text</label></div>";
        innerHTML += "<div class=\"settings-employee-is-black-text\">" + blackText + "</div>";

        var userHTML = "<li class=\"list-group-item settings-employee-line\">" + innerHTML + "</li>";
        $("#usersSettingsData").append(userHTML);
    }
}

function determineIfUsersChanged() {
    var changed = false;
    for (var employee in config.employees) {
        var employeeConfig = config.employees[employee];
        var smallEm = employee.replace(/\./g, "");
        changed = changed || (employeeConfig["manager"] ? true : false) != $("#settings-employee-" + smallEm + "-check-manager").is(":checked");
        changed = changed || (employeeConfig["repairTeam"] ? true : false) != $("#settings-employee-" + smallEm + "-check-repair").is(":checked");
        changed = changed || (employeeConfig["active"] ? true : false) != $("#settings-employee-" + smallEm + "-check-active").is(":checked");
        changed = changed || (employeeConfig["black-text"] ? true : false) != $("#settings-employee-" + smallEm + "-check-black").is(":checked");
    }
    if (changed) {
        addingANewEmployee = false;
        changedSomething();
    }
    else {
        notChangedSomething();
    }
}

function revertChanges() {
    $("#usersSettingsData").empty();
    setupSettingsUsers(config);
    notChangedSomething();
}

function changedSomething() {
    const myToastEl = document.getElementById('unsavedToast');
    const myToast = bootstrap.Toast.getOrCreateInstance(myToastEl);
    if (!myToast.isShown()) {
        myToast.show();
    }
    $("#v-pills-back-tab").prop("disabled", true);
    blockProgress = true;
}
function notChangedSomething() {
    const myToastEl = document.getElementById('unsavedToast');
    const myToast = bootstrap.Toast.getOrCreateInstance(myToastEl);
    myToast.hide();
    $("#v-pills-back-tab").prop("disabled", false);
    blockProgress = false;
}
function confirmSaveConfig() {
    for (var employee in config.employees) {
        var smallEm = employee.replace(/\./g, "");
        config.employees[employee]["manager"] = $("#settings-employee-" + smallEm + "-check-manager").is(":checked");
        config.employees[employee]["repairTeam"] = $("#settings-employee-" + smallEm + "-check-repair").is(":checked");
        config.employees[employee]["active"] = $("#settings-employee-" + smallEm + "-check-active").is(":checked");
        config.employees[employee]["black-text"] = $("#settings-employee-" + smallEm + "-check-black").is(":checked");
        config.employees[employee]["color"] = document.getElementById("settings-employee-" + smallEm + "-color").value;
    }
    if (addingANewEmployee) {
        addingANewEmployee = false;
        var nameNumber = $("#addUserNameNumber").val();
        var commonName = $("#addUserName").val();
        var color = $("#addUserColor").val();
        var blackText = $("#addUserBlackText").val();
        config.employees[nameNumber] = {};
        config.employees[nameNumber]["name"] = commonName;
        config.employees[nameNumber]["color"] = color;
        config.employees[nameNumber]["black-text"] = blackText == "true";
        config.employees[nameNumber]["repairTeam"] = false;
        config.employees[nameNumber]["manager"] = false;
        config.employees[nameNumber]["active"] = true;
    }
    window.api.send("toMain", "saveConfig" + JSON.stringify(config));
    shownPanel = 5;
    $("#container").hide();
    $("#updatingMessage").fadeIn();
    const myToastEl = document.getElementById('unsavedToast');
    const myToast = bootstrap.Toast.getOrCreateInstance(myToastEl);
    myToast.hide();
    var modal = bootstrap.Modal.getOrCreateInstance('#saveConfirmModal');
    modal.hide();
}
function saveConfig() {
    var modal = bootstrap.Modal.getOrCreateInstance('#saveConfirmModal');
    modal.show();
}