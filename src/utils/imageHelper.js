/**
 * Compresse et redimensionne une image côté client via HTML5 Canvas
 * @param {File} file - Fichier image sélectionné par l'utilisateur
 * @param {number} maxWidth - Largeur maximale (défaut: 400px)
 * @param {number} maxHeight - Hauteur maximale (défaut: 400px)
 * @param {number} quality - Qualité JPEG (0.1 à 1.0, défaut: 0.85)
 * @returns {Promise<string>} Base64 Data URL de l'image compressée
 */
export const compressProfileImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Le fichier sélectionné n\'est pas une image valide.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur lors de la lecture de l\'image.'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Impossible de charger l\'image.'));
      img.onload = () => {
        let { width, height } = img;

        // Calcul des dimensions proportionnelles
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
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(readerEvent.target.result);
        }

        // Amélioration de la qualité de rendu
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export en JPEG compressé
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  });
};
