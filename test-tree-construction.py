"""
Stress testing for binary-tree-from-preorder-and-inorder-traversal

This script tests:
1. The official solution
2. 5 valid alternative solutions
3. 5 invalid solutions (should fail some test cases)
"""

import json
from collections import deque

# Load the question data (from migrated version)
with open('public/questions/binary-tree-from-preorder-and-inorder-traversal.json', 'r') as f:
    question_data = json.load(f)

# TreeNode definition
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# Helper functions
def tree_to_list(root):
    """Convert tree to level-order list with nulls"""
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

    # Remove trailing nulls
    while result and result[-1] is None:
        result.pop()

    return result

# Prepare and verify functions
def prepare(test_case_input):
    return (test_case_input['preorder'], test_case_input['inorder'])

def verify(actual_output, expected_output):
    actual_list = tree_to_list(actual_output)
    passed = actual_list == expected_output
    output_str = str(actual_list)
    return [passed, output_str]

# Official solution
def constructBinaryTreeFromPreorderAndInorderTraversal_official(preorder, inorder):
    if not preorder or not inorder:
        return None

    # Create hashmap for O(1) lookups in inorder array
    inorder_map = {val: i for i, val in enumerate(inorder)}

    def build(pre_start, pre_end, in_start, in_end):
        if pre_start > pre_end:
            return None

        # Root is always first element in preorder range
        root_val = preorder[pre_start]
        root = TreeNode(root_val)

        # Find root position in inorder array
        root_idx = inorder_map[root_val]
        left_size = root_idx - in_start

        # Build left and right subtrees
        root.left = build(pre_start + 1, pre_start + left_size, in_start, root_idx - 1)
        root.right = build(pre_start + left_size + 1, pre_end, root_idx + 1, in_end)

        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)

# VALID SOLUTIONS

def constructBinaryTreeFromPreorderAndInorderTraversal_valid1(preorder, inorder):
    """Valid: Using index tracking instead of ranges"""
    if not preorder:
        return None

    inorder_map = {val: i for i, val in enumerate(inorder)}
    pre_idx = [0]  # Use list to make it mutable in nested function

    def build(in_left, in_right):
        if in_left > in_right:
            return None

        root_val = preorder[pre_idx[0]]
        root = TreeNode(root_val)
        pre_idx[0] += 1

        root_idx = inorder_map[root_val]

        root.left = build(in_left, root_idx - 1)
        root.right = build(root_idx + 1, in_right)

        return root

    return build(0, len(inorder) - 1)

def constructBinaryTreeFromPreorderAndInorderTraversal_valid2(preorder, inorder):
    """Valid: Without hashmap (O(n^2) but correct)"""
    if not preorder or not inorder:
        return None

    root_val = preorder[0]
    root = TreeNode(root_val)

    root_idx = inorder.index(root_val)

    root.left = constructBinaryTreeFromPreorderAndInorderTraversal_valid2(
        preorder[1:root_idx+1],
        inorder[:root_idx]
    )
    root.right = constructBinaryTreeFromPreorderAndInorderTraversal_valid2(
        preorder[root_idx+1:],
        inorder[root_idx+1:]
    )

    return root

def constructBinaryTreeFromPreorderAndInorderTraversal_valid3(preorder, inorder):
    """Valid: Iterative approach using stack"""
    if not preorder:
        return None

    root = TreeNode(preorder[0])
    stack = [root]
    inorder_idx = 0

    for i in range(1, len(preorder)):
        current = TreeNode(preorder[i])
        parent = None

        # Find parent for current node
        while stack and stack[-1].val == inorder[inorder_idx]:
            parent = stack.pop()
            inorder_idx += 1

        if parent:
            parent.right = current
        else:
            stack[-1].left = current

        stack.append(current)

    return root

def constructBinaryTreeFromPreorderAndInorderTraversal_valid4(preorder, inorder):
    """Valid: Using deque for efficient popping"""
    from collections import deque

    if not preorder:
        return None

    inorder_map = {val: i for i, val in enumerate(inorder)}
    preorder_deque = deque(preorder)

    def build(in_start, in_end):
        if in_start > in_end or not preorder_deque:
            return None

        root_val = preorder_deque.popleft()
        root = TreeNode(root_val)

        root_idx = inorder_map[root_val]

        root.left = build(in_start, root_idx - 1)
        root.right = build(root_idx + 1, in_end)

        return root

    return build(0, len(inorder) - 1)

def constructBinaryTreeFromPreorderAndInorderTraversal_valid5(preorder, inorder):
    """Valid: Using class variable for preorder index"""
    if not preorder:
        return None

    class Builder:
        def __init__(self):
            self.pre_idx = 0
            self.inorder_map = {val: i for i, val in enumerate(inorder)}

        def build(self, in_left, in_right):
            if in_left > in_right:
                return None

            root_val = preorder[self.pre_idx]
            self.pre_idx += 1
            root = TreeNode(root_val)

            root_idx = self.inorder_map[root_val]

            root.left = self.build(in_left, root_idx - 1)
            root.right = self.build(root_idx + 1, in_right)

            return root

    builder = Builder()
    return builder.build(0, len(inorder) - 1)

# INVALID SOLUTIONS

def constructBinaryTreeFromPreorderAndInorderTraversal_invalid1(preorder, inorder):
    """Invalid: Swaps left and right subtrees"""
    if not preorder or not inorder:
        return None

    inorder_map = {val: i for i, val in enumerate(inorder)}

    def build(pre_start, pre_end, in_start, in_end):
        if pre_start > pre_end:
            return None

        root_val = preorder[pre_start]
        root = TreeNode(root_val)

        root_idx = inorder_map[root_val]
        left_size = root_idx - in_start

        # BUG: Swapped left and right
        root.right = build(pre_start + 1, pre_start + left_size, in_start, root_idx - 1)
        root.left = build(pre_start + left_size + 1, pre_end, root_idx + 1, in_end)

        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)

def constructBinaryTreeFromPreorderAndInorderTraversal_invalid2(preorder, inorder):
    """Invalid: Off-by-one in left subtree size"""
    if not preorder or not inorder:
        return None

    inorder_map = {val: i for i, val in enumerate(inorder)}

    def build(pre_start, pre_end, in_start, in_end):
        if pre_start > pre_end:
            return None

        root_val = preorder[pre_start]
        root = TreeNode(root_val)

        root_idx = inorder_map[root_val]
        left_size = root_idx - in_start + 1  # BUG: Added 1

        root.left = build(pre_start + 1, pre_start + left_size, in_start, root_idx - 1)
        root.right = build(pre_start + left_size + 1, pre_end, root_idx + 1, in_end)

        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)

def constructBinaryTreeFromPreorderAndInorderTraversal_invalid3(preorder, inorder):
    """Invalid: Uses wrong element from preorder as root"""
    if not preorder or not inorder:
        return None

    inorder_map = {val: i for i, val in enumerate(inorder)}

    def build(pre_start, pre_end, in_start, in_end):
        if pre_start > pre_end:
            return None

        # BUG: Uses last element instead of first
        root_val = preorder[pre_end]
        root = TreeNode(root_val)

        root_idx = inorder_map[root_val]
        left_size = root_idx - in_start

        root.left = build(pre_start + 1, pre_start + left_size, in_start, root_idx - 1)
        root.right = build(pre_start + left_size + 1, pre_end, root_idx + 1, in_end)

        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)

def constructBinaryTreeFromPreorderAndInorderTraversal_invalid4(preorder, inorder):
    """Invalid: Doesn't build left subtree"""
    if not preorder or not inorder:
        return None

    inorder_map = {val: i for i, val in enumerate(inorder)}

    def build(pre_start, pre_end, in_start, in_end):
        if pre_start > pre_end:
            return None

        root_val = preorder[pre_start]
        root = TreeNode(root_val)

        root_idx = inorder_map[root_val]
        left_size = root_idx - in_start

        # BUG: Only builds right subtree
        root.right = build(pre_start + left_size + 1, pre_end, root_idx + 1, in_end)

        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)

def constructBinaryTreeFromPreorderAndInorderTraversal_invalid5(preorder, inorder):
    """Invalid: Wrong range calculation for right subtree"""
    if not preorder or not inorder:
        return None

    inorder_map = {val: i for i, val in enumerate(inorder)}

    def build(pre_start, pre_end, in_start, in_end):
        if pre_start > pre_end:
            return None

        root_val = preorder[pre_start]
        root = TreeNode(root_val)

        root_idx = inorder_map[root_val]
        left_size = root_idx - in_start

        root.left = build(pre_start + 1, pre_start + left_size, in_start, root_idx - 1)
        # BUG: Wrong start index for right subtree
        root.right = build(pre_start + left_size, pre_end, root_idx + 1, in_end)

        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)

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
                print(f"✗ Test {test_case['id']}: FAIL")
                print(f"  Expected: {expected}")
                print(f"  Got: {output_str}")
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
    print("STRESS TESTING: Construct Binary Tree from Preorder and Inorder Traversal")
    print("="*60)

    # Test official solution
    official_pass = test_solution(constructBinaryTreeFromPreorderAndInorderTraversal_official, "Official Solution")

    # Test valid solutions
    print("\n\nVALID SOLUTIONS (should all pass):")
    print("="*60)
    valid_solutions = [
        (constructBinaryTreeFromPreorderAndInorderTraversal_valid1, "Valid 1: Index tracking"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_valid2, "Valid 2: No hashmap"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_valid3, "Valid 3: Iterative stack"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_valid4, "Valid 4: Using deque"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_valid5, "Valid 5: Class variable"),
    ]

    valid_results = []
    for func, name in valid_solutions:
        result = test_solution(func, name)
        valid_results.append((name, result))

    # Test invalid solutions
    print("\n\nINVALID SOLUTIONS (should fail at least one test):")
    print("="*60)
    invalid_solutions = [
        (constructBinaryTreeFromPreorderAndInorderTraversal_invalid1, "Invalid 1: Swapped subtrees"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_invalid2, "Invalid 2: Off-by-one"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_invalid3, "Invalid 3: Wrong root"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_invalid4, "Invalid 4: No left subtree"),
        (constructBinaryTreeFromPreorderAndInorderTraversal_invalid5, "Invalid 5: Wrong right range"),
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
