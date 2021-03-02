var source = new EventSource("/dump");
source.onmessage = (event) => {
    let dump = JSON.parse(event.data);
    console.log(dump);
    if (!dump) {
        window.location.href = "index.html";
    }
    if (Object.keys(dump.sites).length > 0) {
        window.location.href = "dashboard.html";
    }
};
