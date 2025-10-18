import json

with open('public/questions/car-fleet.json', 'r') as f:
    question = json.load(f)

exec(question['prepare'])
exec(question['verify'])

print("Testing CORRECT solution:")
exec(question['solution_code'])

passed = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = carFleet(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        passed += 1
        print(f"✓ Test {test_case['id']} passed")
    else:
        print(f"✗ Test {test_case['id']} FAILED")
        print(f"  Input: target={test_case['input']['target']}, position={test_case['input']['position']}, speed={test_case['input']['speed']}")
        print(f"  Expected: {test_case['output']}")
        print(f"  Got: {actual}")

print(f"\nCorrect solution: {passed}/{len(question['test_cases'])} tests passed")

# Test WRONG solution 1: Don't sort
print("\n" + "="*50)
print("Testing WRONG solution (no sorting):")

def carFleet(target, position, speed):
    if not position:
        return 0

    # BUG: Not sorted
    cars = zip(position, speed)

    stack = []

    for pos, spd in cars:
        time = (target - pos) / spd

        while stack and time <= stack[-1]:
            stack.pop()

        stack.append(time)

    return len(stack)

wrong1 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = carFleet(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong1 += 1

print(f"Wrong solution 1: {wrong1}/{len(question['test_cases'])} tests passed (should be low)")

# Test WRONG solution 2: Wrong condition (< instead of <=)
print("\n" + "="*50)
print("Testing WRONG solution (wrong comparison):")

def carFleet(target, position, speed):
    if not position:
        return 0

    cars = sorted(zip(position, speed), reverse=True)

    stack = []

    for pos, spd in cars:
        time = (target - pos) / spd

        # BUG: Should be <=, not <
        while stack and time < stack[-1]:
            stack.pop()

        stack.append(time)

    return len(stack)

wrong2 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = carFleet(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong2 += 1

print(f"Wrong solution 2: {wrong2}/{len(question['test_cases'])} tests passed (should fail on equal times)")

# Test WRONG solution 3: Count all cars
print("\n" + "="*50)
print("Testing WRONG solution (returns total cars):")

def carFleet(target, position, speed):
    # BUG: Just returns number of cars
    return len(position)

wrong3 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = carFleet(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong3 += 1

print(f"Wrong solution 3: {wrong3}/{len(question['test_cases'])} tests passed (should be 1-2)")
