import json

with open('public/questions/evaluate-reverse-polish-notation.json', 'r') as f:
    question = json.load(f)

exec(question['prepare'])
exec(question['verify'])

print("Testing CORRECT solution:")
exec(question['solution_code'])

passed = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = evaluateReversePolishNotation(*args)
    result = verify(actual, test_case['output'])

    if result[0]:
        passed += 1
        print(f"✓ Test {test_case['id']} passed")
    else:
        print(f"✗ Test {test_case['id']} FAILED")
        print(f"  Input: {test_case['input']['tokens']}")
        print(f"  Expected: {test_case['output']}")
        print(f"  Got: {actual}")

print(f"\nCorrect solution: {passed}/{len(question['test_cases'])} tests passed")

# Test WRONG solution 1: Wrong pop order
print("\n" + "="*50)
print("Testing WRONG solution (wrong operand order):")

def evaluateReversePolishNotation(tokens):
    stack = []
    operators = {'+', '-', '*', '/'}

    for token in tokens:
        if token in operators:
            # BUG: Wrong order
            a = stack.pop()
            b = stack.pop()

            if token == '+':
                result = a + b
            elif token == '-':
                result = a - b
            elif token == '*':
                result = a * b
            elif token == '/':
                result = int(a / b)

            stack.append(result)
        else:
            stack.append(int(token))

    return stack[0]

wrong1 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = evaluateReversePolishNotation(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong1 += 1

print(f"Wrong solution 1: {wrong1}/{len(question['test_cases'])} tests passed (should be low)")

# Test WRONG solution 2: Return wrong element
print("\n" + "="*50)
print("Testing WRONG solution (return last pushed instead of stack[0]):")

def evaluateReversePolishNotation(tokens):
    stack = []
    operators = {'+', '-', '*', '/'}
    result = 0

    for token in tokens:
        if token in operators:
            b = stack.pop()
            a = stack.pop()

            if token == '+':
                result = a + b
            elif token == '-':
                result = a - b
            elif token == '*':
                result = a * b
            elif token == '/':
                result = int(a / b)

            stack.append(result)
        else:
            result = int(token)
            stack.append(result)

    # BUG: Returns result variable instead of stack[0]
    return result

wrong2 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = evaluateReversePolishNotation(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong2 += 1

print(f"Wrong solution 2: {wrong2}/{len(question['test_cases'])} tests passed (should be high since bug is minor)")

# Test WRONG solution 3: Wrong division
print("\n" + "="*50)
print("Testing WRONG solution (floor division instead of truncate):")

def evaluateReversePolishNotation(tokens):
    stack = []
    operators = {'+', '-', '*', '/'}

    for token in tokens:
        if token in operators:
            b = stack.pop()
            a = stack.pop()

            if token == '+':
                result = a + b
            elif token == '-':
                result = a - b
            elif token == '*':
                result = a * b
            elif token == '/':
                # BUG: Floor division instead of truncate toward zero
                result = a // b

            stack.append(result)
        else:
            stack.append(int(token))

    return stack[0]

wrong3 = 0
for test_case in question['test_cases']:
    args = prepare(test_case['input'])
    actual = evaluateReversePolishNotation(*args)
    result = verify(actual, test_case['output'])
    if result[0]:
        wrong3 += 1

print(f"Wrong solution 3: {wrong3}/{len(question['test_cases'])} tests passed (should fail on negative division)")
