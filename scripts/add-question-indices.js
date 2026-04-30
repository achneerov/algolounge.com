#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, '../public/questions');

function addQuestionIndices() {
  console.log('🔄 Adding unique indices to all questions...');

  try {
    // Read all files in questions directory
    const files = fs.readdirSync(QUESTIONS_DIR);
    const questionFiles = files.filter(file =>
      file.endsWith('.json') && file !== 'index.json'
    );

    // Sort alphabetically for consistent ordering
    questionFiles.sort();

    console.log(`📁 Found ${questionFiles.length} question files`);

    let updatedCount = 0;
    let skippedCount = 0;

    questionFiles.forEach((file, index) => {
      const filePath = path.join(QUESTIONS_DIR, file);
      const uniqueIndex = index + 1; // Start from 1

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const questionData = JSON.parse(content);

        // Check if index already exists
        if (questionData.index !== undefined) {
          console.log(`⏭️  Skipped: ${file} (already has index: ${questionData.index})`);
          skippedCount++;
          return;
        }

        // Add index as the first property
        const updatedData = {
          index: uniqueIndex,
          ...questionData
        };

        // Write back to file with proper formatting
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2) + '\n');

        console.log(`✅ Added index ${uniqueIndex} to: ${file}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    });

    console.log(`\n🎉 Completed!`);
    console.log(`   Updated: ${updatedCount} files`);
    console.log(`   Skipped: ${skippedCount} files`);
    console.log(`   Total: ${questionFiles.length} files`);

  } catch (error) {
    console.error('💥 Error adding indices:', error.message);
    process.exit(1);
  }
}

// Run the script
addQuestionIndices();
