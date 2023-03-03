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

function setupSettingsLoaners() {
    $("#accordionLoaners").empty();
    for (var tag in backendData["loaners"]) {
        var loaner = backendData["loaners"][tag];
        // var innerHTML = "<div class=\"settings-loaner-label\">" + tag + "</div>";
        // innerHTML += "<div class=\"settings-loaner-make-model\">" + loaner["make"] + " " + loaner["model"] + "</div>";
        // var lonaerHTML = "<li class=\"list-group-item settings-loaner-line\">" + innerHTML + "</li>";
        // $("#loanerSettingsData").append(lonaerHTML);
        var accordionItem = "<div class=\"accordion-item\">";
        var header = "<h2 class=\"accordion-header\" id=\"heading" + tag + "\">";
        var accordionButton = "<button class=\"accordion-button collapsed\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#collapse" + tag + "\" aria-expanded=\"false\" aria-controls=\"collapse" + tag + "\">" + loaner["make"] + " " + loaner["model"] + " : " + tag + "</button>";
        var headerEnd = "</h2>";
        var accordionInside = "<div id=\"collapse" + tag + "\" class=\"accordion-collapse collapse\" aria-labelledby=\"headingOne\" data-bs-parent=\"#accordion" + tag + "\">";
        var accordionBody = "<div class=\"accordion-body\">";
        var accordionBodyText = "Loaner Text";
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