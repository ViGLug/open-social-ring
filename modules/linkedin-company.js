var page = require('webpage').create();
var system = require('system');

page.settings.loadImages = false;

if (system.args.length !== 5) {
  console.log("Usage: "+system.args[0]+" username password company 'message'");
  phantom.exit();
}

function doLogin() {
    page.evaluate(function(username, password) {
        document.getElementById('session_key-login').value = username;
        document.getElementById('session_password-login').value = password;
        document.getElementsByTagName('input')[7].click();
    }, system.args[1], system.args[2]);
}

function doUpdateStatus() {
    page.evaluate(function(message) {
        document.getElementById('postText-postModuleForm').value = message;
        document.getElementById('share-submit').click();
    }, system.args[4]);
    setTimeout(phantom.exit, 30000); // Workaround
}

page.onLoadFinished = function (status){
    console.log((!phantom.state ? "no-state" : phantom.state)+": "+status);
    if (status === "success") {
        if (!phantom.state) {
            doLogin();
            phantom.state = "logged-in";
        } else if (phantom.state === "logged-in") {
            page.open('https://www.linkedin.com/company/'+system.args[3]);
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

page.open("https://www.linkedin.com/uas/login");

