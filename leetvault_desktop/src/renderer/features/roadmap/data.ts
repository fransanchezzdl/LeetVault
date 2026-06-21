export interface RoadmapStage {
  name: string;
  color: string;
  patterns: string[];
}

// Ported verbatim from leetcode_tracker/ui/roadmap_view.py:12-32
export const ROADMAP: RoadmapStage[] = [
  {
    name: 'Fundamentos',
    color: '#E6A817',
    patterns: ['Array', 'Hash Map', 'Two Pointers', 'Sliding Window', 'Sorting'],
  },
  {
    name: 'Estructuras lineales',
    color: '#FFA116',
    patterns: ['Stack', 'Queue', 'Linked List', 'Monotonic Stack'],
  },
  {
    name: 'Búsqueda',
    color: '#00A896',
    patterns: ['Binary Search', 'BFS', 'DFS', 'Graph'],
  },
  {
    name: 'Árboles',
    color: '#2E8B6A',
    patterns: ['Tree', 'BST', 'Trie', 'Heap / Priority Queue'],
  },
  {
    name: 'Optimización',
    color: '#7C3AED',
    patterns: [
      'Dynamic Programming',
      'Greedy',
      'Backtracking',
      'Divide and Conquer',
      'Intervals',
    ],
  },
  {
    name: 'Avanzado',
    color: '#D94F3D',
    patterns: ['Union Find', 'Bit Manipulation', 'Math', 'Other'],
  },
];
