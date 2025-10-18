"""
Stress testing for best-time-to-buy-and-sell-stock-ii

This script tests:
1. The official solution
2. 5 valid alternative solutions
3. 5 invalid solutions (should fail some test cases)
"""

import json

# Load the question data (from migrated version)
with open('public/questions/best-time-to-buy-and-sell-stock-ii.json', 'r') as f:
    question_data = json.load(f)

# Prepare function to extract input parameters
def prepare(test_case_input):
    return (test_case_input['prices'],)

# Verify function to check output
def verify(actual_output, expected_output):
    passed = actual_output == expected_output
    output_str = str(actual_output)
    return [passed, output_str]

# Official solution
def bestTimeToBuyAndSellStockIi_official(prices):
    if not prices or len(prices) < 2:
        return 0

    max_profit = 0

    # Add profit for every price increase
    for i in range(1, len(prices)):
        if prices[i] > prices[i - 1]:
            max_profit += prices[i] - prices[i - 1]

    return max_profit

# VALID SOLUTIONS (5 different correct approaches)

def bestTimeToBuyAndSellStockIi_valid1(prices):
    """Valid: Using one-liner with sum and max"""
    if not prices:
        return 0
    return sum(max(0, prices[i] - prices[i-1]) for i in range(1, len(prices)))

def bestTimeToBuyAndSellStockIi_valid2(prices):
    """Valid: Using while loop instead of for"""
    if len(prices) <= 1:
        return 0

    profit = 0
    i = 1
    while i < len(prices):
        if prices[i] > prices[i-1]:
            profit += prices[i] - prices[i-1]
        i += 1
    return profit

def bestTimeToBuyAndSellStockIi_valid3(prices):
    """Valid: Peak-valley approach"""
    if not prices or len(prices) < 2:
        return 0

    profit = 0
    i = 0

    while i < len(prices) - 1:
        # Find valley
        while i < len(prices) - 1 and prices[i] >= prices[i + 1]:
            i += 1
        valley = prices[i] if i < len(prices) else 0

        # Find peak
        while i < len(prices) - 1 and prices[i] <= prices[i + 1]:
            i += 1
        peak = prices[i] if i < len(prices) else 0

        profit += peak - valley

    return profit

def bestTimeToBuyAndSellStockIi_valid4(prices):
    """Valid: Using enumerate"""
    if not prices or len(prices) == 1:
        return 0

    total = 0
    for i, price in enumerate(prices[1:], 1):
        diff = price - prices[i-1]
        if diff > 0:
            total += diff
    return total

def bestTimeToBuyAndSellStockIi_valid5(prices):
    """Valid: Using zip for pairs"""
    if not prices:
        return 0
    return sum(max(0, b - a) for a, b in zip(prices[:-1], prices[1:]))

# INVALID SOLUTIONS (5 different wrong approaches that should fail)

def bestTimeToBuyAndSellStockIi_invalid1(prices):
    """Invalid: Only takes max - min (misses multiple transactions)"""
    if not prices:
        return 0
    return max(prices) - min(prices) if max(prices) > min(prices) else 0

def bestTimeToBuyAndSellStockIi_invalid2(prices):
    """Invalid: Subtracts consecutive decreases instead of ignoring them"""
    if len(prices) <= 1:
        return 0

    profit = 0
    for i in range(1, len(prices)):
        profit += prices[i] - prices[i - 1]  # BUG: doesn't ignore negative differences

    return profit

def bestTimeToBuyAndSellStockIi_invalid3(prices):
    """Invalid: Only counts first profitable transaction"""
    if len(prices) < 2:
        return 0

    for i in range(1, len(prices)):
        if prices[i] > prices[i-1]:
            return prices[i] - prices[i-1]  # BUG: returns after first profit
    return 0

def bestTimeToBuyAndSellStockIi_invalid4(prices):
    """Invalid: Doubles the profit (wrong math)"""
    if not prices or len(prices) < 2:
        return 0

    max_profit = 0
    for i in range(1, len(prices)):
        if prices[i] > prices[i - 1]:
            max_profit += (prices[i] - prices[i - 1]) * 2  # BUG: multiplies by 2

    return max_profit

def bestTimeToBuyAndSellStockIi_invalid5(prices):
    """Invalid: Off-by-one error in profit calculation"""
    if not prices or len(prices) < 2:
        return 0

    max_profit = 0
    for i in range(len(prices) - 1):  # Correct range
        if prices[i+1] > prices[i]:
            max_profit += prices[i+1] - prices[i] - 1  # BUG: subtracts 1

    return max_profit

# Test all solutions
def test_solution(solution_func, solution_name):
    """Test a solution against all test cases"""
    test_cases = question_data['test_cases']
    passed_count = 0
    failed_cases = []

    print(f"\n{'='*60}")
    print(f"Testing: {solution_name}")
    print(f"{'='*60}")

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
    print(f"\nResult: {passed_count}/{total} passed")

    if failed_cases:
        print(f"Failed test cases: {failed_cases}")

    return passed_count == total

# Run all tests
if __name__ == "__main__":
    print("STRESS TESTING: Best Time to Buy and Sell Stock II")
    print("="*60)

    # Test official solution
    official_pass = test_solution(bestTimeToBuyAndSellStockIi_official, "Official Solution")

    # Test valid solutions
    print("\n\nVALID SOLUTIONS (should all pass):")
    print("="*60)
    valid_solutions = [
        (bestTimeToBuyAndSellStockIi_valid1, "Valid 1: One-liner with sum"),
        (bestTimeToBuyAndSellStockIi_valid2, "Valid 2: While loop"),
        (bestTimeToBuyAndSellStockIi_valid3, "Valid 3: Peak-valley approach"),
        (bestTimeToBuyAndSellStockIi_valid4, "Valid 4: Using enumerate"),
        (bestTimeToBuyAndSellStockIi_valid5, "Valid 5: Using zip"),
    ]

    valid_results = []
    for func, name in valid_solutions:
        result = test_solution(func, name)
        valid_results.append((name, result))

    # Test invalid solutions
    print("\n\nINVALID SOLUTIONS (should fail at least one test):")
    print("="*60)
    invalid_solutions = [
        (bestTimeToBuyAndSellStockIi_invalid1, "Invalid 1: Only max - min"),
        (bestTimeToBuyAndSellStockIi_invalid2, "Invalid 2: Counts decreases"),
        (bestTimeToBuyAndSellStockIi_invalid3, "Invalid 3: Only first transaction"),
        (bestTimeToBuyAndSellStockIi_invalid4, "Invalid 4: Doubles profit"),
        (bestTimeToBuyAndSellStockIi_invalid5, "Invalid 5: Off-by-one error"),
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
        status = "FAIL ✓ (as expected)" if not passed else "PASS ✗ (UNEXPECTED - should have failed!)"
        print(f"  {name}: {status}")

    # Final verdict
    all_valid_pass = all(result for _, result in valid_results)
    all_invalid_fail = all(not result for _, result in invalid_results)

    print("\n" + "="*60)
    if official_pass and all_valid_pass and all_invalid_fail:
        print("VERDICT: Question is ready for migration! ✓")
    else:
        print("VERDICT: Question needs fixes before migration! ✗")
        if not official_pass:
            print("  - Official solution failed")
        if not all_valid_pass:
            print("  - Some valid solutions failed (need to check test cases)")
        if not all_invalid_fail:
            print("  - Some invalid solutions passed (need more/better test cases)")
