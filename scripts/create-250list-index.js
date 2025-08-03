#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const QUESTION_DIR = '/Users/achneerov/d/algolounge.com/public/250list';
const INDEX_PATH = path.join(QUESTION_DIR, 'index.json');

console.log('🔄 Creating 250list index...');

// Get all JSON files except index.json
const files = fs.readdirSync(QUESTION_DIR)
    .filter(file => file.endsWith('.json') && file !== 'index.json')
    .sort();

console.log(`📁 Found ${files.length} question files`);

const index = [];

files.forEach(file => {
    const filePath = path.join(QUESTION_DIR, file);
    
    try {
        const questionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const indexEntry = {
            filename: questionData.filename,
            title: questionData.title,
            keywords: questionData.keywords || [],
            testCasesCount: questionData.test_cases ? questionData.test_cases.length : 0
        };
        
        index.push(indexEntry);
        console.log(`✅ Processed: ${questionData.filename} - "${questionData.title}"`);
        
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

// Write the index file
const indexData = {
    questions: index,
    count: index.length,
    lastUpdated: new Date().toISOString()
};

fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2));

console.log(`🎉 Successfully created 250list index with ${index.length} questions`);
console.log(`📝 Index saved to: ${INDEX_PATH}`);
console.log(`⏰ Last updated: ${indexData.lastUpdated}`);