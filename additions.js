/* ==========================================================
   DASHBOARD ADDITIONS (Milestone 4)

   Adds four features without changing script.js:
     1. Rank and growth cards          (Overview tab)
     2. "What explains trade value"    (Predictive Models tab)
     3. Neural network error by group  (Predictive Models tab)
     4. Leading U.S. port column and
        concentration finding          (Opportunities tab)

   Each feature checks that its HTML element exists before
   running, so any one of them can be removed from index.html
   on its own. To remove all of them, delete this file and its
   <script> tag in index.html.
   ========================================================== */

(function () {

    const BLUE = "#167c9b";
    const ORANGE = "#e58b35";
    const GREY = "#a8b7c7";

    const plotConfig = {
        responsive: true,
        displaylogo: false
    };

    async function loadJson(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error("Could not load " + path);
        }
        return response.json();
    }

    function ordinal(n) {
        const suffixes = { 1: "st", 2: "nd", 3: "rd" };
        const lastTwo = n % 100;
        if (lastTwo >= 11 && lastTwo <= 13) return n + "th";
        return n + (suffixes[n % 10] || "th");
    }

    function signedPercent(value) {
        const sign = value > 0 ? "+" : value < 0 ? "−" : "";
        return sign + Math.abs(value).toFixed(1) + "%";
    }

    function portName(port) {
        return port
            .replace(/^PT /, "PORT ")
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/ De$/, " DE")
            .replace(/ Nc$/, " NC")
            .replace(/ Pa$/, " PA")
            .replace(/ Tx$/, " TX")
            .replace(/ Fl$/, " FL");
    }


    /* ------------------------------------------------------
       1. RANK AND GROWTH CARDS
       ------------------------------------------------------ */

    async function addRankAndGrowthCards() {

        const growthEl = document.getElementById("add-growth-vs-market");
        const rankEl = document.getElementById("add-jax-rank");
        if (!growthEl && !rankEl) return;

        const [ports, quarterly] = await Promise.all([
            loadJson("data/jaxport_port_competition.json"),
            loadJson("data/jaxport_quarterly.json")
        ]);

        const years = [...new Set(ports.map(r => r.year))].sort();
        const latest = years[years.length - 1];
        const prior = years[years.length - 2];

        function rankIn(year) {
            const sorted = ports
                .filter(r => r.year === year)
                .sort((a, b) => b.teus - a.teus);
            return {
                rank: sorted.findIndex(r => r.us_port === "JACKSONVILLE") + 1,
                count: sorted.length
            };
        }

        function marketTotal(year) {
            return ports
                .filter(r => r.year === year)
                .reduce((sum, r) => sum + r.teus, 0);
        }

        function jaxTotal(year) {
            return quarterly
                .filter(r => r.year === year)
                .reduce((sum, r) => sum + r.teus, 0);
        }

        if (growthEl) {
            const jaxGrowth = (jaxTotal(latest) / jaxTotal(prior) - 1) * 100;
            const marketGrowth = (marketTotal(latest) / marketTotal(prior) - 1) * 100;

            growthEl.textContent =
                signedPercent(jaxGrowth) + " vs. " + signedPercent(marketGrowth);

            const note = document.getElementById("add-growth-note");
            if (note) {
                note.textContent =
                    `Jacksonville vs. all ${rankIn(latest).count} ports, ` +
                    `${prior} to ${latest}`;
            }
        }

        if (rankEl) {
            const now = rankIn(latest);
            const before = rankIn(prior);

            rankEl.textContent = ordinal(now.rank);

            const note = document.getElementById("add-rank-note");
            if (note) {
                note.textContent =
                    `Out of ${now.count} ports in ${latest} ` +
                    `(${ordinal(before.rank)} in ${prior})`;
            }
        }
    }


    /* ------------------------------------------------------
       2. WHAT EXPLAINS TRADE VALUE (R² BY MODEL STEP)
       ------------------------------------------------------ */

    async function addModelStepsChart() {

        if (!document.getElementById("add-model-steps-chart")) return;

        const steps = await loadJson("data/jaxport_model_steps.json");

        Plotly.newPlot("add-model-steps-chart", [{
            type: "bar",
            x: steps.map(s => s.step),
            y: steps.map(s => s.r_squared * 100),
            marker: {
                color: steps.map((s, i) =>
                    i === steps.length - 1 ? BLUE : GREY)
            },
            text: steps.map(s => (s.r_squared * 100).toFixed(2) + "%"),
            textposition: "outside",
            customdata: steps.map(s => s.predictors),
            hovertemplate:
                "%{x}<br>Predictors: %{customdata}" +
                "<br>Explained variation: %{y:.2f}%<extra></extra>"
        }], {
            title: { text: "Share of Trade Value Variation Explained (R²)" },
            xaxis: { title: { text: "Regression Model" } },
            yaxis: {
                title: { text: "Explained Variation (%)" },
                range: [0, 100]
            },
            margin: { t: 70, b: 70, l: 75, r: 25 },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        }, plotConfig);
    }


    /* ------------------------------------------------------
       3. NEURAL NETWORK ERROR BY GROUP
       ------------------------------------------------------ */

    async function addErrorByGroupChart() {

        if (!document.getElementById("add-error-group-chart")) return;

        const groups = await loadJson("data/jaxport_error_by_group.json");

        const colors = { jacksonville: BLUE, overall: GREY, flagged: ORANGE };

        Plotly.newPlot("add-error-group-chart", [{
            type: "bar",
            orientation: "h",
            y: groups.map(g => g.group),
            x: groups.map(g => g.mae),
            marker: { color: groups.map(g => colors[g.type] || GREY) },
            text: groups.map(g => g.mae.toFixed(2)),
            textposition: "outside",
            hovertemplate:
                "%{y}<br>Mean absolute error: %{x:.4f}<extra></extra>"
        }], {
            title: { text: "Neural Network Prediction Error, 2025 Test Data" },
            xaxis: {
                title: { text: "Mean Absolute Error (Natural Log Scale)" },
                rangemode: "tozero"
            },
            yaxis: { autorange: "reversed", automargin: true },
            margin: { t: 70, b: 70, l: 20, r: 40 },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        }, plotConfig);
    }


    /* ------------------------------------------------------
       4. LEADING U.S. PORT COLUMN AND CONCENTRATION FINDING
       ------------------------------------------------------ */

    async function addLeadingPortColumn() {

        const header = document.getElementById("add-top-port-header");
        const tableBody = document.getElementById("lanes-results-body");
        if (!header || !tableBody) return;

        const lanes = await loadJson("data/jaxport_lane_top_ports.json");

        const lookup = new Map(lanes.map(r => [
            `${r.foreign_initial_country}|${String(r.hs2).padStart(2, "0")}|${r.direction}`,
            r
        ]));

        // script.js rebuilds the table rows whenever a filter
        // changes, so the new cell is added to each new row.
        function fillRows() {
            tableBody.querySelectorAll("tr").forEach(tr => {

                if (tr.querySelector("td.add-top-port")) return;

                const cells = tr.querySelectorAll("td");
                if (cells.length < 3) return;

                const country = cells[0].textContent.trim();
                const hs2 = cells[1].textContent.replace("HS", "").trim();
                const direction =
                    cells[2].textContent.trim() === "Imports" ? "I" : "E";

                const lane = lookup.get(`${country}|${hs2}|${direction}`);

                const td = document.createElement("td");
                td.className = "add-top-port";

                if (lane) {
                    td.textContent =
                        `${portName(lane.top_port)} ` +
                        `(${lane.top_port_share_pct.toFixed(0)}%)`;

                    if (lane.top_port_share_pct > 50) {
                        td.classList.add("add-concentrated");
                        td.title = "More than half of this lane's 2025 volume " +
                            "moves through one port";
                    }
                } else {
                    td.textContent = "--";
                }

                tr.appendChild(td);
            });
        }

        new MutationObserver(fillRows)
            .observe(tableBody, { childList: true });

        fillRows();

        // Concentration finding, calculated across all lanes
        const finding = document.getElementById("add-concentration-finding");
        if (!finding) return;

        const total = lanes.length;
        const concentrated = lanes.filter(r => r.top_port_share_pct > 50).length;
        const spread = lanes.filter(r => r.top_port_share_pct < 30).length;

        const leaderCounts = {};
        lanes.forEach(r => {
            leaderCounts[r.top_port] = (leaderCounts[r.top_port] || 0) + 1;
        });
        const [topLeader, topLeaderCount] = Object.entries(leaderCounts)
            .sort((a, b) => b[1] - a[1])[0];

        finding.textContent =
            `Of the ${total} qualifying lanes, ${concentrated} have more ` +
            `than half of their 2025 volume at a single U.S. port, ` +
            `shown in orange in the table. ${portName(topLeader)} ` +
            `is the leading port for ${topLeaderCount} lanes. ` +
            `Concentrated lanes likely reflect established terminals, ` +
            `carrier services, or nearby industry and may be harder ` +
            `to attract. The ${spread} lanes where no single port ` +
            `handles more than 30% of volume may offer more realistic ` +
            `near-term targets for JAXPORT.`;
    }


    /* ------------------------------------------------------
       RUN ALL ADDITIONS
       Each runs independently, so one failing does not
       affect the others or the original dashboard.
       ------------------------------------------------------ */

    function runAll() {
        [
            addRankAndGrowthCards,
            addModelStepsChart,
            addErrorByGroupChart,
            addLeadingPortColumn
        ].forEach(feature => {
            feature().catch(error => {
                console.error("Dashboard addition failed:", error);
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runAll);
    } else {
        runAll();
    }

})();
