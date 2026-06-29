// Copyright (c) 2026 >> Andrew S Klug // ASK
// Licensed under the Apache License, Version 2.0

// =====================================================
// mazeASK // p5.js maze lab
// - viewing mode vs output mode
// - clean algorithm comparison
// - implemented:
//   1 Recursive Backtracker
//   2 Binary Tree
//   3 Prim
//   4 Sidewinder
//   5 Eller
//   6 Kruskal
//   7 Wilson
//   8 Aldous-Broder
// =====================================================

/*
=====================================================
BIG PICTURE
=====================================================

A maze is really a bunch of little boxes, called cells,
that can connect to their neighbors.

You can think of the grid like a city of rooms.
Each room has walls.
A maze algorithm decides which walls to knock down.

Most of the time, we are trying to make a "perfect maze":
- every cell can be reached
- there is only one path between any two cells
- there are no loops

That means the maze is really a kind of connected tree.

=====================================================
BIG CONCEPTUAL TAKEAWAY
=====================================================

These different maze algorithms are not magic tricks.
They are different ways to build a connected network.

They mostly differ in:
1. how they choose the next cell
2. whether they like going deep, wide, or by frontier
3. how much visual bias they create
4. what kind of maze "texture" they make

Examples:
- Recursive Backtracker likes long winding paths
- Binary Tree is very simple but biased
- Prim grows outward from a frontier
- Sidewinder likes horizontal runs with occasional links upward
- Eller builds row by row
- Kruskal chooses walls while avoiding cycles
- Wilson uses loop-erased random walks
- Aldous-Broder uses a random walk that only carves on first visits

So the real lesson is not "memorize 8 algorithms".
The real lesson is:
selection strategy changes the look of the maze.

=====================================================
CRITICAL PERSPECTIVE
=====================================================

People often talk about these as if they are totally
different things. That is only partly true.

A better way to see them:
they are all ways of building one connected structure
while avoiding broken regions.

So when you compare algorithms, ask:
- How does it choose where to grow next?
- What visual bias does it create?
- What tradeoff does it make between simplicity,
  speed, and maze style?

That is the deeper idea.

=====================================================
ALGORITHMS IN THIS SKETCH
=====================================================

1 // Recursive Backtracker
2 // Binary Tree
3 // Prim
4 // Sidewinder
5 // Eller
6 // Kruskal
7 // Wilson
8 // Aldous-Broder

Each algorithm below has comments that explain the
basic idea, plus pros and cons.

=====================================================
SIMPLE ANALOGIES
=====================================================

Recursive Backtracker:
"Walk until stuck, then walk backward until you find
 a place where you can choose a new path."

Binary Tree:
"In each room, choose one of two favorite directions."

Prim:
"Grow the maze from the edge of the already-built part."

Sidewinder:
"Make horizontal runs, and sometimes punch a hole upward."

Eller:
"Build one row at a time, but remember which rooms are
 already connected."

Kruskal:
"Look at possible walls and remove only the ones that
 join two different regions."

Wilson:
"Take a wandering path, erase loops, then attach the
 clean path to the maze."

Aldous-Broder:
"Wander randomly forever, and only carve when you step
 into a room for the first time."

=====================================================
WHAT TO NOTICE WHILE PLAYING
=====================================================

When you press keys 1-8, do not just ask:
"Does it work?"

Also ask:
- Which one makes longer hallways?
- Which one feels more messy?
- Which one feels more fair?
- Which one looks most artificial?
- Which one looks most elegant?

That is how you learn to see the algorithm through
the drawing.

=====================================================
*/

// =====================================================
// TOP-OF-FILE MODE SETTINGS
// =====================================================

let output = false;
let aspectMode = "widescreen";

const renderPresets = {
  square: [2160, 2160],
  fourThree: [2880, 2160],
  widescreen: [3840, 2160]
};

// =====================================================
// GLOBALS
// =====================================================

let colorBackgroundASK, color1ASK, color2ASK, color3ASK, color4ASK;
let size;
let strokeWeightBase = 0.0009;
let paletteSwatchesASK = [];
let colorsASK = [];
let opac = 1;

let time = 0;
let canvasWidth = 0;
let canvasHeight = 0;

let zoom = 1.0;
let centerX = 0.5;
let centerY = 0.5;

// =====================================================
// MAZE LAB STATE
// =====================================================

let mazeASK = [];
let mazeState = null;
let topology = null;
let topologyMode = "rect";
let mazeCols = 40;
let mazeRows = 24;
let cellSize = 0.02;

let mazeOriginX = 0;
let mazeOriginY = 0;
let mazeWidthNorm = 0.82;
let mazeHeightNorm = 0.62;

let currentCell = null;
let stack = [];
let frontier = [];
let mazeComplete = false;
let stepsPerFrame = 16;

let algorithm = "recursiveBacktracker";
let algorithmLabel = "Recursive Backtracker";

let sidewinderRow = 0;
let sidewinderCol = 0;
let sidewinderRun = [];

let visitOrderCounter = 0;
let visitedCount = 0;
let manualCols = null;
let manualRows = null;
let showStartFinishOverlay = false;
let showSolutionOverlay = false;
let puzzleStartCell = null;
let puzzleFinishCell = null;
let puzzleSolutionPath = [];
let puzzleOverlayReady = false;

// Eller state
let ellerCurrentRow = 0;
let ellerSets = [];
let ellerNextSetId = 1;
let ellerPrepared = false;

// Kruskal state
let kruskalWalls = [];
let kruskalParent = [];
let kruskalRank = [];
let kruskalStepIndex = 0;

// Wilson state
let wilsonWalk = [];
let wilsonWalkIndexByKey = {};
let wilsonMode = "idle";
let wilsonCarveIndex = 0;

// Aldous-Broder state
let aldousCurrent = null;

// =====================================================
// SETUP
// =====================================================

function setup() {
  updateCanvasSize();
  createCanvas(canvasWidth, canvasHeight);

  pixelDensity(1);
  noFill();
  smooth();

  size = min(canvasWidth, canvasHeight);

  initColorsASK();
  renderColorsASK();
  setupMaze();
}

function setupMaze() {
  configureComposition();
  initializeMaze();
}

// =====================================================
// DRAW
// =====================================================

function draw() {
  background(colorBackgroundASK);

  pushMazeView();
  updateMaze();
  drawMaze();
  pop();

  time += 0.02;
}

function drawMaze() {
  drawVisitedFields();
  drawWalls();
  drawWilsonWalkOverlay();
  drawCurrentCell();
  drawBorder();
  drawSolutionOverlay();
  drawStartFinishOverlay();
  drawLabOverlay();
}

// =====================================================
// VIEW / NORMALIZED SPACE
// =====================================================

function pushMazeView() {
  push();
  scale(canvasWidth, canvasHeight);
  translate(centerX, centerY);
  scale(zoom);
}

// =====================================================
// CANVAS SIZE HELPERS
// =====================================================

function updateCanvasSize() {
  if (output) {
    let preset = renderPresets[aspectMode] || renderPresets.widescreen;
    canvasWidth = preset[0];
    canvasHeight = preset[1];
  } else {
    canvasWidth = windowWidth;
    canvasHeight = windowHeight;
  }
}

function applyCanvasSize() {
  updateCanvasSize();
  resizeCanvas(canvasWidth, canvasHeight);
  size = min(canvasWidth, canvasHeight);
}

// =====================================================
// COMPOSITION
// =====================================================

function isSquareComposition() {
  if (output) {
    return aspectMode === "square";
  }
  return canvasWidth / canvasHeight < 1.15;
}

function configureComposition() {
  let activeTopologyMode = getActiveTopologyMode();

  if (isSquareComposition()) {
    zoom = 1.0;
    centerX = 0.5;
    centerY = 0.5;
    mazeWidthNorm = 0.78;
    mazeHeightNorm = 0.78;

    if (manualCols === null || manualRows === null) {
      if (activeTopologyMode === "hex") {
        mazeCols = 20;
        mazeRows = 20;
      } else if (activeTopologyMode === "radial") {
        // Radial density is expressed as max cells per ring and ring count.
        mazeCols = 96;
        mazeRows = 10;
      } else if (activeTopologyMode === "triangle") {
        mazeCols = 34;
        mazeRows = 34;
      } else if (algorithm === "sidewinder" || algorithm === "eller") {
        mazeCols = 34;
        mazeRows = 34;
      } else {
        mazeCols = 36;
        mazeRows = 36;
      }
    } else {
      mazeCols = manualCols;
      mazeRows = manualRows;
    }
  } else {
    zoom = 1.0;
    centerX = 0.5;
    centerY = 0.515;
    mazeWidthNorm = 0.82;
    mazeHeightNorm = 0.62;

    if (manualCols === null || manualRows === null) {
      if (activeTopologyMode === "hex") {
        mazeCols = 28;
        mazeRows = 16;
      } else if (activeTopologyMode === "radial") {
        // Radial defaults keep enough rings for structure without overcrowding the outer arc.
        mazeCols = 96;
        mazeRows = 8;
      } else if (activeTopologyMode === "triangle") {
        mazeCols = 46;
        mazeRows = 24;
      } else if (algorithm === "sidewinder" || algorithm === "eller") {
        mazeCols = 44;
        mazeRows = 24;
      } else {
        mazeCols = 46;
        mazeRows = 24;
      }
    } else {
      mazeCols = manualCols;
      mazeRows = manualRows;
    }
  }
}

// =====================================================
// MAZE INITIALIZATION
// =====================================================

function initializeMaze() {
  configureComposition();

  mazeASK = [];
  mazeState = {
    links: new Set()
  };
  stack = [];
  frontier = [];
  sidewinderRun = [];
  mazeComplete = false;
  currentCell = null;
  visitOrderCounter = 0;
  visitedCount = 0;
  sidewinderRow = 0;
  sidewinderCol = 0;

  // reset Eller
  ellerCurrentRow = 0;
  ellerSets = [];
  ellerNextSetId = 1;
  ellerPrepared = false;

  // reset Kruskal
  kruskalWalls = [];
  kruskalParent = [];
  kruskalRank = [];
  kruskalStepIndex = 0;

  // reset Wilson
  wilsonWalk = [];
  wilsonWalkIndexByKey = {};
  wilsonMode = "idle";
  wilsonCarveIndex = 0;

  // reset Aldous-Broder
  aldousCurrent = null;
  puzzleStartCell = null;
  puzzleFinishCell = null;
  puzzleSolutionPath = [];
  puzzleOverlayReady = false;

  for (let row = 0; row < mazeRows; row++) {
    let rowCells = [];
    for (let col = 0; col < mazeCols; col++) {
      rowCells.push(makeCell(col, row));
    }
    mazeASK.push(rowCells);
  }

  topology =
    getActiveTopologyMode() === "hex"
      ? makeHexTopology()
      : getActiveTopologyMode() === "radial"
        ? makeRadialTopology()
      : getActiveTopologyMode() === "triangle"
        ? makeTriangleTopology()
        : makeRectTopology();

  setupAlgorithm();
}

function makeCell(col, row) {
  return {
    col,
    row,
    visited: false,
    frontier: false,
    depth: -1,
    visitOrder: -1
  };
}

function setupAlgorithm() {
  // --------------------------------------------------
  // RECURSIVE BACKTRACKER
  // --------------------------------------------------
  // Start in one room. Keep walking to a room you
  // haven't visited yet. If you get stuck, walk
  // backward until you find a room with another choice.
  //
  // Pros:
  // - easy to understand
  // - makes long twisty hallways
  // - very fun to animate
  //
  // Cons:
  // - can make lots of deep branches
  // - not very balanced or uniform
  if (algorithm === "recursiveBacktracker") {
    algorithmLabel = "Recursive Backtracker";
    currentCell = getTopologyFirstCell();
    markVisited(currentCell, 0);
  }

  // --------------------------------------------------
  // BINARY TREE
  // --------------------------------------------------
  // At every room, pick one of just two favorite
  // directions and break that wall.
  //
  // Pros:
  // - super simple
  // - very fast
  // - easy to code
  //
  // Cons:
  // - strongly biased
  // - can feel artificial
  else if (algorithm === "binaryTree") {
    algorithmLabel = "Binary Tree";
  }

  // --------------------------------------------------
  // PRIM
  // --------------------------------------------------
  // Start somewhere. Then grow the maze from the edge
  // of the part you already built.
  //
  // Pros:
  // - more evenly spread
  // - good comparison against backtracker
  //
  // Cons:
  // - often makes shorter dead ends
  else if (algorithm === "prim") {
    algorithmLabel = "Prim";
    currentCell = getActiveTopologyMode() === "radial"
      ? getTopologyFirstCell()
      : getTopologyMiddleCell();
    markVisited(currentCell, 0);
    addFrontierNeighbors(currentCell);
  }

  // --------------------------------------------------
  // SIDEWINDER
  // --------------------------------------------------
  // Go across a row, making a run of connected rooms.
  // Every so often, punch one passage upward.
  else if (algorithm === "sidewinder") {
    algorithmLabel = "Sidewinder";
  }

  // --------------------------------------------------
  // ELLER
  // --------------------------------------------------
  // Build one row at a time while remembering which
  // rooms are already connected.
  else if (algorithm === "eller") {
    algorithmLabel = "Eller";
    initializeEller();
  }

  // --------------------------------------------------
  // KRUSKAL
  // --------------------------------------------------
  // Look at possible walls and remove only the ones
  // that join two different regions.
  else if (algorithm === "kruskal") {
    algorithmLabel = "Kruskal";
    initializeKruskal();
  }

  // --------------------------------------------------
  // WILSON
  // --------------------------------------------------
  // Start a random walk from an unvisited room.
  // If the walk loops back on itself, erase the loop.
  // When the walk reaches the maze, carve the cleaned
  // path into the maze.
  //
  // Pros:
  // - mathematically elegant
  // - produces a uniform spanning tree
  //
  // Cons:
  // - more complex to explain
  // - slower than the simpler starters
  else if (algorithm === "wilson") {
    algorithmLabel = "Wilson";
    initializeWilson();
  }

  // --------------------------------------------------
  // ALDOUS-BRODER
  // --------------------------------------------------
  // Wander randomly forever, and only carve when you
  // step into a room for the first time.
  //
  // Pros:
  // - conceptually simple
  // - mathematically important
  //
  // Cons:
  // - very slow
  else if (algorithm === "aldousBroder") {
    algorithmLabel = "Aldous-Broder";
    initializeAldousBroder();
  }
}

// =====================================================
// MAZE UPDATE
// =====================================================

function updateMaze() {
  if (mazeComplete) return;

  // Binary Tree completes in one pass; the other algorithms advance incrementally.
  if (algorithm === "binaryTree") {
    runBinaryTree();
    mazeComplete = true;
    return;
  }

  // Run a bounded number of generation steps each frame for the active algorithm.
  for (let i = 0; i < stepsPerFrame; i++) {
    if (algorithm === "recursiveBacktracker") {
      stepRecursiveBacktracker();
    } else if (algorithm === "prim") {
      stepPrim();
    } else if (algorithm === "sidewinder") {
      stepSidewinder();
    } else if (algorithm === "eller") {
      stepEller();
    } else if (algorithm === "kruskal") {
      stepKruskal();
    } else if (algorithm === "wilson") {
      stepWilson();
    } else if (algorithm === "aldousBroder") {
      stepAldousBroder();
    }

    if (mazeComplete) break;
  }
}

// =====================================================
// ALGORITHMS
// =====================================================

function stepRecursiveBacktracker() {
  let neighbors = getNeighborCells(currentCell).filter(
    (neighbor) => !neighbor.visited
  );

  if (neighbors.length > 0) {
    let nextCell = random(neighbors);
    stack.push(currentCell);
    linkCells(currentCell, nextCell);
    markVisited(nextCell, stack.length);
    currentCell = nextCell;
    return;
  }

  if (stack.length > 0) {
    currentCell = stack.pop();
    return;
  }

  mazeComplete = true;
}

function runBinaryTree() {
  let cells = getTopologyCells();

  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i];
    markVisited(cell, i);

    let neighbors = getBinaryTreeCandidates(cell).filter(Boolean);

    if (neighbors.length > 0) {
      removeWalls(cell, random(neighbors));
    }
  }
}

function stepPrim() {
  if (frontier.length === 0) {
    mazeComplete = true;
    return;
  }

  let frontierIndex = floor(random(frontier.length));
  let cell = frontier.splice(frontierIndex, 1)[0];
  cell.frontier = false;

  let visitedNeighbors = getVisitedNeighbors(cell);
  if (visitedNeighbors.length > 0) {
    let connect = random(visitedNeighbors);
    removeWalls(cell, connect);
  }

  let depth = visitedNeighbors.length > 0
    ? minVisitedNeighborDepth(visitedNeighbors) + 1
    : 0;

  markVisited(cell, depth);
  currentCell = cell;
  addFrontierNeighbors(cell);
}

function stepSidewinder() {
  if (sidewinderRow >= mazeRows) {
    mazeComplete = true;
    return;
  }

  let cell = mazeASK[sidewinderRow][sidewinderCol];
  markVisited(cell, sidewinderRow);
  currentCell = cell;
  sidewinderRun.push(cell);

  let atEasternBoundary = sidewinderCol === mazeCols - 1;
  let atNorthernBoundary = sidewinderRow === 0;

  let carveNorth =
    atEasternBoundary || (!atNorthernBoundary && random() < 0.33);

  if (carveNorth) {
    if (!atNorthernBoundary) {
      let member = random(sidewinderRun);
      let north = getCell(member.col, member.row - 1);
      if (north) removeWalls(member, north);
    }
    sidewinderRun = [];
  } else {
    let east = getCell(sidewinderCol + 1, sidewinderRow);
    if (east) removeWalls(cell, east);
  }

  sidewinderCol++;
  if (sidewinderCol >= mazeCols) {
    sidewinderCol = 0;
    sidewinderRow++;
    sidewinderRun = [];
  }
}

// =====================================================
// ELLER
// =====================================================

function initializeEller() {
  ellerCurrentRow = 0;
  ellerNextSetId = 1;
  ellerPrepared = false;
  ellerSets = new Array(mazeCols).fill(0);
}

function stepEller() {
  if (ellerCurrentRow >= mazeRows) {
    mazeComplete = true;
    return;
  }

  if (!ellerPrepared) {
    prepareEllerRow(ellerCurrentRow);
    currentCell = mazeASK[ellerCurrentRow][0];
    ellerPrepared = true;
    return;
  }

  let row = ellerCurrentRow;

  if (row === mazeRows - 1) {
    finishLastEllerRow(row);
    markEntireRowVisited(row, row);
    currentCell = mazeASK[row][mazeCols - 1];
    ellerCurrentRow++;
    mazeComplete = true;
    return;
  }

  let nextRowSets = new Array(mazeCols).fill(0);
  let groups = groupColumnsBySet(ellerSets);

  for (let setId in groups) {
    let colsInSet = groups[setId].slice();
    shuffleArray(colsInSet);

    let requiredCount = 1 + floor(random(colsInSet.length));
    for (let i = 0; i < requiredCount; i++) {
      let col = colsInSet[i];
      let cell = mazeASK[row][col];
      let down = getCell(col, row + 1);
      if (down) {
        removeWalls(cell, down);
        nextRowSets[col] = int(setId);
      }
    }
  }

  markEntireRowVisited(row, row);
  currentCell = mazeASK[row][mazeCols - 1];

  ellerSets = nextRowSets;
  ellerCurrentRow++;
  ellerPrepared = false;
}

function prepareEllerRow(row) {
  for (let col = 0; col < mazeCols; col++) {
    if (ellerSets[col] === 0) {
      ellerSets[col] = ellerNextSetId++;
    }
  }

  for (let col = 0; col < mazeCols - 1; col++) {
    if (ellerSets[col] === ellerSets[col + 1]) continue;

    let shouldJoin = row === mazeRows - 1 || random() < 0.5;

    if (shouldJoin) {
      let leftCell = mazeASK[row][col];
      let rightCell = mazeASK[row][col + 1];
      removeWalls(leftCell, rightCell);

      let oldSet = ellerSets[col + 1];
      let newSet = ellerSets[col];

      for (let i = 0; i < mazeCols; i++) {
        if (ellerSets[i] === oldSet) {
          ellerSets[i] = newSet;
        }
      }
    }
  }
}

function finishLastEllerRow(row) {
  for (let col = 0; col < mazeCols; col++) {
    if (ellerSets[col] === 0) {
      ellerSets[col] = ellerNextSetId++;
    }
  }

  for (let col = 0; col < mazeCols - 1; col++) {
    if (ellerSets[col] !== ellerSets[col + 1]) {
      let leftCell = mazeASK[row][col];
      let rightCell = mazeASK[row][col + 1];
      removeWalls(leftCell, rightCell);

      let oldSet = ellerSets[col + 1];
      let newSet = ellerSets[col];

      for (let i = 0; i < mazeCols; i++) {
        if (ellerSets[i] === oldSet) {
          ellerSets[i] = newSet;
        }
      }
    }
  }
}

function groupColumnsBySet(setArray) {
  let groups = {};
  for (let col = 0; col < setArray.length; col++) {
    let setId = setArray[col];
    if (!groups[setId]) groups[setId] = [];
    groups[setId].push(col);
  }
  return groups;
}

function markEntireRowVisited(row, depth) {
  for (let col = 0; col < mazeCols; col++) {
    markVisited(mazeASK[row][col], depth);
  }
}

// =====================================================
// KRUSKAL
// =====================================================

function initializeKruskal() {
  kruskalParent = {};
  kruskalRank = {};

  for (let cell of getTopologyCells()) {
    let cellId = cellKey(cell);
    kruskalParent[cellId] = cellId;
    kruskalRank[cellId] = 0;
  }

  kruskalWalls = getKruskalEdges();

  shuffleArray(kruskalWalls);
  kruskalStepIndex = 0;
  currentCell = getTopologyFirstCell();
}

function stepKruskal() {
  if (kruskalStepIndex >= kruskalWalls.length) {
    markAllCellsVisited();
    mazeComplete = true;
    return;
  }

  let wall = kruskalWalls[kruskalStepIndex++];
  let cellA = wall.cellA;
  let cellB = wall.cellB;

  let idA = cellKey(cellA);
  let idB = cellKey(cellB);

  let rootA = kruskalFind(idA);
  let rootB = kruskalFind(idB);

  currentCell = cellA;

  if (rootA !== rootB) {
    removeWalls(cellA, cellB);
    kruskalUnion(rootA, rootB);

    let depth = floor(kruskalStepIndex / max(1, mazeCols));
    markVisited(cellA, depth);
    markVisited(cellB, depth);
    currentCell = cellB;
  }
}

function kruskalFind(index) {
  if (kruskalParent[index] !== index) {
    kruskalParent[index] = kruskalFind(kruskalParent[index]);
  }
  return kruskalParent[index];
}

function kruskalUnion(a, b) {
  let rootA = kruskalFind(a);
  let rootB = kruskalFind(b);

  if (rootA === rootB) return;

  if (kruskalRank[rootA] < kruskalRank[rootB]) {
    kruskalParent[rootA] = rootB;
  } else if (kruskalRank[rootA] > kruskalRank[rootB]) {
    kruskalParent[rootB] = rootA;
  } else {
    kruskalParent[rootB] = rootA;
    kruskalRank[rootA]++;
  }
}

function markAllCellsVisited() {
  let cells = getTopologyCells();
  for (let i = 0; i < cells.length; i++) {
    markVisited(cells[i], i);
  }
}

// =====================================================
// WILSON
// =====================================================

function initializeWilson() {
  let seed = getTopologyFirstCell();
  markVisited(seed, 0);
  currentCell = seed;
  wilsonMode = "chooseStart";
}

function stepWilson() {
  if (visitedCount >= getTopologyCells().length) {
    mazeComplete = true;
    return;
  }

  if (wilsonMode === "chooseStart") {
    let start = getRandomUnvisitedCell();
    if (!start) {
      mazeComplete = true;
      return;
    }

    wilsonWalk = [start];
    wilsonWalkIndexByKey = {};
    wilsonWalkIndexByKey[cellKey(start)] = 0;
    wilsonCarveIndex = 0;
    currentCell = start;
    wilsonMode = "walk";
    return;
  }

  if (wilsonMode === "walk") {
    let tail = wilsonWalk[wilsonWalk.length - 1];
    let neighbors = getNeighborCells(tail);
    let next = random(neighbors);
    currentCell = next;

    if (next.visited) {
      wilsonWalk.push(next);
      wilsonMode = "carve";
      wilsonCarveIndex = 0;
      return;
    }

    let key = cellKey(next);
    if (wilsonWalkIndexByKey.hasOwnProperty(key)) {
      let loopStart = wilsonWalkIndexByKey[key];
      wilsonWalk = wilsonWalk.slice(0, loopStart + 1);

      wilsonWalkIndexByKey = {};
      for (let i = 0; i < wilsonWalk.length; i++) {
        wilsonWalkIndexByKey[cellKey(wilsonWalk[i])] = i;
      }
      currentCell = wilsonWalk[wilsonWalk.length - 1];
      return;
    }

    wilsonWalk.push(next);
    wilsonWalkIndexByKey[key] = wilsonWalk.length - 1;
    return;
  }

  if (wilsonMode === "carve") {
    if (wilsonCarveIndex >= wilsonWalk.length - 1) {
      wilsonWalk = [];
      wilsonWalkIndexByKey = {};
      wilsonMode = "chooseStart";
      return;
    }

    let cellA = wilsonWalk[wilsonCarveIndex];
    let cellB = wilsonWalk[wilsonCarveIndex + 1];
    removeWalls(cellA, cellB);
    markVisited(cellA, wilsonCarveIndex);
    markVisited(cellB, wilsonCarveIndex + 1);
    currentCell = cellB;
    wilsonCarveIndex++;
  }
}

// =====================================================
// ALDOUS-BRODER
// =====================================================

function initializeAldousBroder() {
  aldousCurrent = getTopologyFirstCell();
  currentCell = aldousCurrent;
  markVisited(aldousCurrent, 0);
}

function stepAldousBroder() {
  if (visitedCount >= getTopologyCells().length) {
    mazeComplete = true;
    return;
  }

  let neighbors = getNeighborCells(aldousCurrent);
  let next = random(neighbors);

  if (!next.visited) {
    removeWalls(aldousCurrent, next);
    markVisited(next, visitedCount);
  }

  aldousCurrent = next;
  currentCell = next;
}

// =====================================================
// MAZE HELPERS
// =====================================================

function markVisited(cell, depth) {
  if (!cell.visited) {
    cell.visited = true;
    cell.depth = depth;
    cell.visitOrder = visitOrderCounter;
    visitOrderCounter++;
    visitedCount++;
  }
}

function addFrontierNeighbors(cell) {
  let neighbors = getNeighborCells(cell);

  for (let neighbor of neighbors) {
    if (!neighbor.visited && !neighbor.frontier) {
      neighbor.frontier = true;
      frontier.push(neighbor);
    }
  }
}

function makeRectTopology() {
  let cells = mazeASK.flat();
  cellSize = min(
    mazeWidthNorm / mazeCols,
    mazeHeightNorm / mazeRows
  );

  let mazeWidth = mazeCols * cellSize;
  let mazeHeight = mazeRows * cellSize;

  mazeOriginX = -mazeWidth * 0.5;
  mazeOriginY = isSquareComposition()
    ? -mazeHeight * 0.5
    : -mazeHeight * 0.42;

  return {
    mode: "rect",

    getNeighborCell(cell, direction) {
      if (!cell) return null;

      if (direction === "top") {
        return getCell(cell.col, cell.row - 1);
      }
      if (direction === "right") {
        return getCell(cell.col + 1, cell.row);
      }
      if (direction === "bottom") {
        return getCell(cell.col, cell.row + 1);
      }
      if (direction === "left") {
        return getCell(cell.col - 1, cell.row);
      }

      return null;
    },

    getRectNeighbors(cell) {
      return {
        top: this.getNeighborCell(cell, "top"),
        right: this.getNeighborCell(cell, "right"),
        bottom: this.getNeighborCell(cell, "bottom"),
        left: this.getNeighborCell(cell, "left")
      };
    },

    getNeighbors(cell) {
      if (!cell) return [];
      let neighbors = [];
      let rectNeighbors = this.getRectNeighbors(cell);

      if (rectNeighbors.top) neighbors.push(rectNeighbors.top);
      if (rectNeighbors.right) neighbors.push(rectNeighbors.right);
      if (rectNeighbors.bottom) neighbors.push(rectNeighbors.bottom);
      if (rectNeighbors.left) neighbors.push(rectNeighbors.left);

      return neighbors;
    },

    getCells() {
      return cells;
    },

    getBoundaryCells() {
      return cells.filter(
        (cell) =>
          cell.row === 0 ||
          cell.col === 0 ||
          cell.row === mazeRows - 1 ||
          cell.col === mazeCols - 1
      );
    },

    getBinaryTreeCandidates(cell) {
      let rectNeighbors = this.getRectNeighbors(cell);
      return [
        rectNeighbors.top,
        rectNeighbors.right
      ];
    },

    getKruskalEdges(cell) {
      let rectNeighbors = this.getRectNeighbors(cell);
      let edges = [];

      if (rectNeighbors.right) {
        edges.push({
          cellA: cell,
          cellB: rectNeighbors.right
        });
      }

      if (rectNeighbors.bottom) {
        edges.push({
          cellA: cell,
          cellB: rectNeighbors.bottom
        });
      }

      return edges;
    },

    areAdjacentCells(cellA, cellB) {
      if (!cellA || !cellB) return false;
      return this.getNeighbors(cellA).includes(cellB);
    },

    getCellCenter(cell) {
      return {
        x: mazeOriginX + cell.col * cellSize + cellSize * 0.5,
        y: mazeOriginY + cell.row * cellSize + cellSize * 0.5
      };
    },

    getCellPolygon(cell, inset = 0) {
      let x = mazeOriginX + cell.col * cellSize + inset;
      let y = mazeOriginY + cell.row * cellSize + inset;
      let size = max(0, cellSize - inset * 2);

      return [
        { x, y },
        { x: x + size, y },
        { x: x + size, y: y + size },
        { x, y: y + size }
      ];
    },

    getCellEdgeSegments(cell) {
      let x = mazeOriginX + cell.col * cellSize;
      let y = mazeOriginY + cell.row * cellSize;
      let rectNeighbors = this.getRectNeighbors(cell);

      return [
        {
          neighbor: rectNeighbors.top,
          ax: x,
          ay: y,
          bx: x + cellSize,
          by: y
        },
        {
          neighbor: rectNeighbors.right,
          ax: x + cellSize,
          ay: y,
          bx: x + cellSize,
          by: y + cellSize
        },
        {
          neighbor: rectNeighbors.bottom,
          ax: x,
          ay: y + cellSize,
          bx: x + cellSize,
          by: y + cellSize
        },
        {
          neighbor: rectNeighbors.left,
          ax: x,
          ay: y,
          bx: x,
          by: y + cellSize
        }
      ];
    },

    getBorderSegments() {
      return [
        {
          ax: mazeOriginX,
          ay: mazeOriginY,
          bx: mazeOriginX + mazeWidth,
          by: mazeOriginY
        },
        {
          ax: mazeOriginX + mazeWidth,
          ay: mazeOriginY,
          bx: mazeOriginX + mazeWidth,
          by: mazeOriginY + mazeHeight
        },
        {
          ax: mazeOriginX + mazeWidth,
          ay: mazeOriginY + mazeHeight,
          bx: mazeOriginX,
          by: mazeOriginY + mazeHeight
        },
        {
          ax: mazeOriginX,
          ay: mazeOriginY + mazeHeight,
          bx: mazeOriginX,
          by: mazeOriginY
        }
      ];
    }
  };
}

function makeHexTopology() {
  let cells = mazeASK.flat();
  const sqrtThree = sqrt(3);
  const hexRadius = min(
    mazeWidthNorm / (sqrtThree * (mazeCols + 0.5)),
    mazeHeightNorm / (mazeRows * 1.5 + 0.5)
  );
  const hexWidth = sqrtThree * hexRadius;
  const mazeWidth = hexWidth * (mazeCols + 0.5);
  const mazeHeight = hexRadius * (mazeRows * 1.5 + 0.5);

  cellSize = hexRadius;
  mazeOriginX = -mazeWidth * 0.5;
  mazeOriginY = isSquareComposition()
    ? -mazeHeight * 0.5
    : -mazeHeight * 0.42;

  function getOffsetNeighbors(cell) {
    let rowOffset = cell.row % 2 === 0 ? 0 : 1;

    return {
      topRight: getCell(cell.col + rowOffset, cell.row - 1),
      right: getCell(cell.col + 1, cell.row),
      bottomRight: getCell(cell.col + rowOffset, cell.row + 1),
      bottomLeft: getCell(cell.col - 1 + rowOffset, cell.row + 1),
      left: getCell(cell.col - 1, cell.row),
      topLeft: getCell(cell.col - 1 + rowOffset, cell.row - 1)
    };
  }

  function getHexCenter(cell) {
    return {
      x: mazeOriginX + hexWidth * (cell.col + 0.5 * (cell.row % 2)) + hexWidth * 0.5,
      y: mazeOriginY + cell.row * hexRadius * 1.5 + hexRadius
    };
  }

  function getHexPolygon(cell, inset = 0) {
    let center = getHexCenter(cell);
    let radius = max(0, hexRadius - inset);
    let halfWidth = sqrtThree * 0.5 * radius;

    return [
      { x: center.x, y: center.y - radius },
      { x: center.x + halfWidth, y: center.y - radius * 0.5 },
      { x: center.x + halfWidth, y: center.y + radius * 0.5 },
      { x: center.x, y: center.y + radius },
      { x: center.x - halfWidth, y: center.y + radius * 0.5 },
      { x: center.x - halfWidth, y: center.y - radius * 0.5 }
    ];
  }

  return {
    mode: "hex",

    getNeighborCell(cell, direction) {
      if (!cell) return null;
      let neighbors = getOffsetNeighbors(cell);
      return neighbors[direction] || null;
    },

    getRectNeighbors() {
      return {
        top: null,
        right: null,
        bottom: null,
        left: null
      };
    },

    getNeighbors(cell) {
      if (!cell) return [];
      let neighbors = getOffsetNeighbors(cell);

      return [
        neighbors.topRight,
        neighbors.right,
        neighbors.bottomRight,
        neighbors.bottomLeft,
        neighbors.left,
        neighbors.topLeft
      ].filter(Boolean);
    },

    getCells() {
      return cells;
    },

    getBoundaryCells() {
      return cells.filter(
        (cell) => this.getCellEdgeSegments(cell).some((edge) => !edge.neighbor)
      );
    },

    getBinaryTreeCandidates(cell) {
      if (!cell) return [];
      let neighbors = getOffsetNeighbors(cell);
      return [
        neighbors.topRight,
        neighbors.right
      ];
    },

    getKruskalEdges(cell) {
      if (!cell) return [];
      let neighbors = getOffsetNeighbors(cell);
      let edges = [];

      if (neighbors.right) {
        edges.push({
          cellA: cell,
          cellB: neighbors.right
        });
      }

      if (neighbors.bottomRight) {
        edges.push({
          cellA: cell,
          cellB: neighbors.bottomRight
        });
      }

      if (neighbors.bottomLeft) {
        edges.push({
          cellA: cell,
          cellB: neighbors.bottomLeft
        });
      }

      return edges;
    },

    areAdjacentCells(cellA, cellB) {
      if (!cellA || !cellB) return false;
      return this.getNeighbors(cellA).includes(cellB);
    },

    getCellCenter(cell) {
      return getHexCenter(cell);
    },

    getCellPolygon(cell, inset = 0) {
      return getHexPolygon(cell, inset);
    },

    getCellEdgeSegments(cell) {
      let polygon = getHexPolygon(cell);
      let neighbors = getOffsetNeighbors(cell);

      return [
        {
          neighbor: neighbors.topRight,
          ax: polygon[0].x,
          ay: polygon[0].y,
          bx: polygon[1].x,
          by: polygon[1].y
        },
        {
          neighbor: neighbors.right,
          ax: polygon[1].x,
          ay: polygon[1].y,
          bx: polygon[2].x,
          by: polygon[2].y
        },
        {
          neighbor: neighbors.bottomRight,
          ax: polygon[2].x,
          ay: polygon[2].y,
          bx: polygon[3].x,
          by: polygon[3].y
        },
        {
          neighbor: neighbors.bottomLeft,
          ax: polygon[3].x,
          ay: polygon[3].y,
          bx: polygon[4].x,
          by: polygon[4].y
        },
        {
          neighbor: neighbors.left,
          ax: polygon[4].x,
          ay: polygon[4].y,
          bx: polygon[5].x,
          by: polygon[5].y
        },
        {
          neighbor: neighbors.topLeft,
          ax: polygon[5].x,
          ay: polygon[5].y,
          bx: polygon[0].x,
          by: polygon[0].y
        }
      ];
    },

    getBorderSegments() {
      let borderSegments = [];

      for (let row = 0; row < mazeRows; row++) {
        for (let col = 0; col < mazeCols; col++) {
          let edgeSegments = this.getCellEdgeSegments(mazeASK[row][col]);

          for (let edge of edgeSegments) {
            if (!edge.neighbor) {
              borderSegments.push(edge);
            }
          }
        }
      }

      return borderSegments;
    }
  };
}

function makeRadialTopology() {
  let ringCount = mazeRows;
  let maxCellsPerRing = mazeCols;
  let cells = [];

  let radius = min(mazeWidthNorm, mazeHeightNorm) * 0.5;
  let ringThickness = radius / max(1, ringCount);
  let center = { x: 0, y: 0 };

  mazeOriginX = -radius;
  mazeOriginY = -radius;
  cellSize = ringThickness;

  function buildRingCounts() {
    let counts = [];

    for (let ring = 0; ring < ringCount; ring++) {
      if (ring === 0) {
        counts.push(1);
        continue;
      }

      if (ring === 1) {
        counts.push(min(maxCellsPerRing, 6));
        continue;
      }

      let previousCount = counts[ring - 1];
      let circumference = TWO_PI * (ring + 0.5);
      let arcLength = circumference / previousCount;
      // Split only when the next ring would become too stretched at the current density.
      let shouldSplit = arcLength > 1.8 && previousCount * 2 <= maxCellsPerRing;

      counts.push(shouldSplit ? previousCount * 2 : previousCount);
    }

    return counts;
  }

  let ringCounts = buildRingCounts();
  let rings = [];

  for (let ring = 0; ring < ringCount; ring++) {
    let cellCount = ringCounts[ring];
    let ringCells = [];

    for (let index = 0; index < cellCount; index++) {
      // The prebuilt matrix stays in place, but only the true ring cells become part of the radial topology.
      let cell = mazeASK[ring][index];
      cell.ring = ring;
      cell.indexInRing = index;
      cell.ringCellCount = cellCount;
      ringCells.push(cell);
      cells.push(cell);
    }

    rings.push(ringCells);
  }

  function getRingCell(ring, index) {
    if (ring < 0 || ring >= rings.length) return null;
    let ringCells = rings[ring];
    if (ringCells.length === 0) return null;
    let wrappedIndex = ((index % ringCells.length) + ringCells.length) % ringCells.length;
    return ringCells[wrappedIndex];
  }

  function getCellAngles(cell, inset = 0) {
    let count = max(1, cell.ringCellCount);
    let startAngle = -HALF_PI + TWO_PI * (cell.indexInRing / count);
    let endAngle = -HALF_PI + TWO_PI * ((cell.indexInRing + 1) / count);

    if (inset <= 0 || cell.ring === 0) {
      return { startAngle, endAngle };
    }

    let midRadius = (cell.ring + 0.5) * ringThickness;
    let angleInset = min((endAngle - startAngle) * 0.25, inset / max(midRadius, 0.0001));

    return {
      startAngle: startAngle + angleInset,
      endAngle: endAngle - angleInset
    };
  }

  function getArcPoints(radiusASKValue, startAngle, endAngle) {
    let pointCount = max(2, ceil(abs(endAngle - startAngle) / (PI / 18)) + 1);
    let points = [];

    for (let i = 0; i < pointCount; i++) {
      let t = pointCount === 1 ? 0 : i / (pointCount - 1);
      let angle = lerp(startAngle, endAngle, t);
      points.push({
        x: center.x + cos(angle) * radiusASKValue,
        y: center.y + sin(angle) * radiusASKValue
      });
    }

    return points;
  }

  function getRadialLinePoints(radiusA, radiusB, angle) {
    return [
      {
        x: center.x + cos(angle) * radiusA,
        y: center.y + sin(angle) * radiusA
      },
      {
        x: center.x + cos(angle) * radiusB,
        y: center.y + sin(angle) * radiusB
      }
    ];
  }

  function segmentsFromPoints(points, neighbor) {
    let segments = [];

    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        neighbor,
        ax: points[i].x,
        ay: points[i].y,
        bx: points[i + 1].x,
        by: points[i + 1].y
      });
    }

    return segments;
  }

  function getInwardNeighbor(cell) {
    if (!cell || cell.ring === 0) return null;

    let innerCells = rings[cell.ring - 1];
    // Uneven rings map each outer wedge back to the inner wedge that spans the same angle.
    let ratio = cell.ringCellCount / innerCells.length;
    return innerCells[floor(cell.indexInRing / ratio)] || null;
  }

  function getOutwardNeighbors(cell) {
    if (!cell || cell.ring >= rings.length - 1) return [];

    let outerCells = rings[cell.ring + 1];
    // A ring can fan out to multiple outer neighbors when the next ring has more cells.
    let ratio = outerCells.length / cell.ringCellCount;
    let startIndex = floor(cell.indexInRing * ratio);
    let endIndex = floor((cell.indexInRing + 1) * ratio);
    let neighbors = [];

    for (let index = startIndex; index < endIndex; index++) {
      let neighbor = outerCells[index];
      if (neighbor) neighbors.push(neighbor);
    }

    return neighbors;
  }

  function getRingNeighbors(cell) {
    if (!cell || cell.ringCellCount <= 1) {
      return { clockwise: null, counterClockwise: null };
    }

    return {
      clockwise: getRingCell(cell.ring, cell.indexInRing + 1),
      counterClockwise: getRingCell(cell.ring, cell.indexInRing - 1)
    };
  }

  function getRingForwardNeighbor(cell) {
    return getRingNeighbors(cell).clockwise;
  }

  function getRadialPolygon(cell, inset = 0) {
    if (!cell) return [];

    let outerRadius = max(0, (cell.ring + 1) * ringThickness - inset);

    if (cell.ring === 0) {
      return getArcPoints(outerRadius, -HALF_PI, 1.5 * PI).slice(0, -1);
    }

    let innerRadius = max(0, cell.ring * ringThickness + inset);
    let { startAngle, endAngle } = getCellAngles(cell, inset);
    let outerArc = getArcPoints(outerRadius, startAngle, endAngle);
    let innerArc = getArcPoints(innerRadius, endAngle, startAngle);

    return [...outerArc, ...innerArc];
  }

  function getRadialEdgeSegments(cell) {
    if (!cell) return [];

    let innerRadius = cell.ring * ringThickness;
    let outerRadius = (cell.ring + 1) * ringThickness;
    let { startAngle, endAngle } = getCellAngles(cell, 0);
    let ringNeighbors = getRingNeighbors(cell);
    let inwardNeighbor = getInwardNeighbor(cell);
    let outwardNeighbors = getOutwardNeighbors(cell);
    let edgeSegments = [];

    if (cell.ringCellCount > 1) {
      // Same-ring wall ownership stays canonical by emitting only the clockwise boundary.
      edgeSegments.push(
        ...segmentsFromPoints(
          getRadialLinePoints(innerRadius, outerRadius, endAngle),
          ringNeighbors.clockwise
        )
      );
    }

    if (cell.ring > 0) {
      edgeSegments.push(
        ...segmentsFromPoints(
          getArcPoints(innerRadius, startAngle, endAngle),
          inwardNeighbor
        )
      );
    }

    if (outwardNeighbors.length === 0) {
      edgeSegments.push(
        ...segmentsFromPoints(
          getArcPoints(outerRadius, startAngle, endAngle),
          null
        )
      );
    } else {
      let outerCount = outwardNeighbors.length;
      for (let i = 0; i < outerCount; i++) {
        let segmentStart = lerp(startAngle, endAngle, i / outerCount);
        let segmentEnd = lerp(startAngle, endAngle, (i + 1) / outerCount);
        edgeSegments.push(
          ...segmentsFromPoints(
            getArcPoints(outerRadius, segmentStart, segmentEnd),
            outwardNeighbors[i]
          )
        );
      }
    }

    return edgeSegments;
  }

  return {
    mode: "radial",

    getNeighborCell(cell, direction) {
      if (!cell) return null;

      if (direction === "inward") {
        return getInwardNeighbor(cell);
      }
      if (direction === "outward") {
        return getOutwardNeighbors(cell)[0] || null;
      }
      if (direction === "clockwise") {
        return getRingNeighbors(cell).clockwise;
      }
      if (direction === "counterClockwise") {
        return getRingNeighbors(cell).counterClockwise;
      }

      return null;
    },

    getRectNeighbors() {
      return {
        top: null,
        right: null,
        bottom: null,
        left: null
      };
    },

    getNeighbors(cell) {
      if (!cell) return [];

      let ringNeighbors = getRingNeighbors(cell);
      return [
        getInwardNeighbor(cell),
        ...getOutwardNeighbors(cell),
        ringNeighbors.clockwise,
        ringNeighbors.counterClockwise
      ].filter(Boolean);
    },

    getCells() {
      return cells;
    },

    getBoundaryCells() {
      return rings.length > 0 ? rings[rings.length - 1].slice() : cells.slice();
    },

    getBinaryTreeCandidates(cell) {
      if (!cell) return [];

      return [
        getInwardNeighbor(cell),
        getRingForwardNeighbor(cell)
      ];
    },

    getKruskalEdges(cell) {
      if (!cell) return [];

      let edges = [];
      let ringNeighbors = getRingNeighbors(cell);

      if (ringNeighbors.clockwise) {
        edges.push({
          cellA: cell,
          cellB: ringNeighbors.clockwise
        });
      }

      for (let outwardNeighbor of getOutwardNeighbors(cell)) {
        edges.push({
          cellA: cell,
          cellB: outwardNeighbor
        });
      }

      return edges;
    },

    areAdjacentCells(cellA, cellB) {
      if (!cellA || !cellB) return false;
      return this.getNeighbors(cellA).includes(cellB);
    },

    getCellCenter(cell) {
      if (!cell) return center;
      if (cell.ring === 0) return center;

      let { startAngle, endAngle } = getCellAngles(cell, 0);
      let midAngle = (startAngle + endAngle) * 0.5;
      let midRadius = (cell.ring + 0.5) * ringThickness;

      return {
        x: center.x + cos(midAngle) * midRadius,
        y: center.y + sin(midAngle) * midRadius
      };
    },

    getCellPolygon(cell, inset = 0) {
      return getRadialPolygon(cell, inset);
    },

    getCellEdgeSegments(cell) {
      return getRadialEdgeSegments(cell);
    },

    getBorderSegments() {
      let borderSegments = [];

      for (let cell of cells) {
        let edgeSegments = this.getCellEdgeSegments(cell);
        for (let edge of edgeSegments) {
          if (!edge.neighbor) {
            borderSegments.push(edge);
          }
        }
      }

      return borderSegments;
    }
  };
}

function makeTriangleTopology() {
  let cells = mazeASK.flat();
  const sqrtThree = sqrt(3);
  const triangleHeightASKFactor = sqrtThree * 0.5;
  const triangleSide = min(
    (mazeWidthNorm * 2) / (mazeCols + 1),
    mazeHeightNorm / (mazeRows * triangleHeightASKFactor)
  );
  const triangleHeight = triangleSide * triangleHeightASKFactor;
  const mazeWidth = triangleSide * (mazeCols + 1) * 0.5;
  const mazeHeight = triangleHeight * mazeRows;

  cellSize = triangleSide;
  mazeOriginX = -mazeWidth * 0.5;
  mazeOriginY = isSquareComposition()
    ? -mazeHeight * 0.5
    : -mazeHeight * 0.42;

  function isUpTriangle(cell) {
    return (cell.col + cell.row) % 2 === 0;
  }

  function getTriangleNeighbors(cell) {
    let isUp = isUpTriangle(cell);
    let vertical = isUp
      ? getCell(cell.col, cell.row + 1)
      : getCell(cell.col, cell.row - 1);

    return {
      top: isUp ? null : vertical,
      right: getCell(cell.col + 1, cell.row),
      bottom: isUp ? vertical : null,
      left: getCell(cell.col - 1, cell.row),
      vertical
    };
  }

  function getTriangleMidX(cell) {
    return mazeOriginX + triangleSide * (cell.col + 1) * 0.5;
  }

  function getTriangleTopY(cell) {
    return mazeOriginY + cell.row * triangleHeight;
  }

  function getTriangleCenter(cell) {
    let isUp = isUpTriangle(cell);
    return {
      x: getTriangleMidX(cell),
      y: getTriangleTopY(cell) + triangleHeight * (isUp ? 2 / 3 : 1 / 3)
    };
  }

  function insetTrianglePolygon(polygon, center, inset) {
    if (inset <= 0) return polygon;

    return polygon.map((point) => {
      let dx = point.x - center.x;
      let dy = point.y - center.y;
      let distance = sqrt(dx * dx + dy * dy);

      if (distance === 0) return point;

      let scale = max(0, (distance - inset) / distance);
      return {
        x: center.x + dx * scale,
        y: center.y + dy * scale
      };
    });
  }

  function getTrianglePolygon(cell, inset = 0) {
    let midX = getTriangleMidX(cell);
    let topY = getTriangleTopY(cell);
    let isUp = isUpTriangle(cell);

    let polygon = isUp
      ? [
          { x: midX, y: topY },
          { x: midX + triangleSide * 0.5, y: topY + triangleHeight },
          { x: midX - triangleSide * 0.5, y: topY + triangleHeight }
        ]
      : [
          { x: midX - triangleSide * 0.5, y: topY },
          { x: midX + triangleSide * 0.5, y: topY },
          { x: midX, y: topY + triangleHeight }
        ];

    return insetTrianglePolygon(polygon, getTriangleCenter(cell), inset);
  }

  return {
    mode: "triangle",

    getNeighborCell(cell, direction) {
      if (!cell) return null;
      let neighbors = getTriangleNeighbors(cell);
      return neighbors[direction] || null;
    },

    getRectNeighbors(cell) {
      let neighbors = getTriangleNeighbors(cell);
      return {
        top: neighbors.top,
        right: neighbors.right,
        bottom: neighbors.bottom,
        left: neighbors.left
      };
    },

    getNeighbors(cell) {
      if (!cell) return [];
      let neighbors = getTriangleNeighbors(cell);

      return [
        neighbors.left,
        neighbors.right,
        neighbors.vertical
      ].filter(Boolean);
    },

    getCells() {
      return cells;
    },

    getBoundaryCells() {
      return cells.filter(
        (cell) => this.getCellEdgeSegments(cell).some((edge) => !edge.neighbor)
      );
    },

    getBinaryTreeCandidates(cell) {
      if (!cell) return [];

      let neighbors = getTriangleNeighbors(cell);
      let horizontal = cell.row % 2 === 0
        ? neighbors.right
        : neighbors.left;
      let vertical = isUpTriangle(cell)
        ? null
        : neighbors.top;

      return [vertical, horizontal];
    },

    getKruskalEdges(cell) {
      if (!cell) return [];

      let neighbors = getTriangleNeighbors(cell);
      let edges = [];

      if (neighbors.right) {
        edges.push({
          cellA: cell,
          cellB: neighbors.right
        });
      }

      if (neighbors.vertical) {
        edges.push({
          cellA: cell,
          cellB: neighbors.vertical
        });
      }

      return edges;
    },

    areAdjacentCells(cellA, cellB) {
      if (!cellA || !cellB) return false;
      return this.getNeighbors(cellA).includes(cellB);
    },

    getCellCenter(cell) {
      return getTriangleCenter(cell);
    },

    getCellPolygon(cell, inset = 0) {
      return getTrianglePolygon(cell, inset);
    },

    getCellEdgeSegments(cell) {
      let polygon = getTrianglePolygon(cell);
      let neighbors = getTriangleNeighbors(cell);

      if (isUpTriangle(cell)) {
        return [
          {
            neighbor: neighbors.right,
            ax: polygon[0].x,
            ay: polygon[0].y,
            bx: polygon[1].x,
            by: polygon[1].y
          },
          {
            neighbor: neighbors.bottom,
            ax: polygon[1].x,
            ay: polygon[1].y,
            bx: polygon[2].x,
            by: polygon[2].y
          },
          {
            neighbor: neighbors.left,
            ax: polygon[2].x,
            ay: polygon[2].y,
            bx: polygon[0].x,
            by: polygon[0].y
          }
        ];
      }

      return [
        {
          neighbor: neighbors.left,
          ax: polygon[0].x,
          ay: polygon[0].y,
          bx: polygon[2].x,
          by: polygon[2].y
        },
        {
          neighbor: neighbors.right,
          ax: polygon[2].x,
          ay: polygon[2].y,
          bx: polygon[1].x,
          by: polygon[1].y
        },
        {
          neighbor: neighbors.top,
          ax: polygon[1].x,
          ay: polygon[1].y,
          bx: polygon[0].x,
          by: polygon[0].y
        }
      ];
    },

    getBorderSegments() {
      let borderSegments = [];

      for (let row = 0; row < mazeRows; row++) {
        for (let col = 0; col < mazeCols; col++) {
          let edgeSegments = this.getCellEdgeSegments(mazeASK[row][col]);

          for (let edge of edgeSegments) {
            if (!edge.neighbor) {
              borderSegments.push(edge);
            }
          }
        }
      }

      return borderSegments;
    }
  };
}

function getNeighborCell(cell, direction) {
  return topology.getNeighborCell(cell, direction);
}

function getRectNeighbors(cell) {
  return topology.getRectNeighbors(cell);
}

function getNeighborCells(cell) {
  return topology.getNeighbors(cell);
}

function getTopologyCells() {
  return topology.getCells();
}

function getBoundaryCells() {
  return topology.getBoundaryCells();
}

function getBinaryTreeCandidates(cell) {
  return topology.getBinaryTreeCandidates(cell);
}

function getKruskalEdges() {
  let edges = [];

  for (let cell of getTopologyCells()) {
    edges.push(...topology.getKruskalEdges(cell));
  }

  return edges;
}

function getUnvisitedNeighbors(cell) {
  if (!cell) return [];
  return getNeighborCells(cell).filter(
    (neighbor) => !neighbor.visited
  );
}

function getVisitedNeighbors(cell) {
  return getNeighborCells(cell).filter(
    (neighbor) => neighbor.visited
  );
}

function minVisitedNeighborDepth(neighbors) {
  let minDepth = Infinity;
  for (let neighbor of neighbors) {
    minDepth = min(minDepth, neighbor.depth);
  }
  return minDepth === Infinity ? 0 : minDepth;
}

function getCell(col, row) {
  if (
    col < 0 ||
    col >= mazeCols ||
    row < 0 ||
    row >= mazeRows
  ) {
    return null;
  }
  return mazeASK[row][col];
}

function areAdjacentCells(cellA, cellB) {
  return topology.areAdjacentCells(cellA, cellB);
}

function makeLinkKey(cellA, cellB) {
  let keyA = cellKey(cellA);
  let keyB = cellKey(cellB);
  return keyA < keyB
    ? keyA + "|" + keyB
    : keyB + "|" + keyA;
}

function linkCells(cellA, cellB) {
  if (!areAdjacentCells(cellA, cellB)) return;
  mazeState.links.add(makeLinkKey(cellA, cellB));
}

function areCellsLinked(cellA, cellB) {
  if (!areAdjacentCells(cellA, cellB)) return false;
  return mazeState.links.has(makeLinkKey(cellA, cellB));
}

function removeWalls(cellA, cellB) {
  linkCells(cellA, cellB);
}

function getRandomUnvisitedCell() {
  let options = [];
  for (let cell of getTopologyCells()) {
    if (!cell.visited) options.push(cell);
  }
  return options.length > 0 ? random(options) : null;
}

function getTopologyFirstCell() {
  let cells = getTopologyCells();
  return cells.length > 0 ? cells[0] : null;
}

function getTopologyMiddleCell() {
  let cells = getTopologyCells();
  return cells.length > 0
    ? cells[floor(cells.length / 2)]
    : null;
}

function getLinkedNeighbors(cell) {
  return getNeighborCells(cell).filter(
    (neighbor) => areCellsLinked(cell, neighbor)
  );
}

function cellKey(cell) {
  return cell.col + "," + cell.row;
}

function getMazeDistanceMap(startCell) {
  let distances = {};
  let queue = [startCell];
  let queueIndex = 0;

  distances[cellKey(startCell)] = 0;

  while (queueIndex < queue.length) {
    let cell = queue[queueIndex++];
    let depth = distances[cellKey(cell)];

    for (let neighbor of getLinkedNeighbors(cell)) {
      let neighborKey = cellKey(neighbor);
      if (distances.hasOwnProperty(neighborKey)) continue;
      distances[neighborKey] = depth + 1;
      queue.push(neighbor);
    }
  }

  return distances;
}

function choosePuzzleEndpoints() {
  let boundaryCells = getBoundaryCells().filter(Boolean);

  if (boundaryCells.length === 0) {
    let cells = getTopologyCells();
    return {
      start: cells[0] || null,
      finish: cells[cells.length - 1] || null
    };
  }

  if (boundaryCells.length === 1) {
    return {
      start: boundaryCells[0],
      finish: boundaryCells[0]
    };
  }

  let bestStart = boundaryCells[0];
  let bestFinish = boundaryCells[1];
  let bestDistance = -1;

  for (let i = 0; i < boundaryCells.length; i++) {
    let start = boundaryCells[i];
    let distances = getMazeDistanceMap(start);

    for (let j = i + 1; j < boundaryCells.length; j++) {
      let finish = boundaryCells[j];
      let distance = distances[cellKey(finish)];

      if (distance !== undefined && distance > bestDistance) {
        bestDistance = distance;
        bestStart = start;
        bestFinish = finish;
      }
    }
  }

  return {
    start: bestStart,
    finish: bestFinish
  };
}

function getMazePath(startCell, finishCell) {
  if (!startCell || !finishCell) return [];
  if (startCell === finishCell) return [startCell];

  let queue = [startCell];
  let queueIndex = 0;
  let parentByKey = {};

  parentByKey[cellKey(startCell)] = null;

  while (queueIndex < queue.length) {
    let cell = queue[queueIndex++];

    if (cell === finishCell) break;

    for (let neighbor of getLinkedNeighbors(cell)) {
      let neighborKey = cellKey(neighbor);
      if (parentByKey.hasOwnProperty(neighborKey)) continue;
      parentByKey[neighborKey] = cell;
      queue.push(neighbor);
    }
  }

  let finishKey = cellKey(finishCell);
  if (!parentByKey.hasOwnProperty(finishKey)) return [];

  let path = [];
  let current = finishCell;

  while (current) {
    path.push(current);
    current = parentByKey[cellKey(current)];
  }

  return path.reverse();
}

function ensurePuzzleOverlayData() {
  if (puzzleOverlayReady || !mazeComplete) return;

  let endpoints = choosePuzzleEndpoints();
  puzzleStartCell = endpoints.start;
  puzzleFinishCell = endpoints.finish;
  puzzleSolutionPath = getMazePath(puzzleStartCell, puzzleFinishCell);
  puzzleOverlayReady = true;
}

function setAlgorithm(name) {
  algorithm = name;
  manualCols = null;
  manualRows = null;
  initializeMaze();
}

function setTopology(mode) {
  topologyMode =
    mode === "hex" || mode === "triangle" || mode === "radial"
      ? mode
      : "rect";
  manualCols = null;
  manualRows = null;
  initializeMaze();
}

function isHexEnabledAlgorithm() {
  return (
    algorithm === "recursiveBacktracker" ||
    algorithm === "binaryTree" ||
    algorithm === "prim" ||
    algorithm === "aldousBroder" ||
    algorithm === "wilson" ||
    algorithm === "kruskal"
  );
}

function isTriangleEnabledAlgorithm() {
  return (
    algorithm === "recursiveBacktracker" ||
    algorithm === "binaryTree" ||
    algorithm === "prim" ||
    algorithm === "aldousBroder" ||
    algorithm === "wilson" ||
    algorithm === "kruskal"
  );
}

function isRadialEnabledAlgorithm() {
  // Radial activation stays limited to algorithms that run cleanly through neighbors + links or topology-owned preferred directions.
  return (
    algorithm === "recursiveBacktracker" ||
    algorithm === "binaryTree" ||
    algorithm === "prim" ||
    algorithm === "aldousBroder" ||
    algorithm === "wilson" ||
    algorithm === "kruskal"
  );
}

function getActiveTopologyMode() {
  if (topologyMode === "hex" && isHexEnabledAlgorithm()) {
    return "hex";
  }
  if (topologyMode === "radial" && isRadialEnabledAlgorithm()) {
    return "radial";
  }
  if (topologyMode === "triangle" && isTriangleEnabledAlgorithm()) {
    return "triangle";
  }
  return "rect";
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

// =====================================================
// DRAWING
// =====================================================

function drawVisitedFields() {
  noStroke();

  for (let cell of getTopologyCells()) {
    if (!cell.visited) continue;

    let t =
      cell.visitOrder <= 0
        ? 0
        : cell.visitOrder / max(1, visitOrderCounter - 1);

    let fillColor = colorLerpASK(
      color2ASK,
      color3ASK,
      t,
      mazeComplete ? 34 : 20
    );

    fill(
      red(fillColor),
      green(fillColor),
      blue(fillColor),
      alpha(fillColor)
    );

    drawCellPolygon(topology.getCellPolygon(cell));
  }

  noFill();
}

function drawWalls() {
  strokeWeight(strokeWeightBase);

  for (let cell of getTopologyCells()) {
    drawCellWalls(cell);
  }
}

function drawCellWalls(cell) {
  let edgeSegments = topology.getCellEdgeSegments(cell);

  let mix = getEdgeMix(cell);
  let wallColor = colorLerpASK(color1ASK, color4ASK, mix, 255);

  stroke(
    red(wallColor),
    green(wallColor),
    blue(wallColor),
    alpha(wallColor)
  );

  for (let edge of edgeSegments) {
    if (!edge.neighbor || !areCellsLinked(cell, edge.neighbor)) {
      line(edge.ax, edge.ay, edge.bx, edge.by);
    }
  }
}

function drawWilsonWalkOverlay() {
  if (algorithm !== "wilson") return;
  if (wilsonMode !== "walk" && wilsonMode !== "carve") return;
  if (wilsonWalk.length < 2) return;

  stroke(red(color4ASK), green(color4ASK), blue(color4ASK), 80);
  strokeWeight(strokeWeightBase * 2.0);

  for (let i = 0; i < wilsonWalk.length - 1; i++) {
    let a = wilsonWalk[i];
    let b = wilsonWalk[i + 1];
    let centerA = topology.getCellCenter(a);
    let centerB = topology.getCellCenter(b);

    line(centerA.x, centerA.y, centerB.x, centerB.y);
  }
}

function getEdgeMix(cell) {
  let nx = mazeCols <= 1 ? 0.5 : cell.col / (mazeCols - 1);
  let ny = mazeRows <= 1 ? 0.5 : cell.row / (mazeRows - 1);

  let dx = abs(nx - 0.5) * 2.0;
  let dy = abs(ny - 0.5) * 2.0;
  return constrain((dx + dy) * 0.35, 0, 1);
}

function drawCurrentCell() {
  if (!currentCell || mazeComplete) return;

  noStroke();
  fill(red(color4ASK), green(color4ASK), blue(color4ASK), 120);
  drawCellPolygon(topology.getCellPolygon(currentCell, cellSize * 0.12));
  noFill();
}

function drawBorder() {
  stroke(red(color4ASK), green(color4ASK), blue(color4ASK), 90);
  strokeWeight(strokeWeightBase * 2.0);
  noFill();

  let borderSegments = topology.getBorderSegments();
  for (let segment of borderSegments) {
    line(segment.ax, segment.ay, segment.bx, segment.by);
  }
}

function drawSolutionOverlay() {
  if (!showSolutionOverlay) return;

  ensurePuzzleOverlayData();
  if (puzzleSolutionPath.length < 2) return;

  stroke(255, 0, 255);
  strokeWeight(strokeWeightBase * 3.0);
  noFill();

  for (let i = 0; i < puzzleSolutionPath.length - 1; i++) {
    let centerA = topology.getCellCenter(puzzleSolutionPath[i]);
    let centerB = topology.getCellCenter(puzzleSolutionPath[i + 1]);
    line(centerA.x, centerA.y, centerB.x, centerB.y);
  }
}

function drawEndpointMarker(cell, markerFill, markerStroke = null) {
  if (!cell) return;

  if (markerStroke) {
    noFill();
    stroke(
      red(markerStroke),
      green(markerStroke),
      blue(markerStroke),
      220
    );
    strokeWeight(strokeWeightBase * 2.4);
    drawCellPolygon(topology.getCellPolygon(cell, cellSize * 0.22));
    noStroke();
    return;
  }

  noStroke();
  fill(
    red(markerFill),
    green(markerFill),
    blue(markerFill),
    200
  );
  drawCellPolygon(topology.getCellPolygon(cell, cellSize * 0.3));
  noFill();
}

function drawStartFinishOverlay() {
  if (!showStartFinishOverlay) return;

  ensurePuzzleOverlayData();
  if (!puzzleStartCell || !puzzleFinishCell) return;

  drawEndpointMarker(puzzleStartCell, color4ASK);
  drawEndpointMarker(puzzleFinishCell, null, color1ASK);
}

function drawLabOverlay() {
  let overlayX = mazeOriginX;
  let overlayY = mazeOriginY - 0.04;

  noStroke();
  fill(red(color1ASK), green(color1ASK), blue(color1ASK), 160);
  textAlign(LEFT, TOP);
  textSize(0.018);
  text(
    algorithmLabel +
      "  //  " +
      getActiveTopologyMode() +
      "  //  " +
      mazeCols +
      "x" +
      mazeRows +
      "  //  speed " +
      stepsPerFrame,
    overlayX,
    overlayY
  );
  noFill();
}

// =====================================================
// COLOR SYSTEM
// =====================================================

function initColorsASK() {
  paletteSwatchesASK = [
    { nameASK: "lavenderASK", rgbASK: [212, 198, 225], weightASK: 2 },
    { nameASK: "white", rgbASK: [255, 255, 255], weightASK: 1 },
    { nameASK: "smokey lavender 1", rgbASK: [139, 121, 162], weightASK: 2 },
    { nameASK: "warm lavender 1", rgbASK: [193, 154, 216], weightASK: 1 },
    { nameASK: "warm lavender 2", rgbASK: [164, 146, 200], weightASK: 2 },
    { nameASK: "warm lavender 4", rgbASK: [174, 135, 194], weightASK: 1 },
    { nameASK: "warm lavender 5", rgbASK: [226, 211, 240], weightASK: 1 },
    { nameASK: "smokey plum 1", rgbASK: [132, 80, 155], weightASK: 1 },
    { nameASK: "smokey plum 2", rgbASK: [114, 85, 131], weightASK: 1 },
    { nameASK: "violet 1", rgbASK: [190, 63, 246], weightASK: 1 }
  ];

  colorsASK = buildWeightedPaletteASK(paletteSwatchesASK);
}

function buildWeightedPaletteASK(swatches) {
  let weightedColors = [];

  for (let swatch of swatches) {
    for (let i = 0; i < swatch.weightASK; i++) {
      weightedColors.push(color(...swatch.rgbASK));
    }
  }

  return weightedColors;
}

function renderColorsASK() {
  // Stronger floor for the active cell, border, and overlay role against the background.
  const color4Floor = 95;
  // Lighter floor for wall readability without forcing every reroll into high contrast.
  const color1Floor = 52;

  colorBackgroundASK = pickPaletteColorASK(
    (candidate) => !isBannedBackgroundColorASK(candidate)
  );
  color4ASK = pickPaletteColorASK(
    (candidate) => colorDistanceASK(colorBackgroundASK, candidate) >= color4Floor,
    (candidate) => colorDistanceASK(colorBackgroundASK, candidate)
  );
  color1ASK = pickPaletteColorASK(
    (candidate) => colorDistanceASK(colorBackgroundASK, candidate) >= color1Floor,
    (candidate) => colorDistanceASK(colorBackgroundASK, candidate)
  );
  color2ASK = random(colorsASK);
  color3ASK = random(colorsASK);
}

function isBannedBackgroundColorASK(color) {
  return (
    red(color) === 190 &&
    green(color) === 63 &&
    blue(color) === 246
  );
}

function colorDistanceASK(colorA, colorB) {
  let dr = red(colorA) - red(colorB);
  let dg = green(colorA) - green(colorB);
  let db = blue(colorA) - blue(colorB);
  return sqrt(dr * dr + dg * dg + db * db);
}

function pickPaletteColorASK(isValid, score = null) {
  let validColors = colorsASK.filter(isValid);
  if (validColors.length > 0) {
    return random(validColors);
  }

  if (!score) {
    return random(colorsASK);
  }

  let bestScore = -Infinity;
  let fallbackColors = [];

  for (let candidate of colorsASK) {
    let candidateScore = score(candidate);

    if (candidateScore > bestScore) {
      bestScore = candidateScore;
      fallbackColors = [candidate];
    } else if (candidateScore === bestScore) {
      fallbackColors.push(candidate);
    }
  }

  return random(fallbackColors);
}

// =====================================================
// INTERACTION
// =====================================================

function mouseClicked() {
  const filename = generateFilename();
  saveCanvas(filename, "png");
}

function generateFilename() {
  const yyyy = nf(year(), 4);
  const mm = nf(month(), 2);
  const dd = nf(day(), 2);
  const HH = nf(hour(), 2);
  const MM = nf(minute(), 2);
  const SS = nf(second(), 2);
  const fc = nf(frameCount, 5);
  return `mazeASK-${yyyy}-${mm}-${dd}-${HH}${MM}${SS}-${fc}`;
}

// =====================================================
// KEYBOARD
// =====================================================

function keyPressed() {
  if (key === "r" || key === "R") {
    renderColorsASK();
  }

  if (key === "e" || key === "E") {
    showStartFinishOverlay = !showStartFinishOverlay;
  }

  if (key === "s" || key === "S") {
    showSolutionOverlay = !showSolutionOverlay;
  }

  if (key === " ") {
    initializeMaze();
  }

  if (key === "h" || key === "H") {
    setTopology(topologyMode === "hex" ? "rect" : "hex");
  }

  if (key === "c" || key === "C") {
    // C keeps radial as a separate opt-in topology toggle alongside hex and triangle.
    setTopology(topologyMode === "radial" ? "rect" : "radial");
  }

  if (key === "t" || key === "T") {
    setTopology(topologyMode === "triangle" ? "rect" : "triangle");
  }

  if (key === "1") setAlgorithm("recursiveBacktracker");
  if (key === "2") setAlgorithm("binaryTree");
  if (key === "3") setAlgorithm("prim");
  if (key === "4") setAlgorithm("sidewinder");
  if (key === "5") setAlgorithm("eller");
  if (key === "6") setAlgorithm("kruskal");
  if (key === "7") setAlgorithm("wilson");
  if (key === "8") setAlgorithm("aldousBroder");

  if (key === "[") {
    mazeCols = max(8, mazeCols - 2);
    mazeRows = max(8, mazeRows - 2);
    manualCols = mazeCols;
    manualRows = mazeRows;
    initializeMaze();
  }

  if (key === "]") {
    mazeCols = min(120, mazeCols + 2);
    mazeRows = min(120, mazeRows + 2);
    manualCols = mazeCols;
    manualRows = mazeRows;
    initializeMaze();
  }

  if (key === "-") {
    stepsPerFrame = max(1, stepsPerFrame - 1);
  }

  if (key === "=" || key === "+") {
    stepsPerFrame = min(240, stepsPerFrame + 1);
  }

  if (key === "o" || key === "O") {
    output = !output;
    applyCanvasSize();
    initializeMaze();
  }

  if (key === "p" || key === "P") {
    if (aspectMode === "square") {
      aspectMode = "fourThree";
    } else if (aspectMode === "fourThree") {
      aspectMode = "widescreen";
    } else {
      aspectMode = "square";
    }
    if (output) {
      applyCanvasSize();
      initializeMaze();
    }
  }
}

function windowResized() {
  if (!output) {
    applyCanvasSize();
    initializeMaze();
  }
}

// =====================================================
// OPTIONAL HELPERS
// =====================================================

function colorLerpASK(colorA, colorB, amt, alpha = 255) {
  let mixed = lerpColor(colorA, colorB, amt);
  return color(
    red(mixed),
    green(mixed),
    blue(mixed),
    alpha
  );
}

function drawCellPolygon(points) {
  beginShape();
  for (let point of points) {
    vertex(point.x, point.y);
  }
  endShape(CLOSE);
}