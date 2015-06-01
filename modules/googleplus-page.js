var page = require('webpage').create();
var system = require('system');

page.settings.loadImages = false;

/* About pageID
pageID is the longest number in your URL. For example:
  Page: https://plus.google.com/u/0/b/116050578720985641399/+ViGLugOrg/posts
  pageID: 116050578720985641399
*/
if (system.args.length !== 5) {
  console.log("Usage: "+system.args[0]+" username password pageID 'message'");
  phantom.exit();
}

/* https://github.com/ariya/phantomjs/blob/master/examples/waitfor.js */
/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

function customFilter(key, value) {
    /* Helper function in order to select textareas and buttons */
    divs = document.getElementsByTagName('div');
    for (i = 0; i < divs.length; i++) {
        el = divs[i];
        if (el.hasAttribute(key)) {
            if (el.getAttribute(key) === value) {
                return el;
            }
        }
    }
}

function doLogin() {
    /* Login seems to work most of the time */
    page.evaluate(function(username) {
        document.getElementById('Email').value = username;
        document.getElementById('next').click();
    }, system.args[1]);
    waitFor(function() {
        return page.evaluate(function () {
            return document.getElementById('Passwd');
        });
    }, function () {
        page.evaluate(function (password) {
            document.getElementById('Passwd').value = password;
            document.getElementById('signIn').click();
        }, system.args[2]);
    });
}

function doUpdateStatus() {
    page.evaluate(function (message, customFilter) {
        customFilter('guidedhelpid', 'sharebox_textarea').click();
        customFilter('role', 'textbox').click(); // focus
        customFilter('role', 'textbox').innerHTML = message;
    }, system.args[4], customFilter);
    // CTRL+ALT+A as dummy eveny, in order to activate the sharebutton
    page.sendEvent('keypress', page.event.key.A, null, null, 0x04000000);
    // waitFor could be used instead of timeouts
    setTimeout(function () {
        page.evaluate(function (customFilter) {
            customFilter('guidedhelpid', 'sharebutton').click();
        }, customFilter);
        setTimeout(function() {
            phantom.state = "status-updated";
            page.onLoadFinished("success"); // forced
        }, 5000);
    }, 1000);
}

var timer;

page.onLoadFinished = function (status) {
    console.log((!phantom.state ? "no-state" : phantom.state)+": "+status);
    if (status === "success") {
        if (!phantom.state) {
            doLogin();
            phantom.state = "login";
        } else if (phantom.state === "login") {
            phantom.state = "logged-in";
        } else if (phantom.state === "logged-in") {
            page.open('https://plus.google.com/b/'+system.args[3]);
            phantom.state = "page-loaded";
            /* A good output seems to be:
            page-loaded: success
            page-loaded: success
            page-loaded: failed
            page-loaded: success
            page-loaded: success
            */
        } else if (phantom.state === "page-loaded") {
            // timer is set in order to wait 10'' before the last event
            clearTimeout(timer);
            timer = setTimeout(doUpdateStatus, 10000);
        } else if (phantom.state === "status-updated") {
            phantom.exit();
        }
    } else {
        // ignores
    }
};

page.onConsoleMessage = function (message) {
    console.log("msg: "+message);
};

page.open("https://plus.google.com/");

