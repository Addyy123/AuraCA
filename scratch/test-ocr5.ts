import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function main() {
  const buffer = await sharp({
    create: {
      width: 400,
      height: 100,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
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
  
  const processedBuffer1 = await sharp(buffer)
    .grayscale()
    .normalize()
    .toBuffer();
    
  const processedBuffer2 = await sharp(buffer)
    .flatten({ background: '#ffffff' })
    .grayscale()
    .normalize()
    .toBuffer();
    
  const worker = await createWorker('eng');
  
  console.log('Testing processedBuffer1 (transparent)...');
  const res1 = await worker.recognize(processedBuffer1);
  console.log('Text 1:', res1.data.text.trim());
  
  console.log('Testing processedBuffer2 (flattened)...');
  const res2 = await worker.recognize(processedBuffer2);
  console.log('Text 2:', res2.data.text.trim());
  
  await worker.terminate();
}

main();
