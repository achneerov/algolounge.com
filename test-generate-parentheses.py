import json

with open('public/questions/generate-parentheses.json', 'r') as f:
    question = json.load(f)

exec(question['prepare'])
exec(question['verify'])

print("Testing CORRECT solution:")
exec(question['solution_code'])

passed = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = generateParentheses(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        passed += 1
        print(f"✓ Test {test_case['id']} passed - n={test_case['input']['n']}, generated {len(actual)} combinations")
    else:
        print(f"✗ Test {test_case['id']} FAILED")
        print(f"  Input: n={test_case['input']['n']}")
        print(f"  Expected: {sorted(test_case['output'])}")
        print(f"  Got: {sorted(actual)}")

print(f"\nCorrect solution: {passed}/{len(question['test_cases'])} tests passed")

# Test WRONG solution 1: No validation, generates invalid combos
print("\n" + "="*50)
print("Testing WRONG solution (no validation):")

def generateParentheses(n):
    result = []

    def backtrack(current):
        if len(current) == 2 * n:
            result.append(current)
            return

        # BUG: Always adds both without validation
        backtrack(current + '(')
        backtrack(current + ')')

    backtrack('')
    return result

wrong1 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = generateParentheses(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong1 += 1

print(f"Wrong solution 1: {wrong1}/{len(question['test_cases'])} tests passed (should be 0)")

# Test WRONG solution 2: Wrong condition
print("\n" + "="*50)
print("Testing WRONG solution (wrong close condition):")

def generateParentheses(n):
    result = []

    def backtrack(current, open_count, close_count):
        if len(current) == 2 * n:
            result.append(current)
            return

        if open_count < n:
            backtrack(current + '(', open_count + 1, close_count)

        # BUG: Should be close_count < open_count, not <= n
        if close_count < n:
            backtrack(current + ')', open_count, close_count + 1)

    backtrack('', 0, 0)
    return result

wrong2 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = generateParentheses(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong2 += 1

print(f"Wrong solution 2: {wrong2}/{len(question['test_cases'])} tests passed (should be 0)")

# Test WRONG solution 3: Returns only one pattern
print("\n" + "="*50)
print("Testing WRONG solution (only generates one pattern):")

def generateParentheses(n):
    # BUG: Only returns one valid combination
    return ['(' * n + ')' * n]

wrong3 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = generateParentheses(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong3 += 1

print(f"Wrong solution 3: {wrong3}/{len(question['test_cases'])} tests passed (should be 0)")
