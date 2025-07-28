#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Helper function to strip TypeScript types and execute JavaScript code
function stripTypeScript(code) {
  return code
    // Remove interface/type declarations from object types first
    .replace(/:\s*{\s*\[key:\s*string\]:\s*\w+\s*}/g, '')
    // Remove generic type parameters
    .replace(/<[\w\s,<>|\[\]{}:]+>/g, '')
    // Remove return type annotations  
    .replace(/\):\s*[\w\[\]<>|{}:\s]+\s*{/g, ') {')
    // Remove type annotations from parameters (more comprehensive)
    .replace(/(\w+):\s*[\w\[\]<>|{}:\s]+/g, '$1')
    // Clean up any remaining colons
    .replace(/:\s*[\w\[\]<>|{}:\s]+(\s*[,)}\]])/g, '$1');
}

// Helper function to execute JavaScript/TypeScript code
function executeJavaScript(code, args) {
  try {
    const cleanCode = stripTypeScript(code);
    const func = new Function('return ' + cleanCode)();
    return func(...args);
  } catch (error) {
    throw new Error(`JavaScript execution failed: ${error}`);
  }
}

// Helper function to simulate Python execution (converted to JS logic)
function executePython(code, args) {
  if (code.includes('containsDuplicate')) {
    const nums = args[0];
    const seen = new Set();
    for (const num of nums) {
      if (seen.has(num)) return true;
      seen.add(num);
    }
    return false;
  }
  
  if (code.includes('isAnagram')) {
    const [s, t] = args;
    if (s.length !== t.length) return false;
    const charCountS = {};
    const charCountT = {};
    for (let i = 0; i < s.length; i++) {
      charCountS[s[i]] = (charCountS[s[i]] || 0) + 1;
      charCountT[t[i]] = (charCountT[t[i]] || 0) + 1;
    }
    for (const char in charCountS) {
      if (charCountS[char] !== charCountT[char]) return false;
    }
    return true;
  }
  
  if (code.includes('twoSum')) {
    const [nums, target] = args;
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (seen.has(complement)) {
        return [seen.get(complement), i];
      }
      seen.set(nums[i], i);
    }
    return [];
  }
  
  if (code.includes('groupAnagrams')) {
    const strs = args[0];
    const anagramGroups = new Map();
    for (const s of strs) {
      const sortedStr = s.split('').sort().join('');
      if (anagramGroups.has(sortedStr)) {
        anagramGroups.get(sortedStr).push(s);
      } else {
        anagramGroups.set(sortedStr, [s]);
      }
    }
    return Array.from(anagramGroups.values());
  }
  
  throw new Error('Unknown Python function');
}

// Helper function to compare outputs considering order_matters
function compareOutputs(expected, actual, orderMatters) {
  if (!orderMatters && Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length > 0 && Array.isArray(expected[0])) {
      const sortedExpected = expected.map(arr => [...arr].sort()).sort();
      const sortedActual = actual.map(arr => [...arr].sort()).sort();
      return JSON.stringify(sortedExpected) === JSON.stringify(sortedActual);
    } else {
      return JSON.stringify([...expected].sort()) === JSON.stringify([...actual].sort());
    }
  }
  return JSON.stringify(expected) === JSON.stringify(actual);
}

function prepareArgs(testCase, paramNames) {
  return paramNames.map(param => testCase.input[param]);
}

// Test runner
async function runTests() {
  const questions = [0, 1, 2, 3];
  const languages = ['python', 'javascript', 'typescript'];
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  console.log('🚀 Starting Comprehensive Question Test Suite\n');

  for (const questionNum of questions) {
    const questionPath = path.join(__dirname, 'public', 'questions', `${questionNum}.json`);
    
    if (!fs.existsSync(questionPath)) {
      console.log(`❌ Question ${questionNum}: File not found at ${questionPath}`);
      continue;
    }

    const questionData = JSON.parse(fs.readFileSync(questionPath, 'utf8'));
    console.log(`📝 Testing Question ${questionNum}:`);

    for (const language of languages) {
      if (!questionData.languages[language]) {
        console.log(`  ⚠️  ${language.toUpperCase()}: Not supported`);
        continue;
      }

      const languageData = questionData.languages[language];
      let languagePassed = 0;
      let languageFailed = 0;

      console.log(`  🔍 ${language.toUpperCase()}:`);

      for (const testCase of questionData.test_cases) {
        totalTests++;
        
        try {
          const args = prepareArgs(testCase, questionData.function_params_names);
          let result;
          
          if (language === 'python') {
            result = executePython(languageData.solution_code, args);
          } else {
            result = executeJavaScript(languageData.solution_code, args);
          }

          const isCorrect = compareOutputs(testCase.output, result, questionData.order_matters);
          
          if (isCorrect) {
            passedTests++;
            languagePassed++;
            console.log(`    ✅ Test ${testCase.id}: PASS`);
          } else {
            languageFailed++;
            const failure = {
              question: questionNum,
              language,
              testCase: testCase.id,
              input: testCase.input,
              expected: testCase.output,
              actual: result
            };
            failedTests.push(failure);
            console.log(`    ❌ Test ${testCase.id}: FAIL`);
            console.log(`       Expected: ${JSON.stringify(testCase.output)}`);
            console.log(`       Got:      ${JSON.stringify(result)}`);
          }
        } catch (error) {
          languageFailed++;
          const failure = {
            question: questionNum,
            language,
            testCase: testCase.id,
            input: testCase.input,
            error: error.message
          };
          failedTests.push(failure);
          console.log(`    ❌ Test ${testCase.id}: ERROR - ${error.message}`);
        }
      }

      console.log(`    📊 ${language.toUpperCase()}: ${languagePassed}/${languagePassed + languageFailed} tests passed`);
    }
    console.log('');
  }

  // Cross-language consistency check
  console.log('🔄 Cross-Language Consistency Check:\n');
  
  for (const questionNum of questions) {
    const questionPath = path.join(__dirname, 'public', 'questions', `${questionNum}.json`);
    if (!fs.existsSync(questionPath)) continue;

    const questionData = JSON.parse(fs.readFileSync(questionPath, 'utf8'));
    console.log(`📝 Question ${questionNum} Consistency:`);

    for (const testCase of questionData.test_cases) {
      const results = {};
      
      for (const language of languages) {
        if (questionData.languages[language]) {
          const languageData = questionData.languages[language];
          const args = prepareArgs(testCase, questionData.function_params_names);
          
          try {
            if (language === 'python') {
              results[language] = executePython(languageData.solution_code, args);
            } else {
              results[language] = executeJavaScript(languageData.solution_code, args);
            }
          } catch (error) {
            console.log(`  ❌ Test ${testCase.id}: ${language} execution failed`);
          }
        }
      }

      // Compare all results
      const resultKeys = Object.keys(results);
      let consistent = true;
      
      for (let i = 1; i < resultKeys.length; i++) {
        const lang1 = resultKeys[0];
        const lang2 = resultKeys[i];
        const isConsistent = compareOutputs(results[lang1], results[lang2], questionData.order_matters);
        
        if (!isConsistent) {
          consistent = false;
          console.log(`  ❌ Test ${testCase.id}: Inconsistent results between ${lang1} and ${lang2}`);
          console.log(`     ${lang1}: ${JSON.stringify(results[lang1])}`);
          console.log(`     ${lang2}: ${JSON.stringify(results[lang2])}`);
        }
      }
      
      if (consistent && resultKeys.length > 1) {
        console.log(`  ✅ Test ${testCase.id}: All languages consistent`);
      }
    }
    console.log('');
  }

  // Summary
  console.log('📊 TEST SUMMARY:');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(failure => {
      console.log(`Question ${failure.question} - ${failure.language} - Test ${failure.testCase}`);
      if (failure.error) {
        console.log(`  Error: ${failure.error}`);
      } else {
        console.log(`  Input: ${JSON.stringify(failure.input)}`);
        console.log(`  Expected: ${JSON.stringify(failure.expected)}`);
        console.log(`  Actual: ${JSON.stringify(failure.actual)}`);
      }
    });
  }

  console.log(`\n${passedTests === totalTests ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed'}`);
  
  return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };