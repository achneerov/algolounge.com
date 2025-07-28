// Test the Group Anagrams comparison logic
const expected = [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']];
const actual1 = [['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']]; // Different order
const actual2 = [['bat'], ['tan', 'nat'], ['eat', 'tea', 'ate']]; // Different sub-order

// Simulate the comparison logic
function deepEqual(a, b, orderMatters = true) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  if (a.length !== b.length) return false;
  
  if (!orderMatters) {
    if (a.length > 0 && Array.isArray(a[0])) {
      const sortedA = a.map(arr => [...arr].sort()).sort();
      const sortedB = b.map(arr => [...arr].sort()).sort();
      return JSON.stringify(sortedA) === JSON.stringify(sortedB);
    }
  }
  
  return a.every((val, index) => deepEqual(val, b[index], orderMatters));
}

console.log('Testing Group Anagrams comparison logic:');
console.log('Expected:', JSON.stringify(expected));
console.log('Actual1: ', JSON.stringify(actual1));
console.log('Actual2: ', JSON.stringify(actual2));

console.log('\nOrder matters=true:');
console.log('Expected vs Actual1:', deepEqual(expected, actual1, true));
console.log('Expected vs Actual2:', deepEqual(expected, actual2, true));

console.log('\nOrder matters=false:');
console.log('Expected vs Actual1:', deepEqual(expected, actual1, false));
console.log('Expected vs Actual2:', deepEqual(expected, actual2, false));

// Test what the sorting produces
console.log('\nSorted arrays for comparison:');
const sortedExpected = expected.map(arr => [...arr].sort()).sort();
const sortedActual1 = actual1.map(arr => [...arr].sort()).sort();
const sortedActual2 = actual2.map(arr => [...arr].sort()).sort();

console.log('Sorted Expected:', JSON.stringify(sortedExpected));
console.log('Sorted Actual1: ', JSON.stringify(sortedActual1));
console.log('Sorted Actual2: ', JSON.stringify(sortedActual2));