#!/usr/bin/env node

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Test parsing on the Two Sum file
const testFile = '/Users/achneerov/d/algolounge.com/scripts/scraped/239-two-integer-sum?list=neetcode250.txt';

function parseInputOutput(str) {
    console.log('Parsing input/output:', JSON.stringify(str));
    
    try {
        str = str.trim();
        
        // Handle multiple parameters (e.g., "nums = [1,2,3], target = 6")
        if (str.includes('=')) {
            const params = {};
            
            // More robust parsing for parameters with arrays
            const paramRegex = /(\w+)\s*=\s*(\[[^\]]*\]|\S+)/g;
            let match;
            
            while ((match = paramRegex.exec(str)) !== null) {
                const key = match[1];
                const value = match[2];
                console.log(`Found param: ${key} = ${value}`);
                params[key] = parseValue(value);
            }
            
            // If we found parameters, return them
            if (Object.keys(params).length > 0) {
                return params;
            }
        }
        
        // Handle single array or value
        return parseValue(str);
    } catch (error) {
        console.warn('Error parsing input/output:', error, 'for string:', str);
        return str; // Return as string if parsing fails
    }
}

function parseValue(value) {
    console.log('Parsing value:', JSON.stringify(value));
    value = value.trim();
    
    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
        try {
            const result = JSON.parse(value);
            console.log('JSON parsed result:', result);
            return result;
        } catch {
            console.log('JSON parse failed, trying fallback');
            // Fallback parsing for malformed arrays
            const content = value.slice(1, -1);
            if (content.trim() === '') return [];
            return content.split(',').map(item => {
                item = item.trim();
                if (!isNaN(item)) return parseInt(item);
                if (item.startsWith('"') && item.endsWith('"')) return item.slice(1, -1);
                return item;
            });
        }
    }
    
    // Handle numbers
    if (!isNaN(value)) {
        return parseInt(value);
    }
    
    // Handle strings
    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
    }
    
    return value;
}

// Read and parse the HTML
const htmlContent = fs.readFileSync(testFile, 'utf8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

const descriptionMeta = document.querySelector('meta[name="description"]');
const fullDescription = descriptionMeta ? descriptionMeta.getAttribute('content') : '';

// Extract examples
const examples = [];
const exampleRegex = /\*\*Example (\d+):\*\*\s*```(?:java|python|javascript)?\s*([\s\S]*?)```(?:\s*Explanation:?\s*(.*?)(?=\*\*Example|\*\*Constraints|$))?/gs;
let exampleMatch;

while ((exampleMatch = exampleRegex.exec(fullDescription)) !== null) {
    const exampleNum = exampleMatch[1];
    const code = exampleMatch[2].trim();
    const explanation = exampleMatch[3] ? exampleMatch[3].trim() : '';
    
    examples.push({
        number: parseInt(exampleNum),
        code: code,
        explanation: explanation
    });
}

console.log('Found examples:', examples.length);

examples.forEach((example, i) => {
    console.log(`\n--- Example ${i + 1} ---`);
    console.log('Code:');
    console.log(example.code);
    
    // Try to extract input and output
    const lines = example.code.split('\n');
    
    for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim();
        
        if (line.startsWith('Input:')) {
            let inputSection = line.replace('Input:', '').trim();
            // Check if input continues on next lines
            for (let k = j + 1; k < lines.length && !lines[k].includes('Output:'); k++) {
                inputSection += ' ' + lines[k].trim();
            }
            console.log('Raw input section:');
            console.log(JSON.stringify(inputSection));
            
            const parsedInput = parseInputOutput(inputSection);
            console.log('Parsed input:', parsedInput);
        }
        
        if (line.startsWith('Output:')) {
            const outputSection = line.replace('Output:', '').trim();
            console.log('Raw output section:');
            console.log(JSON.stringify(outputSection));
            
            const parsedOutput = parseInputOutput(outputSection);
            console.log('Parsed output:', parsedOutput);
        }
    }
});

console.log('\nDone debugging.');