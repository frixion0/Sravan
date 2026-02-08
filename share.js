export function downloadImage(blob, filename) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function shareImage(blob) {
    const filename = `sravan-ai-${Date.now()}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    
    // Check if Web Share API is available for files
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Sravan AI Studio Creation',
                text: 'Check out this AI-generated masterpiece!',
                files: [file],
            });
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        }
    }

    // Fallback: Just download if share is not supported or failed
    downloadImage(blob, filename);
    return false;
}
