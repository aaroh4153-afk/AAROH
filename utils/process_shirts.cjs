const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

function removeOuterBackground(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const visited = new Uint8Array(width * height);
  const queue = [];

  function isBg(x, y) {
    const idx = (y * width + x) * 4;
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    
    // Background is ultra clean white/neutral studio backdrop
    return r >= 247 && g >= 247 && b >= 247 && Math.abs(r - g) <= 3 && Math.abs(g - b) <= 3;
  }

  // Seed with border pixels
  for (let x = 0; x < width; x++) {
    if (isBg(x, 0)) { queue.push((0 * width) + x); visited[0 * width + x] = 1; }
    if (isBg(x, height - 1)) { queue.push(((height - 1) * width) + x); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isBg(0, y)) { queue.push((y * width) + 0); visited[y * width + 0] = 1; }
    if (isBg(width - 1, y)) { queue.push((y * width) + (width - 1)); visited[y * width + (width - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    const x = pos % width;
    const y = Math.floor(pos / width);

    // Make pixel transparent
    const idx = pos * 4;
    image.bitmap.data[idx + 3] = 0;

    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const npos = ny * width + nx;
        if (!visited[npos] && isBg(nx, ny)) {
          visited[npos] = 1;
          queue.push(npos);
        }
      }
    }
  }

  return image;
}

async function run() {
  const brainDir = 'C:/Users/vikrant mahar/.gemini/antigravity/brain/9ea69009-9235-426b-82aa-a8f3e83c8445';
  const outDir = 'd:/Client works/aaroh-site/aaroh-site/public/images/products';

  // 1. White shirt front
  console.log('Processing White Front...');
  const whiteFront = await Jimp.read(path.join(brainDir, 'shirt_front_sample_1794633194244.jpg'));
  removeOuterBackground(whiteFront);
  await whiteFront.write(path.join(outDir, 'shirt-white-front.png'));

  // 2. White shirt side
  console.log('Processing White Side...');
  const whiteSide = await Jimp.read(path.join(brainDir, 'white_shirt_hanger_side_profile_1794633630410.jpg'));
  removeOuterBackground(whiteSide);
  await whiteSide.write(path.join(outDir, 'shirt-white-side.png'));

  // 3. Denim shirt side
  console.log('Processing Denim Side...');
  const denimSide = await Jimp.read(path.join(brainDir, 'denim_workshirt_hanger_side_profile_1794633640871.jpg'));
  removeOuterBackground(denimSide);
  await denimSide.write(path.join(outDir, 'shirt-denim-side.png'));

  // Color variants
  // Cobalt Blue Front
  console.log('Generating Cobalt Blue Front & Side...');
  const cobaltFront = whiteFront.clone();
  cobaltFront.scan(0, 0, cobaltFront.bitmap.width, cobaltFront.bitmap.height, (x, y, idx) => {
    if (cobaltFront.bitmap.data[idx + 3] > 30 && y > cobaltFront.bitmap.height * 0.17) {
      const lum = (cobaltFront.bitmap.data[idx] + cobaltFront.bitmap.data[idx + 1] + cobaltFront.bitmap.data[idx + 2]) / (3 * 255);
      cobaltFront.bitmap.data[idx] = Math.round(lum * 24);
      cobaltFront.bitmap.data[idx + 1] = Math.round(lum * 68);
      cobaltFront.bitmap.data[idx + 2] = Math.round(lum * 195);
    }
  });
  await cobaltFront.write(path.join(outDir, 'shirt-cobalt-front.png'));
  await denimSide.write(path.join(outDir, 'shirt-cobalt-side.png'));

  // Jet Black Front & Side
  console.log('Generating Jet Black Front & Side...');
  const blackFront = whiteFront.clone();
  blackFront.scan(0, 0, blackFront.bitmap.width, blackFront.bitmap.height, (x, y, idx) => {
    if (blackFront.bitmap.data[idx + 3] > 30 && y > blackFront.bitmap.height * 0.17) {
      const lum = (blackFront.bitmap.data[idx] + blackFront.bitmap.data[idx + 1] + blackFront.bitmap.data[idx + 2]) / (3 * 255);
      const val = Math.round(lum * 40);
      blackFront.bitmap.data[idx] = val;
      blackFront.bitmap.data[idx + 1] = val;
      blackFront.bitmap.data[idx + 2] = val + 4;
    }
  });
  await blackFront.write(path.join(outDir, 'shirt-black-front.png'));

  const blackSide = whiteSide.clone();
  blackSide.scan(0, 0, blackSide.bitmap.width, blackSide.bitmap.height, (x, y, idx) => {
    if (blackSide.bitmap.data[idx + 3] > 30 && y > blackSide.bitmap.height * 0.17) {
      const lum = (blackSide.bitmap.data[idx] + blackSide.bitmap.data[idx + 1] + blackSide.bitmap.data[idx + 2]) / (3 * 255);
      const val = Math.round(lum * 40);
      blackSide.bitmap.data[idx] = val;
      blackSide.bitmap.data[idx + 1] = val;
      blackSide.bitmap.data[idx + 2] = val + 4;
    }
  });
  await blackSide.write(path.join(outDir, 'shirt-black-side.png'));

  // Forest Green Front & Side
  console.log('Generating Forest Green Front & Side...');
  const greenFront = whiteFront.clone();
  greenFront.scan(0, 0, greenFront.bitmap.width, greenFront.bitmap.height, (x, y, idx) => {
    if (greenFront.bitmap.data[idx + 3] > 30 && y > greenFront.bitmap.height * 0.17) {
      const lum = (greenFront.bitmap.data[idx] + greenFront.bitmap.data[idx + 1] + greenFront.bitmap.data[idx + 2]) / (3 * 255);
      greenFront.bitmap.data[idx] = Math.round(lum * 28);
      greenFront.bitmap.data[idx + 1] = Math.round(lum * 78);
      greenFront.bitmap.data[idx + 2] = Math.round(lum * 58);
    }
  });
  await greenFront.write(path.join(outDir, 'shirt-forest-front.png'));

  const greenSide = whiteSide.clone();
  greenSide.scan(0, 0, greenSide.bitmap.width, greenSide.bitmap.height, (x, y, idx) => {
    if (greenSide.bitmap.data[idx + 3] > 30 && y > greenSide.bitmap.height * 0.17) {
      const lum = (greenSide.bitmap.data[idx] + greenSide.bitmap.data[idx + 1] + greenSide.bitmap.data[idx + 2]) / (3 * 255);
      greenSide.bitmap.data[idx] = Math.round(lum * 28);
      greenSide.bitmap.data[idx + 1] = Math.round(lum * 78);
      greenSide.bitmap.data[idx + 2] = Math.round(lum * 58);
    }
  });
  await greenSide.write(path.join(outDir, 'shirt-forest-side.png'));

  // Stone Grey Front & Side
  console.log('Generating Stone Grey Front & Side...');
  const stoneFront = whiteFront.clone();
  stoneFront.scan(0, 0, stoneFront.bitmap.width, stoneFront.bitmap.height, (x, y, idx) => {
    if (stoneFront.bitmap.data[idx + 3] > 30 && y > stoneFront.bitmap.height * 0.17) {
      const lum = (stoneFront.bitmap.data[idx] + stoneFront.bitmap.data[idx + 1] + stoneFront.bitmap.data[idx + 2]) / (3 * 255);
      const val = Math.round(lum * 175);
      stoneFront.bitmap.data[idx] = val;
      stoneFront.bitmap.data[idx + 1] = val;
      stoneFront.bitmap.data[idx + 2] = val + 5;
    }
  });
  await stoneFront.write(path.join(outDir, 'shirt-stone-front.png'));

  const stoneSide = whiteSide.clone();
  stoneSide.scan(0, 0, stoneSide.bitmap.width, stoneSide.bitmap.height, (x, y, idx) => {
    if (stoneSide.bitmap.data[idx + 3] > 30 && y > stoneSide.bitmap.height * 0.17) {
      const lum = (stoneSide.bitmap.data[idx] + stoneSide.bitmap.data[idx + 1] + stoneSide.bitmap.data[idx + 2]) / (3 * 255);
      const val = Math.round(lum * 175);
      stoneSide.bitmap.data[idx] = val;
      stoneSide.bitmap.data[idx + 1] = val;
      stoneSide.bitmap.data[idx + 2] = val + 5;
    }
  });
  await stoneSide.write(path.join(outDir, 'shirt-stone-side.png'));

  // Charcoal Slate Front & Side
  console.log('Generating Charcoal Slate Front & Side...');
  const charcoalFront = whiteFront.clone();
  charcoalFront.scan(0, 0, charcoalFront.bitmap.width, charcoalFront.bitmap.height, (x, y, idx) => {
    if (charcoalFront.bitmap.data[idx + 3] > 30 && y > charcoalFront.bitmap.height * 0.17) {
      const lum = (charcoalFront.bitmap.data[idx] + charcoalFront.bitmap.data[idx + 1] + charcoalFront.bitmap.data[idx + 2]) / (3 * 255);
      charcoalFront.bitmap.data[idx] = Math.round(lum * 68);
      charcoalFront.bitmap.data[idx + 1] = Math.round(lum * 74);
      charcoalFront.bitmap.data[idx + 2] = Math.round(lum * 88);
    }
  });
  await charcoalFront.write(path.join(outDir, 'shirt-charcoal-front.png'));

  const charcoalSide = whiteSide.clone();
  charcoalSide.scan(0, 0, charcoalSide.bitmap.width, charcoalSide.bitmap.height, (x, y, idx) => {
    if (charcoalSide.bitmap.data[idx + 3] > 30 && y > charcoalSide.bitmap.height * 0.17) {
      const lum = (charcoalSide.bitmap.data[idx] + charcoalSide.bitmap.data[idx + 1] + charcoalSide.bitmap.data[idx + 2]) / (3 * 255);
      charcoalSide.bitmap.data[idx] = Math.round(lum * 68);
      charcoalSide.bitmap.data[idx + 1] = Math.round(lum * 74);
      charcoalSide.bitmap.data[idx + 2] = Math.round(lum * 88);
    }
  });
  await charcoalSide.write(path.join(outDir, 'shirt-charcoal-side.png'));

  console.log('Complete!');
}

run().catch(console.error);
