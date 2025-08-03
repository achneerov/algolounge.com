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
        
        // Launch browser
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
        
        // Check dev server
        try {
            await page.goto('http://localhost:4200', { waitUntil: 'networkidle2', timeout: 10000 });
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
            
            // Load question data
            const questionPath = path.join(__dirname, '..', 'public', 'questions', `${question.filename}.json`);
            let questionData;
            try {
                questionData = JSON.parse(fs.readFileSync(questionPath, 'utf8'));
            } catch (error) {
                continue;
            }
            
            // Test each language for this question
            for (const language of languages) {
                if (!questionData.languages || !questionData.languages[language]) {
                    continue;
                }
                
                totalTests++;
                
                try {
                    // Navigate to question page
                    const questionUrl = `http://localhost:4200/questions/${question.filename}`;
                    await page.goto(questionUrl, { waitUntil: 'networkidle2', timeout: 15000 });
                    
                    // Wait for the page to fully load
                    await delay(2000);
                    
                    // Wait for language selector dropdown
                    await page.waitForSelector('.language-dropdown, select', { timeout: 10000 });
                    
                    // Select the language from the dropdown with better verification
                    await page.evaluate((lang) => {
                        const dropdown = document.querySelector('.language-dropdown') || 
                                       document.querySelector('select[class*="language"]') ||
                                       document.querySelector('select');
                        
                        if (dropdown) {
                            const options = Array.from(dropdown.querySelectorAll('option'));
                            
                            for (const option of options) {
                                const value = option.value?.toLowerCase() || '';
                                const text = option.textContent?.toLowerCase() || '';
                                
                                if (value === lang.toLowerCase() || text.trim() === lang.toLowerCase()) {
                                    dropdown.value = option.value;
                                    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                                    dropdown.dispatchEvent(new Event('input', { bubbles: true }));
                                    return;
                                }
                            }
                        }
                    }, language);
                    
                    // Wait for language change to take effect
                    await delay(1500);
                    
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
                        failedTests++;
                        continue;
                    }
                    
                    // Clear editor and input solution
                    const solution = questionData.languages[language].solution_code;
                    
                    // Disable auto-completion and focus editor
                    await page.evaluate(() => {
                        try {
                            const cmEditor = document.querySelector('.cm-editor');
                            if (cmEditor && cmEditor.editor) {
                                const view = cmEditor.editor;
                                if (view.state && view.state.config) {
                                    // Disable auto-completion features
                                }
                            }
                        } catch (error) {
                            // Ignore errors
                        }
                    });
                    
                    // Click on the editor to focus it
                    try {
                        await page.click('.cm-content');
                    } catch (error) {
                        try {
                            await page.click('.cm-editor');
                        } catch (error2) {
                            await page.click('textarea');
                        }
                    }
                    
                    await delay(500);
                    
                    // Clear editor using DOM and keyboard
                    await page.evaluate(() => {
                        try {
                            const cmEditor = document.querySelector('.cm-editor');
                            if (cmEditor && cmEditor.editor) {
                                const view = cmEditor.editor;
                                const transaction = view.state.update({
                                    changes: { from: 0, to: view.state.doc.length, insert: '' }
                                });
                                view.dispatch(transaction);
                                return;
                            }
                            
                            const cmContent = document.querySelector('.cm-content');
                            if (cmContent) {
                                cmContent.textContent = '';
                                cmContent.innerHTML = '';
                                return;
                            }
                            
                            const textArea = document.querySelector('textarea');
                            if (textArea) {
                                textArea.value = '';
                                textArea.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        } catch (error) {
                            // Ignore errors
                        }
                    });
                    
                    // Clear with keyboard
                    await page.keyboard.down('Control');
                    await page.keyboard.press('a');
                    await page.keyboard.up('Control');
                    await delay(100);
                    await page.keyboard.press('Delete');
                    await delay(200);
                    
                    // Verify editor is clear and insert solution
                    const preTypeCheck = await page.evaluate(() => {
                        const cmContent = document.querySelector('.cm-content');
                        const textArea = document.querySelector('textarea');
                        
                        if (cmContent) {
                            return (cmContent.textContent || '').length;
                        } else if (textArea) {
                            return (textArea.value || '').length;
                        }
                        return 0;
                    });
                    
                    if (preTypeCheck > 10) {
                        await page.evaluate(() => {
                            const cmContent = document.querySelector('.cm-content');
                            if (cmContent) {
                                cmContent.textContent = '';
                                cmContent.innerHTML = '';
                            }
                        });
                    }
                    
                    // Insert solution via clipboard
                    try {
                        await page.evaluate(async (solutionCode) => {
                            try {
                                await navigator.clipboard.writeText(solutionCode);
                                return true;
                            } catch (error) {
                                return false;
                            }
                        }, solution);
                        
                        await page.keyboard.down('Control');
                        await page.keyboard.press('v');
                        await page.keyboard.up('Control');
                    } catch (error) {
                        await page.keyboard.type(solution, { delay: 10 });
                    }
                    
                    // Verify code insertion
                    const codeVerification = await page.evaluate(() => {
                        const cmContent = document.querySelector('.cm-content');
                        const textArea = document.querySelector('textarea');
                        
                        if (cmContent) {
                            return (cmContent.textContent || '').length;
                        } else if (textArea) {
                            return (textArea.value || '').length;
                        }
                        return 0;
                    });
                    
                    if (codeVerification < solution.length * 0.8) {
                        await page.evaluate((solutionCode) => {
                            const cmContent = document.querySelector('.cm-content');
                            if (cmContent) {
                                cmContent.textContent = solutionCode;
                                cmContent.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }, solution);
                    }
                    
                    await delay(1000);
                    
                    // Find and click run button
                    const runClicked = await page.evaluate(() => {
                        const runButton = document.querySelector('.run-btn') || 
                                         document.querySelector('button[class*="run"]');
                        
                        if (runButton && !runButton.disabled) {
                            runButton.click();
                            return true;
                        }
                        
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
                    
                    // Wait for execution
                    let waitTime = language === 'python' ? 8000 : language === 'java' ? 6000 : 4000;
                    await delay(waitTime);
                    
                    // Dynamic waiting - check if still running up to 20 seconds
                    let totalWaitTime = waitTime;
                    const maxWaitTime = 20000;
                    let isStillRunning = true;
                    
                    while (isStillRunning && totalWaitTime < maxWaitTime) {
                        const runningCheck = await page.evaluate(() => {
                            const runButton = document.querySelector('.run-btn');
                            const isRunning = runButton && (runButton.disabled || runButton.textContent?.includes('Running'));
                            const hasResults = document.querySelector('.test-case.passed, .test-case.failed');
                            
                            return {
                                isRunning: isRunning,
                                hasResults: !!hasResults
                            };
                        });
                        
                        if (!runningCheck.isRunning || runningCheck.hasResults) {
                            isStillRunning = false;
                        } else {
                            await delay(2000);
                            totalWaitTime += 2000;
                        }
                    }
                    
                    // Capture test results
                    const results = await page.evaluate(() => {
                        const consoleContainer = document.querySelector('.console-container');
                        if (!consoleContainer) {
                            return { success: false, failure: false, passedCount: 0, failedCount: 0, totalCount: 0, isStillRunning: false };
                        }
                        
                        const passedTestCases = document.querySelectorAll('.test-case.passed');
                        const failedTestCases = document.querySelectorAll('.test-case.failed');
                        const totalTestCases = passedTestCases.length + failedTestCases.length;
                        const allTestsPassed = failedTestCases.length === 0 && passedTestCases.length > 0;
                        const hasFailures = failedTestCases.length > 0;
                        const runButton = document.querySelector('.run-btn');
                        const isRunning = runButton && (runButton.disabled || runButton.textContent?.includes('Running'));
                        
                        return {
                            success: allTestsPassed,
                            failure: hasFailures,
                            passedCount: passedTestCases.length,
                            failedCount: failedTestCases.length,
                            totalCount: totalTestCases,
                            isStillRunning: isRunning
                        };
                    });
                    
                    // Wait extra if still running
                    if (results.isStillRunning) {
                        await delay(3000);
                        
                        const finalResults = await page.evaluate(() => {
                            const consoleContainer = document.querySelector('.console-container');
                            if (!consoleContainer) return { success: false, failure: false, passedCount: 0, failedCount: 0 };
                            
                            const passedTestCases = document.querySelectorAll('.test-case.passed');
                            const failedTestCases = document.querySelectorAll('.test-case.failed');
                            const allTestsPassed = failedTestCases.length === 0 && passedTestCases.length > 0;
                            const hasFailures = failedTestCases.length > 0;
                            
                            return {
                                success: allTestsPassed,
                                failure: hasFailures,
                                passedCount: passedTestCases.length,
                                failedCount: failedTestCases.length
                            };
                        });
                        
                        Object.assign(results, finalResults);
                    }
                    
                    // Log result - one line per test
                    if (results.success && results.passedCount > 0) {
                        log(`✅ PASS: ${language} solution for ${question.filename} (${results.passedCount}/${results.passedCount + results.failedCount} tests passed)`);
                        passedTests++;
                    } else if (results.failure && results.failedCount > 0) {
                        log(`❌ FAIL: ${language} solution for ${question.filename} (${results.passedCount}/${results.passedCount + results.failedCount} tests passed)`);
                        failedTests++;
                    } else {
                        log(`⚠️  ERROR: ${language} solution for ${question.filename} - no test results`);
                        failedTests++;
                    }
                    
                } catch (error) {
                    log(`❌ ERROR: ${language} for ${question.filename}: ${error.message}`);
                    failedTests++;
                }
                
                await delay(500);
            }
            
            await delay(1000);
        }
        
        // Final summary
        log(`\n=== FINAL SUMMARY ===`);
        log(`Total tests run: ${totalTests}`);
        log(`Passed: ${passedTests}`);
        log(`Failed: ${failedTests}`);
        log(`Success rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0}%`);
        
        await browser.close();
        
    } catch (error) {
        log(`FATAL ERROR: ${error.message}`);
        process.exit(1);
    }
}

// Run the enhanced workflow
if (require.main === module) {
    runEnhancedWorkflow();
}

module.exports = { runWorkflow, runEnhancedWorkflow };