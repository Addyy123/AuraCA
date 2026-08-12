import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function main() {
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
  
  // What index.ts does:
  const processedBuffer1 = await sharp(buffer)
    .grayscale()
    .normalize()
    .toBuffer();
    
  // What might fix it:
  const processedBuffer2 = await sharp(buffer)
    .grayscale()
    .normalize()
    .png()
    .toBuffer();
    
  const worker = await createWorker('eng');
  
  console.log('Testing processedBuffer1 (no .png())...');
  const res1 = await worker.recognize(processedBuffer1);
  console.log('Text 1:', res1.data.text.trim());
  
  console.log('Testing processedBuffer2 (with .png())...');
  const res2 = await worker.recognize(processedBuffer2);
  console.log('Text 2:', res2.data.text.trim());
  
  await worker.terminate();
}

main();
