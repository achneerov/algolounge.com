#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Clear log file at start
const logFile = path.join(__dirname, 'web-copy-paste-run-workflow-log.txt');
fs.writeFileSync(logFile, '', 'utf8');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage, 'utf8');
}

// Helper function for delays that works across Puppeteer versions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWorkflow() {
    try {
        // Check if puppeteer is available
        let puppeteer;
        try {
            puppeteer = require('puppeteer');
        } catch (error) {
            log('ERROR: Puppeteer not installed. Please run: npm install puppeteer --save-dev');
            log('Alternative: Install Puppeteer manually and ensure Chrome is available');
            process.exit(1);
        }

        log('Starting web copy-paste-run workflow...');
        
        // Load questions index
        const questionsIndexPath = path.join(__dirname, '..', 'public', 'questions', 'index.json');
        const questionsIndex = JSON.parse(fs.readFileSync(questionsIndexPath, 'utf8'));
        
        log(`Found ${questionsIndex.questions.length} questions to test`);
        
        // Launch browser
        log('Launching Chrome browser...');
        const browser = await puppeteer.launch({
            headless: false, // Use headed mode so you can see what's happening
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Start development server check
        log('Checking if development server is running at http://localhost:4200...');
        try {
            await page.goto('http://localhost:4200', { waitUntil: 'networkidle0', timeout: 5000 });
            log('Development server is running');
        } catch (error) {
            log('ERROR: Development server not running. Please start with: npm start');
            await browser.close();
            process.exit(1);
        }
        
        const languages = ['python', 'javascript', 'typescript', 'java'];
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        // Process each question
        for (const question of questionsIndex.questions) {
            log(`\n=== Testing Question: ${question.title} (${question.filename}) ===`);
            
            // Load question data
            const questionPath = path.join(__dirname, '..', 'public', 'questions', `${question.filename}.json`);
            let questionData;
            try {
                questionData = JSON.parse(fs.readFileSync(questionPath, 'utf8'));
            } catch (error) {
                log(`ERROR: Could not load question data for ${question.filename}: ${error.message}`);
                continue;
            }
            
            // Test each language
            for (const language of languages) {
                if (!questionData.languages[language]) {
                    log(`SKIP: ${language} not available for ${question.filename}`);
                    continue;
                }
                
                log(`\n--- Testing ${language} for ${question.filename} ---`);
                totalTests++;
                
                try {
                    // Navigate to question page
                    const questionUrl = `http://localhost:4200/questions/${question.filename}`;
                    await page.goto(questionUrl, { waitUntil: 'networkidle0' });
                    
                    // Wait for page to load and find language selector
                    await page.waitForSelector('.language-dropdown, select', { timeout: 10000 });
                    
                    // Select the language from dropdown
                    await page.evaluate((lang) => {
                        const dropdown = document.querySelector('.language-dropdown') || 
                                       document.querySelector('select');
                        
                        if (dropdown) {
                            const options = Array.from(dropdown.querySelectorAll('option'));
                            for (const option of options) {
                                const value = option.value?.toLowerCase() || '';
                                const text = option.textContent?.toLowerCase() || '';
                                
                                if (value === lang.toLowerCase() || text.trim() === lang.toLowerCase()) {
                                    dropdown.value = option.value;
                                    const changeEvent = new Event('change', { bubbles: true });
                                    dropdown.dispatchEvent(changeEvent);
                                    break;
                                }
                            }
                        }
                    }, language);
                    
                    // Wait a bit for language change
                    await delay(1000);
                    
                    // Find and clear the code editor
                    await page.waitForSelector('.cm-editor', { timeout: 5000 });
                    
                    // Select all text and replace with solution
                    await page.evaluate(() => {
                        const editor = document.querySelector('.cm-editor .cm-content');
                        if (editor) {
                            editor.focus();
                            // Select all text
                            document.execCommand('selectAll');
                        }
                    });
                    
                    // Type the solution
                    const solution = questionData.languages[language].solution_code;
                    await page.keyboard.type(solution);
                    
                    // Wait a moment for the code to be set
                    await delay(500);
                    
                    // Find and click the run button
                    const runButton = await page.waitForSelector('button:has-text("Run"), .run-button, [data-testid="run-button"]', { timeout: 5000 });
                    await runButton.click();
                    
                    // Wait for test results
                    await delay(3000);
                    
                    // Check if there's a success indicator or all tests passed
                    const results = await page.evaluate(() => {
                        // Look for success/failure indicators
                        const successElement = document.querySelector('.test-success, .all-tests-passed, .success-message');
                        const failureElement = document.querySelector('.test-failure, .test-failed, .error-message');
                        const consoleOutput = document.querySelector('.console-output, .test-results');
                        
                        return {
                            success: !!successElement,
                            failure: !!failureElement,
                            output: consoleOutput ? consoleOutput.textContent : 'No output captured'
                        };
                    });
                    
                    if (results.success) {
                        log(`✅ PASS: ${language} solution for ${question.filename}`);
                        passedTests++;
                    } else if (results.failure) {
                        log(`❌ FAIL: ${language} solution for ${question.filename}`);
                        log(`Output: ${results.output}`);
                        failedTests++;
                    } else {
                        log(`⚠️  UNKNOWN: ${language} solution for ${question.filename} - could not determine result`);
                        log(`Output: ${results.output}`);
                        failedTests++;
                    }
                    
                } catch (error) {
                    log(`❌ ERROR: Testing ${language} for ${question.filename}: ${error.message}`);
                    failedTests++;
                }
            }
        }
        
        // Final summary
        log(`\n=== FINAL SUMMARY ===`);
        log(`Total tests: ${totalTests}`);
        log(`Passed: ${passedTests}`);
        log(`Failed: ${failedTests}`);
        log(`Success rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0}%`);
        
        await browser.close();
        log('Workflow completed');
        
    } catch (error) {
        log(`FATAL ERROR: ${error.message}`);
        process.exit(1);
    }
}

// Enhanced version with better selectors and error handling
async function runEnhancedWorkflow() {
    try {
        let puppeteer;
        try {
            puppeteer = require('puppeteer');
        } catch (error) {
            log('ERROR: Puppeteer not installed. Installing now...');
            
            // Try to install puppeteer
            const { execSync } = require('child_process');
            try {
                execSync('npm install puppeteer --save-dev', { stdio: 'pipe' });
                log('Puppeteer installed successfully');
                puppeteer = require('puppeteer');
            } catch (installError) {
                log('ERROR: Could not install Puppeteer automatically. Please run: npm install puppeteer --save-dev');
                process.exit(1);
            }
        }

        log('Starting enhanced web copy-paste-run workflow...');
        
        // Load questions index
        const questionsIndexPath = path.join(__dirname, '..', 'public', 'questions', 'index.json');
        const questionsIndex = JSON.parse(fs.readFileSync(questionsIndexPath, 'utf8'));
        
        log(`Found ${questionsIndex.questions.length} questions to test`);
        
        // Launch browser
        log('Launching Chrome browser...');
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1400, height: 900 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        
        // Enable console logging from page
        page.on('console', msg => {
            if (msg.type() === 'error') {
                log(`PAGE ERROR: ${msg.text()}`);
            }
        });
        
        // Check dev server
        log('Checking development server...');
        try {
            await page.goto('http://localhost:4200', { waitUntil: 'networkidle2', timeout: 10000 });
            log('Development server is running');
        } catch (error) {
            log('ERROR: Development server not running. Please start with: npm start');
            await browser.close();
            process.exit(1);
        }
        
        const languages = ['python', 'javascript', 'typescript', 'java'];
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        // Process each question
        for (let i = 0; i < questionsIndex.questions.length; i++) {
            const question = questionsIndex.questions[i];
            log(`\n=== [${i + 1}/${questionsIndex.questions.length}] Testing Question: ${question.title} ===`);
            
            // Load question data
            const questionPath = path.join(__dirname, '..', 'public', 'questions', `${question.filename}.json`);
            let questionData;
            try {
                questionData = JSON.parse(fs.readFileSync(questionPath, 'utf8'));
            } catch (error) {
                log(`ERROR: Could not load question data for ${question.filename}: ${error.message}`);
                continue;
            }
            
            // Test each language for this question
            for (const language of languages) {
                if (!questionData.languages || !questionData.languages[language]) {
                    log(`SKIP: ${language} not available for ${question.filename}`);
                    continue;
                }
                
                log(`\n--- Testing ${language} for ${question.filename} ---`);
                totalTests++;
                
                try {
                    // Navigate to question page
                    const questionUrl = `http://localhost:4200/questions/${question.filename}`;
                    log(`Navigating to: ${questionUrl}`);
                    await page.goto(questionUrl, { waitUntil: 'networkidle2', timeout: 15000 });
                    
                    // Wait for the page to fully load
                    await delay(2000);
                    
                    // Wait for language selector dropdown
                    try {
                        await page.waitForSelector('.language-dropdown, select', { timeout: 10000 });
                    } catch (error) {
                        log(`ERROR: Could not find language selector on page for ${question.filename}`);
                        failedTests++;
                        continue;
                    }
                    
                    // Select the language from the dropdown with better verification
                    const languageSelected = await page.evaluate((lang) => {
                        // Look for the language dropdown
                        const dropdown = document.querySelector('.language-dropdown') || 
                                       document.querySelector('select[class*="language"]') ||
                                       document.querySelector('select');
                        
                        if (dropdown) {
                            console.log('Found dropdown, current value:', dropdown.value);
                            
                            // Find the option with the matching value or text
                            const options = Array.from(dropdown.querySelectorAll('option'));
                            console.log('Available options:', options.map(o => o.value + ' - ' + o.textContent));
                            
                            for (const option of options) {
                                const value = option.value?.toLowerCase() || '';
                                const text = option.textContent?.toLowerCase() || '';
                                
                                if (value === lang.toLowerCase() || text.trim() === lang.toLowerCase()) {
                                    console.log('Selecting option:', option.value, option.textContent);
                                    dropdown.value = option.value;
                                    
                                    // Trigger multiple events to ensure change is detected
                                    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                                    dropdown.dispatchEvent(new Event('input', { bubbles: true }));
                                    
                                    // Verify the selection
                                    console.log('After selection, dropdown value:', dropdown.value);
                                    return { success: true, selectedValue: dropdown.value, selectedText: option.textContent };
                                }
                            }
                        }
                        return { success: false, error: 'Language option not found' };
                    }, language);
                    
                    log(`Language selection result: ${JSON.stringify(languageSelected)}`);
                    
                    if (!languageSelected.success) {
                        log(`WARNING: Could not find ${language} option in dropdown for ${question.filename}: ${languageSelected.error}`);
                    }
                    
                    // Wait for language change to take effect and verify it worked
                    await delay(1500);
                    
                    // Verify the language actually changed by checking the dropdown again
                    const languageVerification = await page.evaluate(() => {
                        const dropdown = document.querySelector('.language-dropdown, select');
                        return dropdown ? dropdown.value : 'no dropdown found';
                    });
                    
                    log(`Language verification - dropdown now shows: ${languageVerification}`);
                    
                    // Find code editor
                    let editorFound = false;
                    const editorSelectors = [
                        '.cm-editor',
                        '.CodeMirror',
                        'textarea[data-testid="code-editor"]',
                        '.code-editor',
                        '.monaco-editor'
                    ];
                    
                    for (const selector of editorSelectors) {
                        try {
                            await page.waitForSelector(selector, { timeout: 3000 });
                            editorFound = true;
                            break;
                        } catch (e) {
                            // Try next selector
                        }
                    }
                    
                    if (!editorFound) {
                        log(`ERROR: Could not find code editor for ${question.filename}`);
                        failedTests++;
                        continue;
                    }
                    
                    // Clear editor and input solution using keyboard simulation (most reliable)
                    const solution = questionData.languages[language].solution_code;
                    log(`Inserting solution code (${solution.length} characters)...`);
                    
                    // Disable auto-completion and auto-closing features if possible
                    await page.evaluate(() => {
                        try {
                            // Try to disable common auto-completion features
                            const cmEditor = document.querySelector('.cm-editor');
                            if (cmEditor && cmEditor.editor) {
                                // This might help disable auto-closing brackets
                                const view = cmEditor.editor;
                                if (view.state && view.state.config) {
                                    // Try to access and disable auto-completion extensions
                                    console.log('CodeMirror editor found, attempting to disable auto-features');
                                }
                            }
                        } catch (error) {
                            console.log('Could not disable auto-completion features:', error);
                        }
                    });
                    
                    // Click on the editor to focus it
                    try {
                        await page.click('.cm-content');
                        log('Clicked on CodeMirror editor');
                    } catch (error) {
                        try {
                            await page.click('.cm-editor');
                            log('Clicked on CodeMirror container');
                        } catch (error2) {
                            await page.click('textarea');
                            log('Clicked on textarea fallback');
                        }
                    }
                    
                    await delay(500);
                    
                    // First, try to clear via DOM manipulation
                    const domCleared = await page.evaluate(() => {
                        try {
                            // Try to find and clear CodeMirror editor directly
                            const cmEditor = document.querySelector('.cm-editor');
                            if (cmEditor && cmEditor.editor) {
                                const view = cmEditor.editor;
                                const transaction = view.state.update({
                                    changes: { from: 0, to: view.state.doc.length, insert: '' }
                                });
                                view.dispatch(transaction);
                                return 'codemirror6-cleared';
                            }
                            
                            // Fallback: clear content directly
                            const cmContent = document.querySelector('.cm-content');
                            if (cmContent) {
                                cmContent.textContent = '';
                                cmContent.innerHTML = '';
                                return 'dom-cleared';
                            }
                            
                            // Textarea fallback
                            const textArea = document.querySelector('textarea');
                            if (textArea) {
                                textArea.value = '';
                                textArea.dispatchEvent(new Event('input', { bubbles: true }));
                                return 'textarea-cleared';
                            }
                            
                            return false;
                        } catch (error) {
                            console.error('DOM clear error:', error);
                            return false;
                        }
                    });
                    
                    log(`DOM clearing result: ${domCleared}`);
                    
                    // Then use keyboard to ensure it's really clear
                    await page.keyboard.down('Control');
                    await page.keyboard.press('a');
                    await page.keyboard.up('Control');
                    await delay(100);
                    
                    await page.keyboard.press('Delete');
                    await delay(100);
                    
                    // Do it again to be absolutely sure
                    await page.keyboard.down('Control');
                    await page.keyboard.press('a');
                    await page.keyboard.up('Control');
                    await delay(100);
                    
                    await page.keyboard.press('Backspace');
                    await delay(200);
                    
                    log('Applied aggressive clearing with DOM + keyboard methods');
                    
                    // Verify the editor is actually empty before typing
                    const preTypeCheck = await page.evaluate(() => {
                        const cmContent = document.querySelector('.cm-content');
                        const textArea = document.querySelector('textarea');
                        
                        if (cmContent) {
                            return {
                                method: 'codemirror',
                                content: cmContent.textContent || '',
                                length: (cmContent.textContent || '').length
                            };
                        } else if (textArea) {
                            return {
                                method: 'textarea', 
                                content: textArea.value || '',
                                length: (textArea.value || '').length
                            };
                        }
                        
                        return { method: 'unknown', content: '', length: 0 };
                    });
                    
                    log(`Pre-type verification: ${preTypeCheck.method}, length: ${preTypeCheck.length}, content: "${preTypeCheck.content.slice(0, 50)}"`);
                    
                    if (preTypeCheck.length > 10) {
                        log('WARNING: Editor not properly cleared, forcing one more clear...');
                        await page.evaluate(() => {
                            const cmContent = document.querySelector('.cm-content');
                            if (cmContent) {
                                cmContent.textContent = '';
                                cmContent.innerHTML = '';
                            }
                        });
                    }
                    
                    // Try clipboard paste instead of typing to avoid auto-completion issues
                    try {
                        // Set clipboard content and paste
                        await page.evaluate(async (solutionCode) => {
                            try {
                                await navigator.clipboard.writeText(solutionCode);
                                return true;
                            } catch (error) {
                                return false;
                            }
                        }, solution);
                        
                        // Paste using Ctrl+V
                        await page.keyboard.down('Control');
                        await page.keyboard.press('v');
                        await page.keyboard.up('Control');
                        log(`Pasted solution code using clipboard`);
                    } catch (error) {
                        log(`Clipboard paste failed, falling back to typing: ${error.message}`);
                        
                        // Fallback to typing but with slower speed to avoid auto-completion issues
                        await page.keyboard.type(solution, { delay: 10 });
                        log(`Typed solution code with delay`);
                    }
                    
                    // Verify the code was inserted by checking the editor content
                    const codeVerification = await page.evaluate(() => {
                        const cmContent = document.querySelector('.cm-content');
                        const textArea = document.querySelector('textarea');
                        
                        if (cmContent) {
                            return {
                                method: 'codemirror',
                                content: cmContent.textContent || '',
                                length: (cmContent.textContent || '').length
                            };
                        } else if (textArea) {
                            return {
                                method: 'textarea',
                                content: textArea.value || '',
                                length: (textArea.value || '').length
                            };
                        }
                        
                        return { method: 'unknown', content: '', length: 0 };
                    });
                    
                    log(`Code verification: ${codeVerification.method}, length: ${codeVerification.length}/${solution.length}`);
                    
                    // Check for duplicate function signatures and extra brackets
                    const duplicateCheck = codeVerification.content.split('\n').filter(line => 
                        line.trim().startsWith('def ') || 
                        line.trim().startsWith('function ') || 
                        line.trim().startsWith('class ')
                    );
                    
                    if (duplicateCheck.length > 1) {
                        log(`WARNING: Detected ${duplicateCheck.length} function signatures - possible duplication`);
                        log(`Function lines: ${duplicateCheck.join(', ')}`);
                    }
                    
                    // Check for extra closing brackets
                    const lines = codeVerification.content.split('\n');
                    const extraBrackets = lines.filter(line => line.trim() === '}' || line.trim() === '])');
                    if (extraBrackets.length > 2) {
                        log(`WARNING: Detected ${extraBrackets.length} potential extra closing brackets`);
                    }
                    
                    // Debug: Show the actual content structure
                    log(`Content preview (first 10 lines):`);
                    lines.slice(0, 10).forEach((line, i) => {
                        log(`  ${i+1}: "${line}"`);
                    });
                    
                    if (lines.length > 10) {
                        log(`Content preview (last 5 lines):`);
                        lines.slice(-5).forEach((line, i) => {
                            log(`  ${lines.length-4+i}: "${line}"`);
                        });
                    }
                    
                    if (codeVerification.length < solution.length * 0.8) {
                        log('WARNING: Code insertion may have failed - content length mismatch');
                        // Try alternative approach
                        await page.evaluate((solutionCode) => {
                            const cmContent = document.querySelector('.cm-content');
                            if (cmContent) {
                                cmContent.textContent = solutionCode;
                                cmContent.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }, solution);
                        log('Tried direct content insertion as fallback');
                    }
                    
                    // Small delay to ensure code is set
                    await delay(1000);
                    
                    // Find and click run button (specific to AlgoLounge)
                    const runClicked = await page.evaluate(() => {
                        // Look for the specific run button class used in AlgoLounge
                        const runButton = document.querySelector('.run-btn') || 
                                         document.querySelector('button[class*="run"]');
                        
                        if (runButton && !runButton.disabled) {
                            runButton.click();
                            return true;
                        }
                        
                        // Fallback: look for any button with "Run" text
                        const buttons = Array.from(document.querySelectorAll('button'));
                        for (const button of buttons) {
                            const text = button.textContent?.toLowerCase() || '';
                            if (text.includes('run') && !button.disabled) {
                                button.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (!runClicked) {
                        log(`WARNING: Could not find run button for ${question.filename}`);
                    }
                    
                    // Wait for execution and results with language-specific timeouts
                    let waitTime = 4000; // Default
                    if (language === 'python') {
                        waitTime = 8000; // Python needs more time for Pyodide
                        log('Using extended wait time for Python (Pyodide loading)');
                    } else if (language === 'java') {
                        waitTime = 6000; // Java compilation takes time
                        log('Using extended wait time for Java compilation');
                    }
                    
                    await delay(waitTime);
                    
                    // Dynamic waiting - keep checking if still running up to 20 seconds total
                    let totalWaitTime = waitTime;
                    const maxWaitTime = 20000; // Maximum 20 seconds
                    let isStillRunning = true;
                    
                    while (isStillRunning && totalWaitTime < maxWaitTime) {
                        const runningCheck = await page.evaluate(() => {
                            const runButton = document.querySelector('.run-btn');
                            const isRunning = runButton && (runButton.disabled || runButton.textContent?.includes('Running'));
                            const hasResults = document.querySelector('.test-case.passed, .test-case.failed');
                            
                            return {
                                isRunning: isRunning,
                                hasResults: !!hasResults,
                                buttonText: runButton ? runButton.textContent : 'no button found'
                            };
                        });
                        
                        if (!runningCheck.isRunning || runningCheck.hasResults) {
                            isStillRunning = false;
                            log(`Execution completed. Button: "${runningCheck.buttonText}", Has results: ${runningCheck.hasResults}`);
                        } else {
                            log(`Still executing... (${totalWaitTime}ms elapsed, button: "${runningCheck.buttonText}")`);
                            await delay(2000);
                            totalWaitTime += 2000;
                        }
                    }
                    
                    if (totalWaitTime >= maxWaitTime) {
                        log(`WARNING: Maximum wait time (${maxWaitTime}ms) reached for ${language}`);
                    }
                    
                    // Capture results from AlgoLounge console component
                    const results = await page.evaluate(() => {
                        // Look for console container
                        const consoleContainer = document.querySelector('.console-container');
                        if (!consoleContainer) {
                            return { success: false, failure: false, output: 'No console container found' };
                        }
                        
                        // Count passed and failed test cases
                        const passedTestCases = document.querySelectorAll('.test-case.passed');
                        const failedTestCases = document.querySelectorAll('.test-case.failed');
                        const totalTestCases = passedTestCases.length + failedTestCases.length;
                        
                        // Look for summary information
                        const summaryElement = document.querySelector('.summary');
                        let summaryText = summaryElement ? summaryElement.textContent || '' : '';
                        
                        // Get all console output
                        const output = consoleContainer.textContent || '';
                        
                        // Check for pass/fail icons
                        const passIcons = document.querySelectorAll('.pass-icon');
                        const failIcons = document.querySelectorAll('.fail-icon');
                        
                        // Determine overall success
                        const allTestsPassed = failedTestCases.length === 0 && passedTestCases.length > 0;
                        const hasFailures = failedTestCases.length > 0;
                        
                        // Look for execution completion indicators
                        const runButton = document.querySelector('.run-btn');
                        const isRunning = runButton && (runButton.disabled || runButton.textContent?.includes('Running'));
                        
                        return {
                            success: allTestsPassed,
                            failure: hasFailures,
                            output: output,
                            summary: summaryText,
                            passedCount: passedTestCases.length,
                            failedCount: failedTestCases.length,
                            totalCount: totalTestCases,
                            isStillRunning: isRunning,
                            passIconsFound: passIcons.length,
                            failIconsFound: failIcons.length
                        };
                    });
                    
                    // Wait extra time if still running
                    if (results.isStillRunning) {
                        log(`Code still executing, waiting longer...`);
                        await delay(3000);
                        
                        // Re-capture results
                        const finalResults = await page.evaluate(() => {
                            const consoleContainer = document.querySelector('.console-container');
                            if (!consoleContainer) return { success: false, failure: false, output: 'No console found' };
                            
                            const passedTestCases = document.querySelectorAll('.test-case.passed');
                            const failedTestCases = document.querySelectorAll('.test-case.failed');
                            const allTestsPassed = failedTestCases.length === 0 && passedTestCases.length > 0;
                            const hasFailures = failedTestCases.length > 0;
                            
                            return {
                                success: allTestsPassed,
                                failure: hasFailures,
                                passedCount: passedTestCases.length,
                                failedCount: failedTestCases.length,
                                output: consoleContainer.textContent || ''
                            };
                        });
                        
                        Object.assign(results, finalResults);
                    }
                    
                    // Determine result with detailed information
                    if (results.success && results.passedCount > 0) {
                        log(`✅ PASS: ${language} solution for ${question.filename} (${results.passedCount}/${results.totalCount} tests passed)`);
                        passedTests++;
                    } else if (results.failure && results.failedCount > 0) {
                        log(`❌ FAIL: ${language} solution for ${question.filename} (${results.passedCount}/${results.totalCount} tests passed)`);
                        if (results.summary) {
                            log(`Summary: ${results.summary.slice(0, 100)}`);
                        }
                        failedTests++;
                    } else if (results.totalCount === 0) {
                        log(`⚠️  NO TESTS: ${language} solution for ${question.filename} - no test results found`);
                        if (results.output && results.output.length > 20) {
                            log(`Console output: ${results.output.slice(0, 150)}${results.output.length > 150 ? '...' : ''}`);
                        }
                        failedTests++;
                    } else {
                        log(`⚠️  UNCLEAR: ${language} solution for ${question.filename} - unexpected state`);
                        log(`Details: passed=${results.passedCount}, failed=${results.failedCount}, total=${results.totalCount}`);
                        if (results.output && results.output.length > 20) {
                            log(`Console output: ${results.output.slice(0, 150)}${results.output.length > 150 ? '...' : ''}`);
                        }
                        failedTests++;
                    }
                    
                } catch (error) {
                    log(`❌ ERROR: Testing ${language} for ${question.filename}: ${error.message}`);
                    failedTests++;
                }
                
                // Small delay between language tests
                await delay(500);
            }
            
            // Small delay between questions
            await delay(1000);
        }
        
        // Final summary
        log(`\n=== FINAL SUMMARY ===`);
        log(`Total tests run: ${totalTests}`);
        log(`Passed: ${passedTests}`);
        log(`Failed: ${failedTests}`);
        log(`Success rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0}%`);
        
        await browser.close();
        log('Enhanced workflow completed successfully');
        
    } catch (error) {
        log(`FATAL ERROR: ${error.message}`);
        log(`Stack trace: ${error.stack}`);
        process.exit(1);
    }
}

// Run the enhanced workflow
if (require.main === module) {
    runEnhancedWorkflow();
}

module.exports = { runWorkflow, runEnhancedWorkflow };