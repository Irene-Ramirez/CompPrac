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
