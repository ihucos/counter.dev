customElements.define(
    tagName(),
    class extends HTMLElement {
        MAX_ENTRIES = 10;

        drawItemSources(domain, count, totalCount) {
            return `
          <div class="sources-countries-item shadow-sm mb8">
            <div class="percent-line" style="width: ${percentRepr(
                count,
                totalCount
            )};"></div>
            <div class="sources-countries-item-wrap">
              <span>
                <img
                  src="https://icons.duckduckgo.com/ip3/${escapeHtml(
                      domain
                  )}.ico"
                  width="16"
                  height="16"
                  alt="${escapeHtml(domain)}">
                <a href="//${escapeHtml(
                    domain
                )}" class="black" target="_blank" rel="nofollow">
                ${escapeHtml(domain)}
                </a>
              </span>
              <span>
                <span class="strong mr16">${escapeHtml(count)}</span>
                <span class="item-percent bg-blue blue caption">${percentRepr(
                    count,
                    totalCount
                )}</span>
              </span>
            </div>
          </div>
          `;
        }

        drawItemCountries(countryCode, count, totalCount) {
            return `
          <div class="sources-countries-item shadow-sm mb8">
            <div class="percent-line" style="width: ${escapeHtml(
                percentRepr(count, totalCount)
            )};"></div>
            <div class="sources-countries-item-wrap">
              <span>
                <img src="/famfamfam_flags/gif/${escapeHtml(
                    countryCode
                )}.gif" width="16" height="11" alt="${escapeHtml(countryCode)}">
                ${escapeHtml(this.getCountryName(countryCode.toUpperCase()))}
              </span>
              <span>
                <span class="strong mr16">${escapeHtml(count)}</span>
                <span class="item-percent bg-blue blue caption">${escapeHtml(
                    percentRepr(count, totalCount)
                )}</span>
              </span>
            </div>
          </div>`;
        }

        refGroup(ref) {
            if (ref.startsWith("www.")) {
                ref = ref.slice(4);
            }
            return ref;
        }

        draw(sources, countries) {
            // prepare sources

            // Group similar looking sources (e.G. www.example.com and
            // example.com)
            let parentThis = this;
            let groupedSources = {};
            Object.keys(sources).forEach(function (ref) {
                let refVisits = sources[ref];
                let refGroup = parentThis.refGroup(ref);
                groupedSources[refGroup] = groupedSources[refGroup] || 0;
                groupedSources[refGroup] += refVisits;
            });

            this.allSourcesEntries = Object.entries(groupedSources).sort(
                (a, b) => b[1] - a[1]
            );
            this.sourcesEntries = this.allSourcesEntries.slice(
                0,
                this.MAX_ENTRIES
            );
            this.sourcesTotalCount = Object.values(groupedSources).reduce(
                (acc, next) => acc + next,
                0
            );

            // prepare countries
            this.allCountriesEntries = Object.entries(countries).sort(
                (a, b) => b[1] - a[1]
            );
            this.countriesEntries = this.allCountriesEntries.slice(
                0,
                this.MAX_ENTRIES
            );
            this.countriesTotalCount = Object.values(countries).reduce(
                (acc, next) => acc + next,
                0
            );

            this.innerHTML = `
                <div class="content radius-lg responsive-tabs">
                  <!-- Mobile tabs -->
                  <ul class="responsive-tabs-menu bg-white shadow-sm">
                    <li>
                      <a href="#sources"
                        ><svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="#9E9E9E"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M16.2398 7.76001L14.1198 14.12L7.75977 16.24L9.87977 9.88001L16.2398 7.76001Z"
                            stroke="#9E9E9E"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          /></svg
                      ></a>
                    </li>
                    <li>
                      <a href="#countries"
                        ><svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="#9E9E9E"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M2 12H22"
                            stroke="#9E9E9E"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z"
                            stroke="#9E9E9E"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          /></svg
                      ></a>
                    </li>
                  </ul>
                  <!-- Sources -->
                  <div class="sources" id="sources">
                    <div class="metrics-headline">
                      <img src="img/sources.svg" width="24" height="24" alt="Sources" />
                      <h3 class="ml16">Sources</h3>
                    </div>
                    <div class="sources-countries-data caption gray bg-gray mt16 mb24">
                      <span>Source</span>
                      <span>Visits</span>
                    </div>
                    <!-- Items -->
                    ${this.sourcesEntries
                        .map((item) =>
                            this.drawItemSources(
                                item[0],
                                item[1],
                                this.sourcesTotalCount
                            )
                        )
                        .join("")}
                    ${
                        this.sourcesEntries.length === 0
                            ? "<dashboard-nodata></dashboard-nodata>"
                            : ""
                    }
                    ${
                        this.allSourcesEntries.length > this.MAX_ENTRIES
                            ? `
                        <!-- View all -->
                        <a
                          href="#modal-sources"
                          class="sources-countries-item sources-countries-item-wrap view-all shadow-sm"
                          rel="modal:open"
                        >
                          <span>
                            <div class="view-all-icon animation"></div>
                            <span class="black strong view-all-text animation">View all</span>
                          </span>
                          <img
                            src="img/chevron-right.svg"
                            width="24"
                            height="24"
                            alt="Chevron"
                          />
                        </a>`
                            : ""
                    }
                    <!-- /// -->
                  </div>
                  <!-- Countries -->
                  <div class="countries" id="countries">
                    <div class="metrics-headline">
                      <img
                        src="img/countries.svg"
                        width="24"
                        height="24"
                        alt="Countries"
                      />
                      <h3 class="ml16">Countries</h3>
                    </div>
                    <div class="sources-countries-data caption gray bg-gray mt16 mb24">
                      <span>Country</span>
                      <span>Visits</span>
                    </div>
                    <!-- Items -->
                    ${this.countriesEntries
                        .map((item) =>
                            this.drawItemCountries(
                                item[0],
                                item[1],
                                this.countriesTotalCount
                            )
                        )
                        .join("")}
                    ${
                        this.countriesEntries.length === 0
                            ? "<dashboard-nodata></dashboard-nodata>"
                            : ""
                    }
                    ${
                        this.allCountriesEntries.length > this.MAX_ENTRIES
                            ? `
                        <!-- View all -->
                        <a
                          href="#modal-countries"
                          class="sources-countries-item sources-countries-item-wrap view-all shadow-sm"
                          rel="modal:open"
                        >
                          <span>
                            <div class="view-all-icon animation"></div>
                            <span class="black strong view-all-text animation">View all</span>
                          </span>
                          <img
                            src="img/chevron-right.svg"
                            width="24"
                            height="24"
                            alt="Chevron"
                          />
                        </a>`
                            : ""
                    }
                    <!-- /// -->
                  </div>
                </div>
                ${this.drawModals()}`;

            // HOTFIX: This component gets loaded after enabling tabslet for all
            // other elements
            if (window.matchMedia("(max-width: 1110px)").matches) {
                $(".responsive-tabs", this).tabslet();
            }
        }

        drawModals() {
            return `
                <!-- Sources modal -->
                <div id="modal-sources" style="display: none">
                  <div class="modal-header">
                    <img src="img/sources.svg" width="24" height="24" alt="Sources" />
                    <h3 class="ml16">Sources</h3>
                    <a href="#" class="btn-close" rel="modal:close"></a>
                  </div>
                  <div class="modal-content">
                    <!-- Items -->
                    ${this.allSourcesEntries
                        .map((item) =>
                            this.drawItemSources(
                                item[0],
                                item[1],
                                this.sourcesTotalCount
                            )
                        )
                        .join("")}
                    <!-- /// -->
                  </div>
                </div>
                <!-- Countries modal -->
                <div id="modal-countries" style="display: none">
                  <div class="modal-header">
                    <img src="img/countries.svg" width="24" height="24" alt="Countries" />
                    <h3 class="ml16">Countries</h3>
                    <a href="#" class="btn-close" rel="modal:close"></a>
                  </div>
                  <div class="modal-content">
                    <!-- Items -->
                    ${this.allCountriesEntries
                        .map((item) =>
                            this.drawItemCountries(
                                item[0],
                                item[1],
                                this.countriesTotalCount
                            )
                        )
                        .join("")}
                    <!-- /// -->
                  </div>
                </div>`;
        }

        getCountryName(countryCode) {
            if (this.COUNTRIES.hasOwnProperty(countryCode)) {
                return this.COUNTRIES[countryCode];
            } else {
                return countryCode;
            }
        }

        COUNTRIES = {
            // not a country but we it as input
            XX: "Unknown",
            T1: "Tor network",

            AF: "Afghanistan",
            AX: "Aland Islands",
            AL: "Albania",
            DZ: "Algeria",
            AS: "American Samoa",
            AD: "Andorra",
            AO: "Angola",
            AI: "Anguilla",
            AQ: "Antarctica",
            AG: "Antigua And Barbuda",
            AR: "Argentina",
            AM: "Armenia",
            AW: "Aruba",
            AU: "Australia",
            AT: "Austria",
            AZ: "Azerbaijan",
            BS: "Bahamas",
            BH: "Bahrain",
            BD: "Bangladesh",
            BB: "Barbados",
            BY: "Belarus",
            BE: "Belgium",
            BZ: "Belize",
            BJ: "Benin",
            BM: "Bermuda",
            BT: "Bhutan",
            BO: "Bolivia",
            BA: "Bosnia And Herzegovina",
            BW: "Botswana",
            BV: "Bouvet Island",
            BR: "Brazil",
            IO: "British Indian Ocean Territory",
            BN: "Brunei Darussalam",
            BG: "Bulgaria",
            BF: "Burkina Faso",
            BI: "Burundi",
            KH: "Cambodia",
            CM: "Cameroon",
            CA: "Canada",
            CV: "Cape Verde",
            KY: "Cayman Islands",
            CF: "Central African Republic",
            TD: "Chad",
            CL: "Chile",
            CN: "China",
            CX: "Christmas Island",
            CC: "Cocos (Keeling) Islands",
            CO: "Colombia",
            KM: "Comoros",
            CG: "Congo",
            CD: "Congo, Democratic Republic",
            CK: "Cook Islands",
            CR: "Costa Rica",
            CI: "Cote D'Ivoire",
            HR: "Croatia",
            CU: "Cuba",
            CY: "Cyprus",
            CZ: "Czech Republic",
            DK: "Denmark",
            DJ: "Djibouti",
            DM: "Dominica",
            DO: "Dominican Republic",
            EC: "Ecuador",
            EG: "Egypt",
            SV: "El Salvador",
            GQ: "Equatorial Guinea",
            ER: "Eritrea",
            EE: "Estonia",
            ET: "Ethiopia",
            FK: "Falkland Islands (Malvinas)",
            FO: "Faroe Islands",
            FJ: "Fiji",
            FI: "Finland",
            FR: "France",
            GF: "French Guiana",
            PF: "French Polynesia",
            TF: "French Southern Territories",
            GA: "Gabon",
            GM: "Gambia",
            GE: "Georgia",
            DE: "Germany",
            GH: "Ghana",
            GI: "Gibraltar",
            GR: "Greece",
            GL: "Greenland",
            GD: "Grenada",
            GP: "Guadeloupe",
            GU: "Guam",
            GT: "Guatemala",
            GG: "Guernsey",
            GN: "Guinea",
            GW: "Guinea-Bissau",
            GY: "Guyana",
            HT: "Haiti",
            HM: "Heard Island & Mcdonald Islands",
            VA: "Holy See (Vatican City State)",
            HN: "Honduras",
            HK: "Hong Kong",
            HU: "Hungary",
            IS: "Iceland",
            IN: "India",
            ID: "Indonesia",
            IR: "Iran, Islamic Republic Of",
            IQ: "Iraq",
            IE: "Ireland",
            IM: "Isle Of Man",
            IL: "Israel",
            IT: "Italy",
            JM: "Jamaica",
            JP: "Japan",
            JE: "Jersey",
            JO: "Jordan",
            KZ: "Kazakhstan",
            KE: "Kenya",
            KI: "Kiribati",
            KR: "Korea",
            KW: "Kuwait",
            KG: "Kyrgyzstan",
            LA: "Lao People's Democratic Republic",
            LV: "Latvia",
            LB: "Lebanon",
            LS: "Lesotho",
            LR: "Liberia",
            LY: "Libyan Arab Jamahiriya",
            LI: "Liechtenstein",
            LT: "Lithuania",
            LU: "Luxembourg",
            MO: "Macao",
            MK: "Macedonia",
            MG: "Madagascar",
            MW: "Malawi",
            MY: "Malaysia",
            MV: "Maldives",
            ML: "Mali",
            MT: "Malta",
            MH: "Marshall Islands",
            MQ: "Martinique",
            MR: "Mauritania",
            MU: "Mauritius",
            YT: "Mayotte",
            MX: "Mexico",
            FM: "Micronesia, Federated States Of",
            MD: "Moldova",
            MC: "Monaco",
            MN: "Mongolia",
            ME: "Montenegro",
            MS: "Montserrat",
            MA: "Morocco",
            MZ: "Mozambique",
            MM: "Myanmar",
            NA: "Namibia",
            NR: "Nauru",
            NP: "Nepal",
            NL: "Netherlands",
            AN: "Netherlands Antilles",
            NC: "New Caledonia",
            NZ: "New Zealand",
            NI: "Nicaragua",
            NE: "Niger",
            NG: "Nigeria",
            NU: "Niue",
            NF: "Norfolk Island",
            MP: "Northern Mariana Islands",
            NO: "Norway",
            OM: "Oman",
            PK: "Pakistan",
            PW: "Palau",
            PS: "Palestinian Territory, Occupied",
            PA: "Panama",
            PG: "Papua New Guinea",
            PY: "Paraguay",
            PE: "Peru",
            PH: "Philippines",
            PN: "Pitcairn",
            PL: "Poland",
            PT: "Portugal",
            PR: "Puerto Rico",
            QA: "Qatar",
            RE: "Reunion",
            RO: "Romania",
            RU: "Russian Federation",
            RW: "Rwanda",
            BL: "Saint Barthelemy",
            SH: "Saint Helena",
            KN: "Saint Kitts And Nevis",
            LC: "Saint Lucia",
            MF: "Saint Martin",
            PM: "Saint Pierre And Miquelon",
            VC: "Saint Vincent And Grenadines",
            WS: "Samoa",
            SM: "San Marino",
            ST: "Sao Tome And Principe",
            SA: "Saudi Arabia",
            SN: "Senegal",
            RS: "Serbia",
            SC: "Seychelles",
            SL: "Sierra Leone",
            SG: "Singapore",
            SK: "Slovakia",
            SI: "Slovenia",
            SB: "Solomon Islands",
            SO: "Somalia",
            ZA: "South Africa",
            GS: "South Georgia And Sandwich Isl.",
            ES: "Spain",
            LK: "Sri Lanka",
            SD: "Sudan",
            SR: "Suriname",
            SJ: "Svalbard And Jan Mayen",
            SZ: "Swaziland",
            SE: "Sweden",
            CH: "Switzerland",
            SY: "Syrian Arab Republic",
            TW: "Taiwan",
            TJ: "Tajikistan",
            TZ: "Tanzania",
            TH: "Thailand",
            TL: "Timor-Leste",
            TG: "Togo",
            TK: "Tokelau",
            TO: "Tonga",
            TT: "Trinidad And Tobago",
            TN: "Tunisia",
            TR: "Turkey",
            TM: "Turkmenistan",
            TC: "Turks And Caicos Islands",
            TV: "Tuvalu",
            UG: "Uganda",
            UA: "Ukraine",
            AE: "United Arab Emirates",
            GB: "United Kingdom",
            US: "United States",
            UM: "United States Outlying Islands",
            UY: "Uruguay",
            UZ: "Uzbekistan",
            VU: "Vanuatu",
            VE: "Venezuela",
            VN: "Viet Nam",
            VG: "Virgin Islands, British",
            VI: "Virgin Islands, U.S.",
            WF: "Wallis And Futuna",
            EH: "Western Sahara",
            YE: "Yemen",
            ZM: "Zambia",
            ZW: "Zimbabwe",
        };
    }
);
