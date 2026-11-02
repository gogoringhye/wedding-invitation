document.addEventListener('DOMContentLoaded', () => {
  if (!window.gsap || !window.ScrollTrigger) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const splitName = () => {
    gsap.utils.toArray('.name-line').forEach((line) => {
      const text = line.textContent;
      line.textContent = '';
      const chars = [...text].map((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.transform = 'translateY(26px)';
        span.style.opacity = '0';
        line.appendChild(span);
        return span;
      });

      gsap.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.04,
        delay: 0.1,
        scrollTrigger: { trigger: line, start: 'top 90%' }
      });
    });
  };

  if (!prefersReducedMotion) {
    splitName();

    gsap.utils.toArray('.reveal').forEach((element) => {
      gsap.set(element, { opacity: 0, y: 24 });

      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 85%'
        }
      });
    });

    gsap.to('.image-frame img', {
      scale: 1.07,
      duration: 4.5,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        scrub: 1
      }
    });

    gsap.utils.toArray('.story-card').forEach((card, index) => {
      gsap.fromTo(card, {
        y: 40,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        delay: index * 0.12,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%'
        }
      });
    });

    gsap.to('.site-header', {
      backgroundColor: 'rgba(248, 246, 241, 0.9)',
      boxShadow: '0 12px 28px rgba(48, 45, 40, 0.06)',
      scrollTrigger: {
        trigger: 'body',
        start: 'top -20',
        end: 99999,
        toggleActions: 'play none reverse none'
      }
    });
  } else {
    gsap.set('.reveal, .name-line', { opacity: 1, y: 0, clearProps: 'transform,clip-path' });
    gsap.utils.toArray('.name-line').forEach((line) => {
      line.innerHTML = line.textContent;
    });
  }
});
