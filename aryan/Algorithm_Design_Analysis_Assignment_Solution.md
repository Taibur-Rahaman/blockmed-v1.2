# Algorithm Design and Analysis
## Final Consolidated Assignment - Solution

**Course:** Algorithms / Design and Analysis of Algorithms  
**Total Marks:** 50

---

## Part A: Algorithm Analysis (10 marks)

### 1. Time Complexity Analysis

#### Linear Search
- **Best-case:** O(1) - The target element is found at the first position
- **Average-case:** O(n) - On average, the element is found halfway through the array
- **Worst-case:** O(n) - The target element is at the last position or not present, requiring n comparisons

**Justification:** Linear search checks each element sequentially until the target is found or the array is exhausted. In the best case, it finds the element immediately. In average and worst cases, it may need to check up to n elements.

#### Binary Search
- **Best-case:** O(1) - The target element is at the middle position
- **Average-case:** O(log n) - The search space is halved at each step
- **Worst-case:** O(log n) - The element is at a leaf position or not present, requiring log₂(n) comparisons

**Justification:** Binary search divides the search space in half at each iteration. Since we can only divide n by 2 approximately log₂(n) times, both average and worst cases are logarithmic.

#### Merge Sort
- **Best-case:** O(n log n) - Even with sorted input, merge sort still divides and merges all subarrays
- **Average-case:** O(n log n) - The divide-and-conquer approach consistently yields n log n complexity
- **Worst-case:** O(n log n) - The algorithm's structure ensures consistent performance regardless of input order

**Justification:** Merge sort always divides the array into halves (log n levels) and merges n elements at each level, resulting in O(n log n) time complexity in all cases.

#### Quick Sort
- **Best-case:** O(n log n) - When the pivot divides the array into roughly equal halves
- **Average-case:** O(n log n) - With random pivots, the array is typically divided reasonably
- **Worst-case:** O(n²) - When the pivot is always the smallest or largest element (e.g., sorted array with first/last element as pivot)

**Justification:** The performance depends on pivot selection. Good pivots create balanced partitions (O(n log n)), while bad pivots create highly unbalanced partitions leading to O(n²).

### 2. Solving Recurrence Relation using Master Theorem

**Given:** T(n) = 2T(n/2) + n

**Solution:**

Comparing with the Master Theorem form: T(n) = aT(n/b) + f(n)

- a = 2
- b = 2
- f(n) = n

Calculating n^(log_b a) = n^(log₂ 2) = n¹ = n

Since f(n) = n = Θ(n^(log_b a)), we are in **Case 2** of the Master Theorem.

Therefore: **T(n) = Θ(n log n)**

---

## Part B: Divide and Conquer (5 marks)

### Comparison: Merge Sort vs Quick Sort

#### Time Complexity

**Merge Sort:**
- Best-case: O(n log n)
- Average-case: O(n log n)
- Worst-case: O(n log n)

**Quick Sort:**
- Best-case: O(n log n)
- Average-case: O(n log n)
- Worst-case: O(n²)

**Analysis:** Merge Sort has consistent O(n log n) performance, while Quick Sort can degrade to O(n²) with poor pivot selection, though average performance is excellent.

#### Space Complexity

**Merge Sort:**
- O(n) - Requires additional space for merging subarrays

**Quick Sort:**
- Best-case: O(log n) - Recursion stack depth
- Worst-case: O(n) - When recursion depth is n (unbalanced partitions)

**Analysis:** Merge Sort always requires O(n) extra space. Quick Sort is more space-efficient in practice (O(log n) average), but can require O(n) in worst case.

#### Stability

**Merge Sort:**
- **Stable** - When merging, equal elements from the left subarray are placed before those from the right subarray, preserving relative order

**Quick Sort:**
- **Not Stable** - Pivot swapping can change the relative order of equal elements

**Analysis:** Merge Sort maintains stability, making it preferable when preserving the relative order of equal elements is important.

---

## Part C: Greedy Algorithms (5 marks)

### Why Greedy Approach Fails for 0-1 Knapsack Problem

The greedy approach fails for the 0-1 Knapsack problem because it makes locally optimal choices that may not lead to a globally optimal solution.

**Example:**

Consider:
- Knapsack capacity = 10
- Items: (weight, profit)
  - Item 1: (6, 9) → profit/weight = 1.5
  - Item 2: (5, 8) → profit/weight = 1.6
  - Item 3: (5, 8) → profit/weight = 1.6

**Greedy approach (by profit/weight ratio):**
1. Select Item 2 (ratio 1.6, weight 5, remaining capacity: 5)
2. Select Item 3 (ratio 1.6, weight 5, remaining capacity: 0)
3. Total profit = 8 + 8 = 16

**Optimal solution:**
1. Select Item 1 (weight 6, remaining capacity: 4)
2. Cannot fit any other item
3. Total profit = 9

Wait, let me reconsider with a better example:

**Better Example:**
- Knapsack capacity = 10
- Items:
  - Item 1: (10, 60) → ratio = 6.0
  - Item 2: (5, 30) → ratio = 6.0
  - Item 3: (5, 30) → ratio = 6.0

**Greedy approach:**
- Select Item 1 first (ratio 6.0) → profit = 60, capacity used = 10
- Total profit = 60

**Optimal solution:**
- Select Item 2 and Item 3 → profit = 30 + 30 = 60

Actually, let me use a clearer example:

**Clear Example:**
- Knapsack capacity = 10
- Items:
  - Item 1: (10, 100) → ratio = 10.0
  - Item 2: (6, 60) → ratio = 10.0
  - Item 3: (5, 50) → ratio = 10.0

**Greedy approach (by ratio):**
- Select Item 1 → profit = 100, remaining capacity = 0
- Total profit = 100

**Optimal solution:**
- Select Item 2 and Item 3 → profit = 60 + 50 = 110

**Key Reason:** The greedy approach cannot "undo" previous choices. Once an item is selected or rejected, the decision is final. The optimal solution may require rejecting a high-value item to make room for multiple smaller items that together yield greater total profit. This requires considering all possible combinations, which is why Dynamic Programming is needed.

---

## Part D: Dynamic Programming (10 marks)

### 1. Dynamic Programming Definition and Approaches

**Definition:**
Dynamic Programming is an optimization technique that solves complex problems by breaking them down into simpler subproblems, solving each subproblem only once, and storing the results to avoid redundant computations. It is applicable when a problem exhibits:
- **Overlapping subproblems:** The same subproblems are solved multiple times
- **Optimal substructure:** An optimal solution contains optimal solutions to subproblems

**Top-down Approach (Memoization):**
- Starts from the original problem and recursively breaks it down into subproblems
- Uses memoization (caching) to store results of solved subproblems
- Natural recursive implementation with added caching
- Example: Recursive Fibonacci with memoization

**Bottom-up Approach (Tabulation):**
- Starts from the smallest subproblems and builds up to the original problem
- Uses a table (usually a 2D array) to store results iteratively
- Typically implemented using loops
- More space-efficient and avoids recursion overhead
- Example: Iterative Fibonacci using an array

### 2. 0-1 Knapsack Problem

#### DP State Definition

**State:** `dp[i][w]` = maximum profit achievable using the first `i` items with a knapsack capacity of `w`

Where:
- `i` ranges from 0 to n (number of items)
- `w` ranges from 0 to W (knapsack capacity)

#### Recurrence Relation

```
dp[i][w] = {
    dp[i-1][w]                                    if weight[i] > w
    max(dp[i-1][w], 
        profit[i] + dp[i-1][w - weight[i]])      otherwise
}
```

**Explanation:**
- If the current item's weight exceeds remaining capacity, we cannot include it → take the value without this item
- Otherwise, we choose the maximum of:
  - Not including the item: `dp[i-1][w]`
  - Including the item: `profit[i] + dp[i-1][w - weight[i]]`

#### DP Table Construction

**Given:**
- Knapsack capacity = 7
- Items: (weight, profit)
  - Item 1: (1, 1)
  - Item 2: (3, 4)
  - Item 3: (4, 5)
  - Item 4: (5, 7)

**DP Table:**

| Item | Capacity → | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|------|------------|---|---|---|---|---|---|---|---|
| 0    | (0, 0)     | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1    | (1, 1)     | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| 2    | (3, 4)     | 0 | 1 | 1 | 4 | 5 | 5 | 5 | 5 |
| 3    | (4, 5)     | 0 | 1 | 1 | 4 | 5 | 6 | 6 | 9 |
| 4    | (5, 7)     | 0 | 1 | 1 | 4 | 5 | 7 | 8 | 9 |

**Step-by-step calculation:**

**Row 1 (Item 1: weight=1, profit=1):**
- Capacity 0: 0 (can't fit)
- Capacity 1-7: 1 (can fit, profit=1)

**Row 2 (Item 2: weight=3, profit=4):**
- Capacity 0-2: 1 (from previous row, can't fit item 2)
- Capacity 3: max(1, 4+0) = 4
- Capacity 4-7: max(1, 4+1) = 5

**Row 3 (Item 3: weight=4, profit=5):**
- Capacity 0-2: 1 (from previous row)
- Capacity 3: 4 (from previous row, can't fit item 3)
- Capacity 4: max(5, 5+0) = 5
- Capacity 5: max(5, 5+1) = 6
- Capacity 6: max(5, 5+1) = 6
- Capacity 7: max(5, 5+4) = 9

**Row 4 (Item 4: weight=5, profit=7):**
- Capacity 0-2: 1
- Capacity 3: 4
- Capacity 4: 5
- Capacity 5: max(6, 7+0) = 7
- Capacity 6: max(6, 7+1) = 8
- Capacity 7: max(9, 7+1) = 9

**Optimal Solution:** Maximum profit = **9** (from dp[4][7])

**Items selected:** Item 2 (weight 3, profit 4) and Item 3 (weight 4, profit 5) = Total weight 7, Total profit 9

---

## Part E: Graph Algorithms (12 marks)

### 1. BFS vs DFS

#### Differences

| Aspect | BFS (Breadth First Search) | DFS (Depth First Search) |
|--------|----------------------------|--------------------------|
| **Traversal Order** | Level by level, explores all neighbors before going deeper | Goes as deep as possible before backtracking |
| **Data Structure** | Queue (FIFO) | Stack (LIFO) or recursion |
| **Memory Usage** | O(b^d) where b=branching factor, d=depth | O(b×d) for tree, O(V) for graph |
| **Applications** | Shortest path (unweighted), level-order traversal | Topological sort, cycle detection, maze solving |
| **Completeness** | Complete (finds solution if exists) | Not complete for infinite graphs |
| **Optimality** | Optimal for unweighted shortest path | Not optimal |

#### Time Complexities

**BFS:**
- **Time Complexity:** O(V + E) where V = vertices, E = edges
- Each vertex is visited once, each edge is examined once

**DFS:**
- **Time Complexity:** O(V + E) where V = vertices, E = edges
- Each vertex is visited once, each edge is examined once

**Note:** Both have the same time complexity, but differ in traversal order and space requirements.

### 2. Dijkstra's Algorithm

#### Explanation

Dijkstra's Algorithm is a greedy algorithm that finds the shortest path from a source vertex to all other vertices in a weighted graph with non-negative edge weights.

**Algorithm Steps:**
1. Initialize distance to source as 0, all other vertices as ∞
2. Mark all vertices as unvisited
3. While there are unvisited vertices:
   - Select the unvisited vertex with minimum distance (u)
   - Mark u as visited
   - For each neighbor v of u:
     - If v is unvisited and distance[u] + weight(u,v) < distance[v]:
       - Update distance[v] = distance[u] + weight(u,v)

**Time Complexity:** O((V + E) log V) using priority queue, or O(V²) using array

#### Why It Fails with Negative Edge Weights

Dijkstra's algorithm fails with negative edge weights because of its **greedy nature**:

1. **Assumption Violation:** The algorithm assumes that once a vertex is marked as visited (with its shortest distance determined), that distance is final. This assumption holds only for non-negative weights.

2. **Example of Failure:**
   ```
   Graph: A --(-2)--> B --(3)--> C
          A --(1)--> C
   
   Source: A
   
   Dijkstra's execution:
   - Visit A: distance[A] = 0
   - Visit C (via A-C, distance = 1): distance[C] = 1, mark C as visited
   - Visit B (via A-B, distance = -2): distance[B] = -2
   - But we can't update C because it's already visited
   
   Actual shortest path: A → B → C = -2 + 3 = 1 (same in this case)
   
   But consider: A --(-5)--> B --(1)--> C
   - Dijkstra would set C = 1 (via A-C)
   - But optimal is A → B → C = -5 + 1 = -4
   ```

3. **Root Cause:** Negative edges can create shorter paths through already "visited" vertices, but Dijkstra doesn't reconsider them.

**Solution:** Use Bellman-Ford algorithm for graphs with negative edge weights (but no negative cycles).

### 3. Application of Warshall's Algorithm

**Warshall's Algorithm** (also known as Floyd-Warshall) computes the **transitive closure** or **all-pairs shortest paths** in a graph.

**One Correct Application:**

**Finding the Transitive Closure of a Directed Graph**

Given a directed graph, Warshall's algorithm determines if there exists a path from vertex i to vertex j for all pairs of vertices (i, j). This is useful in:

- **Database Query Optimization:** Determining reachability in relational databases
- **Compiler Design:** Finding which variables are reachable from certain points
- **Social Network Analysis:** Determining if two people are connected (directly or indirectly)
- **Dependency Analysis:** Finding all dependencies in a dependency graph

**Example:** In a course prerequisite graph, it can determine all courses that are prerequisites (direct or indirect) for a given course.

---

## Part F: Short Conceptual Questions (8 marks)

### 1. What is an NP-Complete problem?

An **NP-Complete problem** is a problem that belongs to both:
- **NP (Nondeterministic Polynomial time):** Solutions can be verified in polynomial time
- **NP-Hard:** At least as hard as the hardest problems in NP

**Key Characteristics:**
- If any NP-Complete problem can be solved in polynomial time, then P = NP
- All NP-Complete problems are reducible to each other in polynomial time
- Examples: Traveling Salesman Problem, 0-1 Knapsack, Boolean Satisfiability (SAT), Graph Coloring

### 2. Differentiate between P and NP classes

| Aspect | P (Polynomial time) | NP (Nondeterministic Polynomial time) |
|--------|---------------------|--------------------------------------|
| **Definition** | Problems solvable in polynomial time by a deterministic Turing machine | Problems whose solutions can be verified in polynomial time |
| **Solving Time** | Can be solved in O(n^k) for some constant k | Can be verified in O(n^k), but solving may require exponential time |
| **Examples** | Sorting, searching, shortest path (non-negative weights) | Traveling Salesman, Knapsack, SAT |
| **Relationship** | P ⊆ NP (widely believed, not proven) | If P = NP, all NP problems are efficiently solvable |
| **Practical Impact** | Efficiently solvable | May require exponential time for exact solutions |

**Key Question:** Does P = NP? (One of the Millennium Prize Problems, unsolved)

### 3. What is amortized analysis?

**Amortized analysis** is a method of analyzing the average time per operation over a sequence of operations, even though individual operations may be expensive.

**Key Points:**
- Provides a more accurate picture than worst-case analysis for data structures
- Some operations may be expensive, but the average cost over many operations is low
- Methods: Aggregate method, Accounting method, Potential method

**Example:** Dynamic array (vector) resizing:
- Individual insertion: O(1) average, O(n) worst-case (when resizing)
- Amortized cost: O(1) per insertion over n insertions

### 4. What is a stable sorting algorithm?

A **stable sorting algorithm** maintains the relative order of elements with equal keys (values) in the sorted output as they appeared in the input.

**Example:**
```
Input: [(3, 'A'), (1, 'B'), (3, 'C'), (2, 'D')]
Stable sort by first element: [(1, 'B'), (2, 'D'), (3, 'A'), (3, 'C')]
                                    ↑                    ↑
                              Maintains original order of (3, 'A') and (3, 'C')
```

**Stable algorithms:** Merge Sort, Bubble Sort, Insertion Sort, Counting Sort  
**Unstable algorithms:** Quick Sort, Heap Sort, Selection Sort

**Importance:** Critical when sorting by multiple criteria (e.g., sort by last name, then by first name).

### 5. What is the purpose of hashing?

**Hashing** is a technique that maps data of arbitrary size to fixed-size values (hash codes) for efficient storage and retrieval.

**Purposes:**
1. **Fast Lookup:** O(1) average-case time complexity for search, insert, and delete operations
2. **Data Integrity:** Hash functions can detect data corruption (checksums)
3. **Cryptography:** Secure hash functions for password storage and digital signatures
4. **Indexing:** Hash tables provide efficient indexing in databases
5. **Deduplication:** Identifying duplicate data using hash codes

**Applications:** Hash tables, hash maps, distributed systems, blockchain, password hashing

### 6. Differentiate between adjacency matrix and adjacency list

| Aspect | Adjacency Matrix | Adjacency List |
|--------|------------------|----------------|
| **Storage** | 2D array of size V×V | Array of lists/arrays, one per vertex |
| **Space Complexity** | O(V²) | O(V + E) |
| **Check Edge (u,v)** | O(1) - direct access | O(degree(v)) - traverse list |
| **List Neighbors** | O(V) - scan entire row | O(degree(v)) - direct list |
| **Add Edge** | O(1) | O(1) |
| **Remove Edge** | O(1) | O(degree(v)) |
| **Best For** | Dense graphs, frequent edge queries | Sparse graphs, memory efficiency |
| **Memory Efficiency** | Wastes space for sparse graphs | Efficient for sparse graphs |

**Example:**
- **Adjacency Matrix:** `matrix[i][j] = 1` if edge exists, `0` otherwise
- **Adjacency List:** `list[i] = [j, k, l]` contains all neighbors of vertex i

### 7. What is backtracking? Give one example.

**Backtracking** is a systematic method for solving problems by trying partial solutions and abandoning ("backtracking") them if they cannot lead to a complete solution.

**Characteristics:**
- Builds solutions incrementally
- Abandons partial solutions that cannot be completed (pruning)
- Uses recursion and state space tree exploration

**Example: N-Queens Problem**

Place N queens on an N×N chessboard such that no two queens attack each other.

**Backtracking approach:**
1. Place a queen in the first row
2. Try placing a queen in the next row in a valid position
3. If no valid position exists, backtrack to the previous row and try the next position
4. Repeat until all queens are placed or all possibilities are exhausted

**Pseudocode:**
```
function solveNQueens(row):
    if row == N:
        return true  // Solution found
    
    for col in 0 to N-1:
        if isValid(row, col):
            board[row][col] = 'Q'
            if solveNQueens(row + 1):
                return true
            board[row][col] = '.'  // Backtrack
    
    return false
```

### 8. Explain the space–time tradeoff

The **space–time tradeoff** is a fundamental principle in computer science where you can reduce the time complexity of an algorithm by using more memory (space), or reduce space usage at the cost of increased time.

**Key Concepts:**
- **Time vs Space:** Faster algorithms often require more memory; memory-efficient algorithms may be slower
- **Caching/Memoization:** Store computed results to avoid recomputation (more space, less time)
- **Precomputation:** Calculate and store results in advance (more space, faster queries)

**Examples:**

1. **Hash Table vs Linear Search:**
   - Hash table: O(n) space, O(1) lookup time
   - Linear search: O(1) space, O(n) lookup time

2. **Fibonacci:**
   - Recursive: O(1) space, O(2^n) time
   - Memoized: O(n) space, O(n) time
   - Iterative: O(1) space, O(n) time

3. **Sorting:**
   - Merge Sort: O(n) extra space, O(n log n) time
   - Quick Sort: O(log n) space, O(n log n) average time

4. **String Matching:**
   - Preprocessing pattern: More space for pattern table, faster matching

**Design Decision:** Choose based on constraints - if memory is limited, optimize for space; if speed is critical, optimize for time.

---

## Summary

This assignment covers fundamental topics in algorithm design and analysis:
- **Time complexity analysis** of common algorithms
- **Divide and conquer** techniques and comparisons
- **Greedy algorithms** and their limitations
- **Dynamic programming** with practical problem solving
- **Graph algorithms** and their applications
- **Core computer science concepts** in complexity theory and data structures

All solutions are presented with clear explanations, justifications, and examples where applicable.

---

**End of Solution**



