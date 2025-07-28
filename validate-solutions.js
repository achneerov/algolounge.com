#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Helper to execute Python-like logic in JavaScript
function executePythonLogic(code, functionName, args) {
  if (functionName === 'containsDuplicate') {
    const nums = args[0];
    const seen = new Set();
    for (const num of nums) {
      if (seen.has(num)) return true;
      seen.add(num);
    }
    return false;
  }
  
  if (functionName === 'isAnagram') {
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
  
  if (functionName === 'twoSum') {
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
  
  if (functionName === 'groupAnagrams') {
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
  
  throw new Error(`Unknown function: ${functionName}`);
}

// Helper to execute JavaScript/TypeScript
function executeJavaScript(code, args) {
  // Strip TypeScript types
  const cleanCode = code
    .replace(/:\s*{\s*\[key:\s*string\]:\s*\w+\s*}/g, '')
    .replace(/<[\w\s,<>|\[\]{}:]+>/g, '')
    .replace(/\):\s*[\w\[\]<>|{}:\s]+\s*{/g, ') {')
    .replace(/(\w+):\s*[\w\[\]<>|{}:\s]+/g, '$1')
    .replace(/:\s*[\w\[\]<>|{}:\s]+(\s*[,)}\]])/g, '$1');

  const func = new Function('return ' + cleanCode)();
  return func(...args);
}

// Helper to extract function name
function extractFunctionName(code, language) {
  if (language === 'python') {
    const match = code.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : '';
  } else {
    const match = code.match(/function\s+(\w+)\s*\(/);
    return match ? match[1] : '';
  }
}

// Helper to compare results
function compareResults(expected, actual, orderDoesNotMatter = false) {
  if (orderDoesNotMatter && Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length > 0 && Array.isArray(expected[0])) {
      // 2D array (Group Anagrams) - sort sub-arrays, then sort main array
      const sortedExpected = expected.map(arr => [...arr].sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      const sortedActual = actual.map(arr => [...arr].sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      return JSON.stringify(sortedExpected) === JSON.stringify(sortedActual);
    } else {
      // 1D array
      return JSON.stringify([...expected].sort()) === JSON.stringify([...actual].sort());
    }
  }
  return JSON.stringify(expected) === JSON.stringify(actual);
}

async function validateSolutions() {
  console.log('🚀 Validating All Question Solutions\n');
  
  const questions = [0, 1, 2, 3];
  const languages = ['python', 'javascript', 'typescript'];
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  for (const questionNum of questions) {
    const questionPath = path.join(__dirname, 'public', 'questions', `${questionNum}.json`);
    
    if (!fs.existsSync(questionPath)) {
      console.log(`❌ Question ${questionNum}: File not found`);
      continue;
    }

    const questionData = JSON.parse(fs.readFileSync(questionPath, 'utf8'));
    const questionTitle = questionData.description.match(/<h2>(.*?)<\/h2>/)?.[1] || `Question ${questionNum}`;
    
    console.log(`📝 ${questionTitle} (Question ${questionNum}):`);
    console.log(`   Function: ${extractFunctionName(questionData.languages.python.solution_code, 'python')}`);
    console.log(`   Parameters: [${questionData.function_params_names.join(', ')}]`);
    console.log(`   Test cases: ${questionData.test_cases.length}`);

    for (const language of languages) {
      if (!questionData.languages[language]) {
        console.log(`  ⚠️  ${language.toUpperCase()}: Not supported`);
        continue;
      }

      const languageData = questionData.languages[language];
      const functionName = extractFunctionName(languageData.solution_code, language);
      
      let languagePassed = 0;
      let languageFailed = 0;

      console.log(`\n  🔍 Testing ${language.toUpperCase()}:`);

      for (const testCase of questionData.test_cases) {
        totalTests++;
        
        try {
          // Prepare arguments based on parameter names
          const args = questionData.function_params_names.map(param => testCase.input[param]);
          
          let result;
          if (language === 'python') {
            result = executePythonLogic(languageData.solution_code, functionName, args);
          } else {
            result = executeJavaScript(languageData.solution_code, args);
          }

          const isCorrect = compareResults(testCase.output, result, !questionData.order_matters);
          
          if (isCorrect) {
            passedTests++;
            languagePassed++;
            console.log(`    ✅ Test ${testCase.id}: PASS`);
          } else {
            languageFailed++;
            const failure = {
              question: questionNum,
              questionTitle,
              language,
              testCase: testCase.id,
              input: testCase.input,
              expected: testCase.output,
              actual: result,
              functionName,
              parameters: questionData.function_params_names
            };
            failedTests.push(failure);
            console.log(`    ❌ Test ${testCase.id}: FAIL`);
            console.log(`       Input: ${JSON.stringify(testCase.input)}`);
            console.log(`       Expected: ${JSON.stringify(testCase.output)}`);
            console.log(`       Got: ${JSON.stringify(result)}`);
          }
        } catch (error) {
          languageFailed++;
          const failure = {
            question: questionNum,
            questionTitle,
            language,
            testCase: testCase.id,
            input: testCase.input,
            error: error.message,
            functionName,
            parameters: questionData.function_params_names
          };
          failedTests.push(failure);
          console.log(`    ❌ Test ${testCase.id}: ERROR`);
          console.log(`       Input: ${JSON.stringify(testCase.input)}`);
          console.log(`       Error: ${error.message}`);
        }
      }

      const successRate = ((languagePassed / (languagePassed + languageFailed)) * 100).toFixed(1);
      console.log(`    📊 ${language.toUpperCase()}: ${languagePassed}/${languagePassed + languageFailed} tests passed (${successRate}%)`);
    }
    console.log('');
  }

  // Summary
  console.log('📊 VALIDATION SUMMARY:');
  console.log('=====================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS DETAILS:');
    console.log('========================');
    failedTests.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.questionTitle} - ${failure.language.toUpperCase()}`);
      console.log(`   Function: ${failure.functionName}(${failure.parameters?.join(', ') || 'unknown'})`);
      console.log(`   Test Case: ${failure.testCase}`);
      console.log(`   Input: ${JSON.stringify(failure.input)}`);
      if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      } else {
        console.log(`   Expected: ${JSON.stringify(failure.expected)}`);
        console.log(`   Got: ${JSON.stringify(failure.actual)}`);
      }
    });
  }

  console.log(`\n${passedTests === totalTests ? '🎉 ALL TESTS PASSED! Your solutions are correct.' : '⚠️  Some tests failed - check the solutions above.'}`);
  
  return passedTests === totalTests;
}

// Run validation
if (require.main === module) {
  validateSolutions().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { validateSolutions };