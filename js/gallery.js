document.addEventListener('DOMContentLoaded', () => {
  const galleryRoot = document.getElementById('gallery-grid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const closeButton = document.querySelector('.lightbox-close');
  const prevButton = document.querySelector('.lightbox-prev');
  const nextButton = document.querySelector('.lightbox-next');

  if (!galleryRoot || !window.WEDDING_CONFIG) return;

  const images = window.WEDDING_CONFIG.gallery;
  let currentIndex = 0;

  const createGalleryItem = (src, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'gallery-item';
    item.setAttribute('aria-label', `사진 ${index + 1} 보기`);
    item.innerHTML = `<img src="${src}" alt="결혼식 사진 ${index + 1}" loading="lazy" />`;
    item.addEventListener('click', () => openLightbox(index));
    return item;
  };

  const openLightbox = (index) => {
    if (!lightbox || !lightboxImage) return;
    currentIndex = index;
    lightboxImage.src = images[currentIndex];
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % images.length;
    lightboxImage.src = images[currentIndex];
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    lightboxImage.src = images[currentIndex];
  };

  images.forEach((src, index) => {
    galleryRoot.appendChild(createGalleryItem(src, index));
  });

  if (closeButton) closeButton.addEventListener('click', closeLightbox);
  if (prevButton) prevButton.addEventListener('click', showPrev);
  if (nextButton) nextButton.addEventListener('click', showNext);

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;

    if (event.key === 'Escape') {
      closeLightbox();
    }

    if (event.key === 'ArrowRight') {
      showNext();
    }

    if (event.key === 'ArrowLeft') {
      showPrev();
    }
  });

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }
});
