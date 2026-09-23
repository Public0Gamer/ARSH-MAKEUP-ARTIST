/**
 * ARSH MAKEUP ARTIST DELHI - CLIENT APPLICATION
 * Luxury interactions, 5 Major Animations, Dynamic CMS Sync, and WhatsApp Inquiry
 */

let siteData = null;
let activeCategory = 'All';

document.addEventListener('DOMContentLoaded', async () => {
  await fetchSiteContent();
  initParticleCanvas();
  initBeforeAfterSlider();
  initScrollAnimations();
  initConsultationDrawer();
  initLightbox();
});

// Fetch current content from server CMS
async function fetchSiteContent() {
  try {
    const res = await fetch('/api/content?t=' + Date.now());
    if (!res.ok) throw new Error('Failed to load site content');
    siteData = await res.json();
    renderDynamicContent();
  } catch (err) {
    console.error('Error fetching site data:', err);
  }
}

// Render dynamic content from database
function renderDynamicContent() {
  if (!siteData) return;

  // 1. Branding & Contact
  const b = siteData.branding || {};
  const c = siteData.contact || {};
  const h = siteData.hero || {};
  const ab = siteData.about || {};
  const pol = siteData.policy || {};
  const pr = siteData.pricing || {};

  // Update text elements with data attributes
  document.querySelectorAll('[data-bind]').forEach(el => {
    const key = el.getAttribute('data-bind');
    const val = getNestedValue(siteData, key);
    if (val !== undefined && val !== null) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = val;
      } else {
        el.textContent = val;
      }
    }
  });

  // Phone and WhatsApp links
  const phoneFormatted = c.phone || '7428701987';
  const whatsappUrl = `https://wa.me/91${phoneFormatted.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Arsh! I am interested in booking a bridal makeup consultation with Arsh Makeup Artist Delhi.')}`;

  document.querySelectorAll('.whatsapp-link').forEach(el => {
    el.href = whatsappUrl;
  });

  document.querySelectorAll('.phone-link').forEach(el => {
    el.href = `tel:+91${phoneFormatted.replace(/\D/g, '')}`;
  });

  if (c.instagramUrl) {
    document.querySelectorAll('.instagram-link').forEach(el => {
      el.href = c.instagramUrl;
    });
  }

  // Hero Background/Slide if available
  const heroImgEl = document.getElementById('hero-main-image');
  const heroUrl = (h.heroImages && h.heroImages[0]) || h.image || (siteData.gallery && siteData.gallery[0] && siteData.gallery[0].url);
  if (heroImgEl && heroUrl) {
    heroImgEl.src = heroUrl;
  }

  // Render Stats
  const statsContainer = document.getElementById('hero-stats-container');
  if (statsContainer && h.stats) {
    statsContainer.innerHTML = h.stats.map(s => `
      <div class="px-5 py-4 rounded-2xl glass-panel text-center border border-amber-200/40">
        <div class="text-2xl lg:text-3xl font-royal font-bold gold-gradient-text">${s.number}</div>
        <div class="text-xs uppercase tracking-widest text-[#7E7068] mt-1 font-medium">${s.label}</div>
      </div>
    `).join('');
  }

  // Render About Artist
  const artistImg = document.getElementById('about-artist-image');
  if (artistImg && ab.artistImage) {
    artistImg.src = ab.artistImage;
  }

  // Render Services
  renderServices();

  // Render Gallery
  renderGallery();

  // Render Packages
  renderPackages();

  // Render Policies
  renderPolicies();

  // Render Brands
  renderBrands();

  // Re-apply 3D tilt to newly rendered cards
  initTiltCards();
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((prev, curr) => prev ? prev[curr] : undefined, obj);
}

// -------------------------------------------------------------
// SERVICES RENDERING
// -------------------------------------------------------------
function renderServices() {
  const container = document.getElementById('services-grid');
  if (!container || !siteData.services) return;

  container.innerHTML = siteData.services.map((srv, idx) => `
    <div class="tilt-card luxury-card p-6 lg:p-8 flex flex-col justify-between group hover:border-amber-400/60 transition-all duration-300">
      <div class="glare"></div>
      <div class="tilt-inner">
        <div class="relative overflow-hidden rounded-xl mb-6 h-56 w-full">
          <img src="${srv.image || '/assets/images/bridal_look_1.jpg'}" alt="${srv.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          ${srv.badge ? `<span class="absolute top-3 right-3 text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full gold-shimmer-badge">${srv.badge}</span>` : ''}
          <div class="absolute bottom-3 left-4 right-4 text-white">
            <span class="text-xs tracking-wider uppercase text-amber-300 font-semibold">${srv.category || 'Luxury Service'}</span>
            <h3 class="text-xl font-royal font-bold">${srv.name}</h3>
          </div>
        </div>

        <p class="text-sm text-[#7E7068] mb-4 italic">"${srv.tagline || ''}"</p>
        <p class="text-sm text-[#4A3E38] leading-relaxed mb-6">${srv.description || ''}</p>

        <div class="border-t border-amber-200/40 pt-4 mb-6">
          <p class="text-xs uppercase font-semibold tracking-wider text-[#8C6718] mb-3">Service Inclusions:</p>
          <ul class="space-y-2 text-xs text-[#4A3E38]">
            ${(srv.features || []).map(f => `
              <li class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                <span>${f}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-amber-100">
        <div>
          <span class="text-[11px] tracking-wider uppercase text-gray-500 font-medium block">Investment</span>
          <span class="text-sm font-bold tracking-wide text-[#8C6718]">${srv.price || 'PRICE ON REQUEST'}</span>
        </div>
        <button onclick="openBookingDrawer('${srv.name}')" class="btn-gold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer">
          <span>Inquire Now</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// GALLERY RENDERING
// -------------------------------------------------------------
function renderGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container || !siteData.gallery) return;

  const items = activeCategory === 'All' 
    ? siteData.gallery 
    : siteData.gallery.filter(i => (i.category || '').toLowerCase() === activeCategory.toLowerCase());

  container.innerHTML = items.map((item, idx) => `
    <div class="tilt-card group relative overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 h-96" onclick="openLightbox('${item.url}', '${item.title}', '${item.details || ''}')">
      <div class="glare"></div>
      <img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
        <span class="text-xs uppercase font-semibold text-amber-300 tracking-widest mb-1">${item.category || 'Bridal Glam'}</span>
        <h4 class="text-lg font-royal font-bold text-white mb-1">${item.title}</h4>
        <p class="text-xs text-stone-300 line-clamp-2 mb-3">${item.details || ''}</p>
        <div class="flex items-center gap-2 text-xs text-amber-300 font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
          <span>Tap to View Full Look</span>
        </div>
      </div>
      <div class="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold tracking-wider px-3 py-1 rounded-full border border-white/20">
        ${item.category}
      </div>
    </div>
  `).join('');
}

function filterGallery(category, buttonEl) {
  activeCategory = category;
  document.querySelectorAll('.gallery-filter-btn').forEach(b => {
    b.classList.remove('bg-[#1C1714]', 'text-white', 'border-[#1C1714]');
    b.classList.add('bg-white', 'text-[#4A3E38]', 'border-amber-200');
  });
  if (buttonEl) {
    buttonEl.classList.remove('bg-white', 'text-[#4A3E38]', 'border-amber-200');
    buttonEl.classList.add('bg-[#1C1714]', 'text-white', 'border-[#1C1714]');
  }
  renderGallery();
  initTiltCards();
}

// -------------------------------------------------------------
// PACKAGES & PRICING RENDERING
// -------------------------------------------------------------
function renderPackages() {
  const container = document.getElementById('packages-grid');
  if (!container || !siteData.pricing || !siteData.pricing.packages) return;

  container.innerHTML = siteData.pricing.packages.map((pkg, idx) => `
    <div class="luxury-card p-8 flex flex-col justify-between border-2 border-amber-200/50 hover:border-amber-400 transition-all">
      <div>
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full gold-shimmer-badge">${pkg.tag || 'Luxury'}</span>
          <span class="text-xs text-[#8C6718] font-semibold">${pkg.idealFor || 'Exclusive'}</span>
        </div>
        <h3 class="text-2xl font-royal font-bold text-[#1C1714] mb-2">${pkg.name}</h3>
        <div class="my-4 pb-4 border-b border-amber-200/40">
          <span class="text-xs text-gray-500 uppercase tracking-widest block font-medium">Package Fee</span>
          <span class="text-xl font-bold font-royal gold-gradient-text">${pkg.price || 'PRICE ON REQUEST'}</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-[#4A3E38]">
          ${(pkg.includes || []).map(inc => `
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>
              <span>${inc}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <button onclick="openBookingDrawer('${pkg.name}')" class="w-full btn-gold py-3 rounded-xl font-semibold text-xs tracking-wider uppercase cursor-pointer text-center">
        Request Custom Quote
      </button>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// POLICIES RENDERING
// -------------------------------------------------------------
function renderPolicies() {
  const container = document.getElementById('policies-grid');
  if (!container || !siteData.policy || !siteData.policy.items) return;

  container.innerHTML = siteData.policy.items.map(p => `
    <div class="p-6 rounded-2xl glass-panel border border-amber-200/60 relative overflow-hidden">
      <div class="flex items-center gap-3 mb-3">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          ${p.badge || 'Policy'}
        </span>
        <h4 class="font-royal font-bold text-[#1C1714] text-base">${p.title}</h4>
      </div>
      <p class="text-sm text-[#4A3E38] leading-relaxed">${p.desc}</p>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// BRANDS RENDERING
// -------------------------------------------------------------
function renderBrands() {
  const container = document.getElementById('brands-grid');
  if (!container || !siteData.brands) return;

  container.innerHTML = siteData.brands.map(b => `
    <div class="p-4 rounded-xl border border-amber-200/40 bg-white/70 backdrop-blur-sm text-center shadow-xs hover:border-amber-400 transition-all">
      <div class="font-royal font-bold text-base text-[#1C1714] tracking-wider">${b.name}</div>
      <div class="text-[11px] text-[#8C6718] mt-1 font-medium">${b.badge || b.origin || 'Certified Genuine'}</div>
    </div>
  `).join('');
}

// =============================================================
// ANIMATION 1: GOLDEN SPARKLE PARTICLE CANVAS
// =============================================================
function initParticleCanvas() {
  const canvas = document.getElementById('sparkle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  const particleCount = 45;

  function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.2 + 0.8;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = -Math.random() * 0.5 - 0.1;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.alphaSpeed = (Math.random() - 0.5) * 0.01;
      this.color = Math.random() > 0.3 ? '#D4AF37' : '#F5E6AB';
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.alpha += this.alphaSpeed;

      if (this.alpha <= 0.1 || this.alpha >= 0.8) {
        this.alphaSpeed = -this.alphaSpeed;
      }
      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset();
        this.y = height + 10;
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#D4AF37';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

// =============================================================
// ANIMATION 2: BEFORE / AFTER BRIDAL TRANSFORMATION SLIDER
// =============================================================
function initBeforeAfterSlider() {
  const container = document.getElementById('ba-slider-container');
  if (!container) return;

  const afterLayer = container.querySelector('.ba-after');
  const handle = container.querySelector('.ba-slider-handle');
  let isDown = false;

  function move(e) {
    if (!isDown) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    const percentage = (x / rect.width) * 100;

    handle.style.left = percentage + '%';
    afterLayer.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
  }

  container.addEventListener('mousedown', () => isDown = true);
  window.addEventListener('mouseup', () => isDown = false);
  container.addEventListener('mousemove', move);

  container.addEventListener('touchstart', () => isDown = true, { passive: true });
  window.addEventListener('touchend', () => isDown = false);
  container.addEventListener('touchmove', move, { passive: true });
}

// =============================================================
// ANIMATION 3: 3D PARALLAX TILT & MAGNETIC HOVER
// =============================================================
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -9;
      const rotateY = ((x - centerX) / centerX) * 9;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      const glare = card.querySelector('.glare');
      if (glare) {
        glare.style.opacity = '0.35';
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.6) 0%, transparent 60%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      const glare = card.querySelector('.glare');
      if (glare) glare.style.opacity = '0';
    });
  });
}

// =============================================================
// ANIMATION 4: SCROLL REVEAL STAGGER ANIMATIONS
// =============================================================
function initScrollAnimations() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

// =============================================================
// ANIMATION 5: CONSULTATION DRAWER & WHATSAPP GENERATOR
// =============================================================
function initConsultationDrawer() {
  const form = document.getElementById('consultation-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('inq-name').value;
      const phone = document.getElementById('inq-phone').value;
      const service = document.getElementById('inq-service').value;
      const date = document.getElementById('inq-date').value;
      const venue = document.getElementById('inq-venue').value;
      const notes = document.getElementById('inq-notes').value;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `Submitting...`;

      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, service, date, venue, notes })
        });
        const data = await res.json();

        if (data.success) {
          // Open WhatsApp immediately with pre-filled message
          const targetPhone = (siteData && siteData.contact && siteData.contact.whatsapp) || '7428701987';
          const msg = `👑 *ARSH MAKEUP ARTIST DELHI - BRIDAL INQUIRY*\n` +
                      `👤 *Name:* ${name}\n` +
                      `📞 *Contact:* ${phone}\n` +
                      `💄 *Service Requested:* ${service}\n` +
                      `📅 *Event Date:* ${date || 'Flexible'}\n` +
                      `📍 *Venue / City:* ${venue || 'Delhi NCR'}\n` +
                      `📝 *Notes:* ${notes || 'Looking for quote & slot availability.'}`;

          const waUrl = `https://wa.me/91${targetPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

          form.reset();
          closeBookingDrawer();
          showNotification('Consultation inquiry submitted! Redirecting to WhatsApp for instant confirmation...');
          setTimeout(() => {
            window.open(waUrl, '_blank');
          }, 800);
        } else {
          alert('Error: ' + data.message);
        }
      } catch (err) {
        console.error('Submission error:', err);
        alert('Server connection error. Please call directly at 7428701987.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
}

function openBookingDrawer(preSelectedService = '') {
  const drawer = document.getElementById('consultation-drawer');
  const backdrop = document.getElementById('consultation-backdrop');
  if (preSelectedService) {
    const srvSelect = document.getElementById('inq-service');
    if (srvSelect) srvSelect.value = preSelectedService;
  }
  if (drawer && backdrop) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeBookingDrawer() {
  const drawer = document.getElementById('consultation-drawer');
  const backdrop = document.getElementById('consultation-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// -------------------------------------------------------------
// LIGHTBOX VIEWER
// -------------------------------------------------------------
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.close-lightbox')) {
      closeLightbox();
    }
  });
}

function openLightbox(url, title, details) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-image');
  const titleEl = document.getElementById('lightbox-title');
  const descEl = document.getElementById('lightbox-desc');

  if (modal && img) {
    img.src = url;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = details;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Toast notification helper
function showNotification(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-6 right-6 z-200 bg-[#1C1714] text-white px-6 py-4 rounded-xl shadow-2xl border border-amber-400/40 flex items-center gap-3 transition-all duration-300';
  toast.innerHTML = `
    <span class="text-amber-400 text-lg">✨</span>
    <span class="text-sm font-medium">${msg}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
