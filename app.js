/* ============================================================
   Governance Genome Explorer v2 — App Controller
   Tab switching, sub-tabs, UMAP controls, theme toggle
   Genome v2 edition
   ============================================================ */

var activeTab = 'overview';
var _tabInited = {};

// ---- Chart Registry ----
// mkChart() is defined in charts_part1.js and pushes to window._charts
if (!window._charts) window._charts = [];

function disposeAllCharts() {
    (window._charts || []).forEach(function (c) {
        try { c.dispose(); } catch (e) { /* ignore */ }
    });
    window._charts = [];
}

function resizeCharts() {
    (window._charts || []).forEach(function (c) {
        try { c.resize(); } catch (e) { /* ignore */ }
    });
}

// ---- Tab Switching ----
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });

    var pane = document.getElementById('pane-' + tabId);
    var btn = document.querySelector('[data-tab="' + tabId + '"]');
    if (pane) pane.classList.add('active');
    if (btn) btn.classList.add('active');

    activeTab = tabId;

    if (!_tabInited[tabId]) {
        _tabInited[tabId] = true;
        initTab(tabId);
    }

    setTimeout(resizeCharts, 50);
}

function initTab(tab) {
    switch (tab) {
        case 'overview':
            renderFindings();
            renderFamilyDonut();
            renderOrgBar();
            renderRegionBar();
            renderVolumeLine();
            break;
        case 'features':
            renderFeaturesCatalogKpi();
            renderFeaturesCatalogTable();
            break;
        case 'heatmap':
            if (typeof initHeatmapOverview === 'function') initHeatmapOverview();
            break;
        case 'policy-map':
            renderUmapMain('cluster');
            renderUmapPie();
            renderUmapLegend('cluster');
            break;
        case 'families':
            renderFamilyCards();
            renderPillarHeatmap();
            renderClusterOrg();
            renderClusterRegion();
            break;
        case 'temporal':
            renderTemporalArea();
            renderTemporalBar();
            renderTemporalLine();
            renderTemporalRadar();
            break;
        case 'sacred-secular':
            renderSacredHist();
            renderSacredUmap();
            break;
        case 'enforcement':
            renderBindingHeatmap();
            renderEnforceGradient();
            renderEnforceInverse();
            break;
        case 'channels':
            renderAblationBar();
            renderChannelPie();
            break;
        case 'encoding-matched':
            if (typeof renderEncodingAblationChart === 'function') {
                renderEncodingAblationChart('chart-encoding-ablation');
            }
            if (typeof renderPerClassF1Chart === 'function') {
                renderPerClassF1Chart('chart-per-class-f1');
            }
            break;
        case 'anchors':
            renderAnchorDiscrim();
            renderAnchorHeatmap();
            break;
        case 'innovation-rights':
            renderParadigmDist();
            renderRegionRatio();
            renderParadigmTemporal();
            if (typeof renderIRScatter === 'function') renderIRScatter();
            break;
        case 'methods':
            if (typeof renderMethodologyProvenance === 'function') renderMethodologyProvenance();
            break;
        case 'rfgini2b':
            renderRfgValidationKpi();
            renderRfgCvAccuracy();
            renderRfgF1();
            renderRfgConfusion();
            renderRfgPermImportance();
            renderRfgGiniImportance();
            renderRfgMediation();
            renderRfgAriEffect();
            break;
    }
}

// ---- Sub-Tab Switching ----
var _subInited = {};

function switchSub(parentTab, subId) {
    var pane = document.getElementById('pane-' + parentTab);
    if (!pane) return;

    pane.querySelectorAll('.sub-pane').forEach(function (p) { p.classList.remove('active'); });
    pane.querySelectorAll('.sub-btn').forEach(function (b) { b.classList.remove('active'); });

    var subPane = document.getElementById('sub-' + subId);
    var subBtn = pane.querySelector('[data-sub="' + subId + '"]');
    if (subPane) subPane.classList.add('active');
    if (subBtn) subBtn.classList.add('active');

    // Initialize sub-tab specific charts
    var subKey = parentTab + '/' + subId;
    if (!_subInited[subKey]) {
        _subInited[subKey] = true;
        initSub(parentTab, subId);
    }

    setTimeout(resizeCharts, 50);
}

function initSub(parentTab, subId) {
    if (parentTab === 'families' && subId === 'families-deep') {
        renderFamilyDetail(0);
    } else if (parentTab === 'families' && subId === 'families-compare') {
        renderSilCurve();
        renderClusterSilBar();
        if (typeof renderClusterSizes === 'function') renderClusterSizes();
    } else if (parentTab === 'families' && subId === 'families-stability') {
        if (typeof renderClusterStability === 'function') renderClusterStability();
        if (typeof renderSilhouetteFan === 'function') renderSilhouetteFan();
    } else if (parentTab === 'sacred-secular' && subId === 'sacred-traditions') {
        renderTraditionTreemap();
        renderTraditionTable();
    } else if (parentTab === 'sacred-secular' && subId === 'sacred-tradition-corr') {
        if (typeof renderTraditionCorrHeatmap === 'function') renderTraditionCorrHeatmap();
    } else if (parentTab === 'channels' && subId === 'channels-features') {
        renderTopFeatures();
        renderCorrelationTable();
        if (typeof renderFeatureSensitivityTable === 'function') renderFeatureSensitivityTable();
        if (typeof renderUmapSensitivityTable === 'function') renderUmapSensitivityTable();
    } else if (parentTab === 'rfgini2b' && subId === 'rfg-robustness') {
        renderRfgRobustnessKpi();
        renderRfgAnchorCorr();
        renderRfgLangCosine();
        renderRfgClusterCompare();
    } else if (parentTab === 'rfgini2b' && subId === 'rfg-reliability') {
        renderRfgReliabilityKpi();
        renderRfgAlphaStrip();
        renderRfgChannelAlpha();
        renderRfgEnumTag();
        renderRfgFlaggedTable();
    } else if (parentTab === 'features' && subId === 'features-structure') {
        renderFeaturesSunburst();
        renderRubricTree();
        renderTypeStackedBar();
        renderPillarTreemap();
    } else if (parentTab === 'features' && subId === 'features-distributions') {
        renderDistributionKpi();
        renderSparsitySpectrum();
        renderVarianceBoxplot();
        renderVarianceSparsityScatter();
        renderChannelSparsityBar();
    } else if (parentTab === 'features' && subId === 'features-importance') {
        renderImportanceKpi();
        renderPermImportanceFeatures();
        renderGiniImportanceFeatures();
        renderImportanceChannelDonut();
        renderImportanceVarianceScatter();
        renderFeatureCorrHeatmap();
        renderPcaScree();
        renderPcLoadings();
        renderFeatureClusterCards();
    } else if (parentTab === 'heatmap' && subId === 'heatmap-explorer') {
        if (typeof initExplorerFilters === 'function') initExplorerFilters();
    } else if (parentTab === 'heatmap' && subId === 'heatmap-patterns') {
        if (typeof initPatterns === 'function') initPatterns();
    }
}

// ---- UMAP Color-By Handler ----
function initUmapControls() {
    var colorBy = document.getElementById('umap-color-by');
    if (colorBy) {
        colorBy.addEventListener('change', function () {
            renderUmapMain(this.value);
            renderUmapLegend(this.value);
        });
    }
}

// ---- Family Detail Selector ----
function initFamilyDetailButtons() {
    document.querySelectorAll('[data-family]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var clusterId = parseInt(this.dataset.family, 10);
            // Update active state
            var parent = this.parentElement;
            if (parent) {
                parent.querySelectorAll('[data-family]').forEach(function (b) {
                    b.classList.remove('active');
                });
            }
            this.classList.add('active');
            renderFamilyDetail(clusterId);
        });
    });
}

// ---- Theme Toggle ----
function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'light' ? null : 'light';
    if (next) {
        document.documentElement.setAttribute('data-theme', next);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('genome-explorer-theme', next || 'dark');

    // Update toggle button text
    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.textContent = next === 'light' ? 'Dark' : 'Light';
    }

    // Re-render: dispose all charts, clear init state, re-init active tab
    disposeAllCharts();
    _tabInited = {};
    _subInited = {};
    initTab(activeTab);

    // Re-init any active sub-tabs
    var activePane = document.getElementById('pane-' + activeTab);
    if (activePane) {
        var activeSub = activePane.querySelector('.sub-pane.active');
        if (activeSub) {
            var subId = activeSub.id.replace('sub-', '');
            _subInited[activeTab + '/' + subId] = true;
            initSub(activeTab, subId);
        }
    }

    setTimeout(resizeCharts, 100);
}

// ---- Header Meta ----
function setHeaderMeta() {
    var el = document.getElementById('header-meta');
    if (el && DATA && DATA.meta) {
        el.textContent = DATA.meta.nStatements + ' statements \u00b7 ' +
                         DATA.meta.nDims + ' dims \u00b7 ' +
                         DATA.meta.nFamilies + ' families \u00b7 ' +
                         DATA.meta.nAnchors + ' anchors \u00b7 ' +
                         'Generated ' + DATA.meta.generated;
    }
}

// ---- Finding Detail Navigation ----
function showFindingDetail(num) {
    var main = document.getElementById('overview-main');
    var detail = document.getElementById('finding-detail-pane');
    if (main) main.style.display = 'none';
    if (detail) detail.style.display = 'block';
    if (typeof renderFindingDetail === 'function') renderFindingDetail(num);
    window.scrollTo(0, 0);
    history.replaceState(null, '', '#finding-' + num);
}
function hideFindingDetail() {
    var main = document.getElementById('overview-main');
    var detail = document.getElementById('finding-detail-pane');
    if (detail) detail.style.display = 'none';
    if (main) main.style.display = '';
    (window._findingCharts || []).forEach(function(c) { try { c.dispose(); } catch(e) {} });
    window._findingCharts = [];
    history.replaceState(null, '', location.pathname);
}

// ---- Resize Handler ----
var _resizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(resizeCharts, 150);
});

// ---- Init on Load ----
document.addEventListener('DOMContentLoaded', function () {
    // Restore theme
    var saved = localStorage.getItem('genome-explorer-theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        var toggle = document.getElementById('theme-toggle');
        if (toggle) toggle.textContent = 'Dark';
    }

    // Wire tab buttons
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            switchTab(this.dataset.tab);
        });
    });

    // Wire sub-tab buttons
    document.querySelectorAll('.sub-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var parentPane = this.closest('.tab-pane');
            if (parentPane) {
                var parentTab = parentPane.id.replace('pane-', '');
                switchSub(parentTab, this.dataset.sub);
            }
        });
    });

    // Wire theme toggle
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    // Wire UMAP controls
    initUmapControls();

    // Wire family detail buttons
    initFamilyDetailButtons();

    // Set header meta
    setHeaderMeta();

    // Init first tab
    switchTab('overview');

    // Wire finding card clicks (event delegation)
    document.addEventListener('click', function(e) {
        var card = e.target.closest('.finding-card');
        if (card && card.dataset.findingNum) {
            showFindingDetail(parseInt(card.dataset.findingNum, 10));
            return;
        }
    });

    // Deep-link to specific finding
    if (location.hash && location.hash.indexOf('#finding-') === 0) {
        var fnum = parseInt(location.hash.replace('#finding-', ''), 10);
        if (fnum >= 1 && fnum <= 11) {
            setTimeout(function() { showFindingDetail(fnum); }, 300);
        }
    }
});
