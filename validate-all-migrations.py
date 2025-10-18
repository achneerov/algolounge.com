#!/usr/bin/env python3
"""
Comprehensive validation framework for all migrated questions.
Tests the official solution against all test cases to ensure correctness.
"""

import json
import sys
from collections import deque

# TreeNode definition for tree problems
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree_from_list(arr):
    """Build tree from level-order list"""
    if not arr:
        return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def tree_to_list(root):
    """Convert tree to level-order list"""
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

def validate_question(filename):
    """Validate a single question by running official solution against test cases"""
    filepath = f'public/questions/{filename}'

    print(f"\n{'='*70}")
    print(f"Validating: {filename}")
    print(f"{'='*70}")

    try:
        with open(filepath, 'r') as f:
            question_data = json.load(f)
    except FileNotFoundError:
        print(f"✗ ERROR: File not found: {filepath}")
        return False, []

    # Extract the solution code
    solution_code = question_data.get('solution_code', '')
    prepare_code = question_data.get('prepare', '')
    verify_code = question_data.get('verify', '')

    if not solution_code:
        print("✗ ERROR: No solution_code found")
        return False, []

    if not prepare_code:
        print("✗ ERROR: No prepare function found")
        return False, []

    if not verify_code:
        print("✗ ERROR: No verify function found")
        return False, []

    # Create execution environment
    exec_env = {
        'TreeNode': TreeNode,
        'deque': deque,
    }

    # Execute the solution code
    try:
        exec(solution_code, exec_env)
        exec(prepare_code, exec_env)
        exec(verify_code, exec_env)
    except Exception as e:
        print(f"✗ ERROR: Failed to execute code: {e}")
        return False, []

    # Get the entry function
    entry_function_name = question_data.get('entry_function')
    if not entry_function_name or entry_function_name not in exec_env:
        print(f"✗ ERROR: Entry function '{entry_function_name}' not found")
        return False, []

    solution_func = exec_env[entry_function_name]
    prepare_func = exec_env['prepare']
    verify_func = exec_env['verify']

    # Test against all test cases
    test_cases = question_data.get('test_cases', [])
    if not test_cases:
        print("✗ ERROR: No test cases found")
        return False, []

    print(f"Running {len(test_cases)} test cases...")

    passed_count = 0
    failed_tests = []

    for test_case in test_cases:
        test_id = test_case.get('id', '?')
        try:
            # Prepare inputs
            inputs = prepare_func(test_case['input'])
            expected = test_case['output']

            # Run solution
            actual = solution_func(*inputs)

            # Verify output
            passed, output_str = verify_func(actual, expected)

            if passed:
                passed_count += 1
                print(f"  ✓ Test {test_id}: PASS")
            else:
                failed_tests.append({
                    'id': test_id,
                    'input': test_case['input'],
                    'expected': expected,
                    'actual': actual,
                    'output_str': output_str
                })
                print(f"  ✗ Test {test_id}: FAIL")
                print(f"      Input: {test_case['input']}")
                print(f"      Expected: {expected}")
                print(f"      Got: {actual}")
        except Exception as e:
            failed_tests.append({
                'id': test_id,
                'input': test_case['input'],
                'error': str(e)
            })
            print(f"  ✗ Test {test_id}: ERROR - {e}")

    total = len(test_cases)
    success = passed_count == total

    print(f"\nResult: {passed_count}/{total} tests passed")

    if success:
        print("✓ Question VALIDATED")
    else:
        print(f"✗ Question FAILED - {len(failed_tests)} test(s) failed")

    return success, failed_tests

def main():
    """Validate all migrated questions"""
    questions = [
        'best-time-to-buy-and-sell-stock-ii.json',
        'binary-tree-from-preorder-and-inorder-traversal.json',
        'binary-tree-postorder-traversal.json',
        'binary-tree-preorder-traversal.json',
        'binary-tree-right-side-view.json',
        'boats-to-save-people.json',
        'bitwise-and-of-numbers-range.json',
        'burst-balloons.json',
        'candy.json',
        'car-pooling.json',
    ]

    print("="*70)
    print("COMPREHENSIVE VALIDATION OF ALL MIGRATED QUESTIONS")
    print("="*70)

    results = {}
    all_failed_tests = {}

    for question_file in questions:
        success, failed_tests = validate_question(question_file)
        results[question_file] = success
        if failed_tests:
            all_failed_tests[question_file] = failed_tests

    # Summary
    print("\n\n" + "="*70)
    print("VALIDATION SUMMARY")
    print("="*70)

    passed_questions = []
    failed_questions = []

    for question_file, success in results.items():
        question_name = question_file.replace('.json', '')
        if success:
            passed_questions.append(question_name)
            print(f"✓ {question_name}")
        else:
            failed_questions.append(question_name)
            print(f"✗ {question_name}")

    print(f"\n{len(passed_questions)}/{len(questions)} questions validated successfully")

    if failed_questions:
        print(f"\n{'='*70}")
        print("FAILED QUESTIONS - NEED FIXES:")
        print(f"{'='*70}")
        for question_name in failed_questions:
            question_file = question_name + '.json'
            print(f"\n{question_name}:")
            if question_file in all_failed_tests:
                for failed_test in all_failed_tests[question_file]:
                    print(f"  Test {failed_test['id']}: ", end='')
                    if 'error' in failed_test:
                        print(f"ERROR - {failed_test['error']}")
                    else:
                        print(f"Expected {failed_test['expected']}, got {failed_test['actual']}")
        return 1

    print("\n✓ ALL QUESTIONS VALIDATED SUCCESSFULLY!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
