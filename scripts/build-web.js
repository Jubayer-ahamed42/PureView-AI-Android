const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const tf = require('@tensorflow/tfjs');
const wasm = require('@tensorflow/tfjs-backend-wasm');
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');

async function buildAssets() {
  const rootDir = path.join(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const modelsOutDir = path.join(publicDir, 'models');
  const vendorOutDir = path.join(publicDir, 'vendor');
  const testImagesDir = path.join(publicDir, 'test-images');

  fs.mkdirSync(modelsOutDir, { recursive: true });
  fs.mkdirSync(vendorOutDir, { recursive: true });
  fs.mkdirSync(testImagesDir, { recursive: true });

  // 1. Copy AI models from @vladmandic/face-api and @vladmandic/human
  const faceApiModelDir = path.join(rootDir, 'node_modules', '@vladmandic', 'face-api', 'model');
  for (const file of fs.readdirSync(faceApiModelDir)) {
    fs.copyFileSync(path.join(faceApiModelDir, file), path.join(modelsOutDir, file));
  }

  const humanModelDir = path.join(rootDir, 'node_modules', '@vladmandic', 'human', 'models');
  for (const file of ['blazeface.json', 'blazeface.bin', 'faceres.json', 'faceres.bin', 'models.json']) {
    if (fs.existsSync(path.join(humanModelDir, file))) {
      fs.copyFileSync(path.join(humanModelDir, file), path.join(modelsOutDir, file));
    }
  }

  // 2. Copy browser AI bundles & WASM binaries to public/vendor
  fs.copyFileSync(
    path.join(rootDir, 'node_modules', '@vladmandic', 'face-api', 'dist', 'face-api.js'),
    path.join(vendorOutDir, 'face-api.js')
  );
  fs.copyFileSync(
    path.join(rootDir, 'node_modules', '@vladmandic', 'human', 'dist', 'human.js'),
    path.join(vendorOutDir, 'human.js')
  );

  const wasmDistDir = path.join(rootDir, 'node_modules', '@tensorflow', 'tfjs-backend-wasm', 'dist');
  for (const file of fs.readdirSync(wasmDistDir)) {
    if (file.endsWith('.wasm') || file.endsWith('.js')) {
      fs.copyFileSync(path.join(wasmDistDir, file), path.join(vendorOutDir, file));
    }
  }

  // 3. Create real Male, Female, and Nature/Islamic Architecture test images with natural framing
  const humanFaceId = path.join(rootDir, 'node_modules', '@vladmandic', 'human', 'assets', 'screenshot-faceid.jpg');
  const humanFaceDetect = path.join(rootDir, 'node_modules', '@vladmandic', 'human', 'assets', 'screenshot-facedetect.jpg');
  const humanFaceMatch = path.join(rootDir, 'node_modules', '@vladmandic', 'human', 'assets', 'screenshot-facematch.jpg');
  const sample1 = path.join(rootDir, 'node_modules', '@vladmandic', 'face-api', 'demo', 'sample1.jpg');
  const sample2 = path.join(rootDir, 'node_modules', '@vladmandic', 'face-api', 'demo', 'sample2.jpg');
  const sample3 = path.join(rootDir, 'node_modules', '@vladmandic', 'face-api', 'demo', 'sample3.jpg');
  const sample4 = path.join(rootDir, 'node_modules', '@vladmandic', 'face-api', 'demo', 'sample4.jpg');
  const sample6 = path.join(rootDir, 'node_modules', '@vladmandic', 'face-api', 'demo', 'sample6.jpg');

  // Male 1: Portrait from screenshot-faceid.jpg framed on dark emerald card
  const male1Crop = await sharp(humanFaceId)
    .extract({ left: 14, top: 140, width: 176, height: 162 })
    .resize(240, 220)
    .toBuffer();
  await sharp({
    create: { width: 480, height: 480, channels: 3, background: { r: 9, g: 32, b: 26 } }
  })
    .composite([{ input: male1Crop, left: 120, top: 130 }])
    .jpeg({ quality: 94 })
    .toFile(path.join(testImagesDir, 'male-scholar-1.jpg'));

  // Male 2: Portrait from screenshot-facematch.jpg top-left (x:5, y:4, w:170, h:220)
  const male2Crop = await sharp(humanFaceMatch)
    .extract({ left: 5, top: 4, width: 170, height: 220 })
    .resize(230, 290)
    .toBuffer();
  await sharp({
    create: { width: 480, height: 480, channels: 3, background: { r: 12, g: 38, b: 31 } }
  })
    .composite([{ input: male2Crop, left: 125, top: 95 }])
    .jpeg({ quality: 94 })
    .toFile(path.join(testImagesDir, 'male-speaker-2.jpg'));

  // Male 3: Wide YouTube Podcast Thumbnail (640x360) with Male Speaker
  const male3Crop = await sharp(humanFaceDetect)
    .extract({ left: 8, top: 320, width: 150, height: 185 })
    .resize(210, 258)
    .toBuffer();
  await sharp({
    create: { width: 640, height: 360, channels: 3, background: { r: 8, g: 28, b: 22 } }
  })
    .composite([{ input: male3Crop, left: 215, top: 51 }])
    .jpeg({ quality: 94 })
    .toFile(path.join(testImagesDir, 'male-podcast-thumb.jpg'));

  // Female 1: Portrait from sample1.jpg right woman (x:1250, y:100, w:600, h:600)
  await sharp(sample1)
    .extract({ left: 1250, top: 100, width: 600, height: 600 })
    .resize(480, 480, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(path.join(testImagesDir, 'female-portrait-1.jpg'));

  // Female 2: Portrait from sample2.jpg center woman (x:700, y:80, w:550, h:550)
  await sharp(sample2)
    .extract({ left: 700, top: 80, width: 550, height: 550 })
    .resize(480, 480, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(path.join(testImagesDir, 'female-vlog-2.jpg'));

  // Female 3: Wide YouTube thumbnail from sample3.jpg (x:350, y:120, w:1400, h:788)
  await sharp(sample3)
    .extract({ left: 350, top: 120, width: 1400, h: 788, height: 788 })
    .resize(640, 360, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(path.join(testImagesDir, 'female-yt-thumb-3.jpg'));

  // Female 4: Fashion/Reel vertical crop from sample6.jpg (x:520, y:180, w:540, h:840)
  await sharp(sample6)
    .extract({ left: 520, top: 180, width: 540, height: 840 })
    .resize(450, 700, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(path.join(testImagesDir, 'female-reel-4.jpg'));

  // Female 5: Sponsored Ad / Story portrait from sample4.jpg (x:500, y:10, w:520, h:520)
  await sharp(sample4)
    .extract({ left: 500, top: 10, width: 520, height: 520 })
    .resize(480, 480, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(path.join(testImagesDir, 'female-ad-5.jpg'));

  // Mixed 6: Male + Female Talk-Show / Interview Thumbnail (640x360) for testing group & Face-Only blur
  const mixedMaleCrop = await sharp(humanFaceMatch)
    .extract({ left: 5, top: 4, width: 170, height: 220 })
    .resize(220, 280)
    .toBuffer();
  const mixedFemaleCrop = await sharp(sample1)
    .extract({ left: 1250, top: 100, width: 600, height: 600 })
    .resize(280, 280)
    .toBuffer();
  await sharp({
    create: { width: 640, height: 360, channels: 3, background: { r: 10, g: 30, b: 24 } }
  })
    .composite([
      { input: mixedMaleCrop, left: 60, top: 40 },
      { input: mixedFemaleCrop, left: 320, top: 40 }
    ])
    .jpeg({ quality: 92 })
    .toFile(path.join(testImagesDir, 'mixed-interview-thumb.jpg'));

  // Nature / Islamic Geometric / Mosque Silhouette (No Face) SVG -> JPEG
  const mosqueSvg = `
    <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#042f2e"/>
          <stop offset="60%" stop-color="#065f46"/>
          <stop offset="100%" stop-color="#022c22"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#sky)"/>
      <circle cx="500" cy="85" r="38" fill="#fde047" opacity="0.9"/>
      <circle cx="515" cy="75" r="34" fill="#042f2e"/>
      <ellipse cx="320" cy="240" rx="130" ry="95" fill="#021713"/>
      <rect x="160" y="235" width="320" height="125" fill="#021713"/>
      <rect x="120" y="110" width="24" height="250" fill="#021713"/>
      <polygon points="120,110 132,70 144,110" fill="#eab308"/>
      <rect x="496" y="110" width="24" height="250" fill="#021713"/>
      <polygon points="496,110 508,70 520,110" fill="#eab308"/>
      <text x="320" y="315" font-family="sans-serif" font-size="24" font-weight="bold" fill="#34d399" text-anchor="middle">Surah Ar-Rahman Recitation</text>
    </svg>
  `;
  await sharp(Buffer.from(mosqueSvg))
    .jpeg({ quality: 92 })
    .toFile(path.join(testImagesDir, 'safe-mosque-nature.jpg'));

  // Technology / Coding Setup (No Face) SVG -> JPEG
  const techSvg = `
    <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="360" fill="#091926"/>
      <rect x="140" y="55" width="360" height="210" rx="12" fill="#0f293d" stroke="#10b981" stroke-width="4"/>
      <rect x="165" y="85" width="180" height="14" rx="4" fill="#34d399"/>
      <rect x="165" y="115" width="260" height="12" rx="4" fill="#38bdf8"/>
      <rect x="165" y="140" width="220" height="12" rx="4" fill="#a7f3d0"/>
      <rect x="165" y="165" width="140" height="12" rx="4" fill="#eab308"/>
      <rect x="260" y="265" width="120" height="25" fill="#1e293b"/>
      <rect x="200" y="290" width="240" height="12" rx="6" fill="#334155"/>
      <text x="320" y="335" font-family="sans-serif" font-size="20" font-weight="bold" fill="#e2e8f0" text-anchor="middle">Android AI Architecture Tutorial</text>
    </svg>
  `;
  await sharp(Buffer.from(techSvg))
    .jpeg({ quality: 92 })
    .toFile(path.join(testImagesDir, 'safe-tech-review.jpg'));

  // 4. Verify all generated test images with WASM-accelerated @vladmandic/face-api
  wasm.setWasmPaths(wasmDistDir + path.sep);
  await tf.setBackend('wasm');
  await tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsOutDir);
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsOutDir);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsOutDir);
  await faceapi.nets.ageGenderNet.loadFromDisk(modelsOutDir);

  console.log('\n=== PureView AI Test Image Verification (WASM Backend) ===');
  for (const file of fs.readdirSync(testImagesDir).sort()) {
    if (!file.endsWith('.jpg')) continue;
    const fullPath = path.join(testImagesDir, file);
    const { data, info } = await sharp(fullPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');
    const detections = await faceapi
      .detectAllFaces(tensor, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
      .withFaceLandmarks()
      .withAgeAndGender();
    tensor.dispose();

    const summary = detections.map(d => `${d.gender} (${(d.genderProbability * 100).toFixed(1)}%)`);
    const hasFemale = detections.some(d => d.gender === 'female' && d.genderProbability >= 0.5);
    console.log(`${file.padEnd(28)} -> faces=${detections.length} [${summary.join(', ')}] => Action: ${hasFemale ? 'LOCK HEAVY BLUR' : 'UNBLUR (100% CLEAR)'}`);
  }
}

buildAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
