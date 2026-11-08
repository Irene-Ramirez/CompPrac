console.log("JAXPORT JavaScript is running!");
async function loadDashboard() {
    const response = await fetch("data/jaxport_quarterly.json");

    if (!response.ok) {
        throw new Error("Unable to load JAXPORT data");
    }

    const data = await response.json();
    console.log("JAXPORT data loaded:", data);

    const yearFilter = document.getElementById("year-filter");

    const years = [...new Set(data.map(d => d.year))].sort();

    years.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    const totalAll = data.reduce(
        (sum, row) => sum + row.teus, 0
    );

    document.getElementById("total-teus").textContent =
        Math.round(totalAll).toLocaleString();

    function updateDashboard() {
        const selected = yearFilter.value;

        const filtered = selected === "all"
            ? data
            : data.filter(d => String(d.year) === selected);

        const labels = filtered.map(
            d => `${d.year} Q${d.quarter}`
        );

        const values = filtered.map(d => d.teus);

        const total = values.reduce((a, b) => a + b, 0);

        const peak = filtered.reduce(
            (best, row) => row.teus > best.teus ? row : best
        );

        document.getElementById("year-teus").textContent =
            Math.round(total).toLocaleString();

        document.getElementById("peak-quarter").textContent =
            `${peak.year} Q${peak.quarter}`;

        Plotly.react("teu-chart", [{
            x: labels,
            y: values,
            type: "scatter",
            mode: "lines+markers",
            line: {
                color: "#167c9b",
                width: 3
            },
            marker: {
                size: 8
            },
            hovertemplate:
                "%{x}<br>%{y:,.2f} TEUs<extra></extra>"
        }], {
            title: "Quarterly JAXPORT Container Volume",
            xaxis: { title: "Quarter" },
            yaxis: {
                title: "TEUs",
                range: [0, 45000],
                dtick: 5000
            },
            margin: { t: 60, b: 90, l: 65, r: 20 },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        }, {
            responsive: true,
            displaylogo: false
        });

        document.getElementById("finding-text").textContent =
            `For the selected period, the dataset records ` +
            `${total.toLocaleString(undefined, {
                maximumFractionDigits: 0
            })} TEUs. The highest-volume quarter was ` +
            `${peak.year} Q${peak.quarter}, with ` +
            `${peak.teus.toLocaleString(undefined, {
                maximumFractionDigits: 2
            })} TEUs.`;
    }

    yearFilter.addEventListener("change", updateDashboard);

    updateDashboard();
}

loadDashboard().catch(error => {
    console.error(error);
    document.getElementById("finding-text").textContent =
        "The dashboard data could not be loaded.";
});


async function loadTradeDirections() {
    const response = await fetch("data/jaxport_directions.json");

    if (!response.ok) {
        throw new Error("Unable to load trade direction data");
    }

    const data = await response.json();

    const yearFilter = document.getElementById("direction-year-filter");

    const years = [...new Set(data.map(row => row.year))].sort();

    years.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    // Fixed Y-axis for fair comparisons across years
    const maxQuarterlyTEUs = Math.max(
        ...Object.values(
            data.reduce((totals, row) => {
                const key = `${row.year}-Q${row.quarter}`;
                totals[key] = (totals[key] || 0) + row.teus;
                return totals;
            }, {})
        )
    );

    const yAxisMax = Math.ceil(maxQuarterlyTEUs / 5000) * 5000;

    function updateDirectionChart() {
        const selectedYear = yearFilter.value;

        const filtered = selectedYear === "all"
            ? data
            : data.filter(row => String(row.year) === selectedYear);

        const quarters = [...new Set(
            filtered.map(row => `${row.year} Q${row.quarter}`)
        )];

        const imports = quarters.map(quarter =>
            filtered
                .filter(row =>
                    `${row.year} Q${row.quarter}` === quarter &&
                    row.direction === "I"
                )
                .reduce((sum, row) => sum + row.teus, 0)
        );

        const exports = quarters.map(quarter =>
            filtered
                .filter(row =>
                    `${row.year} Q${row.quarter}` === quarter &&
                    row.direction === "E"
                )
                .reduce((sum, row) => sum + row.teus, 0)
        );

        Plotly.react("direction-chart", [
            {
                x: quarters,
                y: imports,
                name: "Imports",
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#167c9b", width: 3 },
                marker: { size: 8 },
                hovertemplate:
                    "%{x}<br>Imports: %{y:,.2f} TEUs<extra></extra>"
            },
            {
                x: quarters,
                y: exports,
                name: "Exports",
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#e58b35", width: 3 },
                marker: { size: 8 },
                hovertemplate:
                    "%{x}<br>Exports: %{y:,.2f} TEUs<extra></extra>"
            }
        ], {
            title: "Quarterly Import and Export Container Volume",
            xaxis: { title: "Quarter" },
            yaxis: {
                title: "TEUs",
                range: [0, yAxisMax],
                dtick: 5000
            },
            margin: { t: 60, b: 90, l: 65, r: 20 },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            legend: { orientation: "h", y: 1.15 }
        }, {
            responsive: true,
            displaylogo: false
        });

        const importTotal = imports.reduce((a, b) => a + b, 0);
        const exportTotal = exports.reduce((a, b) => a + b, 0);
        const combinedTotal = importTotal + exportTotal;

        const importShare = combinedTotal > 0
            ? (importTotal / combinedTotal * 100).toFixed(1)
            : "0.0";

        const leader = importTotal > exportTotal
            ? "imports"
            : exportTotal > importTotal
                ? "exports"
                : "neither direction";

        document.getElementById("direction-finding").textContent =
            `For the selected period, imports totaled ` +
            `${importTotal.toLocaleString(undefined, {maximumFractionDigits: 2})} TEUs ` +
            `and exports totaled ` +
            `${exportTotal.toLocaleString(undefined, {maximumFractionDigits: 2})} TEUs. ` +
            `Imports represented ${importShare}% of the combined volume, ` +
            `with ${leader} accounting for the larger share.`;
    }

    yearFilter.addEventListener("change", updateDirectionChart);
    updateDirectionChart();
}

loadTradeDirections().catch(error => {
    console.error(error);
    document.getElementById("direction-finding").textContent =
        "Trade direction data could not be loaded.";
});


async function loadCommodityAnalysis() {
    const response = await fetch("data/jaxport_commodities.json");

    if (!response.ok) {
        throw new Error("Unable to load commodity data");
    }

    const data = await response.json();

    const yearFilter = document.getElementById("commodity-year-filter");
    const directionFilter = document.getElementById("commodity-direction-filter");
    const finding = document.getElementById("commodity-finding");

    const years = [...new Set(data.map(row => Number(row.year)))]
        .sort((a, b) => a - b);

    years.forEach(year => {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    // Group commodity volumes by HS2 code for the selected filters.
    function updateCommodityChart() {
        const selectedYear = yearFilter.value;
        const selectedDirection = directionFilter.value;

        const filtered = data.filter(row => {
            const yearMatches = selectedYear === "all" ||
                String(row.year) === selectedYear;

            const directionMatches = selectedDirection === "all" ||
                row.direction === selectedDirection;

            return yearMatches && directionMatches;
        });

        const commodityTotals = new Map();

        filtered.forEach(row => {
            const code = String(row.hs2).padStart(2, "0");
            const description = row.hs2_description || "Unknown commodity";

            if (!commodityTotals.has(code)) {
                commodityTotals.set(code, {
                    code,
                    description,
                    teus: 0
                });
            }

            commodityTotals.get(code).teus += Number(row.teus) || 0;
        });

        const ranked = [...commodityTotals.values()]
            .sort((a, b) => b.teus - a.teus);

        const top10 = ranked.slice(0, 10);

        if (top10.length === 0) {
            Plotly.purge("commodity-chart");
            finding.textContent = "No commodity data for this selection.";
            return;
        }

        // Reverse so the largest commodity appears at the top.
        const chartData = [...top10].reverse();

        const labels = chartData.map(row =>
            `HS${row.code} - ${row.description.length > 35
                ? row.description.slice(0, 35) + "..."
                : row.description}`
        );

        const values = chartData.map(row => row.teus);

        Plotly.react("commodity-chart", [{
            type: "bar",
            orientation: "h",
            x: values,
            y: labels,
            marker: {
                color: "#167c9b"
            },
            customdata: chartData.map(row => row.description),
            hovertemplate:
                "%{customdata}<br>%{x:,.2f} TEUs<extra></extra>"
        }], {
            title: "Top 10 Commodity Groups by Container Volume",
            xaxis: {
                title: "TEUs",
                rangemode: "tozero"
            },
            yaxis: {
                automargin: true
            },
            margin: {
                t: 65,
                b: 70,
                l: 300,
                r: 25
            },
            height: 540,
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        }, {
            responsive: true,
            displaylogo: false
        });

        const totalTEUs = ranked.reduce(
            (sum, row) => sum + row.teus, 0
        );

        const leader = top10[0];

        const leaderShare = totalTEUs > 0
            ? (leader.teus / totalTEUs * 100).toFixed(1)
            : "0.0";

        const period = selectedYear === "all"
            ? "2021–2025"
            : selectedYear;

        const tradeType = selectedDirection === "I"
            ? "imports"
            : selectedDirection === "E"
                ? "exports"
                : "combined imports and exports";

        finding.textContent =
            `For ${period}, ${leader.description} (HS${leader.code}) ` +
            `was the leading commodity group for ${tradeType}, ` +
            `with ${leader.teus.toLocaleString(undefined, {
                maximumFractionDigits: 2
            })} TEUs. This represents ${leaderShare}% of the ` +
            `selected commodity volume.`;
    }

    yearFilter.addEventListener("change", updateCommodityChart);
    directionFilter.addEventListener("change", updateCommodityChart);

    updateCommodityChart();
}

loadCommodityAnalysis().catch(error => {
    console.error(error);

    const finding = document.getElementById("commodity-finding");

    if (finding) {
        finding.textContent = "Commodity data could not be loaded.";
    }
});
