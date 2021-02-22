fetch('/listproxies',
{
    method: 'POST'
}
).then(function(response) {
    response.text().then(function(json) {
        result = JSON.parse(json)
        if (response.status >= 500) return showError(result.message)
        for (i in result) {
            $("#proxies").append(`
                <div class="card">
                    <button class="delete" data-subdomain="${result[i].subdomain}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <a href="dash/${i}">
                        <p>Proxy ${parseInt(i)+1}</p>
                        <p2>${result[i].ip}:${result[i].port} - ${result[i].subdomain}</p2>
                    </a>
                </div>
            `)
        }
    });
});

$('#add').on('click', function () {
    ip = $('#ip').val()
    port = $('#port').val()
    subdomain = $('#subdomain').val()
    fetch('/addproxy',
    {
        method: 'POST',
        body: JSON.stringify({ ip: ip, port: port, subdomain: subdomain }),
        headers: { 'Content-Type': 'application/json' }
    }
    ).then(function(response) {
        response.text().then(function(json) {
            if (response.status >= 500) return showError(JSON.parse(json).message)
            if (JSON.parse(json).message == "Success") location.reload();
        });
    });
})

$("button.delete").onclick = function(event) {
    event.stopPropagation(); // stop the button from inheriting parent's href
    subdomain = $(this).data("proxy-subdomain")
    fetch('/addproxy',
    {
        method: 'POST',
        body: JSON.stringify({ subdomain: subdomain }),
        headers: { 'Content-Type': 'application/json' }
    }
    ).then(function(response) {
        response.text().then(function(json) {
            if (response.status >= 500) return showError(JSON.parse(json).message)
            if (JSON.parse(json).message == "Success") location.reload();
        });
    });
};

$('input').change(function(){
    $('#error-box').removeClass('show');
});

function showError(msg) {
    $('#error-box').html(msg).addClass('show');
}