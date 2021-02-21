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
    fetch('/login',
        {
            method: 'POST',
            body: JSON.stringify({ username: user, password: password }),
            headers: { 'Content-Type': 'application/json' }
        }
    ).then(function(response) {
        response.text().then(function(json) {
            alert(json)
            if (response.status >= 500) showError(JSON.parse(json).message)
        });
    });
})

$('input').change(function(){
    $(this).removeClass('error')
    $('#error-box').removeClass('show');
});

function showError(msg) {
    msg = msg.toLowerCase();
    $('#error-box').html(msg).addClass('show');
    box = $("#password")
    if (msg.includes("user") || msg.includes("email")) box = $("#username")
    box.addClass('error')
}