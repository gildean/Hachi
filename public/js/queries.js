$(function () {
    var main = $('#main'),
        bg = $('#bg'),
        status = $('#statusmessage'),
        drones = $('#drones'),
        dronelist = $('li.drone'),
        dronebutton = $('.dronebutton'),
        navi = $('#nav'),
        navistatus = $('#navstatus'),
        dronestatus = $('#dronestatus'),        
        settings = $('#settings'),
        refreshall = $('#refreshall'),
        auto = $('#autorefresh'),       
        refreshstatus = $('#refreshstatus'),
        addapp = $('#addapp'),
        addbutton = $('#addbutton'),
        adduser = $('#adduser'),
        navtitle = $('#navtitle'),
        buttonvalue = $('.controlbutton'),
        setbutton = $('#setbutton'),
        users = $('#users'),
        getTime = Date.now(),
        autorefresh = false;

    // Function to get drone details to the dialog
    var droneJson = function (drone) {
        var jsonDrone,
            droneHtml = '',
            i;
        dronestatus.dialog("open");
        $('#ui-dialog-title-dronestatus').html('<h2 id="navtitle">' + drone + '</h2>');
        $.getJSON('/drones/' + drone, function (jsondata) {
            for (i = 0; i < jsondata.drones.length; i += 1) {
                jsonDrone = jsondata.drones[i];
                droneHtml += '<ul><p>Drone # ' + (i + 1) + '</p>'
                           + '<li>started: ' + moment(jsonDrone.ctime).format('DD/MM/YYYY - HH:mm') + '</li>'
                           + '<li>running dir: ' + jsonDrone.cwd + '</li>'
                           + '<li>env: ' + jsonDrone.env + '</li>'
                           + '<li>forever pid: ' + jsonDrone.foreverPid + '</li>'
                           + '<li>host: ' + jsonDrone.host + '</li>'
                           + '<li>pid: ' + jsonDrone.pid + '</li>'
                           + '<li>PORT: ' + jsonDrone.port + '</li></ul>';
                if (jsondata.drones.length > 1) {
                    droneHtml += '<hr>';
                }
                if ((jsondata.drones.length - 1) === i) {
                    dronestatus.append(droneHtml);
                }
            };
        });
    };

    // a little helper function to smooth out the reloads of the dialog
    var clickDrone = function (element) {
        var drone = element;
        if (dronestatus.hasClass('hidden')) {
            droneJson(drone);
            dronestatus.fadeIn(300, function () {
                $(this).toggleClass('hidden');
            });             
        } else {
            dronestatus.fadeOut(300, function() {
                $(this).text('').toggleClass('hidden');
                droneJson(drone);
                $(this).fadeIn(300).toggleClass('hidden');
            });
        }
    };

    //This is the main action function that relays the commands to the backend
    var doDrone = function (drone, action) {
        var i, port;
        $.post('/drones/' + drone + '/' + action + '/', JSON.stringify({ action : { "name" : drone }}), function (res) {
            navistatus.fadeOut(300).delay(300).text('')
            for (i = 0; i < res.length; i += 1) {
                if (res[i].port) {
                    port = res[i].port;
                    navistatus.append('<p><span id="PORT' + port + '"> Drone OK on PORT: ' + port + ' </span></p>').fadeIn(500, function () {   
                        $('#PORT' + port).fadeOut(5000, function() {
                            $(this).parent().html('');
                        });
                    });
                    if (res[i].ctime) {
                        $('#' + drone).find('.dronestarted').fadeOut(300, function () {
                            $(this).text(moment(Date.now()).fromNow()).fadeIn(300);
                        });
                    }
                } else {
                    navistatus.fadeIn(200).append('<span>NOT OK!' + res[0] + '</span>').delay(10000).fadeOut(3000);
                }
            };
            navistatus.fadeOut(5000, function() {
                $(this).html('');
            });
        });
    };

    // One big function to rule them all (or to reload all the drones on the view, whichever you prefer)
    var loadDrones = function () {
        drones.html('').fadeIn(500);
        $.getJSON('/drones', function (jsondata) {
            getTime = Date.now();
            $.each(jsondata.drones, function (drone, data) {
                var dronesHtml = '',
                    droneCount = data.drones.length, i;
                drones.append('<li style="display: none" class="drone" id="' + drone + '">'
                            + '<a class="dronelink" href="#">' + drone + '</a>'
                            + '<div class="dronecount" id="dc' + drone + '">' + droneCount 
                            + '<span class="tooltip">Drones running</span></div></li>');
                var droneEl = $('#' + drone);
                droneEl.append('<aside class="asidecontrol" id="aside' + drone + '"></aside>')
                    .find('#aside' + drone)
                    .append('<button class="dronebutton" value="' + drone + '">restart</button>'
                          + '<button class="dronebutton" value="' + drone + '">start</button>'
                          + '<button class="dronebutton" value="' + drone + '">stop</button>'
                          + '<button class="dronebutton" value="' + drone + '">delete</button>'
                        ).find('button:first')
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
                                primary: "ui-icon-stop"
                            },
                            text: false
                        }).next().button({
                            icons: {
                                primary: "ui-icon-closethick"
                            },
                            text: false
                        });
                    dronesHtml += '<p id="' + data.app.domain + '"><span class="key">Domain</span>: <span class="value">' + data.app.domain + '</span></p>';
                    for (i = 0; i < droneCount; i += 1) {
                        dronesHtml += '<p class="dronenumber">Drone number ' + (i + 1) + '</p>'
                                    + '<p><span class="key">Started</span>: <span class="value dronestarted">' + moment(data.drones[i].ctime).fromNow() + '</span></p>'
                                    + '<p><span class="key">PORT</span>: <span class="value">' + data.drones[i].port + '</span></p>'
                        if ((droneCount - 1 ) === i) {
                            droneEl.append(dronesHtml);
                        } 
                    };
                });
            $('li.drone').each(function(index) {
                $(this).delay(100*index).fadeIn(500);
            });
        });
    };
    var statusCheckTime = function (time) {
        navistatus.text('last checked: ' + moment(time).fromNow()).fadeIn(500, function() {
            $(this).delay(7000).fadeOut(1500, function () {
                $(this).text('');
            });
        });
    };

    // Things to run when the document is actually ready   
    drones.sortable();
    drones.disableSelection();
    drones.fadeIn(1000);
    navi.fadeIn(500);
    refreshstatus.hide();
    status.text('Loading').fadeOut(1000, function () {
        $(this).text('');
    });
    statusCheckTime(Date.now());
    loadDrones();


    //jQuery-ui dialogs
    addapp.dialog({
        autoOpen: false,
        width: 800,
        height: 600,
        show: "drop",
        hide: "fade"
    });


    dronestatus.dialog({
        autoOpen: false,
        width: 600,
        height: 460,
        show: "drop",
        hide: "fade"
    });

    adduser.dialog({
        autoOpen: false,
        height: 400,
        width: 450,         
        show: "drop",
        hide: "fade",
        modal: true,
        buttons: {
            "Create user": function() {
                users.append('<li>' + name.val() + '</li>'); 
                $( this ).dialog( "close" );
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        }
    });

    settings.dialog({
        autoOpen: false,
        height: 300,
        width: 200,         
        show: "drop",
        hide: "fade",
        buttons: {
            "New user": function() {
                adduser.dialog("open");
            }
        }
    });
    

    // The main buttons
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
            return false;
        } else {
            autorefresh = true;
            refreshstatus.text('Autorefresh ON').fadeIn(500);
            getTime = Date.now;
            statusCheckTime(getTime);
            loadDrones();
            if (!($(this).hasClass('active'))) {
                $(this).toggleClass('active');
            }
            return false;
        }
    });

    setbutton.button({
        icons: {
            primary: "ui-icon-wrench"
        },
        text: false
    }).click(function () {
        $('#ui-dialog-title-settings').html('<h2>Settings</h2>');
        settings.dialog("open");
        return false;
    });

    refreshall.button({
        icons: {
            primary: "ui-icon-refresh"
        },
        text: false
    }).click(function () {  
        loadDrones();
        getTime = Date.now;     
        statusCheckTime(getTime);
        return false;
    });

    drones.on('mousedown', 'li.drone', function () {
        $(this).toggleClass('grabbing');
    }).on('mouseup', 'li.drone', function () {
        if ($(this).hasClass('grabbing')) {
            $(this).toggleClass('grabbing');
        }
    });

    drones.on('click', 'button.dronebutton', function() {
        var action = $(this).text().toString(),
            drone = $(this).val().toString();
        doDrone(drone, action); 
        return false;
    });


    drones.on('click', 'a.dronelink', function() {
        var drone = $(this).text().toString();
        clickDrone(drone);
        return false;
    });

    //An interval function for autoreload etc.
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
