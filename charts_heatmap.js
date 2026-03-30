/* ============================================================
   Heatmap Tab — Canvas rendering + ECharts Explorer + Patterns
   Custom ImageData rendering for 700K-cell genome matrix.
   ============================================================ */

/* ---- State ---- */
var _hmMatrix = null;       // Uint8Array, row-major, 2021*347
var _hmRows = 0;
var _hmCols = 0;
var _hmColorLUT = null;     // Uint8Array, 101*4 (RGBA)
var _hmOffscreen = null;    // offscreen canvas (347 x 2021)
var _hmCurrentRowOrder = 'cluster';
var _hmCurrentColOrder = 'channel_pillar';

var _hmView = { x: 0, y: 0, zoom: 1 };
var _hmDrag = { active: false, startX: 0, startY: 0, origX: 0, origY: 0 };

/* ---- Color LUT (inferno-like multi-stop gradient) ---- */
var _HM_STOPS = [
    { pos: 0,   r: 0,   g: 0,   b: 4   },
    { pos: 5,   r: 10,  g: 7,   b: 40  },
    { pos: 15,  r: 40,  g: 11,  b: 84  },
    { pos: 25,  r: 80,  g: 18,  b: 100 },
    { pos: 35,  r: 120, g: 28,  b: 90  },
    { pos: 45,  r: 165, g: 44,  b: 60  },
    { pos: 55,  r: 200, g: 80,  b: 30  },
    { pos: 65,  r: 225, g: 130, b: 20  },
    { pos: 75,  r: 240, g: 180, b: 30  },
    { pos: 85,  r: 248, g: 220, b: 70  },
    { pos: 95,  r: 252, g: 245, b: 150 },
    { pos: 100, r: 252, g: 255, b: 235 }
];

function buildColorLUT() {
    _hmColorLUT = new Uint8Array(101 * 4);
    for (var v = 0; v <= 100; v++) {
        var lo = _HM_STOPS[0], hi = _HM_STOPS[_HM_STOPS.length - 1];
        for (var s = 0; s < _HM_STOPS.length - 1; s++) {
            if (v >= _HM_STOPS[s].pos && v <= _HM_STOPS[s + 1].pos) {
                lo = _HM_STOPS[s]; hi = _HM_STOPS[s + 1]; break;
            }
        }
        var t = (hi.pos === lo.pos) ? 0 : (v - lo.pos) / (hi.pos - lo.pos);
        var idx = v * 4;
        _hmColorLUT[idx]     = Math.round(lo.r + t * (hi.r - lo.r));
        _hmColorLUT[idx + 1] = Math.round(lo.g + t * (hi.g - lo.g));
        _hmColorLUT[idx + 2] = Math.round(lo.b + t * (hi.b - lo.b));
        _hmColorLUT[idx + 3] = 255;
    }
}

/* ---- Matrix decode ---- */
function decodeMatrix() {
    if (_hmMatrix) return; // already decoded
    var b64 = DATA_HEATMAP.matrix_b64;
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    _hmMatrix = bytes;
    _hmRows = DATA_HEATMAP.meta.nRows;
    _hmCols = DATA_HEATMAP.meta.nCols;
}

/* ---- Full matrix render to offscreen canvas ---- */
function renderFullMatrix(rowOrder, colOrder) {
    var nR = _hmRows, nC = _hmCols;
    var mat = _hmMatrix;
    var lut = _hmColorLUT;

    var offscreen = document.createElement('canvas');
    offscreen.width = nC;
    offscreen.height = nR;
    var ctx = offscreen.getContext('2d');
    var imgData = ctx.createImageData(nC, nR);
    var pixels = imgData.data;

    for (var vy = 0; vy < nR; vy++) {
        var srcRow = rowOrder[vy];
        var rowOff = srcRow * nC;
        var pixRowOff = vy * nC * 4;
        for (var vx = 0; vx < nC; vx++) {
            var srcCol = colOrder[vx];
            var value = mat[rowOff + srcCol];
            var lutIdx = value * 4;
            var pixIdx = pixRowOff + vx * 4;
            pixels[pixIdx]     = lut[lutIdx];
            pixels[pixIdx + 1] = lut[lutIdx + 1];
            pixels[pixIdx + 2] = lut[lutIdx + 2];
            pixels[pixIdx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    _hmOffscreen = offscreen;
    _hmView = { x: 0, y: 0, zoom: 1 };
    drawViewport();
    drawColTracks();
    drawRowTracks();
    drawMinimap();
}

/* ---- Viewport drawing ---- */
function drawViewport() {
    var canvas = document.getElementById('hm-canvas');
    if (!canvas || !_hmOffscreen) return;
    var ctx = canvas.getContext('2d');
    var nC = _hmOffscreen.width, nR = _hmOffscreen.height;

    var fitScale = canvas.width / nC;
    var scale = fitScale * _hmView.zoom;
    var visW = canvas.width / scale;
    var visH = canvas.height / scale;

    _hmView.x = Math.max(0, Math.min(_hmView.x, nC - visW));
    _hmView.y = Math.max(0, Math.min(_hmView.y, nR - visH));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(_hmOffscreen,
        _hmView.x, _hmView.y, visW, visH,
        0, 0, canvas.width, canvas.height
    );
    _hmDrawHighlightOverlay();
}

/* ---- Annotation tracks ---- */
function drawColTracks() {
    var canvas = document.getElementById('hm-col-tracks');
    if (!canvas || typeof DATA_HEATMAP === 'undefined') return;
    var ctx = canvas.getContext('2d');
    var colOrder = DATA_HEATMAP.col_orders[_hmCurrentColOrder];
    var nC = _hmCols;

    var mainCanvas = document.getElementById('hm-canvas');
    var fitScale = mainCanvas.width / nC;
    var scale = fitScale * _hmView.zoom;

    canvas.width = mainCanvas.width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var maxImp = 0;
    DATA_HEATMAP.col_annotations.importance.forEach(function(v) { if (v > maxImp) maxImp = v; });

    for (var vx = 0; vx < nC; vx++) {
        var srcCol = colOrder[vx];
        var px = (vx - _hmView.x) * scale;
        var pw = Math.max(scale, 0.5);
        if (px + pw < 0 || px > canvas.width) continue;

        // Track 1: Channel (y=0, h=12)
        var ch = DATA_HEATMAP.col_annotations.channel[srcCol];
        ctx.fillStyle = DATA_HEATMAP.colors.channel[ch] || '#4b5563';
        ctx.fillRect(px, 0, pw, 12);

        // Track 2: Pillar (y=14, h=12)
        var pillar = DATA_HEATMAP.col_annotations.pillar[srcCol];
        ctx.fillStyle = DATA_HEATMAP.colors.pillar[pillar] || '#4b5563';
        ctx.fillRect(px, 14, pw, 12);

        // Track 3: Importance (y=28, max h=10)
        var imp = DATA_HEATMAP.col_annotations.importance[srcCol];
        if (imp > 0 && maxImp > 0) {
            var barH = (imp / maxImp) * 10;
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(px, 40 - barH, pw, barH);
        }
    }
}

function drawRowTracks() {
    var canvas = document.getElementById('hm-row-tracks');
    if (!canvas || typeof DATA_HEATMAP === 'undefined') return;
    var ctx = canvas.getContext('2d');
    var rowOrder = DATA_HEATMAP.row_orders[_hmCurrentRowOrder];
    var nR = _hmRows;

    var mainCanvas = document.getElementById('hm-canvas');
    var fitScale = mainCanvas.width / _hmCols;
    var scale = fitScale * _hmView.zoom;
    var rowScale = mainCanvas.height / (nR / _hmView.zoom);
    // Use same vertical scaling as main canvas
    var vFitScale = mainCanvas.height / nR;
    var vScale = vFitScale * _hmView.zoom;

    canvas.height = mainCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var ra = DATA_HEATMAP.row_annotations;
    var colors = DATA_HEATMAP.colors;

    // Year range for gradient
    var minYear = 9999, maxYear = 0;
    ra.years.forEach(function(y) { if (y > 0 && y < minYear) minYear = y; if (y > maxYear) maxYear = y; });

    for (var vy = 0; vy < nR; vy++) {
        var srcRow = rowOrder[vy];
        var py = (vy - _hmView.y) * vScale;
        var ph = Math.max(vScale, 0.3);
        if (py + ph < 0 || py > canvas.height) continue;

        // Track 1: Cluster (x=0, w=12)
        var cl = String(ra.clusters[srcRow]);
        ctx.fillStyle = colors.cluster[cl] || '#4b5563';
        ctx.fillRect(0, py, 12, ph);

        // Track 2: Org type (x=14, w=12)
        var ot = ra.org_types[srcRow];
        ctx.fillStyle = colors.org_type[ot] || '#4b5563';
        ctx.fillRect(14, py, 12, ph);

        // Track 3: Region (x=28, w=12)
        var reg = ra.regions[srcRow];
        ctx.fillStyle = colors.region[reg] || '#4b5563';
        ctx.fillRect(28, py, 12, ph);

        // Track 4: Year gradient (x=42, w=12)
        var yr = ra.years[srcRow];
        if (yr > 0 && maxYear > minYear) {
            var yrNorm = (yr - minYear) / (maxYear - minYear);
            var brightness = Math.round(40 + yrNorm * 200);
            ctx.fillStyle = 'rgb(' + brightness + ',' + brightness + ',' + Math.round(brightness * 0.7) + ')';
        } else {
            ctx.fillStyle = '#1a1a1a';
        }
        ctx.fillRect(42, py, 12, ph);
    }
}

/* ---- Minimap ---- */
function drawMinimap() {
    var mc = document.getElementById('hm-minimap');
    if (!mc || !_hmOffscreen) return;
    var showCheckbox = document.getElementById('hm-show-minimap');
    if (showCheckbox && !showCheckbox.checked) { mc.style.display = 'none'; return; }
    mc.style.display = 'block';

    var mctx = mc.getContext('2d');
    mctx.imageSmoothingEnabled = true;
    mctx.drawImage(_hmOffscreen, 0, 0, mc.width, mc.height);

    // Viewport rectangle
    var mainCanvas = document.getElementById('hm-canvas');
    var fitScale = mainCanvas.width / _hmCols;
    var scale = fitScale * _hmView.zoom;
    var visW = mainCanvas.width / scale;
    var visH = mainCanvas.height / scale;

    var rx = _hmView.x / _hmCols * mc.width;
    var ry = _hmView.y / _hmRows * mc.height;
    var rw = visW / _hmCols * mc.width;
    var rh = visH / _hmRows * mc.height;

    mctx.strokeStyle = '#6366f1';
    mctx.lineWidth = 2;
    mctx.strokeRect(rx, ry, rw, rh);
}

/* ---- Crosshair + Tooltip ---- */
function _hmMouseMove(e) {
    if (_hmDrag.active) return;
    var canvas = document.getElementById('hm-canvas');
    if (!canvas || !_hmMatrix) return;

    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;

    // Scale pixel coords to canvas coords (handle CSS scaling)
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    px *= scaleX;
    py *= scaleY;

    var fitScale = canvas.width / _hmCols;
    var scale = fitScale * _hmView.zoom;
    var vFitScale = canvas.height / _hmRows;
    var vScale = vFitScale * _hmView.zoom;

    var matX = Math.floor(_hmView.x + px / scale);
    var matY = Math.floor(_hmView.y + py / vScale);

    var tooltip = document.getElementById('hm-tooltip');
    if (matX < 0 || matX >= _hmCols || matY < 0 || matY >= _hmRows) {
        if (tooltip) tooltip.style.display = 'none';
        return;
    }

    var rowOrder = DATA_HEATMAP.row_orders[_hmCurrentRowOrder];
    var colOrder = DATA_HEATMAP.col_orders[_hmCurrentColOrder];
    var srcRow = rowOrder[matY];
    var srcCol = colOrder[matX];
    var value = _hmMatrix[srcRow * _hmCols + srcCol];

    var ra = DATA_HEATMAP.row_annotations;
    var ca = DATA_HEATMAP.col_annotations;

    if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY - 40) + 'px';
        tooltip.innerHTML =
            '<strong>' + ca.names[srcCol] + '</strong> (' + ca.channel[srcCol] + ')<br>' +
            ra.titles[srcRow] + '<br>' +
            '<span style="color:#94a3b8;">' + ra.orgs[srcRow] + ' · ' + ra.years[srcRow] + ' · ' + ra.org_types[srcRow] + '</span><br>' +
            'Score: <strong style="color:#fcd34d;">' + value + '</strong>/100';
    }

    // Update feature name bar
    var featureBar = document.getElementById('hm-feature-bar');
    if (featureBar) {
        var pillarStr = ca.pillar[srcCol] === 'none' ? '' : ' · ' + ca.pillar[srcCol];
        featureBar.innerHTML = '<span class="feat-name">' + ca.names[srcCol] + '</span> <span class="feat-channel">(' + ca.channel[srcCol] + pillarStr + ')</span>';
    }

    // Draw crosshair overlay
    drawViewport();
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = 'rgba(99,102,241,0.5)';
    ctx.lineWidth = 1;
    // Horizontal line
    var cellPx = px;
    var cellPy = py;
    ctx.beginPath();
    ctx.moveTo(0, cellPy);
    ctx.lineTo(canvas.width, cellPy);
    ctx.stroke();
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(cellPx, 0);
    ctx.lineTo(cellPx, canvas.height);
    ctx.stroke();
    ctx.restore();
}

function _hmMouseLeave() {
    var tooltip = document.getElementById('hm-tooltip');
    if (tooltip) tooltip.style.display = 'none';
    var featureBar = document.getElementById('hm-feature-bar');
    if (featureBar) featureBar.innerHTML = 'Hover over the heatmap to see feature names';
    drawViewport();
}

/* ---- Column Track Hover ---- */
function _hmColTrackHover(e) {
    var canvas = document.getElementById('hm-col-tracks');
    if (!canvas || !_hmMatrix) return;
    var rect = canvas.getBoundingClientRect();
    var px = (e.clientX - rect.left) * (canvas.width / rect.width);
    var py = (e.clientY - rect.top) * (canvas.height / rect.height);

    var fitScale = canvas.width / _hmCols;
    var scale = fitScale * _hmView.zoom;
    var matX = Math.floor(_hmView.x + px / scale);

    if (matX < 0 || matX >= _hmCols) { _hmMouseLeave(); return; }

    var colOrder = DATA_HEATMAP.col_orders[_hmCurrentColOrder];
    var srcCol = colOrder[matX];
    var ca = DATA_HEATMAP.col_annotations;

    // Determine which track is hovered (by y position)
    var trackName = '';
    var trackValue = '';
    if (py < 12) {
        trackName = 'Channel';
        trackValue = ca.channel[srcCol];
    } else if (py < 26) {
        trackName = 'Pillar';
        trackValue = ca.pillar[srcCol] === 'none' ? 'non-C1' : ca.pillar[srcCol];
    } else {
        trackName = 'Importance';
        trackValue = ca.importance[srcCol] > 0 ? ca.importance[srcCol].toFixed(5) : 'not in top 30';
    }

    var tooltip = document.getElementById('hm-tooltip');
    if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY - 40) + 'px';
        tooltip.innerHTML =
            '<strong>' + ca.names[srcCol] + '</strong><br>' +
            '<span style="color:#94a3b8;">' + trackName + ':</span> <strong>' + trackValue + '</strong><br>' +
            '<span style="color:#94a3b8;">Channel:</span> ' + ca.channel[srcCol] +
            ' · <span style="color:#94a3b8;">Pillar:</span> ' + (ca.pillar[srcCol] === 'none' ? '—' : ca.pillar[srcCol]) +
            ' · <span style="color:#94a3b8;">Var:</span> ' + ca.variance[srcCol].toFixed(3);
    }
}

/* ---- Row Track Hover ---- */
function _hmRowTrackHover(e) {
    var canvas = document.getElementById('hm-row-tracks');
    if (!canvas || !_hmMatrix) return;
    var mainCanvas = document.getElementById('hm-canvas');
    var rect = canvas.getBoundingClientRect();
    var px = (e.clientX - rect.left) * (canvas.width / rect.width);
    var py = (e.clientY - rect.top) * (canvas.height / rect.height);

    var vFitScale = mainCanvas.height / _hmRows;
    var vScale = vFitScale * _hmView.zoom;
    var matY = Math.floor(_hmView.y + py / vScale);

    if (matY < 0 || matY >= _hmRows) { _hmMouseLeave(); return; }

    var rowOrder = DATA_HEATMAP.row_orders[_hmCurrentRowOrder];
    var srcRow = rowOrder[matY];
    var ra = DATA_HEATMAP.row_annotations;
    var clusterLabels = typeof SHORT !== 'undefined' ? SHORT : {};

    // Determine which track
    var trackName = '';
    var trackValue = '';
    if (px < 12) {
        trackName = 'Cluster';
        var cl = ra.clusters[srcRow];
        trackValue = (clusterLabels[cl] || 'C' + cl);
    } else if (px < 26) {
        trackName = 'Org Type';
        trackValue = ra.org_types[srcRow] || '—';
    } else if (px < 40) {
        trackName = 'Region';
        trackValue = ra.regions[srcRow] || '—';
    } else {
        trackName = 'Year';
        trackValue = ra.years[srcRow] || '—';
    }

    var tooltip = document.getElementById('hm-tooltip');
    if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY - 40) + 'px';
        tooltip.innerHTML =
            '<strong>' + (ra.titles[srcRow] || ra.keys[srcRow]) + '</strong><br>' +
            '<span style="color:#94a3b8;">' + trackName + ':</span> <strong>' + trackValue + '</strong><br>' +
            '<span style="color:#94a3b8;">Org:</span> ' + (ra.orgs[srcRow] || '—') +
            ' · <span style="color:#94a3b8;">Year:</span> ' + ra.years[srcRow] +
            ' · <span style="color:#94a3b8;">Cluster:</span> ' + (clusterLabels[ra.clusters[srcRow]] || 'C' + ra.clusters[srcRow]) +
            ' · <span style="color:#94a3b8;">Type:</span> ' + (ra.org_types[srcRow] || '—');
    }
}

/* ---- Zoom ---- */
function _hmWheel(e) {
    e.preventDefault();
    var canvas = document.getElementById('hm-canvas');
    if (!canvas) return;

    var zoomFactor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    var oldZoom = _hmView.zoom;
    _hmView.zoom = Math.max(1, Math.min(25, _hmView.zoom * zoomFactor));

    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) / rect.width;
    var my = (e.clientY - rect.top) / rect.height;

    var fitScaleX = canvas.width / _hmCols;
    var fitScaleY = canvas.height / _hmRows;
    var oldVisW = canvas.width / (fitScaleX * oldZoom);
    var oldVisH = canvas.height / (fitScaleY * oldZoom);
    var newVisW = canvas.width / (fitScaleX * _hmView.zoom);
    var newVisH = canvas.height / (fitScaleY * _hmView.zoom);

    _hmView.x += (oldVisW - newVisW) * mx;
    _hmView.y += (oldVisH - newVisH) * my;

    drawViewport();
    drawColTracks();
    drawRowTracks();
    drawMinimap();
}

/* ---- Pan ---- */
function _hmMouseDown(e) {
    _hmDrag.active = true;
    _hmDrag.startX = e.clientX;
    _hmDrag.startY = e.clientY;
    _hmDrag.origX = _hmView.x;
    _hmDrag.origY = _hmView.y;
    var canvas = document.getElementById('hm-canvas');
    if (canvas) canvas.style.cursor = 'grabbing';
}

function _hmMouseMoveDrag(e) {
    if (!_hmDrag.active) return;
    var canvas = document.getElementById('hm-canvas');
    if (!canvas) return;

    var fitScaleX = canvas.width / _hmCols;
    var fitScaleY = canvas.height / _hmRows;
    var scaleX = fitScaleX * _hmView.zoom;
    var scaleY = fitScaleY * _hmView.zoom;
    var rect = canvas.getBoundingClientRect();
    var cssToCanvasX = canvas.width / rect.width;
    var cssToCanvasY = canvas.height / rect.height;

    _hmView.x = _hmDrag.origX - (e.clientX - _hmDrag.startX) * cssToCanvasX / scaleX;
    _hmView.y = _hmDrag.origY - (e.clientY - _hmDrag.startY) * cssToCanvasY / scaleY;

    drawViewport();
    drawColTracks();
    drawRowTracks();
    drawMinimap();
}

function _hmMouseUp() {
    _hmDrag.active = false;
    var canvas = document.getElementById('hm-canvas');
    if (canvas) canvas.style.cursor = 'crosshair';
}

/* ---- Minimap click to navigate ---- */
function _hmMinimapClick(e) {
    var mc = document.getElementById('hm-minimap');
    if (!mc) return;
    var rect = mc.getBoundingClientRect();
    var mx = (e.clientX - rect.left) / rect.width;
    var my = (e.clientY - rect.top) / rect.height;

    var canvas = document.getElementById('hm-canvas');
    var fitScaleX = canvas.width / _hmCols;
    var fitScaleY = canvas.height / _hmRows;
    var visW = canvas.width / (fitScaleX * _hmView.zoom);
    var visH = canvas.height / (fitScaleY * _hmView.zoom);

    _hmView.x = mx * _hmCols - visW / 2;
    _hmView.y = my * _hmRows - visH / 2;

    drawViewport();
    drawColTracks();
    drawRowTracks();
    drawMinimap();
}

/* ---- KPI Cards ---- */
function renderHeatmapOverviewKpi() {
    var el = document.getElementById('hm-overview-kpi');
    if (!el || typeof DATA_HEATMAP === 'undefined') return;
    var m = DATA_HEATMAP.meta;
    var totalCells = m.nRows * m.nCols;
    el.innerHTML =
        '<div class="kpi-card"><div class="kpi-value">' + totalCells.toLocaleString() + '</div><div class="kpi-label">Matrix Cells</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + m.zeroPct + '%</div><div class="kpi-label">Zero Cells</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + m.nCols + '</div><div class="kpi-label">Feature Columns</div></div>' +
        '<div class="kpi-card"><div class="kpi-value">' + m.nRows.toLocaleString() + '</div><div class="kpi-label">Statement Rows</div></div>';
}

/* ---- Sizing ---- */
function sizeHeatmapCanvases() {
    var wrap = document.getElementById('hm-main-wrap');
    if (!wrap) return;
    var w = wrap.clientWidth;
    if (w < 100) return;

    var canvas = document.getElementById('hm-canvas');
    var colTracks = document.getElementById('hm-col-tracks');
    var rowTracks = document.getElementById('hm-row-tracks');

    // Aspect ratio: 347 cols / 2021 rows ≈ 0.172. For screen, use 3:2 aspect
    var h = Math.min(Math.round(w * 0.8), 900);

    canvas.width = w;
    canvas.height = h;
    colTracks.width = w;
    rowTracks.height = h;
}

/* ---- Init Overview ---- */
function initHeatmapOverview() {
    if (typeof DATA_HEATMAP === 'undefined') {
        setTimeout(initHeatmapOverview, 200);
        return;
    }

    decodeMatrix();
    buildColorLUT();
    renderHeatmapOverviewKpi();
    sizeHeatmapCanvases();

    var rowOrder = DATA_HEATMAP.row_orders[_hmCurrentRowOrder];
    var colOrder = DATA_HEATMAP.col_orders[_hmCurrentColOrder];
    renderFullMatrix(rowOrder, colOrder);

    // Wire events
    var canvas = document.getElementById('hm-canvas');
    if (canvas) {
        canvas.addEventListener('mousemove', function(e) {
            if (_hmDrag.active) _hmMouseMoveDrag(e); else _hmMouseMove(e);
        });
        canvas.addEventListener('mouseleave', _hmMouseLeave);
        canvas.addEventListener('wheel', _hmWheel, { passive: false });
        canvas.addEventListener('mousedown', _hmMouseDown);
        canvas.addEventListener('click', _hmCanvasClick);
    }
    window.addEventListener('mouseup', _hmMouseUp);

    // Wire column track hover
    var colTracks = document.getElementById('hm-col-tracks');
    if (colTracks) {
        colTracks.style.cursor = 'pointer';
        colTracks.addEventListener('mousemove', _hmColTrackHover);
        colTracks.addEventListener('mouseleave', _hmMouseLeave);
    }

    // Wire row track hover
    var rowTracks2 = document.getElementById('hm-row-tracks');
    if (rowTracks2) {
        rowTracks2.style.cursor = 'pointer';
        rowTracks2.addEventListener('mousemove', _hmRowTrackHover);
        rowTracks2.addEventListener('mouseleave', _hmMouseLeave);
    }

    // Wire feature search
    var featureSearchInput = document.getElementById('hm-feature-search');
    if (featureSearchInput) {
        featureSearchInput.addEventListener('input', _hmFeatureSearch);
    }

    var minimap = document.getElementById('hm-minimap');
    if (minimap) minimap.addEventListener('click', _hmMinimapClick);

    var stmtPanelClose = document.getElementById('hm-stmt-panel-close');
    if (stmtPanelClose) stmtPanelClose.addEventListener('click', _hmCloseStmtPanel);

    var minimapCheck = document.getElementById('hm-show-minimap');
    if (minimapCheck) minimapCheck.addEventListener('change', drawMinimap);

    // Order controls
    var rowSelect = document.getElementById('hm-row-order');
    var colSelect = document.getElementById('hm-col-order');
    if (rowSelect) rowSelect.addEventListener('change', function() {
        _hmCurrentRowOrder = this.value;
        renderFullMatrix(DATA_HEATMAP.row_orders[_hmCurrentRowOrder], DATA_HEATMAP.col_orders[_hmCurrentColOrder]);
    });
    if (colSelect) colSelect.addEventListener('change', function() {
        _hmCurrentColOrder = this.value;
        renderFullMatrix(DATA_HEATMAP.row_orders[_hmCurrentRowOrder], DATA_HEATMAP.col_orders[_hmCurrentColOrder]);
    });
}

/* ============================================================
   Explorer Sub-Tab (ECharts-based drill-down)
   ============================================================ */

function initExplorerFilters() {
    if (typeof DATA_HEATMAP === 'undefined') return;
    var ra = DATA_HEATMAP.row_annotations;
    var ca = DATA_HEATMAP.col_annotations;

    // Populate cluster filter
    var clusterSel = document.getElementById('hm-exp-cluster');
    if (clusterSel && clusterSel.options.length <= 1) {
        var labels = typeof SHORT !== 'undefined' ? SHORT : {};
        for (var c = 0; c < 6; c++) {
            var opt = document.createElement('option');
            opt.value = String(c);
            opt.textContent = 'C' + c + (labels[c] ? ' ' + labels[c] : '');
            clusterSel.appendChild(opt);
        }
    }

    // Populate org type filter
    var otSel = document.getElementById('hm-exp-orgtype');
    if (otSel && otSel.options.length <= 1) {
        var otSet = {};
        ra.org_types.forEach(function(ot) { if (ot) otSet[ot] = true; });
        Object.keys(otSet).sort().forEach(function(ot) {
            var opt = document.createElement('option');
            opt.value = ot; opt.textContent = ot;
            otSel.appendChild(opt);
        });
    }

    // Populate region filter
    var regSel = document.getElementById('hm-exp-region');
    if (regSel && regSel.options.length <= 1) {
        var regSet = {};
        ra.regions.forEach(function(r) { if (r) regSet[r] = true; });
        Object.keys(regSet).sort().forEach(function(r) {
            var opt = document.createElement('option');
            opt.value = r; opt.textContent = r;
            regSel.appendChild(opt);
        });
    }

    // Populate channel filter
    var chSel = document.getElementById('hm-exp-channel');
    if (chSel && chSel.options.length <= 1) {
        ['C1', 'C2', 'C3', 'crosswalk'].forEach(function(ch) {
            var opt = document.createElement('option');
            opt.value = ch; opt.textContent = ch;
            chSel.appendChild(opt);
        });
    }

    // Populate pillar filter
    var pilSel = document.getElementById('hm-exp-pillar');
    if (pilSel && pilSel.options.length <= 1) {
        var pilSet = {};
        ca.pillar.forEach(function(p) { if (p && p !== 'none') pilSet[p] = true; });
        Object.keys(pilSet).sort().forEach(function(p) {
            var opt = document.createElement('option');
            opt.value = p; opt.textContent = p;
            pilSel.appendChild(opt);
        });
    }

    // Wire Go button
    var goBtn = document.getElementById('hm-exp-go');
    if (goBtn) goBtn.addEventListener('click', renderExplorerHeatmap);
}

function renderExplorerHeatmap() {
    if (!_hmMatrix) decodeMatrix();
    var ra = DATA_HEATMAP.row_annotations;
    var ca = DATA_HEATMAP.col_annotations;

    var fCluster = (document.getElementById('hm-exp-cluster') || {}).value || 'all';
    var fOrgType = (document.getElementById('hm-exp-orgtype') || {}).value || 'all';
    var fRegion = (document.getElementById('hm-exp-region') || {}).value || 'all';
    var fChannel = (document.getElementById('hm-exp-channel') || {}).value || 'all';
    var fPillar = (document.getElementById('hm-exp-pillar') || {}).value || 'all';

    // Filter rows
    var rowIdxs = [];
    for (var i = 0; i < _hmRows; i++) {
        if (fCluster !== 'all' && String(ra.clusters[i]) !== fCluster) continue;
        if (fOrgType !== 'all' && ra.org_types[i] !== fOrgType) continue;
        if (fRegion !== 'all' && ra.regions[i] !== fRegion) continue;
        rowIdxs.push(i);
    }

    // Filter columns
    var colIdxs = [];
    for (var j = 0; j < _hmCols; j++) {
        if (fChannel !== 'all' && ca.channel[j] !== fChannel) continue;
        if (fPillar !== 'all' && ca.pillar[j] !== fPillar) continue;
        colIdxs.push(j);
    }

    var totalCells = rowIdxs.length * colIdxs.length;
    var status = document.getElementById('hm-exp-status');
    var title = document.getElementById('hm-exp-title');

    if (totalCells > 20000) {
        if (status) status.textContent = 'Too many cells (' + totalCells.toLocaleString() + '). Narrow your filters (max ~20,000).';
        if (title) title.textContent = 'Filter too broad';
        return;
    }
    if (rowIdxs.length === 0 || colIdxs.length === 0) {
        if (status) status.textContent = 'No matching data.';
        return;
    }

    if (status) status.textContent = rowIdxs.length + ' rows × ' + colIdxs.length + ' cols = ' + totalCells.toLocaleString() + ' cells';
    if (title) title.textContent = rowIdxs.length + ' Statements × ' + colIdxs.length + ' Features';

    // Build ECharts data
    var hdata = [];
    var yLabels = rowIdxs.map(function(ri) {
        return (ra.titles[ri] || ra.keys[ri]).substring(0, 35);
    });
    var xLabels = colIdxs.map(function(ci) {
        return ca.names[ci].substring(0, 22);
    });

    for (var yi = 0; yi < rowIdxs.length; yi++) {
        var ri = rowIdxs[yi];
        for (var xi = 0; xi < colIdxs.length; xi++) {
            var ci = colIdxs[xi];
            var val = _hmMatrix[ri * _hmCols + ci];
            if (val > 0) hdata.push([xi, yi, val]);
        }
    }

    // Compute chart height based on row count
    var chartH = Math.max(400, Math.min(1200, rowIdxs.length * 18 + 100));
    var el = document.getElementById('chart-hm-explorer');
    if (!el) return;
    el.style.height = chartH + 'px';

    var existingChart = echarts.getInstanceByDom(el);
    if (existingChart) existingChart.dispose();
    var chart = echarts.init(el);

    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), {
            position: 'top',
            formatter: function(p) {
                var ri2 = rowIdxs[p.value[1]];
                var ci2 = colIdxs[p.value[0]];
                return '<strong>' + ca.names[ci2] + '</strong><br>'
                    + ra.titles[ri2] + '<br>'
                    + 'Score: <strong>' + p.value[2] + '</strong>/100';
            }
        }),
        grid: {
            left: Math.min(280, 10 + Math.max.apply(null, yLabels.map(function(l) { return l.length * 6; }))),
            right: 50, top: 100, bottom: 20
        },
        xAxis: {
            type: 'category', data: xLabels, position: 'top',
            axisLabel: { color: '#94a3b8', fontSize: 8, rotate: 60, interval: 0 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            type: 'category', data: yLabels, inverse: true,
            axisLabel: { color: '#94a3b8', fontSize: 8, interval: 0 },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        visualMap: {
            min: 0, max: 100, calculable: true, orient: 'horizontal',
            left: 'center', top: 5,
            inRange: { color: ['#000004', '#280b54', '#65156e', '#b5367a', '#e8502a', '#f5b543', '#fcffa4'] },
            textStyle: { color: '#94a3b8' }
        },
        series: [{
            type: 'heatmap', data: hdata,
            large: hdata.length > 8000,
            label: { show: hdata.length < 300, color: '#f1f5f9', fontSize: 7,
                formatter: function(p) { return p.value[2]; } },
            emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.5)' } },
            itemStyle: { borderWidth: hdata.length < 500 ? 0.5 : 0, borderColor: '#0f172a' }
        }]
    });

    _register(chart);
}

/* ============================================================
   Patterns Sub-Tab
   ============================================================ */

function initPatterns() {
    // Wire pattern buttons
    document.querySelectorAll('.pattern-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.pattern-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            renderPattern(this.dataset.pattern);
        });
    });
    renderPattern('hottest');
}

function renderPattern(patternId) {
    var el = document.getElementById('hm-pattern-content');
    if (!el || typeof DATA_HEATMAP === 'undefined') return;
    if (!_hmMatrix) decodeMatrix();

    var patterns = DATA_HEATMAP.patterns;
    var ra = DATA_HEATMAP.row_annotations;
    var ca = DATA_HEATMAP.col_annotations;

    if (patternId === 'hottest') {
        var rows = patterns.hottest_rows;
        var scores = patterns.hottest_scores;
        var html = '<div class="narrative-box" style="margin-bottom:1rem;">';
        html += '<h3>Top 20 Most Active Statements</h3>';
        html += '<p>These statements have the highest total feature activation — they engage with the most governance dimensions simultaneously. High activation often indicates comprehensive, multi-pillar governance frameworks.</p>';
        html += '</div>';
        html += '<div class="chart-card"><h3>Activation Heatmap (20 × 347)</h3>';
        html += '<div id="chart-pattern-heatmap" style="width:100%;height:500px;"></div></div>';
        html += '<table class="feature-table" style="margin-top:1rem;"><thead><tr><th>Rank</th><th>Statement</th><th>Org</th><th>Year</th><th>Total Score</th></tr></thead><tbody>';
        rows.forEach(function(ri, idx) {
            html += '<tr><td>' + (idx + 1) + '</td><td>' + ra.titles[ri] + '</td><td>' + ra.orgs[ri] + '</td><td>' + ra.years[ri] + '</td><td><strong>' + scores[idx] + '</strong></td></tr>';
        });
        html += '</tbody></table>';
        el.innerHTML = html;
        renderPatternHeatmap('chart-pattern-heatmap', rows);

    } else if (patternId === 'coldest') {
        var rows2 = patterns.coldest_rows;
        var scores2 = patterns.coldest_scores;
        var html2 = '<div class="narrative-box" style="margin-bottom:1rem;">';
        html2 += '<h3>Top 20 Most Sparse Statements</h3>';
        html2 += '<p>These statements have the lowest non-zero activation — they engage with very few governance dimensions. Often these are narrowly focused sector-specific documents, brief declarations, or early-stage aspirational statements.</p>';
        html2 += '</div>';
        html2 += '<div class="chart-card"><h3>Activation Heatmap (20 × 347)</h3>';
        html2 += '<div id="chart-pattern-heatmap" style="width:100%;height:500px;"></div></div>';
        html2 += '<table class="feature-table" style="margin-top:1rem;"><thead><tr><th>Rank</th><th>Statement</th><th>Org</th><th>Year</th><th>Total Score</th></tr></thead><tbody>';
        rows2.forEach(function(ri, idx) {
            html2 += '<tr><td>' + (idx + 1) + '</td><td>' + ra.titles[ri] + '</td><td>' + ra.orgs[ri] + '</td><td>' + ra.years[ri] + '</td><td><strong>' + scores2[idx] + '</strong></td></tr>';
        });
        html2 += '</tbody></table>';
        el.innerHTML = html2;
        renderPatternHeatmap('chart-pattern-heatmap', rows2);

    } else if (patternId === 'cluster-sig') {
        var profiles = patterns.cluster_profiles;
        var html3 = '<div class="narrative-box" style="margin-bottom:1rem;">';
        html3 += '<h3>Cluster Signature Profiles</h3>';
        html3 += '<p>Each row shows the <strong>mean feature vector</strong> for one of the 6 policy families. This reveals the governance "DNA" of each cluster — which dimensions each family prioritizes. Bright columns in one row but dark in others are the cluster\'s distinguishing features.</p>';
        html3 += '</div>';
        html3 += '<div class="chart-card"><h3>Mean Profile Heatmap (6 Clusters × 347 Features)</h3>';
        html3 += '<div id="chart-pattern-cluster" style="width:100%;height:350px;"></div></div>';
        el.innerHTML = html3;
        renderClusterProfileHeatmap('chart-pattern-cluster', profiles);

    } else if (patternId === 'traditions') {
        var ta = patterns.tradition_activation;
        var html4 = '<div class="narrative-box" style="margin-bottom:1rem;">';
        html4 += '<h3>Tradition-Specific Concept Activation</h3>';
        html4 += '<p>This shows which statements activate tradition-specific governance concepts — features like <em>khalifah</em> (Islamic stewardship), <em>imago Dei</em> (Christian dignity), <em>indigenous data sovereignty</em>, and <em>kedusha</em> (Jewish sanctity). These concepts are highly sparse but define the unique contribution of religious and indigenous governance traditions.</p>';
        html4 += '</div>';
        // Show stats per tradition
        Object.keys(ta).forEach(function(tradition) {
            var info = ta[tradition];
            html4 += '<div class="chart-card" style="margin-bottom:1rem;">';
            html4 += '<h3 style="text-transform:capitalize;">' + tradition + ' (' + info.n_active + ' statements, ' + info.features.length + ' features)</h3>';
            html4 += '<div id="chart-tradition-' + tradition + '" style="width:100%;height:' + Math.max(200, Math.min(1200, info.row_indices.length * 10 + 80)) + 'px;"></div>';
            html4 += '</div>';
        });
        el.innerHTML = html4;
        // Render each tradition heatmap
        Object.keys(ta).forEach(function(tradition) {
            var info = ta[tradition];
            renderTraditionHeatmap('chart-tradition-' + tradition, info);
        });
    }
}

function renderPatternHeatmap(containerId, rowIndices) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var colOrder = DATA_HEATMAP.col_orders[_hmCurrentColOrder];
    var ca = DATA_HEATMAP.col_annotations;
    var ra = DATA_HEATMAP.row_annotations;

    var xLabels = colOrder.map(function(ci) { return ca.names[ci].substring(0, 15); });
    var yLabels = rowIndices.map(function(ri) { return (ra.titles[ri] || '').substring(0, 30); });

    var hdata = [];
    for (var yi = 0; yi < rowIndices.length; yi++) {
        var ri = rowIndices[yi];
        for (var xi = 0; xi < colOrder.length; xi++) {
            var ci = colOrder[xi];
            var val = _hmMatrix[ri * _hmCols + ci];
            if (val > 0) hdata.push([xi, yi, val]);
        }
    }

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { position: 'top', formatter: function(p) {
            var ci2 = colOrder[p.value[0]];
            return ca.names[ci2] + ': ' + p.value[2] + '/100';
        }}),
        grid: { left: 230, right: 30, top: 10, bottom: 40 },
        xAxis: { type: 'category', data: xLabels, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'category', data: yLabels, inverse: true, axisLabel: { color: '#94a3b8', fontSize: 8, interval: 0 }, axisLine: { lineStyle: { color: '#334155' } } },
        visualMap: { min: 0, max: 100, show: false, inRange: { color: ['#000004', '#280b54', '#65156e', '#b5367a', '#e8502a', '#f5b543', '#fcffa4'] } },
        series: [{ type: 'heatmap', data: hdata, itemStyle: { borderWidth: 0 } }]
    });
    _register(chart);
}

function renderClusterProfileHeatmap(containerId, profiles) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var colOrder = DATA_HEATMAP.col_orders[_hmCurrentColOrder];
    var ca = DATA_HEATMAP.col_annotations;
    var labels = typeof SHORT !== 'undefined' ? SHORT : {};
    var yLabels = [];
    for (var c = 0; c < 6; c++) yLabels.push(labels[c] || 'C' + c);

    var hdata = [];
    var maxVal = 0;
    for (var yi = 0; yi < profiles.length; yi++) {
        for (var xi = 0; xi < colOrder.length; xi++) {
            var ci = colOrder[xi];
            var val = Math.round(profiles[yi][ci]);
            if (val > 0) { hdata.push([xi, yi, val]); if (val > maxVal) maxVal = val; }
        }
    }

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { position: 'top', formatter: function(p) {
            var ci2 = colOrder[p.value[0]];
            return ca.names[ci2] + ' (C' + p.value[1] + '): ' + p.value[2].toFixed(1);
        }}),
        grid: { left: 140, right: 30, top: 10, bottom: 20 },
        xAxis: { type: 'category', data: colOrder.map(function(ci) { return ca.names[ci]; }), axisLabel: { show: false }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'category', data: yLabels, inverse: true, axisLabel: { color: '#94a3b8', fontSize: 10, interval: 0 }, axisLine: { lineStyle: { color: '#334155' } } },
        visualMap: { min: 0, max: Math.max(50, Math.ceil(maxVal / 10) * 10), show: true, orient: 'horizontal', left: 'center', bottom: 0, textStyle: { color: '#94a3b8' }, inRange: { color: ['#000004', '#280b54', '#65156e', '#b5367a', '#e8502a', '#f5b543', '#fcffa4'] } },
        series: [{ type: 'heatmap', data: hdata, itemStyle: { borderWidth: 0 } }]
    });
    _register(chart);
}

function renderTraditionHeatmap(containerId, info) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var ca = DATA_HEATMAP.col_annotations;
    var ra = DATA_HEATMAP.row_annotations;
    var colIndices = info.col_indices;
    var rowIndices = info.row_indices.slice(0, 150); // cap at 150 rows

    var xLabels = colIndices.map(function(ci) { return ca.names[ci]; });
    var yLabels = rowIndices.map(function(ri) { return (ra.titles[ri] || '').substring(0, 30); });

    var hdata = [];
    for (var yi = 0; yi < rowIndices.length; yi++) {
        for (var xi = 0; xi < colIndices.length; xi++) {
            var val = _hmMatrix[rowIndices[yi] * _hmCols + colIndices[xi]];
            if (val > 0) hdata.push([xi, yi, val]);
        }
    }

    var chart = echarts.init(el);
    chart.setOption({
        tooltip: Object.assign({}, _tooltip(), { position: 'top', formatter: function(p) {
            return xLabels[p.value[0]] + ': ' + p.value[2] + '/100';
        }}),
        grid: { left: 240, right: 20, top: 30, bottom: 10 },
        xAxis: { type: 'category', data: xLabels, position: 'top', axisLabel: { color: '#94a3b8', fontSize: 9, rotate: 30, interval: 0 }, axisLine: { lineStyle: { color: '#334155' } } },
        yAxis: { type: 'category', data: yLabels, inverse: true, axisLabel: { color: '#94a3b8', fontSize: 7, interval: 0 }, axisLine: { lineStyle: { color: '#334155' } } },
        visualMap: { min: 0, max: 100, show: false, inRange: { color: ['#000004', '#280b54', '#65156e', '#b5367a', '#e8502a', '#f5b543', '#fcffa4'] } },
        series: [{ type: 'heatmap', data: hdata, itemStyle: { borderWidth: 0.5, borderColor: '#0f172a' } }]
    });
    _register(chart);
}

/* ---- Feature Search & Highlight ---- */
var _hmHighlightCols = []; // visual x indices to highlight

function _hmFeatureSearch() {
    var input = document.getElementById('hm-feature-search');
    var status = document.getElementById('hm-feature-search-status');
    if (!input || typeof DATA_HEATMAP === 'undefined') return;

    var query = input.value.trim().toLowerCase();
    _hmHighlightCols = [];

    if (!query) {
        if (status) status.textContent = '';
        drawViewport();
        drawColTracks();
        return;
    }

    var ca = DATA_HEATMAP.col_annotations;
    var colOrder = DATA_HEATMAP.col_orders[_hmCurrentColOrder];

    // Find matching columns (by visual index)
    for (var vx = 0; vx < colOrder.length; vx++) {
        var srcCol = colOrder[vx];
        var name = ca.names[srcCol].toLowerCase();
        if (name.indexOf(query) !== -1) {
            _hmHighlightCols.push(vx);
        }
    }

    if (status) {
        if (_hmHighlightCols.length === 0) {
            status.textContent = 'No matches';
            status.style.color = '#ef4444';
        } else {
            status.textContent = _hmHighlightCols.length + ' match' + (_hmHighlightCols.length > 1 ? 'es' : '');
            status.style.color = '#10b981';
        }
    }

    // If exactly one match, pan to center it
    if (_hmHighlightCols.length === 1) {
        var canvas = document.getElementById('hm-canvas');
        if (canvas) {
            var fitScale = canvas.width / _hmCols;
            var scale = fitScale * _hmView.zoom;
            var visW = canvas.width / scale;
            _hmView.x = Math.max(0, _hmHighlightCols[0] - visW / 2);
        }
    }

    drawViewport();
    drawColTracks();
}

function _hmDrawHighlightOverlay() {
    if (_hmHighlightCols.length === 0) return;
    var canvas = document.getElementById('hm-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var fitScale = canvas.width / _hmCols;
    var scale = fitScale * _hmView.zoom;

    ctx.save();
    for (var i = 0; i < _hmHighlightCols.length; i++) {
        var vx = _hmHighlightCols[i];
        var px = (vx - _hmView.x) * scale;
        var pw = Math.max(scale, 1);
        if (px + pw < 0 || px > canvas.width) continue;

        // Semi-transparent highlight column
        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.fillRect(px, 0, pw, canvas.height);

        // Bright border lines
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + pw, 0);
        ctx.lineTo(px + pw, canvas.height);
        ctx.stroke();
    }
    ctx.restore();

    // Also highlight on column tracks
    var colCanvas = document.getElementById('hm-col-tracks');
    if (colCanvas) {
        var cctx = colCanvas.getContext('2d');
        cctx.save();
        for (var j = 0; j < _hmHighlightCols.length; j++) {
            var vx2 = _hmHighlightCols[j];
            var px2 = (vx2 - _hmView.x) * scale;
            var pw2 = Math.max(scale, 1);
            if (px2 + pw2 < 0 || px2 > colCanvas.width) continue;
            cctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
            cctx.fillRect(px2, 0, pw2, colCanvas.height);
        }
        cctx.restore();
    }
}

/* ============================================================
   Statement Detail Panel — Click-to-inspect
   ============================================================ */

function _hmCanvasClick(e) {
    // Don't trigger on drag release (moved > 5px)
    var dx = Math.abs(e.clientX - _hmDrag.startX);
    var dy = Math.abs(e.clientY - _hmDrag.startY);
    if (dx > 5 || dy > 5) return;

    var canvas = document.getElementById('hm-canvas');
    if (!canvas || !_hmMatrix) return;

    var rect = canvas.getBoundingClientRect();
    var px = (e.clientX - rect.left) * (canvas.width / rect.width);
    var py = (e.clientY - rect.top) * (canvas.height / rect.height);

    var fitScale = canvas.width / _hmCols;
    var scale = fitScale * _hmView.zoom;
    var vFitScale = canvas.height / _hmRows;
    var vScale = vFitScale * _hmView.zoom;

    var matX = Math.floor(_hmView.x + px / scale);
    var matY = Math.floor(_hmView.y + py / vScale);

    if (matY < 0 || matY >= _hmRows) return;

    var rowOrder = DATA_HEATMAP.row_orders[_hmCurrentRowOrder];
    var srcRow = rowOrder[matY];

    _hmShowStmtDetail(srcRow);
}

function _hmShowStmtDetail(srcRow) {
    var panel = document.getElementById('hm-stmt-panel');
    var titleEl = document.getElementById('hm-stmt-panel-title');
    var body = document.getElementById('hm-stmt-panel-body');
    if (!panel || !body) return;

    var ra = DATA_HEATMAP.row_annotations;
    var ca = DATA_HEATMAP.col_annotations;
    var clusterLabels = typeof SHORT !== 'undefined' ? SHORT : {};
    var clusterColors = DATA_HEATMAP.colors.cluster;

    var key = ra.keys[srcRow];
    var title = ra.titles[srcRow];
    var org = ra.orgs[srcRow];
    var orgType = ra.org_types[srcRow];
    var region = ra.regions[srcRow];
    var year = ra.years[srcRow];
    var cluster = ra.clusters[srcRow];
    var clLabel = clusterLabels[cluster] || ('Cluster ' + cluster);
    var clColor = clusterColors[String(cluster)] || '#6366f1';

    // Extract this row's feature vector and find top features
    var features = [];
    for (var j = 0; j < _hmCols; j++) {
        var val = _hmMatrix[srcRow * _hmCols + j];
        if (val > 0) {
            features.push({ idx: j, name: ca.names[j], channel: ca.channel[j], pillar: ca.pillar[j], score: val });
        }
    }
    features.sort(function(a, b) { return b.score - a.score; });

    // Compute activation stats
    var totalActivation = 0;
    var maxScore = 0;
    for (var k = 0; k < _hmCols; k++) {
        var v = _hmMatrix[srcRow * _hmCols + k];
        totalActivation += v;
        if (v > maxScore) maxScore = v;
    }
    var activeCount = features.length;
    var activePct = (activeCount / _hmCols * 100).toFixed(1);

    // Channel breakdown
    var channelCounts = {};
    features.forEach(function(f) {
        channelCounts[f.channel] = (channelCounts[f.channel] || 0) + 1;
    });

    if (titleEl) titleEl.textContent = title;

    // Build HTML
    var html = '';

    // Metadata cards
    html += '<div class="hm-stmt-meta-grid">';
    html += '<div class="hm-stmt-meta-item"><span class="hm-stmt-meta-label">Key</span><span class="hm-stmt-meta-value">' + key + '</span></div>';
    html += '<div class="hm-stmt-meta-item"><span class="hm-stmt-meta-label">Organization</span><span class="hm-stmt-meta-value">' + org + '</span></div>';
    html += '<div class="hm-stmt-meta-item"><span class="hm-stmt-meta-label">Year</span><span class="hm-stmt-meta-value">' + year + '</span></div>';
    html += '<div class="hm-stmt-meta-item"><span class="hm-stmt-meta-label">Org Type</span><span class="hm-stmt-meta-value">' + orgType + '</span></div>';
    html += '<div class="hm-stmt-meta-item"><span class="hm-stmt-meta-label">Region</span><span class="hm-stmt-meta-value">' + region + '</span></div>';
    html += '<div class="hm-stmt-meta-item"><span class="hm-stmt-meta-label">Policy Family</span><span class="hm-stmt-meta-value" style="color:' + clColor + ';">' + clLabel + '</span></div>';
    html += '</div>';

    // Activation stats
    html += '<div class="hm-stmt-stats">';
    html += '<div class="hm-stmt-stat"><span class="hm-stmt-stat-val">' + activeCount + '/' + _hmCols + '</span><span class="hm-stmt-stat-label">Active Features (' + activePct + '%)</span></div>';
    html += '<div class="hm-stmt-stat"><span class="hm-stmt-stat-val">' + totalActivation.toLocaleString() + '</span><span class="hm-stmt-stat-label">Total Activation</span></div>';
    html += '<div class="hm-stmt-stat"><span class="hm-stmt-stat-val">' + maxScore + '</span><span class="hm-stmt-stat-label">Max Score</span></div>';
    // Channel breakdown
    var chStr = Object.keys(channelCounts).sort().map(function(ch) { return ch + ':' + channelCounts[ch]; }).join(' &middot; ');
    html += '<div class="hm-stmt-stat"><span class="hm-stmt-stat-val" style="font-size:0.9rem;">' + chStr + '</span><span class="hm-stmt-stat-label">Active by Channel</span></div>';
    html += '</div>';

    // Top features bar chart (using ECharts)
    html += '<div class="hm-stmt-section">';
    html += '<h4>Top 20 Activated Features</h4>';
    html += '<div id="hm-stmt-chart" style="width:100%;height:350px;"></div>';
    html += '</div>';

    // Feature table (show top 30)
    var showCount = Math.min(30, features.length);
    html += '<div class="hm-stmt-section">';
    html += '<h4>Feature Activation Detail (' + features.length + ' active)</h4>';
    html += '<div style="max-height:300px;overflow-y:auto;">';
    html += '<table class="data-table"><thead><tr><th>Feature</th><th>Channel</th><th>Pillar</th><th>Score</th></tr></thead><tbody>';
    for (var fi = 0; fi < showCount; fi++) {
        var f = features[fi];
        var barWidth = Math.round(f.score);
        html += '<tr><td>' + f.name + '</td><td><span class="channel-badge ' + f.channel.toLowerCase() + '">' + f.channel + '</span></td>';
        html += '<td>' + (f.pillar === 'none' ? '\u2014' : f.pillar) + '</td>';
        html += '<td><div style="display:flex;align-items:center;gap:6px;"><div style="width:' + barWidth + 'px;height:8px;background:#6366f1;border-radius:2px;"></div><span>' + f.score + '</span></div></td></tr>';
    }
    html += '</tbody></table></div></div>';

    body.innerHTML = html;
    panel.style.display = 'block';

    // Render the top-20 bar chart
    var top20 = features.slice(0, 20);
    var chartEl = document.getElementById('hm-stmt-chart');
    if (chartEl && top20.length > 0) {
        var existingChart = echarts.getInstanceByDom(chartEl);
        if (existingChart) existingChart.dispose();
        var chart = echarts.init(chartEl);

        var channelColorMap = { 'C1': '#6366f1', 'C2': '#38bdf8', 'C3': '#f59e0b', 'crosswalk': '#a855f7' };

        chart.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(15,23,42,0.95)', borderColor: '#334155', textStyle: { color: '#f1f5f9', fontSize: 12 } },
            grid: { left: 180, right: 30, top: 10, bottom: 20 },
            xAxis: { type: 'value', max: 100, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
            yAxis: { type: 'category', data: top20.map(function(f) { return f.name; }).reverse(), axisLabel: { color: '#94a3b8', fontSize: 10 }, axisLine: { lineStyle: { color: '#334155' } } },
            series: [{
                type: 'bar',
                data: top20.map(function(f) { return { value: f.score, itemStyle: { color: channelColorMap[f.channel] || '#6366f1' } }; }).reverse(),
                barWidth: 12,
                label: { show: true, position: 'right', color: '#94a3b8', fontSize: 10, formatter: function(p) { return p.value; } }
            }]
        });

        if (window._charts) window._charts.push(chart);
    }
}

function _hmCloseStmtPanel() {
    var panel = document.getElementById('hm-stmt-panel');
    if (panel) panel.style.display = 'none';
}
