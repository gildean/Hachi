$(function () {
    "use strict";



    /*
    ********************************
    init vars
    ********************************
    */


    var main = $('#main'),
        bg = $('#bg'),
        newappname = $('#newappname'),
        newappdomain = $('#newappdomain'),
        newapprepo = $('#newapprepo'),
        newapplocation = $('#newapplocation'),
        newappscripts = $('#newappscripts'),
        newappform = $('#newappform'),
        csrf = $('#csrf'),
        status = $('#statusmessage'),
        drones = $('#drones'),
        offlineDrones = $('#offlinedrones'),
        dronelist = $('li.drone'),
        dronebutton = $('.dronebutton'),
        dronemain = $('#dronemain'),
        navi = $('#nav'),
        navistatus = $('#navstatus'),
        dronestatus = $('#dronestatus'),
        dronestatuscontent = $('#dronestatuscontent'),
        settings = $('#settings'),
        password = $('#password'),
        passwordconf = $('#passwordconf'),
        refreshAll = $('#refreshall'),
        auto = $('#autorefresh'),
        refreshstatus = $('#refreshstatus'),
        addapp = $('#addapp'),
        addbutton = $('#addbutton'),
        sortEm = $('#sortembutton'),
        navtitle = $('#navtitle'),
        buttonvalue = $('.controlbutton'),
        settingsBut = $('#setbutton'),
        users = $('#users'),
        getTime = Date.now(),
        autorefresh = false,
        dronesDrag = false;



    /*
    *********************************************
    A runtime prototype to add the drones to view
    *********************************************
    */


    function DroneItem(json) {
        var droneItem = '',
            drone = json.name.toString(),
            online = json.online,
            droneEl;
        if (online !== false) {
            droneItem = '<li style="display: none" class="drone fadedrone" id="' + drone + '">\n'
                      + '  <a class="dronelink" href="#">' + drone + '</a>\n'
                      + '  <div class="dronecount" id="dc' + drone + '">' + json.running + '<span class="tooltip">Drones running</span></div>\n'
                      + '  <aside class="asidecontrol" id="aside' + drone + '">\n'
                      + '    <button class="droneactionbutton dronebutton" value="' + drone + '">restart</button>\n'
                      + '    <button class="droneactionbutton dronebutton" value="' + drone + '">start</button>\n'
                      + '    <button class="droneactionbutton dronebutton" value="' + drone + '">stop</button>\n  </aside>\n'
                      + '  <p><span class="key">Started</span>: <span class="value dronestarted">' + moment(online).fromNow() + '</span></p>'
                      + '  <p id="' + json.domain + 'domain"><span class="key">Domain</span>: <span class="value">' + json.domain + '</span></p>\n</li>\n';
            drones.append(droneItem);
            droneEl = $('#' + drone);
            droneEl.find('button:first')
                    .button({
                        icons: {
                            primary: "ui-icon-arrowrefresh-1-e"
                        },
                        text: false
                    }).next().button({
                        icons: {
                            primary: "ui-icon-play"
                        },
                        text: false
                    }).next().button({
                        icons: {
                            primary: "ui-icon-cancel"
                        },
                        text: false
                    });
        } else {
            droneItem = '<li style="display: none" class="offlinedrone fadedrone" id="' + drone + '">\n'
                      + '  <a class="dronelink" href="#">' + drone + '</a>\n'
                      + '  <button class="droneactionbutton offlinedronebutton right" value="' + drone + '">start</button>\n'
                      + '  <button class="droneactionbutton offlinedronebutton right" value="' + drone + '">delete</button></li>\n';
            offlineDrones.append(droneItem);
            droneEl = $('#' + drone);
            droneEl.find('button:first')
                    .button({
                        icons: {
                            primary: "ui-icon-lightbulb"
                        },
                        text: false
                    }).next().button({
                        icons: {
                            primary: "ui-icon-trash"
                        },
                        text: false
                    });
        }
    };



    /*
    *******************************************
    Function to get drone details to the dialog
    *******************************************
    */

    
    var droneJson = function (drone) {
        var dialogTitle = $('#ui-id-2'),
            online = drone.online,
            drone = drone.name,
            droneHtml = '',
            jsonDrone, repo, key, i;
        dronestatuscontent.fadeOut(200, function() {
            $(this).text('').toggleClass('hidden');
            dronestatus.dialog('open');
            dialogTitle.html('<h2 id="navtitle">' + drone + '</h2>');
            $.getJSON('/drone/' + drone, function (jsondata) {
                if (online) {
                    for (i = 0; i < jsondata.drones.length; i += 1) {
                        jsonDrone = jsondata.drones[i];
                        droneHtml += '<ul>\n  <p>Drone # ' + (i + 1) + '</p>\n'
                            + '  <li>started: ' + moment(jsonDrone.ctime).format('DD/MM/YYYY - HH:mm') + '</li>\n'
                            + '  <li>running dir: ' + jsonDrone.cwd + '</li>\n'
                            + '  <li>env: ' + jsonDrone.env + '</li>\n'
                            + '  <li>forever pid: ' + jsonDrone.foreverPid + '</li>\n'
                            + '  <li>host: ' + jsonDrone.host + '</li>\n'
                            + '  <li>pid: ' + jsonDrone.pid + '</li>\n'
                            + '  <li>PORT: ' + jsonDrone.port + '</li>\n</ul>\n';
                        if (jsondata.drones.length > 1) {
                            droneHtml += '<hr>';
                        }
                        if (i === (jsondata.drones.length - 1)) {
                            dronestatuscontent.append(droneHtml).fadeIn(300, function () {
                                $(this).toggleClass('hidden');
                            }); 
                        }
                    };
                } else {
                    repo = jsondata.repository;
                    droneHtml += '<ul>\n  <p>Drone offline</p>\n'
                               + '  <li>name: ' + jsondata.name + '</li>'
                               + '  <li>domain: ' + jsondata.domain + '</li>';
                    for (key in repo) {
                        droneHtml += '  <li>' + key + ': ' + repo[key] + '</li>\n';
                    };
                    dronestatuscontent.append(droneHtml + '</ul>\n').fadeIn(300, function () {
                        $(this).toggleClass('hidden');
                    });
                }
            });
        });
    },



    /*
    *******************************************************************
    This is the action function that relays the commands to the backend
    *******************************************************************
    */


    doDrone = function (drone, action) {
        var obj = {},
            droneTime;
        obj._csrf = csrf.val();
        obj[action] = { name : drone };
        $.post('/drone/' + drone + '/' + action, obj, function (res) {
            if (action === 'stop' || action === 'delete') {
                $('#' + drone).fadeOut(500, function () {
                    $(this).remove();
                });
            } else if (action === 'update') {
                loadDrones();
            } else if (action === 'start' || action === 'restart') {
                if (res.isArray && res[0].ctime) {
                    droneTime = res[0].ctime;
                } else if (res.drone && res.drone.ctime) {
                    droneTime = res.drone.ctime;
                } else if (res.ctime) {
                    droneTime = res.ctime;
                }
                if (action === 'start') {
                    $('#' + drone).find('.dronecount').fadeOut(300, function () {
                        $(this).text(parseInt($(this).text()) + 1).fadeIn(300);
                    });
                }
                $('#' + drone).find('.dronestarted').fadeOut(300, function () {
                    $(this).text(moment(droneTime).fromNow()).fadeIn(300);
                });
            }
            navistatus.append('<p id="' + action + 'ed' + drone + '">' + action + 'ed ' + drone + ' OK</p>').fadeIn(300).delay(5000).fadeOut(1500, function () {
                $(this).find('#' + action + 'ed' + drone).remove();
            });
        });
    },



    /*
    **********************************************
    Function to reload all the drones on the view
    **********************************************
    */


    loadDrones = function () {
        drones.html('').fadeIn(500);
        offlineDrones.html('').fadeIn(500);
        $.getJSON('/drones', function (jsonArr) {
            var json, i;
            for (i = 0; i < jsonArr.length; i += 1) {
                json = jsonArr[i];
                new DroneItem(json);
                if (i === (jsonArr.length -1)) {
                    checkIfDragOrSort();
                    getTime = Date.now();
                    statusCheckTime(getTime);
                    $('li.fadedrone').each(function(index) {
                        $(this).delay(100*index).fadeIn(300);
                    });
                }  
            };
        });
    },



    /*
    ********************************
    small helper functions
    ********************************
    */


    statusCheckTime = function (time) {
        navistatus.append('<p id="lastcheck' + time + '">last checked: ' + moment(time).fromNow() + '</p>').fadeIn(500).delay(7000).fadeOut(1500, function () {
            $(this).find('#lastcheck' + time).remove();    
        });
    },


    checkIfDragOrSort = function () {
        if (dronesDrag === false) {
            if (drones.hasClass('ui-sortable')) {
                return;
            } else {
                if ($('li.drone').hasClass('ui-draggable')) {
                    $('li.drone').draggable('destroy');
                }
                drones.sortable().disableSelection();
                if (drones.hasClass('fullscreen')) {
                    drones.toggleClass('fullscreen');
                }
            }
        } else {
            if (drones.hasClass('ui-sortable')) {
                drones.sortable('destroy').toggleClass('fullscreen');
            }
            $('li.drone').draggable(); 
        }
    };



    /*
    *************************************************
    load something up already
    *************************************************
    */


    navi.fadeIn(500);
    refreshstatus.hide();
    status.text('Loading').fadeOut(1000, function () {
        $(this).text('');
    });
    loadDrones();
    offlineDrones.sortable().disableSelection();



    /*
    ********************************
    jQuery-ui dialogs
    ********************************
    */


    addapp.dialog({
        autoOpen: false,
        width: 600,
        height: 500,
        show: "fade",
        hide: "fade",
        buttons: {
            "Add app": function() {
                $(this).find('input').attr('disabled', true);
                $.post('/drone/' + newappname.val() + '/start',
                    {
                        name: newappname.val(),
                        domain: newappdomain.val(),
                        repo: newapprepo.val(),
                        location: newapplocation.val(),
                        scripts: newappscripts.val(),
                        _csrf: csrf.val()
                    }, 
                    function (results) {
                        $(this).find('input').attr('disabled', false);
                        addapp.dialog('close');
                        loadDrones();
                });
            },
            Cancel: function() {                
                $(this).dialog('close');
            }
        }
    });


    dronestatus.dialog({
        autoOpen: false,
        width: 600,
        height: 360,
        show: "fade",
        hide: "fade"
    });


    settings.dialog({
        autoOpen: false,
        height: 310,
        width: 300,         
        show: "fade",
        hide: "fade",
        buttons: {
            "change": function() {
                $.post('/password',
                    {
                        password: password.val(),
                        passwordconf: passwordconf.val(),
                        _csrf: csrf.val()
                    }, 
                    function (results) {
                        settings.dialog('close');
                        loadDrones();
                });
            }
        }
    });
    


    /*
    ********************************
    The main buttons
    ********************************
    */
    

    addbutton.button({
        icons: {
            primary: "ui-icon-plusthick"
        },
        text: false
    }).click(function () {
        addapp.dialog("open");
        return false;
    });


    auto.button({
        icons: {
            primary: "ui-icon-clock"
        },
        text: false
    }).click(function () {
        if (autorefresh === true) {
            autorefresh = false;
            refreshstatus.fadeOut(500, function () {
                $(this).text('Autorefresh OFF').fadeIn(500).delay(5000).fadeOut(1500);
            });
            if ($(this).hasClass('active')) {
                $(this).toggleClass('active');
            }
        } else {
            autorefresh = true;
            refreshstatus.text('Autorefresh ON').fadeIn(500);
            getTime = Date.now();
            statusCheckTime(getTime);
            loadDrones();
            if (!($(this).hasClass('active'))) {
                $(this).toggleClass('active');
            }
        }
            return false;
    });


    settingsBut.button({
        icons: {
            primary: "ui-icon-wrench"
        },
        text: false
    }).click(function () {
        $('#ui-id-3').html('<h2>Settings</h2>');
        settings.dialog("open");
        return false;
    });


    sortEm.button({
        icons: {
            primary: "ui-icon-newwin"
        },
        text: false
    }).click(function () {
        if (dronesDrag === false) {
            $(this).button({
                icons: {
                    primary: "ui-icon-grip-dotted-horizontal"
                },
                text: false
            });
            dronesDrag = true;
        } else {
            $(this).button({
                icons: {
                    primary: "ui-icon-newwin"
                },
                text: false
            });             
            dronesDrag = false;
        }
        checkIfDragOrSort();
        return false;
    });


    refreshAll.button({
        icons: {
            primary: "ui-icon-refresh"
        },
        text: false
    }).click(function () {  
        loadDrones();
        return false;
    });


    drones.on('mousedown', 'li.drone', function () {
        $(this).toggleClass('grabbing');
    }).on('mouseup', 'li.drone', function () {
        if ($(this).hasClass('grabbing')) {
            $(this).toggleClass('grabbing');
        }
    });


    dronemain.on('click', 'button.droneactionbutton', function () {
        var action = $(this).text(),
            drone = $(this).val().toString();
        if (confirm('Is it ok to ' + action + ' drone named: ' + drone + ' (there is no undo)')) {
            doDrone(drone, action);
        };
        return false;
    });


    dronemain.on('click', 'a.dronelink', function () {
        var drone = {
            name: $(this).text(),
            online: true
        };
        droneJson(drone);
        return false;
    });


    /*
    ****************************************
    An interval function for autoreload etc.
    ****************************************
    */


    setInterval(function () {
        if (autorefresh === false) {
            statusCheckTime(getTime);
        } else {
            loadDrones();
            getTime = Date.now();
            setTimeout(function () {
                statusCheckTime(getTime);
            }, 60000);
        }
    }, 120000);

});
