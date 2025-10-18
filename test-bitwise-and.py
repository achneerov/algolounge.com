"""
Stress test for bitwise-and-of-numbers-range
"""

import json

# Load the question data
with open('public/questions/bitwise-and-of-numbers-range.json', 'r') as f:
    question_data = json.load(f)

# Prepare and verify functions
def prepare(test_case_input):
    return (test_case_input['left'], test_case_input['right'])

def verify(actual_output, expected_output):
    passed = actual_output == expected_output
    output_str = str(actual_output)
    return [passed, output_str]

# Official solution
def bitwiseAndOfNumbersRange_official(left, right):
    shift = 0
    while left != right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift

# VALID SOLUTIONS

def bitwiseAndOfNumbersRange_valid1(left, right):
    """Valid: Using Brian Kernighan's algorithm"""
    while right > left:
        right = right & (right - 1)
    return right

def bitwiseAndOfNumbersRange_valid2(left, right):
    """Valid: Bit by bit comparison"""
    result = 0
    for bit in range(31, -1, -1):
        mask = 1 << bit
        if (left & mask) != (right & mask):
            break
        result |= (left & mask)
    return result

def bitwiseAndOfNumbersRange_valid3(left, right):
    """Valid: Find common prefix with bit manipulation"""
    shift = 0
    while left < right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift

def bitwiseAndOfNumbersRange_valid4(left, right):
    """Valid: Using XOR to find differing bits"""
    xor = left ^ right
    bit = 31
    while bit >= 0 and not (xor & (1 << bit)):
        bit -= 1
    if bit < 0:
        return left
    mask = ~((1 << (bit + 1)) - 1)
    return left & mask

def bitwiseAndOfNumbersRange_valid5(left, right):
    """Valid: Iterative approach with early termination"""
    if left == 0:
        return 0
    moveFactor = 1
    while left != right:
        left >>= 1
        right >>= 1
        moveFactor <<= 1
    return left * moveFactor

# INVALID SOLUTIONS

def bitwiseAndOfNumbersRange_invalid1(left, right):
    """Invalid: Naive brute force (too slow and wrong for large ranges)"""
    if right - left > 1000:  # Prevent timeout
        return 0
    result = left
    for num in range(left + 1, right + 1):
        result &= num
    return result

def bitwiseAndOfNumbersRange_invalid2(left, right):
    """Invalid: Only ANDs left and right"""
    return left & right

def bitwiseAndOfNumbersRange_invalid3(left, right):
    """Invalid: Off-by-one in shift"""
    shift = 0
    while left != right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << (shift - 1)  # BUG: subtracts 1

def bitwiseAndOfNumbersRange_invalid4(left, right):
    """Invalid: Wrong bit manipulation"""
    shift = 0
    while left < right:
        left >>= 1
        right >>= 1
        shift += 1
    return right << shift  # BUG: uses right instead of left

def bitwiseAndOfNumbersRange_invalid5(left, right):
    """Invalid: Doesn't handle single number case"""
    if left == right:
        return 0  # BUG: should return left
    shift = 0
    while left != right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift

# Test all solutions
def test_solution(solution_func, solution_name):
    """Test a solution against all test cases"""
    test_cases = question_data['test_cases']
    passed_count = 0
    failed_cases = []

    print(f"\nTesting: {solution_name}")
    print("-" * 60)

    for test_case in test_cases:
        inputs = prepare(test_case['input'])
        expected = test_case['output']

        try:
            actual = solution_func(*inputs)
            passed, output_str = verify(actual, expected)

            if passed:
                passed_count += 1
                print(f"✓ Test {test_case['id']}: PASS")
            else:
                failed_cases.append(test_case['id'])
                print(f"✗ Test {test_case['id']}: FAIL (expected: {expected}, got: {actual})")
        except Exception as e:
            failed_cases.append(test_case['id'])
            print(f"✗ Test {test_case['id']}: ERROR - {str(e)}")

    total = len(test_cases)
    print(f"Result: {passed_count}/{total} passed")
    return passed_count == total

# Run all tests
if __name__ == "__main__":
    print("STRESS TESTING: Bitwise AND of Numbers Range")
    print("="*60)

    # Test official solution
    official_pass = test_solution(bitwiseAndOfNumbersRange_official, "Official Solution")

    # Test valid solutions
    print("\n\nVALID SOLUTIONS (should all pass):")
    print("="*60)
    valid_solutions = [
        (bitwiseAndOfNumbersRange_valid1, "Valid 1: Brian Kernighan's algorithm"),
        (bitwiseAndOfNumbersRange_valid2, "Valid 2: Bit by bit comparison"),
        (bitwiseAndOfNumbersRange_valid3, "Valid 3: Common prefix"),
        (bitwiseAndOfNumbersRange_valid4, "Valid 4: Using XOR"),
        (bitwiseAndOfNumbersRange_valid5, "Valid 5: Iterative"),
    ]

    valid_results = []
    for func, name in valid_solutions:
        result = test_solution(func, name)
        valid_results.append((name, result))

    # Test invalid solutions
    print("\n\nINVALID SOLUTIONS (should fail at least one test):")
    print("="*60)
    invalid_solutions = [
        (bitwiseAndOfNumbersRange_invalid1, "Invalid 1: Brute force"),
        (bitwiseAndOfNumbersRange_invalid2, "Invalid 2: Only ANDs left & right"),
        (bitwiseAndOfNumbersRange_invalid3, "Invalid 3: Off-by-one shift"),
        (bitwiseAndOfNumbersRange_invalid4, "Invalid 4: Uses right instead of left"),
        (bitwiseAndOfNumbersRange_invalid5, "Invalid 5: Wrong single number case"),
    ]

    invalid_results = []
    for func, name in invalid_solutions:
        result = test_solution(func, name)
        invalid_results.append((name, result))

    # Summary
    print("\n\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    print(f"\nOfficial Solution: {'PASS ✓' if official_pass else 'FAIL ✗'}")

    print("\nValid Solutions:")
    for name, passed in valid_results:
        status = "PASS ✓" if passed else "FAIL ✗ (UNEXPECTED!)"
        print(f"  {name}: {status}")

    print("\nInvalid Solutions:")
    for name, passed in invalid_results:
        status = "FAIL ✓ (as expected)" if not passed else "PASS ✗ (UNEXPECTED!)"
        print(f"  {name}: {status}")

    # Final verdict
    all_valid_pass = all(result for _, result in valid_results)
    all_invalid_fail = all(not result for _, result in invalid_results)

    print("\n" + "="*60)
    if official_pass and all_valid_pass and all_invalid_fail:
        print("VERDICT: Question validated! ✓")
    else:
        print("VERDICT: Issues detected! ✗")
