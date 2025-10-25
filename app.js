// Global state
let purineData = [];
let translations = {};
let allCategories = [];
let currentCategory = '';
let currentFoodIndex = null;
let sortMode = 'total';
let navigationStack = ['homeScreen'];
let globalMaxPurine = 0;
let globalMaxRisk = 0;
let pinnedFoods = []; // Max 5 food indices for comparison

// Load data
async function loadData() {
    try {
        const [purineResponse, translationsResponse] = await Promise.all([
            fetch('purine_data.json'),
            fetch('translations.json')
        ]);

        purineData = await purineResponse.json();

        // Special handling for beer - set serving to 500g
        purineData = purineData.map(food => {
            if (food.name && food.name.toLowerCase().includes('øl')) {
                return { ...food, serving: 500 };
            }
            return food;
        });

        translations = await translationsResponse.json();
        allCategories = [...new Set(purineData.map(f => f.category))].sort();

        // Calculate global max values for scaling
        globalMaxPurine = Math.max(...purineData.map(f => f.total_purines || 0));
        globalMaxRisk = Math.max(...purineData.map(f => calculateWeightedScore(f)));

        console.log('Data loaded:', purineData.length, 'foods');
        console.log('Global max purine:', globalMaxPurine);
        console.log('Global max risk:', globalMaxRisk);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Kunne ikke laste data. Vennligst sjekk at JSON-filene finnes.');
    }
}

// Calculate weighted uricogenic score
function calculateWeightedScore(food) {
    const H = food.hypoxanthine || 0;
    const A = food.adenine || 0;
    const G = food.guanine || 0;
    const X = food.xanthine || 0;
    return 1.0 * H + 0.6 * A + 0.1 * G + 0.1 * X;
}

// Calculate risk score
function calculateRiskScore(weightedScore) {
    return weightedScore / 300;
}

// Get risk level
function getRiskLevel(riskScore) {
    if (riskScore < 0.2) return { level: 'low', text: 'Lav risiko', desc: 'Trygt ved normalt inntak' };
    if (riskScore < 0.4) return { level: 'moderate', text: 'Moderat risiko', desc: 'Begrens hyppighet' };
    if (riskScore < 0.6) return { level: 'high', text: 'Høy risiko', desc: 'Reduser porsjoner' };
    return { level: 'very-high', text: 'Svært høy risiko', desc: 'Unngå ved urinsyregikt' };
}

// Get color level based on total purine amount
function getPurineLevelColor(purinAmount) {
    if (purinAmount < 50) return 'low';
    if (purinAmount < 150) return 'moderate';
    if (purinAmount < 200) return 'high';
    return 'very-high';
}

// Scale value by serving
function scaleByServing(value, serving) {
    if (!value || !serving) return 0;
    return (value * serving / 100);
}

// Capitalize first letter
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Pinning functions for comparison
function togglePin(foodIndex) {
    const index = pinnedFoods.indexOf(foodIndex);
    if (index > -1) {
        // Already pinned - unpin it
        pinnedFoods.splice(index, 1);
    } else {
        // Not pinned - check if we can add
        if (pinnedFoods.length >= 5) {
            alert('Du kan kun sammenligne 5 matvarer om gangen. Fjern en først.');
            return;
        }
        pinnedFoods.push(foodIndex);
    }
    // Re-render current view
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim().length >= 2) {
        handleSearch(searchInput.value);
    } else if (currentCategory) {
        // Re-render category view if we're browsing a category
        renderCategoryFoods();
    }
}

function isPinned(foodIndex) {
    return pinnedFoods.indexOf(foodIndex) > -1;
}

function clearAllPins() {
    pinnedFoods = [];
    // Re-render current view
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim().length >= 2) {
        handleSearch(searchInput.value);
    } else if (currentCategory) {
        // Re-render category view if we're browsing a category
        renderCategoryFoods();
    }
}

function renderPinnedSection() {
    if (pinnedFoods.length === 0) return '';

    const pinnedHtml = pinnedFoods.map(index => {
        const food = purineData[index];
        if (!food) return '';

        const weightedScore = calculateWeightedScore(food);
        const riskScore = calculateRiskScore(weightedScore);
        const risk = getRiskLevel(riskScore);

        // Get search sort setting for color
        const searchSortBy = appSettings.getSearchSortBy();
        let colorLevel;
        if (searchSortBy === 'purine') {
            colorLevel = getPurineLevelColor(food.total_purines || 0);
        } else {
            colorLevel = risk.level;
        }

        return `
            <div class="food-item pinned-item" onclick="showFoodDetail(${index})">
                <div class="food-item-header">
                    <div class="food-item-title">
                        <h3>${food.name}</h3>
                        <p>${capitalizeFirst(food.preparation)}${food.preparation && food.category ? ' • ' : ''}${food.category}</p>
                    </div>
                    <button class="pin-btn pinned" onclick="event.stopPropagation(); togglePin(${index})">📌</button>
                    <div class="food-item-risk ${colorLevel}"></div>
                </div>
                <div class="food-item-visual">
                    <div class="mini-bar">
                        <div class="mini-bar-fill level-${colorLevel}" style="width: ${(food.total_purines || 0) / globalMaxPurine * 100}%"></div>
                    </div>
                    <div class="food-item-stats">
                        <span><strong>${(food.total_purines || 0).toFixed(1)}</strong> mg/100g</span>
                        <span>Risiko: <strong>${weightedScore.toFixed(1)}</strong></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="pinned-section">
            <div class="pinned-header">
                <h3>Sammenlign (${pinnedFoods.length}/5)</h3>
                <button class="clear-pins-btn" onclick="clearAllPins()">Fjern alle</button>
            </div>
            ${pinnedHtml}
        </div>
    `;
}

// Navigation
function showScreen(screenId, addToStack = true) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (addToStack) {
        navigationStack.push(screenId);
    }

    const isHome = screenId === 'homeScreen';
    document.getElementById('backBtn').style.display = isHome ? 'none' : 'block';
}

function goBack() {
    if (navigationStack.length > 1) {
        navigationStack.pop(); // Remove current screen
        const previousScreen = navigationStack[navigationStack.length - 1];
        showScreen(previousScreen, false);

        // Update header title based on screen
        if (previousScreen === 'homeScreen') {
            document.getElementById('headerTitle').textContent = 'Purin Database';
        } else if (previousScreen === 'searchScreen') {
            document.getElementById('headerTitle').textContent = 'Søk matvare';
        } else if (previousScreen === 'categoriesScreen') {
            document.getElementById('headerTitle').textContent = 'Kategorier';
        } else if (previousScreen === 'categoryFoodsScreen') {
            document.getElementById('headerTitle').textContent = currentCategory;
        }
    }
}

function showSearch() {
    showScreen('searchScreen');
    document.getElementById('headerTitle').textContent = 'Søk matvare';
    setTimeout(() => {
        document.getElementById('searchInput').focus();
    }, 100);
}

function showCategories() {
    showScreen('categoriesScreen');
    document.getElementById('headerTitle').textContent = 'Kategorier';
    renderCategoryGrid();
}

function showCategoryFoods(category) {
    currentCategory = category;
    showScreen('categoryFoodsScreen');
    document.getElementById('headerTitle').textContent = category;
    renderCategorySwitcher();
    renderCategoryFoods();
}

function showFoodDetail(index) {
    currentFoodIndex = index;
    showScreen('foodDetailScreen');
    const food = purineData[index];
    document.getElementById('headerTitle').textContent = food.name;
    renderFoodDetail(food);
}

function showAboutPage() {
    window.location.href = 'about.html';
}

// Render category grid (compact)
function renderCategoryGrid() {
    const html = allCategories.map(cat => {
        const count = purineData.filter(f => f.category === cat).length;
        return `
            <div class="category-btn" onclick="showCategoryFoods('${cat}')">
                ${cat}
                <small>${count} matvarer</small>
            </div>
        `;
    }).join('');
    document.getElementById('categoryGrid').innerHTML = html;
}

// Render category switcher (horizontal scroll)
function renderCategorySwitcher() {
    const html = allCategories.map(cat => `
        <div class="category-chip ${cat === currentCategory ? 'active' : ''}"
             onclick="showCategoryFoods('${cat}')">
            ${cat}
        </div>
    `).join('');
    document.getElementById('categorySwitcher').innerHTML = html;
}

// Set sort mode
function setSortMode(mode) {
    sortMode = mode;
    document.querySelectorAll('#categoryFoodsScreen .toggle-group .toggle-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (i === 0 && mode === 'total') || (i === 1 && mode === 'weighted'));
    });
    renderCategoryFoods();
}

// Render category foods with visual bars - GLOBAL SCALE
function renderCategoryFoods() {
    let foods = purineData
        .map((f, i) => ({ ...f, index: i }))
        .filter(f => f.category === currentCategory);

    // Sort based on mode
    if (sortMode === 'total') {
        foods.sort((a, b) => (b.total_purines || 0) - (a.total_purines || 0));
    } else {
        foods.sort((a, b) => calculateWeightedScore(b) - calculateWeightedScore(a));
    }

    const html = foods.map(food => {
        const weightedScore = calculateWeightedScore(food);
        const riskScore = calculateRiskScore(weightedScore);
        const risk = getRiskLevel(riskScore);

        let barWidth, displayValue, barLevel;

        if (sortMode === 'total') {
            // Sorting by total purines - use GLOBAL scale
            displayValue = `<strong>${(food.total_purines || 0).toFixed(1)}</strong> mg per 100g`;
            barWidth = ((food.total_purines || 0) / globalMaxPurine * 100);
            // Color based on total purine ranges
            if (food.total_purines < 50) barLevel = 'low';
            else if (food.total_purines < 150) barLevel = 'moderate';
            else if (food.total_purines < 200) barLevel = 'high';
            else barLevel = 'very-high';
        } else {
            // Sorting by weighted risk - use GLOBAL scale
            displayValue = `Risiko: <strong>${weightedScore.toFixed(1)}</strong>`;
            barWidth = (weightedScore / globalMaxRisk * 100);
            barLevel = risk.level;
        }

        const pinned = isPinned(food.index);

        return `
            <div class="food-item" onclick="showFoodDetail(${food.index})">
                <div class="food-item-header">
                    <div class="food-item-title">
                        <h3>${food.name}</h3>
                        <p>${capitalizeFirst(food.preparation)}</p>
                    </div>
                    <button class="pin-btn ${pinned ? 'pinned' : ''}" onclick="event.stopPropagation(); togglePin(${food.index})">${pinned ? '📌' : '📍'}</button>
                    <div class="food-item-risk ${risk.level}"></div>
                </div>
                <div class="food-item-visual">
                    <div class="mini-bar">
                        <div class="mini-bar-fill level-${barLevel}" style="width: ${barWidth}%"></div>
                    </div>
                    <div class="food-item-stats">
                        <span>${displayValue}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('categoryFoodsList').innerHTML = html || '<div class="no-results">Ingen matvarer funnet</div>';
}

// Search functionality with settings support
function handleSearch(query) {
    query = query.toLowerCase().trim();

    if (query.length < 2) {
        document.getElementById('searchResults').innerHTML = '<div class="no-results">Skriv minst 2 tegn for å søke</div>';
        return;
    }

    let results = purineData
        .map((f, i) => ({ ...f, index: i }))
        .filter(f =>
            (f.name && f.name.toLowerCase().includes(query)) ||
            (f.category && f.category.toLowerCase().includes(query)) ||
            (f.preparation && f.preparation.toLowerCase().includes(query))
        );

    if (results.length === 0) {
        document.getElementById('searchResults').innerHTML = '<div class="no-results">Ingen resultater funnet</div>';
        return;
    }

    // Sort based on settings
    const searchSortBy = appSettings.getSearchSortBy();
    if (searchSortBy === 'purine') {
        results.sort((a, b) => (b.total_purines || 0) - (a.total_purines || 0));
    } else {
        results.sort((a, b) => calculateWeightedScore(b) - calculateWeightedScore(a));
    }

    const sortInfo = searchSortBy === 'purine'
        ? 'Treff sortert etter purinnivå'
        : 'Treff sortert etter risiko';

    const html = `
        ${renderPinnedSection()}
        <div class="search-sort-info">${sortInfo}</div>
        ${results.map(food => {
            const weightedScore = calculateWeightedScore(food);
            const riskScore = calculateRiskScore(weightedScore);
            const risk = getRiskLevel(riskScore);

            // Determine color based on what's being sorted/displayed
            let colorLevel;
            if (searchSortBy === 'purine') {
                // When sorting by purine, color based on purine amount
                colorLevel = getPurineLevelColor(food.total_purines || 0);
            } else {
                // When sorting by risk, color based on risk level
                colorLevel = risk.level;
            }

            const pinned = isPinned(food.index);

            return `
                <div class="food-item" onclick="showFoodDetail(${food.index})">
                    <div class="food-item-header">
                        <div class="food-item-title">
                            <h3>${food.name}</h3>
                            <p>${capitalizeFirst(food.preparation)}${food.preparation && food.category ? ' • ' : ''}${food.category}</p>
                        </div>
                        <button class="pin-btn ${pinned ? 'pinned' : ''}" onclick="event.stopPropagation(); togglePin(${food.index})">${pinned ? '📌' : '📍'}</button>
                        <div class="food-item-risk ${colorLevel}"></div>
                    </div>
                    <div class="food-item-visual">
                        <div class="mini-bar">
                            <div class="mini-bar-fill level-${colorLevel}" style="width: ${(food.total_purines || 0) / globalMaxPurine * 100}%"></div>
                        </div>
                        <div class="food-item-stats">
                            <span><strong>${(food.total_purines || 0).toFixed(1)}</strong> mg/100g</span>
                            <span>Risiko: <strong>${weightedScore.toFixed(1)}</strong></span>
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    `;

    document.getElementById('searchResults').innerHTML = html;
}

// Render food detail - improved with explanation and settings support
function renderFoodDetail(food) {
    const weightedScore = calculateWeightedScore(food);
    const riskScore = calculateRiskScore(weightedScore);
    const risk = getRiskLevel(riskScore);

    // Get view mode from settings
    const viewMode = appSettings.getDetailViewMode();
    const isServingView = viewMode === 'serving';

    // Calculate per serving values
    const totalPerServing = scaleByServing(food.total_purines, food.serving);
    const weightedPerServing = scaleByServing(weightedScore, food.serving);

    // Main metric for risk card based on view mode
    let mainMetricValue, mainMetricLabel;
    if (isServingView) {
        mainMetricValue = totalPerServing.toFixed(1);
        mainMetricLabel = `${mainMetricValue} mg per porsjon`;
    } else {
        mainMetricValue = (food.total_purines || 0).toFixed(1);
        mainMetricLabel = `${mainMetricValue} mg per 100g`;
    }

    // Calculate max for bar chart scaling
    const purineValues = [
        food.adenine || 0,
        food.guanine || 0,
        food.hypoxanthine || 0,
        food.xanthine || 0
    ];
    const maxPurine = Math.max(...purineValues);

    // Display score based on view mode
    const displayScore = isServingView ? weightedPerServing : weightedScore;

    // Explanation text
    const explanationText = `En porsjon av denne matvaren er typisk ${food.serving} gram. Sammensetningen av de 4 underkategoriene (Hypoxantin, Adenin, Guanin og Xantin) gjør at denne har en vektet risikoscore på ${weightedScore.toFixed(1)}.`;

    const html = `
        <div class="food-detail">
            <div class="food-header">
                <h2>${food.name}</h2>
                <p class="meta">${capitalizeFirst(food.preparation)}${food.preparation && food.category ? ' • ' : ''}${capitalizeFirst(food.category)}</p>
                <p class="serving-info">📏 Porsjon: ${food.serving} gram</p>
            </div>

            <div class="risk-card ${risk.level}">
                <h3>${risk.text}</h3>
                <div class="risk-score">${displayScore.toFixed(1)}</div>

                <!-- Compact purine distribution -->
                <div class="risk-bars">
                    <div class="risk-bar">
                        <div class="risk-bar-fill hypoxanthine" style="width: ${(food.hypoxanthine || 0) / maxPurine * 100}%"></div>
                    </div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill adenine" style="width: ${(food.adenine || 0) / maxPurine * 100}%"></div>
                    </div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill guanine" style="width: ${(food.guanine || 0) / maxPurine * 100}%"></div>
                    </div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill xanthine" style="width: ${(food.xanthine || 0) / maxPurine * 100}%"></div>
                    </div>
                </div>

                <p>${risk.desc}</p>
            </div>

            <div class="info-box">
                ${explanationText}
            </div>

            <div class="section-title">Totalt purininnhold</div>
            <div class="metric-row">
                <div class="metric-card">
                    <h4>Per 100g</h4>
                    <div class="value">${(food.total_purines || 0).toFixed(1)}</div>
                    <div class="unit">mg</div>
                </div>
                <div class="metric-card">
                    <h4>Per porsjon (${food.serving}g)</h4>
                    <div class="value">${totalPerServing.toFixed(1)}</div>
                    <div class="unit">mg</div>
                </div>
            </div>

            <div class="section-title">Risiko (vektet score)</div>
            <div class="metric-row">
                <div class="metric-card">
                    <h4>Per 100g</h4>
                    <div class="value">${weightedScore.toFixed(1)}</div>
                </div>
                <div class="metric-card">
                    <h4>Per porsjon (${food.serving}g)</h4>
                    <div class="value">${weightedPerServing.toFixed(1)}</div>
                </div>
            </div>

            <div class="section-title">Relativ Purindistribusjon (per 100g)</div>
            <div class="bar-chart">
                <div class="bar">
                    <div class="bar-label">
                        <span class="name">Hypoxantin (vekt: 1.0)</span>
                        <span class="value">${(food.hypoxanthine || 0).toFixed(1)} mg</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill hypoxanthine" style="width: ${(food.hypoxanthine || 0) / maxPurine * 100}%"></div>
                    </div>
                </div>
                <div class="bar">
                    <div class="bar-label">
                        <span class="name">Adenin (vekt: 0.6)</span>
                        <span class="value">${(food.adenine || 0).toFixed(1)} mg</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill adenine" style="width: ${(food.adenine || 0) / maxPurine * 100}%"></div>
                    </div>
                </div>
                <div class="bar">
                    <div class="bar-label">
                        <span class="name">Guanin (vekt: 0.1)</span>
                        <span class="value">${(food.guanine || 0).toFixed(1)} mg</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill guanine" style="width: ${(food.guanine || 0) / maxPurine * 100}%"></div>
                    </div>
                </div>
                <div class="bar">
                    <div class="bar-label">
                        <span class="name">Xantin (vekt: 0.1)</span>
                        <span class="value">${(food.xanthine || 0).toFixed(1)} mg</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill xanthine" style="width: ${(food.xanthine || 0) / maxPurine * 100}%"></div>
                    </div>
                </div>
            </div>

            <div class="info-box">
                <strong>Risiko (vektet):</strong> 1.0 × Hypoxantin + 0.6 × Adenin + 0.1 × Guanin + 0.1 × Xantin<br>
                <strong>Risikoscore:</strong> Vektet risiko / 300
            </div>
        </div>
    `;

    document.getElementById('foodDetailScreen').innerHTML = html;
}

// Initialize
loadData();
