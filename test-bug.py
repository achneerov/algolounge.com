import json

with open('public/questions/asteroid-collision.json', 'r') as f:
    question = json.load(f)

exec(question['prepare'])
exec(question['verify'])

# Buggy solution
def asteroidCollision(asteroids):
    stack = []
    for asteroid in asteroids:
        if asteroid > 0:
            stack.append(asteroid)
        else:
            while stack and stack[-1] > 0 and stack[-1] < -asteroid:
                stack.pop()
        # BUG: These are outside the else block
        if not stack or stack[-1] < 0:
            stack.append(asteroid)
        elif stack[-1] == -asteroid:
            stack.pop()
    return stack

failed = []
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = asteroidCollision(*args)
    result = verify(actual, test_case['output'])
    if not result[0]:
        failed.append(test_case['id'])
        print(f"Test {test_case['id']}: {test_case['input']['asteroids']}")
        print(f"  Expected: {test_case['output']}")
        print(f"  Got: {actual}")

print(f"\nFailed: {len(failed)}/{len(question['test_cases'])}")
