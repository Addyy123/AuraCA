import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function main() {
  console.log('Creating a dummy image...');
  const buffer = await sharp({
    create: {
      width: 200,
      height: 50,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: Buffer.from('<svg><text x="10" y="30" font-size="24">Test Invoice 123</text></svg>'),
      blend: 'dest-over'
    }
  ])
  .png()
  .toBuffer();
  
  console.log('Image buffer created.');
  
  console.log('Creating worker...');
  try {
    const worker = await createWorker('eng');
    console.log('Worker created, recognizing...');
    const { data: { text } } = await worker.recognize(buffer);
    console.log('Text recognized:', text);
    await worker.terminate();
  } catch (e) {
    console.error('Error during OCR:', e);
  }
}

main();
