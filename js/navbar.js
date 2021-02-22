fetch('/authenticated', { method: 'POST' }).then(function(response) {
    response.text().then(function(res) {
        // hide login button if user logged in already, else hide dash
        console.log(res)
        if (res == "true") $("#login-btn").hide();
        else $("#dash-btn").hide();
    });
});