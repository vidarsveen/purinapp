// Settings Manager
class SettingsManager {
    constructor() {
        this.defaults = {
            colorThresholdsPer100g: {
                lowToModerate: 50,
                moderateToHigh: 150,
                highToVeryHigh: 200
            },
            colorThresholdsPerServing: {
                lowToModerate: 30,
                moderateToHigh: 100,
                highToVeryHigh: 150
            },
            colorThresholdsRisk: {
                lowToModerate: 60,
                moderateToHigh: 120,
                highToVeryHigh: 180
            }
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('purinAppSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // Migrate old risk thresholds (0.2, 0.4, 0.6) to new scale (60, 120, 180)
                if (parsed.colorThresholdsRisk) {
                    const risk = parsed.colorThresholdsRisk;
                    // Check if values are in old scale (< 10)
                    if (risk.lowToModerate < 10 && risk.moderateToHigh < 10 && risk.highToVeryHigh < 10) {
                        // Migrate to new scale
                        parsed.colorThresholdsRisk = {
                            lowToModerate: 60,
                            moderateToHigh: 120,
                            highToVeryHigh: 180
                        };
                        // Save migrated settings
                        localStorage.setItem('purinAppSettings', JSON.stringify(parsed));
                    }
                }

                return { ...this.defaults, ...parsed };
            } catch (e) {
                console.error('Failed to parse settings:', e);
                return { ...this.defaults };
            }
        }
        return { ...this.defaults };
    }

    saveSettings() {
        localStorage.setItem('purinAppSettings', JSON.stringify(this.settings));
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    getColorThresholdsPer100g() {
        return this.get('colorThresholdsPer100g') || this.defaults.colorThresholdsPer100g;
    }

    setColorThresholdsPer100g(thresholds) {
        this.set('colorThresholdsPer100g', thresholds);
    }

    getColorThresholdsPerServing() {
        return this.get('colorThresholdsPerServing') || this.defaults.colorThresholdsPerServing;
    }

    setColorThresholdsPerServing(thresholds) {
        this.set('colorThresholdsPerServing', thresholds);
    }

    getColorThresholdsRisk() {
        return this.get('colorThresholdsRisk') || this.defaults.colorThresholdsRisk;
    }

    setColorThresholdsRisk(thresholds) {
        this.set('colorThresholdsRisk', thresholds);
    }

    reset() {
        this.settings = { ...this.defaults };
        this.saveSettings();
    }
}

// Initialize global settings
const appSettings = new SettingsManager();

// Settings UI
function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('active');

        // Load current threshold values for per 100g
        const per100g = appSettings.getColorThresholdsPer100g();
        document.getElementById('per100g_threshold1').value = per100g.lowToModerate;
        document.getElementById('per100g_threshold2').value = per100g.moderateToHigh;
        document.getElementById('per100g_threshold3').value = per100g.highToVeryHigh;

        // Load current threshold values for per serving
        const perServing = appSettings.getColorThresholdsPerServing();
        document.getElementById('perServing_threshold1').value = perServing.lowToModerate;
        document.getElementById('perServing_threshold2').value = perServing.moderateToHigh;
        document.getElementById('perServing_threshold3').value = perServing.highToVeryHigh;

        // Load current threshold values for risk
        const risk = appSettings.getColorThresholdsRisk();
        document.getElementById('risk_threshold1').value = risk.lowToModerate;
        document.getElementById('risk_threshold2').value = risk.moderateToHigh;
        document.getElementById('risk_threshold3').value = risk.highToVeryHigh;
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateRadioSelection(optionElement, selected) {
    if (selected) {
        optionElement.classList.add('selected');
    } else {
        optionElement.classList.remove('selected');
    }
}

function resetThresholds() {
    // Per 100g
    const per100g = appSettings.defaults.colorThresholdsPer100g;
    document.getElementById('per100g_threshold1').value = per100g.lowToModerate;
    document.getElementById('per100g_threshold2').value = per100g.moderateToHigh;
    document.getElementById('per100g_threshold3').value = per100g.highToVeryHigh;

    // Per serving
    const perServing = appSettings.defaults.colorThresholdsPerServing;
    document.getElementById('perServing_threshold1').value = perServing.lowToModerate;
    document.getElementById('perServing_threshold2').value = perServing.moderateToHigh;
    document.getElementById('perServing_threshold3').value = perServing.highToVeryHigh;

    // Risk
    const risk = appSettings.defaults.colorThresholdsRisk;
    document.getElementById('risk_threshold1').value = risk.lowToModerate;
    document.getElementById('risk_threshold2').value = risk.moderateToHigh;
    document.getElementById('risk_threshold3').value = risk.highToVeryHigh;

    saveThresholds();
}

function saveThresholds() {
    // Save per 100g thresholds
    const per100g = {
        lowToModerate: parseInt(document.getElementById('per100g_threshold1').value),
        moderateToHigh: parseInt(document.getElementById('per100g_threshold2').value),
        highToVeryHigh: parseInt(document.getElementById('per100g_threshold3').value)
    };
    appSettings.setColorThresholdsPer100g(per100g);

    // Save per serving thresholds
    const perServing = {
        lowToModerate: parseInt(document.getElementById('perServing_threshold1').value),
        moderateToHigh: parseInt(document.getElementById('perServing_threshold2').value),
        highToVeryHigh: parseInt(document.getElementById('perServing_threshold3').value)
    };
    appSettings.setColorThresholdsPerServing(perServing);

    // Save risk thresholds
    const risk = {
        lowToModerate: parseFloat(document.getElementById('risk_threshold1').value),
        moderateToHigh: parseFloat(document.getElementById('risk_threshold2').value),
        highToVeryHigh: parseFloat(document.getElementById('risk_threshold3').value)
    };
    appSettings.setColorThresholdsRisk(risk);

    // Re-render current view if needed
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen) {
        if (currentScreen.id === 'categoryFoodsScreen') {
            renderCategoryFoods();
        } else if (currentScreen.id === 'searchScreen') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim().length >= 2) {
                handleSearch(searchInput.value);
            }
        } else if (currentScreen.id === 'foodDetailScreen') {
            // Re-render food detail if we're viewing one
            if (typeof currentFoodIndex !== 'undefined' && currentFoodIndex !== null && typeof purineData !== 'undefined') {
                const food = purineData[currentFoodIndex];
                if (food && typeof renderFoodDetail === 'function') {
                    renderFoodDetail(food);
                }
            }
        }
    }
}

// Setup settings modal event listeners
function setupSettingsListeners() {
    // Click outside modal to close
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSettingsModal();
            }
        });
    }

    // Threshold input changes
    const thresholdInputs = document.querySelectorAll('.threshold-input-group input[type="number"]');
    thresholdInputs.forEach(input => {
        input.addEventListener('change', saveThresholds);
    });
}
