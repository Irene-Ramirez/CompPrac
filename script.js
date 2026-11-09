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


async function loadWeightValueAnalysis() {
    const response = await fetch("data/jaxport_weight_value.json");

    if (!response.ok) {
        throw new Error("Unable to load weight-value data");
    }

    const data = await response.json();

    const yearFilter = document.getElementById("weight-year-filter");
    const directionFilter = document.getElementById("weight-direction-filter");
    const commodityFilter = document.getElementById("weight-commodity-filter");
    const finding = document.getElementById("weight-value-finding");

    const years = [...new Set(data.map(row => Number(row.year)))]
        .sort((a, b) => a - b);

    years.forEach(year => {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    const commodities = [...new Set(data.map(row => String(row.hs2)))]
        .sort();

    commodities.forEach(code => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = `HS${code}`;
        commodityFilter.appendChild(option);
    });

    function updateWeightValueChart() {
        const selectedYear = yearFilter.value;
        const selectedDirection = directionFilter.value;
        const selectedCommodity = commodityFilter.value;

        const filtered = data.filter(row =>
            (selectedYear === "all" ||
                String(row.year) === selectedYear) &&
            (selectedDirection === "all" ||
                row.direction === selectedDirection) &&
            (selectedCommodity === "all" ||
                String(row.hs2) === selectedCommodity) &&
            Number.isFinite(Number(row.log_weight)) &&
            Number.isFinite(Number(row.log_value))
        );

        if (filtered.length < 3) {
            Plotly.purge("weight-value-chart");
            finding.textContent =
                "Not enough observations for this selection.";
            return;
        }

        const x = filtered.map(row => Number(row.log_weight));
        const y = filtered.map(row => Number(row.log_value));
        const n = x.length;

        const meanX = x.reduce((a, b) => a + b, 0) / n;
        const meanY = y.reduce((a, b) => a + b, 0) / n;

        let sxx = 0;
        let syy = 0;
        let sxy = 0;

        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            sxx += dx * dx;
            syy += dy * dy;
            sxy += dx * dy;
        }

        if (sxx === 0 || syy === 0) {
            Plotly.purge("weight-value-chart");
            finding.textContent =
                "The selected observations have insufficient variation.";
            return;
        }

        const correlation = sxy / Math.sqrt(sxx * syy);
        const slope = sxy / sxx;
        const intercept = meanY - slope * meanX;
        const rSquared = correlation * correlation;

        const minX = Math.min(...x);
        const maxX = Math.max(...x);

        const regressionX = [minX, maxX];
        const regressionY = regressionX.map(
            value => intercept + slope * value
        );

        Plotly.react("weight-value-chart", [
            {
                type: "scatter",
                mode: "markers",
                name: "Shipments",
                x: x,
                y: y,
                marker: {
                    color: "#167c9b",
                    size: 5,
                    opacity: 0.35
                },
                customdata: filtered.map(row => [
                    row.metric_tons,
                    row.value_usd
                ]),
                hovertemplate:
                    "Weight: %{customdata[0]:,.2f} metric tons" +
                    "<br>Value: $%{customdata[1]:,.2f}" +
                    "<extra></extra>"
            },
            {
                type: "scatter",
                mode: "lines",
                name: "Log-log regression",
                x: regressionX,
                y: regressionY,
                line: {
                    color: "#e58b35",
                    width: 3
                },
                hovertemplate:
                    "Log weight: %{x:.2f}" +
                    "<br>Predicted log value: %{y:.2f}" +
                    "<extra></extra>"
            }
        ], {
            title: "Cargo Weight and Trade Value (Log10 Scale)",
            xaxis: {
                title: "Log10 Cargo Weight (Metric Tons)"
            },
            yaxis: {
                title: "Log10 Trade Value (USD)"
            },
            margin: {
                t: 65,
                b: 75,
                l: 85,
                r: 25
            },
            height: 530,
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            legend: {
                orientation: "h",
                y: 1.12
            }
        }, {
            responsive: true,
            displaylogo: false
        });

        const strength = Math.abs(correlation) >= 0.7
            ? "strong"
            : Math.abs(correlation) >= 0.4
                ? "moderate"
                : "weak";

        const direction = correlation >= 0
            ? "positive"
            : "negative";

        finding.textContent =
            `Based on ${n.toLocaleString()} sampled observations, ` +
            `the log-transformed cargo weight and trade value ` +
            `have a ${strength} ${direction} linear relationship ` +
            `(Pearson r = ${correlation.toFixed(3)}, ` +
            `R² = ${rSquared.toFixed(3)}). ` +
            `The fitted log-log regression slope is ` +
            `${slope.toFixed(3)}.`;
    }

    yearFilter.addEventListener("change", updateWeightValueChart);
    directionFilter.addEventListener("change", updateWeightValueChart);
    commodityFilter.addEventListener("change", updateWeightValueChart);

    updateWeightValueChart();
}

loadWeightValueAnalysis().catch(error => {
    console.error(error);

    const finding = document.getElementById("weight-value-finding");

    if (finding) {
        finding.textContent = "Weight-value data could not be loaded.";
    }
});


async function loadForecastAnalysis() {
    const response = await fetch("data/jaxport_forecast.json");

    if (!response.ok) {
        throw new Error("Unable to load forecasting data");
    }

    const data = await response.json();

    data.sort((a, b) =>
        Number(a.year) - Number(b.year) ||
        Number(a.quarter) - Number(b.quarter)
    );

    const quarters = data.map(
        row => `Q${row.quarter} ${row.year}`
    );

    const actual = data.map(row => Number(row.total_teus));
    const naive = data.map(row => Number(row.naive_forecast));
    const seasonal = data.map(
        row => Number(row.seasonal_naive_forecast)
    );

    // ==========================================
    // CHART 1: ACTUAL VS FORECAST
    // ==========================================

    Plotly.newPlot("forecast-chart", [
        {
            x: quarters,
            y: actual,
            type: "scatter",
            mode: "lines+markers",
            name: "Actual TEUs",
            line: { color: "#167c9b", width: 3 },
            marker: { size: 9 }
        },
        {
            x: quarters,
            y: naive,
            type: "scatter",
            mode: "lines+markers",
            name: "Naive Forecast",
            line: { color: "#e58b35", width: 3, dash: "dash" },
            marker: { size: 8 }
        },
        {
            x: quarters,
            y: seasonal,
            type: "scatter",
            mode: "lines+markers",
            name: "Seasonal Naive Forecast",
            line: { color: "#7b61a8", width: 3, dash: "dot" },
            marker: { size: 8 }
        }
    ], {
        title: "2025 Actual vs. Forecasted TEUs",
        xaxis: { title: "Quarter" },
        yaxis: {
            title: "TEUs",
            rangemode: "tozero"
        },
        hovermode: "x unified",
        legend: {
            orientation: "h",
            y: 1.16
        },
        margin: { t: 95, b: 70, l: 85, r: 25 },
        paper_bgcolor: "white",
        plot_bgcolor: "white"
    }, {
        responsive: true,
        displaylogo: false
    });

    // ==========================================
    // CALCULATE FORECAST ACCURACY
    // ==========================================

    function calculateMetrics(predicted) {
        const errors = actual.map(
            (value, i) => value - predicted[i]
        );

        const mae = errors.reduce(
            (sum, error) => sum + Math.abs(error), 0
        ) / errors.length;

        const rmse = Math.sqrt(
            errors.reduce(
                (sum, error) => sum + error ** 2, 0
            ) / errors.length
        );

        const mape = errors.reduce(
            (sum, error, i) =>
                sum + Math.abs(error / actual[i]), 0
        ) / errors.length * 100;

        return { mae, rmse, mape };
    }

    const naiveMetrics = calculateMetrics(naive);
    const seasonalMetrics = calculateMetrics(seasonal);

    document.getElementById("naive-mae").textContent =
        naiveMetrics.mae.toLocaleString("en-US", {
            maximumFractionDigits: 2
        });

    document.getElementById("seasonal-mae").textContent =
        seasonalMetrics.mae.toLocaleString("en-US", {
            maximumFractionDigits: 2
        });

    // ==========================================
    // CHART 2: FORECAST ERROR COMPARISON
    // ==========================================

    Plotly.newPlot("forecast-accuracy-chart", [
        {
            type: "bar",
            name: "Naive",
            x: ["MAE", "RMSE"],
            y: [naiveMetrics.mae, naiveMetrics.rmse],
            marker: { color: "#e58b35" }
        },
        {
            type: "bar",
            name: "Seasonal Naive",
            x: ["MAE", "RMSE"],
            y: [seasonalMetrics.mae, seasonalMetrics.rmse],
            marker: { color: "#7b61a8" }
        }
    ], {
        title: "Forecast Error Comparison",
        barmode: "group",
        xaxis: { title: "Error Metric" },
        yaxis: { title: "Error (TEUs)" },
        margin: { t: 65, b: 70, l: 85, r: 25 },
        paper_bgcolor: "white",
        plot_bgcolor: "white"
    }, {
        responsive: true,
        displaylogo: false
    });

    // ==========================================
    // DYNAMIC STATISTICAL FINDING
    // ==========================================

    const betterModel =
        naiveMetrics.mae < seasonalMetrics.mae
            ? "naive"
            : "seasonal naive";

    const finding = document.getElementById("forecast-finding");

    finding.textContent =
        `For the four quarters of 2025, the ${betterModel} ` +
        `forecast achieved the lower mean absolute error. ` +
        `The naive model had an MAE of ` +
        `${naiveMetrics.mae.toFixed(2)} TEUs and a MAPE of ` +
        `${naiveMetrics.mape.toFixed(2)}%, while the seasonal ` +
        `naive model had an MAE of ` +
        `${seasonalMetrics.mae.toFixed(2)} TEUs and a MAPE of ` +
        `${seasonalMetrics.mape.toFixed(2)}%. ` +
        `These results describe one-quarter-ahead historical ` +
        `benchmark forecasts, not future predictions.`;
}

loadForecastAnalysis().catch(error => {
    console.error(error);

    document.getElementById("forecast-finding").textContent =
        "Forecasting data could not be loaded.";
});


async function loadMachineLearningAnalysis() {

    const [overallResponse, jaxResponse, predictionsResponse] =
        await Promise.all([
            fetch("data/jaxport_model_comparison.json"),
            fetch("data/jaxport_jacksonville_performance.json"),
            fetch("data/jaxport_model_predictions.json")
        ]);

    if (
        !overallResponse.ok ||
        !jaxResponse.ok ||
        !predictionsResponse.ok
    ) {
        throw new Error("Unable to load machine learning data");
    }

    const overallResults = await overallResponse.json();
    const jaxResults = await jaxResponse.json();
    const predictions = await predictionsResponse.json();

    const scopeFilter = document.getElementById("ml-scope-filter");
    const modelFilter = document.getElementById("ml-model-filter");
    const tableBody = document.getElementById("ml-results-body");
    const finding = document.getElementById("ml-finding");

    const colors = {
        "Neural Network": "#167c9b",
        "Linear Regression": "#e58b35"
    };

    const format = value =>
        Number(value).toFixed(4);

    function selectedModels() {
        if (modelFilter.value === "nn") {
            return ["Neural Network"];
        }

        if (modelFilter.value === "linear") {
            return ["Linear Regression"];
        }

        return ["Neural Network", "Linear Regression"];
    }

    function updateMLCharts() {

        const isJacksonville =
            scopeFilter.value === "jacksonville";

        const results = isJacksonville
            ? jaxResults
            : overallResults;

        const models = selectedModels();

        const selectedResults = results.filter(
            row => models.includes(row.Model)
        );

        // ======================================
        // PERFORMANCE TABLE
        // ======================================

        tableBody.innerHTML = "";

        selectedResults.forEach(row => {

            const tr = document.createElement("tr");

            [
                row.Model,
                format(row["R-squared"]),
                format(row.MAE),
                format(row.RMSE)
            ].forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });

        // ======================================
        // PERFORMANCE CHART
        // ======================================

        // MAE and RMSE are displayed together.
        // R-squared remains in the table because
        // it measures something different.

        const performanceTraces = selectedResults.map(row => ({
            type: "bar",
            name: row.Model,
            x: ["MAE", "RMSE"],
            y: [
                Number(row.MAE),
                Number(row.RMSE)
            ],
            marker: {
                color: colors[row.Model]
            },
            text: [
                format(row.MAE),
                format(row.RMSE)
            ],
            textposition: "auto"
        }));

        Plotly.react("ml-performance-chart", performanceTraces, {
            title: isJacksonville
                ? "Jacksonville: 2025 Model Errors"
                : "All U.S. Ports: 2025 Model Errors",
            barmode: "group",
            xaxis: {
                title: "Error Metric"
            },
            yaxis: {
                title: "Error (Natural Log Scale)",
                rangemode: "tozero"
            },
            margin: {
                t: 70,
                b: 70,
                l: 85,
                r: 25
            },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        }, {
            responsive: true,
            displaylogo: false
        });

        // ======================================
        // ACTUAL VS PREDICTED SCATTER PLOT
        // ======================================

        const filtered = predictions.filter(row =>
            !isJacksonville ||
            String(row.us_port).trim().toUpperCase()
                === "JACKSONVILLE"
        );

        const scatterTraces = [];

        const configurations = [
            {
                name: "Neural Network",
                column: "nn_predicted"
            },
            {
                name: "Linear Regression",
                column: "linear_predicted"
            }
        ];

        configurations.forEach(config => {

            if (!models.includes(config.name)) {
                return;
            }

            scatterTraces.push({
                type: "scatter",
                mode: "markers",
                name: config.name,
                x: filtered.map(
                    row => Number(row.actual_log_value)
                ),
                y: filtered.map(
                    row => Number(row[config.column])
                ),
                marker: {
                    color: colors[config.name],
                    size: 5,
                    opacity: 0.3
                },
                hovertemplate:
                    "Actual: %{x:.3f}" +
                    "<br>Predicted: %{y:.3f}" +
                    "<extra></extra>"
            });
        });

        const values = filtered.flatMap(row => [
            Number(row.actual_log_value),
            ...(models.includes("Neural Network")
                ? [Number(row.nn_predicted)]
                : []),
            ...(models.includes("Linear Regression")
                ? [Number(row.linear_predicted)]
                : [])
        ]).filter(Number.isFinite);

        if (values.length > 0) {

            const minimum = Math.min(...values);
            const maximum = Math.max(...values);

            scatterTraces.push({
                type: "scatter",
                mode: "lines",
                name: "Perfect Prediction",
                x: [minimum, maximum],
                y: [minimum, maximum],
                line: {
                    color: "#333333",
                    width: 2,
                    dash: "dash"
                }
            });
        }

        Plotly.react("ml-predictions-chart", scatterTraces, {
            title: isJacksonville
                ? "Jacksonville: Actual vs. Predicted"
                : "All U.S. Ports: Actual vs. Predicted",
            xaxis: {
                title: "Actual Log(1 + Trade Value)",
                zeroline: false
            },
            yaxis: {
                title: "Predicted Log(1 + Trade Value)",
                zeroline: false
            },
            legend: {
                orientation: "h",
                y: 1.16
            },
            margin: {
                t: 95,
                b: 75,
                l: 85,
                r: 25
            },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            annotations: filtered.length === 0
                ? [{
                    text: "No sampled observations for this selection",
                    showarrow: false,
                    xref: "paper",
                    yref: "paper",
                    x: 0.5,
                    y: 0.5
                }]
                : []
        }, {
            responsive: true,
            displaylogo: false
        });

        // ======================================
        // STATISTICAL FINDING
        // ======================================

        const nn = results.find(
            row => row.Model === "Neural Network"
        );

        const linear = results.find(
            row => row.Model === "Linear Regression"
        );

        const scopeText = isJacksonville
            ? "Jacksonville"
            : "the overall trade dataset";

        if (nn && linear) {

            const winner = Number(nn.MAE) < Number(linear.MAE)
                ? "neural network"
                : "linear regression";

            finding.textContent =
                `For ${scopeText}, the ${winner} achieved ` +
                `the lower mean absolute error. ` +
                `The neural network obtained R² = ` +
                `${format(nn["R-squared"])} and MAE = ` +
                `${format(nn.MAE)}, compared with R² = ` +
                `${format(linear["R-squared"])} and MAE = ` +
                `${format(linear.MAE)} for linear regression. ` +
                `The scatter plot displays ` +
                `${filtered.length.toLocaleString()} sampled ` +
                `2025 observations.`;

        } else {
            finding.textContent =
                "Model performance results are unavailable.";
        }
    }

    scopeFilter.addEventListener("change", updateMLCharts);
    modelFilter.addEventListener("change", updateMLCharts);

    updateMLCharts();
}

loadMachineLearningAnalysis().catch(error => {
    console.error(error);

    const finding = document.getElementById("ml-finding");

    if (finding) {
        finding.textContent =
            "Machine learning results could not be loaded.";
    }
});
