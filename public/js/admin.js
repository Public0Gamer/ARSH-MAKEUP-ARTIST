/**
 * ARSH MAKEUP ARTIST DELHI - ADMIN CMS JAVASCRIPT
 * Real Cloudinary uploads, Password management system, and Content CRUD
 */

let adminToken = localStorage.getItem('arsh_admin_token') || '';
let currentSiteData = {};
let currentInquiries = [];

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  setupEventListeners();
});

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================
async function initAuth() {
  if (adminToken) {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.authenticated) {
        unlockDashboard();
        return;
      }
    } catch (e) {
      console.warn('Token verify failed:', e);
    }
  }
  lockDashboard();
}

function lockDashboard() {
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('admin-app').classList.add('hidden');
}

function unlockDashboard() {
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');
  fetchAdminData();
}

// Login form handler
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerText = 'Authenticating...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if (data.success && data.token) {
      adminToken = data.token;
      localStorage.setItem('arsh_admin_token', adminToken);
      unlockDashboard();
      showToast('Welcome back! Studio Admin authenticated successfully.');
    } else {
      alert(data.message || 'Invalid password.');
    }
  } catch (err) {
    alert('Server communication error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Authenticate & Access Dashboard';
  }
});

function logoutAdmin() {
  if (confirm('Are you sure you want to log out of the admin panel?')) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).catch(() => {});
    localStorage.removeItem('arsh_admin_token');
    adminToken = '';
    lockDashboard();
  }
}

// ==========================================
// 2. TAB SWITCHING
// ==========================================
const TAB_TITLES = {
  overview: { title: 'Dashboard Overview', subtitle: 'Real-time studio controls & system health' },
  hero: { title: 'Hero & Main Banners', subtitle: 'Manage headline, tagline, and showcase banner photos' },
  gallery: { title: 'Portfolio Gallery', subtitle: 'Upload and organize bridal photos with Cloudinary' },
  services: { title: 'Services & Inclusions', subtitle: 'Configure bespoke makeup services and packages' },
  about: { title: 'Artist Profile & Bio', subtitle: 'Edit Arsh Khan biography, photo, and accolades' },
  inquiries: { title: 'Client Inquiries', subtitle: 'Manage booking leads submitted from the website' },
  pricing: { title: 'Packages & Policies', subtitle: 'Manage advance booking notice, outstation rules, and quotes' },
  contact: { title: 'Contact & Location', subtitle: 'Update phone, WhatsApp, Instagram, and Delhi address' },
  security: { title: 'Password Management', subtitle: 'Secure your administrative portal with custom credentials' }
};

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.remove('bg-stone-800', 'text-amber-400');
  });

  const activeBtn = Array.from(document.querySelectorAll('.nav-tab')).find(b => 
    b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)
  );
  if (activeBtn) activeBtn.classList.add('bg-stone-800', 'text-amber-400');

  const meta = TAB_TITLES[tabId] || { title: 'Dashboard', subtitle: '' };
  document.getElementById('tab-title').textContent = meta.title;
  document.getElementById('tab-subtitle').textContent = meta.subtitle;
}

// ==========================================
// 3. FETCH AND POPULATE CMS DATA
// ==========================================
async function fetchAdminData() {
  try {
    const res = await fetch('/api/content');
    if (!res.ok) throw new Error('Failed to load content');
    currentSiteData = await res.json();
    populateAllSections();
    await fetchInquiries();
  } catch (err) {
    console.error('Fetch error:', err);
    showToast('Failed to load data. Please refresh.', 'error');
  }
}

function populateAllSections() {
  const d = currentSiteData;

  // Overview stats
  const galCount = (d.gallery || []).length;
  const srvCount = (d.services || []).length;
  document.getElementById('stat-gallery-count').textContent = galCount;
  document.getElementById('stat-services-count').textContent = srvCount;
  document.getElementById('gallery-count-badge').textContent = `${galCount} Photos`;

  // 1. Hero Form
  const h = d.hero || {};
  document.getElementById('hero-badge').value = h.badge || '';
  document.getElementById('hero-title').value = h.title || '';
  document.getElementById('hero-subtitle').value = h.subtitle || '';
  const heroImg = (h.heroImages && h.heroImages[0]) || h.image || '';
  document.getElementById('hero-img-url').value = heroImg;
  document.getElementById('hero-preview-img').src = heroImg;

  // Render quick Hero Gallery Picker
  const heroPicker = document.getElementById('hero-gallery-picker');
  if (heroPicker && d.gallery) {
    heroPicker.innerHTML = d.gallery.map(item => `
      <div class="relative group rounded-xl overflow-hidden border-2 ${
        heroImg === item.url ? 'border-amber-500 shadow-md ring-2 ring-amber-300' : 'border-stone-200'
      } cursor-pointer h-24 bg-stone-100" onclick="setPhotoAsHero('${item.url}')" title="Click to set as Hero image">
        <img src="${item.url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold text-center px-1">
          👑 Set as Hero
        </div>
        ${heroImg === item.url ? '<span class="absolute top-1 right-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow">Active</span>' : ''}
      </div>
    `).join('');
  }

  // 2. About Form
  const ab = d.about || {};
  document.getElementById('about-name').value = ab.artistName || '';
  document.getElementById('about-title').value = ab.artistTitle || '';
  document.getElementById('about-quote').value = ab.quote || '';
  document.getElementById('about-bio-1').value = ab.bioParagraph1 || '';
  document.getElementById('about-bio-2').value = ab.bioParagraph2 || '';
  document.getElementById('about-img-url').value = ab.artistImage || '';
  document.getElementById('artist-preview-img').src = ab.artistImage || '';

  // 3. Contact Form
  const c = d.contact || {};
  document.getElementById('contact-phone').value = c.phone || '';
  document.getElementById('contact-whatsapp').value = c.whatsapp || '';
  document.getElementById('contact-instagram').value = c.instagram || '';
  document.getElementById('contact-instagram-url').value = c.instagramUrl || '';
  document.getElementById('contact-pincode').value = c.pincode || '';
  document.getElementById('contact-coverage').value = c.coverage || '';
  document.getElementById('contact-address').value = c.address || '';

  // 4. Pricing & Policy Form
  const pr = d.pricing || {};
  const pol = d.policy || {};
  document.getElementById('pricing-title').value = pr.title || '';
  document.getElementById('pricing-notice').value = pr.notice || '';

  const polListEl = document.getElementById('policies-edit-list');
  if (polListEl && pol.items) {
    polListEl.innerHTML = pol.items.map((item, idx) => `
      <div class="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
        <div class="flex items-center justify-between">
          <input type="text" class="policy-title-input font-bold text-sm text-[#1C1714] bg-white px-3 py-1.5 rounded border border-stone-300 w-2/3" value="${item.title}" data-index="${idx}" />
          <input type="text" class="policy-badge-input text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-300 w-1/4" value="${item.badge || 'Policy'}" data-index="${idx}" />
        </div>
        <textarea class="policy-desc-input w-full text-xs text-stone-600 bg-white p-2 rounded border border-stone-300" rows="2" data-index="${idx}">${item.desc}</textarea>
      </div>
    `).join('');
  }

  // 5. Render Gallery items
  renderAdminGallery();

  // 6. Render Services items
  renderAdminServices();
}

// ==========================================
// 4. GALLERY MANAGEMENT & CLOUDINARY UPLOAD
// ==========================================
function renderAdminGallery() {
  const container = document.getElementById('admin-gallery-list');
  const items = currentSiteData.gallery || [];

  if (items.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-stone-400 text-sm">No photos in gallery yet. Upload one above!</div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="bg-stone-50 rounded-2xl overflow-hidden border border-stone-200 shadow-xs flex flex-col justify-between group">
      <div class="relative h-48 w-full overflow-hidden">
        <img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        <span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-black/60 text-white backdrop-blur-sm">
          ${item.category}
        </span>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 class="font-royal font-bold text-sm text-[#1C1714] mb-1 line-clamp-1">${item.title}</h4>
          <p class="text-xs text-stone-500 line-clamp-2">${item.details || 'Bridal work by Arsh'}</p>
        </div>
        <div class="pt-3 mt-3 border-t border-stone-200 flex items-center justify-between gap-1">
          <button onclick="setPhotoAsHero('${item.url}')" class="text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors" title="Set as homepage hero showcase photo">
            👑 Set Hero
          </button>
          <div class="flex items-center gap-2">
            <a href="${item.url}" target="_blank" class="text-[11px] text-amber-800 hover:underline">View</a>
            <button onclick="deleteGalleryItem('${item.id}')" class="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-50">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function previewGalleryUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const preview = document.getElementById('gal-upload-preview');
    const thumb = document.getElementById('gal-preview-thumb');
    const name = document.getElementById('gal-preview-name');

    const reader = new FileReader();
    reader.onload = (e) => {
      thumb.src = e.target.result;
      name.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// Upload & Add photo to Gallery
document.getElementById('gallery-upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('gal-new-title').value.trim();
  const category = document.getElementById('gal-new-category').value;
  const details = document.getElementById('gal-new-details').value.trim();
  const fileInput = document.getElementById('gal-file-input');
  const directUrl = document.getElementById('gal-direct-url').value.trim();

  let finalUrl = directUrl;

  const btn = document.getElementById('gal-submit-btn');
  btn.disabled = true;
  btn.innerText = 'Uploading to Cloudinary...';

  try {
    if (fileInput.files && fileInput.files[0]) {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Cloudinary upload failed');
      }
      finalUrl = uploadData.url;
    }

    if (!finalUrl) {
      alert('Please select an image file to upload or enter an image URL.');
      return;
    }

    // Save to gallery
    const addRes = await fetch('/api/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title, category, details, url: finalUrl })
    });
    const addData = await addRes.json();

    if (addData.success) {
      // Check if user also wants to set as Hero
      const heroCheck = document.getElementById('gal-set-as-hero');
      if (heroCheck && heroCheck.checked) {
        await setPhotoAsHero(finalUrl, false);
        showToast('🎉 Photo added to gallery AND set as Homepage Hero showcase!');
      } else {
        showToast('Photo uploaded to Cloudinary and published to gallery!');
      }

      document.getElementById('gallery-upload-form').reset();
      document.getElementById('gal-upload-preview').classList.add('hidden');
      await fetchAdminData();
    } else {
      alert(addData.message || 'Failed to save to gallery');
    }
  } catch (err) {
    alert('Upload error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Upload & Publish To Gallery';
  }
});

async function deleteGalleryItem(id) {
  if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;

  try {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Photo deleted successfully!');
      await fetchAdminData();
    } else {
      alert(data.message || 'Failed to delete photo');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Auto-upload Hero image to Cloudinary & Live Save
async function autoUploadHero(input) {
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  const statusEl = document.getElementById('hero-upload-status');
  if (statusEl) statusEl.innerHTML = `<span class="text-amber-700 animate-pulse">⏳ Uploading to Cloudinary (gdkzinnv)...</span>`;

  const formData = new FormData();
  formData.append('image', file);

  try {
    showToast('Uploading hero image to Cloudinary...');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      const newUrl = data.url;
      document.getElementById('hero-img-url').value = newUrl;
      document.getElementById('hero-preview-img').src = newUrl;
      if (statusEl) statusEl.innerHTML = `<span class="text-emerald-700 font-bold">✅ Uploaded &amp; Saved!</span>`;

      // Instantly save to Hero section on server!
      await setPhotoAsHero(newUrl, false);
      showToast('👑 Hero photo updated & published live on website!');
      await fetchAdminData();
    } else {
      if (statusEl) statusEl.innerHTML = `<span class="text-red-600 font-bold">❌ ${data.message}</span>`;
      alert('Upload failed: ' + data.message);
    }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<span class="text-red-600 font-bold">❌ ${err.message}</span>`;
    alert('Error: ' + err.message);
  }
}

// Apply Hero URL directly
async function applyHeroUrlDirectly() {
  const url = document.getElementById('hero-img-url').value.trim();
  if (!url) {
    alert('Please enter a valid image URL');
    return;
  }
  await setPhotoAsHero(url);
}

// 1-Click Set any photo as Hero Showcase Image
async function setPhotoAsHero(url, notify = true) {
  if (!url) return;
  const heroData = {
    ...(currentSiteData.hero || {}),
    badge: document.getElementById('hero-badge').value || currentSiteData.hero?.badge || '',
    title: document.getElementById('hero-title').value || currentSiteData.hero?.title || '',
    subtitle: document.getElementById('hero-subtitle').value || currentSiteData.hero?.subtitle || '',
    image: url,
    heroImages: [url]
  };

  try {
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ section: 'hero', data: heroData })
    });
    const data = await res.json();
    if (data.success) {
      currentSiteData.hero = heroData;
      document.getElementById('hero-img-url').value = url;
      document.getElementById('hero-preview-img').src = url;
      if (notify) {
        showToast('👑 Photo set as Hero section showcase on homepage!');
        await fetchAdminData();
      }
    } else {
      alert(data.message || 'Failed to update hero photo');
    }
  } catch (err) {
    alert('Error setting hero photo: ' + err.message);
  }
}

// Upload Artist image to Cloudinary
async function uploadArtistImage() {
  const fileInput = document.getElementById('artist-file-input');
  if (!fileInput.files || !fileInput.files[0]) {
    alert('Please select an image file first.');
    return;
  }

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  try {
    showToast('Uploading artist photo to Cloudinary...');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('artist-img-url').value = data.url;
      document.getElementById('artist-preview-img').src = data.url;
      showToast('Artist photo uploaded! Click "Save Artist Profile" to publish.');
    } else {
      alert(data.message || 'Upload failed');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ==========================================
// 5. SERVICES CRUD
// ==========================================
function renderAdminServices() {
  const container = document.getElementById('admin-services-list');
  const services = currentSiteData.services || [];

  container.innerHTML = services.map(s => `
    <div class="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img src="${s.image || '/assets/images/bridal_look_1.jpg'}" alt="${s.name}" class="w-16 h-16 rounded-xl object-cover border border-amber-300 flex-shrink-0" />
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">${s.badge || 'Service'}</span>
            <h4 class="font-royal font-bold text-base text-[#1C1714]">${s.name}</h4>
          </div>
          <p class="text-xs text-stone-500 mt-0.5">${s.tagline || ''}</p>
          <p class="text-xs font-semibold text-amber-800 mt-1">${s.price || 'PRICE ON REQUEST'}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="editServicePrompt('${s.id}')" class="btn-gold-outline px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer">
          Edit
        </button>
        <button onclick="deleteServiceItem('${s.id}')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer">
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

async function editServicePrompt(id) {
  const service = (currentSiteData.services || []).find(s => s.id === id);
  if (!service) return;

  const newName = prompt('Enter Service Name:', service.name);
  if (newName === null) return;
  const newTagline = prompt('Enter Service Tagline:', service.tagline || '');
  if (newTagline === null) return;
  const newPrice = prompt('Enter Pricing:', service.price || 'PRICE ON REQUEST');
  if (newPrice === null) return;

  try {
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: newName, tagline: newTagline, price: newPrice })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Service updated successfully!');
      await fetchAdminData();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function deleteServiceItem(id) {
  if (!confirm('Are you sure you want to delete this service?')) return;
  try {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Service removed!');
      await fetchAdminData();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function openNewServiceModal() {
  const name = prompt('Enter New Service Name:');
  if (!name) return;
  const tagline = prompt('Enter Tagline / Brief Description:') || '';
  const price = prompt('Pricing Note (default: PRICE ON REQUEST):') || 'PRICE ON REQUEST';

  fetch('/api/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ name, tagline, price, features: ['Premium Makeup Base', 'Lashes & Styling Included'] })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      showToast('New service added successfully!');
      fetchAdminData();
    }
  });
}

// ==========================================
// 6. CLIENT INQUIRIES
// ==========================================
async function fetchInquiries() {
  try {
    const res = await fetch('/api/inquiries', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) return;
    currentInquiries = await res.json();
    renderInquiries();
  } catch (e) {
    console.error('Inquiries fetch error:', e);
  }
}

function renderInquiries() {
  const container = document.getElementById('admin-inquiries-table');
  const countBadge = document.getElementById('inquiry-badge-count');
  const statCount = document.getElementById('stat-inquiries-count');

  if (countBadge) countBadge.textContent = currentInquiries.length;
  if (statCount) statCount.textContent = currentInquiries.length;

  if (currentInquiries.length === 0) {
    container.innerHTML = `<div class="py-12 text-center text-stone-400 text-sm">No client consultation leads yet. New submissions will appear here automatically.</div>`;
    return;
  }

  container.innerHTML = currentInquiries.map(inq => `
    <div class="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <span class="text-base font-royal font-bold text-[#1C1714]">${inq.name}</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            inq.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
            inq.status === 'Contacted' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
          }">${inq.status || 'New'}</span>
        </div>
        <p class="text-xs text-stone-600">
          <strong>Service:</strong> ${inq.service} &bull; <strong>Date:</strong> ${inq.date || 'Flexible'} &bull; <strong>Venue:</strong> ${inq.venue || 'Delhi NCR'}
        </p>
        ${inq.notes ? `<p class="text-xs text-stone-500 italic mt-1">"${inq.notes}"</p>` : ''}
        <div class="text-[11px] text-gray-400">Received: ${new Date(inq.createdAt).toLocaleString()}</div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <a href="https://wa.me/91${inq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${inq.name}! This is Arsh Khan from Arsh Makeup Artist Delhi regarding your bridal inquiry.`)}" target="_blank" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5">
          <span>WhatsApp Client</span>
        </a>
        <a href="tel:${inq.phone}" class="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100">
          Call (${inq.phone})
        </a>
        <select onchange="updateInquiryStatus('${inq.id}', this.value)" class="text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white">
          <option value="New" ${inq.status === 'New' ? 'selected' : ''}>Status: New</option>
          <option value="Contacted" ${inq.status === 'Contacted' ? 'selected' : ''}>Status: Contacted</option>
          <option value="Confirmed" ${inq.status === 'Confirmed' ? 'selected' : ''}>Status: Confirmed</option>
        </select>
        <button onclick="deleteInquiryItem('${inq.id}')" class="text-xs text-red-500 hover:text-red-700 p-1.5" title="Delete">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

async function updateInquiryStatus(id, newStatus) {
  try {
    await fetch(`/api/inquiries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    showToast('Inquiry status updated to ' + newStatus);
    await fetchInquiries();
  } catch (e) {
    alert('Error updating status');
  }
}

async function deleteInquiryItem(id) {
  if (!confirm('Delete this inquiry?')) return;
  try {
    await fetch(`/api/inquiries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    showToast('Inquiry deleted');
    await fetchInquiries();
  } catch (e) {
    alert('Error deleting inquiry');
  }
}

// ==========================================
// 7. REAL PASSWORD MANAGEMENT SYSTEM
// ==========================================
document.getElementById('change-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('pw-current').value;
  const newPassword = document.getElementById('pw-new').value;
  const confirmPassword = document.getElementById('pw-confirm').value;

  if (newPassword !== confirmPassword) {
    alert('New password and confirmation password do not match.');
    return;
  }

  if (newPassword.length < 5) {
    alert('Password must be at least 5 characters long.');
    return;
  }

  const btn = document.getElementById('pw-submit-btn');
  btn.disabled = true;
  btn.innerText = 'Updating password...';

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();

    if (data.success) {
      if (data.newToken) {
        adminToken = data.newToken;
        localStorage.setItem('arsh_admin_token', adminToken);
      }
      document.getElementById('change-password-form').reset();
      showToast('🎉 Password successfully updated! Your account is secured with your new password.');
    } else {
      alert(data.message || 'Failed to change password');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Update Admin Password';
  }
});

// ==========================================
// 8. FORM SAVE HANDLERS
// ==========================================
function setupEventListeners() {
  // Hero Form
  document.getElementById('hero-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const heroData = {
      ...(currentSiteData.hero || {}),
      badge: document.getElementById('hero-badge').value,
      title: document.getElementById('hero-title').value,
      subtitle: document.getElementById('hero-subtitle').value,
      heroImages: [document.getElementById('hero-img-url').value]
    };
    await saveSection('hero', heroData, 'Hero banner changes published!');
  });

  // About Form
  document.getElementById('about-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const aboutData = {
      ...(currentSiteData.about || {}),
      artistName: document.getElementById('about-name').value,
      artistTitle: document.getElementById('about-title').value,
      quote: document.getElementById('about-quote').value,
      bioParagraph1: document.getElementById('about-bio-1').value,
      bioParagraph2: document.getElementById('about-bio-2').value,
      artistImage: document.getElementById('artist-img-url').value
    };
    await saveSection('about', aboutData, 'Artist profile updated!');
  });

  // Contact Form
  document.getElementById('contact-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const contactData = {
      ...(currentSiteData.contact || {}),
      phone: document.getElementById('contact-phone').value,
      whatsapp: document.getElementById('contact-whatsapp').value,
      instagram: document.getElementById('contact-instagram').value,
      instagramUrl: document.getElementById('contact-instagram-url').value,
      pincode: document.getElementById('contact-pincode').value,
      coverage: document.getElementById('contact-coverage').value,
      address: document.getElementById('contact-address').value
    };
    await saveSection('contact', contactData, 'Contact details updated!');
  });

  // Pricing & Policy Form
  document.getElementById('pricing-policy-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pricingData = {
      ...(currentSiteData.pricing || {}),
      title: document.getElementById('pricing-title').value,
      notice: document.getElementById('pricing-notice').value
    };

    // Gather edited policies
    const policyItems = [];
    const titles = document.querySelectorAll('.policy-title-input');
    const badges = document.querySelectorAll('.policy-badge-input');
    const descs = document.querySelectorAll('.policy-desc-input');

    titles.forEach((tEl, idx) => {
      policyItems.push({
        title: tEl.value,
        badge: badges[idx] ? badges[idx].value : 'Policy',
        desc: descs[idx] ? descs[idx].value : ''
      });
    });

    const policyData = {
      ...(currentSiteData.policy || {}),
      items: policyItems
    };

    await saveSection('pricing', pricingData);
    await saveSection('policy', policyData, 'Pricing & Policy settings published!');
  });
}

async function saveSection(section, data, successMsg = 'Changes saved successfully!') {
  try {
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ section, data })
    });
    const result = await res.json();
    if (result.success) {
      currentSiteData[section] = data;
      showToast(successMsg);
    } else {
      alert(result.message || 'Error saving changes');
    }
  } catch (err) {
    alert('Save error: ' + err.message);
  }
}

// Toast notification helper
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-6 right-6 z-200 px-6 py-4 rounded-xl shadow-2xl text-white text-xs font-semibold flex items-center gap-3 transition-all duration-300 ${
    type === 'error' ? 'bg-red-900 border border-red-500' : 'bg-[#1C1714] border border-amber-400'
  }`;
  toast.innerHTML = `
    <span>${type === 'error' ? '⚠️' : '✨'}</span>
    <span>${msg}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
