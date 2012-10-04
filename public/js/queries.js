	function droneJson(drone) {
		var dronestatus = $('#dronestatus'),
	    	navtitle = $('#navtitle'),
	    	buttonvalue = $('.controlbutton'),
	    	jsonDrone, i;
		dronestatus.dialog("open");
		$('#ui-dialog-title-dronestatus').html('<h2 id="navtitle">' + drone + '</h2>');
		$.getJSON('/drones/' + drone, function (jsondata) {
			for (i = 0; i < jsondata.drones.length; i += 1) {
				jsonDrone = jsondata.drones[i];
				dronestatus.append(
					'<ul><p>Drone # ' + (i + 1) + '</p>'
				    	+ '<li>started: ' + moment(jsonDrone.ctime).format('DD/MM/YYYY - HH:mm') + '</li>'
						+ '<li>running dir: ' + jsonDrone.cwd + '</li>'
			        	+ '<li>env: ' + jsonDrone.env + '</li>'
			        	+ '<li>forever pid: ' + jsonDrone.foreverPid + '</li>'
			        	+ '<li>host: ' + jsonDrone.host + '</li>'
			        	+ '<li>pid: ' + jsonDrone.pid + '</li>'
			        	+ '<li>PORT: ' + jsonDrone.port + '</li></ul>'
				);
				if (jsondata.drones.length > 1) {
					dronestatus.append('<hr>');
				}
			};
		});
	};

	var clickDrone = function (element) {
    	var drone = element.id,
        dronestatus = $('#dronestatus');
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

	var doDrone = function (drone, action) {
		var actionStr = action.toString(),
	    status = $('#navstatus'), i, port;
		$.post('/drones/' + drone.id + '/' + actionStr + '/', JSON.stringify({ actionStr : { "name" : drone.id }}), function (res) {
			for (i = 0; i < res.length; i += 1) {
				if (res[i].port) {
					port = res[i].port;
					status.append('<p><span id="PORT' + port + '"> Drone OK on PORT: ' + port + ' </span></p>').fadeIn(500, function () {	
						$('#PORT' + port).delay(1000 * (i += 1) + 5000).fadeOut(5000, function() {
							$(this).parent().html('');
						});
					});
					if (res[i].ctime) {
						$('#' + drone.id).find('.dronestarted').fadeOut(300, function () {
							$(this).text(moment(Date.now()).fromNow()).fadeIn(300);
						});
					}
				} else {
					status.fadeIn(200).append('<span>NOT OK!' + res[0] + '</span>').delay(10000).fadeOut(3000);
				}
			};
			status.fadeOut(5000, function() {
				$(this).html('');
			});
		});
	};

	
$(function () {
	var main = $('#main'),
		bg = $('#bg'),
	    status = $('#statusmessage'),
	    drones = $('#drones'),
	    dronelist = $('li.drone'),
	    navi = $('#nav'),
	    navistatus = $('#navstatus'),
	    dronestatus = $('#dronestatus'),	    
	    settings = $('#settings'),
	    refreshall = $('#refreshall'),
	    auto = $('#autorefresh'),	    
	    refreshstatus = $('#refreshstatus'),
	    addbutton = $('#addbutton'),
	    adduser = $('#adduser'),
	    setbutton = $('#setbutton'),
	    users = $("#users"),
	    getTime = Date.now(),
	    autorefresh = false;

	loadDrones();
	statusCheckTime(Date.now());
	drones.sortable();
	drones.disableSelection();
	drones.fadeIn(1000);
	navi.fadeIn(500);
	refreshstatus.hide();

	function statusCheckTime (time) {
		navistatus.text('last checked: ' + moment(time).fromNow()).fadeIn(500, function() {
			$(this).delay(7000).fadeOut(1500, function () {
				$(this).text('');
			});
		});
	};
	
	function loadDrones() {
			drones.html('').fadeIn(500);
		    $.getJSON('/drones', function (jsondata) {
		    	getTime = Date.now();
			   	$.each(jsondata.drones, function (drone, data) {
				   	var droneCount = data.drones.length, i;
				   	drones.append('<li style="display: none" class="drone" id="' + drone + '"><a class="dronelink" href="#" onClick="clickDrone(' + drone + '); return false;">' + drone + '</a><div class="dronecount" id="dc' + drone + '">' + droneCount + '<span class="tooltip">Drones running</span></div></li>');
				    var droneEl = $('#' + drone);
					droneEl.append('<aside class="asidecontrol" id="aside' + drone + '"></aside>')
					    .append('<p> ')
						.find('#aside' + drone)
						.append('<button class="dronebutton" onClick="doDrone(' + drone + ', \'restart\'); return false;">restart</button>'
							+ '<button class="dronebutton" onClick="doDrone(' + drone + ', \'start\'); return false;">start</button>'
							+ '<button class="dronebutton" onClick="doDrone(' + drone + ', \'stop\'); return false;">stop</button>'
							+ '<button class="dronebutton" onClick="doDrone(' + drone + ', \'delete\'); return false;">delete</button>'
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
					droneEl.append('<p id="' + data.app.domain + '"><span class="key">domain: </span>: <span class="value">' + data.app.domain + '</span></p>');
					for (i = 0; i < data.drones.length; i += 1) {
						droneEl.append(
							'<p class="dronenumber">Drone number ' + (i + 1) + '</p>'
							+ '<p><span class="key">started</span>: <span class="value dronestarted">' + moment(data.drones[i].ctime).fromNow() + '</span></p>'
							+ '<p><span class="key">PORT</span>: <span class="value">' + data.drones[i].port + '</span></p>'
						);
					};
				});
		    $('li.drone').each(function(index) {
		       	$(this).delay(100*index).fadeIn(500);
		    });
		});
	};

	status.text('Loading').fadeOut(1000, function () {
		$(this).text('');
	});

	dronestatus.dialog({
		autoOpen: false,
		width: 600,
		height: 460,
		show: "drop",
		hide: "fade",
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
			},
			close: function() {
				allFields.val( "" ).removeClass( "ui-state-error" );
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

	drones.mousedown(function () {
	    $(this).toggleClass('grabbing');
	}).mouseup(function(){
		if ($(this).hasClass('grabbing')) {
		    $(this).toggleClass('grabbing');
		}
	});

	setInterval(function () {
		if (autorefresh === false) {
	    	statusCheckTime(getTime);
		}
	}, 120000);
		
	setInterval(function () {
		if (autorefresh === true) {
			loadDrones();
			getTime = Date.now();
			setTimeout(function () {
				statusCheckTime(getTime);
			}, 30000);
		}
	}, 60000);

});
