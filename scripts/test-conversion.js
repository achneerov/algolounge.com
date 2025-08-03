#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Test with one file
const testFile = '/Users/achneerov/d/algolounge.com/scripts/scraped/239-two-integer-sum?list=neetcode250.txt';
const outputFile = '/Users/achneerov/d/algolounge.com/scripts/test-output.json';

// Copy the conversion functions from the main script
function extractProblemInfo(htmlContent) {
    try {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        const titleMeta = document.querySelector('title');
        const title = titleMeta ? titleMeta.textContent.replace(' - NeetCode', '').trim() : '';
        
        const descriptionMeta = document.querySelector('meta[name="description"]');
        const fullDescription = descriptionMeta ? descriptionMeta.getAttribute('content') : '';
        
        return { title, fullDescription };
    } catch (error) {
        console.error('Error parsing HTML:', error);
        return { title: '', fullDescription: '' };
    }
}

function parseDescription(fullDescription) {
    try {
        let description = fullDescription
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"');

        const exampleMatch = description.match(/^(.*?)(?:\*\*Example 1:\*\*|$)/s);
        const mainDescription = exampleMatch ? exampleMatch[1].trim() : description;

        const examples = [];
        const exampleRegex = /\*\*Example (\d+):\*\*\s*```(?:java|python|javascript)?\s*([\s\S]*?)```(?:\s*Explanation:?\s*(.*?)(?=\*\*Example|\*\*Constraints|$))?/gs;
        let exampleMatch2;
        
        while ((exampleMatch2 = exampleRegex.exec(description)) !== null) {
            const exampleNum = exampleMatch2[1];
            const code = exampleMatch2[2].trim();
            const explanation = exampleMatch2[3] ? exampleMatch2[3].trim() : '';
            
            examples.push({
                number: parseInt(exampleNum),
                code: code,
                explanation: explanation
            });
        }

        const constraintsMatch = description.match(/\*\*Constraints:\*\*\s*(.*?)(?:\n\n|$)/s);
        const constraints = constraintsMatch ? constraintsMatch[1].trim() : '';

        return {
            mainDescription,
            examples,
            constraints
        };
    } catch (error) {
        console.error('Error parsing description:', error);
        return {
            mainDescription: fullDescription,
            examples: [],
            constraints: ''
        };
    }
}

// Test the conversion
console.log('Testing conversion...');

const htmlContent = fs.readFileSync(testFile, 'utf8');
const { title, fullDescription } = extractProblemInfo(htmlContent);
const { mainDescription, examples, constraints } = parseDescription(fullDescription);

console.log('Title:', title);
console.log('Main Description:', mainDescription);
console.log('Examples:', examples.length);
examples.forEach((ex, i) => {
    console.log(`Example ${i + 1}:`, ex.code.substring(0, 100) + '...');
});
console.log('Constraints:', constraints.substring(0, 100) + '...');

// Save parsed data for inspection
const testOutput = {
    title,
    mainDescription,
    examples,
    constraints,
    fullDescription: fullDescription.substring(0, 500) + '...'
};

fs.writeFileSync(outputFile, JSON.stringify(testOutput, null, 2));
console.log(`Test output saved to: ${outputFile}`);