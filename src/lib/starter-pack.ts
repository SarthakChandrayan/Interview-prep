import type { Difficulty, Kind } from "./constants";

interface StarterItem {
  title: string;
  kind: Kind;
  topic: string;
  difficulty?: Difficulty;
  url?: string;
  tags?: string[];
  notes: string;
}

const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export const STARTER_PACK: StarterItem[] = [
  {
    title: "Two Sum",
    kind: "problem",
    topic: "Arrays & Hashing",
    difficulty: "easy",
    url: lc("two-sum"),
    tags: ["hash map"],
    notes: "One pass: for each x, check if target - x is already in a map of value → index.\nO(n) time, O(n) space.",
  },
  {
    title: "Group Anagrams",
    kind: "problem",
    topic: "Arrays & Hashing",
    difficulty: "medium",
    url: lc("group-anagrams"),
    tags: ["hash map", "sorting"],
    notes: "Key each word by its sorted letters (or a 26-count tuple) and bucket in a map.\nO(n · k log k) with sorting, O(n · k) with counts.",
  },
  {
    title: "Longest Substring Without Repeating Characters",
    kind: "problem",
    topic: "Sliding Window",
    difficulty: "medium",
    url: lc("longest-substring-without-repeating-characters"),
    tags: ["two pointers", "hash map"],
    notes: "Window [l, r]. Track last index of each char; when s[r] was seen inside the window, jump l to lastSeen + 1.\nO(n).",
  },
  {
    title: "Valid Parentheses",
    kind: "problem",
    topic: "Stack",
    difficulty: "easy",
    url: lc("valid-parentheses"),
    tags: ["stack"],
    notes: "Push openers; on a closer, the top must be its matching opener. Valid iff the stack ends empty.",
  },
  {
    title: "Search in Rotated Sorted Array",
    kind: "problem",
    topic: "Binary Search",
    difficulty: "medium",
    url: lc("search-in-rotated-sorted-array"),
    tags: ["binary search"],
    notes: "At each mid, one half is sorted. Check whether target lies in the sorted half's range; recurse there, otherwise the other half.\nO(log n).",
  },
  {
    title: "Number of Islands",
    kind: "problem",
    topic: "Graphs",
    difficulty: "medium",
    url: lc("number-of-islands"),
    tags: ["dfs", "bfs", "grid"],
    notes: "Scan the grid; on each unvisited '1', count an island and flood-fill (DFS/BFS) to mark it visited.\nO(rows · cols).",
  },
  {
    title: "Course Schedule",
    kind: "problem",
    topic: "Graphs",
    difficulty: "medium",
    url: lc("course-schedule"),
    tags: ["topological sort", "cycle detection"],
    notes: "Cycle detection in a directed graph. Kahn's algorithm: repeatedly take in-degree-0 nodes; if you process all n, no cycle.\nO(V + E).",
  },
  {
    title: "Merge Intervals",
    kind: "problem",
    topic: "Intervals",
    difficulty: "medium",
    url: lc("merge-intervals"),
    tags: ["sorting"],
    notes: "Sort by start. If the next start ≤ current end, extend end = max(end, next end); else push and start a new one.",
  },
  {
    title: "Coin Change",
    kind: "problem",
    topic: "Dynamic Programming",
    difficulty: "medium",
    url: lc("coin-change"),
    tags: ["dp", "unbounded knapsack"],
    notes: "dp[a] = min coins for amount a. dp[0] = 0; dp[a] = min(dp[a - c] + 1) over coins c.\nO(amount · coins).",
  },
  {
    title: "LRU Cache",
    kind: "problem",
    topic: "Design",
    difficulty: "medium",
    url: lc("lru-cache"),
    tags: ["hash map", "linked list"],
    notes: "Hash map key → node in a doubly linked list ordered by recency. get/put move the node to the front; evict from the tail.\nO(1) both.",
  },
  {
    title: "Big-O of common operations",
    kind: "concept",
    topic: "Fundamentals",
    notes: "Array index O(1), search O(n). Hash map get/put O(1) avg.\nBalanced BST / heap insert O(log n). Sorting O(n log n).\nBFS/DFS O(V + E).",
  },
  {
    title: "Processes vs threads",
    kind: "concept",
    topic: "Operating Systems",
    notes: "Process: own address space, isolated, heavier to create and switch.\nThread: shares its process's memory, cheap to switch, needs synchronisation (locks) to avoid races.",
  },
  {
    title: "What happens when you type a URL into a browser?",
    kind: "concept",
    topic: "Networking",
    notes: "DNS lookup → TCP handshake → TLS handshake → HTTP request → server response → browser parses HTML, fetches CSS/JS, builds DOM + CSSOM → layout → paint.",
  },
  {
    title: "SQL vs NoSQL: when to pick which",
    kind: "concept",
    topic: "Databases",
    notes: "SQL: relational data, joins, strong consistency, transactions across tables.\nDocument stores (MongoDB): data read together is stored together, flexible schema, horizontal scaling.\nPick by access patterns, not hype.",
  },
  {
    title: "Database indexing",
    kind: "concept",
    topic: "Databases",
    notes: "An index (usually a B-tree) makes lookups O(log n) instead of a full scan, at the cost of slower writes and extra storage.\nCompound index order matters: it serves queries on a prefix of its fields.",
  },
  {
    title: "Design a URL shortener",
    kind: "concept",
    topic: "System Design",
    notes: "Requirements → API (POST /shorten, GET /:code) → ID generation (base62 of a counter or hash) → key-value store → cache hot links → 301 vs 302 redirect → analytics via async queue.",
  },
  {
    title: "Caching strategies",
    kind: "concept",
    topic: "System Design",
    notes: "Cache-aside (app reads cache, falls back to DB, fills cache), write-through, write-back.\nEviction: LRU / LFU / TTL. Watch for stampedes and stale data.",
  },
  {
    title: "Tell me about yourself",
    kind: "behavioral",
    topic: "Intro",
    notes: "Present → past → future, about 90 seconds.\nWhat I do now and one highlight → how I got here → why this role fits next.\n(Replace with your own version.)",
  },
  {
    title: "A time you disagreed with a teammate",
    kind: "behavioral",
    topic: "Conflict",
    notes: "STAR:\nSituation — \nTask — \nAction — (focus on how you listened and used data)\nResult — (and what you learned)",
  },
  {
    title: "Your biggest failure",
    kind: "behavioral",
    topic: "Growth",
    notes: "STAR, with real ownership. Spend most of the time on what you changed afterwards.\nSituation — \nTask — \nAction — \nResult — ",
  },
];
