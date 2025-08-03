#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Specific Solution Generator for Common LeetCode Problems
 * Generates actual working solutions for specific well-known problems
 */

class SpecificSolutionGenerator {
    constructor() {
        this.questionsDir = './public/250list';
        this.processedCount = 0;
        this.failedCount = 0;
        
        // Map specific problem names to their solutions
        this.specificSolutions = new Map();
        this.initializeSpecificSolutions();
    }

    initializeSpecificSolutions() {
        // Two Sum - Classic hash map solution
        this.specificSolutions.set('two-integer-sum', {
            explanation: `Efficient Two Sum solution using hash map approach:

**Algorithm:**
1. Create a hash map to store number complements
2. For each number, check if its complement exists in the map
3. If found, return the indices; otherwise, store current number and index

**Time Complexity:** O(n) - single pass through array
**Space Complexity:** O(n) - hash map storage

**Key Insights:**
- Hash map allows O(1) lookup time
- Only need to check each element once
- Return indices in ascending order as required`,

            solutions: {
                python: `def twoSum(nums, target):
    # Hash map to store number -> index mapping
    num_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        # Check if complement exists in map
        if complement in num_map:
            return [num_map[complement], i]
        
        # Store current number and its index
        num_map[num] = i
    
    # Should not reach here given problem constraints
    return []`,

                javascript: `function twoSum(nums, target) {
    // Hash map to store number -> index mapping
    const numMap = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        // Check if complement exists in map
        if (numMap.has(complement)) {
            return [numMap.get(complement), i];
        }
        
        // Store current number and its index
        numMap.set(nums[i], i);
    }
    
    // Should not reach here given problem constraints
    return [];
}`,

                typescript: `function twoSum(nums: number[], target: number): number[] {
    // Hash map to store number -> index mapping
    const numMap = new Map<number, number>();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        // Check if complement exists in map
        if (numMap.has(complement)) {
            return [numMap.get(complement)!, i];
        }
        
        // Store current number and its index
        numMap.set(nums[i], i);
    }
    
    // Should not reach here given problem constraints
    return [];
}`,

                java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Hash map to store number -> index mapping
        Map<Integer, Integer> numMap = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            // Check if complement exists in map
            if (numMap.containsKey(complement)) {
                return new int[]{numMap.get(complement), i};
            }
            
            // Store current number and its index
            numMap.put(nums[i], i);
        }
        
        // Should not reach here given problem constraints
        return new int[0];
    }
}`
            }
        });

        // Binary Search
        this.specificSolutions.set('binary-search', {
            explanation: `Classic Binary Search implementation:

**Algorithm:**
1. Initialize left and right pointers to array bounds
2. While left <= right, calculate middle index
3. Compare middle element with target
4. Adjust search space based on comparison

**Time Complexity:** O(log n) - halves search space each iteration
**Space Complexity:** O(1) - constant extra space

**Key Insights:**
- Requires sorted input array
- Avoids integer overflow with left + (right - left) // 2
- Returns -1 if target not found`,

            solutions: {
                python: `def binarySearch(nums, target):
    left, right = 0, len(nums) - 1
    
    while left <= right:
        # Avoid integer overflow
        mid = left + (right - left) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`,

                javascript: `function binarySearch(nums, target) {
    let left = 0, right = nums.length - 1;
    
    while (left <= right) {
        // Avoid integer overflow
        const mid = left + Math.floor((right - left) / 2);
        
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}`,

                typescript: `function binarySearch(nums: number[], target: number): number {
    let left = 0, right = nums.length - 1;
    
    while (left <= right) {
        // Avoid integer overflow
        const mid = left + Math.floor((right - left) / 2);
        
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}`,

                java: `class Solution {
    public int binarySearch(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        
        while (left <= right) {
            // Avoid integer overflow
            int mid = left + (right - left) / 2;
            
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return -1;
    }
}`
            }
        });

        // Valid Parentheses
        this.specificSolutions.set('validate-parentheses', {
            explanation: `Parentheses validation using stack data structure:

**Algorithm:**
1. Use stack to track opening brackets
2. For each character, if opening bracket, push to stack
3. If closing bracket, check if matches top of stack
4. String is valid if stack is empty at end

**Time Complexity:** O(n) - single pass through string
**Space Complexity:** O(n) - stack storage in worst case

**Key Insights:**
- Stack naturally handles nested structure
- Early return false for unmatched closing brackets
- Must check stack emptiness at end`,

            solutions: {
                python: `def validateParentheses(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            # Closing bracket
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            # Opening bracket
            stack.append(char)
    
    return len(stack) == 0`,

                javascript: `function validateParentheses(s) {
    const stack = [];
    const mapping = {')': '(', '}': '{', ']': '['};
    
    for (const char of s) {
        if (char in mapping) {
            // Closing bracket
            if (stack.length === 0 || stack.pop() !== mapping[char]) {
                return false;
            }
        } else {
            // Opening bracket
            stack.push(char);
        }
    }
    
    return stack.length === 0;
}`,

                typescript: `function validateParentheses(s: string): boolean {
    const stack: string[] = [];
    const mapping: {[key: string]: string} = {')': '(', '}': '{', ']': '['};
    
    for (const char of s) {
        if (char in mapping) {
            // Closing bracket
            if (stack.length === 0 || stack.pop() !== mapping[char]) {
                return false;
            }
        } else {
            // Opening bracket
            stack.push(char);
        }
    }
    
    return stack.length === 0;
}`,

                java: `class Solution {
    public boolean validateParentheses(String s) {
        Stack<Character> stack = new Stack<>();
        Map<Character, Character> mapping = new HashMap<>();
        mapping.put(')', '(');
        mapping.put('}', '{');
        mapping.put(']', '[');
        
        for (char c : s.toCharArray()) {
            if (mapping.containsKey(c)) {
                // Closing bracket
                if (stack.isEmpty() || stack.pop() != mapping.get(c)) {
                    return false;
                }
            } else {
                // Opening bracket
                stack.push(c);
            }
        }
        
        return stack.isEmpty();
    }
}`
            }
        });

        // Maximum Subarray (Kadane's Algorithm)
        this.specificSolutions.set('maximum-subarray', {
            explanation: `Kadane's Algorithm for Maximum Subarray problem:

**Algorithm:**
1. Initialize max_sum to first element and current_sum to 0
2. For each element, add it to current_sum
3. Update max_sum if current_sum is greater
4. If current_sum becomes negative, reset to 0

**Time Complexity:** O(n) - single pass through array
**Space Complexity:** O(1) - constant extra space

**Key Insights:**
- Dynamic programming approach
- Negative prefixes are discarded
- Handles all negative arrays correctly`,

            solutions: {
                python: `def maximumSubarray(nums):
    if not nums:
        return 0
    
    max_sum = nums[0]
    current_sum = 0
    
    for num in nums:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    
    return max_sum`,

                javascript: `function maximumSubarray(nums) {
    if (!nums || nums.length === 0) return 0;
    
    let maxSum = nums[0];
    let currentSum = 0;
    
    for (const num of nums) {
        currentSum = Math.max(num, currentSum + num);
        maxSum = Math.max(maxSum, currentSum);
    }
    
    return maxSum;
}`,

                typescript: `function maximumSubarray(nums: number[]): number {
    if (!nums || nums.length === 0) return 0;
    
    let maxSum = nums[0];
    let currentSum = 0;
    
    for (const num of nums) {
        currentSum = Math.max(num, currentSum + num);
        maxSum = Math.max(maxSum, currentSum);
    }
    
    return maxSum;
}`,

                java: `class Solution {
    public int maximumSubarray(int[] nums) {
        if (nums == null || nums.length == 0) return 0;
        
        int maxSum = nums[0];
        int currentSum = 0;
        
        for (int num : nums) {
            currentSum = Math.max(num, currentSum + num);
            maxSum = Math.max(maxSum, currentSum);
        }
        
        return maxSum;
    }
}`
            }
        });

        // Climbing Stairs (Dynamic Programming)
        this.specificSolutions.set('climbing-stairs', {
            explanation: `Dynamic Programming solution for Climbing Stairs:

**Algorithm:**
1. Base cases: 1 way to reach step 0 or 1
2. For each step, ways = ways(n-1) + ways(n-2)
3. Use space optimization with two variables

**Time Complexity:** O(n) - linear iteration
**Space Complexity:** O(1) - constant space with optimization

**Key Insights:**
- Similar to Fibonacci sequence
- Bottom-up dynamic programming
- Space can be optimized to O(1)`,

            solutions: {
                python: `def climbingStairs(n):
    if n <= 1:
        return 1
    
    # Space-optimized DP
    prev2, prev1 = 1, 1
    
    for i in range(2, n + 1):
        current = prev1 + prev2
        prev2, prev1 = prev1, current
    
    return prev1`,

                javascript: `function climbingStairs(n) {
    if (n <= 1) return 1;
    
    // Space-optimized DP
    let prev2 = 1, prev1 = 1;
    
    for (let i = 2; i <= n; i++) {
        const current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    
    return prev1;
}`,

                typescript: `function climbingStairs(n: number): number {
    if (n <= 1) return 1;
    
    // Space-optimized DP
    let prev2 = 1, prev1 = 1;
    
    for (let i = 2; i <= n; i++) {
        const current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    
    return prev1;
}`,

                java: `class Solution {
    public int climbingStairs(int n) {
        if (n <= 1) return 1;
        
        // Space-optimized DP
        int prev2 = 1, prev1 = 1;
        
        for (int i = 2; i <= n; i++) {
            int current = prev1 + prev2;
            prev2 = prev1;
            prev1 = current;
        }
        
        return prev1;
    }
}`
            }
        });

        // Best Time to Buy and Sell Stock
        this.specificSolutions.set('buy-and-sell-crypto', {
            explanation: `Optimal solution for Buy and Sell Stock problem:

**Algorithm:**
1. Track minimum price seen so far
2. For each price, calculate profit if sold today
3. Update maximum profit if current profit is higher
4. Update minimum price if current price is lower

**Time Complexity:** O(n) - single pass through prices
**Space Complexity:** O(1) - constant extra space

**Key Insights:**
- Buy at lowest price before current day
- Sell at current day for maximum profit
- One pass solution with two variables`,

            solutions: {
                python: `def buyAndSellCrypto(prices):
    if not prices or len(prices) < 2:
        return 0
    
    min_price = prices[0]
    max_profit = 0
    
    for price in prices[1:]:
        # Calculate profit if we sell today
        profit = price - min_price
        max_profit = max(max_profit, profit)
        
        # Update minimum price seen so far
        min_price = min(min_price, price)
    
    return max_profit`,

                javascript: `function buyAndSellCrypto(prices) {
    if (!prices || prices.length < 2) return 0;
    
    let minPrice = prices[0];
    let maxProfit = 0;
    
    for (let i = 1; i < prices.length; i++) {
        // Calculate profit if we sell today
        const profit = prices[i] - minPrice;
        maxProfit = Math.max(maxProfit, profit);
        
        // Update minimum price seen so far
        minPrice = Math.min(minPrice, prices[i]);
    }
    
    return maxProfit;
}`,

                typescript: `function buyAndSellCrypto(prices: number[]): number {
    if (!prices || prices.length < 2) return 0;
    
    let minPrice = prices[0];
    let maxProfit = 0;
    
    for (let i = 1; i < prices.length; i++) {
        // Calculate profit if we sell today
        const profit = prices[i] - minPrice;
        maxProfit = Math.max(maxProfit, profit);
        
        // Update minimum price seen so far
        minPrice = Math.min(minPrice, prices[i]);
    }
    
    return maxProfit;
}`,

                java: `class Solution {
    public int buyAndSellCrypto(int[] prices) {
        if (prices == null || prices.length < 2) return 0;
        
        int minPrice = prices[0];
        int maxProfit = 0;
        
        for (int i = 1; i < prices.length; i++) {
            // Calculate profit if we sell today
            int profit = prices[i] - minPrice;
            maxProfit = Math.max(maxProfit, profit);
            
            // Update minimum price seen so far
            minPrice = Math.min(minPrice, prices[i]);
        }
        
        return maxProfit;
    }
}`
            }
        });

        // Reverse String
        this.specificSolutions.set('reverse-string', {
            explanation: `Reverse string using two pointers technique:

**Algorithm:**
1. Use two pointers from start and end
2. Swap characters while moving pointers toward center
3. Continue until pointers meet in middle

**Time Complexity:** O(n) - single pass through string
**Space Complexity:** O(1) - in-place reversal

**Key Insights:**
- Two pointers technique for in-place operations
- Works for both arrays and strings
- Handles odd and even length inputs correctly`,

            solutions: {
                python: `def reverseString(s):
    if not s:
        return s
    
    # Convert to list for in-place modification
    chars = list(s)
    left, right = 0, len(chars) - 1
    
    while left < right:
        chars[left], chars[right] = chars[right], chars[left]
        left += 1
        right -= 1
    
    return ''.join(chars)`,

                javascript: `function reverseString(s) {
    if (!s) return s;
    
    const chars = s.split('');
    let left = 0, right = chars.length - 1;
    
    while (left < right) {
        [chars[left], chars[right]] = [chars[right], chars[left]];
        left++;
        right--;
    }
    
    return chars.join('');
}`,

                typescript: `function reverseString(s: string): string {
    if (!s) return s;
    
    const chars = s.split('');
    let left = 0, right = chars.length - 1;
    
    while (left < right) {
        [chars[left], chars[right]] = [chars[right], chars[left]];
        left++;
        right--;
    }
    
    return chars.join('');
}`,

                java: `class Solution {
    public String reverseString(String s) {
        if (s == null || s.length() <= 1) return s;
        
        char[] chars = s.toCharArray();
        int left = 0, right = chars.length - 1;
        
        while (left < right) {
            char temp = chars[left];
            chars[left] = chars[right];
            chars[right] = temp;
            left++;
            right--;
        }
        
        return new String(chars);
    }
}`
            }
        });

        // Add more specific solutions as needed...
        this.addMoreSpecificSolutions();
    }

    addMoreSpecificSolutions() {
        // Palindrome validation
        this.specificSolutions.set('is-palindrome', {
            explanation: `Palindrome detection using two pointers:

**Algorithm:**
1. Use two pointers from start and end of string
2. Compare characters while moving pointers inward
3. Skip non-alphanumeric characters if needed
4. Return false if any mismatch found

**Time Complexity:** O(n) - single pass through string
**Space Complexity:** O(1) - constant extra space

**Key Insights:**
- Two pointers technique for efficient comparison
- Handle case sensitivity and special characters
- Early termination on first mismatch`,

            solutions: {
                python: `def isPalindrome(s):
    if not s:
        return True
    
    # Convert to lowercase and keep only alphanumeric
    cleaned = ''.join(char.lower() for char in s if char.isalnum())
    
    left, right = 0, len(cleaned) - 1
    
    while left < right:
        if cleaned[left] != cleaned[right]:
            return False
        left += 1
        right -= 1
    
    return True`,

                javascript: `function isPalindrome(s) {
    if (!s) return true;
    
    // Convert to lowercase and keep only alphanumeric
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let left = 0, right = cleaned.length - 1;
    
    while (left < right) {
        if (cleaned[left] !== cleaned[right]) {
            return false;
        }
        left++;
        right--;
    }
    
    return true;
}`,

                typescript: `function isPalindrome(s: string): boolean {
    if (!s) return true;
    
    // Convert to lowercase and keep only alphanumeric
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let left = 0, right = cleaned.length - 1;
    
    while (left < right) {
        if (cleaned[left] !== cleaned[right]) {
            return false;
        }
        left++;
        right--;
    }
    
    return true;
}`,

                java: `class Solution {
    public boolean isPalindrome(String s) {
        if (s == null || s.length() <= 1) return true;
        
        int left = 0, right = s.length() - 1;
        
        while (left < right) {
            // Skip non-alphanumeric characters
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
                left++;
            }
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
                right--;
            }
            
            // Compare characters (case insensitive)
            if (Character.toLowerCase(s.charAt(left)) != 
                Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            
            left++;
            right--;
        }
        
        return true;
    }
}`
            }
        });

        // Add Binary
        this.specificSolutions.set('add-binary', {
            explanation: `Binary addition using string manipulation:

**Algorithm:**
1. Start from the rightmost digits of both strings
2. Add corresponding digits with carry
3. Handle carry propagation
4. Continue until both strings are processed

**Time Complexity:** O(max(m, n)) - where m, n are string lengths
**Space Complexity:** O(max(m, n)) - for result string

**Key Insights:**
- Process from right to left like manual addition
- Handle carry carefully
- Pad shorter string with leading zeros conceptually`,

            solutions: {
                python: `def addBinary(a, b):
    result = []
    carry = 0
    i, j = len(a) - 1, len(b) - 1
    
    while i >= 0 or j >= 0 or carry:
        digit_sum = carry
        
        if i >= 0:
            digit_sum += int(a[i])
            i -= 1
        
        if j >= 0:
            digit_sum += int(b[j])
            j -= 1
        
        result.append(str(digit_sum % 2))
        carry = digit_sum // 2
    
    return ''.join(reversed(result))`,

                javascript: `function addBinary(a, b) {
    let result = [];
    let carry = 0;
    let i = a.length - 1, j = b.length - 1;
    
    while (i >= 0 || j >= 0 || carry) {
        let digitSum = carry;
        
        if (i >= 0) {
            digitSum += parseInt(a[i]);
            i--;
        }
        
        if (j >= 0) {
            digitSum += parseInt(b[j]);
            j--;
        }
        
        result.push((digitSum % 2).toString());
        carry = Math.floor(digitSum / 2);
    }
    
    return result.reverse().join('');
}`,

                typescript: `function addBinary(a: string, b: string): string {
    const result: string[] = [];
    let carry = 0;
    let i = a.length - 1, j = b.length - 1;
    
    while (i >= 0 || j >= 0 || carry) {
        let digitSum = carry;
        
        if (i >= 0) {
            digitSum += parseInt(a[i]);
            i--;
        }
        
        if (j >= 0) {
            digitSum += parseInt(b[j]);
            j--;
        }
        
        result.push((digitSum % 2).toString());
        carry = Math.floor(digitSum / 2);
    }
    
    return result.reverse().join('');
}`,

                java: `class Solution {
    public String addBinary(String a, String b) {
        StringBuilder result = new StringBuilder();
        int carry = 0;
        int i = a.length() - 1, j = b.length() - 1;
        
        while (i >= 0 || j >= 0 || carry > 0) {
            int digitSum = carry;
            
            if (i >= 0) {
                digitSum += a.charAt(i) - '0';
                i--;
            }
            
            if (j >= 0) {
                digitSum += b.charAt(j) - '0';
                j--;
            }
            
            result.append(digitSum % 2);
            carry = digitSum / 2;
        }
        
        return result.reverse().toString();
    }
}`
            }
        });
    }

    async generateSpecificSolutions() {
        console.log('🔧 Generating specific solutions for well-known problems...\n');
        
        try {
            let updatedCount = 0;
            
            for (const [problemName, solutionData] of this.specificSolutions) {
                const filePath = path.join(this.questionsDir, `${problemName}.json`);
                
                if (fs.existsSync(filePath)) {
                    console.log(`📝 Updating: ${problemName}`);
                    
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    // Update solutions for all languages
                    for (const lang of ['python', 'javascript', 'typescript', 'java']) {
                        if (data.languages && data.languages[lang]) {
                            data.languages[lang].solution_code = solutionData.solutions[lang];
                            data.languages[lang].solution_text = solutionData.explanation;
                        }
                    }
                    
                    // Write back to file
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    updatedCount++;
                    
                    console.log(`✅ Updated: ${problemName}\n`);
                } else {
                    console.log(`⚠️  File not found: ${problemName}.json`);
                }
            }
            
            console.log(`\n🎉 Successfully updated ${updatedCount} specific solutions!`);
            
        } catch (error) {
            console.error('❌ Error during specific solution generation:', error);
        }
    }
}

// Execute the specific solution generator
async function main() {
    const generator = new SpecificSolutionGenerator();
    await generator.generateSpecificSolutions();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SpecificSolutionGenerator;