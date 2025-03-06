customElements.define(
    tagName(),
    class extends HTMLElement {
        MAX_ENTRIES = 10;

        // Taken from https://www.google.com/supported_domains August 2022
        GROUP_SOURCES = {
            "Google search": {
                match: [
                    "google.com",
                    "google.ad",
                    "google.ae",
                    "google.com.af",
                    "google.com.ag",
                    "google.com.ai",
                    "google.al",
                    "google.am",
                    "google.co.ao",
                    "google.com.ar",
                    "google.as",
                    "google.at",
                    "google.com.au",
                    "google.az",
                    "google.ba",
                    "google.com.bd",
                    "google.be",
                    "google.bf",
                    "google.bg",
                    "google.com.bh",
                    "google.bi",
                    "google.bj",
                    "google.com.bn",
                    "google.com.bo",
                    "google.com.br",
                    "google.bs",
                    "google.bt",
                    "google.co.bw",
                    "google.by",
                    "google.com.bz",
                    "google.ca",
                    "google.cd",
                    "google.cf",
                    "google.cg",
                    "google.ch",
                    "google.ci",
                    "google.co.ck",
                    "google.cl",
                    "google.cm",
                    "google.cn",
                    "google.com.co",
                    "google.co.cr",
                    "google.com.cu",
                    "google.cv",
                    "google.com.cy",
                    "google.cz",
                    "google.de",
                    "google.dj",
                    "google.dk",
                    "google.dm",
                    "google.com.do",
                    "google.dz",
                    "google.com.ec",
                    "google.ee",
                    "google.com.eg",
                    "google.es",
                    "google.com.et",
                    "google.fi",
                    "google.com.fj",
                    "google.fm",
                    "google.fr",
                    "google.ga",
                    "google.ge",
                    "google.gg",
                    "google.com.gh",
                    "google.com.gi",
                    "google.gl",
                    "google.gm",
                    "google.gr",
                    "google.com.gt",
                    "google.gy",
                    "google.com.hk",
                    "google.hn",
                    "google.hr",
                    "google.ht",
                    "google.hu",
                    "google.co.id",
                    "google.ie",
                    "google.co.il",
                    "google.im",
                    "google.co.in",
                    "google.iq",
                    "google.is",
                    "google.it",
                    "google.je",
                    "google.com.jm",
                    "google.jo",
                    "google.co.jp",
                    "google.co.ke",
                    "google.com.kh",
                    "google.ki",
                    "google.kg",
                    "google.co.kr",
                    "google.com.kw",
                    "google.kz",
                    "google.la",
                    "google.com.lb",
                    "google.li",
                    "google.lk",
                    "google.co.ls",
                    "google.lt",
                    "google.lu",
                    "google.lv",
                    "google.com.ly",
                    "google.co.ma",
                    "google.md",
                    "google.me",
                    "google.mg",
                    "google.mk",
                    "google.ml",
                    "google.com.mm",
                    "google.mn",
                    "google.ms",
                    "google.com.mt",
                    "google.mu",
                    "google.mv",
                    "google.mw",
                    "google.com.mx",
                    "google.com.my",
                    "google.co.mz",
                    "google.com.na",
                    "google.com.ng",
                    "google.com.ni",
                    "google.ne",
                    "google.nl",
                    "google.no",
                    "google.com.np",
                    "google.nr",
                    "google.nu",
                    "google.co.nz",
                    "google.com.om",
                    "google.com.pa",
                    "google.com.pe",
                    "google.com.pg",
                    "google.com.ph",
                    "google.com.pk",
                    "google.pl",
                    "google.pn",
                    "google.com.pr",
                    "google.ps",
                    "google.pt",
                    "google.com.py",
                    "google.com.qa",
                    "google.ro",
                    "google.ru",
                    "google.rw",
                    "google.com.sa",
                    "google.com.sb",
                    "google.sc",
                    "google.se",
                    "google.com.sg",
                    "google.sh",
                    "google.si",
                    "google.sk",
                    "google.com.sl",
                    "google.sn",
                    "google.so",
                    "google.sm",
                    "google.sr",
                    "google.st",
                    "google.com.sv",
                    "google.td",
                    "google.tg",
                    "google.co.th",
                    "google.com.tj",
                    "google.tl",
                    "google.tm",
                    "google.tn",
                    "google.to",
                    "google.com.tr",
                    "google.tt",
                    "google.com.tw",
                    "google.co.tz",
                    "google.com.ua",
                    "google.co.ug",
                    "google.co.uk",
                    "google.com.uy",
                    "google.co.uz",
                    "google.com.vc",
                    "google.co.ve",
                    "google.vg",
                    "google.co.vi",
                    "google.com.vn",
                    "google.vu",
                    "google.ws",
                    "google.rs",
                    "google.co.za",
                    "google.co.zm",
                    "google.co.zw",
                    "google.cat",
                    "com.google.android.googlequicksearchbox",
                ],
                link: "google.com",
                icon: "google.com",
            },
            "Google ads": {
                match: [
                    "doubleclick.net",
                    ".doubleclick.net",
                    ".googlesyndication.com",
                    "cse.google.com",
                ],
                link: "marketingplatform.google.com",
                icon: "google.com",
            },
            "Google Gmail": {
                match: [
                    "com.google.android.gm",
                    "mail.google.com",
                ],
                link: "mail.google.com",
                icon: "mail.google.com",
            },
            Twitter: {
                match: [
                    "t.co",
                    "com.twitter.android",
                    ".twitter.com",
                    "twitter.com",
                ],
                link: "twitter.com",
                icon: "twitter.com",
            },
            Facebook: {
                match: ["facebook.com", ".facebook.com"],
                link: "facebook.com",
                icon: "facebook.com",
            },
            Instagram: {
                match: ["instagram.com", ".instagram.com"],
                link: "instagram.com",
                icon: "instagram.com",
            },
            "Yahoo search": {
                match: [".search.yahoo.com"],
                link: "yahoo.com",
                icon: "yahoo.com",
            },
            Wikipedia: {
                match: ["wikipedia.org", ".wikipedia.org"],
                link: "wikipedia.org",
                icon: "wikipedia.org",
            },
            Bing: {
                match: ["bing.com", ".bing.com"],
                link: "bing.com",
                icon: "bing.com",
            },
            Reddit: {
                match: [
                    "reddit.com",
                    ".reddit.com",
                    "com.laurencedawson.reddit_sync",
                    "com.laurencedawson.reddit_sync.pro",
                    "com.andrewshu.android.reddit",
                    "amp-reddit-com.cdn.ampproject.org",
                ],
                link: "reddit.com",
                icon: "reddit.com",
            },
            Pinterest: {
                match: [
                    "com.pinterest",
                    "pinterest.com",
                    ".pinterest.com",
                    "pinterest.at",
                    "pinterest.ca",
                    "pinterest.ch",
                    "pinterest.cl",
                    "pinterest.co.kr",
                    "pinterest.co.uk",
                    "pinterest.com",
                    "pinterest.com.au",
                    "pinterest.com.mx",
                    "pinterest.de",
                    "pinterest.dk",
                    "pinterest.es",
                    "pinterest.fr",
                    "pinterest.ie",
                    "pinterest.it",
                    "pinterest.jp",
                    "pinterest.net",
                    "pinterest.nz",
                    "pinterest.ph",
                    "pinterest.pt",
                    "pinterest.ru",
                    "pinterest.se",
                    "www.pinterest.at",
                    "www.pinterest.ca",
                    "www.pinterest.ch",
                    "www.pinterest.cl",
                    "www.pinterest.co.kr",
                    "www.pinterest.co.uk",
                    "www.pinterest.com",
                    "www.pinterest.com.au",
                    "www.pinterest.com.mx",
                    "www.pinterest.de",
                    "www.pinterest.dk",
                    "www.pinterest.es",
                    "www.pinterest.fr",
                    "www.pinterest.ie",
                    "www.pinterest.it",
                    "www.pinterest.jp",
                    "www.pinterest.net",
                    "www.pinterest.nz",
                    "www.pinterest.ph",
                    "www.pinterest.pt",
                    "www.pinterest.ru",
                    "www.pinterest.se",
                ],

                link: "pinterest.com",
                icon: "pinterest.com",
            },
        };

        drawItemSources(ref, count, totalCount) {
            let item = this.groupItems[ref];

            // hack
            if (item === undefined) {
                return "";
            }

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
                      item.icon
                  )}.ico"
                  width="16"
                  height="16"
                  alt="">
                <a href="//${escapeHtml(
                    item.link
                )}" class="black" target="_blank" rel="nofollow">
                ${escapeHtml(item.group)}
                </a>
              </span>
              <span>
                <dashboard-number class="strong mr16">${escapeHtml(
                    count
                )}</dashboard-number>
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
                <img src="/img/famfamfam_flags/gif/${escapeHtml(
                    countryCode
                )}.gif" width="16" height="11" alt="${escapeHtml(countryCode)}">
                ${escapeHtml(this.getCountryName(countryCode.toUpperCase()))}
              </span>
              <span>
                <dashboard-number class="strong mr16">${escapeHtml(
                    count
                )}</dashboard-number>
                <span class="item-percent bg-blue blue caption">${escapeHtml(
                    percentRepr(count, totalCount)
                )}</span>
              </span>
            </div>
          </div>`;
        }

        isGroupMatch(groupMeta, ref) {
            let matched;
            for (const m of groupMeta.match) {
                if (m.startsWith(".")) {
                    matched = ref.endsWith(m);
                } else {
                    matched = ref == m;
                }
                if (matched) {
                    return true;
                }
            }
            return false;
        }

        groupItem(ref) {
            if (ref.startsWith("www.")) {
                ref = ref.slice(4);
            }
            let item = {
                group: ref,
                link: ref,
                icon: ref,
            };

            for (const groupName in this.GROUP_SOURCES) {
                let groupMeta = this.GROUP_SOURCES[groupName];
                if (this.isGroupMatch(groupMeta, ref)) {
                    item = {
                        group: groupName,
                        link: groupMeta.link,
                        icon: groupMeta.icon,
                    };
                }
            }
            return item;
        }

        draw(sources, countries) {
            // prepare sources

            // Group similar looking sources (e.G. www.example.com and
            // example.com)
            let parentThis = this;
            let groupedSources = { link: null, icon: null };
            let groupItems = {};
            Object.keys(sources).forEach(function (ref) {
                let refVisits = sources[ref];
                let groupItem = parentThis.groupItem(ref);
                groupItems[groupItem.group] = groupItem;
                groupedSources[groupItem.group] =
                    groupedSources[groupItem.group] || 0;
                groupedSources[groupItem.group] += refVisits;
            });

            this.groupItems = groupItems;

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
                      <img src="/img/sources.svg" width="24" height="24" alt="Sources" />
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
                            src="/img/chevron-right.svg"
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
                        src="/img/countries.svg"
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
                            src="/img/chevron-right.svg"
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
                    <img src="/img/sources.svg" width="24" height="24" alt="Sources" />
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
                    <img src="/img/countries.svg" width="24" height="24" alt="Countries" />
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
