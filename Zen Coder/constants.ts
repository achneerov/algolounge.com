import type { Question, Course, ProgressData, ActivityLog, Achievement } from './types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]"
      }
    ],
    starterCode: `def twoSum(nums, target):
    # Your code here
    pass
`,
    solutionCode: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
`,
    solutionExplanation: "This solution uses a hash map (or dictionary in Python) to achieve a single-pass O(n) time complexity. By storing numbers it has already seen, it can instantly check if the complement of the current number exists in the map.",
    solutionInDepth: `
**The Core Idea:**
The brute-force approach would be to check every pair of numbers, which is slow (O(n²)). We can do much better by using a hash map, which provides constant-time O(1) lookups. The goal is to trade a little bit of space (for the hash map) to gain a lot of time.

**Step-by-Step Breakdown:**
1.  **Initialize a Hash Map:** We create an empty hash map called \`seen\`. This map will store the numbers we have encountered so far as keys and their corresponding indices as values. (e.g., \`{number: index}\`).
2.  **Iterate Through the Array:** We loop through the \`nums\` array once, keeping track of both the index (\`i\`) and the value (\`num\`).
3.  **Calculate the Complement:** For each number \`num\`, we calculate the difference required to reach the target: \`diff = target - num\`. This \`diff\` is the number we need to find in the rest of the array.
4.  **Check the Hash Map:** Here's the magic. We check if this \`diff\` already exists as a key in our \`seen\` map.
    *   If **it exists**, it means we have found our pair! The value associated with \`seen[diff]\` is the index of the first number, and the current index \`i\` is the index of the second number. We can immediately return \`[seen[diff], i]\`.
    *   If **it does not exist**, it means we haven't found the pair yet.
5.  **Store the Current Number:** We add the current number and its index to the \`seen\` map: \`seen[num] = i\`. This prepares us for future iterations. If a later number needs the current number to form a pair, it will find it in the map.

**Complexity Analysis:**
*   **Time Complexity: O(n)** because we iterate through the array of 'n' elements only once. Each lookup and insertion in the hash map takes, on average, O(1) time.
*   **Space Complexity: O(n)** because, in the worst-case scenario, we might have to store all 'n' elements in the hash map.
`,
    hint: "Consider using a hash map to store the numbers you've seen and their indices. For each number, check if its complement (target - number) is already in the map.",
    tags: ['Array', 'Hash Table']
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: "true"
      },
      {
        input: 's = "()[]{}"',
        output: "true"
      },
      {
        input: 's = "(]"',
        output: "false"
      }
    ],
    starterCode: `def isValid(s):
    # Your code here
    pass
`,
    solutionCode: `def isValid(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack
`,
    solutionExplanation: "This problem is a perfect use case for a stack. When we see an opening bracket, we push it onto the stack. When we encounter a closing bracket, we check if the top of the stack is the corresponding opening bracket. If it is, we pop the stack; otherwise, the string is invalid.",
    solutionInDepth: `
**The Core Idea:**
This problem is all about order and pairing. The Last-In, First-Out (LIFO) behavior of a stack is ideal for this. The most recently opened bracket must be the first one to be closed.

**Step-by-Step Breakdown:**
1.  **Initialize a Stack:** We'll use a list as our \`stack\`.
2.  **Define Bracket Mappings:** A hash map is useful to store the relationship between closing and opening brackets, like \`{ ")": "(" }\`. This makes checking for pairs easy.
3.  **Iterate Through the String:** We loop through each character (\`char\`) in the input string \`s\`.
4.  **Handle Closing Brackets:** If the current \`char\` is a closing bracket (i.e., it's a key in our \`mapping\`), we need to check for a match.
    *   First, we check if the stack is empty. If it is, there's no opening bracket to match with, so the string is invalid. We pop from the stack.
    *   We compare the popped element with the value from our mapping (e.g., for ')', we expect '('). If they don't match, the order is wrong, and the string is invalid.
5.  **Handle Opening Brackets:** If the current \`char\` is an opening bracket (i.e., not a key in our \`mapping\`), we simply push it onto the stack. We're "opening" a new pair that needs to be closed later.
6.  **Final Check:** After the loop finishes, a valid string will have an empty stack. This is because every opening bracket would have been matched with a closing bracket and popped off. If the stack is not empty, it means there are unclosed opening brackets, so the string is invalid. We return \`not stack\`.

**Complexity Analysis:**
*   **Time Complexity: O(n)** because we traverse the given string of length 'n' only once.
*   **Space Complexity: O(n)** because, in the worst-case scenario (e.g., "(((((")), we push all the brackets onto the stack.
`,
    hint: "A stack is a great data structure for this problem. When you see an opening bracket, push it onto the stack. When you see a closing bracket, what should you check for at the top of the stack?",
    tags: ['Stack', 'String']
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'dsa-fundamentals',
    title: 'DSA Fundamentals 2025',
    description: 'A comprehensive look at the fundamental data structures and algorithms needed for coding interviews.',
    sections: [
      {
        id: 'week-1',
        title: 'Week 1: Arrays & Hashing',
        description: 'Introduction to basic data structures.',
        questions: MOCK_QUESTIONS,
      },
      {
        id: 'week-2',
        title: 'Week 2: Two Pointers',
        description: 'Learn techniques for efficient traversal and problem solving.',
        questions: [],
      },
       {
        id: 'week-3',
        title: 'Week 3: Stacks',
        description: 'Understand the Last-In-First-Out (LIFO) principle and its applications.',
        questions: MOCK_QUESTIONS.filter(q => q.id === 'valid-parentheses'),
      }
    ]
  },
  {
    id: 'advanced-algorithms',
    title: 'Advanced Algorithms',
    description: 'Dive deep into complex algorithms and problem-solving patterns.',
    sections: []
  }
];

export const MOTIVATIONAL_QUOTES: string[] = [
    "The journey of a thousand miles begins with a single step. Solve one problem today.",
    "Don't watch the clock; do what it does. Keep going. Your streak is waiting.",
    "Success is the sum of small efforts, repeated day in and day out. Let's add one more.",
    "The expert in anything was once a beginner. Keep learning, keep growing.",
    "Push yourself, because no one else is going to do it for you. One problem is all it takes.",
    "Doubt kills more dreams than failure ever will. Believe in your skills and solve a problem.",
    "The secret of getting ahead is getting started. Let's start with one question."
];

// --- MOCK PROGRESS DATA ---

function generateMockActivity(days: number, streak: number): ActivityLog[] {
  const activity: ActivityLog[] = [];
  const today = new Date();
  
  // Create the current streak
  for (let i = 0; i < streak; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    activity.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 3) + 1, // 1 to 3 problems
    });
  }

  // Generate random activity for the rest of the days
  for (let i = streak; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Add activity with a certain probability
    if (Math.random() > 0.4) {
      activity.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5) + 1, // 1 to 5 problems
      });
    }
  }
  return activity;
}

const CURRENT_STREAK = 12;

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'streak-5', name: 'On Fire!', description: 'Maintain a 5-day streak.', unlocked: true, icon: 'flame' },
  { id: 'streak-10', name: 'Unstoppable', description: 'Maintain a 10-day streak.', unlocked: true, icon: 'flame' },
  { id: 'streak-30', name: 'Committed Coder', description: 'Maintain a 30-day streak.', unlocked: false, icon: 'flame' },
  { id: 'solve-1', name: 'First Step', description: 'Solve your first problem.', unlocked: true, icon: 'check-circle' },
  { id: 'solve-100', name: 'Century Club', description: 'Solve 100 problems.', unlocked: true, icon: 'trophy' },
  { id: 'solve-500', name: 'Algo Master', description: 'Solve 500 problems.', unlocked: false, icon: 'trophy' },
  { id: 'arrays-master', name: 'Array Architect', description: 'Reach 80% mastery in Arrays.', unlocked: true, icon: 'target' },
  { id: 'hashing-master', name: 'Hash Hero', description: 'Reach 80% mastery in Hashing.', unlocked: true, icon: 'target' },
  { id: 'graphs-master', name: 'Graph Guru', description: 'Reach 80% mastery in Graphs.', unlocked: false, icon: 'target' },
];


export const MOCK_PROGRESS_DATA: ProgressData = {
  currentStreak: CURRENT_STREAK,
  longestStreak: 48,
  totalSolved: 312,
  level: 18,
  xp: 1250,
  xpToNextLevel: 2000,
  rank: 'Code Artisan',
  activity: generateMockActivity(365, CURRENT_STREAK),
  skills: [
    { name: 'Arrays', level: 85 },
    { name: 'Strings', level: 70 },
    { name: 'Hashing', level: 90 },
    { name: 'Stacks', level: 60 },
    { name: 'Graphs', level: 45 },
    { name: 'DP', level: 55 },
  ],
  reviews: [
    { topic: 'Two Pointers', nextReviewDate: '2024-07-28', lastReviewed: '2024-07-21' },
    { topic: 'Kadane\'s Algorithm', nextReviewDate: '2024-07-29', lastReviewed: '2024-07-15' },
    { topic: 'BFS on Grids', nextReviewDate: '2024-08-01', lastReviewed: '2024-07-10' },
    { topic: 'Topological Sort', nextReviewDate: '2024-08-05', lastReviewed: '2024-06-30' },
  ],
  achievements: MOCK_ACHIEVEMENTS,
};