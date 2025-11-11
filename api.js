const BASE = 'https://image.pollinations.ai/prompt';

export async function generateImage({ prompt, aspect = '1:1', seed } = {}) {
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt is required');
    }

    // Clean and encode the prompt
    const cleanPrompt = prompt.trim().replace(/[<>]/g, '');
    const encodedPrompt = encodeURIComponent(cleanPrompt);

    const params = new URLSearchParams({
        prompt: encodedPrompt,
        aspect,
        ...(seed !== undefined && { seed }),
        nologo: 'true',
    });

    const url = `${BASE}/${encodedPrompt}?${params.toString()}`;
    return url;
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