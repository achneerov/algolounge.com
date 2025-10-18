import json

with open('public/questions/add-binary.json', 'r') as f:
    question = json.load(f)

exec(question['prepare'])
exec(question['verify'])

print("Testing CORRECT solution:")
exec(question['solution_code'])

passed = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = addBinary(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        passed += 1
        print(f"✓ Test {test_case['id']} passed")
    else:
        print(f"✗ Test {test_case['id']} FAILED")
        print(f"  Input: a={test_case['input']['a']}, b={test_case['input']['b']}")
        print(f"  Expected: {test_case['output']}")
        print(f"  Got: {actual}")

print(f"\nCorrect solution: {passed}/{len(question['test_cases'])} tests passed")

# Test WRONG solution 1: Just concatenate
print("\n" + "="*50)
print("Testing WRONG solution (concatenation):")

def addBinary(a, b):
    return a + b

wrong1 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = addBinary(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong1 += 1

print(f"Wrong solution 1: {wrong1}/{len(question['test_cases'])} tests passed (should be 0)")

# Test WRONG solution 2: Forget carry
print("\n" + "="*50)
print("Testing WRONG solution (no carry handling):")

def addBinary(a, b):
    result = []
    i, j = len(a) - 1, len(b) - 1

    while i >= 0 or j >= 0:
        digit_sum = 0
        if i >= 0:
            digit_sum += int(a[i])
            i -= 1
        if j >= 0:
            digit_sum += int(b[j])
            j -= 1
        result.append(str(digit_sum % 2))

    return ''.join(reversed(result))

wrong2 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = addBinary(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong2 += 1

print(f"Wrong solution 2: {wrong2}/{len(question['test_cases'])} tests passed (should be low)")
