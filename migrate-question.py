#!/usr/bin/env python3
"""
General-purpose question migration and stress testing script.
Handles migrating questions from archive to main with proper validation.
"""

import json
import sys
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

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
    while result and result[-1] is None:
        result.pop()
    return result

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

def construct_tree_from_traversals(preorder, inorder):
    """Construct binary tree from preorder and inorder traversals"""
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
        root.right = build(pre_start + left_size + 1, pre_end, root_idx + 1, in_end)
        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)

def fix_tree_construction_expected_outputs(question_data):
    """Fix expected outputs for tree construction problem"""
    print("Fixing expected outputs using official solution...")
    for test_case in question_data['test_cases']:
        preorder = test_case['input']['preorder']
        inorder = test_case['input']['inorder']
        tree = construct_tree_from_traversals(preorder, inorder)
        correct_output = tree_to_list(tree)
        old_output = test_case['output']
        if correct_output != old_output:
            print(f"  Test {test_case['id']}: {old_output} -> {correct_output}")
            test_case['output'] = correct_output
    return question_data

def create_prepare_verify_for_tree_construction():
    """Create prepare and verify functions for tree construction"""
    prepare = """def prepare(test_case_input):
    return (test_case_input['preorder'], test_case_input['inorder'])"""

    verify = """class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def verify(actual_output, expected_output):
    from collections import deque

    def tree_to_list(root):
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

    actual_list = tree_to_list(actual_output)
    passed = actual_list == expected_output
    output_str = str(actual_list)
    return [passed, output_str]"""

    return prepare, verify

def create_prepare_verify_simple(param_name, return_type="simple"):
    """Create simple prepare and verify functions"""
    prepare = f"""def prepare(test_case_input):
    return (test_case_input['{param_name}'],)"""

    if return_type == "simple":
        verify = """def verify(actual_output, expected_output):
    passed = actual_output == expected_output
    output_str = str(actual_output)
    return [passed, output_str]"""

    return prepare, verify

def migrate_question(filename):
    """Migrate a question from archive to main"""
    archive_path = f'public/archive-questions/{filename}'
    main_path = f'public/questions/{filename}'

    print(f"\n{'='*70}")
    print(f"Migrating: {filename}")
    print(f"{'='*70}")

    # Load question
    with open(archive_path, 'r') as f:
        question_data = json.load(f)

    # Determine question type and create appropriate prepare/verify
    if 'binary-tree' in filename and 'preorder-and-inorder' in filename:
        print("Question type: Binary Tree Construction")
        question_data = fix_tree_construction_expected_outputs(question_data)
        prepare, verify = create_prepare_verify_for_tree_construction()
    else:
        print("Question type: General (needs manual review)")
        # For now, create simple prepare/verify
        # This will need to be customized based on the question
        test_case = question_data['test_cases'][0]
        param_name = list(test_case['input'].keys())[0]
        prepare, verify = create_prepare_verify_simple(param_name)

    # Add prepare and verify
    question_data['prepare'] = prepare
    question_data['verify'] = verify

    # Save to main questions directory
    with open(main_path, 'w') as f:
        json.dump(question_data, f, indent=2)

    print(f"✓ Migrated to {main_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate-question.py <filename>")
        sys.exit(1)

    filename = sys.argv[1]
    if not filename.endswith('.json'):
        filename += '.json'

    success = migrate_question(filename)
    if success:
        print("\n✓ Migration successful!")
    else:
        print("\n✗ Migration failed!")
        sys.exit(1)
