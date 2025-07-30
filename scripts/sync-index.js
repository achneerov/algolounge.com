#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, '../public/questions');
const INDEX_FILE = path.join(QUESTIONS_DIR, 'index.json');

function extractTitleFromHTML(html) {
  // Extract title from <h2> tag in description
  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
  if (h2Match) {
    return h2Match[1].trim();
  }
  
  // Fallback: try to extract from first heading
  const headingMatch = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  return 'Untitled Question';
}

function syncIndex() {
  console.log('🔄 Syncing questions index...');
  
  try {
    // Read all files in questions directory
    const files = fs.readdirSync(QUESTIONS_DIR);
    const questionFiles = files.filter(file => 
      file.endsWith('.json') && file !== 'index.json'
    );
    
    console.log(`📁 Found ${questionFiles.length} question files`);
    
    const questions = [];
    
    for (const file of questionFiles) {
      const filePath = path.join(QUESTIONS_DIR, file);
      const filename = path.basename(file, '.json');
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const questionData = JSON.parse(content);
        
        // Extract title and keywords
        const title = questionData.title || extractTitleFromHTML(questionData.description || '');
        const keywords = questionData.keywords || [];
        
        questions.push({
          filename: filename,
          title: title,
          keywords: keywords
        });
        
        console.log(`✅ Processed: ${filename} - "${title}"`);
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
    
    // Sort questions by filename for consistency
    questions.sort((a, b) => a.filename.localeCompare(b.filename));
    
    // Create index object
    const index = {
      questions: questions,
      lastUpdated: new Date().toISOString(),
      totalQuestions: questions.length
    };
    
    // Write index file
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    
    console.log(`\n🎉 Successfully synced index with ${questions.length} questions`);
    console.log(`📝 Index saved to: ${INDEX_FILE}`);
    console.log(`⏰ Last updated: ${index.lastUpdated}`);
    
  } catch (error) {
    console.error('💥 Error syncing index:', error.message);
    process.exit(1);
  }
}

// Run the sync
syncIndex();