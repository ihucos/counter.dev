var script = document.createElement("script");
script.dataset.id = "33671ad4-a966-4a52-b48f-56c92d10a678";
script.dataset.utcoffset = "1";
script.dataset.server = "https://simple-web-analytics.com";
script.src = "https://cdn.counter.dev/script-testing.js";
document.getElementsByTagName("head")[0].appendChild(script);


function simpleForm(formSelector, arg) {
    var success, formEl;
    if (typeof arg === "function") {
        success = arg;
    } else {
        success = (_response) => {
            window.location.href = arg;
        };
    }
    if (typeof formSelector === "string") {
        formEl = document.querySelector(formSelector);
    } else {
        formEl = formSelector;
    }

    formEl.onsubmit = (evt) => {
        var el = evt.target;
        $.ajax({
            type: el.getAttribute("method") || "POST",
            url: el.getAttribute("action"),
            data: $(el).serialize(),
            success: success,
            error: (request, _status, _errorr) => {
                notify(request.responseText);
            },
        });
        return false;
    };
}

function getUTCOffset() {
    return Math.round((-1 * new Date().getTimezoneOffset()) / 60);
}

function detectTimezone() {
    try {
        // Use Intl.DateTimeFormat to get IANA timezone
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
        // Fallback for older browsers - return null to use UTC offset
        return null;
    }
}

function getTimezoneInfo() {
    const timezone = detectTimezone();
    const utcOffset = getUTCOffset();

    return {
        timezone: timezone,
        utcOffset: utcOffset,
        hasTimezone: timezone !== null,
        // For backwards compatibility with existing code
        preferTimezone: timezone !== null
    };
}

function escapeHtml(unsafe) {
    return (`${unsafe}`)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}



function dispatchPushEvents(url, event_prefix) {
    var prefix = event_prefix || "push-";
    var source = new EventSource(url);
    source.onmessage = (event) => {
        const serverData = JSON.parse(event.data);
        document.dispatchEvent(
            new CustomEvent(prefix + serverData.type, {
                detail: serverData.payload,
            }),
        );
    };
    return source;
}

function notify(msg, _cb) {
    $("#modal-notify").remove();
    var html = `<div id="modal-notify" style="display: none;">
      <div class="modal-header">
        <a href="#" class="btn-close" rel="modal:close"></a>
      </div>
      <div class="modal-content">
        <span>
            ${escapeHtml(msg)}
        </span>
        <div class="mt24 mb32 flex">
          <a href="#" class="btn-primary" rel="modal:close">Okay</a>
        </div>
      </div>
    </div>`;
    $("body").append($(html));
    $("#modal-notify").modal({ closeExisting: false });
}


function whenReady(tag, cb) {
    customElements.whenDefined(tag).then(() => {
        var el = document.querySelector(tag);
        cb(el);
    });
}
