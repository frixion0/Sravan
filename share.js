export function downloadImage(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

export async function shareImage(blob) {
    const file = new File([blob], `shravan-ai-${Date.now()}.png`, { type: 'image/png' });
    
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Hi, Shravan! – AI Generated Art',
                text: 'Check out this amazing AI-generated image!',
                files: [file],
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                // Fallback to download
                downloadImage(blob, `shravan-ai-${Date.now()}.png`);
            }
        }
    } else {
        // Fallback to download
        downloadImage(blob, `shravan-ai-${Date.now()}.png`);
    }
}