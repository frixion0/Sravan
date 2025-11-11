import { generateImage } from './api.js';
import { shareImage, downloadImage } from './share.js';

const $ = (sel) => document.querySelector(sel);
const promptInput = $('#prompt-input');
const generateBtn = $('#generate-btn');
const modelSelect = $('#model-select');
const aspectSelect = $('#aspect-select');
const seedInput = $('#seed-input');
const randomizeBtn = $('#randomize-btn');
const imageWrapper = $('#image-wrapper');
const resultImage = $('#result-image');
const downloadBtn = $('#download-btn');
const shareBtn = $('#share-btn');

let lastBlob = null;

const setLoading = (loading) => {
    imageWrapper.classList.toggle('loading', loading);
    generateBtn.disabled = loading;
    generateBtn.querySelector('.btn-text').textContent = loading ? 'Creating...' : 'Generate';
};

const randomizeSeed = () => {
    seedInput.value = Math.floor(Math.random() * 1_000_000_000);
};

if (randomizeBtn) {
    randomizeBtn.addEventListener('click', randomizeSeed);
}

const handleGenerate = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        promptInput.focus();
        return;
    }

    const aspect = aspectSelect.value;
    const seed = seedInput.value ? Number(seedInput.value) : undefined;

    setLoading(true);

    // Show 10-second loading indicator
    const startTime = Date.now();
    const loadingText = document.querySelector('.loading-text');
    const updateLoadingText = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, 20 - elapsed);
        loadingText.textContent = `Creating your image... ${remaining}s remaining`;
    };
    
    const loadingInterval = setInterval(updateLoadingText, 500);
    updateLoadingText();

    try {
        const url = await generateImage({ prompt, aspect, seed });
        
        // Load image and convert to blob
        const response = await fetch(url);
        const blob = await response.blob();
        
        if (!blob || blob.size === 0) {
            throw new Error('Empty response from API');
        }

        // Display the image
        resultImage.src = url;
        lastBlob = blob;
        
        // Hide placeholder, show image
        document.querySelector('.placeholder').style.display = 'none';
        resultImage.style.display = 'block';
        
        downloadBtn.disabled = false;
        shareBtn.disabled = false;
    } catch (err) {
        console.error('Generation failed:', err);
        alert('Failed to generate image. Please try again with a different prompt.');
    } finally {
        clearInterval(loadingInterval);
        setLoading(false);
    }
};

generateBtn.addEventListener('click', handleGenerate);
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
    }
});

downloadBtn.addEventListener('click', () => {
    if (!lastBlob) return;
    downloadImage(lastBlob, `shravan-ai-${Date.now()}.png`);
});

shareBtn.addEventListener('click', () => {
    if (!lastBlob) return;
    shareImage(lastBlob);
});

// Initialize
randomizeSeed();
promptInput.focus();