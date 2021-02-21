$("#signup").on('click', function () {
    console.log("w")
    user = $("#username").val()
    password = $("#password").val()
    $.post("join", {username: user, password: password}, function(data) {
        console.log("w2")
        alert(data)
    });
})