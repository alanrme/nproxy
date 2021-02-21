$('#signup').on('click', function () {
    user = $('#username').val()
    password = $('#password').val()
    fetch('/join',
        {
            method: 'POST',
            body: JSON.stringify({ username: user, password: password }),
            headers: { 'Content-Type': 'application/json' }
        }
    ).then(function(response) {
        response.text().then(function(json) {
            if (response.status >= 500) showError(JSON.parse(json).message)
        });
    });
})

$('#login').on('click', function () {
    user = $('#username').val()
    password = $('#password').val()
    fetch('/authenticate',
        {
            method: 'POST',
            body: JSON.stringify({ username: user, password: password }),
            headers: { 'Content-Type': 'application/json' }
        }
    ).then(function(response) {
        // if response is a redirect then change the browser url
        // cuz for some reason this thing doesn't follow redirect
        // responses by default
        if (response.redirected) {
            window.location.href = response.url;
        }
        response.text().then(function(json) {
            console.log(json)
            if (response.status >= 500) showError(JSON.parse(json).message)
        });
    });
})

$('input').change(function(){
    $(this).removeClass('error')
    $('#error-box').removeClass('show');
});

function showError(msg) {
    $('#error-box').html(msg).addClass('show');
    msg = msg.toLowerCase();
    input = null
    if (msg.includes("password")) input = $("#password")
    else if (msg.includes("user") || msg.includes("email")) input = $("#username")
    if (input) input.addClass('error')
}