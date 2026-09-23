const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'gdkzinnv',
  api_key: '323948998656648',
  api_secret: 'A6ubsscdEUC27KgJ3dLpBTXp1dI'
});

const siteDataPath = path.join(__dirname, 'data', 'site-data.json');
const siteData = JSON.parse(fs.readFileSync(siteDataPath, 'utf8'));

const imagesToUpload = [
  {
    local: path.join(__dirname, 'public', 'assets', 'images', 'bridal_look_1.jpg'),
    publicId: 'bridal_look_1_red',
    title: 'Royal Red Lehenga Bridal Splendor',
    category: 'Bridal',
    details: 'Iconic traditional red bridal look with heavy Kundan jewelry, maang tikka, chooda, and soft sculpted HD base.'
  },
  {
    local: path.join(__dirname, 'public', 'assets', 'images', 'bridal_look_2.jpg'),
    publicId: 'bridal_look_2_eyes',
    title: 'Dramatic Cut-Crease & Gold Glimmer',
    category: 'Bridal',
    details: 'Intricate dual-tone eyeshadow art featuring royal purple, 24K gold shimmer, and emerald circular matha patti.'
  },
  {
    local: path.join(__dirname, 'public', 'assets', 'images', 'bridal_look_3.jpg'),
    publicId: 'bridal_look_3_varmala',
    title: 'Chandelier Reception Royalty',
    category: 'Reception',
    details: 'Heavily embellished gold scalloped blouse with royal varmala, sheer dupatta, and radiant longwear skin.'
  },
  {
    local: path.join(__dirname, 'public', 'assets', 'images', 'bridal_look_4.jpg'),
    publicId: 'bridal_look_4_kanjeevaram',
    title: 'Temple Gold & Magenta Silk Bride',
    category: 'Bridal',
    details: 'Regal South Indian bridal styling in rich magenta pink silk saree paired with layered antique temple jewelry.'
  }
];

async function seed() {
  console.log('🌟 Uploading 4 client bridal photos to Cloudinary (gdkzinnv)...');
  const uploadedUrls = [];

  for (const item of imagesToUpload) {
    try {
      console.log(`Uploading ${path.basename(item.local)}...`);
      const res = await cloudinary.uploader.upload(item.local, {
        folder: 'arsh_makeup_artist',
        public_id: item.publicId
      });
      console.log(`✅ Uploaded ${item.publicId} -> ${res.secure_url}`);
      uploadedUrls.push({
        id: 'gal-' + item.publicId,
        title: item.title,
        category: item.category,
        url: res.secure_url,
        featured: true,
        details: item.details
      });
    } catch (err) {
      console.error(`Failed to upload ${item.publicId}:`, err);
    }
  }

  if (uploadedUrls.length > 0) {
    siteData.gallery = uploadedUrls;
    siteData.hero.heroImages = [uploadedUrls[0].url, uploadedUrls[2].url, uploadedUrls[3].url];
    siteData.about.artistImage = uploadedUrls[0].url;

    // Also update services images with the real Cloudinary URLs
    if (siteData.services[0]) siteData.services[0].image = uploadedUrls[0].url;
    if (siteData.services[1]) siteData.services[1].image = uploadedUrls[1].url;
    if (siteData.services[2]) siteData.services[2].image = uploadedUrls[3].url;
    if (siteData.services[3]) siteData.services[3].image = uploadedUrls[2].url;
    if (siteData.services[4]) siteData.services[4].image = uploadedUrls[3].url;
    if (siteData.services[5]) siteData.services[5].image = uploadedUrls[0].url;

    fs.writeFileSync(siteDataPath, JSON.stringify(siteData, null, 2), 'utf8');
    console.log('\n🎉 site-data.json successfully updated with permanent Cloudinary URLs!');
  }
}

seed();
