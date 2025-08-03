#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/Users/achneerov/d/algolounge.com/public/250list';

function validateJsonFile(filePath) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const issues = [];
        
        // Check required fields
        if (!data.filename) issues.push('Missing filename');
        if (!data.title) issues.push('Missing title');
        if (!data.keywords || !Array.isArray(data.keywords)) issues.push('Missing or invalid keywords');
        if (!data.description) issues.push('Missing description');
        if (!data.languages) issues.push('Missing languages');
        if (data.order_matters === undefined) issues.push('Missing order_matters');
        if (!data.test_cases || !Array.isArray(data.test_cases)) issues.push('Missing or invalid test_cases');
        
        // Check languages
        const requiredLanguages = ['python', 'javascript', 'typescript', 'java'];
        requiredLanguages.forEach(lang => {
            if (!data.languages[lang]) {
                issues.push(`Missing ${lang} language`);
            } else {
                const langData = data.languages[lang];
                if (!langData.template) issues.push(`Missing ${lang} template`);
                if (!langData.solution_text) issues.push(`Missing ${lang} solution_text`);
                if (!langData.solution_code) issues.push(`Missing ${lang} solution_code`);
            }
        });
        
        // Check test cases
        data.test_cases.forEach((testCase, i) => {
            if (!testCase.id) issues.push(`Test case ${i + 1} missing id`);
            if (!testCase.input) issues.push(`Test case ${i + 1} missing input`);
            if (testCase.output === undefined) issues.push(`Test case ${i + 1} missing output`);
        });
        
        return {
            valid: issues.length === 0,
            issues: issues,
            testCasesCount: data.test_cases.length,
            keywordsCount: data.keywords.length
        };
        
    } catch (error) {
        return {
            valid: false,
            issues: [`JSON parse error: ${error.message}`],
            testCasesCount: 0,
            keywordsCount: 0
        };
    }
}

// Get all JSON files
const files = fs.readdirSync(OUTPUT_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();

console.log(`Validating ${files.length} JSON files...\n`);

let validCount = 0;
let totalTestCases = 0;
let totalKeywords = 0;
const problematicFiles = [];

files.forEach((file, index) => {
    const filePath = path.join(OUTPUT_DIR, file);
    const result = validateJsonFile(filePath);
    
    if (result.valid) {
        validCount++;
        totalTestCases += result.testCasesCount;
        totalKeywords += result.keywordsCount;
        
        if (index < 5 || index % 50 === 0) {
            console.log(`✓ ${file} - ${result.testCasesCount} test cases, ${result.keywordsCount} keywords`);
        }
    } else {
        problematicFiles.push({ file, issues: result.issues });
        console.log(`✗ ${file}`);
        result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
});

console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Total files: ${files.length}`);
console.log(`Valid files: ${validCount}`);
console.log(`Invalid files: ${files.length - validCount}`);
console.log(`Total test cases: ${totalTestCases}`);
console.log(`Average test cases per file: ${(totalTestCases / files.length).toFixed(2)}`);
console.log(`Total keywords: ${totalKeywords}`);
console.log(`Average keywords per file: ${(totalKeywords / files.length).toFixed(2)}`);

if (problematicFiles.length > 0) {
    console.log(`\n=== PROBLEMATIC FILES ===`);
    problematicFiles.forEach(({ file, issues }) => {
        console.log(`${file}:`);
        issues.forEach(issue => console.log(`  - ${issue}`));
    });
} else {
    console.log(`\n🎉 All files are valid!`);
}