import { generateImage } from './api.js';
import { shareImage, downloadImage } from './share.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// UI Elements
const promptInput = $('#prompt-input');
const generateBtn = $('#generate-btn');
const modelSelect = $('#model-select');
const aspectSelect = $('#aspect-select');
const seedInput = $('#seed-input');
const randomizeBtn = $('#randomize-btn');
const surpriseBtn = $('#surprise-btn');
const imageWrapper = $('#image-wrapper');
const resultImage = $('#result-image');
const downloadBtn = $('#download-btn');
const copyBtn = $('#copy-btn');
const shareBtn = $('#share-btn');
const themeToggle = $('#theme-toggle');
const historyGrid = $('#history-grid');
const clearHistoryBtn = $('#clear-history');

let lastBlob = null;
let lastUrl = null;
let history = JSON.parse(localStorage.getItem('sravan_ai_history') || '[]');

const PROMPTS = [
    "A majestic dragon perched on a crystal peak, cinematic lighting",
    "Cyberpunk city streets in rain, neon signs reflecting in puddles",
    "A cozy library with floating books and magical golden dust",
    "Surreal landscape where mountains are made of giant desserts",
    "An astronaut sitting on a cloud, fishing for stars",
    "Mechanical forest with copper trees and clockwork owls",
    "Underwater palace made of bioluminescent coral",
    "Steampunk airship soaring above a Victorian city at sunset",
    "A cute red panda wearing a wizard hat, digital art style",
    "Ethereal spirit of the forest made of leaves and light"
];

// Theme Logic
const initTheme = () => {
    const savedTheme = localStorage.getItem('sravan_ai_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sravan_ai_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme} mode`);
};

const updateThemeIcon = (theme) => {
    if (!themeToggle) return;
    themeToggle.innerHTML = `<i data-lucide="${theme === 'light' ? 'moon' : 'sun'}"></i>`;
    if (window.lucide) lucide.createIcons();
};

const setLoading = (loading) => {
    imageWrapper.classList.toggle('loading', loading);
    generateBtn.disabled = loading;
    const btnText = generateBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = loading ? 'Creating...' : 'Generate Masterpiece';
};

const randomizeSeed = () => {
    seedInput.value = Math.floor(Math.random() * 1_000_000_000);
};

const handleSurprise = () => {
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    promptInput.value = randomPrompt;
    promptInput.style.borderColor = 'var(--primary)';
    setTimeout(() => promptInput.style.borderColor = '', 500);
};

const saveToHistory = (item) => {
    history = [item, ...history].slice(0, 20);
    localStorage.setItem('sravan_ai_history', JSON.stringify(history));
    renderHistory();
};

const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const renderHistory = () => {
    if (!historyGrid) return;

    if (history.length === 0) {
        historyGrid.innerHTML = '<div class="history-placeholder"><p>No creations yet. Start generating!</p></div>';
        return;
    }

    historyGrid.innerHTML = history.map((item, index) => {
        const safePrompt = escapeHTML(item.prompt);
        return `
            <div class="history-item" data-index="${index}" title="${safePrompt}">
                <img src="${item.url}" alt="${safePrompt}" loading="lazy">
            </div>
        `;
    }).join('');

    $$('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = item.getAttribute('data-index');
            const data = history[index];
            loadFromHistory(data);
        });
    });
};

const loadFromHistory = async (data) => {
    promptInput.value = data.prompt;
    modelSelect.value = data.model || 'flux';
    aspectSelect.value = data.aspect || '1:1';
    seedInput.value = data.seed || '';

    resultImage.src = data.url;
    lastUrl = data.url;

    document.querySelector('.placeholder').style.display = 'none';
    resultImage.style.display = 'block';

    try {
        const response = await fetch(data.url);
        lastBlob = await response.blob();
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
        shareBtn.disabled = false;
    } catch (e) {
        console.error('Failed to reload blob', e);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Loaded from history');
};

const handleGenerate = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        promptInput.focus();
        showToast('Please enter a prompt first!', 'error');
        return;
    }

    const aspect = aspectSelect.value;
    const model = modelSelect.value;
    const seed = seedInput.value ? Number(seedInput.value) : undefined;

    setLoading(true);

    try {
        const url = await generateImage({ prompt, aspect, seed, model });
        
        const response = await fetch(url);
        const blob = await response.blob();
        
        if (!blob || blob.size === 0) {
            throw new Error('Empty response from API');
        }

        resultImage.src = url;
        lastBlob = blob;
        lastUrl = url;
        
        document.querySelector('.placeholder').style.display = 'none';
        resultImage.style.display = 'block';
        
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
        shareBtn.disabled = false;

        saveToHistory({ url, prompt, aspect, model, seed, timestamp: Date.now() });

    } catch (err) {
        console.error('Generation failed:', err);
        showToast('Failed to generate image.', 'error');
    } finally {
        setLoading(false);
    }
};

const showToast = (message, type = 'info') => {
    const container = $('#toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Event Listeners
generateBtn.addEventListener('click', handleGenerate);
surpriseBtn.addEventListener('click', handleSurprise);
randomizeBtn.addEventListener('click', randomizeSeed);
themeToggle.addEventListener('click', toggleTheme);
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all your history?')) {
        history = [];
        localStorage.removeItem('sravan_ai_history');
        renderHistory();
        showToast('History cleared');
    }
});

promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
    }
});

downloadBtn.addEventListener('click', () => {
    if (!lastBlob) return;
    downloadImage(lastBlob, `sravan-ai-${Date.now()}.png`);
    showToast('Download started!');
});

copyBtn.addEventListener('click', async () => {
    if (!lastUrl) return;
    try {
        await navigator.clipboard.writeText(lastUrl);
        showToast('URL copied to clipboard!');
    } catch (err) {
        showToast('Failed to copy URL.', 'error');
    }
});

shareBtn.addEventListener('click', () => {
    if (!lastBlob) return;
    shareImage(lastBlob);
});

// Initialize
initTheme();
randomizeSeed();
renderHistory();
promptInput.focus();
