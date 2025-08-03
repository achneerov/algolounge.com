#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/Users/achneerov/d/algolounge.com/public/250list';

function toCamelCase(title) {
    let name = title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
        .replace(/^(.)/, match => match.toLowerCase());
    
    // If name starts with a number, prefix with a letter
    if (/^\d/.test(name)) {
        name = 'solve' + name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    return name;
}

function fixJavaScriptFunction(title, template, solutionCode) {
    const newFunctionName = toCamelCase(title);
    const oldFunctionName = template.match(/function\s+(\w+)/)?.[1];
    
    if (oldFunctionName && oldFunctionName !== newFunctionName) {
        return {
            template: template.replace(oldFunctionName, newFunctionName),
            solutionCode: solutionCode.replace(new RegExp(oldFunctionName, 'g'), newFunctionName)
        };
    }
    
    return { template, solutionCode };
}

function fixPythonFunction(title, template, solutionCode) {
    const newFunctionName = toCamelCase(title);
    const oldFunctionName = template.match(/def\s+(\w+)/)?.[1];
    
    if (oldFunctionName && oldFunctionName !== newFunctionName) {
        return {
            template: template.replace(oldFunctionName, newFunctionName),
            solutionCode: solutionCode.replace(new RegExp(oldFunctionName, 'g'), newFunctionName)
        };
    }
    
    return { template, solutionCode };
}

function fixJavaFunction(title, template, solutionCode) {
    const newFunctionName = toCamelCase(title);
    const oldFunctionNameMatch = template.match(/public\s+\w+\[\]?\s+(\w+)/);
    const oldFunctionName = oldFunctionNameMatch?.[1];
    
    if (oldFunctionName && oldFunctionName !== newFunctionName) {
        return {
            template: template.replace(new RegExp(oldFunctionName, 'g'), newFunctionName),
            solutionCode: solutionCode.replace(new RegExp(oldFunctionName, 'g'), newFunctionName)
        };
    }
    
    return { template, solutionCode };
}

// Get all JSON files
const files = fs.readdirSync(OUTPUT_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();

console.log(`Found ${files.length} JSON files to fix`);

let fixedCount = 0;

files.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file);
    
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let modified = false;
        
        // Fix Python
        if (data.languages.python) {
            const fixed = fixPythonFunction(data.title, data.languages.python.template, data.languages.python.solution_code);
            if (fixed.template !== data.languages.python.template || fixed.solutionCode !== data.languages.python.solution_code) {
                data.languages.python.template = fixed.template;
                data.languages.python.solution_code = fixed.solutionCode;
                modified = true;
            }
        }
        
        // Fix JavaScript
        if (data.languages.javascript) {
            const fixed = fixJavaScriptFunction(data.title, data.languages.javascript.template, data.languages.javascript.solution_code);
            if (fixed.template !== data.languages.javascript.template || fixed.solutionCode !== data.languages.javascript.solution_code) {
                data.languages.javascript.template = fixed.template;
                data.languages.javascript.solution_code = fixed.solutionCode;
                modified = true;
            }
        }
        
        // Fix TypeScript
        if (data.languages.typescript) {
            const fixed = fixJavaScriptFunction(data.title, data.languages.typescript.template, data.languages.typescript.solution_code);
            if (fixed.template !== data.languages.typescript.template || fixed.solutionCode !== data.languages.typescript.solution_code) {
                data.languages.typescript.template = fixed.template;
                data.languages.typescript.solution_code = fixed.solutionCode;
                modified = true;
            }
        }
        
        // Fix Java
        if (data.languages.java) {
            const fixed = fixJavaFunction(data.title, data.languages.java.template, data.languages.java.solution_code);
            if (fixed.template !== data.languages.java.template || fixed.solutionCode !== data.languages.java.solution_code) {
                data.languages.java.template = fixed.template;
                data.languages.java.solution_code = fixed.solutionCode;
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            fixedCount++;
            console.log(`✓ Fixed function names in: ${file}`);
        }
        
    } catch (error) {
        console.error(`Error processing ${file}:`, error);
    }
});

console.log(`\nFixed function names in ${fixedCount} files`);