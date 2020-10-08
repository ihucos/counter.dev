customElements.define(tagName(),
    class extends HTMLElement {

        consumes = ['country']


        draw(countries) {
            this.innerHTML = "<div><h5>World map</h5></div>"
            var el = this.children[0]

            //jQuery(el).remove()
            jQuery(el).vectorMap({
                map: 'world_en',
                backgroundColor: '#fff',
                color: '#ffffff',
                hoverOpacity: 0.7,
                selectedColor: null,
                enableZoom: false,
                showTooltip: true,
                borderOpacity: 0.8,
                color: '#eee',
                values: countries,
                scaleColors: ['#73B4F3', '#0457A8'],
                normalizeFunction: 'polynomial',
                onLabelShow: function(event, label, region) {
                    label[0].innerHTML += (
                        '&nbsp;<img title="' + escapeHtml(region) +
                        '" src="/famfamfam_flags/gif/' +
                        escapeHtml(region) +
                        '.gif"></img> </br>' +
                        (countries[region] || "0") +
                        " Visits")
                }
            });
        }

    })
