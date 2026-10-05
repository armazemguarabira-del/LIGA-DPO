/**
 * Utility to compress images on the client side before saving to storage or Firestore.
 * Prevents localStorage QuotaExceededError and Firestore document size limit issues (1MB max).
 */

export async function compressImage(
  source: File | Blob | string,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already an external HTTP URL, no need to compress
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
      resolve(source);
      return;
    }

    const img = new Image();

    const processLoadedImage = () => {
      let width = img.naturalWidth || img.width || maxWidth;
      let height = img.naturalHeight || img.height || maxHeight;

      // Calculate aspect ratio preserving scale
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof source === 'string' ? source : '');
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Falha na compressão de imagem via canvas, usando original:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onload = processLoadedImage;
    img.onerror = () => {
      console.warn('Erro ao carregar imagem para compressão.');
      resolve(typeof source === 'string' ? source : '');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(source);
    }
  });
}
