const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

function createCrispCutout(image, threshold = 244) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  function isBg(x, y) {
    const idx = (y * w + x) * 4;
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    return r >= threshold && g >= threshold && b >= threshold && Math.abs(r - g) <= 3 && Math.abs(g - b) <= 3;
  }

  // Clear pixels that are outside the shirt perimeter or matching background
  const maxHem = Math.min(h - 1, 1095);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      if (y > maxHem || isBg(x, y)) {
        image.bitmap.data[idx + 3] = 0; // Transparent
      } else {
        image.bitmap.data[idx + 3] = 255; // Solid
      }
    }
  }

  // Smooth feather edge by 1px
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (image.bitmap.data[idx + 3] > 0) {
        const hasZero =
          image.bitmap.data[((y - 1) * w + x) * 4 + 3] === 0 ||
          image.bitmap.data[((y + 1) * w + x) * 4 + 3] === 0 ||
          image.bitmap.data[(y * w + (x - 1)) * 4 + 3] === 0 ||
          image.bitmap.data[(y * w + (x + 1)) * 4 + 3] === 0;

        if (hasZero) {
          image.bitmap.data[idx + 3] = 160;
        }
      }
    }
  }

  return image;
}

function applyLightColorFilter(baseImg, rTarget, gTarget, bTarget, blend = 0.55) {
  const img = baseImg.clone();
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const collarY = Math.round(h * 0.17); // Preserve wooden hanger at top

  for (let y = collarY; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (img.bitmap.data[idx + 3] > 20) {
        const origR = img.bitmap.data[idx];
        const origG = img.bitmap.data[idx + 1];
        const origB = img.bitmap.data[idx + 2];
        const lum = (origR * 0.299 + origG * 0.587 + origB * 0.114) / 255;

        const tintedR = Math.round(lum * rTarget);
        const tintedG = Math.round(lum * gTarget);
        const tintedB = Math.round(lum * bTarget);

        img.bitmap.data[idx] = Math.round(origR * (1 - blend) + tintedR * blend);
        img.bitmap.data[idx + 1] = Math.round(origG * (1 - blend) + tintedG * blend);
        img.bitmap.data[idx + 2] = Math.round(origB * (1 - blend) + tintedB * blend);
      }
    }
  }

  return img;
}

async function run() {
  const brainDir = 'C:/Users/vikrant mahar/.gemini/antigravity/brain/9ea69009-9235-426b-82aa-a8f3e83c8445';
  const outDir = 'd:/Client works/aaroh-site/aaroh-site/public/images/products';

  console.log('1. Base white cutouts...');
  const rawWhiteFront = await Jimp.read(path.join(brainDir, 'shirt_front_sample_1794633194244.jpg'));
  const whiteFront = createCrispCutout(rawWhiteFront, 246);

  const rawWhiteSide = await Jimp.read(path.join(brainDir, 'white_shirt_hanger_side_profile_1794633630410.jpg'));
  const whiteSide = createCrispCutout(rawWhiteSide, 235);

  // 1. Classic Oxford - Ivory White
  console.log('1. Ivory White...');
  await whiteFront.write(path.join(outDir, 'shirt-white-front.png'));
  await whiteSide.write(path.join(outDir, 'shirt-white-side.png'));

  // 2. Soft Lavender (#B8B8FF)
  console.log('2. Soft Lavender...');
  const lavenderFront = applyLightColorFilter(whiteFront, 184, 184, 255, 0.72);
  const lavenderSide = applyLightColorFilter(whiteSide, 184, 184, 255, 0.72);
  await lavenderFront.write(path.join(outDir, 'shirt-lavender-front.png'));
  await lavenderSide.write(path.join(outDir, 'shirt-lavender-side.png'));

  // 3. Vanilla Cream (#F5F2EB)
  console.log('3. Vanilla Cream...');
  const creamFront = applyLightColorFilter(whiteFront, 245, 238, 222, 0.65);
  const creamSide = applyLightColorFilter(whiteSide, 245, 238, 222, 0.65);
  await creamFront.write(path.join(outDir, 'shirt-cream-front.png'));
  await creamSide.write(path.join(outDir, 'shirt-cream-side.png'));

  // 4. Mist Grey (#E5E7EB)
  console.log('4. Mist Grey...');
  const mistFront = applyLightColorFilter(whiteFront, 218, 222, 228, 0.6);
  const mistSide = applyLightColorFilter(whiteSide, 218, 222, 228, 0.6);
  await mistFront.write(path.join(outDir, 'shirt-mist-front.png'));
  await mistSide.write(path.join(outDir, 'shirt-mist-side.png'));

  // 5. Pastel Oat Sand (#ECE8DF)
  console.log('5. Pastel Oat...');
  const oatFront = applyLightColorFilter(whiteFront, 236, 228, 215, 0.68);
  const oatSide = applyLightColorFilter(whiteSide, 236, 228, 215, 0.68);
  await oatFront.write(path.join(outDir, 'shirt-oat-front.png'));
  await oatSide.write(path.join(outDir, 'shirt-oat-side.png'));

  // 6. Pale Sage Relaxed (#E0E7E0)
  console.log('6. Pale Sage...');
  const sageFront = applyLightColorFilter(whiteFront, 216, 232, 220, 0.65);
  const sageSide = applyLightColorFilter(whiteSide, 216, 232, 220, 0.65);
  await sageFront.write(path.join(outDir, 'shirt-sage-front.png'));
  await sageSide.write(path.join(outDir, 'shirt-sage-side.png'));

  console.log('All 6 light color variants updated with zero artifact transparency!');
}

run().catch(console.error);
