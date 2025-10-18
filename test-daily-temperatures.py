import json

with open('public/questions/daily-temperatures.json', 'r') as f:
    question = json.load(f)

exec(question['prepare'])
exec(question['verify'])

print("Testing CORRECT solution:")
exec(question['solution_code'])

passed = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = dailyTemperatures(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        passed += 1
        print(f"✓ Test {test_case['id']} passed")
    else:
        print(f"✗ Test {test_case['id']} FAILED")
        print(f"  Input: {test_case['input']['temperatures']}")
        print(f"  Expected: {test_case['output']}")
        print(f"  Got: {actual}")

print(f"\nCorrect solution: {passed}/{len(question['test_cases'])} tests passed")

# Test WRONG solution 1: Always return zeros
print("\n" + "="*50)
print("Testing WRONG solution (all zeros):")

def dailyTemperatures(temperatures):
    return [0] * len(temperatures)

wrong1 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = dailyTemperatures(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong1 += 1

print(f"Wrong solution 1: {wrong1}/{len(question['test_cases'])} tests passed (should be low)")

# Test WRONG solution 2: Brute force but off by one
print("\n" + "="*50)
print("Testing WRONG solution (off-by-one in calculation):")

def dailyTemperatures(temperatures):
    n = len(temperatures)
    result = [0] * n
    stack = []

    for i in range(n):
        while stack and temperatures[i] > temperatures[stack[-1]]:
            prev_index = stack.pop()
            # BUG: Wrong calculation
            result[prev_index] = i - prev_index + 1

        stack.append(i)

    return result

wrong2 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = dailyTemperatures(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong2 += 1

print(f"Wrong solution 2: {wrong2}/{len(question['test_cases'])} tests passed (should be 0)")

# Test WRONG solution 3: Missing stack logic
print("\n" + "="*50)
print("Testing WRONG solution (brute force O(n^2)):")

def dailyTemperatures(temperatures):
    n = len(temperatures)
    result = [0] * n

    for i in range(n):
        for j in range(i + 1, n):
            # BUG: Wrong comparison
            if temperatures[j] >= temperatures[i]:
                result[i] = j - i
                break

    return result

wrong3 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = dailyTemperatures(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong3 += 1

print(f"Wrong solution 3: {wrong3}/{len(question['test_cases'])} tests passed (should be low)")
