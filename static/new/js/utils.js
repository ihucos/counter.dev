function simpleForm(formSelector, redirectUrl){
    document.querySelector(formSelector).onsubmit = (evt)=>{
        var el = evt.target
        $.ajax({
            type: el.getAttribute('method') || 'POST',
            url: el.getAttribute('action'),
            data: $(el).serialize(),
            success: function(response) {
                window.location.href = redirectUrl
            },
            error: function (request, status, error) {
                alert(request.responseText);
            }
        });
        return false
    }
}
