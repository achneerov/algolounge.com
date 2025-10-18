# Trace the buggy solution step by step
def asteroidCollision(asteroids):
    stack = []
    for asteroid in asteroids:
        print(f"\nProcessing {asteroid}, stack before: {stack}")
        if asteroid > 0:
            print(f"  Positive: append {asteroid}")
            stack.append(asteroid)
        else:
            print(f"  Negative: checking collisions")
            while stack and stack[-1] > 0 and stack[-1] < -asteroid:
                popped = stack.pop()
                print(f"    Popped {popped}")
        # BUG: These run for ALL asteroids
        print(f"  After main logic, stack: {stack}")
        if not stack or stack[-1] < 0:
            print(f"  Condition met: appending {asteroid}")
            stack.append(asteroid)
        elif stack[-1] == -asteroid:
            print(f"  Equal collision: popping {stack[-1]}")
            stack.pop()
        print(f"  Final stack: {stack}")
    return stack

print("Test [5, 10]:")
result = asteroidCollision([5, 10])
print(f"Result: {result}")
print(f"Expected: [5, 10]")
