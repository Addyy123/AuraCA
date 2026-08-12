import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';

async function processImage(buffer: Buffer): Promise<string> {
  const processedBuffer = await sharp(buffer)
    .grayscale()
    .normalize()
    .png() // adding .png() to ensure format
    .toBuffer();

  const worker = await createWorker('eng');
  
  try {
    const { data: { text } } = await worker.recognize(processedBuffer);
    return text;
  } finally {
    await worker.terminate();
  }
}

async function main() {
  console.log('Downloading a dummy invoice image...');
  const res = await fetch('https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/eng.traineddata');
  // Actually let's just make a very simple clear image
  const buffer = await sharp({
    create: {
      width: 400,
      height: 100,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: Buffer.from('<svg width="400" height="100"><text x="10" y="50" font-family="Arial" font-size="40" fill="black">Hello World</text></svg>'),
      blend: 'over'
    }
  ])
  .png()
  .toBuffer();
  
  fs.writeFileSync('test-image.png', buffer);
  console.log('Test image saved to test-image.png');
  
  console.log('Running processImage...');
  const text = await processImage(buffer);
  console.log('Recognized text:', text);
}

main();
