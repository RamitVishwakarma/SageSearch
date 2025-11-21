const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '../data/texts');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(DATA_DIR, filename));
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(DATA_DIR, filename), () => {});
      reject(err);
    });
  });
};

const main = async () => {
  try {
    console.log('Starting downloads...');

    // 1. Bhagavad Gita (Project Gutenberg - Sir Edwin Arnold translation)
    // URL: https://www.gutenberg.org/cache/epub/2388/pg2388.txt
    await downloadFile('https://www.gutenberg.org/cache/epub/2388/pg2388.txt', 'bhagavad_gita.txt');

    // 2. Swami Vivekananda (Complete Works - Volume 1 - Karma Yoga)
    // Source: Wikisource or similar. Using a plain text mirror if available.
    // For now, we will download a specific lecture or volume available in text format.
    // Example: Karma Yoga from Gutenberg
    await downloadFile('https://www.gutenberg.org/cache/epub/2814/pg2814.txt', 'vivekananda_karma_yoga.txt');

    // 3. Dr. Kalam (Wings of Fire / Ignited Minds)
    // These are copyrighted and not typically in public domain like the others.
    // We will create a placeholder file and instruct the user.
    const kalamPath = path.join(DATA_DIR, 'kalam_wings_of_fire.txt');
    if (!fs.existsSync(kalamPath)) {
      fs.writeFileSync(kalamPath, 'PLACEHOLDER: Please paste the text content of "Wings of Fire" here.\n');
      console.log('Created placeholder for Kalam\'s work. Please populate data/texts/kalam_wings_of_fire.txt manually due to copyright.');
    }

    console.log('Download process completed.');

  } catch (error) {
    console.error('Error downloading files:', error);
  }
};

main();
