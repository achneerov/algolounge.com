#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Test conversion with single file
const testFile = '/Users/achneerov/d/algolounge.com/scripts/scraped/239-two-integer-sum?list=neetcode250.txt';
const testOutputDir = '/Users/achneerov/d/algolounge.com/scripts/test-output';

// Import all functions from the main conversion script
const conversionScript = fs.readFileSync('/Users/achneerov/d/algolounge.com/scripts/convert-scraped-to-json.js', 'utf8');

// Extract and execute the functions (we'll inline them for this test)
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

function generateHtmlDescription(title, mainDescription, examples, constraints) {
    let html = `<h2>${title}</h2>`;
    
    html += `<p>${mainDescription.replace(/\n/g, '</p><p>')}</p>`;
    
    if (examples.length > 0) {
        html += '<h3>Examples:</h3><ul>';
        examples.forEach(example => {
            html += '<li>';
            html += example.code.replace(/\n/g, '<br>');
            if (example.explanation) {
                html += `<br>${example.explanation}`;
            }
            html += '</li>';
        });
        html += '</ul>';
    }
    
    if (constraints) {
        html += '<h3>Constraints:</h3>';
        html += `<ul><li>${constraints.replace(/\n\*/g, '</li><li>').replace(/^\*/, '')}</li></ul>`;
    }
    
    return html;
}

function generateKeywords(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot', 'not', 'no', 'yes', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.has(word))
        .filter((word, index, arr) => arr.indexOf(word) === index)
        .slice(0, 10);
    
    return words;
}

function parseInputOutput(str) {
    try {
        str = str.trim();
        
        if (str.includes(',') && str.includes('=')) {
            const params = {};
            const parts = str.split(',');
            
            parts.forEach(part => {
                const [key, value] = part.split('=').map(s => s.trim());
                if (key && value) {
                    params[key] = parseValue(value);
                }
            });
            
            return params;
        }
        
        return parseValue(str);
    } catch (error) {
        return str;
    }
}

function parseValue(value) {
    value = value.trim();
    
    if (value.startsWith('[') && value.endsWith(']')) {
        try {
            return JSON.parse(value);
        } catch {
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
    
    if (!isNaN(value)) {
        return parseInt(value);
    }
    
    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
    }
    
    return value;
}

function generateTestCases(examples) {
    const testCases = [];
    let idCounter = 1;
    
    examples.forEach(example => {
        try {
            const lines = example.code.split('\n');
            let input = null;
            let output = null;
            
            lines.forEach(line => {
                if (line.includes('Input:')) {
                    const inputMatch = line.match(/Input:\s*(.*)/);
                    if (inputMatch) {
                        input = parseInputOutput(inputMatch[1]);
                    }
                }
                if (line.includes('Output:')) {
                    const outputMatch = line.match(/Output:\s*(.*)/);
                    if (outputMatch) {
                        output = parseInputOutput(outputMatch[1]);
                    }
                }
            });
            
            if (input && output !== null) {
                testCases.push({
                    id: idCounter++,
                    input: input,
                    output: output
                });
            }
        } catch (error) {
            console.warn('Could not parse example into test case:', error);
        }
    });
    
    return testCases;
}

function toCamelCase(title) {
    return title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
        .replace(/^(.)/, match => match.toLowerCase());
}

function generateLanguageCode(title, description, testCases) {
    const functionName = toCamelCase(title);
    let parameters = ['nums', 'target'];
    
    if (testCases.length > 0 && testCases[0].input && typeof testCases[0].input === 'object') {
        parameters = Object.keys(testCases[0].input);
    }
    
    const paramStr = parameters.join(', ');
    const paramStrTyped = parameters.map((param, i) => {
        if (param === 'nums') return `${param}: number[]`;
        if (param === 'target') return `${param}: number`;
        return `${param}: any`;
    }).join(', ');
    
    const javaParamStr = parameters.map((param, i) => {
        if (param === 'nums') return `int[] ${param}`;
        if (param === 'target') return `int ${param}`;
        return `Object ${param}`;
    }).join(', ');
    
    return {
        python: {
            template: `def ${functionName}(${paramStr}):\n    `,
            solution_text: "Use a hash map to store numbers we've seen and their indices. For each number, calculate its complement (target - current number) and check if it exists in our hash map. This achieves O(n) time complexity.",
            solution_code: `def ${functionName}(${paramStr}):\n    seen = {}\n    \n    for i, num in enumerate(nums):\n        complement = target - num\n        \n        if complement in seen:\n            return [seen[complement], i]\n        \n        seen[num] = i\n    \n    return []`
        },
        javascript: {
            template: `function ${functionName}(${paramStr}) {\n  \n}`,
            solution_text: "Use a Map to store numbers we've seen and their indices. For each number, calculate its complement (target - current number) and check if it exists in our map. This achieves O(n) time complexity.",
            solution_code: `function ${functionName}(${paramStr}) {\n    const seen = new Map();\n    \n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        \n        if (seen.has(complement)) {\n            return [seen.get(complement), i];\n        }\n        \n        seen.set(nums[i], i);\n    }\n    \n    return [];\n}`
        },
        typescript: {
            template: `function ${functionName}(${paramStrTyped}): number[] {\n  \n}`,
            solution_text: "Use a Map to store numbers we've seen and their indices. For each number, calculate its complement (target - current number) and check if it exists in our map. This achieves O(n) time complexity. TypeScript type annotations are automatically stripped during execution.",
            solution_code: `function ${functionName}(${paramStrTyped}): number[] {\n    const seen = new Map<number, number>();\n    \n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        \n        if (seen.has(complement)) {\n            return [seen.get(complement), i];\n        }\n        \n        seen.set(nums[i], i);\n    }\n    \n    return [];\n}`
        },
        java: {
            template: `class Solution {\n    public int[] ${functionName}(${javaParamStr}) {\n        \n    }\n}`,
            solution_text: "Use a HashMap to store numbers we've seen and their indices. For each number, calculate its complement (target - current number) and check if it exists in our HashMap. This achieves O(n) time complexity.",
            solution_code: `class Solution {\n    public int[] ${functionName}(${javaParamStr}) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        \n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            \n            if (seen.containsKey(complement)) {\n                return new int[]{seen.get(complement), i};\n            }\n            \n            seen.put(nums[i], i);\n        }\n        \n        return new int[]{};\n    }\n}`
        }
    };
}

// Test full conversion
console.log('Testing full conversion...');

const htmlContent = fs.readFileSync(testFile, 'utf8');
const { title, fullDescription } = extractProblemInfo(htmlContent);
const { mainDescription, examples, constraints } = parseDescription(fullDescription);
const htmlDescription = generateHtmlDescription(title, mainDescription, examples, constraints);
const keywords = generateKeywords(title, fullDescription);
const testCases = generateTestCases(examples);
const languages = generateLanguageCode(title, fullDescription, testCases);

const jsonData = {
    filename: "two-integer-sum",
    title: title,
    keywords: keywords,
    description: htmlDescription,
    languages: languages,
    order_matters: false,
    test_cases: testCases
};

const outputPath = path.join(testOutputDir, 'two-integer-sum.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

console.log('✓ Full conversion test completed!');
console.log('Generated JSON file:', outputPath);
console.log('Test cases generated:', testCases.length);
console.log('Keywords generated:', keywords.length);