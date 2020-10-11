orange = "#1e87f0"

palette = [
    orange,
    "hsl(28, 45%, 50%)",
    "hsl(118, 45%, 50%)",
    "hsl(298, 35%, 60%)",


]

// I don't completely get this one, but it is quite important
Chart.defaults.global.maintainAspectRatio = false

Chart.defaults.global.title.fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"';
Chart.defaults.global.title.fontColor = "rgba(0,0,0, 0.7)";
Chart.defaults.global.title.fontSize = 16
Chart.defaults.global.title.lineHeight = 1.2
Chart.defaults.global.title.padding = 10
Chart.defaults.global.layout = {
    padding: {
        left: 5,
        right: 5,
        top: 10,
        bottom: 10
    }
}

pieBorderColor = 'white'
pieBorderWidth = 1.2

Chart.defaults.global.defaultFontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"';

NO_DATA_TEXT = 'No data for selected time'
NO_DATA_FONT_SIZE = "12px"
NO_DATA_FONT_STYLE = "italic"
NO_DATA_FONT = Chart.defaults.global.defaultFontFamily
NO_DATA_HTML = '<div style="font-size: ' + NO_DATA_FONT_SIZE + ';margin-top: 5em; text-align: center; font-style: ' + NO_DATA_FONT_STYLE + ';">' + NO_DATA_TEXT + '</div>'




function drawTitle(user) {
    document.title = "Counter Analytics for " + user
}






function draw() {
    console.log("redrawing")

    pageOnly("page-graphs")
    document.getElementById("share-account").style.display = "block" // hacky

    drawTitle(user)

}

function drawSiteSelector(sitesHash, select) {
    var html = ""
    sites = Object.keys(sitesHash)
    sites.sort()
    for (let i in sites) {
        var site = sites[i]
        if (site === select) {
            html += "<option selected=selected value='" + escapeHtml(site) + "'>" + escapeHtml(site) + "</option>"
        } else {
            html += "<option value='" + escapeHtml(site) + "'>" + escapeHtml(site) + "</option>"
        }
    }
    document.getElementById("site-selector").innerHTML = html
}



Chart.plugins.register({
    afterDraw: function(chart) {
        if (chart.data.datasets[0].data.length === 0) {
            // No data is present
            ctx = chart.chart.ctx;
            var width = chart.chart.width;
            var height = chart.chart.height;
            chart.clear();
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = NO_DATA_FONT_STYLE + " " + NO_DATA_FONT_SIZE + " " + NO_DATA_FONT;
            ctx.fillText(NO_DATA_TEXT, width / 2, height / 2);
            ctx.restore();
        }
    }
});
