customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(siteData, siteName, timeRange, sessionless) {
            if (sessionless) {
                $(this).css("margin", "0");
            }
            this.innerHTML = `
                <a class="btn-secondary btn-icon" href="#">
                <img src="/img/download.svg" width="24" height="24" alt="Download"/>
                </a>`;

            this.querySelector("a").onclick = () =>
                this.downloadData(siteData, siteName, timeRange);
        }

        download(filename, text) {
            var element = document.createElement("a");
            element.setAttribute(
                "href",
                "data:text/plain;charset=utf-8," + encodeURIComponent(text)
            );
            element.setAttribute("download", filename);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        downloadData(siteData, siteName, timeRange) {
            // this function should be a component
            var csv = "dimension,type,count\n";
            Object.keys(siteData).forEach(function (namespace, _) {
                Object.keys(siteData[namespace]).forEach(function (key, _) {
                    var val = siteData[namespace][key];
                    csv += namespace + "," + (key + ",") + val + "\n";
                });
            });

            var today = new Date();
            var dateStr =
                today.getFullYear() +
                "-" +
                (today.getMonth() + 1) +
                "-" +
                today.getDate();
            this.download(
                `counter_stats_${timeRange}_${dateStr}_${siteName.replace(
                    ".",
                    "-"
                )}.csv`,
                csv
            );
        }
    }
);
