from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseBadRequest
from django.contrib.auth import authenticate, login as do_login


def login(request):
    user_id = request.POST.get("user")
    password_input = request.POST.get("password")
    if not user_id:
        return HttpResponseBadRequest("Missing input: user")
    if not password_input:
        return HttpResponseBadRequest("Missing input: password")
    user = authenticate(request, username=user_id, password=password_input)
    if user is None:
        return HttpResponseBadRequest("Invalid credentials")
    else:
        do_login(request, user)
        return HttpResponse(status=204)


# def register(request):
#     return HttpResponse(status=204)
