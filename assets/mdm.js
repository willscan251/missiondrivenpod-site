// mdm.js - Rebuilt from scratch

class MDMApp {
  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.setupMobileNav();
    this.setupCardToggles();
    this.setupContactForm();
    this.setupFilters();
    this.setupAnimations();
    this.setupAccessibility();
  }

  setupMobileNav() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.dropdown-menu');
    if (!toggle || !menu) return;

    let isOpen = false;

    toggle.addEventListener('click', () => {
      isOpen = !isOpen;
      menu.style.display = isOpen ? 'flex' : 'none';
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
    });

    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        isOpen = false;
        menu.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.style.transform = 'rotate(0deg)';
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) {
        isOpen = false;
        menu.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.style.transform = 'rotate(0deg)';
      }
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        isOpen = false;
        menu.style.display = 'none';
      });
    });
  }

  setupCardToggles() {
    // Bio toggles
    document.querySelectorAll('.bio-toggle').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const card = btn.closest('.team-card');
        const bio = card.querySelector('.bio');
        const isHidden = bio.classList.toggle('hidden');
        btn.textContent = isHidden ? 'View Bio' : 'Hide Bio';
      });
    });

    // Blog card and tool card expand buttons
    document.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.blog-card, .tool-card');
        if (!card) return; // Safety check
        
        const body = card.querySelector('.card-body');
        if (!body) return; // Safety check
        
        const isOpen = card.classList.toggle('open');
        btn.textContent = isOpen ? '−' : '+';
        body.style.maxHeight = isOpen ? '500px' : '0';
      });
    });
  }

  setupContactForm() {
    const trigger = document.querySelector('.contact-trigger');
    const section = document.querySelector('.contact-section');
    const body = document.querySelector('.contact-body');
    
    if (!trigger || !section || !body) return;

    trigger.addEventListener('click', () => {
      const isOpen = section.classList.toggle('open');
      body.style.maxHeight = isOpen ? '600px' : '0';
      if (isOpen) {
        setTimeout(() => {
          const firstInput = body.querySelector('input[type="text"]');
          if (firstInput) firstInput.focus();
        }, 300);
      }
    });

    const options = document.querySelectorAll('.contact-option');
    const select = document.querySelector('select[name="Inquiry_Type"]');
    
    if (options.length && select) {
      const values = ['general', 'consulting', 'guest'];
      options.forEach((opt, i) => {
        opt.addEventListener('click', () => {
          if (!section.classList.contains('open')) {
            section.classList.add('open');
            body.style.maxHeight = '600px';
          }
          setTimeout(() => {
            if (values[i]) select.value = values[i];
          }, 300);
        });
      });
    }

    const form = document.querySelector('.contact-body form');
    if (form) {
      form.addEventListener('submit', () => {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          btn.textContent = 'Sending...';
          btn.disabled = true;
        }
      });
    }
  }

  setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn, .resource-filter');
    const cards = document.querySelectorAll('.tool-card, .resource-card');

    if (!filterBtns.length || !cards.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'var(--color-footer)';
          b.style.color = 'var(--color-text)';
        });
        
        btn.classList.add('active');
        btn.style.background = 'var(--color-accent)';
        btn.style.color = 'var(--color-bg)';

        cards.forEach((card, i) => {
          const cats = card.dataset.category;
          if (category === 'all' || cats.includes(category)) {
            card.style.display = 'block';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, i * 100);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 200);
          }
        });
      });
    });
  }

  setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.team-card, .blog-card, .tool-card, .resource-card, .timeline-item, .mission-box, .page-header, .thanks-container').forEach(el => {
      observer.observe(el);
    });
  }

  setupAccessibility() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only';
    skipLink.style.cssText = 'position:absolute;top:10px;left:10px;z-index:9999;background:#F5C16C;color:#123945;padding:8px 16px;border-radius:4px;text-decoration:none';
    
    skipLink.addEventListener('focus', () => skipLink.classList.remove('sr-only'));
    skipLink.addEventListener('blur', () => skipLink.classList.add('sr-only'));

    document.body.insertBefore(skipLink, document.body.firstChild);

    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
  }
}

new MDMApp();