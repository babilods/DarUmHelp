from django.conf import settings
from django.http import FileResponse, Http404


def index(request):
    index_path = settings.FRONT_DIR / "index.html"
    return FileResponse(open(index_path, "rb"), content_type="text/html")


def asset(request, path):
    file_path = (settings.FRONT_DIR / path).resolve()

    if settings.FRONT_DIR not in file_path.parents or not file_path.is_file():
        raise Http404

    return FileResponse(open(file_path, "rb"))
