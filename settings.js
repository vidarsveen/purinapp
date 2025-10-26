// Settings Manager
class SettingsManager {
    constructor() {
        this.defaults = {
            detailViewMode: 'serving' // 'serving' or 'per100g'
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('purinAppSettings');
        if (saved) {
            try {
                return { ...this.defaults, ...JSON.parse(saved) };
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

    getDetailViewMode() {
        return this.get('detailViewMode');
    }

    setDetailViewMode(value) {
        this.set('detailViewMode', value);
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

        // Set radio buttons based on current settings
        const detailViewMode = appSettings.getDetailViewMode();
        document.querySelectorAll('input[name="detailView"]').forEach(radio => {
            radio.checked = radio.value === detailViewMode;
            updateRadioSelection(radio.closest('.radio-option'), radio.checked);
        });
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

function handleDetailViewChange(value) {
    appSettings.setDetailViewMode(value);
    // If on detail screen, re-render
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen && currentScreen.id === 'foodDetailScreen') {
        // Re-render current food detail (would need to store current food index)
        // This will be handled in app.js
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

    // Radio button changes
    document.querySelectorAll('input[name="detailView"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                handleDetailViewChange(e.target.value);
                // Update visual selection
                document.querySelectorAll('.radio-option').forEach(opt => {
                    const input = opt.querySelector('input[name="detailView"]');
                    if (input) {
                        updateRadioSelection(opt, input.checked);
                    }
                });
            }
        });
    });

    // Radio option click
    document.querySelectorAll('.radio-option').forEach(option => {
        option.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            }
        });
    });
}
