#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Path configurations
const SCRAPED_DIR = '/Users/achneerov/d/algolounge.com/scripts/scraped';
const OUTPUT_DIR = '/Users/achneerov/d/algolounge.com/public/250list';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Extracts problem information from HTML meta description
 */
function extractProblemInfo(htmlContent) {
    try {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        // Extract title from meta tag
        const titleMeta = document.querySelector('title');
        const title = titleMeta ? titleMeta.textContent.replace(' - NeetCode', '').trim() : '';
        
        // Extract description from meta description
        const descriptionMeta = document.querySelector('meta[name="description"]');
        const fullDescription = descriptionMeta ? descriptionMeta.getAttribute('content') : '';
        
        return { title, fullDescription };
    } catch (error) {
        console.error('Error parsing HTML:', error);
        return { title: '', fullDescription: '' };
    }
}

/**
 * Parses the problem description to extract examples and constraints
 */
function parseDescription(fullDescription) {
    try {
        // Clean up HTML entities
        let description = fullDescription
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"');

        // Extract main problem description (everything before "**Example 1:**")
        const exampleMatch = description.match(/^(.*?)(?:\*\*Example 1:\*\*|$)/s);
        const mainDescription = exampleMatch ? exampleMatch[1].trim() : description;

        // Extract examples
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

        // Extract constraints
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

/**
 * Generates HTML formatted description
 */
function generateHtmlDescription(title, mainDescription, examples, constraints) {
    let html = `<h2>${title}</h2>`;
    
    // Add main description
    html += `<p>${mainDescription.replace(/\n/g, '</p><p>')}</p>`;
    
    // Add examples
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
    
    // Add constraints
    if (constraints) {
        html += '<h3>Constraints:</h3>';
        html += `<ul><li>${constraints.replace(/\n\*/g, '</li><li>').replace(/^\*/, '')}</li></ul>`;
    }
    
    return html;
}

/**
 * Generates keywords from title and description
 */
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

/**
 * Generates test cases from examples
 */
function generateTestCases(examples) {
    const testCases = [];
    let idCounter = 1;
    
    examples.forEach(example => {
        try {
            const codeText = example.code;
            let inputSection = '';
            let outputSection = '';
            
            // Extract input and output sections from multi-line examples
            const lines = codeText.split('\n');
            let currentSection = '';
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.startsWith('Input:')) {
                    currentSection = 'input';
                    inputSection = line.replace('Input:', '').trim();
                    // Check if input continues on next lines
                    for (let j = i + 1; j < lines.length && !lines[j].includes('Output:'); j++) {
                        inputSection += ' ' + lines[j].trim();
                    }
                } else if (line.startsWith('Output:')) {
                    currentSection = 'output';
                    outputSection = line.replace('Output:', '').trim();
                    // Output is usually single line, but check for continuation
                    for (let j = i + 1; j < lines.length && lines[j].trim() && !lines[j + 1]?.includes('Input:'); j++) {
                        if (!lines[j].includes('Explanation')) break;
                    }
                }
            }
            
            if (inputSection && outputSection) {
                const input = parseInputOutput(inputSection);
                const output = parseInputOutput(outputSection);
                
                if (input && output !== null) {
                    testCases.push({
                        id: idCounter++,
                        input: input,
                        output: output
                    });
                }
            }
        } catch (error) {
            console.warn('Could not parse example into test case:', error);
        }
    });
    
    return testCases;
}

/**
 * Parses input/output strings into proper data structures
 */
function parseInputOutput(str) {
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

/**
 * Parses a single value (array, number, string, etc.)
 */
function parseValue(value) {
    value = value.trim();
    
    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
        try {
            return JSON.parse(value);
        } catch {
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

/**
 * Generates language-specific templates and solutions
 */
function generateLanguageCode(title, description, testCases) {
    const languages = {
        python: generatePythonCode(title, description, testCases),
        javascript: generateJavaScriptCode(title, description, testCases),
        typescript: generateTypeScriptCode(title, description, testCases),
        java: generateJavaCode(title, description, testCases)
    };
    
    return languages;
}

/**
 * Generates Python code templates and solutions
 */
function generatePythonCode(title, description, testCases) {
    // Determine function signature from test cases
    let functionName = toCamelCase(title);
    let parameters = [];
    
    if (testCases.length > 0 && testCases[0].input && typeof testCases[0].input === 'object') {
        parameters = Object.keys(testCases[0].input);
    } else {
        // Default parameters based on common patterns
        if (title.toLowerCase().includes('sum') || title.toLowerCase().includes('target')) {
            parameters = ['nums', 'target'];
        } else if (title.toLowerCase().includes('array')) {
            parameters = ['nums'];
        } else {
            parameters = ['input'];
        }
    }
    
    const paramStr = parameters.join(', ');
    const template = `def ${functionName}(${paramStr}):\n    `;
    
    // Generate basic solution structure
    let solutionCode = `def ${functionName}(${paramStr}):\n`;
    solutionCode += '    # TODO: Implement solution\n';
    solutionCode += '    pass';
    
    const solutionText = "This problem requires implementing an efficient algorithm. Analyze the constraints and examples to determine the optimal approach. Consider time and space complexity trade-offs.";
    
    return {
        template,
        solution_text: solutionText,
        solution_code: solutionCode
    };
}

/**
 * Generates JavaScript code templates and solutions
 */
function generateJavaScriptCode(title, description, testCases) {
    let functionName = toCamelCase(title);
    let parameters = [];
    
    if (testCases.length > 0 && testCases[0].input && typeof testCases[0].input === 'object') {
        parameters = Object.keys(testCases[0].input);
    } else {
        if (title.toLowerCase().includes('sum') || title.toLowerCase().includes('target')) {
            parameters = ['nums', 'target'];
        } else if (title.toLowerCase().includes('array')) {
            parameters = ['nums'];
        } else {
            parameters = ['input'];
        }
    }
    
    const paramStr = parameters.join(', ');
    const template = `function ${functionName}(${paramStr}) {\n  \n}`;
    
    let solutionCode = `function ${functionName}(${paramStr}) {\n`;
    solutionCode += '    // TODO: Implement solution\n';
    solutionCode += '    return null;\n';
    solutionCode += '}';
    
    const solutionText = "This problem requires implementing an efficient algorithm. Analyze the constraints and examples to determine the optimal approach. Consider time and space complexity trade-offs.";
    
    return {
        template,
        solution_text: solutionText,
        solution_code: solutionCode
    };
}

/**
 * Generates TypeScript code templates and solutions
 */
function generateTypeScriptCode(title, description, testCases) {
    let functionName = toCamelCase(title);
    let parameters = [];
    let types = [];
    
    if (testCases.length > 0 && testCases[0].input && typeof testCases[0].input === 'object') {
        parameters = Object.keys(testCases[0].input);
        types = parameters.map(param => {
            const value = testCases[0].input[param];
            if (Array.isArray(value)) return 'number[]';
            if (typeof value === 'number') return 'number';
            if (typeof value === 'string') return 'string';
            return 'any';
        });
    } else {
        if (title.toLowerCase().includes('sum') || title.toLowerCase().includes('target')) {
            parameters = ['nums', 'target'];
            types = ['number[]', 'number'];
        } else if (title.toLowerCase().includes('array')) {
            parameters = ['nums'];
            types = ['number[]'];
        } else {
            parameters = ['input'];
            types = ['any'];
        }
    }
    
    const paramStr = parameters.map((param, i) => `${param}: ${types[i]}`).join(', ');
    
    // Determine return type
    let returnType = 'any';
    if (testCases.length > 0 && testCases[0].output !== undefined) {
        const output = testCases[0].output;
        if (Array.isArray(output)) returnType = 'number[]';
        else if (typeof output === 'number') returnType = 'number';
        else if (typeof output === 'string') returnType = 'string';
        else if (typeof output === 'boolean') returnType = 'boolean';
    }
    
    const template = `function ${functionName}(${paramStr}): ${returnType} {\n  \n}`;
    
    let solutionCode = `function ${functionName}(${paramStr}): ${returnType} {\n`;
    solutionCode += '    // TODO: Implement solution\n';
    solutionCode += '    return null as any;\n';
    solutionCode += '}';
    
    const solutionText = "This problem requires implementing an efficient algorithm. Analyze the constraints and examples to determine the optimal approach. Consider time and space complexity trade-offs. Note: TypeScript type annotations are automatically stripped during execution.";
    
    return {
        template,
        solution_text: solutionText,
        solution_code: solutionCode
    };
}

/**
 * Generates Java code templates and solutions
 */
function generateJavaCode(title, description, testCases) {
    let methodName = toCamelCase(title);
    let parameters = [];
    let types = [];
    
    if (testCases.length > 0 && testCases[0].input && typeof testCases[0].input === 'object') {
        parameters = Object.keys(testCases[0].input);
        types = parameters.map(param => {
            const value = testCases[0].input[param];
            if (Array.isArray(value)) return 'int[]';
            if (typeof value === 'number') return 'int';
            if (typeof value === 'string') return 'String';
            return 'Object';
        });
    } else {
        if (title.toLowerCase().includes('sum') || title.toLowerCase().includes('target')) {
            parameters = ['nums', 'target'];
            types = ['int[]', 'int'];
        } else if (title.toLowerCase().includes('array')) {
            parameters = ['nums'];
            types = ['int[]'];
        } else {
            parameters = ['input'];
            types = ['Object'];
        }
    }
    
    const paramStr = parameters.map((param, i) => `${types[i]} ${param}`).join(', ');
    
    // Determine return type
    let returnType = 'Object';
    if (testCases.length > 0 && testCases[0].output !== undefined) {
        const output = testCases[0].output;
        if (Array.isArray(output)) returnType = 'int[]';
        else if (typeof output === 'number') returnType = 'int';
        else if (typeof output === 'string') returnType = 'String';
        else if (typeof output === 'boolean') returnType = 'boolean';
    }
    
    const template = `class Solution {\n    public ${returnType} ${methodName}(${paramStr}) {\n        \n    }\n}`;
    
    let solutionCode = `class Solution {\n    public ${returnType} ${methodName}(${paramStr}) {\n`;
    solutionCode += '        // TODO: Implement solution\n';
    solutionCode += '        return null;\n';
    solutionCode += '    }\n}';
    
    const solutionText = "This problem requires implementing an efficient algorithm. Analyze the constraints and examples to determine the optimal approach. Consider time and space complexity trade-offs.";
    
    return {
        template,
        solution_text: solutionText,
        solution_code: solutionCode
    };
}

/**
 * Converts title to camelCase function name
 */
function toCamelCase(title) {
    return title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
        .replace(/^(.)/, match => match.toLowerCase());
}

/**
 * Converts filename to readable filename
 */
function generateFilename(originalFilename) {
    // Remove number prefix and query parameters
    let filename = originalFilename.replace(/^\d+-/, '').replace(/\?.*$/, '');
    
    // Convert to kebab-case if not already
    filename = filename.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
    
    return filename;
}

/**
 * Main conversion function
 */
function convertHtmlToJson(htmlFilePath) {
    try {
        console.log(`Processing: ${path.basename(htmlFilePath)}`);
        
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        const { title, fullDescription } = extractProblemInfo(htmlContent);
        
        if (!title || !fullDescription) {
            console.warn(`Skipping ${htmlFilePath}: Could not extract title or description`);
            return;
        }
        
        const { mainDescription, examples, constraints } = parseDescription(fullDescription);
        const htmlDescription = generateHtmlDescription(title, mainDescription, examples, constraints);
        const keywords = generateKeywords(title, fullDescription);
        const testCases = generateTestCases(examples);
        const languages = generateLanguageCode(title, fullDescription, testCases);
        const filename = generateFilename(path.basename(htmlFilePath, '.txt'));
        
        const jsonData = {
            filename: filename,
            title: title,
            keywords: keywords,
            description: htmlDescription,
            languages: languages,
            order_matters: false, // Default value, can be updated manually if needed
            test_cases: testCases
        };
        
        // Write JSON file
        const outputPath = path.join(OUTPUT_DIR, `${filename}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
        
        console.log(`✓ Created: ${outputPath}`);
        
    } catch (error) {
        console.error(`Error processing ${htmlFilePath}:`, error);
    }
}

/**
 * Main execution function
 */
function main() {
    console.log('Starting conversion of scraped HTML files to JSON...\n');
    
    // Get all HTML files from scraped directory
    const files = fs.readdirSync(SCRAPED_DIR)
        .filter(file => file.endsWith('.txt'))
        .sort();
    
    console.log(`Found ${files.length} files to process\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    files.forEach(file => {
        try {
            convertHtmlToJson(path.join(SCRAPED_DIR, file));
            successCount++;
        } catch (error) {
            console.error(`Failed to process ${file}:`, error);
            errorCount++;
        }
    });
    
    console.log(`\nConversion complete!`);
    console.log(`Successfully converted: ${successCount} files`);
    console.log(`Errors: ${errorCount} files`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
}

// Run the script
if (require.main === module) {
    main();
}