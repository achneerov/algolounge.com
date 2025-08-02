#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, '../public/questions');
const COURSES_DIR = path.join(__dirname, '../public/courses');
const QUESTIONS_INDEX_FILE = path.join(QUESTIONS_DIR, 'index.json');
const COURSES_INDEX_FILE = path.join(COURSES_DIR, 'index.json');


function syncQuestionsIndex() {
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
        const title = questionData.title || 'Untitled Question';
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
    fs.writeFileSync(QUESTIONS_INDEX_FILE, JSON.stringify(index, null, 2));
    
    console.log(`\n🎉 Successfully synced questions index with ${questions.length} questions`);
    console.log(`📝 Index saved to: ${QUESTIONS_INDEX_FILE}`);
    console.log(`⏰ Last updated: ${index.lastUpdated}`);
    
  } catch (error) {
    console.error('💥 Error syncing index:', error.message);
    process.exit(1);
  }
}

function syncCoursesIndex() {
  console.log('\n🔄 Syncing courses index...');
  
  try {
    // Read all files in courses directory
    const files = fs.readdirSync(COURSES_DIR);
    const courseFiles = files.filter(file => 
      file.endsWith('.json') && file !== 'index.json'
    );
    
    console.log(`📁 Found ${courseFiles.length} course files`);
    
    const courses = [];
    
    for (const file of courseFiles) {
      const filePath = path.join(COURSES_DIR, file);
      const filename = path.basename(file, '.json');
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const courseData = JSON.parse(content);
        
        // Extract title and keywords
        const title = courseData.course_name || 'Untitled Course';
        const keywords = courseData.keywords || [];
        
        courses.push({
          filename: filename,
          title: title,
          keywords: keywords
        });
        
        console.log(`✅ Processed: ${filename} - "${title}"`);
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
    
    // Sort courses by filename for consistency
    courses.sort((a, b) => a.filename.localeCompare(b.filename));
    
    // Create index object
    const index = {
      courses: courses,
      lastUpdated: new Date().toISOString(),
      totalCourses: courses.length
    };
    
    // Write index file
    fs.writeFileSync(COURSES_INDEX_FILE, JSON.stringify(index, null, 2));
    
    console.log(`\n🎉 Successfully synced courses index with ${courses.length} courses`);
    console.log(`📝 Index saved to: ${COURSES_INDEX_FILE}`);
    console.log(`⏰ Last updated: ${index.lastUpdated}`);
    
  } catch (error) {
    console.error('💥 Error syncing courses index:', error.message);
    process.exit(1);
  }
}

function syncAllIndexes() {
  console.log('🚀 Starting sync of all indexes...');
  syncQuestionsIndex();
  syncCoursesIndex();
  console.log('\n✨ All indexes synced successfully!');
}

// Run the sync
syncAllIndexes();