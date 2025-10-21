const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeUrls() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null
  });
  
  try {
    // Wipe and recreate scraped directory
    const scrapedDir = 'scripts/scraped';
    if (fs.existsSync(scrapedDir)) {
      fs.rmSync(scrapedDir, { recursive: true, force: true });
      console.log('Wiped existing scripts/scraped/ directory');
    }
    fs.mkdirSync(scrapedDir, { recursive: true });
    console.log('Created scripts/scraped/ directory');
    
    // Read URLs
    const urls = fs.readFileSync('scripts/url.txt', 'utf8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('http'));
    
    console.log(`Found ${urls.length} URLs`);
    
    const page = await browser.newPage();
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`${i + 1}/${urls.length}: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        
        // Get ALL the HTML
        const html = await page.content();
        console.log(`  Got ${html.length} characters of HTML`);
        
        // Extract problem name from URL for filename
        const problemName = url.split('/problems/')[1]?.replace(/\/$/, '') || `problem-${i + 1}`;
        const filename = `${String(i + 1).padStart(3, '0')}-${problemName}.txt`;
        const filepath = path.join(scrapedDir, filename);
        
        // Save individual file
        const content = `URL: ${url}\nProblem: ${problemName}\n\n${html}`;
        fs.writeFileSync(filepath, content);
        console.log(`  Saved: ${filename}`);
        
      } catch (error) {
        console.log(`Error on ${url}: ${error.message}`);
        
        // Save error file too
        const problemName = url.split('/problems/')[1]?.replace(/\/$/, '') || `problem-${i + 1}`;
        const filename = `${String(i + 1).padStart(3, '0')}-${problemName}-ERROR.txt`;
        const filepath = path.join(scrapedDir, filename);
        fs.writeFileSync(filepath, `URL: ${url}\nERROR: ${error.message}`);
      }
    }
    
    console.log('All done! Check scripts/scraped/ directory for individual files');
    
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await browser.close();
  }
}

scrapeUrls();