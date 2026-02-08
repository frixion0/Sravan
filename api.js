const BASE = 'https://image.pollinations.ai/prompt';

export async function generateImage({ prompt, aspect = '1:1', seed, model = 'flux' } = {}) {
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt is required');
    }

    // Clean prompt (remove some characters that might cause issues in path)
    const cleanPrompt = prompt.trim().replace(/[#%/?]/g, ' ');
    const encodedPrompt = encodeURIComponent(cleanPrompt);

    const params = new URLSearchParams({
        aspect,
        ...(seed !== undefined && { seed }),
        model,
        nologo: 'true',
    });

    // Pollinations AI can take prompt in path or as a query param.
    // Using it in the path is cleaner, but we should not double-encode in query.
    return `${BASE}/${encodedPrompt}?${params.toString()}`;
}

export async function urlToDataUrl(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
