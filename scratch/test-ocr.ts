import { createWorker } from 'tesseract.js';

async function main() {
  console.log('Creating worker...');
  try {
    const worker = await createWorker('eng');
    console.log('Worker created.');
    await worker.terminate();
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
