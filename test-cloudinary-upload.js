const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: 'gdkzinnv',
  api_key: '323948998656648',
  api_secret: 'A6ubsscdEUC27KgJ3dLpBTXp1dI'
});

async function testUpload() {
  console.log('Testing Cloudinary upload with user credentials...');
  const testImagePath = path.join(__dirname, 'public', 'assets', 'images', 'bridal_look_1.jpg');

  try {
    const result = await cloudinary.uploader.upload(testImagePath, {
      folder: 'arsh_makeup_artist',
      public_id: 'sample_bridal_verification'
    });

    console.log('✅ Real Cloudinary Upload Success!');
    console.log('Cloud Name: gdkzinnv');
    console.log('Public ID:', result.public_id);
    console.log('Secure URL:', result.secure_url);
    console.log('Format:', result.format, '| Dimensions:', result.width, 'x', result.height);
  } catch (err) {
    console.error('❌ Cloudinary upload error:', err);
  }
}

testUpload();
