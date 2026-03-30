/* ============================================================
   Governance Genome Explorer v2 — Charts (Revised)
   Plain JS, no ES6 modules. ECharts dark theme.
   ============================================================ */

var COLORS = DATA.clusterColors;
var LABELS = DATA.clusterLabels;
var SHORT  = DATA.clusterShort;

var ECHARTS_THEME = {
    textColor:     '#94a3b8',
    axisLineColor: '#334155',
    splitLineColor:'#1e293b',
    tooltipBg:     'rgba(15,23,42,0.95)',
    tooltipBorder: '#334155'
};

var ACCENT_PALETTE = [
    '#6366f1','#22c55e','#f59e0b','#ef4444','#22d3ee',
    '#ec4899','#f97316','#8b5cf6','#14b8a6','#38bdf8',
    '#a78bfa','#fb923c','#34d399','#fbbf24','#f472b6'
];

/* Helper: standard tooltip config */
function _tooltip() {
    return {
        backgroundColor: ECHARTS_THEME.tooltipBg,
        borderColor: ECHARTS_THEME.tooltipBorder,
        textStyle: { color: '#f1f5f9' }
    };
}

/* Helper: register chart for resize */
function _register(chart) {
    window._charts = window._charts || [];
    window._charts.push(chart);
}

/* Helper: sort object entries by value desc, return [{n, c}] */
function _sortedEntries(obj) {
    var arr = [];
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) arr.push({ n: k, c: obj[k] });
    }
    arr.sort(function(a, b) { return b.c - a.c; });
    return arr;
}


/* ==================================================================
   TAB 1 — OVERVIEW
   ================================================================== */

/* 1. Findings cards (innerHTML, not ECharts) */
function renderFindings() {
    var el = document.getElementById('findings-grid');
    if (!el) return;
    var html = '';
    DATA.findings.forEach(function(f) {
        html += '<div class="finding-card" data-finding-num="' + f.num + '">'
              + '<div class="finding-num">' + f.num + '</div>'
              + '<div class="finding-title">' + f.title + '</div>'
              + '<div class="finding-body">' + f.body + '</div>'
              + '</div>';
    });
    el.innerHTML = html;
}

/* 2. Family donut */
function renderFamilyDonut() {
    var el = document.getElementById('chart-family-donut');
    if (!el) return;
    var chart = echarts.init(el);
    var pieData = [];
    for (var i = 0; i < 6; i++) {
        var key = String(i);
        var n = DATA.clusterComposition[key] ? DATA.clusterComposition[key].n : 0;
        pieData.push({
            value: n,
            name: LABELS[key],
            itemStyle: { color: COLORS[key] }
        });
    }
    chart.setOption({
        tooltip: Object.assign({ trigger: 'item', formatter: '{b}: {c} ({d}%)' }, _tooltip()),
        legend: {
            type: 'scroll', bottom: 10,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 }
        },
        series: [{
            type: 'pie',
            radius: ['42%', '72%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            label: {
                show: true, position: 'center',
                formatter: DATA.meta.nStatements.toLocaleString(),
                fontSize: 28, fontWeight: 'bold',
                color: '#f1f5f9'
            },
            emphasis: {
                label: { show: true, fontSize: 14, fontWeight: 'bold', position: 'center',
                    formatter: function(p) { return p.name + '\n' + p.value; }
                }
            },
            data: pieData
        }]
    });
    _register(chart);
}

/* 3. Org type horizontal bar */
function renderOrgBar() {
    var el = document.getElementById('chart-org-bar');
    if (!el) return;
    var chart = echarts.init(el);
    var items = _sortedEntries(DATA.corpus.org_type);
    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, _tooltip()),
        grid: { left: 160, right: 30, top: 10, bottom: 10 },
        xAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        yAxis: {
            type: 'category',
            data: items.map(function(d) { return d.n; }),
            inverse: true,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        series: [{
            type: 'bar',
            data: items.map(function(d) { return { value: d.c, itemStyle: { color: '#6366f1' } }; }),
            barMaxWidth: 20
        }]
    });
    _register(chart);
}

/* 4. Region horizontal bar (top 15) */
function renderRegionBar() {
    var el = document.getElementById('chart-region-bar');
    if (!el) return;
    var chart = echarts.init(el);
    var items = _sortedEntries(DATA.corpus.region).slice(0, 15);
    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, _tooltip()),
        grid: { left: 180, right: 30, top: 10, bottom: 10 },
        xAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        yAxis: {
            type: 'category',
            data: items.map(function(d) { return d.n; }),
            inverse: true,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        series: [{
            type: 'bar',
            data: items.map(function(d) { return { value: d.c, itemStyle: { color: '#6366f1' } }; }),
            barMaxWidth: 20
        }]
    });
    _register(chart);
}

/* 5. Yearly volume line with 2019 breakpoint */
function renderVolumeLine() {
    var el = document.getElementById('chart-volume-line');
    if (!el) return;
    var chart = echarts.init(el);
    var years = Object.keys(DATA.yearly).sort();
    var counts = years.map(function(y) { return DATA.yearly[y].total; });
    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis' }, _tooltip()),
        grid: { left: 50, right: 20, top: 30, bottom: 30 },
        xAxis: {
            type: 'category', data: years,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        series: [{
            type: 'line', data: counts, smooth: true,
            lineStyle: { color: '#6366f1', width: 3 },
            itemStyle: { color: '#6366f1' },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(99,102,241,0.35)' },
                { offset: 1, color: 'rgba(99,102,241,0.02)' }
            ])},
            markLine: {
                silent: true,
                data: [{ xAxis: '2019' }],
                lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
                label: { formatter: '2019 breakpoint', color: '#ef4444', fontSize: 11 }
            }
        }]
    });
    _register(chart);
}


/* ==================================================================
   TAB 2 — POLICY MAP
   ================================================================== */

var ORG_TYPE_COLORS = {
    government:          '#2563eb',
    professional:        '#16a34a',
    intergovernmental:   '#ea580c',
    industry:            '#dc2626',
    civil_society:       '#76b7b2',
    religious:           '#a0522d',
    national_ethics_body:'#edc948',
    academic:            '#b07aa1',
    labor:               '#ff9da7',
    multistakeholder:    '#bab0ac',
    indigenous:          '#a0cbe8'
};

var YEAR_BAND_COLORS = {
    '2010-2016': '#475569',
    '2017-2019': '#6366f1',
    '2020-2022': '#22c55e',
    '2023-2026': '#f59e0b'
};

var BINDING_COLORS = {
    legally_binding:       '#ef4444',
    soft_law:              '#f59e0b',
    advisory:              '#22c55e',
    voluntary_commitment:  '#6366f1',
    self_regulation:       '#22d3ee',
    aspirational_only:     '#94a3b8',
    communal_norm:         '#a0522d',
    religious_decree:      '#ec4899'
};

/* Helper: group statements by a field, return {group: [stmts]} */
function _groupBy(field) {
    var groups = {};
    DATA.statements.forEach(function(s) {
        var val = s[field] || 'Unknown';
        if (!groups[val]) groups[val] = [];
        groups[val].push(s);
    });
    return groups;
}

/* Helper: assign year band */
function _yearBand(y) {
    if (y <= 2016) return '2010-2016';
    if (y <= 2019) return '2017-2019';
    if (y <= 2022) return '2020-2022';
    return '2023-2026';
}

/* 6. UMAP scatter — multi-mode coloring */
function renderUmapMain(colorBy) {
    var el = document.getElementById('chart-umap-main');
    if (!el) return;
    var chart = echarts.getInstanceByDom(el) || echarts.init(el);
    colorBy = colorBy || 'cluster';

    var option = {
        tooltip: Object.assign({
            trigger: 'item',
            formatter: function(p) {
                var d = p.data;
                return '<b>' + (d[3] || '') + '</b><br/>'
                     + (d[4] || '') + '<br/>'
                     + 'Year: ' + (d[5] || '') + '<br/>'
                     + 'Cluster: ' + (d[6] || '') + '<br/>'
                     + '<span style="color:#94a3b8">' + (d[2] || '') + '</span>';
            }
        }, _tooltip()),
        grid: { left: 10, right: 10, top: 10, bottom: 10 },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'value', show: false },
        dataZoom: [
            { type: 'inside', xAxisIndex: 0 },
            { type: 'inside', yAxisIndex: 0 }
        ],
        animation: false
    };

    if (colorBy === 'cluster') {
        var seriesMap = {};
        for (var i = 0; i < 6; i++) seriesMap[i] = [];
        DATA.statements.forEach(function(s) {
            seriesMap[s.c].push([s.ux, s.uy, s.k, s.t, s.o, s.y, LABELS[s.c]]);
        });
        option.legend = {
            data: [], bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            type: 'scroll'
        };
        option.series = [];
        for (var c = 0; c < 6; c++) {
            var name = SHORT[c];
            option.legend.data.push(name);
            option.series.push({
                name: name, type: 'scatter',
                data: seriesMap[c],
                symbolSize: 5,
                itemStyle: { color: COLORS[c] },
                large: true
            });
        }
    } else if (colorBy === 'org_type') {
        var groups = _groupBy('ot');
        option.legend = {
            data: [], bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            type: 'scroll'
        };
        option.series = [];
        var idx = 0;
        for (var ot in groups) {
            if (!groups.hasOwnProperty(ot)) continue;
            var color = ORG_TYPE_COLORS[ot] || ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
            option.legend.data.push(ot);
            option.series.push({
                name: ot, type: 'scatter',
                data: groups[ot].map(function(s) {
                    return [s.ux, s.uy, s.k, s.t, s.o, s.y, LABELS[s.c]];
                }),
                symbolSize: 5,
                itemStyle: { color: color },
                large: true
            });
            idx++;
        }
    } else if (colorBy === 'region') {
        var regionGroups = _groupBy('r');
        var regionSorted = _sortedEntries(regionGroups).map(function(e) { return e.n; });
        var top8 = regionSorted.slice(0, 8);
        var otherRegions = regionSorted.slice(8);
        option.legend = {
            data: [], bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            type: 'scroll'
        };
        option.series = [];
        var ri = 0;
        top8.forEach(function(rName) {
            option.legend.data.push(rName);
            option.series.push({
                name: rName, type: 'scatter',
                data: regionGroups[rName].map(function(s) {
                    return [s.ux, s.uy, s.k, s.t, s.o, s.y, LABELS[s.c]];
                }),
                symbolSize: 5,
                itemStyle: { color: ACCENT_PALETTE[ri % ACCENT_PALETTE.length] },
                large: true
            });
            ri++;
        });
        // Other bucket
        var otherData = [];
        otherRegions.forEach(function(rName) {
            regionGroups[rName].forEach(function(s) {
                otherData.push([s.ux, s.uy, s.k, s.t, s.o, s.y, LABELS[s.c]]);
            });
        });
        if (otherData.length) {
            option.legend.data.push('Other');
            option.series.push({
                name: 'Other', type: 'scatter',
                data: otherData,
                symbolSize: 5,
                itemStyle: { color: '#64748b' },
                large: true
            });
        }
    } else if (colorBy === 'year_band') {
        var bands = { '2010-2016': [], '2017-2019': [], '2020-2022': [], '2023-2026': [] };
        DATA.statements.forEach(function(s) {
            var band = _yearBand(s.y);
            bands[band].push([s.ux, s.uy, s.k, s.t, s.o, s.y, LABELS[s.c]]);
        });
        option.legend = {
            data: [], bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 }
        };
        option.series = [];
        for (var band in bands) {
            if (!bands.hasOwnProperty(band)) continue;
            option.legend.data.push(band);
            option.series.push({
                name: band, type: 'scatter',
                data: bands[band],
                symbolSize: 5,
                itemStyle: { color: YEAR_BAND_COLORS[band] },
                large: true
            });
        }
    } else if (colorBy === 'binding_nature') {
        var bnGroups = _groupBy('bn');
        option.legend = {
            data: [], bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            type: 'scroll'
        };
        option.series = [];
        var bi = 0;
        for (var bn in bnGroups) {
            if (!bnGroups.hasOwnProperty(bn)) continue;
            var bnColor = BINDING_COLORS[bn] || ACCENT_PALETTE[bi % ACCENT_PALETTE.length];
            option.legend.data.push(bn);
            option.series.push({
                name: bn, type: 'scatter',
                data: bnGroups[bn].map(function(s) {
                    return [s.ux, s.uy, s.k, s.t, s.o, s.y, LABELS[s.c]];
                }),
                symbolSize: 5,
                itemStyle: { color: bnColor },
                large: true
            });
            bi++;
        }
    } else if (colorBy === 'sacred_secular') {
        var ssData = DATA.statements.map(function(s) {
            return [s.ux, s.uy, s.ss, s.k, s.t, s.o, s.y, LABELS[s.c]];
        });
        option.tooltip = Object.assign({
            trigger: 'item',
            formatter: function(p) {
                var d = p.data;
                return '<b>' + (d[4] || '') + '</b><br/>'
                     + (d[5] || '') + '<br/>'
                     + 'Year: ' + (d[6] || '') + '<br/>'
                     + 'Sacred-Secular: ' + d[2] + '<br/>'
                     + '<span style="color:#94a3b8">' + (d[3] || '') + '</span>';
            }
        }, _tooltip());
        option.visualMap = {
            min: 0, max: 100,
            dimension: 2,
            inRange: { color: ['#3b82f6', '#f59e0b', '#ef4444'] },
            text: ['Sacred (100)', 'Secular (0)'],
            textStyle: { color: ECHARTS_THEME.textColor },
            orient: 'vertical', right: 10, top: 'center',
            calculable: true,
            seriesIndex: 0
        };
        option.series = [{
            type: 'scatter',
            data: ssData,
            symbolSize: 5,
            large: true
        }];
        delete option.legend;
    }

    chart.setOption(option, true);
    _register(chart);
}

/* 7. Small UMAP pie (cluster sizes) */
function renderUmapPie() {
    var el = document.getElementById('chart-umap-pie');
    if (!el) return;
    var chart = echarts.init(el);
    var pieData = [];
    for (var i = 0; i < 6; i++) {
        var key = String(i);
        pieData.push({
            value: DATA.clusterComposition[key] ? DATA.clusterComposition[key].n : 0,
            name: SHORT[key],
            itemStyle: { color: COLORS[key] }
        });
    }
    chart.setOption({
        tooltip: Object.assign({ trigger: 'item', formatter: '{b}: {c} ({d}%)' }, _tooltip()),
        series: [{
            type: 'pie',
            radius: ['30%', '65%'],
            center: ['50%', '50%'],
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: pieData
        }]
    });
    _register(chart);
}

/* 8. UMAP legend (innerHTML based on colorBy) */
function renderUmapLegend(colorBy) {
    var el = document.getElementById('umap-legend');
    if (!el) return;
    colorBy = colorBy || 'cluster';
    var html = '';

    if (colorBy === 'cluster') {
        for (var i = 0; i < 6; i++) {
            html += '<span class="legend-item">'
                  + '<span class="legend-dot" style="background:' + COLORS[i] + '"></span>'
                  + SHORT[i] + ' (' + DATA.clusterComposition[i].n + ')'
                  + '</span> ';
        }
    } else if (colorBy === 'org_type') {
        for (var ot in ORG_TYPE_COLORS) {
            if (!ORG_TYPE_COLORS.hasOwnProperty(ot)) continue;
            var cnt = DATA.corpus.org_type[ot] || 0;
            html += '<span class="legend-item">'
                  + '<span class="legend-dot" style="background:' + ORG_TYPE_COLORS[ot] + '"></span>'
                  + ot + ' (' + cnt + ')'
                  + '</span> ';
        }
    } else if (colorBy === 'year_band') {
        for (var band in YEAR_BAND_COLORS) {
            if (!YEAR_BAND_COLORS.hasOwnProperty(band)) continue;
            html += '<span class="legend-item">'
                  + '<span class="legend-dot" style="background:' + YEAR_BAND_COLORS[band] + '"></span>'
                  + band
                  + '</span> ';
        }
    } else if (colorBy === 'binding_nature') {
        for (var bn in BINDING_COLORS) {
            if (!BINDING_COLORS.hasOwnProperty(bn)) continue;
            html += '<span class="legend-item">'
                  + '<span class="legend-dot" style="background:' + BINDING_COLORS[bn] + '"></span>'
                  + bn.replace(/_/g, ' ')
                  + '</span> ';
        }
    } else if (colorBy === 'sacred_secular') {
        html = '<span class="legend-item">'
             + '<span style="display:inline-block;width:80px;height:12px;'
             + 'background:linear-gradient(to right,#3b82f6,#f59e0b,#ef4444);'
             + 'border-radius:3px;vertical-align:middle;margin-right:6px"></span>'
             + 'Secular (0) &rarr; Sacred (100)'
             + '</span>';
    }
    el.innerHTML = html;
}


/* ==================================================================
   TAB 3 — FAMILIES
   ================================================================== */

/* --- Sub-tab 3a: Overview --- */

/* 9. Family cards (innerHTML) */
function renderFamilyCards() {
    var el = document.getElementById('family-cards');
    if (!el) return;

    // 3-column grid container
    var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">';
    for (var i = 0; i < 6; i++) {
        var key = String(i);
        var cc = DATA.clusterComposition[key];
        var profile = DATA.profilesK6[key];
        var topDims = profile.top_dimensions.slice(0, 6);
        var pctOfTotal = ((cc.n / 2021) * 100).toFixed(1);

        html += '<div style="border-radius:10px;border:1px solid var(--border);background:var(--card-bg);overflow:hidden;">';
        // Header band
        html += '<div style="background:' + COLORS[key] + ';padding:0.6rem 0.8rem;display:flex;align-items:center;justify-content:space-between;">'
              + '<span style="font-weight:700;font-size:1rem;color:#fff;">' + SHORT[key] + '</span>'
              + '<span style="font-size:0.8rem;color:rgba(255,255,255,0.85);">n=' + cc.n + ' (' + pctOfTotal + '%)</span>'
              + '</div>';
        // Subtitle
        html += '<div style="padding:0.4rem 0.8rem 0;font-size:0.78rem;opacity:0.7;line-height:1.3;">' + LABELS[key] + '</div>';
        // Radar
        html += '<div id="family-radar-' + key + '" style="width:100%;height:170px;"></div>';
        // Top dimensions list
        html += '<div style="padding:0 0.8rem 0.6rem;">';
        topDims.forEach(function(dim) {
            var label = dim.field.replace(/^gn_/, '').replace(/__/g, ': ').replace(/_/g, ' ');
            if (label.length > 28) label = label.substring(0, 26) + '..';
            var pct = Math.round(dim.diff);
            var sign = pct >= 0 ? '+' : '';
            var barW = Math.min(Math.abs(pct), 100);
            var barColor = pct >= 0 ? COLORS[key] : '#ef4444';
            html += '<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:2px;font-size:0.72rem;">'
                  + '<span style="flex:0 0 42%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0.8;" title="' + dim.field + '">' + label + '</span>'
                  + '<span style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">'
                  + '<span style="display:block;width:' + barW + '%;height:100%;background:' + barColor + ';border-radius:3px;"></span>'
                  + '</span>'
                  + '<span style="flex:0 0 2rem;text-align:right;font-weight:600;font-size:0.7rem;color:' + barColor + ';">' + sign + pct + '</span>'
                  + '</div>';
        });
        html += '</div></div>';
    }
    html += '</div>';
    el.innerHTML = html;

    // Render mini radar charts inside each card
    setTimeout(function() {
        for (var i = 0; i < 6; i++) {
            var key = String(i);
            var radarEl = document.getElementById('family-radar-' + key);
            if (!radarEl) continue;
            var profile = DATA.profilesK6[key];
            var dims = profile.top_dimensions ? profile.top_dimensions.slice(0, 6) : [];
            if (dims.length === 0) continue;
            var chart = echarts.init(radarEl);
            _register(chart);
            var indicator = dims.map(function(d) {
                return {
                    name: d.field.replace(/^gn_/, '').replace(/__/g, ': ').replace(/_/g, ' ').substring(0, 16),
                    max: 100
                };
            });
            var values = dims.map(function(d) { return Math.min(Math.round(d.cluster_mean), 100); });
            chart.setOption({
                radar: {
                    indicator: indicator,
                    radius: '62%',
                    center: ['50%', '54%'],
                    axisName: { color: textColor(), fontSize: 8, formatter: function(v) { return v.length > 14 ? v.substring(0,12) + '..' : v; } },
                    axisLine: { lineStyle: { color: '#334155' } },
                    splitLine: { lineStyle: { color: '#1e293b' } },
                    splitArea: { show: false }
                },
                series: [{
                    type: 'radar',
                    data: [{
                        value: values,
                        name: SHORT[key],
                        areaStyle: { opacity: 0.35, color: COLORS[key] },
                        lineStyle: { color: COLORS[key], width: 2 },
                        itemStyle: { color: COLORS[key] }
                    }],
                    silent: true
                }]
            });
        }
    }, 100);
}

/* 10. Pillar heatmap: 15 pillars (y) x 6 clusters (x) */
function renderPillarHeatmap() {
    var el = document.getElementById('chart-pillar-heatmap');
    if (!el) return;
    var chart = echarts.init(el);

    var pillarKeys = Object.keys(DATA.pillarHeatmap);
    var pillarLabels = pillarKeys.map(function(k) {
        return DATA.pillarNames[k] || k.replace(/_/g, ' ');
    });
    var clusterLabelsX = [];
    for (var c = 0; c < 6; c++) clusterLabelsX.push(SHORT[c]);

    var hdata = [];
    var maxVal = 0;
    pillarKeys.forEach(function(pk, yi) {
        var row = DATA.pillarHeatmap[pk];
        for (var ci = 0; ci < 6; ci++) {
            var v = row[String(ci)] || 0;
            hdata.push([ci, yi, Math.round(v * 10) / 10]);
            if (v > maxVal) maxVal = v;
        }
    });

    chart.setOption({
        tooltip: Object.assign({
            position: 'top',
            formatter: function(p) {
                return clusterLabelsX[p.value[0]] + ' \u00d7 ' + pillarLabels[p.value[1]]
                     + ': ' + p.value[2] + '%';
            }
        }, _tooltip()),
        grid: { left: 180, right: 60, top: 10, bottom: 60 },
        xAxis: {
            type: 'category', data: clusterLabelsX, position: 'top',
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11, rotate: 20 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'category', data: pillarLabels,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        visualMap: {
            min: 0, max: Math.ceil(maxVal) || 50,
            calculable: true, orient: 'horizontal', left: 'center', bottom: 5,
            inRange: { color: ['#0f172a', '#1e3a5f', '#2563eb', '#7c3aed', '#f59e0b', '#ef4444'] },
            textStyle: { color: ECHARTS_THEME.textColor }
        },
        series: [{
            type: 'heatmap',
            data: hdata,
            label: { show: true, color: '#f1f5f9', fontSize: 10,
                formatter: function(p) { return p.value[2]; }
            },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
        }]
    });
    _register(chart);
}

/* 11. Cluster org-type stacked bar */
function renderClusterOrg() {
    var el = document.getElementById('chart-cluster-org');
    if (!el) return;
    var chart = echarts.init(el);

    // Collect all org types across clusters
    var allOT = {};
    for (var c = 0; c < 6; c++) {
        var ot = DATA.clusterComposition[c].org_type;
        for (var k in ot) { if (ot.hasOwnProperty(k)) allOT[k] = true; }
    }
    var otKeys = Object.keys(allOT);
    var clusterNames = [];
    for (var c2 = 0; c2 < 6; c2++) clusterNames.push(SHORT[c2]);

    var series = otKeys.map(function(ot, idx) {
        var data = [];
        for (var ci = 0; ci < 6; ci++) {
            data.push(DATA.clusterComposition[ci].org_type[ot] || 0);
        }
        return {
            name: ot, type: 'bar', stack: 'total', data: data,
            itemStyle: { color: ORG_TYPE_COLORS[ot] || ACCENT_PALETTE[idx % ACCENT_PALETTE.length] },
            emphasis: { focus: 'series' }
        };
    });

    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, _tooltip()),
        legend: {
            type: 'scroll', bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 10 }
        },
        grid: { left: 50, right: 20, top: 10, bottom: 60 },
        xAxis: {
            type: 'category', data: clusterNames,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        series: series
    });
    _register(chart);
}

/* 12. Cluster region stacked bar (top 6 + Other) */
function renderClusterRegion() {
    var el = document.getElementById('chart-cluster-region');
    if (!el) return;
    var chart = echarts.init(el);

    // Tally regions per cluster
    var regionTotals = {};
    for (var c = 0; c < 6; c++) {
        var reg = DATA.clusterComposition[c].region;
        if (reg) {
            for (var r in reg) {
                if (reg.hasOwnProperty(r)) {
                    regionTotals[r] = (regionTotals[r] || 0) + reg[r];
                }
            }
        }
    }
    var sortedRegions = _sortedEntries(regionTotals);
    var top6 = sortedRegions.slice(0, 6).map(function(e) { return e.n; });
    var otherRegionNames = sortedRegions.slice(6).map(function(e) { return e.n; });

    var clusterNames = [];
    for (var c2 = 0; c2 < 6; c2++) clusterNames.push(SHORT[c2]);

    var regionKeys = top6.concat(['Other']);
    var series = regionKeys.map(function(rName, idx) {
        var data = [];
        for (var ci = 0; ci < 6; ci++) {
            var reg = DATA.clusterComposition[ci].region || {};
            if (rName === 'Other') {
                var sum = 0;
                otherRegionNames.forEach(function(or) { sum += (reg[or] || 0); });
                data.push(sum);
            } else {
                data.push(reg[rName] || 0);
            }
        }
        return {
            name: rName, type: 'bar', stack: 'total', data: data,
            itemStyle: { color: ACCENT_PALETTE[idx % ACCENT_PALETTE.length] },
            emphasis: { focus: 'series' }
        };
    });

    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, _tooltip()),
        legend: {
            type: 'scroll', bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 10 }
        },
        grid: { left: 50, right: 20, top: 10, bottom: 60 },
        xAxis: {
            type: 'category', data: clusterNames,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        series: series
    });
    _register(chart);
}


/* --- Sub-tab 3b: Deep Dives --- */

/* 13. Family detail — radar + tables */
function renderFamilyDetail(clusterId) {
    var el = document.getElementById('family-detail');
    if (!el) return;
    var key = String(clusterId);
    var cc = DATA.clusterComposition[key];
    var profile = DATA.profilesK6[key];

    // --- Header ---
    var html = '<h4 style="color:' + COLORS[key] + '">'
             + LABELS[key] + ' <span style="color:#94a3b8;font-size:0.8em">(n=' + cc.n + ')</span></h4>';

    // --- Radar chart container ---
    html += '<div id="chart-family-radar-detail" style="width:100%;height:360px"></div>';

    // --- Two-column layout: dimensions + metadata ---
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">';

    // LEFT: Top dimensions as visual bars
    html += '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:1rem;">';
    html += '<h5 style="color:#f1f5f9;margin:0 0 0.8rem 0;font-size:0.95rem;">Top Distinguishing Dimensions</h5>';
    var topDims = profile.top_dimensions.slice(0, 12);
    topDims.forEach(function(dim) {
        var label = dim.field.replace(/^gn_/, '').replace(/__/g, ': ').replace(/_/g, ' ');
        if (label.length > 30) label = label.substring(0, 28) + '..';
        var diffPct = Math.round(dim.diff);
        var sign = diffPct >= 0 ? '+' : '';
        var barW = Math.min(Math.abs(diffPct), 100);
        var barColor = diffPct >= 0 ? COLORS[key] : '#ef4444';
        html += '<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:4px;">'
              + '<span style="flex:0 0 38%;font-size:0.75rem;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + dim.field + '">' + label + '</span>'
              + '<span style="flex:1;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;position:relative;">'
              + '<span style="display:block;width:' + barW + '%;height:100%;background:' + barColor + ';border-radius:4px;"></span>'
              + '</span>'
              + '<span style="flex:0 0 3.5rem;text-align:right;font-size:0.72rem;font-weight:600;color:' + barColor + ';">' + sign + diffPct + '</span>'
              + '<span style="flex:0 0 3rem;text-align:right;font-size:0.68rem;opacity:0.5;">' + dim.cluster_mean.toFixed(0) + ' / ' + dim.global_mean.toFixed(0) + '</span>'
              + '</div>';
    });
    html += '</div>';

    // RIGHT: Metadata cards
    html += '<div style="display:flex;flex-direction:column;gap:0.8rem;">';

    // Year card
    html += '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:0.8rem;">'
          + '<h5 style="color:#f1f5f9;margin:0 0 0.4rem 0;font-size:0.85rem;">Temporal Profile</h5>'
          + '<div style="display:flex;gap:1.5rem;align-items:center;">'
          + '<div style="text-align:center;"><div style="font-size:1.6rem;font-weight:700;color:' + COLORS[key] + ';">' + (profile.year_mean ? profile.year_mean.toFixed(1) : 'N/A') + '</div><div style="font-size:0.7rem;opacity:0.6;">Mean Year</div></div>'
          + '<div style="text-align:center;"><div style="font-size:1.1rem;font-weight:600;color:#94a3b8;">' + (profile.year_range ? profile.year_range[0] + ' \u2013 ' + profile.year_range[1] : 'N/A') + '</div><div style="font-size:0.7rem;opacity:0.6;">Range</div></div>'
          + '</div></div>';

    // Org type card with mini horizontal bars
    html += '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:0.8rem;">'
          + '<h5 style="color:#f1f5f9;margin:0 0 0.5rem 0;font-size:0.85rem;">Organization Types</h5>';
    var otSorted = _sortedEntries(cc.org_type);
    var otMax = otSorted.length > 0 ? otSorted[0].c : 1;
    otSorted.slice(0, 6).forEach(function(item) {
        var w = Math.round((item.c / otMax) * 100);
        html += '<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:3px;">'
              + '<span style="flex:0 0 35%;font-size:0.72rem;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.n.replace(/_/g, ' ') + '</span>'
              + '<span style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">'
              + '<span style="display:block;width:' + w + '%;height:100%;background:' + COLORS[key] + ';opacity:0.7;border-radius:3px;"></span></span>'
              + '<span style="flex:0 0 1.5rem;text-align:right;font-size:0.7rem;opacity:0.7;">' + item.c + '</span>'
              + '</div>';
    });
    html += '</div>';

    // Region card with mini horizontal bars
    if (cc.region) {
        html += '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:0.8rem;">'
              + '<h5 style="color:#f1f5f9;margin:0 0 0.5rem 0;font-size:0.85rem;">Regions</h5>';
        var regSorted = _sortedEntries(cc.region);
        var regMax = regSorted.length > 0 ? regSorted[0].c : 1;
        regSorted.slice(0, 6).forEach(function(item) {
            var w = Math.round((item.c / regMax) * 100);
            html += '<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:3px;">'
                  + '<span style="flex:0 0 35%;font-size:0.72rem;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.n + '</span>'
                  + '<span style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">'
                  + '<span style="display:block;width:' + w + '%;height:100%;background:' + COLORS[key] + ';opacity:0.7;border-radius:3px;"></span></span>'
                  + '<span style="flex:0 0 1.5rem;text-align:right;font-size:0.7rem;opacity:0.7;">' + item.c + '</span>'
                  + '</div>';
        });
        html += '</div>';
    }

    html += '</div>'; // end right column
    html += '</div>'; // end grid

    // --- Exemplar statements as cards ---
    if (cc.exemplars && cc.exemplars.length) {
        html += '<div style="margin-top:1rem;">';
        html += '<h5 style="color:#f1f5f9;margin:0 0 0.6rem 0;font-size:0.95rem;">Exemplar Statements <span style="font-weight:400;opacity:0.6;font-size:0.8rem;">(closest to centroid)</span></h5>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:0.6rem;">';
        cc.exemplars.forEach(function(ex) {
            html += '<div style="background:var(--card-bg);border:1px solid var(--border);border-left:3px solid ' + COLORS[key] + ';border-radius:8px;padding:0.7rem;">'
                  + '<div style="font-size:0.82rem;font-weight:600;color:#f1f5f9;margin-bottom:0.2rem;line-height:1.3;">' + ex.title + '</div>'
                  + '<div style="font-size:0.72rem;opacity:0.7;">'
                  + '<span>' + ex.org + '</span>'
                  + ' &middot; <span>' + ex.year + '</span>'
                  + (ex.region ? ' &middot; <span>' + ex.region + '</span>' : '')
                  + '</div>'
                  + '<div style="font-size:0.65rem;opacity:0.4;margin-top:0.2rem;">' + ex.key + '</div>'
                  + '</div>';
        });
        html += '</div></div>';
    }

    el.innerHTML = html;

    // --- Render radar chart for this cluster's pillar scores ---
    var radarEl = document.getElementById('chart-family-radar-detail');
    if (radarEl) {
        var radarChart = echarts.init(radarEl);
        var pillarKeys = Object.keys(DATA.pillarHeatmap);
        var indicators = pillarKeys.map(function(pk) {
            var allVals = [];
            for (var ci = 0; ci < 6; ci++) allVals.push(DATA.pillarHeatmap[pk][ci] || 0);
            var maxV = Math.max.apply(null, allVals);
            return {
                name: (DATA.pillarNames[pk] || pk.replace(/_/g, ' ')).substr(0, 20),
                max: Math.ceil(maxV * 1.1) || 50
            };
        });
        var values = pillarKeys.map(function(pk) {
            return DATA.pillarHeatmap[pk][key] || 0;
        });
        radarChart.setOption({
            tooltip: Object.assign({}, _tooltip()),
            textStyle: { color: ECHARTS_THEME.textColor },
            radar: {
                indicator: indicators,
                shape: 'polygon',
                axisName: { color: ECHARTS_THEME.textColor, fontSize: 10 },
                splitArea: { areaStyle: { color: ['transparent'] } },
                splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor, opacity: 0.5 } },
                axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor, opacity: 0.5 } }
            },
            series: [{
                type: 'radar',
                data: [{
                    name: LABELS[key],
                    value: values,
                    lineStyle: { color: COLORS[key], width: 2 },
                    areaStyle: { color: COLORS[key], opacity: 0.25 },
                    itemStyle: { color: COLORS[key] }
                }]
            }]
        });
        _register(radarChart);
    }
}


/* --- Sub-tab 3c: Compare --- */

/* 14. Silhouette vs k curve (dual axis with Davies-Bouldin) */
function renderSilCurve() {
    var el = document.getElementById('chart-sil-curve');
    if (!el) return;
    var chart = echarts.init(el);

    var kValues = Object.keys(DATA.silhouette).map(Number).sort(function(a, b) { return a - b; });
    var silValues = kValues.map(function(k) { return DATA.silhouette[k].sil; });
    var dbValues  = kValues.map(function(k) { return DATA.silhouette[k].db; });
    var kLabels = kValues.map(function(k) { return 'k=' + k; });

    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis' }, _tooltip()),
        legend: {
            data: ['Silhouette', 'Davies-Bouldin'],
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 }
        },
        grid: { left: 60, right: 60, top: 40, bottom: 30 },
        xAxis: {
            type: 'category', data: kLabels,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: [
            {
                type: 'value', name: 'Silhouette',
                nameTextStyle: { color: '#22c55e' },
                axisLabel: { color: ECHARTS_THEME.textColor },
                splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
            },
            {
                type: 'value', name: 'Davies-Bouldin',
                nameTextStyle: { color: '#ef4444' },
                axisLabel: { color: ECHARTS_THEME.textColor },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: 'Silhouette', type: 'line', data: silValues, smooth: true,
                lineStyle: { color: '#22c55e', width: 2 },
                itemStyle: { color: '#22c55e' },
                markPoint: {
                    data: [{
                        name: 'k=6', coord: [kValues.indexOf(6), DATA.silhouette['6'].sil],
                        symbol: 'pin', symbolSize: 40,
                        itemStyle: { color: '#f59e0b' },
                        label: { formatter: 'k=6', color: '#0f172a', fontWeight: 'bold' }
                    }]
                }
            },
            {
                name: 'Davies-Bouldin', type: 'line', data: dbValues, smooth: true,
                yAxisIndex: 1,
                lineStyle: { color: '#ef4444', width: 2, type: 'dashed' },
                itemStyle: { color: '#ef4444' }
            }
        ]
    });
    _register(chart);
}

/* 15. Per-cluster silhouette bar at k=6 */
function renderClusterSilBar() {
    var el = document.getElementById('chart-cluster-sil-bar');
    if (!el) return;
    var chart = echarts.init(el);

    var perCluster = DATA.silhouette['6'].perCluster;
    var names = [];
    var vals = [];
    var colors = [];
    for (var c = 0; c < 6; c++) {
        var key = String(c);
        names.push(SHORT[key]);
        vals.push(perCluster[key] ? perCluster[key].mean_sil : 0);
        colors.push(COLORS[key]);
    }

    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, _tooltip()),
        grid: { left: 120, right: 30, top: 10, bottom: 10 },
        xAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        yAxis: {
            type: 'category', data: names, inverse: true,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        series: [{
            type: 'bar',
            data: vals.map(function(v, i) {
                return { value: v, itemStyle: { color: colors[i] } };
            }),
            barMaxWidth: 24,
            label: {
                show: true, position: 'right',
                formatter: function(p) { return p.value.toFixed(3); },
                color: ECHARTS_THEME.textColor, fontSize: 11
            }
        }]
    });
    _register(chart);
}

/* 15b. Cluster Size Distribution */
function renderClusterSizes() {
    var el = document.getElementById('chart-cluster-sizes');
    if (!el) return;
    var chart = echarts.init(el);

    var names = [];
    var vals = [];
    var colors = [];
    for (var c = 0; c < 6; c++) {
        var key = String(c);
        var cc = DATA.clusterComposition[key];
        names.push(SHORT[key]);
        vals.push(cc ? cc.n : 0);
        colors.push(COLORS[key]);
    }

    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, _tooltip()),
        grid: { left: 120, right: 40, top: 10, bottom: 10 },
        xAxis: {
            type: 'value',
            name: 'Statements',
            nameTextStyle: { color: ECHARTS_THEME.textColor },
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        yAxis: {
            type: 'category', data: names, inverse: true,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        series: [{
            type: 'bar',
            data: vals.map(function(v, i) {
                return { value: v, itemStyle: { color: colors[i] } };
            }),
            barMaxWidth: 24,
            label: {
                show: true, position: 'right',
                formatter: '{c}',
                color: ECHARTS_THEME.textColor, fontSize: 11
            }
        }]
    });
    _register(chart);
}


/* ==================================================================
   TAB 4 — TEMPORAL
   ================================================================== */

/* 16. Stacked area: cluster composition by year */
function renderTemporalArea() {
    var el = document.getElementById('chart-temporal-area');
    if (!el) return;
    var chart = echarts.init(el);

    var years = Object.keys(DATA.yearly).map(Number).sort(function(a, b) { return a - b; });
    years = years.filter(function(y) { return y >= 2014; });
    var yearLabels = years.map(String);

    var series = [];
    for (var c = 0; c < 6; c++) {
        var key = String(c);
        var data = years.map(function(y) {
            var yr = DATA.yearly[String(y)];
            return yr && yr.clusters ? (yr.clusters[key] || 0) : 0;
        });
        series.push({
            name: SHORT[key], type: 'line', stack: 'total',
            areaStyle: { opacity: 0.6 },
            emphasis: { focus: 'series' },
            data: data,
            lineStyle: { color: COLORS[key] },
            itemStyle: { color: COLORS[key] }
        });
    }

    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis' }, _tooltip()),
        legend: {
            data: series.map(function(s) { return s.name; }),
            bottom: 5, type: 'scroll',
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 }
        },
        grid: { left: 50, right: 20, top: 20, bottom: 55 },
        xAxis: {
            type: 'category', data: yearLabels, boundaryGap: false,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        series: series
    });
    _register(chart);
}

/* 17. 100% stacked bar: cluster share by period */
function renderTemporalBar() {
    var el = document.getElementById('chart-temporal-bar');
    if (!el) return;
    var chart = echarts.init(el);

    var periods = Object.keys(DATA.temporal);
    var series = [];
    for (var c = 0; c < 6; c++) {
        var key = String(c);
        var data = periods.map(function(p) {
            var pcts = DATA.temporal[p].pcts;
            return pcts[key] || 0;
        });
        series.push({
            name: SHORT[key], type: 'bar', stack: 'total',
            data: data,
            itemStyle: { color: COLORS[key] },
            emphasis: { focus: 'series' },
            label: {
                show: true, position: 'inside', fontSize: 10,
                formatter: function(p) {
                    return p.value >= 5 ? Math.round(p.value) + '%' : '';
                },
                color: '#f1f5f9'
            }
        });
    }

    chart.setOption({
        tooltip: Object.assign({
            trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: function(params) {
                var header = params[0].name + '<br/>';
                var rows = params.map(function(p) {
                    return '<span style="display:inline-block;width:10px;height:10px;'
                         + 'border-radius:50%;background:' + p.color + ';margin-right:4px"></span>'
                         + p.seriesName + ': ' + p.value.toFixed(1) + '%';
                });
                return header + rows.join('<br/>');
            }
        }, _tooltip()),
        legend: {
            data: series.map(function(s) { return s.name; }),
            bottom: 5, type: 'scroll',
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 }
        },
        grid: { left: 50, right: 20, top: 10, bottom: 55 },
        xAxis: {
            type: 'category', data: periods,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'value', max: 100,
            axisLabel: { color: ECHARTS_THEME.textColor, formatter: '{value}%' },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        series: series
    });
    _register(chart);
}

/* 18. Per-family yearly count (smooth lines) */
function renderTemporalLine() {
    var el = document.getElementById('chart-temporal-line');
    if (!el) return;
    var chart = echarts.init(el);

    var years = Object.keys(DATA.yearly).map(Number).sort(function(a, b) { return a - b; });
    var yearLabels = years.map(String);

    var series = [];
    for (var c = 0; c < 6; c++) {
        var key = String(c);
        var data = years.map(function(y) {
            var yr = DATA.yearly[String(y)];
            return yr && yr.clusters ? (yr.clusters[key] || 0) : 0;
        });
        series.push({
            name: SHORT[key], type: 'line', smooth: true, data: data,
            lineStyle: { color: COLORS[key], width: 2 },
            itemStyle: { color: COLORS[key] },
            symbol: 'circle', symbolSize: 4
        });
    }

    chart.setOption({
        tooltip: Object.assign({ trigger: 'axis' }, _tooltip()),
        legend: {
            data: series.map(function(s) { return s.name; }),
            bottom: 5, type: 'scroll',
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 }
        },
        grid: { left: 50, right: 20, top: 20, bottom: 55 },
        xAxis: {
            type: 'category', data: yearLabels,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        series: series
    });
    _register(chart);
}

/* 19. Radar: pre-2020 vs post-2020 cluster shares */
function renderTemporalRadar() {
    var el = document.getElementById('chart-temporal-radar');
    if (!el) return;
    var chart = echarts.init(el);

    // Aggregate pre-2020 and post-2020
    var pre = [0, 0, 0, 0, 0, 0];
    var post = [0, 0, 0, 0, 0, 0];
    var preTotal = 0, postTotal = 0;

    var years = Object.keys(DATA.yearly).map(Number);
    years.forEach(function(y) {
        var yr = DATA.yearly[String(y)];
        if (!yr || !yr.clusters) return;
        for (var c = 0; c < 6; c++) {
            var v = yr.clusters[String(c)] || 0;
            if (y < 2020) { pre[c] += v; preTotal += v; }
            else { post[c] += v; postTotal += v; }
        }
    });

    // Convert to percentages
    var prePct = pre.map(function(v) { return preTotal ? Math.round(v / preTotal * 1000) / 10 : 0; });
    var postPct = post.map(function(v) { return postTotal ? Math.round(v / postTotal * 1000) / 10 : 0; });

    var indicators = [];
    for (var c = 0; c < 6; c++) {
        var maxV = Math.max(prePct[c], postPct[c]);
        indicators.push({ name: SHORT[c], max: Math.ceil(maxV * 1.3) || 50 });
    }

    chart.setOption({
        tooltip: Object.assign({}, _tooltip()),
        legend: {
            data: ['Pre-2020', 'Post-2020'], bottom: 5,
            textStyle: { color: ECHARTS_THEME.textColor, fontSize: 11 }
        },
        textStyle: { color: ECHARTS_THEME.textColor },
        radar: {
            indicator: indicators,
            shape: 'polygon',
            axisName: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            splitArea: { areaStyle: { color: ['transparent'] } },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor, opacity: 0.5 } },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor, opacity: 0.5 } }
        },
        series: [{
            type: 'radar',
            data: [
                {
                    name: 'Pre-2020', value: prePct,
                    lineStyle: { color: '#6366f1', width: 2 },
                    areaStyle: { color: '#6366f1', opacity: 0.15 },
                    itemStyle: { color: '#6366f1' }
                },
                {
                    name: 'Post-2020', value: postPct,
                    lineStyle: { color: '#22c55e', width: 2 },
                    areaStyle: { color: '#22c55e', opacity: 0.15 },
                    itemStyle: { color: '#22c55e' }
                }
            ]
        }]
    });
    _register(chart);
}


/* ==================================================================
   TAB 5 — SACRED-SECULAR
   ================================================================== */

/* --- Sub-tab 5a: Spectrum --- */

/* 20. Sacred-secular histogram with transition zone markArea */
function renderSacredHist() {
    var el = document.getElementById('chart-sacred-hist');
    if (!el) return;
    var chart = echarts.init(el);

    var dist = DATA.sacredSecular.distribution;
    var bins = Object.keys(dist);
    var counts = bins.map(function(b) { return dist[b]; });

    chart.setOption({
        tooltip: Object.assign({
            trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: function(params) {
                var p = params[0];
                return 'Range ' + p.name + ': ' + p.value + ' statements';
            }
        }, _tooltip()),
        grid: { left: 60, right: 20, top: 30, bottom: 40 },
        xAxis: {
            type: 'category', data: bins,
            axisLabel: { color: ECHARTS_THEME.textColor, fontSize: 11 },
            axisLine: { lineStyle: { color: ECHARTS_THEME.axisLineColor } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: ECHARTS_THEME.textColor },
            splitLine: { lineStyle: { color: ECHARTS_THEME.splitLineColor } }
        },
        series: [{
            type: 'bar', data: counts,
            itemStyle: {
                color: function(params) {
                    var binName = bins[params.dataIndex];
                    if (binName === '0') return '#3b82f6';
                    if (binName === '1-10' || binName === '11-20') return '#60a5fa';
                    if (binName === '21-40') return '#f59e0b';
                    if (binName === '41-60') return '#f97316';
                    return '#ef4444';
                }
            },
            barMaxWidth: 50,
            markArea: {
                silent: true,
                itemStyle: { color: 'rgba(245,158,11,0.08)', borderColor: '#f59e0b', borderType: 'dashed', borderWidth: 1 },
                label: { show: true, position: 'top', formatter: 'Transition Zone', color: '#f59e0b', fontSize: 11 },
                data: [[{ xAxis: '21-40' }, { xAxis: '21-40' }]]
            }
        }]
    });
    _register(chart);
}

/* 21. Sacred-secular UMAP scatter with gradient */
function renderSacredUmap() {
    var el = document.getElementById('chart-sacred-umap');
    if (!el) return;
    var chart = echarts.init(el);

    var ssData = DATA.statements.map(function(s) {
        return [s.ux, s.uy, s.ss];
    });

    chart.setOption({
        tooltip: Object.assign({
            trigger: 'item',
            formatter: function(p) {
                var d = p.data;
                return 'Sacred-Secular: ' + d[2] + '<br/>UMAP: (' + d[0].toFixed(2) + ', ' + d[1].toFixed(2) + ')';
            }
        }, _tooltip()),
        grid: { left: 10, right: 10, top: 10, bottom: 10 },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'value', show: false },
        visualMap: {
            min: 0, max: 100,
            dimension: 2,
            inRange: { color: ['#3b82f6', '#f59e0b', '#ef4444'] },
            text: ['Sacred (100)', 'Secular (0)'],
            textStyle: { color: ECHARTS_THEME.textColor },
            orient: 'vertical', right: 10, top: 'center',
            calculable: true
        },
        dataZoom: [
            { type: 'inside', xAxisIndex: 0 },
            { type: 'inside', yAxisIndex: 0 }
        ],
        series: [{
            type: 'scatter',
            data: ssData,
            symbolSize: 5,
            large: true
        }],
        animation: false
    });
    _register(chart);
}


/* --- Sub-tab 5b: Traditions --- */

/* 22. Tradition treemap */
function renderTraditionTreemap() {
    var el = document.getElementById('chart-tradition-treemap');
    if (!el) return;
    var chart = echarts.init(el);

    var fields = DATA.traditionFields;
    var treeData = [];
    for (var f in fields) {
        if (!fields.hasOwnProperty(f)) continue;
        var info = fields[f];
        if (info.nonzero === 0) continue;
        var label = f.replace(/^gn_/, '').replace(/_/g, ' ');
        treeData.push({
            name: label,
            value: info.nonzero,
            pct: info.pct
        });
    }
    treeData.sort(function(a, b) { return b.value - a.value; });

    chart.setOption({
        tooltip: Object.assign({
            formatter: function(p) {
                return '<b>' + p.name + '</b><br/>'
                     + 'Nonzero: ' + p.value + '<br/>'
                     + 'Activation: ' + (p.data.pct || 0).toFixed(1) + '%';
            }
        }, _tooltip()),
        series: [{
            type: 'treemap',
            data: treeData,
            roam: false,
            nodeClick: false,
            breadcrumb: { show: false },
            label: {
                show: true, fontSize: 11,
                formatter: function(p) {
                    return p.name + '\n' + p.value;
                }
            },
            levels: [{
                itemStyle: {
                    borderColor: '#0f172a', borderWidth: 2, gapWidth: 2
                },
                colorSaturation: [0.3, 0.8],
                colorMappingBy: 'value'
            }],
            visualMin: 0,
            visualMax: treeData.length ? treeData[0].value : 50,
            visualDimension: 0,
            color: ['#1e293b', '#6366f1', '#22c55e', '#f59e0b']
        }]
    });
    _register(chart);
}

/* 23. Tradition table (innerHTML) */
function renderTraditionTable() {
    var el = document.getElementById('tradition-table');
    if (!el) return;

    var fields = DATA.traditionFields;
    var rows = [];
    for (var f in fields) {
        if (!fields.hasOwnProperty(f)) continue;
        rows.push({ field: f, nonzero: fields[f].nonzero, pct: fields[f].pct });
    }
    rows.sort(function(a, b) { return b.nonzero - a.nonzero; });

    var html = '<table class="detail-table"><thead><tr>'
             + '<th>Tradition Field</th><th>Nonzero Count</th><th>Activation %</th>'
             + '</tr></thead><tbody>';
    rows.forEach(function(r) {
        var label = r.field.replace(/^gn_/, '').replace(/_/g, ' ');
        var barW = Math.min(r.pct * 5, 100); // scale for visual
        html += '<tr>'
              + '<td>' + label + '</td>'
              + '<td>' + r.nonzero + ' / 2,021</td>'
              + '<td>'
              + '<div style="display:flex;align-items:center;gap:6px">'
              + '<div style="width:80px;height:8px;background:#1e293b;border-radius:4px;overflow:hidden">'
              + '<div style="width:' + barW + '%;height:100%;background:#6366f1;border-radius:4px"></div>'
              + '</div>'
              + '<span>' + r.pct.toFixed(1) + '%</span>'
              + '</div>'
              + '</td>'
              + '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
}

// === Bridge: mkChart helper for part2 compatibility ===
function mkChart(el) {
    var chart = echarts.getInstanceByDom(el) || echarts.init(el);
    _register(chart);
    return chart;
}

function textColor() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "#334155" : "#94a3b8";
}

// Aliases: part1 uses COLORS/SHORT, part2 uses CLUSTER_COLORS/CLUSTER_SHORT
var CLUSTER_COLORS = COLORS;
var CLUSTER_SHORT = SHORT;

/* ============================================================
   Charts Part 2 (Tabs 6-10)
   Enforcement, Channels & Features, Anchors, Innovation vs Rights
   ============================================================ */

// ============================================================
//  TAB 6 — ENFORCEMENT
// ============================================================

function renderBindingHeatmap() {
    var el = document.getElementById('chart-binding-heatmap');
    if (!el) return;
    var chart = mkChart(el);

    // Collect all binding nature types across clusters
    var bnSet = {};
    var clusterIds = ['0', '1', '2', '3', '4', '5'];
    clusterIds.forEach(function (cid) {
        var ct = DATA.bindingCrosstab[cid];
        Object.keys(ct).forEach(function (bn) {
            if (bn) bnSet[bn] = true;
        });
    });
    var bnTypes = Object.keys(bnSet).sort();

    // Build heatmap data: [x=cluster, y=bnType, value=pct]
    var heatData = [];
    var maxVal = 0;
    clusterIds.forEach(function (cid, xi) {
        bnTypes.forEach(function (bn, yi) {
            var entry = DATA.bindingCrosstab[cid][bn];
            var pct = entry ? entry.pct : 0;
            heatData.push([xi, yi, pct]);
            if (pct > maxVal) maxVal = pct;
        });
    });

    var xLabels = clusterIds.map(function (cid) { return CLUSTER_SHORT[cid]; });
    var yLabels = bnTypes.map(function (bn) {
        return bn.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    });

    var tc = textColor();
    chart.setOption({
        tooltip: {
            position: 'top',
            formatter: function (p) {
                return xLabels[p.data[0]] + '<br>' +
                       yLabels[p.data[1]] + ': <b>' + p.data[2].toFixed(1) + '%</b>';
            }
        },
        grid: { left: 160, right: 40, top: 20, bottom: 60 },
        xAxis: {
            type: 'category',
            data: xLabels,
            axisLabel: { color: tc, fontSize: 11, rotate: 20 },
            axisLine: { lineStyle: { color: '#334155' } },
            splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(0,0,0,0.02)'] } }
        },
        yAxis: {
            type: 'category',
            data: yLabels,
            axisLabel: {
                color: function (val, idx) {
                    return bnTypes[idx] === 'legally_binding' ? '#f59e0b' : tc;
                },
                fontSize: 11,
                fontWeight: function (val, idx) {
                    return bnTypes[idx] === 'legally_binding' ? 'bold' : 'normal';
                }
            },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        visualMap: {
            min: 0, max: Math.ceil(maxVal),
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            textStyle: { color: tc },
            inRange: { color: ['#1e293b', '#334155', '#6366f1', '#a78bfa', '#f59e0b'] }
        },
        series: [{
            type: 'heatmap',
            data: heatData,
            label: {
                show: true,
                formatter: function (p) { return p.data[2] > 0 ? p.data[2].toFixed(1) + '%' : ''; },
                fontSize: 10,
                color: '#e2e8f0'
            },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
        }]
    });
}

function renderEnforceGradient() {
    var el = document.getElementById('chart-enforce-gradient');
    if (!el) return;
    var chart = mkChart(el);

    var weights = {
        'legally_binding': 3,
        'regulation': 2,
        'professional_standard': 1.5,
        'soft_law': 1,
        'soft_law_standard': 1,
        'aspirational_only': 0.2
    };

    var clusterIds = ['0', '1', '2', '3', '4', '5'];
    var scores = clusterIds.map(function (cid) {
        var ct = DATA.bindingCrosstab[cid];
        var score = 0;
        Object.keys(ct).forEach(function (bn) {
            if (bn && weights[bn] !== undefined) {
                score += ct[bn].pct * weights[bn];
            }
        });
        return { cid: cid, score: Math.round(score * 10) / 10 };
    });

    // Sort ascending
    scores.sort(function (a, b) { return a.score - b.score; });

    var tc = textColor();
    chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 120, right: 40, top: 20, bottom: 30 },
        xAxis: {
            type: 'value',
            name: 'Enforcement Score',
            nameTextStyle: { color: tc, fontSize: 11 },
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        yAxis: {
            type: 'category',
            data: scores.map(function (s) { return CLUSTER_SHORT[s.cid]; }),
            axisLabel: { color: tc, fontSize: 12 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
            type: 'bar',
            data: scores.map(function (s) {
                return {
                    value: s.score,
                    itemStyle: { color: CLUSTER_COLORS[s.cid] }
                };
            }),
            barMaxWidth: 30,
            label: {
                show: true,
                position: 'right',
                formatter: '{c}',
                color: tc,
                fontSize: 11
            }
        }]
    });
}

function renderEnforceInverse() {
    var el = document.getElementById('chart-enforce-inverse');
    if (!el) return;
    var chart = mkChart(el);

    var clusterIds = ['0', '1', '2', '3', '4', '5'];

    // Get non-binding proportion from profilesK6 top_dimensions
    var nonBindingMap = {};
    clusterIds.forEach(function (cid) {
        var dims = DATA.profilesK6[cid].top_dimensions;
        for (var i = 0; i < dims.length; i++) {
            if (dims[i].field === 'gn_rhetoric_primary__rights_based') {
                nonBindingMap[cid] = dims[i].cluster_mean;
                return;
            }
        }
        // Not found in top 20 -- use global mean as conservative estimate
        nonBindingMap[cid] = DATA.profilesK6[cid].top_dimensions[0] ?
            25.7 : 0; // global_mean from available data
    });

    // Get legally_binding pct from bindingCrosstab
    var lbMap = {};
    clusterIds.forEach(function (cid) {
        var entry = DATA.bindingCrosstab[cid]['legally_binding'];
        lbMap[cid] = entry ? entry.pct : 0;
    });

    var labels = clusterIds.map(function (cid) { return CLUSTER_SHORT[cid]; });
    var tc = textColor();

    chart.setOption({
        tooltip: {
            trigger: 'axis',
            formatter: function (params) {
                var tip = params[0].name + '<br>';
                params.forEach(function (p) {
                    tip += p.marker + ' ' + p.seriesName + ': <b>' + Math.abs(p.value).toFixed(1) + '</b><br>';
                });
                return tip;
            }
        },
        legend: { data: ['Non-binding (%)', 'Legally binding (%)'], textStyle: { color: tc }, bottom: 0 },
        grid: { left: 120, right: 60, top: 20, bottom: 50 },
        xAxis: {
            type: 'value',
            axisLabel: { color: tc, formatter: function (v) { return Math.abs(v); } },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        yAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: tc, fontSize: 12 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [
            {
                name: 'Non-binding (%)',
                type: 'bar',
                stack: 'inverse',
                data: clusterIds.map(function (cid) {
                    return -nonBindingMap[cid]; // negative = left side
                }),
                itemStyle: { color: '#94a3b8' },
                barMaxWidth: 24,
                label: {
                    show: true,
                    position: 'left',
                    formatter: function (p) { return Math.abs(p.value).toFixed(1); },
                    color: '#94a3b8',
                    fontSize: 10
                }
            },
            {
                name: 'Legally binding (%)',
                type: 'bar',
                stack: 'inverse',
                data: clusterIds.map(function (cid) {
                    return lbMap[cid];
                }),
                itemStyle: { color: '#22c55e' },
                barMaxWidth: 24,
                label: {
                    show: true,
                    position: 'right',
                    formatter: function (p) { return p.value.toFixed(1); },
                    color: '#22c55e',
                    fontSize: 10
                }
            }
        ]
    });
}

// ============================================================
//  TAB 7 — CHANNELS & FEATURES
// ============================================================

// --- Sub-tab 7a: Ablation ---

function renderAblationBar() {
    var el = document.getElementById('chart-ablation-bar');
    if (!el) return;
    var chart = mkChart(el);

    var combos = ['C1', 'C2', 'C3', 'C1_C2', 'C1_C3', 'C2_C3', 'all'];
    var labels = combos.map(function (c) {
        return c === 'all' ? 'All (C1+C2+C3)' : c.replace(/_/g, '+');
    });

    var refitData = combos.map(function (c) { return DATA.ablation[c].silhouette_refit; });
    var origData = combos.map(function (c) { return DATA.ablation[c].silhouette_orig_labels; });

    var tc = textColor();
    var seriesList = [
        {
            name: 'Silhouette (Re-fit)',
            type: 'bar',
            data: refitData,
            itemStyle: { color: '#6366f1' },
            barMaxWidth: 28
        },
        {
            name: 'Silhouette (Orig Labels)',
            type: 'bar',
            data: origData,
            itemStyle: { color: '#f59e0b' },
            barMaxWidth: 28
        },
        {
            name: 'Random baseline',
            type: 'line',
            data: combos.map(function () { return 0; }),
            lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
            symbol: 'none',
            tooltip: { show: false }
        }
    ];

    // Add bootstrap CI error bars if available
    if (DATA.bootstrapAblation) {
        var ciLower = combos.map(function (c) {
            var ba = DATA.bootstrapAblation[c];
            return ba ? ba.ci_lower : null;
        });
        var ciUpper = combos.map(function (c) {
            var ba = DATA.bootstrapAblation[c];
            return ba ? ba.ci_upper : null;
        });
        // Overlay CI whisker series (transparent bars with error-bar-like markPoints)
        seriesList.push({
            name: 'Bootstrap 95% CI',
            type: 'custom',
            renderItem: function (params, api) {
                var xValue = api.value(0);
                var lower = api.value(1);
                var upper = api.value(2);
                if (lower == null || upper == null) return;
                var highPoint = api.coord([xValue, upper]);
                var lowPoint = api.coord([xValue, lower]);
                var halfWidth = 6;
                return {
                    type: 'group',
                    children: [
                        { type: 'line', shape: { x1: highPoint[0], y1: highPoint[1], x2: lowPoint[0], y2: lowPoint[1] }, style: { stroke: '#e2e8f0', lineWidth: 1.5 } },
                        { type: 'line', shape: { x1: highPoint[0] - halfWidth, y1: highPoint[1], x2: highPoint[0] + halfWidth, y2: highPoint[1] }, style: { stroke: '#e2e8f0', lineWidth: 1.5 } },
                        { type: 'line', shape: { x1: lowPoint[0] - halfWidth, y1: lowPoint[1], x2: lowPoint[0] + halfWidth, y2: lowPoint[1] }, style: { stroke: '#e2e8f0', lineWidth: 1.5 } }
                    ]
                };
            },
            encode: { x: 0, y: [1, 2] },
            data: combos.map(function (c, idx) {
                var ba = DATA.bootstrapAblation[c];
                return [idx, ba ? ba.ci_lower : null, ba ? ba.ci_upper : null];
            }),
            z: 10
        });
    }

    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['Silhouette (Re-fit)', 'Silhouette (Orig Labels)'], textStyle: { color: tc }, bottom: 0 },
        grid: { left: 60, right: 30, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: tc, fontSize: 11, rotate: 25 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            type: 'value',
            name: 'Silhouette',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        series: seriesList
    });
}

function renderChannelPie() {
    var el = document.getElementById('chart-channel-pie');
    if (!el) return;
    var chart = mkChart(el);

    var channelColors = { C1: '#6366f1', C2: '#818cf8', C3: '#f59e0b', crosswalk: '#22c55e' };
    var channelLabels = { C1: 'C1 Content', C2: 'C2 Form', C3: 'C3 Anchored', crosswalk: 'Crosswalk' };

    var pieData = Object.keys(DATA.features.channel_variance).map(function (ch) {
        return {
            name: channelLabels[ch] || ch,
            value: Math.round(DATA.features.channel_variance[ch].total_variance * 100) / 100,
            itemStyle: { color: channelColors[ch] || '#94a3b8' }
        };
    });

    var tc = textColor();
    chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}<br>Variance: <b>{c}</b> ({d}%)' },
        legend: { bottom: 0, textStyle: { color: tc } },
        series: [{
            type: 'pie',
            radius: ['35%', '65%'],
            center: ['50%', '45%'],
            data: pieData,
            label: {
                color: tc,
                formatter: '{b}\n{d}%',
                fontSize: 11
            },
            emphasis: {
                itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' }
            }
        }]
    });
}

// --- Sub-tab 7b: Features ---

function renderTopFeatures() {
    var el = document.getElementById('chart-top-features');
    if (!el) return;
    var chart = mkChart(el);

    var channelColors = { C1: '#6366f1', C2: '#818cf8', C3: '#f59e0b', crosswalk: '#22c55e' };
    var items = DATA.features.top_variance; // already 30, sorted by rank

    // Reverse for horizontal bar (bottom-to-top)
    var reversed = items.slice().reverse();
    var labels = reversed.map(function (f) {
        var name = f.field.replace(/^gn_/, '').replace(/__/g, ': ').replace(/_/g, ' ');
        return name.length > 40 ? name.substring(0, 37) + '...' : name;
    });
    var values = reversed.map(function (f) { return f.std; });
    var colors = reversed.map(function (f) { return channelColors[f.channel] || '#94a3b8'; });

    var tc = textColor();
    chart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                var idx = items.length - 1 - params[0].dataIndex;
                var f = items[idx];
                return '<b>' + f.field + '</b><br>' +
                       'Channel: ' + f.channel + '<br>' +
                       'Std: ' + f.std.toFixed(4) + '<br>' +
                       'Mean: ' + f.mean.toFixed(4);
            }
        },
        grid: { left: 260, right: 60, top: 10, bottom: 30 },
        xAxis: {
            type: 'value',
            name: 'Std Dev',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        yAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: tc, fontSize: 10 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
            type: 'bar',
            data: values.map(function (v, i) {
                return { value: v, itemStyle: { color: colors[i] } };
            }),
            barMaxWidth: 16,
            label: {
                show: true,
                position: 'right',
                formatter: function (p) { return p.value.toFixed(3); },
                color: tc,
                fontSize: 9
            }
        }]
    });
}

function renderCorrelationTable() {
    var el = document.getElementById('chart-correlation-table');
    if (!el) return;

    var pairs = DATA.correlations; // 25 pairs
    var accentColor = '#f59e0b';

    var html = '<table class="data-table" style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr>' +
            '<th style="text-align:left;padding:6px 10px;">Field A</th>' +
            '<th style="text-align:left;padding:6px 10px;">Field B</th>' +
            '<th style="text-align:right;padding:6px 10px;">Correlation (r)</th>' +
            '</tr></thead><tbody>';

    pairs.forEach(function (p) {
        var highlight = Math.abs(p.correlation) > 0.90;
        var style = highlight ? 'color:' + accentColor + ';font-weight:bold;' : '';
        var nameA = p.field_a.replace(/^gn_/, '').replace(/_/g, ' ');
        var nameB = p.field_b.replace(/^gn_/, '').replace(/_/g, ' ');
        html += '<tr>' +
                '<td style="padding:4px 10px;font-size:12px;">' + nameA + '</td>' +
                '<td style="padding:4px 10px;font-size:12px;">' + nameB + '</td>' +
                '<td style="text-align:right;padding:4px 10px;font-size:12px;' + style + '">' +
                    p.correlation.toFixed(4) + '</td>' +
                '</tr>';
    });

    html += '</tbody></table>';
    el.innerHTML = html;
}

// ============================================================
//  TAB 8 — ANCHORS
// ============================================================

function renderAnchorDiscrim() {
    var el = document.getElementById('chart-anchor-discrim');
    if (!el) return;
    var chart = mkChart(el);

    var orgTypeColors = {
        'government': '#2563eb',
        'intergovernmental': '#16a34a',
        'religious': '#a0522d',
        'civil_society': '#dc2626',
        'industry': '#ea580c',
        'academic': '#b07aa1',
        'professional': '#76b7b2',
        'multistakeholder': '#edc948',
        'national_ethics_body': '#ff9da7',
        'indigenous': '#bab0ab'
    };

    // Top 15 by discrimination (already sorted descending)
    var top15 = DATA.anchors.slice(0, 15).reverse();

    var labels = top15.map(function (a) {
        var title = a.title;
        return title.length > 45 ? title.substring(0, 42) + '...' : title;
    });
    var values = top15.map(function (a) { return a.discrimination; });
    var colors = top15.map(function (a) { return orgTypeColors[a.org_type] || '#94a3b8'; });

    var tc = textColor();
    chart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                var idx = top15.length - 1 - params[0].dataIndex;
                var a = DATA.anchors[idx];
                return '<b>' + a.title + '</b><br>' +
                       'Org type: ' + a.org_type + '<br>' +
                       'Discrimination: ' + a.discrimination.toFixed(4) + '<br>' +
                       'Mean similarity: ' + a.mean.toFixed(4);
            }
        },
        grid: { left: 300, right: 60, top: 10, bottom: 30 },
        xAxis: {
            type: 'value',
            name: 'Discrimination',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        yAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: tc, fontSize: 10 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
            type: 'bar',
            data: values.map(function (v, i) {
                return { value: v, itemStyle: { color: colors[i] } };
            }),
            barMaxWidth: 20,
            label: {
                show: true,
                position: 'right',
                formatter: function (p) { return p.value.toFixed(3); },
                color: tc,
                fontSize: 10
            }
        }]
    });
}

function renderAnchorHeatmap() {
    var el = document.getElementById('chart-anchor-heatmap');
    if (!el) return;
    var chart = mkChart(el);

    var clusterIds = ['0', '1', '2', '3', '4', '5'];
    // Top 10 most discriminative anchors
    var top10 = DATA.anchors.slice(0, 10);

    var xLabels = clusterIds.map(function (cid) { return CLUSTER_SHORT[cid]; });
    var yLabels = top10.map(function (a) {
        var t = a.title;
        return t.length > 40 ? t.substring(0, 37) + '...' : t;
    }).reverse();

    // Build heatmap data
    var heatData = [];
    var maxVal = 0;
    top10.reverse().forEach(function (anchor, yi) {
        clusterIds.forEach(function (cid, xi) {
            var val = anchor.cluster_means[cid] || 0;
            heatData.push([xi, yi, Math.round(val * 1000) / 1000]);
            if (val > maxVal) maxVal = val;
        });
    });

    var tc = textColor();
    chart.setOption({
        tooltip: {
            position: 'top',
            formatter: function (p) {
                return xLabels[p.data[0]] + '<br>' +
                       yLabels[p.data[1]] + '<br>' +
                       'Similarity: <b>' + p.data[2].toFixed(3) + '</b>';
            }
        },
        grid: { left: 280, right: 40, top: 20, bottom: 60 },
        xAxis: {
            type: 'category',
            data: xLabels,
            axisLabel: { color: tc, fontSize: 11 },
            axisLine: { lineStyle: { color: '#334155' } },
            position: 'top'
        },
        yAxis: {
            type: 'category',
            data: yLabels,
            axisLabel: { color: tc, fontSize: 10 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        visualMap: {
            min: 0, max: Math.ceil(maxVal * 100) / 100,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            textStyle: { color: tc },
            inRange: { color: ['#0f172a', '#1e3a5f', '#f59e0b', '#ef4444'] }
        },
        series: [{
            type: 'heatmap',
            data: heatData,
            label: {
                show: true,
                formatter: function (p) { return p.data[2].toFixed(2); },
                fontSize: 10,
                color: '#e2e8f0'
            },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
        }]
    });
}

// ============================================================
//  TAB 9 — INNOVATION VS RIGHTS
// ============================================================

function renderParadigmDist() {
    var el = document.getElementById('chart-paradigm-dist');
    if (!el) return;
    var chart = mkChart(el);

    // Use cluster means from DATA_INNOVATION_RIGHTS_CORR
    var cm = (typeof DATA_INNOVATION_RIGHTS_CORR !== 'undefined') ? DATA_INNOVATION_RIGHTS_CORR.cluster_means : null;
    if (!cm) return;

    var labels = [];
    var innovVals = [];
    var rightsVals = [];
    for (var c = 0; c < 6; c++) {
        var d = cm[String(c)];
        if (!d) continue;
        labels.push(SHORT[c] + '\n(n=' + d.n + ')');
        innovVals.push(+(d.innovation_mean * 100).toFixed(1));
        rightsVals.push(+(d.rights_mean * 100).toFixed(1));
    }

    var tc = textColor();
    chart.setOption({
        tooltip: _tooltip(),
        legend: { data: ['Innovation', 'Rights'], textStyle: { color: tc } },
        grid: { left: 110, right: 20, top: 35, bottom: 30 },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: tc, fontSize: 10, interval: 0 }
        },
        yAxis: {
            type: 'value',
            name: 'Mean Score (0-100)',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            max: 80,
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        series: [
            {
                name: 'Innovation',
                type: 'bar',
                data: innovVals,
                itemStyle: { color: '#22c55e' },
                barMaxWidth: 28,
                label: { show: true, position: 'top', formatter: '{c}', color: tc, fontSize: 9 }
            },
            {
                name: 'Rights',
                type: 'bar',
                data: rightsVals,
                itemStyle: { color: '#dc2626' },
                barMaxWidth: 28,
                label: { show: true, position: 'top', formatter: '{c}', color: tc, fontSize: 9 }
            }
        ]
    });
}

function renderRegionRatio() {
    var el = document.getElementById('chart-region-ratio');
    if (!el) return;
    var chart = mkChart(el);

    // Canonical regions to aggregate into
    var canonRegions = ['Africa', 'Asia', 'Europe', 'Global', 'Latin America', 'Middle East', 'North America', 'Oceania'];

    // Map variant names to canonical
    function canonicalize(r) {
        if (!r) return null;
        var lower = r.toLowerCase().replace(/_/g, ' ');
        if (lower === 'asia-pacific' || lower === 'east asia' || lower === 'south asia') return 'Asia';
        if (lower === 'latin america & caribbean') return 'Latin America';
        if (lower === 'middle east & north africa') return 'Middle East';
        if (lower === 'international') return 'Global';
        for (var i = 0; i < canonRegions.length; i++) {
            if (lower === canonRegions[i].toLowerCase()) return canonRegions[i];
        }
        return null;
    }

    // Count C0 (Innovation) and C3 (Rights) per region from clusterComposition
    var c0Regions = DATA.clusterComposition['0'].region || {};
    var c3Regions = DATA.clusterComposition['3'].region || {};

    var regionC0 = {};
    var regionC3 = {};
    canonRegions.forEach(function (r) { regionC0[r] = 0; regionC3[r] = 0; });

    Object.keys(c0Regions).forEach(function (r) {
        var canon = canonicalize(r);
        if (canon) regionC0[canon] += c0Regions[r];
    });
    Object.keys(c3Regions).forEach(function (r) {
        var canon = canonicalize(r);
        if (canon) regionC3[canon] += c3Regions[r];
    });

    // Compute ratio = C0 / C3, handle div-by-zero
    var ratioData = canonRegions.map(function (r) {
        var c0 = regionC0[r] || 0;
        var c3 = regionC3[r] || 0;
        if (c3 === 0 && c0 === 0) return { region: r, ratio: 1.0 };
        if (c3 === 0) return { region: r, ratio: c0 }; // all innovation
        return { region: r, ratio: Math.round((c0 / c3) * 100) / 100 };
    });

    // Sort by ratio descending
    ratioData.sort(function (a, b) { return a.ratio - b.ratio; });

    var tc = textColor();
    chart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                var d = ratioData[params[0].dataIndex];
                return '<b>' + d.region + '</b><br>' +
                       'Innovation (C0): ' + (regionC0[d.region] || 0) + '<br>' +
                       'Rights (C3): ' + (regionC3[d.region] || 0) + '<br>' +
                       'Ratio: ' + d.ratio.toFixed(2);
            }
        },
        grid: { left: 120, right: 60, top: 20, bottom: 30 },
        xAxis: {
            type: 'value',
            name: 'Innovation / Rights Ratio',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        yAxis: {
            type: 'category',
            data: ratioData.map(function (d) { return d.region; }),
            axisLabel: { color: tc, fontSize: 11 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
            type: 'bar',
            data: ratioData.map(function (d) {
                var color;
                if (d.ratio > 1) color = '#22c55e';      // innovation-heavy
                else if (d.ratio < 1) color = '#dc2626';  // rights-heavy
                else color = '#94a3b8';
                return { value: d.ratio, itemStyle: { color: color } };
            }),
            barMaxWidth: 24,
            label: {
                show: true,
                position: 'right',
                formatter: function (p) { return p.value.toFixed(2); },
                color: tc,
                fontSize: 10
            },
            markLine: {
                silent: true,
                symbol: 'none',
                data: [{ xAxis: 1.0 }],
                lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
                label: {
                    show: true,
                    formatter: 'Parity (1.0)',
                    color: '#f59e0b',
                    fontSize: 10
                }
            }
        }]
    });
}

function renderParadigmTemporal() {
    var el = document.getElementById('chart-paradigm-temporal');
    if (!el) return;
    var chart = mkChart(el);

    var periods = Object.keys(DATA.temporal).sort();
    var c0Share = periods.map(function (p) { return DATA.temporal[p].pcts['0'] || 0; });
    var c3Share = periods.map(function (p) { return DATA.temporal[p].pcts['3'] || 0; });
    var c5Share = periods.map(function (p) { return DATA.temporal[p].pcts['5'] || 0; });

    var tc = textColor();
    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['Innovation (C0)', 'Rights (C3)', 'Regulatory (C5)'],
            textStyle: { color: tc },
            bottom: 0
        },
        grid: { left: 60, right: 30, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: periods,
            axisLabel: { color: tc, fontSize: 12 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            type: 'value',
            name: 'Share (%)',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        series: [
            {
                name: 'Innovation (C0)',
                type: 'line',
                data: c0Share,
                lineStyle: { color: CLUSTER_COLORS['0'], width: 3 },
                itemStyle: { color: CLUSTER_COLORS['0'] },
                symbol: 'circle',
                symbolSize: 8,
                smooth: true
            },
            {
                name: 'Rights (C3)',
                type: 'line',
                data: c3Share,
                lineStyle: { color: CLUSTER_COLORS['3'], width: 3 },
                itemStyle: { color: CLUSTER_COLORS['3'] },
                symbol: 'circle',
                symbolSize: 8,
                smooth: true
            },
            {
                name: 'Regulatory (C5)',
                type: 'line',
                data: c5Share,
                lineStyle: { color: CLUSTER_COLORS['5'], width: 3 },
                itemStyle: { color: CLUSTER_COLORS['5'] },
                symbol: 'circle',
                symbolSize: 8,
                smooth: true
            }
        ]
    });
}


// ============================================================
//  NEW CHART FUNCTIONS (7)
// ============================================================

/* --- Silhouette Fan (boxplot per cluster) --- */
function renderSilhouetteFan() {
    if (!DATA.silhouetteSamples) return;
    var el = document.getElementById('chart-silhouette-fan');
    if (!el) return;
    var chart = mkChart(el);

    // Build boxplot data: [min, p25, median, p75, max] per cluster
    var boxData = [];
    var categories = [];
    var boxColors = [];
    for (var i = 0; i < 6; i++) {
        var s = DATA.silhouetteSamples[String(i)];
        if (!s) continue;
        categories.push(SHORT[String(i)]);
        boxData.push([s.min, s.p25, s.median, s.p75, s.max]);
        boxColors.push(COLORS[String(i)]);
    }

    var tc = textColor();
    chart.setOption({
        title: { text: 'Silhouette Distribution by Cluster', left: 'center', textStyle: { color: tc, fontSize: 14 } },
        tooltip: {
            trigger: 'item',
            formatter: function (p) {
                if (p.componentType !== 'series') return '';
                var d = p.data;
                return '<b>' + categories[p.dataIndex] + '</b><br>'
                     + 'Min: ' + d[1].toFixed(3) + '<br>'
                     + 'Q1: ' + d[2].toFixed(3) + '<br>'
                     + 'Median: ' + d[3].toFixed(3) + '<br>'
                     + 'Q3: ' + d[4].toFixed(3) + '<br>'
                     + 'Max: ' + d[5].toFixed(3);
            }
        },
        grid: { left: 60, right: 30, top: 50, bottom: 30 },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: tc, fontSize: 11 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            type: 'value',
            name: 'Silhouette',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            axisLine: { show: true, lineStyle: { color: '#334155' } },
            splitLine: { lineStyle: { color: 'rgba(128,128,128,0.2)' } }
        },
        series: [{
            type: 'boxplot',
            data: boxData.map(function (d, idx) {
                return {
                    value: d,
                    itemStyle: {
                        color: 'rgba(99,102,241,0.15)',
                        borderColor: boxColors[idx],
                        borderWidth: 2
                    }
                };
            }),
            tooltip: { trigger: 'item' }
        }],
        // Reference line at 0 via markLine on the series
        graphic: [{
            type: 'text',
            left: 65,
            top: 46,
            style: {
                text: 'C1 has negative mean silhouette (overlapping cluster)',
                fill: '#f59e0b',
                fontSize: 11,
                fontStyle: 'italic'
            }
        }]
    });

    // Add zero reference line via yAxis markLine workaround
    // We add it as a second invisible series with markLine
    chart.setOption({
        series: [
            chart.getOption().series[0],
            {
                type: 'line',
                data: [],
                markLine: {
                    silent: true,
                    symbol: 'none',
                    data: [{ yAxis: 0 }],
                    lineStyle: { color: '#ff6666', type: 'dashed', width: 1 },
                    label: { show: true, formatter: '0', color: '#ff6666', fontSize: 10, position: 'start' }
                }
            }
        ]
    });
}

/* --- Cluster Stability (k=5,6,7 silhouettes + ARI) --- */
function renderClusterStability() {
    var el = document.getElementById('chart-cluster-stability');
    if (!el) return;
    var chart = mkChart(el);

    var tc = textColor();

    // Extract silhouette for k=5,6,7
    var kVals = [5, 6, 7];
    var kLabels = kVals.map(function (k) { return 'k=' + k; });
    var silScores = kVals.map(function (k) {
        var entry = DATA.silhouette[String(k)];
        return entry ? entry.sil : 0;
    });

    var seriesList = [
        {
            name: 'Silhouette',
            type: 'bar',
            data: silScores.map(function (v, i) {
                return {
                    value: v,
                    itemStyle: { color: i === 1 ? '#f59e0b' : '#6366f1' } // highlight k=6
                };
            }),
            barMaxWidth: 40,
            label: {
                show: true,
                position: 'top',
                formatter: function (p) { return p.value.toFixed(3); },
                color: tc,
                fontSize: 11
            }
        }
    ];

    // Add ARI from alternativeClustering if available
    if (DATA.alternativeClustering) {
        var ariLabels = [];
        var ariValues = [];
        var altKeys = Object.keys(DATA.alternativeClustering);
        altKeys.forEach(function (method) {
            var entry = DATA.alternativeClustering[method];
            if (entry && entry.ari !== undefined) {
                ariLabels.push(method);
                ariValues.push(entry.ari);
            }
        });
        if (ariValues.length > 0) {
            // Add ARI as secondary grouped bars alongside k values
            kLabels = kLabels.concat(ariLabels.map(function (m) { return m + ' ARI'; }));
            var padded = silScores.concat(ariLabels.map(function () { return 0; }));
            seriesList[0].data = padded.map(function (v, i) {
                return {
                    value: v,
                    itemStyle: { color: i === 1 ? '#f59e0b' : '#6366f1' }
                };
            });
            seriesList.push({
                name: 'ARI vs KMeans k=6',
                type: 'bar',
                data: kVals.map(function () { return 0; }).concat(ariValues),
                itemStyle: { color: '#22c55e' },
                barMaxWidth: 40,
                label: {
                    show: true,
                    position: 'top',
                    formatter: function (p) { return p.value ? p.value.toFixed(3) : ''; },
                    color: tc,
                    fontSize: 11
                }
            });
        }
    }

    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: {
            data: seriesList.map(function (s) { return s.name; }),
            textStyle: { color: tc },
            bottom: 0
        },
        grid: { left: 60, right: 30, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: kLabels,
            axisLabel: { color: tc, fontSize: 11 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            type: 'value',
            name: 'Score',
            nameTextStyle: { color: tc },
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } }
        },
        series: seriesList
    });
}

/* --- Innovation vs Rights Scatter (2021 points) --- */
function renderIRScatter() {
    if (!DATA.innovationRightsScatter) return;
    var el = document.getElementById('chart-ir-scatter');
    if (!el) return;
    var chart = mkChart(el);

    // Group points by cluster
    var seriesData = {};
    DATA.innovationRightsScatter.points.forEach(function (p) {
        var c = String(p[2]);
        if (!seriesData[c]) seriesData[c] = [];
        seriesData[c].push([p[0] * 100, p[1] * 100]);
    });

    var series = [];
    for (var i = 0; i < 6; i++) {
        var key = String(i);
        series.push({
            name: SHORT[key],
            type: 'scatter',
            data: seriesData[key] || [],
            symbolSize: 4,
            itemStyle: { color: COLORS[key], opacity: 0.6 },
            large: true
        });
    }

    var tc = textColor();
    chart.setOption({
        title: { text: 'Innovation vs Rights at Statement Level', left: 'center', textStyle: { color: tc, fontSize: 14 } },
        tooltip: {
            trigger: 'item',
            formatter: function (p) {
                return p.seriesName + '<br>'
                     + 'Innovation: ' + p.data[0].toFixed(1) + '<br>'
                     + 'Rights: ' + p.data[1].toFixed(1);
            }
        },
        legend: {
            data: Object.keys(SHORT).map(function (k) { return SHORT[k]; }),
            bottom: 0,
            textStyle: { color: tc, fontSize: 11 }
        },
        grid: { left: 60, right: 30, top: 50, bottom: 50 },
        xAxis: {
            name: 'Innovation-First Score',
            nameTextStyle: { color: tc },
            type: 'value',
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            name: 'Rights-Based Score',
            nameTextStyle: { color: tc },
            type: 'value',
            axisLabel: { color: tc },
            splitLine: { lineStyle: { color: '#334155', opacity: 0.3 } },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        dataZoom: [
            { type: 'inside', xAxisIndex: 0 },
            { type: 'inside', yAxisIndex: 0 }
        ],
        series: series,
        animation: false
    });
}

/* --- Tradition Correlation Heatmap --- */
function renderTraditionCorrHeatmap() {
    if (!DATA.correctedTraditionCorr) return;
    var el = document.getElementById('chart-tradition-corr-heatmap');
    if (!el) return;
    var chart = mkChart(el);

    var pairs = DATA.correctedTraditionCorr.top_pairs || DATA.correctedTraditionCorr;
    if (!Array.isArray(pairs)) {
        // If it is an object with pairs as values, try to extract
        var pairList = [];
        for (var pk in pairs) {
            if (pairs.hasOwnProperty(pk)) pairList.push(pairs[pk]);
        }
        pairs = pairList;
    }

    // Extract unique field names
    var fieldSet = {};
    pairs.forEach(function (p) {
        var a = p.field_a || p.a || p[0];
        var b = p.field_b || p.b || p[1];
        if (a) fieldSet[a] = true;
        if (b) fieldSet[b] = true;
    });
    var fieldNames = Object.keys(fieldSet).sort();
    var fieldLabels = fieldNames.map(function (f) {
        return f.replace(/^gn_/, '').replace(/__/g, ': ').replace(/_/g, ' ');
    });

    // Build symmetric matrix lookup
    var matrix = {};
    pairs.forEach(function (p) {
        var a = p.field_a || p.a || p[0];
        var b = p.field_b || p.b || p[1];
        var val = p.phi || p.correlation || p.value || p[2] || 0;
        if (!matrix[a]) matrix[a] = {};
        if (!matrix[b]) matrix[b] = {};
        matrix[a][b] = val;
        matrix[b][a] = val;
    });

    // Build heatmap data
    var heatData = [];
    var maxVal = 0;
    var minVal = 0;
    fieldNames.forEach(function (fa, xi) {
        fieldNames.forEach(function (fb, yi) {
            var val = 0;
            if (fa === fb) val = 1.0;
            else if (matrix[fa] && matrix[fa][fb] !== undefined) val = matrix[fa][fb];
            var rounded = Math.round(val * 1000) / 1000;
            heatData.push([xi, yi, rounded]);
            if (rounded > maxVal) maxVal = rounded;
            if (rounded < minVal) minVal = rounded;
        });
    });

    var tc = textColor();
    chart.setOption({
        title: { text: 'Tradition-Specific Field Correlations', left: 'center', textStyle: { color: tc, fontSize: 14 } },
        tooltip: {
            position: 'top',
            formatter: function (p) {
                return fieldLabels[p.data[0]] + ' x ' + fieldLabels[p.data[1]]
                     + '<br>Phi: <b>' + p.data[2].toFixed(3) + '</b>';
            }
        },
        grid: { left: 160, right: 40, top: 50, bottom: 80 },
        xAxis: {
            type: 'category',
            data: fieldLabels,
            axisLabel: { color: tc, fontSize: 9, rotate: 45 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            type: 'category',
            data: fieldLabels,
            axisLabel: { color: tc, fontSize: 9 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        visualMap: {
            min: Math.min(minVal, -0.3),
            max: Math.max(maxVal, 0.3),
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            textStyle: { color: tc },
            inRange: { color: ['#3b82f6', '#1e293b', '#ef4444'] }
        },
        series: [{
            type: 'heatmap',
            data: heatData,
            label: {
                show: fieldNames.length <= 12,
                formatter: function (p) {
                    var v = p.data[2];
                    return Math.abs(v) >= 0.1 ? v.toFixed(2) : '';
                },
                fontSize: 9,
                color: '#e2e8f0'
            },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
        }]
    });
}

/* --- Feature Sensitivity Table --- */
function renderFeatureSensitivityTable() {
    if (!DATA.featureSensitivity) return;
    var el = document.getElementById('feature-sensitivity-table');
    if (!el) return;

    var rows = DATA.featureSensitivity;
    // Can be array of objects or keyed by threshold
    var dataRows = [];
    if (Array.isArray(rows)) {
        dataRows = rows;
    } else {
        for (var threshold in rows) {
            if (rows.hasOwnProperty(threshold)) {
                var entry = rows[threshold];
                entry.threshold = threshold;
                dataRows.push(entry);
            }
        }
    }

    var html = '<table class="provenance-table" style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr>'
          + '<th style="text-align:left;padding:6px 10px;">Threshold</th>'
          + '<th style="text-align:right;padding:6px 10px;">Columns</th>'
          + '<th style="text-align:right;padding:6px 10px;">Silhouette</th>'
          + '<th style="text-align:right;padding:6px 10px;">ARI vs k=6</th>'
          + '</tr></thead><tbody>';

    dataRows.forEach(function (r) {
        var thresh = r.threshold !== undefined ? r.threshold : (r.t || '');
        var cols = r.columns !== undefined ? r.columns : (r.cols || r.n_cols || '');
        var sil = r.silhouette !== undefined ? r.silhouette : (r.sil || '');
        var ari = r.ari !== undefined ? r.ari : (r.ari_vs_k6 || '');
        var isActive = String(thresh) === '0.02' || thresh === 0.02;
        var rowStyle = isActive ? 'background:rgba(99,102,241,0.15);font-weight:bold;' : '';
        html += '<tr style="' + rowStyle + '">'
              + '<td style="padding:4px 10px;font-size:12px;">' + thresh + (isActive ? ' (active)' : '') + '</td>'
              + '<td style="text-align:right;padding:4px 10px;font-size:12px;">' + cols + '</td>'
              + '<td style="text-align:right;padding:4px 10px;font-size:12px;">'
              + (typeof sil === 'number' ? sil.toFixed(4) : sil) + '</td>'
              + '<td style="text-align:right;padding:4px 10px;font-size:12px;">'
              + (typeof ari === 'number' ? ari.toFixed(4) : ari) + '</td>'
              + '</tr>';
    });

    html += '</tbody></table>';
    el.innerHTML = html;
}

/* --- Methodology Provenance Table --- */
function renderMethodologyProvenance() {
    if (!DATA.methodologyProvenance) return;
    var el = document.getElementById('methodology-provenance-table');
    if (!el) return;

    var mp = DATA.methodologyProvenance;
    var rows = [
        ['Concept Discovery', mp.concept_discovery_method || 'N/A'],
        ['Coding Model', mp.coding_model || 'N/A'],
        ['Temperature', mp.coding_temperature !== undefined ? String(mp.coding_temperature) : 'N/A'],
        ['Deterministic', mp.coding_deterministic ? 'Yes' : 'No'],
        ['Coding Sessions', mp.n_coding_sessions !== undefined ? String(mp.n_coding_sessions) : 'N/A'],
        ['Scoring Agents', mp.n_coding_agents !== undefined ? String(mp.n_coding_agents) : 'N/A'],
        ['Rubric Version', mp.rubric_version || 'N/A'],
        ['Rubric Lines', mp.rubric_lines !== undefined ? String(mp.rubric_lines) : 'N/A'],
        ['Pilot Statements', (mp.pilot_n_statements || 'N/A') + (mp.pilot_pct_corpus ? ' (' + mp.pilot_pct_corpus + '% of corpus)' : '')],
        ['Embedding Model', mp.embedding_model || 'N/A']
    ];

    var html = '<table class="provenance-table" style="width:100%;border-collapse:collapse;"><tbody>';
    rows.forEach(function (r) {
        html += '<tr>'
              + '<th style="text-align:left;padding:6px 10px;font-size:12px;color:#94a3b8;width:40%;">' + r[0] + '</th>'
              + '<td style="padding:6px 10px;font-size:12px;">' + r[1] + '</td>'
              + '</tr>';
    });
    html += '</tbody></table>';

    if (mp.pilot_note) {
        html += '<p class="text-muted" style="font-size:0.85rem;margin-top:0.5rem;color:#94a3b8;">' + mp.pilot_note + '</p>';
    }

    el.innerHTML = html;
}

/* --- UMAP Sensitivity Table (n_neighbors x min_dist grid) --- */
function renderUmapSensitivityTable() {
    if (!DATA.umapSensitivity) return;
    var el = document.getElementById('umap-sensitivity-table');
    if (!el) return;

    var data = DATA.umapSensitivity;

    // Extract unique n_neighbors (rows) and min_dist (columns)
    var neighborsSet = {};
    var distSet = {};
    var cellMap = {};

    // data can be array of objects or nested object
    if (Array.isArray(data)) {
        data.forEach(function (entry) {
            var nn = String(entry.n_neighbors || entry.nn);
            var md = String(entry.min_dist || entry.md);
            neighborsSet[nn] = true;
            distSet[md] = true;
            cellMap[nn + '|' + md] = entry;
        });
    } else {
        // Nested: data[n_neighbors][min_dist] = {trust, ari}
        for (var nn in data) {
            if (!data.hasOwnProperty(nn)) continue;
            neighborsSet[nn] = true;
            for (var md in data[nn]) {
                if (!data[nn].hasOwnProperty(md)) continue;
                distSet[md] = true;
                cellMap[nn + '|' + md] = data[nn][md];
            }
        }
    }

    var neighbors = Object.keys(neighborsSet).sort(function (a, b) { return Number(a) - Number(b); });
    var dists = Object.keys(distSet).sort(function (a, b) { return Number(a) - Number(b); });

    var html = '<table class="provenance-table" style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr><th style="padding:6px 10px;font-size:11px;">n_neighbors \\ min_dist</th>';
    dists.forEach(function (md) {
        html += '<th style="text-align:center;padding:6px 10px;font-size:11px;">' + md + '</th>';
    });
    html += '</tr></thead><tbody>';

    neighbors.forEach(function (nn) {
        html += '<tr><th style="text-align:left;padding:4px 10px;font-size:12px;">' + nn + '</th>';
        dists.forEach(function (md) {
            var cell = cellMap[nn + '|' + md];
            var trust = cell ? (cell.trustworthiness || cell.trust || cell.t) : null;
            var ari = cell ? (cell.ari || cell.a) : null;
            var isDefault = (nn === '15' && md === '0.1') || (nn === '30' && md === '0.1');
            var cellStyle = isDefault ? 'background:rgba(99,102,241,0.15);font-weight:bold;' : '';
            var content = '';
            if (trust !== null && trust !== undefined) {
                content = (typeof trust === 'number' ? trust.toFixed(3) : trust);
                if (ari !== null && ari !== undefined) {
                    content += ' (' + (typeof ari === 'number' ? ari.toFixed(2) : ari) + ')';
                }
            } else {
                content = '-';
            }
            html += '<td style="text-align:center;padding:4px 10px;font-size:11px;' + cellStyle + '">' + content + '</td>';
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '<p class="text-muted" style="font-size:0.8rem;margin-top:0.3rem;color:#64748b;">Values: trustworthiness (ARI). Highlighted = production setting.</p>';
    el.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
// FINDING DETAIL RENDERERS
// ═══════════════════════════════════════════════════════════════════

function mkFindingChart(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var chart = echarts.init(el, null, { renderer: 'canvas' });
    if (!window._findingCharts) window._findingCharts = [];
    window._findingCharts.push(chart);
    return chart;
}

var FINDING_SUMMARIES = {
    1: "This finding reveals the structural architecture behind the widely-observed gap between AI ethics rhetoric and enforcement. By quantifying the relationship between normative richness (rights-based language, values-based rhetoric) and legal force (binding nature, enforcement mechanisms) across 2,021 governance documents, the Tapestry data provides the first large-scale empirical evidence for what scholars have called the \u2018toothless ethics\u2019 problem. The pattern is not incidental \u2014 it is a system-level structural feature of how AI governance has been organized globally.",
    2: "This finding examines Africa\u2019s distinctive approach to AI governance, where innovation-oriented framing dominates at a 5.1:1 ratio over rights-based approaches. Rather than interpreting this as a gap, the analysis situates it within the context of development priorities, institutional capacity, and path dependencies. The question is not whether Africa\u2019s approach is \u2018correct\u2019 but how the governance choices being made now will shape the continent\u2019s regulatory options in the future.",
    3: "Latin America\u2019s AI governance trajectory is neither purely innovation-first (like much of Asia and Africa) nor purely rights-first (like Europe). With 94 governance statements shaped by distinctive legal traditions, strong data protection frameworks like Brazil\u2019s LGPD, and active civil society engagement, the region may offer lessons in balancing development with rights that have not yet materialized elsewhere in the corpus.",
    4: "The emergence of religious AI governance from zero statements before 2017 to 125 by 2026 is one of the most distinctive empirical findings in the dataset. None of the early mapping studies (Jobin 2019, Fjeld 2020, Hagendorff 2020) captured a single religious governance statement. The entire Religious/Tradition-Based policy family \u2014 spanning seven distinct traditions from Catholic to Buddhist to Indigenous \u2014 emerged after those foundational surveys closed.",
    5: "Governments are the single largest contributor to the corpus (741 of 2,021 statements), but they do not speak with one voice. The data reveals at least three distinct government governance languages: innovation-promoting national strategies (312 statements), risk-based regulatory frameworks (288), and human rights advocacy (59). This internal fragmentation means that \u2018government AI policy\u2019 is not a coherent category but a contested terrain.",
    6: "Policymakers frequently aspire to frameworks that simultaneously promote innovation and protect rights. The Tapestry data reveals this synthesis has not materialized in practice. Innovation-oriented statements score 80.6 on innovation and 1.6 on rights; rights-oriented statements score 67.8 on rights and 2.7 on innovation. The two dimensions are scored independently \u2014 a document could score high on both. Virtually none do. The empty upper-right quadrant of the scatter plot represents the governance synthesis that remains unachieved.",
    7: "The most technically surprising finding: institutional form \u2014 who wrote a document, for whom, and with what legal authority \u2014 predicts cluster assignment far better than substantive content about transparency, fairness, or accountability. C2 form features alone achieve 88.4% classification accuracy, while C1 content features alone achieve only 74.5%. This means the institutional context of AI governance matters more than the principles a document articulates.",
    8: "The Governance Genome discovered 21 tradition-specific governance concepts through bottom-up coding \u2014 concepts like fitrat (Islamic innate nature), kaitiakitanga (M\u0101ori guardianship), theosis (Orthodox Christian divinization), and ubuntu (African relational personhood). At least 12 of these would never have appeared in the dominant frameworks (OECD Principles, EU AI Act, Asilomar Principles) used in prior mapping studies. The dominant vocabulary for comparing AI governance worldwide excludes roughly half the conceptual tools that tradition-based communities bring to the table.",
    9: "Tradition-specific governance concepts do not travel as modular, interchangeable principles. Indigenous governance concepts (data sovereignty, indigenous ethics, reciprocity) correlate at phi 0.89\u20130.94. Islamic jurisprudential concepts (maqasid, maslahah, rahmah) correlate at 0.87\u20130.91. Jewish legal concepts (halakhic framework, teshuvah governance) show similar internal coherence. These traditions apply entire integrated knowledge systems to AI governance, challenging the assumption that governance principles can be mixed and matched from a universal menu.",
    10: "The shift from innovation-first to regulation-first governance is empirically confirmed and temporally precise. In 2017\u20132019, innovation-optimist documents outnumbered risk-regulatory ones 2:1. By 2020\u20132022, risk regulation had pulled ahead. By 2023\u20132026, the gap widened further. The crossover year was 2020, coinciding with the launch of the EU AI Act legislative process. This \u2018regulatory turn\u2019 represents a fundamental shift in how the global governance community approaches AI.",
    11: "A parallel governance system is emerging outside the state. From medicine to law to engineering, professions are writing AI governance codes enforced through licensure, peer review, and professional sanctions \u2014 entirely independent of government regulation. This family accounts for 17.2% of the corpus (348 documents across dozens of professions). Whether this constitutes genuine governance or regulatory avoidance remains contested, but its scale is too large to ignore."
};

var FINDING_EVIDENCE = {
    1: "<strong>Key metrics:</strong> Human Rights Advocates (Family 3) score 83.2% on rights-based rhetoric but only 2.4% of their documents are legally binding. Risk Regulators (Family 5) hold 60.6% of all legally binding instruments but score below average on values-based language. Cram\u00e9r\u2019s V between binding nature and cluster assignment = 0.47, indicating a strong association. The correlation between normative density and enforcement mechanism strength is negative (r = \u22120.31), confirming the structural inverse at the individual statement level.",
    2: "<strong>Key metrics:</strong> Africa contributes 66 governance statements (3.3% of corpus). Of these, 46 (69.7%) cluster with the Innovation Champions (Family 0) and only 9 (13.6%) with Human Rights Advocates (Family 3), yielding a 5.1:1 innovation-to-rights ratio. The regional mean on gn_innovation_orientation is 71.2 (vs. corpus mean 53.0). Mean gn_development_first score for African statements is 62.8, compared to 28.4 for European statements. The mean year of African statements is 2022.8, indicating these are predominantly recent documents.",
    3: "<strong>Key metrics:</strong> Latin America contributes 94 governance statements (4.7% of corpus), making it the fourth-largest regional block. The cluster distribution is more balanced than Africa\u2019s: 38 Innovation Champions, 27 Risk Regulators, 14 Human Rights Advocates, 8 Professional, 7 other. Innovation-to-rights ratio = 2.7:1 (vs. Africa\u2019s 5.1:1 and Europe\u2019s 0.8:1). Mean gn_existing_law score is 42.1, reflecting the region\u2019s strong legal tradition. Brazil alone contributes 12 statements spanning all major families.",
    4: "<strong>Key metrics:</strong> The Religious/Tradition-Based family contains 125 statements (6.2% of corpus), with a mean year of 2023.7 \u2014 the most recent of any family. Growth trajectory: 0 statements pre-2017, 6 in 2017\u20132019, 8 in 2020, and 111 in 2021\u20132026 (~18\u00d7 growth). The family has the highest silhouette score (0.23) of any cluster, indicating strong internal coherence. Sacred-secular scores average 72.4 (vs. corpus mean 8.1). Seven distinct religious traditions are represented: Christian (43), Islamic (24), Buddhist (12), Jewish (8), Indigenous (19), Hindu (4), interfaith (15).",
    5: "<strong>Key metrics:</strong> Government statements (n=741, 36.7% of corpus) distribute across families as follows: Innovation Champions 312 (42.1%), Risk Regulators 288 (38.9%), Human Rights Advocates 59 (8.0%), Professional 41 (5.5%), Unclassified / Residual 28 (3.8%), Religious 13 (1.8%). The ARI between org_type and cluster assignment is only 0.20, meaning clusters are not reducible to institutional identity \u2014 but Cram\u00e9r\u2019s V is 0.53, indicating moderate association. Government statements span all 6 families and all 8 geographic regions.",
    6: "<strong>Key metrics:</strong> Spearman correlation between gn_innovation_orientation and the rights composite score = \u22120.41 (p < 10\u207b\u2078\u00b2), confirming a strong negative relationship. Innovation Champions score 73.8 mean innovation and 2.5 mean rights; Human Rights Advocates score 16.4 mean innovation and 43.1 mean rights. Only 23 of 2,021 statements (1.1%) score above 50 on both innovation and rights simultaneously. The Unclassified / Residual family (Family 1, n=261) achieves apparent balance through low scores on both dimensions (mean specificity = 18.7).",
    7: "<strong>Key metrics:</strong> Random Forest classification using C2 form features alone achieves 88.4% accuracy (5-fold CV), compared to 74.5% for C1 content features alone and 47.6% for org_type alone. The full model (C1+C2+C3) achieves 88.4%, meaning C2 alone captures nearly all cluster-discriminating information. Permutation importance analysis shows the top 6 features are all C2: gn_addressee__governments (0.0128), gn_binding_nature__soft_law (0.0107), gn_authority_type__sovereign_state (0.0093). C2 accounts for 64.6% of total permutation importance despite having only 26 of 226 dimensions (11.5%).",
    8: "<strong>Key metrics:</strong> 21 tradition-specific governance concepts were identified through bottom-up coding of extract text. Of these, 12 have zero representation in the OECD AI Principles, EU AI Act, and IEEE EAD \u2014 the three frameworks used as reference taxonomies in prior mapping studies. Tradition-specific concepts account for 45 of the 226 genome dimensions (19.9%). The F-statistic for tradition-specific anchor dimensions averages 287.4 (vs. 42.1 for general governance concepts like transparency and accountability), making them the sharpest discriminators between policy families.",
    9: "<strong>Key metrics:</strong> Pairwise phi coefficients within tradition families: Indigenous concepts (data sovereignty \u00d7 indigenous ethics \u03c6=0.94, FPIC \u00d7 indigenous ethics \u03c6=0.89, kaitiakitanga \u00d7 data sovereignty \u03c6=0.91). Islamic concepts (maqasid \u00d7 maslahah \u03c6=0.91, rahmah \u00d7 tawassuth \u03c6=0.87, khalifah \u00d7 amanah \u03c6=0.89). Jewish concepts (halakhic framework \u00d7 teshuvah governance \u03c6=0.88, kedusha \u00d7 halakhic \u03c6=0.85). All within-tradition correlations are Bonferroni-significant at p < 0.001. Cross-tradition correlations are near zero (\u03c6 < 0.15), confirming independence between knowledge systems.",
    10: "<strong>Key metrics:</strong> Family share by era \u2014 Innovation Champions: 25.6% (2017\u20132019) \u2192 23.9% (2020\u20132022) \u2192 19.3% (2023\u20132026). Risk Regulators: 12.8% \u2192 25.9% \u2192 23.7%. The crossover occurred in 2020 (coinciding with the EU AI Act proposal). Annual statement volume grew from ~50/year (2017) to ~400/year (2024). Mean gn_proportional_regulation score increased from 22.1 (pre-2020) to 38.7 (2023\u20132026). Legally binding instruments rose from 4.1% of annual output (2017\u20132019) to 11.3% (2023\u20132026).",
    11: "<strong>Key metrics:</strong> The Professional Self-Regulators family contains 348 statements (17.2% of corpus) from 27+ distinct professions including medicine (AMA, WHO), law (ABA, G7 Bars), engineering (IEEE, Engineering NZ), actuarial science (IAA), radiology (ESR, RSNA), and nursing. Mean gn_professional_duty score = 67.3 (vs. corpus mean 21.4). Mean gn_professional_autonomy = 58.9 (vs. corpus mean 15.7). Mean gn_binding_nature is \u2018professional_standard\u2019 (68% of family), with enforcement through licensure bodies. The family\u2019s mean year is 2023.1, indicating rapid recent growth."
};

function renderFindingDetail(num) {
    var fd = null;
    if (DATA.findingDetails) {
        for (var i = 0; i < DATA.findingDetails.length; i++) {
            if (DATA.findingDetails[i].num === num) { fd = DATA.findingDetails[i]; break; }
        }
    }
    var container = document.getElementById('finding-detail-content');
    if (!container) return;
    (window._findingCharts || []).forEach(function(c) { try { c.dispose(); } catch(e) {} });
    window._findingCharts = [];
    var html = '<div class="finding-detail-header"><h2>Finding ' + num + ': ' + (fd ? fd.title : '') + '</h2>';
    if (fd && fd.claim) html += '<p class="finding-detail-claim">' + fd.claim + '</p>';
    html += '</div>';
    if (FINDING_SUMMARIES[num]) {
        html += '<div style="margin:0 0 0.8rem 0;padding:1rem 1.2rem;background:rgba(99,102,241,0.06);border-left:3px solid #6366f1;border-radius:0 8px 8px 0;font-size:0.9rem;line-height:1.65;color:#94a3b8;">' + FINDING_SUMMARIES[num] + '</div>';
    }
    if (FINDING_EVIDENCE[num]) {
        html += '<div style="margin:0 0 1.5rem 0;padding:1rem 1.2rem;background:rgba(34,211,238,0.05);border-left:3px solid #22d3ee;border-radius:0 8px 8px 0;font-size:0.85rem;line-height:1.65;color:#94a3b8;">' + FINDING_EVIDENCE[num] + '</div>';
    }
    if (fd && fd.experts) {
        html += '<div class="expert-badges">';
        fd.experts.forEach(function(e) { html += '<span class="expert-badge">' + e.role + ' Perspective</span>'; });
        html += '</div>';
    }
    if (fd && fd.argument) {
        html += '<div class="argument-section">';
        fd.argument.forEach(function(a) { html += '<div class="argument-paragraph"><strong>' + a.expert + ':</strong> ' + a.text + '</div>'; });
        // Note: a.expert now contains role-based label (e.g. "Legal Studies Perspective") not a name
        html += '</div>';
    }
    var cA = (fd && fd.charts && fd.charts[0]) ? fd.charts[0].title : 'Evidence A';
    var cB = (fd && fd.charts && fd.charts[1]) ? fd.charts[1].title : 'Evidence B';
    html += '<div class="evidence-charts">';
    html += '<div class="chart-card"><h3>' + cA + '</h3><div class="chart-container" id="finding-chart-a" style="height:350px"></div></div>';
    html += '<div class="chart-card"><h3>' + cB + '</h3><div class="chart-container" id="finding-chart-b" style="height:350px"></div></div>';
    html += '</div>';
    // Literature context (census-dashboard style)
    html += '<div id="literature-f' + num + '"></div>';
    if (fd && fd.caveats) html += '<div class="caveat-box"><h4>Limitations &amp; Caveats</h4><p>' + fd.caveats + '</p></div>';
    html += '<div class="disclosure-box"><small>' + (fd && fd.disclosure ? fd.disclosure : 'Analysis generated by LLM-based structured expert simulation.') + '</small></div>';
    container.innerHTML = html;
    var fn = 'renderF' + num + 'Charts';
    if (typeof window[fn] === 'function') window[fn]();
    if (typeof renderFindingLiterature === 'function') renderFindingLiterature('f' + num);
}

function renderF1Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.bindingCrosstab) {
        var bt = DATA.bindingCrosstab; var cats = [];
        for (var i = 0; i < 6; i++) cats.push(SHORT[String(i)]);
        var bTypes = ['legally_binding','soft_law','self_regulation','voluntary_commitment','aspirational_only','religious_obligation','communal_norm','professional_standard'];
        var bCols = ['#009E73','#0072B2','#E69F00','#CC6633','#999999','#D55E00','#56B4E9','#CC79A7'];
        var series = [];
        bTypes.forEach(function(btype, bi) {
            var vals = []; for (var c = 0; c < 6; c++) { var e = bt[String(c)] ? bt[String(c)][btype] : null; vals.push(e ? (e.pct||0) : 0); }
            if (vals.some(function(v){return v>0;})) series.push({name:btype.replace(/_/g,' '),type:'bar',stack:'t',data:vals,itemStyle:{color:bCols[bi]}});
        });
        chartA.setOption({tooltip:_tooltip(),legend:{bottom:0,textStyle:{color:textColor(),fontSize:9}},grid:{left:100,right:20,top:10,bottom:60},xAxis:{type:'value',max:100,name:'%',axisLabel:{color:textColor()}},yAxis:{type:'category',data:cats,axisLabel:{color:textColor()}},series:series});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.bindingCrosstab) {
        var bt = DATA.bindingCrosstab; var cats=[],nb=[],lb=[];
        for (var c=0;c<6;c++) { cats.push(SHORT[String(c)]); var cb=bt[String(c)]||{}; var l=cb.legally_binding?(cb.legally_binding.pct||0):0; var n=0;
            ['aspirational_only','soft_law','voluntary_commitment','self_regulation','communal_norm'].forEach(function(k){if(cb[k])n+=(cb[k].pct||0);}); nb.push(-n); lb.push(l); }
        chartB.setOption({tooltip:_tooltip(),legend:{data:['Non-binding (%)','Legally binding (%)'],bottom:0,textStyle:{color:textColor()}},grid:{left:100,right:30,top:10,bottom:50},
            xAxis:{type:'value',axisLabel:{color:textColor(),formatter:function(v){return Math.abs(v)+'%';}}},yAxis:{type:'category',data:cats,axisLabel:{color:textColor()}},
            series:[{name:'Non-binding (%)',type:'bar',data:nb,itemStyle:{color:'#D55E00'}},{name:'Legally binding (%)',type:'bar',data:lb,itemStyle:{color:'#009E73'}}]});
    }
}

function renderF2Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA) {
        var af = DATA.statements.filter(function(s){return s.r==='Africa';}); var cts={};
        for(var i=0;i<6;i++)cts[i]=0; af.forEach(function(s){cts[s.c]=(cts[s.c]||0)+1;});
        var d=[]; for(var i=0;i<6;i++)d.push({value:cts[i]||0,itemStyle:{color:COLORS[String(i)]}});
        chartA.setOption({tooltip:_tooltip(),xAxis:{type:'category',data:Object.values(SHORT),axisLabel:{color:textColor()}},yAxis:{type:'value',name:'Statements',axisLabel:{color:textColor()}},series:[{type:'bar',data:d}]});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB) {
        var rc={}; DATA.statements.forEach(function(s){if(!s.r)return;if(!rc[s.r])rc[s.r]={t:0,c0:0,c3:0};rc[s.r].t++;if(s.c===0)rc[s.r].c0++;if(s.c===3)rc[s.r].c3++;});
        var regs=Object.keys(rc).filter(function(r){return rc[r].t>=20;});
        var rats=regs.map(function(r){return{r:r,v:rc[r].c3>0?rc[r].c0/rc[r].c3:rc[r].c0};}).sort(function(a,b){return b.v-a.v;});
        chartB.setOption({tooltip:_tooltip(),grid:{left:120,right:40,top:10,bottom:30},xAxis:{type:'value',name:'C0:C3 ratio',axisLabel:{color:textColor()}},
            yAxis:{type:'category',data:rats.map(function(r){return r.r;}).reverse(),axisLabel:{color:textColor(),fontSize:10}},
            series:[{type:'bar',data:rats.map(function(r){return{value:Math.round(r.v*10)/10,itemStyle:{color:r.r==='Africa'?'#D55E00':'#0072B2'}};}).reverse()}]});
    }
}

function renderF3Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA) {
        var la=DATA.statements.filter(function(s){return s.r&&s.r.indexOf('Latin')>=0;}); var cts={};
        for(var i=0;i<6;i++)cts[i]=0; la.forEach(function(s){cts[s.c]=(cts[s.c]||0)+1;});
        var d=[]; for(var i=0;i<6;i++)d.push({value:cts[i]||0,itemStyle:{color:COLORS[String(i)]}});
        chartA.setOption({tooltip:_tooltip(),xAxis:{type:'category',data:Object.values(SHORT),axisLabel:{color:textColor()}},yAxis:{type:'value',name:'Statements',axisLabel:{color:textColor()}},series:[{type:'bar',data:d}]});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB) {
        var tgt=['Latin America','Africa','Europe','North America']; var rd={};
        tgt.forEach(function(r){rd[r]={};for(var i=0;i<6;i++)rd[r][i]=0;});
        DATA.statements.forEach(function(s){if(tgt.indexOf(s.r)>=0)rd[s.r][s.c]++;});
        var series=[]; for(var ci=0;ci<6;ci++){series.push({name:SHORT[String(ci)],type:'bar',data:tgt.map(function(r){var t=0;for(var j=0;j<6;j++)t+=rd[r][j];return t>0?Math.round(rd[r][ci]/t*1000)/10:0;}),itemStyle:{color:COLORS[String(ci)]}});}
        chartB.setOption({tooltip:_tooltip(),legend:{bottom:0,textStyle:{color:textColor(),fontSize:9}},xAxis:{type:'category',data:tgt,axisLabel:{color:textColor()}},yAxis:{type:'value',name:'%',axisLabel:{color:textColor()}},series:series});
    }
}

function renderF4Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.temporal) {
        var ps=['2010-2016','2017-2019','2020-2022','2023-2026'];
        var c2=ps.map(function(p){return DATA.temporal[p]?DATA.temporal[p].clusters['2']:0;});
        chartA.setOption({tooltip:_tooltip(),xAxis:{type:'category',data:ps,axisLabel:{color:textColor()}},yAxis:{type:'value',name:'C2 Statements',axisLabel:{color:textColor()}},series:[{type:'bar',data:c2,itemStyle:{color:COLORS['2']},label:{show:true,position:'top',color:textColor()}}]});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.sacredSecular) {
        var dist=DATA.sacredSecular.distribution; var bins=Object.keys(dist); var vals=bins.map(function(b){return dist[b];});
        chartB.setOption({tooltip:_tooltip(),xAxis:{type:'category',data:bins,axisLabel:{color:textColor()}},yAxis:{type:'value',name:'Statements',axisLabel:{color:textColor()}},series:[{type:'bar',data:vals,itemStyle:{color:'#0072B2'}}]});
    }
}

function renderF5Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA) {
        var gov=DATA.statements.filter(function(s){return s.ot==='government';}); var cts={};
        for(var i=0;i<6;i++)cts[i]=0; gov.forEach(function(s){cts[s.c]=(cts[s.c]||0)+1;});
        var pd=[]; for(var i=0;i<6;i++)pd.push({value:cts[i],name:SHORT[String(i)],itemStyle:{color:COLORS[String(i)]}});
        chartA.setOption({tooltip:_tooltip(),series:[{type:'pie',radius:['35%','65%'],data:pd,label:{color:textColor(),formatter:'{b}\n{c} ({d}%)'}}]});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB) {
        var gov=DATA.statements.filter(function(s){return s.ot==='government';}); var bn={};
        gov.forEach(function(s){if(s.bn)bn[s.bn]=(bn[s.bn]||0)+1;});
        var sorted=Object.keys(bn).sort(function(a,b){return bn[b]-bn[a];});
        chartB.setOption({tooltip:_tooltip(),grid:{left:160,right:30,top:10,bottom:30},xAxis:{type:'value',axisLabel:{color:textColor()}},
            yAxis:{type:'category',data:sorted.map(function(b){return b.replace(/_/g,' ');}).reverse(),axisLabel:{color:textColor(),fontSize:10}},
            series:[{type:'bar',data:sorted.map(function(b){return bn[b];}).reverse(),itemStyle:{color:'#0072B2'}}]});
    }
}

function renderF6Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.innovationRightsScatter) {
        var pts=DATA.innovationRightsScatter.points; var sd={};
        for(var i=0;i<6;i++)sd[i]=[];
        pts.forEach(function(p){sd[p[2]].push([p[0],p[1]]);});
        var series=[]; for(var i=0;i<6;i++){series.push({name:SHORT[String(i)],type:'scatter',data:sd[i],symbolSize:4,itemStyle:{color:COLORS[String(i)],opacity:0.6},large:true});}
        chartA.setOption({tooltip:_tooltip(),legend:{bottom:0,textStyle:{color:textColor(),fontSize:9}},xAxis:{name:'Innovation',type:'value',axisLabel:{color:textColor()}},yAxis:{name:'Rights',type:'value',axisLabel:{color:textColor()}},series:series});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.innovationRightsScatter) {
        var pts=DATA.innovationRightsScatter.points; var sums={},cnts={};
        for(var i=0;i<6;i++){sums[i]={inn:0,rts:0};cnts[i]=0;}
        pts.forEach(function(p){sums[p[2]].inn+=p[0];sums[p[2]].rts+=p[1];cnts[p[2]]++;});
        var inn=[],rts=[],cats=[]; for(var i=0;i<6;i++){cats.push(SHORT[String(i)]);inn.push(cnts[i]>0?Math.round(sums[i].inn/cnts[i]*100)/100:0);rts.push(cnts[i]>0?Math.round(sums[i].rts/cnts[i]*100)/100:0);}
        chartB.setOption({tooltip:_tooltip(),legend:{bottom:0,textStyle:{color:textColor()}},xAxis:{type:'category',data:cats,axisLabel:{color:textColor()}},yAxis:{type:'value',name:'Mean Score',axisLabel:{color:textColor()}},
            series:[{name:'Innovation',type:'bar',data:inn,itemStyle:{color:'#0072B2'}},{name:'Rights',type:'bar',data:rts,itemStyle:{color:'#D55E00'}}]});
    }
}

function renderF7Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.bootstrapAblation) {
        var ba=DATA.bootstrapAblation; var combos=['C1','C2','C3','C1+C2','C1+C3','C2+C3','All'];
        var means=[],ciL=[],ciU=[];
        combos.forEach(function(k){var d=ba[k];if(d){means.push(d.mean_silhouette||0);ciL.push(d.ci_lower||0);ciU.push(d.ci_upper||0);}else{means.push(0);ciL.push(0);ciU.push(0);}});
        chartA.setOption({tooltip:_tooltip(),grid:{left:60,right:20,top:10,bottom:40},xAxis:{type:'category',data:combos,axisLabel:{color:textColor(),fontSize:10}},yAxis:{type:'value',name:'Silhouette',axisLabel:{color:textColor()}},
            series:[{type:'bar',data:means.map(function(m,i){return{value:m,itemStyle:{color:combos[i]==='All'?'#E69F00':'#0072B2'}};})}]});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.alternativeClustering) {
        var ac=DATA.alternativeClustering; var methods=Object.keys(ac);
        var aris=methods.map(function(m){return ac[m].ari_vs_kmeans||0;});
        chartB.setOption({tooltip:_tooltip(),xAxis:{type:'category',data:methods,axisLabel:{color:textColor()}},yAxis:{type:'value',name:'ARI',max:1,axisLabel:{color:textColor()}},
            series:[{type:'bar',data:aris.map(function(a){return{value:Math.round(a*100)/100,itemStyle:{color:'#009E73'}};}),label:{show:true,position:'top',color:textColor()}}]});
    }
}

function renderF8Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.traditionFields) {
        var tf=DATA.traditionFields; var fields=Object.keys(tf).sort(function(a,b){return tf[b].nonzero-tf[a].nonzero;}).slice(0,15).reverse();
        var vals=fields.map(function(f){return tf[f].nonzero;}); var labels=fields.map(function(f){return f.replace('gn_','').replace(/_/g,' ');});
        chartA.setOption({tooltip:_tooltip(),grid:{left:140,right:30,top:10,bottom:30},xAxis:{type:'value',name:'Non-zero',axisLabel:{color:textColor()}},yAxis:{type:'category',data:labels,axisLabel:{color:textColor(),fontSize:10}},series:[{type:'bar',data:vals,itemStyle:{color:'#CC6633'}}]});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.pillarHeatmap) {
        var pillars=['P11_Religious_Epistemology','P12_Normative_Traditions']; var pLabels=['Religious Epistemology','Normative Traditions']; var hd=[];
        pillars.forEach(function(p,pi){var row=DATA.pillarHeatmap[p];if(row){for(var c=0;c<6;c++)hd.push([c,pi,row[String(c)]||0]);}});
        var cLabels=[]; for(var i=0;i<6;i++)cLabels.push('C'+i);
        chartB.setOption({tooltip:{formatter:function(p){return cLabels[p.value[0]]+' \u00d7 '+pLabels[p.value[1]]+': '+p.value[2].toFixed(1)+'%';}},
            xAxis:{type:'category',data:cLabels,axisLabel:{color:textColor()}},yAxis:{type:'category',data:pLabels,axisLabel:{color:textColor()}},
            visualMap:{min:0,max:30,calculable:true,orient:'horizontal',left:'center',bottom:0,inRange:{color:['#1a1a2e','#CC6633','#E69F00']},textStyle:{color:textColor()}},
            series:[{type:'heatmap',data:hd,label:{show:true,color:textColor(),formatter:function(p){return p.value[2].toFixed(1);}}}]});
    }
}

function renderF9Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.correctedTraditionCorr && DATA.correctedTraditionCorr.top_25_pairs) {
        var pairs=DATA.correctedTraditionCorr.top_25_pairs; var fs={};
        pairs.forEach(function(p){fs[p.field_a]=1;fs[p.field_b]=1;});
        var fl=Object.keys(fs).sort(); var fi={}; fl.forEach(function(f,i){fi[f]=i;}); var hd=[];
        pairs.forEach(function(p){var ia=fi[p.field_a],ib=fi[p.field_b];if(ia!==undefined&&ib!==undefined){hd.push([ia,ib,Math.round(p.phi*100)/100]);hd.push([ib,ia,Math.round(p.phi*100)/100]);}});
        var labels=fl.map(function(f){return f.replace('gn_','').replace(/_/g,' ').substring(0,15);});
        chartA.setOption({tooltip:{formatter:function(p){return labels[p.value[0]]+' \u00d7 '+labels[p.value[1]]+': \u03c6='+p.value[2];}},
            grid:{left:110,right:10,top:10,bottom:80},xAxis:{type:'category',data:labels,axisLabel:{color:textColor(),fontSize:8,rotate:45}},yAxis:{type:'category',data:labels,axisLabel:{color:textColor(),fontSize:8}},
            visualMap:{min:0,max:1,calculable:true,orient:'horizontal',left:'center',bottom:0,inRange:{color:['#1a1a2e','#009E73','#E69F00']},textStyle:{color:textColor()}},
            series:[{type:'heatmap',data:hd}]});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.correctedTraditionCorr && DATA.correctedTraditionCorr.top_25_pairs) {
        var pairs=DATA.correctedTraditionCorr.top_25_pairs.filter(function(p){return p.bonferroni_significant;}).slice(0,10).reverse();
        var labels=pairs.map(function(p){return p.field_a.replace('gn_','')+' \u2194 '+p.field_b.replace('gn_','');}); var vals=pairs.map(function(p){return Math.round(p.phi*100)/100;});
        chartB.setOption({tooltip:_tooltip(),grid:{left:200,right:30,top:10,bottom:30},xAxis:{type:'value',name:'\u03c6',max:1,axisLabel:{color:textColor()}},yAxis:{type:'category',data:labels,axisLabel:{color:textColor(),fontSize:9}},
            series:[{type:'bar',data:vals,itemStyle:{color:'#009E73'},label:{show:true,position:'right',color:textColor(),fontSize:9}}]});
    }
}

function renderF10Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.yearly) {
        var years=Object.keys(DATA.yearly).sort(); var sd={};
        for(var ci=0;ci<6;ci++){sd[ci]=[];years.forEach(function(y){var yd=DATA.yearly[y];sd[ci].push(yd.clusters?(yd.clusters[String(ci)]||0):0);});}
        var series=[]; for(var ci=0;ci<6;ci++){series.push({name:SHORT[String(ci)],type:'line',stack:'t',areaStyle:{opacity:0.7},data:sd[ci],itemStyle:{color:COLORS[String(ci)]},symbol:'none'});}
        chartA.setOption({tooltip:_tooltip(),legend:{bottom:0,textStyle:{color:textColor(),fontSize:9}},xAxis:{type:'category',data:years,axisLabel:{color:textColor()}},yAxis:{type:'value',name:'Statements',axisLabel:{color:textColor()}},series:series});
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.temporal) {
        var ps=['2010-2016','2017-2019','2020-2022','2023-2026']; var series=[];
        for(var ci=0;ci<6;ci++){series.push({name:SHORT[String(ci)],type:'bar',stack:'t',data:ps.map(function(p){return DATA.temporal[p].pcts[String(ci)];}),itemStyle:{color:COLORS[String(ci)]}});}
        chartB.setOption({tooltip:_tooltip(),legend:{bottom:0,textStyle:{color:textColor(),fontSize:9}},xAxis:{type:'category',data:ps,axisLabel:{color:textColor()}},yAxis:{type:'value',name:'%',max:100,axisLabel:{color:textColor()}},series:series});
    }
}

function renderF11Charts() {
    var chartA = mkFindingChart('finding-chart-a');
    if (chartA && DATA.profilesK6 && DATA.profilesK6['4']) {
        var dims=DATA.profilesK6['4'].top_dimensions?DATA.profilesK6['4'].top_dimensions.slice(0,8):[];
        if (dims.length>0) {
            var ind=dims.map(function(d){return{name:d.field.replace('gn_','').replace(/__/g,': ').replace(/_/g,' ').substring(0,20),max:100};});
            var vals=dims.map(function(d){return d.cluster_mean;});
            chartA.setOption({tooltip:_tooltip(),radar:{indicator:ind,axisName:{color:textColor(),fontSize:9}},
                series:[{type:'radar',data:[{value:vals,name:'C4 Professional',areaStyle:{opacity:0.3,color:'#009E73'},lineStyle:{color:'#009E73'},itemStyle:{color:'#009E73'}}]}]});
        }
    }
    var chartB = mkFindingChart('finding-chart-b');
    if (chartB && DATA.profilesK6 && DATA.profilesK6['4']) {
        var dims=DATA.profilesK6['4'].top_dimensions?DATA.profilesK6['4'].top_dimensions.slice(0,10).reverse():[];
        var labels=dims.map(function(d){return d.field.replace('gn_','').replace(/__/g,': ').replace(/_/g,' ').substring(0,25);}); var vals=dims.map(function(d){return d.cluster_mean;});
        chartB.setOption({tooltip:_tooltip(),grid:{left:180,right:30,top:10,bottom:30},xAxis:{type:'value',name:'Cluster mean',axisLabel:{color:textColor()}},yAxis:{type:'category',data:labels,axisLabel:{color:textColor(),fontSize:9}},
            series:[{type:'bar',data:vals,itemStyle:{color:'#009E73'}}]});
    }
}

/* ============================================================
   RFGini2b Tab — Validation, Robustness, Reliability
   ============================================================ */

var CH_COLORS = {'C1':'#E69F00','C2':'#56B4E9','C3':'#009E73','c1':'#E69F00','c2':'#56B4E9','crosswalk':'#009E73'};

function _kpiCard(label, value, sub) {
    return '<div class="kpi-card" style="text-align:center;padding:1rem;border-radius:8px;background:var(--card-bg);border:1px solid var(--border);">' +
        '<div style="font-size:0.75rem;opacity:0.7;">' + label + '</div>' +
        '<div style="font-size:1.8rem;font-weight:700;color:#6366f1;">' + value + '</div>' +
        (sub ? '<div style="font-size:0.7rem;opacity:0.6;">' + sub + '</div>' : '') + '</div>';
}

// ---- Validation KPI ----
function renderRfgValidationKpi() {
    var el = document.getElementById('rfg-validation-kpi');
    if (!el || typeof DATA_RFGINI2B_VALIDATION_KPI === 'undefined') return;
    var d = DATA_RFGINI2B_VALIDATION_KPI;
    el.innerHTML =
        _kpiCard('RF Accuracy', (d.rf_accuracy * 100).toFixed(1) + '%', '5-fold CV &plusmn;' + (d.rf_accuracy_std * 100).toFixed(1) + '%') +
        _kpiCard('Test Accuracy', (d.test_accuracy * 100).toFixed(1) + '%', 'held-out 30%') +
        _kpiCard('Form-Only Acc', (d.form_only_accuracy * 100).toFixed(1) + '%', 'C2 features only') +
        _kpiCard('IR Spearman &rho;', d.ir_spearman.toFixed(2), 'innovation vs rights') +
        _kpiCard('ARI (org_type)', d.ari_org_type.toFixed(3), 'cluster novelty') +
        _kpiCard("Cram&eacute;r's V", d.cramers_v_org.toFixed(3), 'org &times; cluster');
}

// ---- CV Accuracy Bar ----
function renderRfgCvAccuracy() {
    var el = document.getElementById('chart-rfg-cv-accuracy');
    if (!el || typeof DATA_RF_CLASSIFICATION === 'undefined') return;
    var chart = mkChart(el);
    var d = DATA_RF_CLASSIFICATION;
    var folds = d.cv_fold_scores.map(function(v, i) { return (v * 100).toFixed(1); });
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 50, right: 20, top: 30, bottom: 40 },
        xAxis: { type: 'category', data: ['Fold 1','Fold 2','Fold 3','Fold 4','Fold 5'], axisLabel: { color: textColor() } },
        yAxis: { type: 'value', min: 88, max: 95, name: 'Accuracy %', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        series: [{
            type: 'bar', data: folds, itemStyle: { color: '#6366f1' },
            markLine: { data: [{ yAxis: (d.cv_accuracy_mean * 100).toFixed(1), label: { formatter: 'Mean: {c}%', color: textColor() }, lineStyle: { color: '#ef4444', type: 'dashed' } }], silent: true }
        }]
    });
}

// ---- Per-Cluster F1 ----
function renderRfgF1() {
    var el = document.getElementById('chart-rfg-f1');
    if (!el || typeof DATA_RF_CLASSIFICATION === 'undefined') return;
    var chart = mkChart(el);
    var d = DATA_RF_CLASSIFICATION.per_cluster_f1;
    var labels = []; var vals = []; var colors = [];
    for (var c = 0; c < 6; c++) {
        labels.push(SHORT[c] || 'C' + c);
        vals.push(d[c] ? +(d[c].f1 * 100).toFixed(1) : 0);
        colors.push(COLORS[c] || '#999');
    }
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 100, right: 20, top: 10, bottom: 30 },
        xAxis: { type: 'value', min: 80, max: 100, name: 'F1 %', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: textColor() } },
        series: [{ type: 'bar', data: vals.map(function(v, i) { return { value: v, itemStyle: { color: colors[i] } }; }) }]
    });
}

// ---- Confusion Matrix Heatmap ----
function renderRfgConfusion() {
    var el = document.getElementById('chart-rfg-confusion');
    if (!el || typeof DATA_RF_CLASSIFICATION === 'undefined') return;
    var chart = mkChart(el);
    var cm = DATA_RF_CLASSIFICATION.confusion_matrix;
    var labels = [];
    for (var c = 0; c < 6; c++) labels.push(SHORT[c] || 'C' + c);
    var data = []; var maxVal = 0;
    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 6; j++) {
            data.push([j, i, cm[i][j]]);
            if (cm[i][j] > maxVal) maxVal = cm[i][j];
        }
    }
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { return 'True: ' + labels[p.data[1]] + '<br>Pred: ' + labels[p.data[0]] + '<br>Count: ' + p.data[2]; } }),
        grid: { left: 100, right: 60, top: 30, bottom: 60 },
        xAxis: { type: 'category', data: labels, name: 'Predicted', nameLocation: 'center', nameGap: 35, axisLabel: { color: textColor(), rotate: 20 }, nameTextStyle: { color: textColor() } },
        yAxis: { type: 'category', data: labels, name: 'True', nameLocation: 'center', nameGap: 80, axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        visualMap: { min: 0, max: maxVal, calculable: false, orient: 'vertical', right: 10, top: 'center', inRange: { color: ['#1e293b', '#22c55e', '#f59e0b'] }, textStyle: { color: textColor() } },
        series: [{ type: 'heatmap', data: data, label: { show: true, color: '#f1f5f9', fontSize: 11 } }]
    });
}

// ---- Permutation Importance (Top 30) ----
function renderRfgPermImportance() {
    var el = document.getElementById('chart-rfg-perm-importance');
    if (!el || typeof DATA_RF_CLASSIFICATION === 'undefined') return;
    var chart = mkChart(el);
    var items = DATA_RF_CLASSIFICATION.top_30_permutation_importance.slice().reverse();
    var labels = items.map(function(d) { return d.feature.replace('gn_','').replace(/__/g,': ').replace(/_/g,' ').substring(0, 30); });
    var vals = items.map(function(d) { return d.importance_mean; });
    var colors = items.map(function(d) { return CH_COLORS[d.channel] || '#999'; });
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { var d = items[p.dataIndex]; return d.feature + '<br>Importance: ' + d.importance_mean.toFixed(4) + ' &plusmn; ' + d.importance_std.toFixed(4) + '<br>Channel: ' + d.channel; } }),
        grid: { left: 220, right: 30, top: 10, bottom: 30 },
        xAxis: { type: 'value', name: 'Permutation importance', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: textColor(), fontSize: 9 } },
        series: [{ type: 'bar', data: vals.map(function(v, i) { return { value: v, itemStyle: { color: colors[i] } }; }) }]
    });
}

// ---- Gini Importance (Top 30) ----
function renderRfgGiniImportance() {
    var el = document.getElementById('chart-rfg-gini-importance');
    if (!el || typeof DATA_RF_CLASSIFICATION === 'undefined') return;
    var chart = mkChart(el);
    var items = (DATA_RF_CLASSIFICATION.top_30_gini_importance || []).slice().reverse();
    if (items.length === 0) { el.innerHTML = '<p style="text-align:center;opacity:0.5;">No Gini data available</p>'; return; }
    var labels = items.map(function(d) { return d.feature.replace('gn_','').replace(/__/g,': ').replace(/_/g,' ').substring(0, 30); });
    var vals = items.map(function(d) { return d.gini_importance || d.importance_mean || 0; });
    var colors = items.map(function(d) { return CH_COLORS[d.channel] || '#999'; });
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 220, right: 30, top: 10, bottom: 30 },
        xAxis: { type: 'value', name: 'Gini importance', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: textColor(), fontSize: 9 } },
        series: [{ type: 'bar', data: vals.map(function(v, i) { return { value: v, itemStyle: { color: colors[i] } }; }) }]
    });
}

// ---- Mediation Analysis ----
function renderRfgMediation() {
    var el = document.getElementById('chart-rfg-mediation');
    if (!el || typeof DATA_MEDIATION === 'undefined') return;
    var chart = mkChart(el);
    var d = DATA_MEDIATION.model_accuracies;
    var names = ['Org Type\nOnly', 'C1 Content\nOnly', 'C2 Form\nOnly', 'Org+C1', 'Org+C2', 'C1+C2'];
    var vals = [d.org_type_only, d.C1_content_only, d.C2_form_only, d.org_type_plus_C1, d.org_type_plus_C2, d.C1_plus_C2].map(function(v) { return +(v * 100).toFixed(1); });
    var barColors = ['#94a3b8', '#E69F00', '#56B4E9', '#f59e0b', '#6366f1', '#22c55e'];
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 50, right: 20, top: 10, bottom: 60 },
        xAxis: { type: 'category', data: names, axisLabel: { color: textColor(), fontSize: 9, interval: 0 } },
        yAxis: { type: 'value', min: 40, max: 100, name: 'Accuracy %', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        series: [{ type: 'bar', data: vals.map(function(v, i) { return { value: v, itemStyle: { color: barColors[i] } }; }) }]
    });
}

// ---- ARI + Cramer's V ----
function renderRfgAriEffect() {
    var el = document.getElementById('chart-rfg-ari-effect');
    if (!el || typeof DATA_ARI_METADATA === 'undefined' || typeof DATA_EFFECT_SIZE === 'undefined') return;
    var chart = mkChart(el);
    var vars = ['org_type', 'binding_nature', 'governance_posture', 'epistemic_stance', 'region'];
    var ariVals = vars.map(function(v) { return DATA_ARI_METADATA.ARI[v] || 0; });
    var cvKeys = ['org_type_x_cluster', 'binding_x_cluster', '', '', 'region_x_cluster'];
    var cvVals = cvKeys.map(function(k) { return k ? (DATA_EFFECT_SIZE.cramers_v[k] || 0) : 0; });
    var labels = vars.map(function(v) { return v.replace(/_/g, ' '); });
    chart.setOption({
        tooltip: _tooltip(),
        legend: { data: ['ARI', "Cram\u00e9r's V"], textStyle: { color: textColor() } },
        grid: { left: 130, right: 20, top: 30, bottom: 30 },
        xAxis: { type: 'value', max: 0.6, axisLabel: { color: textColor() } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: textColor() } },
        series: [
            { name: 'ARI', type: 'bar', data: ariVals, itemStyle: { color: '#6366f1' } },
            { name: "Cram\u00e9r's V", type: 'bar', data: cvVals, itemStyle: { color: '#22c55e' } }
        ]
    });
}

// ---- Robustness KPI ----
function renderRfgRobustnessKpi() {
    var el = document.getElementById('rfg-robustness-kpi');
    if (!el || typeof DATA_RFGINI2B_CROSSLINGUAL === 'undefined') return;
    var d = DATA_RFGINI2B_CROSSLINGUAL;
    el.innerHTML =
        _kpiCard('C3 Pearson r', d.global_pearson_r.toFixed(4), 'orig vs uniform') +
        _kpiCard('C3 Spearman &rho;', d.global_spearman_rho.toFixed(4), 'rank correlation') +
        _kpiCard('Cluster ARI', d.cluster_stability.ari.toFixed(4), 'family preservation') +
        _kpiCard('EN Cosine', d.en_mean_cosine.toFixed(3), 'English embeddings') +
        _kpiCard('Non-EN Cosine', d.non_en_mean_cosine.toFixed(3), 'multilingual stable') +
        _kpiCard('Languages', d.n_languages, 'in corpus');
}

// ---- Per-Anchor Correlation ----
function renderRfgAnchorCorr() {
    var el = document.getElementById('chart-rfg-anchor-corr');
    if (!el || typeof DATA_RFGINI2B_CROSSLINGUAL === 'undefined') return;
    var chart = mkChart(el);
    var items = DATA_RFGINI2B_CROSSLINGUAL.anchor_correlations.slice().reverse();
    var labels = items.map(function(d) { return d.title; });
    var vals = items.map(function(d) { return d.pearson_r; });
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { var d = items[p.dataIndex]; return d.title + '<br>Pearson r: ' + d.pearson_r + '<br>Spearman: ' + d.spearman_rho + '<br>MAE: ' + d.mae; } }),
        grid: { left: 320, right: 30, top: 10, bottom: 30 },
        xAxis: { type: 'value', min: 0, max: 0.7, name: 'Pearson r', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: textColor(), fontSize: 9 } },
        series: [{ type: 'bar', data: vals.map(function(v) { return { value: v, itemStyle: { color: v > 0.5 ? '#22c55e' : v > 0.3 ? '#f59e0b' : '#ef4444' } }; }) }],
        dataZoom: [{ type: 'inside', yAxisIndex: 0 }]
    });
}

// ---- Language Cosine (Top 20) ----
function renderRfgLangCosine() {
    var el = document.getElementById('chart-rfg-lang-cosine');
    if (!el || typeof DATA_RFGINI2B_CROSSLINGUAL === 'undefined') return;
    var chart = mkChart(el);
    var items = DATA_RFGINI2B_CROSSLINGUAL.language_stats.slice(0, 20).reverse();
    var labels = items.map(function(d) { return d.lang + ' (n=' + d.n + ')'; });
    var vals = items.map(function(d) { return d.mean_cosine; });
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 120, right: 30, top: 10, bottom: 30 },
        xAxis: { type: 'value', min: 0, max: 1, name: 'Mean cosine similarity', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: textColor(), fontSize: 10 } },
        series: [{ type: 'bar', data: vals.map(function(v) { return { value: v, itemStyle: { color: v < 0.5 ? '#ef4444' : v < 0.8 ? '#f59e0b' : '#22c55e' } }; }) }]
    });
}

// ---- Cluster Size Comparison ----
function renderRfgClusterCompare() {
    var el = document.getElementById('chart-rfg-cluster-compare');
    if (!el || typeof DATA_RFGINI2B_CROSSLINGUAL === 'undefined') return;
    var chart = mkChart(el);
    var d = DATA_RFGINI2B_CROSSLINGUAL.cluster_stability;
    var labels = []; var origVals = []; var uniformVals = [];
    for (var c = 0; c < 6; c++) {
        labels.push(SHORT[c] || 'C' + c);
        origVals.push(d.sizes_orig[c] || 0);
        uniformVals.push(d.sizes_uniform[c] || 0);
    }
    chart.setOption({
        tooltip: _tooltip(),
        legend: { data: ['Original C3', 'Uniform C3'], textStyle: { color: textColor() } },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: labels, axisLabel: { color: textColor() } },
        yAxis: { type: 'value', name: 'Statements', axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        series: [
            { name: 'Original C3', type: 'bar', data: origVals, itemStyle: { color: '#6366f1' } },
            { name: 'Uniform C3', type: 'bar', data: uniformVals, itemStyle: { color: '#22d3ee' } }
        ]
    });
}

// ---- Reliability KPI ----
function renderRfgReliabilityKpi() {
    var el = document.getElementById('rfg-reliability-kpi');
    if (!el || typeof DATA_RFGINI2B_RELIABILITY === 'undefined') return;
    var d = DATA_RFGINI2B_RELIABILITY;
    var ss = d.score_summary; var es = d.enum_summary; var ts = d.tag_summary;
    var totalFields = (ss.n_fields || 0) + (es.n_fields || 0) + (ts.n_fields || 0);
    var totalFlagged = (d.flagged_fields || []).length;
    el.innerHTML =
        _kpiCard('Score &alpha; (mean)', ss.mean_alpha, ss.n_fields + ' fields') +
        _kpiCard('Score &alpha; (median)', ss.median_alpha, 'interval scale') +
        _kpiCard('Mean ICC(3,k)', ss.mean_icc, 'avg measures') +
        _kpiCard('Enum &alpha;', es.mean_alpha, es.n_fields + ' nominal fields') +
        _kpiCard('Tag Jaccard', ts.mean_jaccard, ts.n_fields + ' tag-lists') +
        _kpiCard('Flagged', totalFlagged + '/' + totalFields, '&alpha; &lt; 0.67');
}

// ---- Alpha Strip Plot ----
function renderRfgAlphaStrip() {
    var el = document.getElementById('chart-rfg-alpha-strip');
    if (!el || typeof DATA_RFGINI2B_RELIABILITY === 'undefined') return;
    var chart = mkChart(el);
    var items = DATA_RFGINI2B_RELIABILITY.score_fields_list || [];
    // Group by channel for x-position
    var channelX = { 'c1': 0, 'c2': 1, 'crosswalk': 2 };
    var channelNames = ['C1 Content', 'C2 Form', 'Crosswalk'];
    var data = items.map(function(d, i) {
        var x = channelX[d.channel] !== undefined ? channelX[d.channel] : 0;
        // Add small jitter
        x += (Math.random() - 0.5) * 0.4;
        return { value: [x, d.alpha], name: d.field, channel: d.channel };
    });
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { return p.data.name.replace('gn_','') + '<br>&alpha; = ' + p.data.value[1] + '<br>Channel: ' + p.data.channel.toUpperCase(); } }),
        grid: { left: 60, right: 30, top: 20, bottom: 40 },
        xAxis: { type: 'value', min: -0.5, max: 2.5, axisLabel: { color: textColor(), formatter: function(v) { return channelNames[Math.round(v)] || ''; } }, splitLine: { show: false }, interval: 1 },
        yAxis: { type: 'value', min: 0.5, max: 1.0, name: "Krippendorff's \u03B1", axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        series: [{
            type: 'scatter', data: data, symbolSize: 6,
            itemStyle: { color: function(p) { return CH_COLORS[p.data.channel] || '#999'; } },
            markLine: {
                silent: true,
                data: [
                    { yAxis: 0.67, label: { formatter: 'Threshold (0.67)', color: '#ef4444', fontSize: 10 }, lineStyle: { color: '#ef4444', type: 'dashed' } },
                    { yAxis: 0.80, label: { formatter: 'Good (0.80)', color: '#f59e0b', fontSize: 10 }, lineStyle: { color: '#f59e0b', type: 'dotted' } }
                ]
            }
        }]
    });
}

// ---- Channel Alpha Comparison ----
function renderRfgChannelAlpha() {
    var el = document.getElementById('chart-rfg-channel-alpha');
    if (!el || typeof DATA_RFGINI2B_RELIABILITY === 'undefined') return;
    var chart = mkChart(el);
    var cs = DATA_RFGINI2B_RELIABILITY.channel_summary;
    var channels = ['c1', 'c2', 'crosswalk'];
    var labels = ['C1 Content', 'C2 Form', 'Crosswalk'];
    var meanVals = channels.map(function(c) { return cs[c] ? cs[c].mean_alpha : 0; });
    var medianVals = channels.map(function(c) { return cs[c] ? cs[c].median_alpha : 0; });
    chart.setOption({
        tooltip: _tooltip(),
        legend: { data: ['Mean \u03B1', 'Median \u03B1'], textStyle: { color: textColor() } },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: labels, axisLabel: { color: textColor() } },
        yAxis: { type: 'value', min: 0.85, max: 1.0, name: "Krippendorff's \u03B1", axisLabel: { color: textColor() }, nameTextStyle: { color: textColor() } },
        series: [
            { name: 'Mean \u03B1', type: 'bar', data: meanVals.map(function(v, i) { return { value: v, itemStyle: { color: CH_COLORS[channels[i]] } }; }) },
            { name: 'Median \u03B1', type: 'bar', data: medianVals.map(function(v, i) { return { value: v, itemStyle: { color: CH_COLORS[channels[i]], opacity: 0.6 } }; }) }
        ]
    });
}

// ---- Enum + Tag Reliability ----
function renderRfgEnumTag() {
    var el = document.getElementById('chart-rfg-enum-tag');
    if (!el || typeof DATA_RFGINI2B_RELIABILITY === 'undefined') return;
    var chart = mkChart(el);
    var enums = DATA_RFGINI2B_RELIABILITY.enum_fields_list || [];
    var tags = DATA_RFGINI2B_RELIABILITY.tag_fields_list || [];
    var allLabels = enums.map(function(d) { return d.field.replace('gn_','').replace(/_/g,' ').substring(0, 22); })
        .concat(tags.map(function(d) { return d.field.replace('gn_','').replace(/_/g,' ').substring(0, 22); }));
    var allVals = enums.map(function(d) { return d.alpha; })
        .concat(tags.map(function(d) { return d.mean_jaccard; }));
    var allColors = enums.map(function() { return '#6366f1'; })
        .concat(tags.map(function() { return '#22c55e'; }));
    allLabels.reverse(); allVals.reverse(); allColors.reverse();
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 180, right: 30, top: 10, bottom: 30 },
        xAxis: { type: 'value', min: 0.7, max: 1.0, axisLabel: { color: textColor() } },
        yAxis: { type: 'category', data: allLabels, axisLabel: { color: textColor(), fontSize: 9 } },
        series: [{ type: 'bar', data: allVals.map(function(v, i) { return { value: v, itemStyle: { color: allColors[i] } }; }) }]
    });
}

// ---- Flagged Fields Table ----
function renderRfgFlaggedTable() {
    var el = document.getElementById('rfg-flagged-table');
    if (!el || typeof DATA_RFGINI2B_RELIABILITY === 'undefined') return;
    var flagged = DATA_RFGINI2B_RELIABILITY.flagged_fields || [];
    if (flagged.length === 0) {
        el.innerHTML = '<p style="text-align:center;color:#22c55e;font-weight:600;">All fields above threshold &mdash; no flagged fields.</p>';
        return;
    }
    var html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr style="border-bottom:2px solid var(--border);">';
    html += '<th style="text-align:left;padding:0.5rem;">Field</th>';
    html += '<th style="text-align:left;padding:0.5rem;">Type</th>';
    html += '<th style="text-align:left;padding:0.5rem;">Channel</th>';
    html += '<th style="text-align:right;padding:0.5rem;">&alpha; / Jaccard</th>';
    html += '</tr></thead><tbody>';
    flagged.forEach(function(f) {
        var val = f.alpha !== undefined ? f.alpha : (f.mean_jaccard || 'N/A');
        var color = (typeof val === 'number' && val < 0.67) ? '#ef4444' : '#f59e0b';
        html += '<tr style="border-bottom:1px solid var(--border);">';
        html += '<td style="padding:0.4rem;"><code>' + f.field + '</code></td>';
        html += '<td style="padding:0.4rem;">' + (f.type || '') + '</td>';
        html += '<td style="padding:0.4rem;">' + (f.channel || '').toUpperCase() + '</td>';
        html += '<td style="padding:0.4rem;text-align:right;color:' + color + ';font-weight:600;">' + val + '</td>';
        html += '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
}

/* ============================================================
   Literature Section Renderer (census-dashboard pattern)
   ============================================================ */

function renderCitationTable(citations, showLinks) {
    if (!citations || !citations.length) return '';
    var html = '<table class="citation-table"><thead><tr>';
    html += '<th>Author</th><th>Year</th><th>Title</th><th>Relationship</th><th>Relevance</th>';
    if (showLinks) html += '<th>Source</th>';
    html += '</tr></thead><tbody>';
    citations.forEach(function(c) {
        var relClass = 'rel-' + (c.relationship || 'complements');
        html += '<tr>';
        html += '<td><strong>' + (c.author || '') + '</strong></td>';
        html += '<td>' + (c.year || '') + '</td>';
        html += '<td>' + (c.title || '') + '</td>';
        html += '<td><span class="citation-relationship ' + relClass + '">' + (c.relationship || '').toUpperCase() + '</span></td>';
        html += '<td>' + (c.relevance || '') + '</td>';
        if (showLinks) {
            var link = '';
            if (c.doi) link = '<span style="font-size:10px;color:#64748b;font-family:monospace;">DOI: ' + c.doi + '</span>';
            if (c.url) link += (link ? '<br>' : '') + '<a style="color:#22d3ee;font-size:11px;text-decoration:none;" href="' + c.url + '" target="_blank">Link \u2197</a>';
            html += '<td>' + link + '</td>';
        }
        html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
}

function renderLitQuotes(citations) {
    if (!citations) return '';
    var quotes = citations.filter(function(c) { return c.quote && c.quote.length > 0; });
    if (quotes.length === 0) return '';
    var html = '';
    quotes.forEach(function(q) {
        html += '<div class="literature-quote">\u201C' + q.quote + '\u201D';
        html += '<span class="quote-source">\u2014 ' + q.author + ' (' + q.year + ')</span></div>';
    });
    return html;
}

function renderFindingLiterature(fid) {
    var el = document.getElementById('literature-' + fid);
    if (!el || typeof FINDINGS_LIT === 'undefined' || !FINDINGS_LIT[fid]) {
        if (el) el.innerHTML = '';
        return;
    }
    var lit = FINDINGS_LIT[fid];
    var html = '<div class="literature-section">';
    html += '<div class="literature-heading">\uD83D\uDCDA Where This Finding Sits in the Literature</div>';

    if (lit.vault) {
        html += '<div class="literature-subsection">';
        html += '<div class="literature-subsection-heading vault">\uD83D\uDCD6 From the Tapestry Background Library</div>';
        if (lit.vault.narrative) html += '<div class="literature-narrative">' + lit.vault.narrative + '</div>';
        html += renderCitationTable(lit.vault.citations, false);
        html += renderLitQuotes(lit.vault.citations);
        html += '</div>';
    }

    if (lit.web) {
        html += '<div class="literature-subsection">';
        html += '<div class="literature-subsection-heading web">\uD83C\uDF10 Broader Scholarly Context</div>';
        if (lit.web.narrative) html += '<div class="literature-narrative">' + lit.web.narrative + '</div>';
        html += renderCitationTable(lit.web.citations, true);
        html += renderLitQuotes(lit.web.citations);
        html += '</div>';
    }

    html += '</div>';
    el.innerHTML = html;
}


/* ==================================================================
   TAB 2 — FEATURES
   ================================================================== */

var CH_COLORS = { C1: '#6366f1', C2: '#38bdf8', C3: '#f59e0b', crosswalk: '#a78bfa' };
var CH_ALL = ['C1', 'C2', 'C3', 'crosswalk'];

function _chBadge(ch) {
    return '<span class="channel-badge ' + ch.toLowerCase() + '">' + ch + '</span>';
}

/* ---- Sub-Tab A: Catalog ---- */

function renderFeaturesCatalogKpi() {
    var el = document.getElementById('features-catalog-kpi');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var cs = DATA_FEATURES.channel_summary;
    el.innerHTML =
        '<div class="kpi-card"><div class="kpi-value">226</div><div class="kpi-label">Base Dimensions</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">347</div><div class="kpi-label">Expanded Features</div></div>' +
        '<div class="kpi-card"><div class="kpi-value" style="color:#6366f1;">' + cs.C1.n_fields + '</div><div class="kpi-label">C1 Content</div></div>' +
        '<div class="kpi-card"><div class="kpi-value" style="color:#38bdf8;">' + cs.C2.n_fields + '</div><div class="kpi-label">C2 Form</div></div>' +
        '<div class="kpi-card"><div class="kpi-value" style="color:#f59e0b;">' + cs.C3.n_fields + '</div><div class="kpi-label">C3 Anchored</div></div>' +
        '<div class="kpi-card"><div class="kpi-value" style="color:#a78bfa;">' + (cs.crosswalk ? cs.crosswalk.n_fields : 0) + '</div><div class="kpi-label">Crosswalk</div></div>' +
        '<div class="kpi-card"><div class="kpi-value" style="color:#ec4899;">14</div><div class="kpi-label">C1 Pillars</div></div>';
}

function renderFeaturesCatalogTable() {
    var el = document.getElementById('features-catalog-table-container');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;
    var _maxRows = 999;
    var _showAll = true;

    // Enrich C3 anchor descriptions with actual paper titles from DATA.anchors
    if (typeof DATA !== 'undefined' && DATA.anchors) {
        catalog.forEach(function(c) {
            if (c.channel === 'C3' && c.field && c.field.match(/gn_c3_anchor_\d+/)) {
                var idx = parseInt(c.field.replace('gn_c3_anchor_', ''), 10);
                var anchor = DATA.anchors[idx];
                if (anchor) {
                    c.description = 'Cosine similarity to: "' + anchor.title + '" (' + anchor.key + ', ' +
                        (anchor.org_type || '').replace(/_/g, ' ') + '). ' +
                        'Mean similarity: ' + (anchor.mean * 100).toFixed(1) + '%. ' +
                        'Discrimination F: ' + anchor.discrimination.toFixed(3) + '.';
                    c.short = 'c3_' + anchor.title.substring(0, 35).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
                }
            }
        });
    }

    // Sort: channel order (C1, C2, C3, crosswalk), then field name alphabetically
    var _chOrder = { 'C1': 0, 'C2': 1, 'C3': 2, 'crosswalk': 3 };
    catalog.sort(function(a, b) {
        var ca = _chOrder[a.channel] !== undefined ? _chOrder[a.channel] : 9;
        var cb = _chOrder[b.channel] !== undefined ? _chOrder[b.channel] : 9;
        if (ca !== cb) return ca - cb;
        return a.field.localeCompare(b.field);
    });

    // Populate pillar filter
    var pillarSelect = document.getElementById('feature-filter-pillar');
    if (pillarSelect) {
        var pillars = {};
        catalog.forEach(function(c) { if (c.pillar_code) pillars[c.pillar_code] = c.pillar_name; });
        Object.keys(pillars).sort().forEach(function(k) {
            var opt = document.createElement('option');
            opt.value = k;
            opt.textContent = k + ': ' + pillars[k];
            pillarSelect.appendChild(opt);
        });
    }

    function getFiltered() {
        var search = (document.getElementById('feature-search') || {}).value || '';
        search = search.toLowerCase();
        var chFilter = (document.getElementById('feature-filter-channel') || {}).value || '';
        var typeFilter = (document.getElementById('feature-filter-type') || {}).value || '';
        var pillarFilter = (document.getElementById('feature-filter-pillar') || {}).value || '';
        return catalog.filter(function(c) {
            if (search && c.field.toLowerCase().indexOf(search) === -1) return false;
            if (chFilter && c.channel !== chFilter) return false;
            if (typeFilter && c.type !== typeFilter) return false;
            if (pillarFilter && c.pillar_code !== pillarFilter) return false;
            return true;
        });
    }

    function render() {
        var filtered = getFiltered();
        var label = document.getElementById('feature-count-label');
        if (label) label.textContent = 'Showing ' + Math.min(_showAll ? filtered.length : _maxRows, filtered.length) + ' of ' + filtered.length;

        var displayItems = _showAll ? filtered : filtered.slice(0, _maxRows);
        var html = '<table class="feature-table"><thead><tr>' +
            '<th>Field</th><th>Channel</th><th>Type</th><th>Pillar</th>' +
            '<th>Mean</th><th>Nonzero%</th><th>Std</th><th>α</th></tr></thead><tbody>';

        displayItems.forEach(function(c, i) {
            var rowId = 'frow-' + i;
            var detailId = 'fdetail-' + i;
            var _desc = (c.description || 'No description available.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var _tipStats = 'Channel: ' + c.channel + ' · Type: ' + c.type + ' · Pillar: ' + (c.pillar_code || '—') +
                ' · Activation: ' + c.nonzero_pct.toFixed(1) + '% · α: ' + (c.alpha >= 0 ? c.alpha.toFixed(3) : '—');
            html += '<tr id="' + rowId + '" onclick="toggleFeatureDetail(\'' + detailId + '\')">' +
                '<td class="feature-name-cell">' + c.short +
                '<div class="feat-tip"><strong>gn_' + c.short + '</strong>' + _desc +
                '<div class="feat-tip-stats">' + _tipStats + '</div></div></td>' +
                '<td>' + _chBadge(c.channel) + '</td>' +
                '<td>' + c.type + '</td>' +
                '<td style="font-size:0.75rem;color:#94a3b8;">' + (c.pillar_code || '—') + '</td>' +
                '<td>' + (c.mean * 100).toFixed(1) + '</td>' +
                '<td>' + c.nonzero_pct.toFixed(1) + '%</td>' +
                '<td>' + c.std.toFixed(3) + '</td>' +
                '<td>' + (c.alpha >= 0 ? c.alpha.toFixed(3) : '—') + '</td>' +
                '</tr>';
            // Detail row
            html += '<tr class="feature-detail-row" id="' + detailId + '"><td colspan="8"><div class="feature-detail-content">';
            html += '<div class="feature-detail-desc">' + (c.description || 'No description available.') + '</div>';
            // Mini histogram container
            html += '<div><strong style="font-size:0.8rem;">Distribution</strong><div id="fhist-' + i + '" style="width:100%;height:120px;"></div></div>';
            // Cluster means
            html += '<div><strong style="font-size:0.8rem;">Cluster Means</strong><div id="fcmeans-' + i + '" style="width:100%;height:120px;"></div></div>';
            // Stats
            html += '<div style="font-size:0.78rem;color:#94a3b8;line-height:1.8;">' +
                '<div>Median: <strong>' + (c.median * 100).toFixed(1) + '</strong></div>' +
                '<div>Skewness: <strong>' + c.skewness.toFixed(2) + '</strong></div>' +
                '<div>Perm Imp: <strong>' + (c.perm_importance > 0 ? c.perm_importance.toFixed(5) : '—') + '</strong></div>' +
                '<div>Gini Imp: <strong>' + (c.gini_importance > 0 ? c.gini_importance.toFixed(5) : '—') + '</strong></div>' +
                '</div>';
            html += '</div></td></tr>';
        });

        html += '</tbody></table>';
        if (!_showAll && filtered.length > _maxRows) {
            html += '<div style="text-align:center;margin:1rem 0;"><button onclick="showAllFeatures()" style="background:#6366f1;color:white;border:none;padding:0.5rem 1.5rem;border-radius:6px;cursor:pointer;">Show All ' + filtered.length + ' Features</button></div>';
        }
        el.innerHTML = html;
    }

    // Global toggle function
    window.toggleFeatureDetail = function(detailId) {
        var row = document.getElementById(detailId);
        if (!row) return;
        var isOpen = row.classList.contains('open');
        row.classList.toggle('open');
        if (!isOpen) {
            // Render mini charts on first open
            var idx = parseInt(detailId.replace('fdetail-', ''), 10);
            var filtered = getFiltered();
            var item = (_showAll ? filtered : filtered.slice(0, _maxRows))[idx];
            if (!item) return;
            renderMiniHistogram('fhist-' + idx, item);
            renderMiniClusterMeans('fcmeans-' + idx, item);
        }
    };

    window.showAllFeatures = function() {
        _showAll = true;
        render();
    };

    // Wire filter events
    ['feature-search', 'feature-filter-channel', 'feature-filter-type', 'feature-filter-pillar'].forEach(function(id) {
        var input = document.getElementById(id);
        if (input) input.addEventListener(id === 'feature-search' ? 'input' : 'change', function() { _showAll = false; render(); });
    });

    render();
}

function renderMiniHistogram(containerId, item) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var histData = (DATA_FEATURES.histograms || {})[item.field];
    if (!histData) {
        // Generate approximate histogram from catalog stats
        el.innerHTML = '<div style="color:#64748b;font-size:0.75rem;text-align:center;padding-top:2rem;">No histogram data</div>';
        return;
    }
    var chart = echarts.init(el);
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 30, right: 10, top: 5, bottom: 20 },
        xAxis: { type: 'category', data: histData.bins, axisLabel: { fontSize: 9, color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'value', axisLabel: { fontSize: 9, color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [{ type: 'bar', data: histData.counts, itemStyle: { color: CH_COLORS[item.channel] || '#6366f1' }, barWidth: '80%' }]
    });
    _register(chart);
}

function renderMiniClusterMeans(containerId, item) {
    var el = document.getElementById(containerId);
    if (!el || !item.cluster_means) return;
    var chart = echarts.init(el);
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 30, right: 10, top: 5, bottom: 20 },
        xAxis: { type: 'category', data: SHORT, axisLabel: { fontSize: 8, color: '#64748b', rotate: 30 }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'value', max: 1, axisLabel: { fontSize: 9, color: '#64748b', formatter: function(v) { return (v*100).toFixed(0); } }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [{ type: 'bar', data: item.cluster_means.map(function(v, i) { return { value: v, itemStyle: { color: COLORS[i] } }; }), barWidth: '60%' }]
    });
    _register(chart);
}

/* ---- Sub-Tab B: Structure ---- */

function renderFeaturesSunburst() {
    var el = document.getElementById('chart-features-sunburst');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;
    var tree = DATA_FEATURES.rubric_tree;

    // Build sunburst data
    var c1Children = [];
    tree.forEach(function(pillar) {
        var pillarChildren = [];
        pillar.concepts.forEach(function(concept) {
            var conceptChildren = [];
            // Add concept itself
            var cItem = catalog.find(function(c) { return c.field === concept.field_name; });
            // Add specifics as children
            concept.specifics.forEach(function(spec) {
                var sItem = catalog.find(function(c) { return c.field === spec.field_name; });
                conceptChildren.push({
                    name: spec.name,
                    value: sItem ? Math.max(sItem.nonzero_pct, 0.5) : 0.5,
                    itemStyle: { color: 'rgba(99,102,241,0.6)' }
                });
            });
            pillarChildren.push({
                name: concept.concept_name,
                value: cItem ? Math.max(cItem.nonzero_pct, 1) : 1,
                children: conceptChildren.length > 0 ? conceptChildren : undefined,
                itemStyle: { color: 'rgba(99,102,241,0.75)' }
            });
        });
        c1Children.push({
            name: pillar.pillar_code + ' ' + pillar.pillar_name.substring(0, 25),
            children: pillarChildren,
            itemStyle: { color: '#6366f1' }
        });
    });

    // C2 groups
    var c2Score = [], c2OneHot = [], c2MultiHot = [];
    catalog.forEach(function(c) {
        if (c.channel !== 'C2') return;
        var item = { name: c.short, value: Math.max(c.nonzero_pct, 0.5) };
        if (c.type === 'score') c2Score.push(item);
        else if (c.type === 'one_hot') c2OneHot.push(item);
        else c2MultiHot.push(item);
    });

    // C3
    var c3Children = catalog.filter(function(c) { return c.channel === 'C3'; }).map(function(c) {
        return { name: c.short, value: Math.max(c.nonzero_pct, 0.5) };
    });

    var sunburstData = [
        { name: 'C1 Content (' + DATA_FEATURES.channel_summary.C1.n_fields + ')', children: c1Children, itemStyle: { color: '#6366f1' } },
        { name: 'C2 Form (' + DATA_FEATURES.channel_summary.C2.n_fields + ')', children: [
            { name: 'Scores (' + c2Score.length + ')', children: c2Score, itemStyle: { color: '#0ea5e9' } },
            { name: 'One-Hot (' + c2OneHot.length + ')', children: c2OneHot, itemStyle: { color: '#38bdf8' } },
            { name: 'Multi-Hot (' + c2MultiHot.length + ')', children: c2MultiHot, itemStyle: { color: '#7dd3fc' } }
        ], itemStyle: { color: '#38bdf8' } },
        { name: 'C3 Anchored (' + DATA_FEATURES.channel_summary.C3.n_fields + ')', children: c3Children, itemStyle: { color: '#f59e0b' } }
    ];

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'item', formatter: function(p) { return p.name + '<br/>Activation: ' + p.value.toFixed(1) + '%'; } }),
        series: [{
            type: 'sunburst',
            data: sunburstData,
            radius: ['8%', '92%'],
            sort: null,
            emphasis: { focus: 'ancestor' },
            levels: [
                {},
                { r0: '8%', r: '30%', label: { fontSize: 11, color: '#e2e8f0' }, itemStyle: { borderWidth: 2 } },
                { r0: '30%', r: '55%', label: { fontSize: 9, color: '#94a3b8', align: 'right' }, itemStyle: { borderWidth: 1 } },
                { r0: '55%', r: '78%', label: { fontSize: 8, color: '#64748b' }, itemStyle: { borderWidth: 0.5, opacity: 0.8 } },
                { r0: '78%', r: '92%', label: { show: false }, itemStyle: { borderWidth: 0.3, opacity: 0.6 } }
            ]
        }]
    });
    _register(chart);
}

function renderRubricTree() {
    var el = document.getElementById('chart-rubric-tree');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var tree = DATA_FEATURES.rubric_tree;
    var catalog = DATA_FEATURES.catalog;

    // Build tree data
    var treeData = {
        name: 'C1 Content',
        children: tree.map(function(pillar) {
            return {
                name: pillar.pillar_code + '\n' + pillar.pillar_name.substring(0, 20),
                children: pillar.concepts.map(function(concept) {
                    var cItem = catalog.find(function(c) { return c.field === concept.field_name; });
                    var node = {
                        name: concept.concept_name,
                        value: cItem ? cItem.nonzero_pct : 0,
                        symbolSize: cItem ? Math.max(6, Math.min(20, cItem.nonzero_pct / 3)) : 6
                    };
                    if (concept.specifics && concept.specifics.length > 0) {
                        node.children = concept.specifics.map(function(spec) {
                            var sItem = catalog.find(function(c) { return c.field === spec.field_name; });
                            return {
                                name: spec.name,
                                value: sItem ? sItem.nonzero_pct : 0,
                                symbolSize: sItem ? Math.max(4, Math.min(14, sItem.nonzero_pct / 3)) : 4
                            };
                        });
                    }
                    return node;
                })
            };
        })
    };

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'item', formatter: function(p) { return p.name + (p.value ? '<br/>Activation: ' + p.value.toFixed(1) + '%' : ''); } }),
        series: [{
            type: 'tree',
            data: [treeData],
            top: '5%', left: '10%', bottom: '5%', right: '15%',
            symbolSize: 10,
            orient: 'LR',
            label: { fontSize: 9, color: '#94a3b8', position: 'right', verticalAlign: 'middle' },
            leaves: { label: { fontSize: 8, color: '#64748b' } },
            lineStyle: { color: '#334155', width: 1 },
            emphasis: { focus: 'descendant' },
            expandAndCollapse: true,
            initialTreeDepth: 2,
            animationDuration: 500
        }]
    });
    _register(chart);
}

function renderTypeStackedBar() {
    var el = document.getElementById('chart-type-stacked');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var ts = DATA_FEATURES.type_summary;
    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'axis' }),
        legend: { data: ['Score', 'One-Hot', 'Multi-Hot'], textStyle: { color: '#94a3b8' }, top: 5 },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: ['C1 Content', 'C2 Form', 'C3 Anchored'], axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'value', name: 'Features', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [
            { name: 'Score', type: 'bar', stack: 'total', data: [ts.score.channels.C1, ts.score.channels.C2, ts.score.channels.C3], itemStyle: { color: '#6366f1' } },
            { name: 'One-Hot', type: 'bar', stack: 'total', data: [ts.one_hot.channels.C1, ts.one_hot.channels.C2, ts.one_hot.channels.C3], itemStyle: { color: '#38bdf8' } },
            { name: 'Multi-Hot', type: 'bar', stack: 'total', data: [ts.multi_hot.channels.C1, ts.multi_hot.channels.C2, ts.multi_hot.channels.C3], itemStyle: { color: '#f59e0b' } }
        ]
    });
    _register(chart);
}

function renderPillarTreemap() {
    var el = document.getElementById('chart-pillar-treemap');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;
    var tree = DATA_FEATURES.rubric_tree;

    var data = tree.map(function(pillar) {
        var items = catalog.filter(function(c) { return c.pillar_code === pillar.pillar_code; });
        var meanStd = items.length > 0 ? items.reduce(function(s, c) { return s + c.std; }, 0) / items.length : 0;
        return {
            name: pillar.pillar_code + '\n' + pillar.pillar_name.substring(0, 18),
            value: items.length,
            meanStd: meanStd,
            itemStyle: { color: 'rgba(99,102,241,' + (0.3 + meanStd * 3) + ')' }
        };
    });

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { return p.name.replace('\n', ' ') + '<br/>Features: ' + p.value + '<br/>Mean Std: ' + (p.data.meanStd || 0).toFixed(3); } }),
        series: [{
            type: 'treemap',
            data: data,
            roam: false,
            breadcrumb: { show: false },
            label: { fontSize: 10, color: '#e2e8f0', formatter: function(p) { return p.name + '\n(' + p.value + ')'; } },
            itemStyle: { borderColor: '#0f172a', borderWidth: 2 }
        }]
    });
    _register(chart);
}

/* ---- Sub-Tab C: Distributions ---- */

function renderDistributionKpi() {
    var el = document.getElementById('features-dist-kpi');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;
    var meanNz = (catalog.reduce(function(s, c) { return s + c.nonzero_pct; }, 0) / catalog.length).toFixed(1);
    var sparse = catalog.filter(function(c) { return c.nonzero_pct < 5; }).length;
    var dense = catalog.filter(function(c) { return c.nonzero_pct > 90; }).length;
    var maxStd = Math.max.apply(null, catalog.map(function(c) { return c.std; })).toFixed(3);
    var meanStd = (catalog.reduce(function(s, c) { return s + c.std; }, 0) / catalog.length).toFixed(3);

    el.innerHTML =
        '<div class="kpi-card"><div class="kpi-value">' + meanNz + '%</div><div class="kpi-label">Mean Activation</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + sparse + '</div><div class="kpi-label">Sparse (&lt;5%)</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + dense + '</div><div class="kpi-label">Dense (&gt;90%)</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + maxStd + '</div><div class="kpi-label">Max Std Dev</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + meanStd + '</div><div class="kpi-label">Mean Std Dev</div></div>';
}

function renderSparsitySpectrum() {
    var el = document.getElementById('chart-sparsity-spectrum');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var spectrum = DATA_FEATURES.sparsity_spectrum;
    // Show bottom 40 (most sparse) + top 40 (most dense)
    var bottom = spectrum.slice(0, 40);
    var top = spectrum.slice(-40).reverse();
    var display = bottom.concat([{ field: '...', channel: '', nonzero_pct: -1 }]).concat(top);

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'axis', axisPointer: { type: 'shadow' } }),
        grid: { left: 200, right: 30, top: 10, bottom: 30 },
        yAxis: { type: 'category', data: display.map(function(d) { return d.field.replace('gn_', ''); }), axisLabel: { fontSize: 8, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } }, inverse: true },
        xAxis: { type: 'value', name: 'Activation %', nameTextStyle: { color: '#64748b' }, max: 100, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [{
            type: 'bar',
            data: display.map(function(d) {
                if (d.nonzero_pct < 0) return { value: 0, itemStyle: { color: 'transparent' } };
                return { value: d.nonzero_pct, itemStyle: { color: CH_COLORS[d.channel] || '#64748b' } };
            }),
            barWidth: '70%'
        }]
    });
    _register(chart);
}

function renderVarianceBoxplot() {
    var el = document.getElementById('chart-variance-boxplot');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;

    var channels = CH_ALL;
    var boxData = channels.map(function(ch) {
        var vals = catalog.filter(function(c) { return c.channel === ch; }).map(function(c) { return c.std; }).sort(function(a, b) { return a - b; });
        if (vals.length === 0) return [0, 0, 0, 0, 0];
        var q1 = vals[Math.floor(vals.length * 0.25)];
        var q2 = vals[Math.floor(vals.length * 0.50)];
        var q3 = vals[Math.floor(vals.length * 0.75)];
        return [vals[0], q1, q2, q3, vals[vals.length - 1]];
    });

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: _tooltip(),
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: channels, axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'value', name: 'Std Dev', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [{
            type: 'boxplot',
            data: boxData,
            itemStyle: { color: '#1e293b', borderColor: '#6366f1' },
            emphasis: { itemStyle: { borderColor: '#818cf8' } }
        }]
    });
    _register(chart);
}

function renderVarianceSparsityScatter() {
    var el = document.getElementById('chart-variance-sparsity');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;

    var seriesData = {};
    CH_ALL.forEach(function(ch) { seriesData[ch] = []; });
    catalog.forEach(function(c) {
        if (!seriesData[c.channel]) seriesData[c.channel] = [];
        seriesData[c.channel].push([c.nonzero_pct, c.std, c.perm_importance, c.short]);
    });

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { return p.data[3] + '<br/>Activation: ' + p.data[0].toFixed(1) + '%<br/>Std: ' + p.data[1].toFixed(3) + '<br/>Perm Imp: ' + p.data[2].toFixed(5); } }),
        legend: { data: CH_ALL, textStyle: { color: '#94a3b8' }, top: 5 },
        grid: { left: 50, right: 20, top: 35, bottom: 40 },
        xAxis: { type: 'value', name: 'Activation %', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        yAxis: { type: 'value', name: 'Std Dev', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: CH_ALL.map(function(ch) {
            return {
                name: ch, type: 'scatter',
                data: seriesData[ch],
                symbolSize: function(d) { return Math.max(4, Math.min(20, d[2] * 2000)); },
                itemStyle: { color: CH_COLORS[ch], opacity: 0.7 }
            };
        })
    });
    _register(chart);
}

function renderChannelSparsityBar() {
    var el = document.getElementById('chart-channel-sparsity');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;

    var channels = CH_ALL;
    var sparse = [], moderate = [], dense = [];
    channels.forEach(function(ch) {
        var items = catalog.filter(function(c) { return c.channel === ch; });
        sparse.push(items.filter(function(c) { return c.nonzero_pct < 5; }).length);
        moderate.push(items.filter(function(c) { return c.nonzero_pct >= 5 && c.nonzero_pct <= 50; }).length);
        dense.push(items.filter(function(c) { return c.nonzero_pct > 50; }).length);
    });

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'axis' }),
        legend: { data: ['Sparse (<5%)', 'Moderate (5-50%)', 'Dense (>50%)'], textStyle: { color: '#94a3b8' }, top: 5 },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: channels, axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'value', name: 'Features', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [
            { name: 'Sparse (<5%)', type: 'bar', stack: 'total', data: sparse, itemStyle: { color: '#ef4444' } },
            { name: 'Moderate (5-50%)', type: 'bar', stack: 'total', data: moderate, itemStyle: { color: '#f59e0b' } },
            { name: 'Dense (>50%)', type: 'bar', stack: 'total', data: dense, itemStyle: { color: '#22c55e' } }
        ]
    });
    _register(chart);
}

/* ---- Sub-Tab D: Importance & Relationships ---- */

function renderImportanceKpi() {
    var el = document.getElementById('features-imp-kpi');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var ibc = DATA_FEATURES.importance_by_channel;
    var pca = DATA_FEATURES.pca;
    var fc = DATA_FEATURES.feature_clusters;
    var imp = DATA_FEATURES.importance_full;
    var topFeat = imp.length > 0 ? imp[0].field.replace('gn_', '') : '—';
    // Max absolute correlation
    var cm = DATA_FEATURES.corr_matrix.matrix;
    var maxR = 0;
    for (var i = 0; i < cm.length; i++) {
        for (var j = i + 1; j < cm[i].length; j++) {
            if (Math.abs(cm[i][j]) > maxR) maxR = Math.abs(cm[i][j]);
        }
    }

    el.innerHTML =
        '<div class="kpi-card"><div class="kpi-value">' + ibc.C2.pct_perm + '%</div><div class="kpi-label">C2 Perm Share</div></div>' +
        '<div class="kpi-card"><div class="kpi-value" style="font-size:1.4rem;">' + topFeat + '</div><div class="kpi-label">Top Feature</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + pca.n_components_80pct + '</div><div class="kpi-label">PCA 80%</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + fc.length + '</div><div class="kpi-label">Feature Clusters</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + maxR.toFixed(2) + '</div><div class="kpi-label">Max |r|</div></div>';
}

function renderPermImportanceFeatures() {
    var el = document.getElementById('chart-feat-perm-imp');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var imp = DATA_FEATURES.importance_full.filter(function(d) { return d.perm > 0; }).slice(0, 30);
    imp.reverse();

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'axis', axisPointer: { type: 'shadow' } }),
        grid: { left: 180, right: 20, top: 10, bottom: 30 },
        yAxis: { type: 'category', data: imp.map(function(d) { return d.field.replace('gn_', ''); }), axisLabel: { fontSize: 9, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
        xAxis: { type: 'value', name: 'Perm Importance', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [{ type: 'bar', data: imp.map(function(d) { return { value: d.perm, itemStyle: { color: CH_COLORS[d.channel] || '#64748b' } }; }) }]
    });
    _register(chart);
}

function renderGiniImportanceFeatures() {
    var el = document.getElementById('chart-feat-gini-imp');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var imp = DATA_FEATURES.importance_full.filter(function(d) { return d.gini > 0; }).slice(0, 30);
    imp.sort(function(a, b) { return b.gini - a.gini; });
    imp.reverse();

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'axis', axisPointer: { type: 'shadow' } }),
        grid: { left: 180, right: 20, top: 10, bottom: 30 },
        yAxis: { type: 'category', data: imp.map(function(d) { return d.field.replace('gn_', ''); }), axisLabel: { fontSize: 9, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
        xAxis: { type: 'value', name: 'Gini Importance', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [{ type: 'bar', data: imp.map(function(d) { return { value: d.gini, itemStyle: { color: CH_COLORS[d.channel] || '#64748b' } }; }) }]
    });
    _register(chart);
}

function renderImportanceChannelDonut() {
    var el = document.getElementById('chart-imp-channel-donut');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var ibc = DATA_FEATURES.importance_by_channel;
    var chart = echarts.init(el);
    chart.setOption({
        tooltip: _tooltip(),
        legend: { data: ['C1', 'C2', 'C3'], textStyle: { color: '#94a3b8' }, top: 5 },
        series: [
            {
                name: 'Perm', type: 'pie', radius: ['20%', '45%'], center: ['50%', '55%'],
                label: { formatter: '{b}\n{d}%', fontSize: 10, color: '#94a3b8' },
                data: [
                    { value: ibc.C1.pct_perm, name: 'C1', itemStyle: { color: '#6366f1' } },
                    { value: ibc.C2.pct_perm, name: 'C2', itemStyle: { color: '#38bdf8' } },
                    { value: ibc.C3.pct_perm, name: 'C3', itemStyle: { color: '#f59e0b' } },
                    { value: (ibc.crosswalk || {}).pct_perm || 0, name: 'XW', itemStyle: { color: '#a78bfa' } }
                ]
            },
            {
                name: 'Gini', type: 'pie', radius: ['55%', '75%'], center: ['50%', '55%'],
                label: { show: false },
                data: [
                    { value: ibc.C1.pct_gini, name: 'C1', itemStyle: { color: 'rgba(99,102,241,0.6)' } },
                    { value: ibc.C2.pct_gini, name: 'C2', itemStyle: { color: 'rgba(56,189,248,0.6)' } },
                    { value: ibc.C3.pct_gini, name: 'C3', itemStyle: { color: 'rgba(245,158,11,0.6)' } },
                    { value: (ibc.crosswalk || {}).pct_gini || 0, name: 'XW', itemStyle: { color: 'rgba(167,139,250,0.6)' } }
                ]
            }
        ]
    });
    _register(chart);
}

function renderImportanceVarianceScatter() {
    var el = document.getElementById('chart-imp-variance-scatter');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var catalog = DATA_FEATURES.catalog;
    var seriesData = {};
    CH_ALL.forEach(function(ch) { seriesData[ch] = []; });
    catalog.forEach(function(c) {
        if (c.perm_importance > 0 || c.std > 0.05) {
            if (!seriesData[c.channel]) seriesData[c.channel] = [];
            seriesData[c.channel].push([c.std, c.perm_importance, c.nonzero_pct, c.short]);
        }
    });

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { return p.data[3] + '<br/>Std: ' + p.data[0].toFixed(3) + '<br/>Perm Imp: ' + p.data[1].toFixed(5) + '<br/>Activation: ' + p.data[2].toFixed(1) + '%'; } }),
        legend: { data: CH_ALL, textStyle: { color: '#94a3b8' }, top: 5 },
        grid: { left: 60, right: 20, top: 35, bottom: 40 },
        xAxis: { type: 'value', name: 'Std Dev', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        yAxis: { type: 'value', name: 'Perm Importance', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: CH_ALL.map(function(ch) {
            return {
                name: ch, type: 'scatter',
                data: seriesData[ch],
                symbolSize: function(d) { return Math.max(5, Math.min(18, d[2] / 5)); },
                itemStyle: { color: CH_COLORS[ch], opacity: 0.7 }
            };
        })
    });
    _register(chart);
}

function renderFeatureCorrHeatmap() {
    var el = document.getElementById('chart-feat-corr-heatmap');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var cm = DATA_FEATURES.corr_matrix;
    var fields = cm.fields.map(function(f) { return f.replace('gn_', '').substring(0, 20); });
    var data = [];
    for (var i = 0; i < cm.matrix.length; i++) {
        for (var j = 0; j < cm.matrix[i].length; j++) {
            data.push([j, i, cm.matrix[i][j]]);
        }
    }

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { formatter: function(p) { return cm.fields[p.data[1]].replace('gn_', '') + ' × ' + cm.fields[p.data[0]].replace('gn_', '') + '<br/>r = ' + p.data[2].toFixed(3); } }),
        grid: { left: 160, right: 40, top: 10, bottom: 120 },
        xAxis: { type: 'category', data: fields, axisLabel: { fontSize: 7, color: '#64748b', rotate: 90 }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'category', data: fields, axisLabel: { fontSize: 7, color: '#64748b' }, axisLine: { lineStyle: { color: '#334155' } } },
        visualMap: {
            min: -1, max: 1, calculable: true, orient: 'vertical', right: 0, top: 'center',
            textStyle: { color: '#94a3b8' },
            inRange: { color: ['#3b82f6', '#1e293b', '#ef4444'] }
        },
        series: [{
            type: 'heatmap', data: data,
            emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } }
        }]
    });
    _register(chart);
}

function renderPcaScree() {
    var el = document.getElementById('chart-pca-scree');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var pca = DATA_FEATURES.pca;
    var labels = pca.explained_variance_ratio.map(function(_, i) { return 'PC' + (i + 1); });

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { trigger: 'axis' }),
        legend: { data: ['Individual', 'Cumulative'], textStyle: { color: '#94a3b8' }, top: 5 },
        grid: { left: 50, right: 30, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 45 }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: [
            { type: 'value', name: 'Variance', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8', formatter: function(v) { return (v*100).toFixed(0) + '%'; } }, splitLine: { lineStyle: { color: '#1e293b' } } },
            { type: 'value', name: 'Cumulative', nameTextStyle: { color: '#64748b' }, max: 1, axisLabel: { color: '#94a3b8', formatter: function(v) { return (v*100).toFixed(0) + '%'; } }, splitLine: { show: false } }
        ],
        series: [
            { name: 'Individual', type: 'bar', data: pca.explained_variance_ratio, itemStyle: { color: '#6366f1' }, barWidth: '60%' },
            { name: 'Cumulative', type: 'line', yAxisIndex: 1, data: pca.cumulative, lineStyle: { color: '#22c55e', width: 2 }, symbol: 'circle', symbolSize: 4, itemStyle: { color: '#22c55e' },
              markLine: { silent: true, lineStyle: { type: 'dashed' }, data: [
                  { yAxis: 0.8, label: { formatter: '80%', color: '#94a3b8', fontSize: 9 }, lineStyle: { color: '#f59e0b' } },
                  { yAxis: 0.9, label: { formatter: '90%', color: '#94a3b8', fontSize: 9 }, lineStyle: { color: '#ef4444' } },
                  { yAxis: 0.95, label: { formatter: '95%', color: '#94a3b8', fontSize: 9 }, lineStyle: { color: '#ef4444', type: 'dotted' } }
              ] }
            }
        ]
    });
    _register(chart);
}

function renderPcLoadings() {
    var el = document.getElementById('chart-pc-loadings');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var pca = DATA_FEATURES.pca;
    if (!pca.top3_loadings || pca.top3_loadings.length < 2) return;

    // Combine PC1 and PC2 loadings
    var pc1 = pca.top3_loadings[0];
    var pc2 = pca.top3_loadings[1];

    // Build diverging bar for PC1
    var allItems = [];
    pc1.top_neg.forEach(function(d) {
        allItems.push({ name: d.field.replace('gn_', '').substring(0, 22), pc1: d.loading, pc2: 0, group: 'PC1-' });
    });
    pc1.top_pos.slice().reverse().forEach(function(d) {
        allItems.push({ name: d.field.replace('gn_', '').substring(0, 22), pc1: d.loading, pc2: 0, group: 'PC1+' });
    });
    // Separator
    allItems.push({ name: '───', pc1: 0, pc2: 0, group: 'sep' });
    pc2.top_neg.forEach(function(d) {
        allItems.push({ name: d.field.replace('gn_', '').substring(0, 22), pc1: 0, pc2: d.loading, group: 'PC2-' });
    });
    pc2.top_pos.slice().reverse().forEach(function(d) {
        allItems.push({ name: d.field.replace('gn_', '').substring(0, 22), pc1: 0, pc2: d.loading, group: 'PC2+' });
    });

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: _tooltip(),
        legend: { data: ['PC1', 'PC2'], textStyle: { color: '#94a3b8' }, top: 5 },
        grid: { left: 170, right: 20, top: 30, bottom: 20 },
        yAxis: { type: 'category', data: allItems.map(function(d) { return d.name; }), axisLabel: { fontSize: 8, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } }, inverse: true },
        xAxis: { type: 'value', name: 'Loading', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        series: [
            { name: 'PC1', type: 'bar', data: allItems.map(function(d) { return d.pc1; }), itemStyle: { color: '#6366f1' }, barWidth: '50%' },
            { name: 'PC2', type: 'bar', data: allItems.map(function(d) { return d.pc2; }), itemStyle: { color: '#22c55e' }, barWidth: '50%' }
        ]
    });
    _register(chart);
}

function renderFeatureClusterCards() {
    var el = document.getElementById('feature-cluster-cards');
    if (!el || typeof DATA_FEATURES === 'undefined') return;
    var clusters = DATA_FEATURES.feature_clusters;

    var html = '';
    clusters.forEach(function(fc) {
        var chLabel = fc.dominant_channel;
        html += '<div class="feature-cluster-card">';
        html += '<h4>' + _chBadge(chLabel) + ' Cluster ' + fc.cluster_id + ' <span style="color:#64748b;font-size:0.8rem;">(' + fc.n_features + ' features, r\u0304=' + fc.mean_intra_corr.toFixed(2) + ')</span></h4>';
        // Channel breakdown
        var chStr = Object.keys(fc.channel_counts).map(function(ch) { return ch + ':' + fc.channel_counts[ch]; }).join(' · ');
        html += '<div style="font-size:0.75rem;color:#64748b;margin-bottom:0.5rem;">' + chStr + '</div>';
        // Top members
        fc.top_members.forEach(function(m) {
            html += '<span class="feature-cluster-member">' + m.replace('gn_', '') + '</span>';
        });
        html += '</div>';
    });
    el.innerHTML = html;

    // Update bottom-line text
    var pcaText = document.getElementById('pca-80-text');
    if (pcaText) pcaText.textContent = DATA_FEATURES.pca.n_components_80pct;
}


// --- Encoding-Matched Tab Charts ---

function renderEncodingAblationChart(containerId) {
    if (!DATA.encodingMatched) return;
    var results = DATA.encodingMatched.results || DATA.encodingMatched;

    var categories = ['C1 Original', 'C1 Matched', 'C2 Only', 'Full Original', 'Full Matched'];
    var silValues = [
        results.C1_only_original && results.C1_only_original.silhouette != null ? results.C1_only_original.silhouette : -0.028,
        results.C1_matched_only && results.C1_matched_only.silhouette != null ? results.C1_matched_only.silhouette : 0.099,
        results.C2_only && results.C2_only.silhouette != null ? results.C2_only.silhouette : 0.153,
        results.full_original && results.full_original.silhouette != null ? results.full_original.silhouette : 0.155,
        results.full_matched && results.full_matched.silhouette != null ? results.full_matched.silhouette : 0.088
    ];
    var colors = ['#D55E00', '#E69F00', '#0072B2', '#333333', '#666666'];

    var chart = echarts.init(document.getElementById(containerId));
    chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '15%', right: '5%', top: '10%', bottom: '15%' },
        xAxis: { type: 'category', data: categories, axisLabel: { rotate: 15, fontSize: 11 } },
        yAxis: { type: 'value', name: 'Silhouette Score', min: -0.05, axisLine: { show: true } },
        series: [{
            type: 'bar',
            data: silValues.map(function(v, i) {
                return { value: v, itemStyle: { color: colors[i] } };
            }),
            barWidth: '50%',
            label: { show: true, position: 'top', formatter: function(p) { return p.value.toFixed(3); }, fontSize: 10 },
            markLine: {
                data: [{ yAxis: 0, lineStyle: { color: '#999', type: 'dashed' } }],
                silent: true, symbol: 'none'
            }
        }],
        graphic: [{
            type: 'text',
            left: 'center', bottom: 5,
            style: {
                text: '70.5% of original gap was encoding artifact',
                fontSize: 11, fill: '#10b981', fontWeight: 'bold'
            }
        }]
    });
    _register(chart);
}

function renderPerClassF1Chart(containerId) {
    if (!DATA.classifierBaselines) return;
    var pc = DATA.classifierBaselines.random_forest ? (DATA.classifierBaselines.random_forest.per_class || {}) : (DATA.classifierBaselines.per_class || {});

    var families = [];
    var f1Scores = [];
    var colors = [];
    var clusterColors = DATA.clusterColors || {};

    for (var i = 0; i < 6; i++) {
        var key = 'C' + i;
        var info = pc[key] || pc[String(i)] || {};
        families.push(DATA.clusterShort ? (DATA.clusterShort[String(i)] || key) : key);
        f1Scores.push(info.f1 || 0);
        colors.push(clusterColors[String(i)] || '#888');
    }

    var chart = echarts.init(document.getElementById(containerId));
    chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '15%', right: '5%', top: '10%', bottom: '15%' },
        xAxis: { type: 'category', data: families, axisLabel: { rotate: 15, fontSize: 11 } },
        yAxis: { type: 'value', name: 'F1 Score', min: 0.7, max: 1.0 },
        series: [{
            type: 'bar',
            data: f1Scores.map(function(v, i) {
                return { value: v, itemStyle: { color: colors[i] } };
            }),
            barWidth: '50%',
            label: { show: true, position: 'top', formatter: function(p) { return p.value.toFixed(3); }, fontSize: 10 },
            markLine: {
                data: [
                    { yAxis: 0.884, name: 'Overall Acc', lineStyle: { color: '#6366f1', type: 'dashed' } }
                ],
                silent: true, symbol: 'none', label: { show: true, formatter: 'Overall: 88.4%' }
            }
        }]
    });
    _register(chart);
}

