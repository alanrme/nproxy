$('#signup').on('click', function () {
    console.log('w')
    user = $('#username').val()
    password = $('#password').val()
    fetch('http://localhost/join',
        {
            method: 'POST',
            body: JSON.stringify({ username: user, password: password }),
            headers: { 'Content-Type': 'application/json' }
        }
    ).then(function(data) {
        alert(data)
    });
})