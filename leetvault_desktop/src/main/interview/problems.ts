import type { InterviewProblem } from '@shared/types/interview';
import { InterviewProblemListSchema } from './problems.schema';

const PROBLEMS: InterviewProblem[] = [
  // ─── EASY (10) ─────────────────────────────────────────────────────────────
  {
    id: 'pair-sum-target',
    title: 'Pair Sum to Target',
    difficulty: 'Easy',
    topics: ['array', 'hash-map'],
    vague_description:
      'You receive a list of integers and a target number. Return the indices of any two values that add up to the target. Assume exactly one valid pair exists.',
    full_constraints:
      'Array length 2..10^5. Values are 32-bit integers (positive or negative). Exactly one valid pair. Indices must be different. Order of returned indices does not matter.',
    twists: [
      'What if the array is already sorted ascending?',
      'What if multiple valid pairs exist and you must return all of them?',
      'What if you can only use O(1) extra memory?',
    ],
    expected_solution:
      'Single pass with a hash map from value → index. For each element x at index i, check whether (target - x) was seen earlier; if yes return [stored_index, i]. Otherwise store x → i and continue.',
    expected_complexity: { time: 'O(n)', space: 'O(n)' },
    examples: [
      { input: 'nums = [3, 1, 4, 1, 5], target = 6', output: '[1, 4]' },
      { input: 'nums = [-2, 7, 11, 15], target = 9', output: '[0, 1]' },
    ],
  },
  {
    id: 'valid-brackets',
    title: 'Valid Brackets',
    difficulty: 'Easy',
    topics: ['stack', 'string'],
    vague_description:
      'Given a string containing only the characters ()[]{}, decide whether the brackets are correctly matched and nested.',
    full_constraints:
      'String length 0..10^4. Only the six characters () [] {} appear. Empty string is considered valid.',
    twists: [
      'What if other characters are allowed and should be ignored?',
      'What if you also have to return the index of the first mismatch?',
    ],
    expected_solution:
      'Use a stack. Push opening brackets. On a closing bracket, pop and verify the popped bracket matches. The string is valid iff the stack ends empty and no pop ever fails.',
    expected_complexity: { time: 'O(n)', space: 'O(n)' },
    examples: [
      { input: 's = "([]{})"', output: 'true' },
      { input: 's = "([)]"', output: 'false' },
      { input: 's = "((("', output: 'false' },
    ],
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse a Singly Linked List',
    difficulty: 'Easy',
    topics: ['linked-list', 'pointers'],
    vague_description:
      'You are given the head of a singly linked list. Return the head of the reversed list.',
    full_constraints:
      'List length 0..5·10^4. Node values are arbitrary 32-bit integers. You may reverse in place; you do not need to preserve the original list.',
    twists: [
      'Can you do it recursively as well as iteratively?',
      'What if you must reverse only the first k nodes?',
    ],
    expected_solution:
      'Iterate with three pointers: prev = null, curr = head, next. At each step, save next = curr.next, set curr.next = prev, advance prev = curr and curr = next. Return prev.',
    expected_complexity: { time: 'O(n)', space: 'O(1)' },
    examples: [
      { input: '1 -> 2 -> 3 -> 4 -> null', output: '4 -> 3 -> 2 -> 1 -> null' },
      { input: 'null', output: 'null' },
    ],
  },
  {
    id: 'best-buy-sell-once',
    title: 'Best Single Buy-Sell Profit',
    difficulty: 'Easy',
    topics: ['array', 'greedy'],
    vague_description:
      'You receive an array of daily prices. Choose one day to buy and a later day to sell. Return the maximum profit you can make, or 0 if no profitable trade exists.',
    full_constraints:
      'Array length 1..10^5. Prices are non-negative integers up to 10^4. You must buy strictly before you sell.',
    twists: [
      'What if you can do up to two transactions?',
      'What if you must hold for at least k days between buy and sell?',
    ],
    expected_solution:
      'Single pass tracking the minimum price seen so far and the best profit so far. For each price, update best = max(best, price - min_so_far), then update min_so_far.',
    expected_complexity: { time: 'O(n)', space: 'O(1)' },
    examples: [
      { input: 'prices = [7, 1, 5, 3, 6, 4]', output: '5' },
      { input: 'prices = [9, 7, 4, 1]', output: '0' },
    ],
  },
  {
    id: 'merge-sorted-lists',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    topics: ['linked-list', 'two-pointers'],
    vague_description:
      'Given the heads of two sorted singly linked lists, splice them together into a single sorted list and return its head.',
    full_constraints:
      'Each list length 0..50. Node values are integers in [-100, 100]. You may reuse the existing nodes; do not allocate copies.',
    twists: [
      'What if you receive k sorted lists instead of 2?',
      'Solve it recursively without a dummy node.',
    ],
    expected_solution:
      'Use a dummy head and a tail pointer. Walk both inputs; attach the smaller node and advance that input. When one finishes, attach the remainder of the other.',
    expected_complexity: { time: 'O(n + m)', space: 'O(1)' },
    examples: [
      { input: 'l1 = 1->2->4, l2 = 1->3->4', output: '1->1->2->3->4->4' },
      { input: 'l1 = null, l2 = 0', output: '0' },
    ],
  },
  {
    id: 'first-unique-char',
    title: 'First Non-Repeating Character',
    difficulty: 'Easy',
    topics: ['string', 'hash-map'],
    vague_description:
      'Given a lowercase string, return the index of the first character that appears exactly once, or -1 if no such character exists.',
    full_constraints:
      'String length 0..10^5. Characters are lowercase English letters only.',
    twists: [
      'What if the string is streamed and you must answer after each new character?',
      'What if any unicode character is allowed?',
    ],
    expected_solution:
      'Two passes. First pass: count occurrences of each character in a 26-int array. Second pass: scan the string left to right and return the first index whose count is 1.',
    expected_complexity: { time: 'O(n)', space: 'O(1)' },
    examples: [
      { input: 's = "leetcode"', output: '0' },
      { input: 's = "aabbcc"', output: '-1' },
    ],
  },
  {
    id: 'climb-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    topics: ['dp', 'fibonacci'],
    vague_description:
      'You climb a staircase with n steps. At each move you take either 1 or 2 steps. Count the number of distinct sequences that reach the top.',
    full_constraints:
      'n in 1..45 (so the answer fits in a 32-bit signed integer).',
    twists: [
      'What if you can also take 3-step moves?',
      'What if some steps are broken and cannot be landed on?',
    ],
    expected_solution:
      'Classic Fibonacci recurrence: ways(n) = ways(n-1) + ways(n-2). Iterate bottom-up keeping two rolling values.',
    expected_complexity: { time: 'O(n)', space: 'O(1)' },
    examples: [
      { input: 'n = 2', output: '2' },
      { input: 'n = 5', output: '8' },
    ],
  },
  {
    id: 'majority-element',
    title: 'Majority Element',
    difficulty: 'Easy',
    topics: ['array', 'voting'],
    vague_description:
      'You receive an array of integers. One value appears strictly more than n/2 times. Return that value.',
    full_constraints:
      'Array length 1..5·10^4. A majority element is guaranteed to exist. Values fit in 32-bit signed integers.',
    twists: [
      'Solve it in O(1) extra space.',
      'What if you only know the majority appears more than n/3 times \u2014 how many candidates can there be?',
    ],
    expected_solution:
      "Boyer\u2013Moore voting: maintain a candidate and a count. If count is 0, adopt the current value. If current == candidate, increment; else decrement. Because the majority exceeds n/2, it survives.",
    expected_complexity: { time: 'O(n)', space: 'O(1)' },
    examples: [
      { input: 'nums = [3, 2, 3]', output: '3' },
      { input: 'nums = [2, 2, 1, 1, 1, 2, 2]', output: '2' },
    ],
  },
  {
    id: 'invert-binary-tree',
    title: 'Invert a Binary Tree',
    difficulty: 'Easy',
    topics: ['tree', 'recursion'],
    vague_description:
      'Given the root of a binary tree, swap the left and right children of every node. Return the new root.',
    full_constraints:
      'Node count 0..100. Node values are integers in [-100, 100]. May invert in place.',
    twists: [
      'Solve it iteratively using a queue or stack.',
      'What if the tree is so deep that recursion would blow the stack?',
    ],
    expected_solution:
      'Recurse: invert the left subtree, invert the right subtree, then swap the two child pointers. Base case: null node returns null.',
    expected_complexity: { time: 'O(n)', space: 'O(h)' },
    examples: [
      { input: '    4\n   / \\\n  2   7', output: '    4\n   / \\\n  7   2' },
    ],
  },
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    topics: ['array', 'hash-set'],
    vague_description:
      'Given an integer array, decide whether any value appears at least twice.',
    full_constraints:
      'Array length 1..10^5. Values are 32-bit signed integers.',
    twists: [
      'What if the array fits the constraint "all values are in [0, n-1]"?',
      'What if you must report the value that duplicates, not just yes/no?',
    ],
    expected_solution:
      'Insert each value into a hash set; if an insertion finds the value already present, return true. Reach the end ⇒ no duplicates.',
    expected_complexity: { time: 'O(n)', space: 'O(n)' },
    examples: [
      { input: 'nums = [1, 2, 3, 1]', output: 'true' },
      { input: 'nums = [1, 2, 3, 4]', output: 'false' },
    ],
  },

  // ─── MEDIUM (10) ───────────────────────────────────────────────────────────
  {
    id: 'longest-substring-unique',
    title: 'Longest Substring Without Repeats',
    difficulty: 'Medium',
    topics: ['sliding-window', 'string', 'hash-map'],
    vague_description:
      'Given a string, return the length of the longest contiguous substring that contains no repeated characters.',
    full_constraints:
      'String length 0..5·10^4. Characters may include letters, digits, symbols, and spaces (ASCII).',
    twists: [
      'What if you must also return the substring itself?',
      'What if at most k repeats are allowed inside the window?',
    ],
    expected_solution:
      'Sliding window with a map char → last index. Walk right; on a duplicate inside the window, jump left to lastIndex+1. Track max(right - left + 1).',
    expected_complexity: { time: 'O(n)', space: 'O(min(n, alphabet))' },
    examples: [
      { input: 's = "abcabcbb"', output: '3', note: '"abc"' },
      { input: 's = "bbbbb"', output: '1' },
      { input: 's = "pwwkew"', output: '3', note: '"wke"' },
    ],
  },
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    topics: ['hash-map', 'string', 'sorting'],
    vague_description:
      'Given a list of strings, group together all strings that are anagrams of each other. The grouping order does not matter.',
    full_constraints:
      'Up to 10^4 strings, each length 0..100, lowercase English letters only.',
    twists: [
      'How would you handle very long strings where sorting each is too slow?',
      'What if strings can contain any unicode character?',
    ],
    expected_solution:
      'For each string, compute a canonical key: either the sorted characters, or a length-26 count tuple. Group strings by key in a hash map.',
    expected_complexity: { time: 'O(n·k log k)', space: 'O(n·k)' },
    examples: [
      {
        input: '["eat","tea","tan","ate","nat","bat"]',
        output: '[["eat","tea","ate"],["tan","nat"],["bat"]]',
      },
    ],
  },
  {
    id: 'two-pointer-container',
    title: 'Container With Most Water',
    difficulty: 'Medium',
    topics: ['two-pointers', 'array', 'greedy'],
    vague_description:
      'You receive heights of vertical lines on a horizontal axis. Pick two lines that together with the x-axis form a container. Return the maximum water it can hold.',
    full_constraints:
      'Array length 2..10^5. Heights are non-negative integers up to 10^4. Width between lines i and j is |i - j|.',
    twists: [
      'Prove why moving the shorter side inward never loses the optimum.',
      'What if you may pick three lines and they form a trapezoid?',
    ],
    expected_solution:
      'Two pointers l=0, r=n-1. Compute area = min(h[l],h[r]) * (r-l). Move the pointer at the shorter side inward (moving the taller side cannot improve since width shrinks and height is capped by the shorter side). Track max.',
    expected_complexity: { time: 'O(n)', space: 'O(1)' },
    examples: [
      { input: 'heights = [1,8,6,2,5,4,8,3,7]', output: '49' },
      { input: 'heights = [1,1]', output: '1' },
    ],
  },
  {
    id: 'level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    topics: ['bfs', 'tree', 'queue'],
    vague_description:
      'Given the root of a binary tree, return its node values grouped by level, top to bottom, left to right within each level.',
    full_constraints:
      'Node count 0..2000. Values are integers in [-1000, 1000].',
    twists: [
      'Return the levels in zig-zag (alternating) order.',
      'Return only the rightmost node of each level (the right-side view).',
    ],
    expected_solution:
      'BFS with a queue. Before processing each level, snapshot the queue length; pop exactly that many nodes, push their children, and emit the popped values as one level.',
    expected_complexity: { time: 'O(n)', space: 'O(n)' },
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
    ],
  },
  {
    id: 'rotate-image',
    title: 'Rotate Image 90° In Place',
    difficulty: 'Medium',
    topics: ['matrix', 'in-place'],
    vague_description:
      'Given an n×n matrix representing an image, rotate it 90 degrees clockwise. You must do it in place (no extra matrix).',
    full_constraints:
      'n in 1..20. Values are integers in [-1000, 1000].',
    twists: [
      'Counter-clockwise instead.',
      'What if the matrix is non-square (m × n)?',
    ],
    expected_solution:
      'Transpose the matrix (swap a[i][j] with a[j][i] for i<j), then reverse each row. Both passes are in-place and combine to a clockwise 90° rotation.',
    expected_complexity: { time: 'O(n²)', space: 'O(1)' },
    examples: [
      { input: '[[1,2,3],[4,5,6],[7,8,9]]', output: '[[7,4,1],[8,5,2],[9,6,3]]' },
    ],
  },
  {
    id: 'coin-change-min',
    title: 'Coin Change (Minimum Coins)',
    difficulty: 'Medium',
    topics: ['dp', '1d'],
    vague_description:
      'Given coin denominations of unlimited supply and a target amount, return the fewest coins needed to make the amount, or -1 if impossible.',
    full_constraints:
      'Up to 12 denominations, each in [1, 2^31 - 1]. Target amount in [0, 10^4].',
    twists: [
      'Greedy works for some denomination sets but not all \u2014 give an example where it fails.',
      'How would you also reconstruct which coins were used?',
    ],
    expected_solution:
      'Bottom-up DP: dp[a] = min(dp[a - c] + 1) over all coins c ≤ a, with dp[0] = 0 and dp[*] = ∞ initially. Answer is dp[amount] or -1 if still ∞.',
    expected_complexity: { time: 'O(amount · coins)', space: 'O(amount)' },
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', note: '5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1' },
    ],
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    topics: ['intervals', 'sorting'],
    vague_description:
      'You receive a list of inclusive intervals [start, end]. Merge all overlapping intervals and return the result sorted by start.',
    full_constraints:
      'Up to 10^4 intervals. Start ≤ end. Values fit in 32-bit signed integers. Touching intervals (end == next start) also merge.',
    twists: [
      'What if intervals arrive one by one in a stream?',
      'How would you find the missing gaps between merged intervals?',
    ],
    expected_solution:
      'Sort by start. Iterate; keep a running "current" interval. If the next interval overlaps or touches current, extend current.end = max(end, next.end). Otherwise push current and replace it with next.',
    expected_complexity: { time: 'O(n log n)', space: 'O(n)' },
    examples: [
      {
        input: '[[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
      },
    ],
  },
  {
    id: 'kth-largest-stream',
    title: 'Kth Largest Element in a Stream',
    difficulty: 'Medium',
    topics: ['heap', 'priority-queue'],
    vague_description:
      'Design a class that, given an integer k and a stream of values, returns the k-th largest value seen so far after each addition.',
    full_constraints:
      'k in 1..10^4. Up to 10^4 add() calls. Each value fits in a 32-bit signed integer.',
    twists: [
      'What if k can also change between calls?',
      'What if you must support remove() as well?',
    ],
    expected_solution:
      'Maintain a min-heap of size k. On add(x): push x; if heap size > k, pop the minimum. The top of the heap is always the k-th largest so far.',
    expected_complexity: { time: 'O(log k) per add', space: 'O(k)' },
    examples: [
      {
        input: 'k=3, init=[4,5,8,2], add 3 → 5; add 5 → 5; add 10 → 8; add 9 → 8; add 4 → 8',
        output: '5, 5, 8, 8, 8',
      },
    ],
  },
  {
    id: 'graph-clone',
    title: 'Clone an Undirected Graph',
    difficulty: 'Medium',
    topics: ['graph', 'dfs', 'hash-map'],
    vague_description:
      'You are given a reference to a node in an undirected connected graph. Return a deep copy of the graph.',
    full_constraints:
      'Up to 100 nodes. Each node has a unique integer value and a list of neighbors. The graph may contain cycles.',
    twists: [
      'How does your approach handle a graph with cycles without infinite-looping?',
      'Do you prefer BFS or DFS here, and why?',
    ],
    expected_solution:
      'Use a hash map from original node → cloned node. DFS (or BFS) from the given node: if a neighbor isn\u2019t in the map yet, clone it and recurse; then add the cloned neighbor to the current clone\u2019s neighbor list. The map prevents revisits.',
    expected_complexity: { time: 'O(V + E)', space: 'O(V)' },
    examples: [
      { input: 'adjacency = [[2,4],[1,3],[2,4],[1,3]]', output: 'isomorphic deep copy' },
    ],
  },
  {
    id: 'word-break',
    title: 'Word Break',
    difficulty: 'Medium',
    topics: ['dp', 'string', 'hash-set'],
    vague_description:
      'Given a string and a dictionary of words, decide whether the string can be segmented into a sequence of one or more dictionary words.',
    full_constraints:
      'String length 1..300. Up to 1000 dictionary words, each length 1..20, lowercase English letters.',
    twists: [
      'Return all possible segmentations, not just whether one exists.',
      'What if the dictionary is enormous (millions of words)?',
    ],
    expected_solution:
      'Put the dictionary in a hash set. DP over prefix lengths: dp[i] = true iff there exists j ≤ i with dp[j] true and s[j:i] in the dictionary. Answer is dp[n].',
    expected_complexity: { time: 'O(n² · L)', space: 'O(n)' },
    examples: [
      { input: 's="leetcode", dict=["leet","code"]', output: 'true' },
      { input: 's="applepenapple", dict=["apple","pen"]', output: 'true' },
      { input: 's="catsandog", dict=["cats","dog","sand","and","cat"]', output: 'false' },
    ],
  },

  // ─── HARD (8) ──────────────────────────────────────────────────────────────
  {
    id: 'min-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    topics: ['sliding-window', 'string', 'hash-map'],
    vague_description:
      'Given strings s and t, return the shortest substring of s that contains every character of t (with multiplicity). If no such window exists, return "".',
    full_constraints:
      's length 1..10^5, t length 1..100. ASCII characters. If multiple shortest windows tie, returning any is acceptable.',
    twists: [
      'What if t can be huge (length comparable to s)?',
      'How would you adapt for streaming s with limited memory?',
    ],
    expected_solution:
      'Sliding window with a need map (counts from t) and a have map. Expand right; when all needs are satisfied, contract left while still satisfied, recording the smallest window.',
    expected_complexity: { time: 'O(|s| + |t|)', space: 'O(|alphabet|)' },
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' },
      { input: 's = "a", t = "aa"', output: '""' },
    ],
  },
  {
    id: 'merge-k-sorted-lists',
    title: 'Merge K Sorted Linked Lists',
    difficulty: 'Hard',
    topics: ['heap', 'linked-list', 'divide-and-conquer'],
    vague_description:
      'You are given an array of k sorted linked-list heads. Merge them into a single sorted linked list and return its head.',
    full_constraints:
      'k in 0..10^4. Total nodes up to 10^4. Node values fit in 32-bit signed integers.',
    twists: [
      'Compare the heap approach with pairwise divide-and-conquer merging.',
      'What if the lists are stored on disk and cannot all fit in memory?',
    ],
    expected_solution:
      'Push the head of each list into a min-heap keyed by node value. Repeatedly pop the smallest, append to the merged tail, and push its next (if any). Stops when the heap is empty.',
    expected_complexity: { time: 'O(N log k)', space: 'O(k)' },
    examples: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
    ],
  },
  {
    id: 'longest-increasing-subseq',
    title: 'Longest Increasing Subsequence',
    difficulty: 'Hard',
    topics: ['dp', 'binary-search', 'patience'],
    vague_description:
      'Given an integer array, return the length of the longest strictly increasing subsequence (not necessarily contiguous).',
    full_constraints:
      'Array length 1..2500 for the O(n²) target; can extend to 10^5 with O(n log n).',
    twists: [
      'Reconstruct one such subsequence, not just its length.',
      'What if "strictly" becomes "non-decreasing"?',
    ],
    expected_solution:
      'Patience sorting: maintain an array tails where tails[k] is the smallest possible tail of an increasing subsequence of length k+1. For each x, binary-search the first tails[i] ≥ x and overwrite it (or append if x > all tails). Answer is the length of tails.',
    expected_complexity: { time: 'O(n log n)', space: 'O(n)' },
    examples: [
      { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', note: '[2,3,7,18] or [2,3,7,101]' },
      { input: 'nums = [0,1,0,3,2,3]', output: '4' },
    ],
  },
  {
    id: 'serialize-binary-tree',
    title: 'Serialize and Deserialize Binary Tree',
    difficulty: 'Hard',
    topics: ['tree', 'design', 'bfs'],
    vague_description:
      'Design a pair of functions: serialize a binary tree to a string, and deserialize the string back to an equivalent tree.',
    full_constraints:
      'Node count 0..10^4. Values are integers in [-1000, 1000]. The format is up to you, but round-trip must preserve structure exactly.',
    twists: [
      'How does your format handle null children?',
      'Could you serialize using only pre-order without explicit nulls? Under what assumption?',
    ],
    expected_solution:
      "Choose level-order BFS: emit values left-to-right, using a sentinel like '#' for nulls; separate by commas. To deserialize, parse the head, then walk a queue: for each parent, pop the next two tokens as left/right children, enqueueing non-null ones.",
    expected_complexity: { time: 'O(n)', space: 'O(n)' },
    examples: [
      { input: '[1,2,3,null,null,4,5]', output: 'round-trip yields the same tree' },
    ],
  },
  {
    id: 'word-ladder',
    title: 'Word Ladder',
    difficulty: 'Hard',
    topics: ['bfs', 'graph', 'string'],
    vague_description:
      'Given a begin word, an end word, and a word list, return the length of the shortest transformation sequence from begin to end where each step changes exactly one letter and every intermediate word is in the list. Return 0 if impossible.',
    full_constraints:
      'All words have the same length, 1..10. Word list size up to 5000. Lowercase English letters. End word must be in the list (otherwise answer is 0).',
    twists: [
      'Return all shortest sequences, not just the length.',
      'How could bidirectional BFS speed this up?',
    ],
    expected_solution:
      'Build implicit edges by replacing each character with every other letter and checking membership in the word set. BFS from begin; the first time you pop end, return the current distance. Mark visited as you enqueue.',
    expected_complexity: { time: 'O(N · L · 26)', space: 'O(N · L)' },
    examples: [
      {
        input: 'begin="hit", end="cog", list=["hot","dot","dog","lot","log","cog"]',
        output: '5',
        note: 'hit→hot→dot→dog→cog',
      },
    ],
  },
  {
    id: 'edit-distance',
    title: 'Edit Distance',
    difficulty: 'Hard',
    topics: ['dp', '2d', 'string'],
    vague_description:
      'Given two strings a and b, return the minimum number of single-character insertions, deletions, or substitutions needed to convert a into b.',
    full_constraints:
      'Each string length 0..500. Lowercase English letters.',
    twists: [
      'Can you reduce memory from O(n·m) to O(min(n, m))?',
      'How would weighted operations (different cost for insert vs delete) change the recurrence?',
    ],
    expected_solution:
      'DP on prefixes: dp[i][j] = edit distance between a[:i] and b[:j]. If a[i-1] == b[j-1], dp[i][j] = dp[i-1][j-1]. Otherwise dp[i][j] = 1 + min(dp[i-1][j-1] substitute, dp[i-1][j] delete, dp[i][j-1] insert). Base: dp[i][0]=i, dp[0][j]=j.',
    expected_complexity: { time: 'O(n·m)', space: 'O(n·m)' },
    examples: [
      { input: 'a = "horse", b = "ros"', output: '3' },
      { input: 'a = "intention", b = "execution"', output: '5' },
    ],
  },
  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    topics: ['two-pointers', 'array', 'monotonic-stack'],
    vague_description:
      'Given an array of non-negative integers representing an elevation map (each bar width 1), compute how much water it can trap after raining.',
    full_constraints:
      'Array length 0..2·10^4. Heights are integers in [0, 10^5].',
    twists: [
      'How does the two-pointer solution avoid precomputing prefix/suffix maxes?',
      'Generalize to a 2D heightmap.',
    ],
    expected_solution:
      'Two pointers l, r with running maxLeft, maxRight. At each step, advance the side whose height is smaller; the trapped water at that index is max_on_that_side - height. The invariant guarantees correctness.',
    expected_complexity: { time: 'O(n)', space: 'O(1)' },
    examples: [
      { input: 'heights = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
    ],
  },
  {
    id: 'median-two-sorted',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    topics: ['binary-search', 'array'],
    vague_description:
      'Given two sorted arrays of sizes n and m, return the median of the combined array in O(log(min(n, m))) time.',
    full_constraints:
      'n + m in 1..2000 for correctness; 1..10^6 for the log-time target. Values are 32-bit signed integers.',
    twists: [
      'Why O(log(n+m)) merging fails the time bound \u2014 what does binary search buy you?',
      'Generalize to the k-th smallest, not just the median.',
    ],
    expected_solution:
      'Binary search the smaller array for a partition i such that the left half (i elements from A and (k - i) from B) is entirely ≤ the right half. Adjust i based on the boundary comparisons. The median is read off the four boundary values once a valid partition is found.',
    expected_complexity: { time: 'O(log min(n, m))', space: 'O(1)' },
    examples: [
      { input: 'A = [1,3], B = [2]', output: '2.0' },
      { input: 'A = [1,2], B = [3,4]', output: '2.5' },
    ],
  },
];

// Validated at module load \u2014 throws loud on dev if dataset is malformed.
export const INTERVIEW_PROBLEMS: ReadonlyArray<InterviewProblem> = (() => {
  const parsed = InterviewProblemListSchema.safeParse(PROBLEMS);
  if (!parsed.success) {
    throw new Error(
      'Interview problem dataset invalid:\n' + JSON.stringify(parsed.error.issues, null, 2)
    );
  }
  return parsed.data;
})();
