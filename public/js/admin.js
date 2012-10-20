$(function () {
    "use strict";


    /*
    ********************************
    User management frontend actions
    ********************************
    */


    var users = $('#users'),
        userlist = $('#userlist'),
        settings = $('#settings'),
        adduser = $('#adduser'),
        changeotheruser = $('#changeotheruser'),
        csrf = $('#csrf'),
        username = $('#newusername'),
        password = $('#newuserpass'),
        passwordconf = $('#newuserpassconf');
    


    adduser.dialog({
        autoOpen: false,
        height: 375,
        width: 360,         
        show: "fade",
        hide: "fade",
        modal: true,
        buttons: {
            "Create user": function() {
                var adminval = false;
                if ($('#adminuser').is(':checked')) {
                    adminval = true;
                }
                $.post('/adduser',
                    {
                        username: newappname.val(),
                        password: newappdomain.val(),
                        passwordconf: newapprepo.val(),
                        rw: adminval,
                        _csrf: csrf.val()
                    }, 
                    function (results) {
                        addapp.dialog('close');
                        loadDrones();
                });
            },
            Cancel: function() {
                $(this).dialog('close');
            }
        }
    });


    changeotheruser.dialog({
        autoOpen: false,
        height: 330,
        width: 360,
        modal: true,
        show: "fade",
        hide: "fade",
        buttons: {
            "Apply": function() {
                console.log(changeduser.text());
            },
            Cancel: function() {
                $(this).dialog('close');
            }
        }
    });


    userlist.dialog({
        autoOpen: false,
        height: 450,
        width: 600,         
        show: "fade",
        hide: "fade",
        buttons: {
            "New user": function() {
                adduser.dialog('open');
            },
            Cancel: function() {
                $(this).dialog('close');
            }
        }
    });


    users.button({
        icons: {
            primary: "ui-icon-person"
        }
    }).click(function () {
        settings.dialog('close');
        userlist.text('');
        $.getJSON('/users', function (jsondata) {
            var useritem = '<p class="userlisttoprow"><span class="userlistuser">username</span><span class="userlistadmin">admin</span><span class="userlistlastlogin">last login</span><span class="userlistchange"></p>\n',
                json, i; 
            for (i = 0; i < jsondata.length; i += 1) {
                json = jsondata[i];
                useritem += '<p class="userlistrow"><span class="userlistuser">' + json.user + '</span><span class="userlistadmin" id="' + json.user + 'rw">' + json.rw + '</span><span class="userlistlastlogin">' + moment(json.lastlogin).fromNow() + '</span><button class="userlistchange" value="' + json.user + '">change password</button></p>\n';
                if (i === (jsondata.length - 1)) {
                    userlist.append(useritem);
                    userlist.find(':button').button({
                        icons: {   
                            primary: "ui-icon-gear"
                        },
                        text: false
                    }).click(function () {
                        var user = $(this).val().toString();
                        $('#ui-id-5').html('<h2>' + user + '</h2>');
                        if ($('#' + user + 'rw').text() === 'true') {
                            $('input[name=makeadmin]').attr('checked', true);
                        }
                        changeotheruser.dialog('open');
                        return false;
                    });
                    $('#ui-id-6').html('<h2>Users</h2>');
                    userlist.dialog('open');
                } 
            };
        });
        return false;
    });

});
