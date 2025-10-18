#!/usr/bin/env python3
"""
Batch migration script for moving questions from archive to main.
Automatically detects question types and creates appropriate prepare/verify functions.
"""

import json
import os
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

def create_tree_input_list_output_functions():
    """For tree traversal questions (input: tree, output: list)"""
    prepare = """class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def prepare(test_case_input):
    def build_tree(arr):
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

    root = build_tree(test_case_input['root'])
    return (root,)"""

    verify = """def verify(actual_output, expected_output):
    passed = actual_output == expected_output
    output_str = str(actual_output)
    return [passed, output_str]"""

    return prepare, verify

def create_two_param_functions(param1, param2):
    """For questions with two parameters"""
    prepare = f"""def prepare(test_case_input):
    return (test_case_input['{param1}'], test_case_input['{param2}'])"""

    verify = """def verify(actual_output, expected_output):
    passed = actual_output == expected_output
    output_str = str(actual_output)
    return [passed, output_str]"""

    return prepare, verify

def create_one_param_functions(param_name):
    """For questions with one parameter"""
    prepare = f"""def prepare(test_case_input):
    return (test_case_input['{param_name}'],)"""

    verify = """def verify(actual_output, expected_output):
    passed = actual_output == expected_output
    output_str = str(actual_output)
    return [passed, output_str]"""

    return prepare, verify

def detect_question_type(question_data):
    """Detect question type from test cases"""
    test_case = question_data['test_cases'][0]
    input_keys = list(test_case['input'].keys())

    # Tree traversal questions
    if 'root' in input_keys and isinstance(test_case['output'], list):
        return 'tree_traversal'

    # Two parameter questions
    if len(input_keys) == 2:
        return 'two_param', input_keys[0], input_keys[1]

    # Single parameter questions
    if len(input_keys) == 1:
        return 'one_param', input_keys[0]

    return 'unknown'

def migrate_question(filename):
    """Migrate a single question"""
    archive_path = f'public/archive-questions/{filename}'
    main_path = f'public/questions/{filename}'

    if not os.path.exists(archive_path):
        print(f"✗ {filename}: Not found in archive")
        return False

    print(f"\nMigrating: {filename}")

    # Load question
    with open(archive_path, 'r') as f:
        question_data = json.load(f)

    # Detect question type and create prepare/verify
    question_type = detect_question_type(question_data)

    if question_type == 'tree_traversal':
        print("  Type: Tree Traversal")
        prepare, verify = create_tree_input_list_output_functions()
    elif question_type[0] == 'two_param':
        print(f"  Type: Two Parameters ({question_type[1]}, {question_type[2]})")
        prepare, verify = create_two_param_functions(question_type[1], question_type[2])
    elif question_type[0] == 'one_param':
        print(f"  Type: One Parameter ({question_type[1]})")
        prepare, verify = create_one_param_functions(question_type[1])
    else:
        print("  Type: Unknown - needs manual review")
        return False

    # Add prepare and verify
    question_data['prepare'] = prepare
    question_data['verify'] = verify

    # Save to main questions directory
    with open(main_path, 'w') as f:
        json.dump(question_data, f, indent=2)

    print(f"  ✓ Migrated successfully")
    return True

def main():
    questions_to_migrate = [
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
    print("BATCH MIGRATION")
    print("="*70)

    success_count = 0
    failed = []

    for filename in questions_to_migrate:
        if migrate_question(filename):
            success_count += 1
            # Remove from archive if migration successful
            archive_path = f'public/archive-questions/{filename}'
            os.remove(archive_path)
            print(f"  ✓ Removed from archive")
        else:
            failed.append(filename)

    print("\n" + "="*70)
    print(f"SUMMARY: {success_count}/{len(questions_to_migrate)} migrated successfully")
    print("="*70)

    if failed:
        print(f"\nFailed migrations: {', '.join(failed)}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
