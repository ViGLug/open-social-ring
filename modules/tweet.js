var page = require('webpage').create();
var system = require('system');

page.settings.loadImages = false;

if (system.args.length !== 4) {
  console.log("Usage: "+system.args[0]+" username password 'message'");
  phantom.exit();
}

function doLogin() {
    page.evaluate(function(username, password) {
        document.getElementById('session[username_or_email]').value = username;
        document.getElementById('session[password]').value = password;
        document.getElementsByTagName('input')[6].click();
    }, system.args[1], system.args[2]);
}

function doUpdateStatus() {
    page.evaluate(function(message) {
        document.getElementsByTagName('textarea')[0].value = message;
        document.getElementsByTagName('input')[2].click();
    }, system.args[3]);
}

page.onLoadFinished = function (status){
    console.log((!phantom.state ? "no-state" : phantom.state)+": "+status);
    if (status === "success") {
        if (!phantom.state) {
            doLogin();
            phantom.state = "logged-in";
        } else if (phantom.state === "logged-in") {
            page.open('https://mobile.twitter.com/compose/tweet');
            phantom.state = "compose";
        } else if (phantom.state === "compose") {
            doUpdateStatus();
            phantom.state = "status-updated";
        } else if (phantom.state === "status-updated") {
            phantom.exit();
        }
    } else {
        phantom.exit();
    }
};

page.onConsoleMessage = function (message) {
    console.log("msg: "+message);
};

page.open("https://mobile.twitter.com/session/new");

