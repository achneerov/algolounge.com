import json

# Load the question
with open('public/questions/asteroid-collision.json', 'r') as f:
    question = json.load(f)

# Execute the prepare and verify functions
exec(question['prepare'])
exec(question['verify'])

# Test with the correct solution
print("Testing CORRECT solution:")
exec(question['solution_code'])

passed_tests = 0
failed_tests = 0

for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = asteroidCollision(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        passed_tests += 1
        print(f"✓ Test {test_case['id']} passed")
    else:
        failed_tests += 1
        print(f"✗ Test {test_case['id']} FAILED")
        print(f"  Input: {test_case['input']}")
        print(f"  Expected: {test_case['output']}")
        print(f"  Got: {actual}")

print(f"\nCorrect solution: {passed_tests}/{len(question['test_cases'])} tests passed")

# Test with WRONG solution 1: Always return empty list
print("\n" + "="*50)
print("Testing WRONG solution (always returns empty):")

def asteroidCollision(asteroids):
    return []

wrong_passed = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = asteroidCollision(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        wrong_passed += 1

print(f"Wrong solution 1: {wrong_passed}/{len(question['test_cases'])} tests passed (should be low)")

# Test with WRONG solution 2: Don't handle collisions
print("\n" + "="*50)
print("Testing WRONG solution (no collision handling):")

def asteroidCollision(asteroids):
    return asteroids  # Just return input as-is

wrong_passed2 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = asteroidCollision(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        wrong_passed2 += 1

print(f"Wrong solution 2: {wrong_passed2}/{len(question['test_cases'])} tests passed (should be low)")

# Test with WRONG solution 3: Wrong collision logic
print("\n" + "="*50)
print("Testing WRONG solution (wrong collision logic - smaller always survives):")

def asteroidCollision(asteroids):
    stack = []
    for asteroid in asteroids:
        if stack and asteroid < 0 < stack[-1]:
            # Wrong logic: smaller always survives
            if abs(stack[-1]) < abs(asteroid):
                stack.pop()
                stack.append(asteroid)
        else:
            stack.append(asteroid)
    return stack

wrong_passed3 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = asteroidCollision(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        wrong_passed3 += 1

print(f"Wrong solution 3: {wrong_passed3}/{len(question['test_cases'])} tests passed (should be low)")
