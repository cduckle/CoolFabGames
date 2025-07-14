import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { mask, pattern } from 'framer-motion/client';
import { MOSFET_GOAL_RECTS } from './mosfetGoal.js';
import Confetti from 'react-confetti';


// Level definitions
const LEVELS = {
  mosfet: {
    name: 'MOSFET',
    description: 'Metal-Oxide Semiconductor Field Effect Transistor',
    details: 'Modern chips have billions of these small electronic switches.',
    goalRects: MOSFET_GOAL_RECTS
  },
  waveguide: {
    name: 'Waveguide',
    description: 'Optical Waveguide',
    details: 'Guides light through a narrow channel for photonic circuits.',
    goalRects: [
      // Simple straight waveguide
      { x: 0.2, y: 0.45, w: 0.6, h: 0.1, l: 1, color: '#8ac6d1' },
      { x: 0.2, y: 0.45, w: 0.6, h: 0.1, l: 2, color: '#f6d186' }
    ]
  },
  spiral: {
    name: 'Spiral Waveguide',
    description: 'Spiral Optical Waveguide',
    details: 'A compact spiral design for delay lines and filters.',
    goalRects: [
      // Spiral pattern
      { x: 0.3, y: 0.3, w: 0.4, h: 0.05, l: 1, color: '#8ac6d1' },
      { x: 0.3, y: 0.65, w: 0.4, h: 0.05, l: 1, color: '#8ac6d1' },
      { x: 0.3, y: 0.3, w: 0.05, h: 0.4, l: 1, color: '#8ac6d1' },
      { x: 0.65, y: 0.3, w: 0.05, h: 0.4, l: 1, color: '#8ac6d1' },
      { x: 0.35, y: 0.4, w: 0.25, h: 0.05, l: 1, color: '#8ac6d1' },
      { x: 0.35, y: 0.55, w: 0.25, h: 0.05, l: 1, color: '#8ac6d1' },
      { x: 0.35, y: 0.4, w: 0.05, h: 0.2, l: 1, color: '#8ac6d1' },
      { x: 0.55, y: 0.4, w: 0.05, h: 0.2, l: 1, color: '#8ac6d1' },
    ]
  },
  splitter: {
    name: 'Y-Splitter',
    description: 'Optical Power Splitter',
    details: 'Splits one optical signal into two equal parts.',
    goalRects: [
      // Input waveguide
      { x: 0.1, y: 0.45, w: 0.3, h: 0.1, l: 1, color: '#8ac6d1' },
      // Split section
      { x: 0.4, y: 0.4, w: 0.2, h: 0.2, l: 1, color: '#8ac6d1' },
      // Output waveguides
      { x: 0.6, y: 0.3, w: 0.3, h: 0.1, l: 1, color: '#8ac6d1' },
      { x: 0.6, y: 0.6, w: 0.3, h: 0.1, l: 1, color: '#8ac6d1' }
    ]
  },
  coupler: {
    name: 'Directional Coupler',
    description: 'Optical Directional Coupler',
    details: 'Couples light between two parallel waveguides.',
    goalRects: [
      // Two parallel waveguides
      { x: 0.1, y: 0.35, w: 0.8, h: 0.1, l: 1, color: '#8ac6d1' },
      { x: 0.1, y: 0.55, w: 0.8, h: 0.1, l: 1, color: '#8ac6d1' },
      // Coupling region (closer spacing)
      { x: 0.4, y: 0.46, w: 0.2, h: 0.08, l: 1, color: '#8ac6d1' }
    ]
  }
};

function LevelSelect({ onSelectLevel }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: '#f0f0f0'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>Cool-Fab-Games</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        maxWidth: '1200px',
        padding: '1rem'
      }}>
        {Object.entries(LEVELS).map(([key, level]) => (
          <div
            key={key}
            style={{
              background: '#fff',
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
            onClick={() => onSelectLevel(key)}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#007bff';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#ddd';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{level.name}</h2>
            <p style={{ margin: '0 0 1rem 0', color: '#666', fontWeight: 'bold' }}>{level.description}</p>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>{level.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotomaskEditor({ photomask, onSave, onCancel, goalRects }) {
  const maskRef = useRef(null);
  const goalRef = useRef(null);

  // Mask editor state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragMode, setDragMode] = useState(null);
  const [mouseDownPos, setMouseDownPos] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [maskCells, setMaskCells] = useState(
    () => Array.from({ length: 20 }, () => Array(20).fill(false))
  );

  // Decode existing photomask URL into maskCells when opening editor
  useEffect(() => {
    if (!photomask) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = photomask;
    img.onload = () => {
      const size = 200;
      const off = document.createElement('canvas');
      off.width = off.height = size;
      const ctx = off.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);

      const grid = 20;
      const cell = size / grid;
      const newCells = Array.from({ length: grid }, () => Array(grid).fill(false));

      for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
          const p = ctx.getImageData(c * cell + cell / 2, r * cell + cell / 2, 1, 1).data;
          if (p[0] < 128) newCells[r][c] = true;
        }
      }
      setMaskCells(newCells);
    };
  }, [photomask]);

  // Utility to draw grid
  const drawGrid = (ctx, size) => {
    const cell = size / 20;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const p = i * cell;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
  };

  // Utility to draw mask cells
  const drawCells = (ctx, cells, size) => {
    const cell = size / 20;
    ctx.fillStyle = '#000';
    cells.forEach((row, r) =>
      row.forEach((filled, c) => {
        if (filled) ctx.fillRect(c * cell, r * cell, cell, cell);
      })
    );

    // Drag preview
    if (isDragging && dragStart && dragEnd) {
      ctx.fillStyle = dragMode === 'add' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)';
      const minC = Math.min(dragStart.c, dragEnd.c);
      const maxC = Math.max(dragStart.c, dragEnd.c);
      const minR = Math.min(dragStart.r, dragEnd.r);
      const maxR = Math.max(dragStart.r, dragEnd.r);
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          ctx.fillRect(c * cell, r * cell, cell, cell);
        }
      }
      ctx.strokeStyle = '#f00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        minC * cell,
        minR * cell,
        (maxC - minC + 1) * cell,
        (maxR - minR + 1) * cell
      );
    }
  };

  const getCellFromEvent = e => {
    const canvas = maskRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell = canvas.width / 20;
    return { c: Math.floor(x / cell), r: Math.floor(y / cell) };
  };

  // Mask drawing effect
  useEffect(() => {
    if (!maskRef.current) return;
    const ctx = maskRef.current.getContext('2d');
    const size = maskRef.current.width;
    drawGrid(ctx, size);
    drawCells(ctx, maskCells, size);
  }, [maskCells, isDragging, dragStart, dragEnd, dragMode]);

  // Goal drawing effect
  useEffect(() => {
    if (!goalRef.current) return;
    const ctx = goalRef.current.getContext('2d');
    const size = goalRef.current.width;
    drawGrid(ctx, size);
    goalRects.forEach(r => {
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x * size, r.y * size, r.w * size, r.h * size);
    });
  }, [goalRects]);

  // Event handlers
  const handleMouseDown = e => {
    const { c, r } = getCellFromEvent(e);
    if (c < 0 || c >= 20 || r < 0 || r >= 20) return;
    setIsDragging(true);
    setDragStart({ c, r });
    setDragEnd({ c, r });
    setMouseDownPos({ c, r });
    setHasMoved(false);
    setDragMode(maskCells[r][c] ? 'remove' : 'add');
  };

  const handleMouseMove = e => {
    if (!isDragging) return;
    const { c, r } = getCellFromEvent(e);
    if (c < 0 || c >= 20 || r < 0 || r >= 20) return;
    if (mouseDownPos && (c !== mouseDownPos.c || r !== mouseDownPos.r)) setHasMoved(true);
    setDragEnd({ c, r });
  };

  const handleMouseUp = e => {
    if (!isDragging) return;
    const { c, r } = getCellFromEvent(e);
    const newCells = maskCells.map(row => row.slice());
    if (!hasMoved && mouseDownPos && c === mouseDownPos.c && r === mouseDownPos.r) {
      newCells[r][c] = !newCells[r][c];
    } else {
      const minC = Math.min(dragStart.c, c);
      const maxC = Math.max(dragStart.c, c);
      const minR = Math.min(dragStart.r, r);
      const maxR = Math.max(dragStart.r, r);
      for (let rr = minR; rr <= maxR; rr++) {
        for (let cc = minC; cc <= maxC; cc++) {
          newCells[rr][cc] = dragMode === 'add';
        }
      }
    }
    setMaskCells(newCells);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setDragMode(null);
    setMouseDownPos(null);
    setHasMoved(false);
  };

  const handleClick = e => e.preventDefault();

  const handleSave = () => {
    const canvas = maskRef.current;
    onSave(canvas.toDataURL());
  };

  const handleReset = () => setMaskCells(Array.from({ length: 20 }, () => Array(20).fill(false)));
  const handleInvert = () => setMaskCells(maskCells.map(row => row.map(cell => !cell)));

  return (
    <div style={{ display: 'flex', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', gap: 20 }}>
      {/* Goal view */}
      <div>
        <h3 style={{ margin: '0 0 10px' }}>Goal</h3>
        <canvas ref={goalRef} width={200} height={200} style={{ border: '1px solid #000' }} />
      </div>

      {/* Mask editor view */}
      <div>
        <h3 style={{ margin: '0 0 10px' }}>Photomask Editor</h3>
        <canvas
          ref={maskRef}
          width={400}
          height={400}
          style={{ border: '1px solid #000', cursor: 'pointer' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <button onClick={handleSave}>Save Mask</button>
          <button onClick={handleReset}>Reset</button>
          <button onClick={handleInvert}>Invert</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}


// refactor everything to be squares, not layers and rectangles
// Cube-based fabrication constants
const GRID_SIZE = 20; // 20x20 grid
const MAX_HEIGHT = 30; // Maximum height in cube layers
const CUBE_SIZE = 1; // Each cube is 1x1x1 unit

// Material types and colors
const MATERIALS = {
  EMPTY: { color: null, name: 'Empty' },
  SUBSTRATE: { color: '#c0c0c0', name: 'Silicon Substrate' },
  COPPER: { color: '#f6d186', name: 'Copper' },
  SILICON_OXIDE: { color: '#8ac6d1', name: 'Silicon Oxide' },
  AMORPHOUS_SILICON: { color: 'grey', name: 'Amorphous Silicon' },
  PHOTORESIST: { color: 'green', name: 'Photoresist' }
};

export default function FabSimulator() {
  const [currentLevel, setCurrentLevel] = useState(null);
  
  // NEW: 3D cube grid - [x][y][z] where z=0 is bottom
  const [cubeGrid, setCubeGrid] = useState(() => {
    // Initialize with substrate at bottom layers
    const grid = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => 
        Array(MAX_HEIGHT).fill(MATERIALS.EMPTY)
      )
    );
    
    // Fill bottom 5 layers with substrate
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < 5; z++) {
          grid[x][y][z] = MATERIALS.SUBSTRATE;
        }
      }
    }
    
    return grid;
  });
  
  const [photomask, setPhotomask] = useState(null);
  const [editingMask, setEditingMask] = useState(false);
  const [goalRects, setGoalRects] = useState([]); // Will be set based on selected level
  
  // slider state for clipping plane - MUST be before conditional returns
  const [slicePosition, setSlicePosition] = useState(1);
  // At the top of your FabSimulator component, after your diffCount calculation:
  const [completed, setCompleted] = useState(false);



    // at top of FabSimulator(), after your other hooks…
  const diffCount = useMemo(() => {
    // build a boolean goal‐grid [x][y][z]
    const goalGrid = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() =>
        Array(MAX_HEIGHT).fill(false)
      )
    );

    // mark all the goal cubes from goalRects
    goalRects.forEach(r => {
      const startX = Math.floor(r.x * GRID_SIZE);
      const endX   = Math.floor((r.x + r.w) * GRID_SIZE);
      const startY = Math.floor(r.y * GRID_SIZE);
      const endY   = Math.floor((r.y + r.h) * GRID_SIZE);
      const z      = r.l - 1 + 5;   // offset by your 5-layer substrate

      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          if (
            x >= 0 && x < GRID_SIZE &&
            y >= 0 && y < GRID_SIZE &&
            z >= 0 && z < MAX_HEIGHT
          ) {
            goalGrid[x][y][z] = true;
          }
        }
      }
    });

    // compare user vs goal (ignore z < 5 since that's your fixed substrate)
    let count = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 5; z < MAX_HEIGHT; z++) {
          const userHas = cubeGrid[x][y][z] !== MATERIALS.EMPTY;
          const goalHas = goalGrid[x][y][z];
          if (userHas !== goalHas) count++;
        }
      }
    }
    return count;
  }, [cubeGrid, goalRects]);

  useEffect(() => {
    setCompleted(diffCount === 0);
    }, [diffCount]);
  
  // Utility functions for cube operations
  const getTopCubeHeight = (x, y, grid = cubeGrid) => {
    for (let z = MAX_HEIGHT - 1; z >= 0; z--) {
      if (grid[x][y][z] !== MATERIALS.EMPTY) {
        return z;
      }
    }
    return -1; // No cubes at this position
  };
  
  const depositMaterial = (material, maskPattern = null) => {
    setCubeGrid(prevGrid => {
      const newGrid = prevGrid.map(xArray => 
        xArray.map(yArray => [...yArray])
      );
      
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          // Check if we should deposit here (either no mask or mask allows it)
          const shouldDeposit = !maskPattern || maskPattern[y][x];
          
          if (shouldDeposit) {
            const topHeight = getTopCubeHeight(x, y, prevGrid);
            const newHeight = topHeight + 1;
            
            if (newHeight < MAX_HEIGHT) {
              newGrid[x][y][newHeight] = material;
            }
          }
        }
      }
      
      return newGrid;
    });
  };
  
  const etchTopLayer = (maskPattern = null) => {
    setCubeGrid(prevGrid => {
      const newGrid = prevGrid.map(xArray => 
        xArray.map(yArray => [...yArray])
      );
      
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          // Check if we should etch here (either no mask or mask allows it)
          const shouldEtch = !maskPattern || maskPattern[y][x];
          
          if (shouldEtch) {
            const topHeight = getTopCubeHeight(x, y, prevGrid);
            if (topHeight > 0) { // Don't etch substrate
              newGrid[x][y][topHeight] = MATERIALS.EMPTY;
            }
          }
        }
      }
      
      return newGrid;
    });
  };
  
  // Convert photomask to boolean pattern for deposition/etching
  const getMaskPattern = async (photomaskUrl) => {
    if (!photomaskUrl) return null;
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = photomaskUrl;
    await new Promise(res => img.onload = res);
    
    const size = 200;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    
    const pattern = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    const cellSize = size / GRID_SIZE;
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pixelData = ctx.getImageData(x * cellSize + cellSize/2, y * cellSize + cellSize/2, 1, 1).data;
        pattern[y][x] = pixelData[0] < 128; // Black areas are true
      }
    }
    
    return pattern;
  };
  
  // Convert slider position to discrete x-coordinate for cube filtering
  const sliceX = Math.floor(slicePosition * GRID_SIZE);

  // Handle level selection
  const handleSelectLevel = (levelKey) => {
    setCurrentLevel(levelKey);
    const level = LEVELS[levelKey];
    if (level) {
      setGoalRects(level.goalRects);
    }
  };

  // Show level select screen if no level is selected
  if (!currentLevel) {
    return <LevelSelect onSelectLevel={handleSelectLevel} />;
  }

  const currentLevelData = LEVELS[currentLevel];
  if (!currentLevelData) {
    return <LevelSelect onSelectLevel={handleSelectLevel} />;
  }
  
  // These old functions are no longer needed with the cube system

  const handleDeposit_Cu = () => {
    depositMaterial(MATERIALS.COPPER);
  };

  const handleDeposit_SiO2 = () => {
    depositMaterial(MATERIALS.SILICON_OXIDE);
  };

  const handleDeposit_aSi = () => {
    depositMaterial(MATERIALS.AMORPHOUS_SILICON);
  };

  const handleSpin = () => {
    // Spin photoresist - deposits a layer of photoresist over entire surface
    depositMaterial(MATERIALS.PHOTORESIST);
  };


  const handlePlasmaClean = () => {
    // Liftoff process: Remove photoresist and any material deposited on top of it
    setCubeGrid(prevGrid => {
      const newGrid = prevGrid.map(xArray => 
        xArray.map(yArray => [...yArray])
      );
      
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          // Find all photoresist layers at this position
          for (let z = 0; z < MAX_HEIGHT; z++) {
            if (newGrid[x][y][z] === MATERIALS.PHOTORESIST) {
              // Remove the photoresist
              newGrid[x][y][z] = MATERIALS.EMPTY;
              
              // Remove everything above this photoresist layer (liftoff)
              for (let zAbove = z + 1; zAbove < MAX_HEIGHT; zAbove++) {
                if (newGrid[x][y][zAbove] !== MATERIALS.EMPTY) {
                  newGrid[x][y][zAbove] = MATERIALS.EMPTY;
                }
              }
            }
          }
        }
      }
      
      return newGrid;
    });
  };

  const handleExposeDevelop = async () => {
    if (!photomask) return;
    
    // Get mask pattern and remove photoresist where exposed (black areas)
    const maskPattern = await getMaskPattern(photomask);
    if (!maskPattern) return;
    
    setCubeGrid(prevGrid => {
      const newGrid = prevGrid.map(xArray => 
        xArray.map(yArray => [...yArray])
      );
      
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          // If mask is true (black area), remove photoresist
          if (maskPattern[y][x]) {
            for (let z = 0; z < MAX_HEIGHT; z++) {
              if (newGrid[x][y][z] === MATERIALS.PHOTORESIST) {
                newGrid[x][y][z] = MATERIALS.EMPTY;
              }
            }
          }
        }
      }
      
      return newGrid;
    });
  };

  const handleEtch = () => {
    // Etch top layer where not protected by photoresist
    setCubeGrid(prevGrid => {
      const newGrid = prevGrid.map(xArray => 
        xArray.map(yArray => [...yArray])
      );
      
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const topHeight = getTopCubeHeight(x, y, prevGrid);
          
          if (topHeight > 0) { // Don't etch substrate
            // Check if this position is protected by photoresist
            let isProtected = false;
            for (let z = topHeight + 1; z < MAX_HEIGHT; z++) {
              if (newGrid[x][y][z] === MATERIALS.PHOTORESIST) {
                isProtected = true;
                break;
              }
            }
            
            // If not protected, etch the top cube
            if (!isProtected) {
              newGrid[x][y][topHeight] = MATERIALS.EMPTY;
            }
          }
        }
      }
      
      return newGrid;
    });
  };

  const handleCMP = () => {
    // Chemical Mechanical Planarization - flatten the surface
    setCubeGrid(prevGrid => {
      // Find the lowest height across all positions
      let minHeight = MAX_HEIGHT;
      
      // Find the minimum height across the surface
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const topHeight = getTopCubeHeight(x, y, prevGrid);
          if (topHeight < minHeight) {
            minHeight = topHeight;
          }
        }
      }
      
      // Remove everything above the minimum height to create a flat surface
      const newGrid = prevGrid.map(xArray => 
        xArray.map(yArray => [...yArray])
      );
      
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let z = minHeight + 1; z < MAX_HEIGHT; z++) {
            newGrid[x][y][z] = MATERIALS.EMPTY;
          }
        }
      }
      
      return newGrid;
    });
  };



  const openMaskEditor = () => setEditingMask(true);
  const saveMask = (m) => { setPhotomask(m); setEditingMask(false); };
  const cancelMask = () => setEditingMask(false);

  if (editingMask) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999
        }}
      >
        <PhotomaskEditor
          photomask={photomask}
          onSave={saveMask}
          onCancel={cancelMask}
          goalRects={goalRects}
        />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      background: '#f0f0f0'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateRows: '1fr 2fr',
        gridTemplateColumns: '1fr 2fr 200px',
        width: '80%', height: '80%',
        maxWidth: 1200, maxHeight: 800,
        background: '#fff',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Level Info Panel */}
        <div style={{ gridRow: '1/2', gridColumn: '1/2', background: '#f4f4f4' }}>
          <h3 style={{paddingLeft: 10}}>Build a {currentLevelData.name}</h3>
          <p style={{paddingLeft: 10}}>{currentLevelData.description}</p>
          <p style={{paddingLeft: 10}}>{currentLevelData.details}</p>
          <button 
            onClick={() => setCurrentLevel(null)} 
            style={{ 
              margin: '10px', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '4px', 
              background: '#007bff', 
              color: 'white', 
              cursor: 'pointer' 
            }}
          >
            ← Back to Level Select
          </button>
        </div>

        {/* 3D Goal with Clipping Slider */}
        <div style={{
          gridRow: '2/3',
          gridColumn: '1/2',
          background: '#f4f4f4',
          position: 'relative',
          width: '100%',
          height: '100%'
        }}>
          <Canvas
            style={{ width: '100%', height: 'calc(100% - 40px)' }}
            camera={{ position: [30, 20, 30], fov: 45 }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[-15, 15, 5]} intensity={1} />

            {/* Render substrate layers for goal as individual cubes */}
            {Array.from({ length: 5 }, (_, z) => {
              const cubes = [];
              for (let x = 0; x < GRID_SIZE; x++) {
                for (let y = 0; y < GRID_SIZE; y++) {
                  // Only render cubes at or below the slice position
                  if (x <= sliceX) {
                    const worldX = x - GRID_SIZE/2 + 0.5;
                    const worldY = z + 0.5;
                    const worldZ = y - GRID_SIZE/2 + 0.5;
                    
                    cubes.push(
                      <mesh 
                        key={`goal-substrate-${x}-${y}-${z}`} 
                        position={[worldX, worldY, worldZ]}
                      >
                        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
                        <meshStandardMaterial
                          color={MATERIALS.SUBSTRATE.color}
                        />
                      </mesh>
                    );
                  }
                }
              }
              return cubes;
            })}

            {/* Render goal structure as cubes */}
            {goalRects.map((r,i) => {
              // Convert old rect format to cube positions
              const startX = Math.floor(r.x * GRID_SIZE);
              const endX = Math.floor((r.x + r.w) * GRID_SIZE);
              const startY = Math.floor(r.y * GRID_SIZE);
              const endY = Math.floor((r.y + r.h) * GRID_SIZE);
              const z = r.l - 1 + 5; // Convert 1-based layer to 0-based z, offset by 5 for substrate
              
              const cubes = [];
              for (let x = startX; x < endX; x++) {
                for (let y = startY; y < endY; y++) {
                  // Only render cubes at or below the slice position
                  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && z >= 0 && z < MAX_HEIGHT && x <= sliceX) {
                    const worldX = x - GRID_SIZE/2 + 0.5;
                    const worldY = z + 0.5;
                    const worldZ = y - GRID_SIZE/2 + 0.5;
                    
                    cubes.push(
                      <mesh 
                        key={`goal-${i}-${x}-${y}-${z}`} 
                        position={[worldX, worldY, worldZ]}
                      >
                        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
                        <meshStandardMaterial
                          color={r.color}
                        />
                        {/*<Edges color="black" lineWidth={1} /> */}
                      </mesh>
                    );
                  }
                }
              }
              return cubes;
            })}

{/*              CAP THE CUT FACE 
            <mesh
              position={[slicePosition * GRID_SIZE - (GRID_SIZE/2 + 0.1), MAX_HEIGHT/2, 0]}
              rotation={[0, Math.PI/2, 0]}
            >
              <planeGeometry args={[GRID_SIZE, MAX_HEIGHT]} />
              <meshStandardMaterial
                color="#c0c0c0"
                side={THREE.DoubleSide}
              />
            </mesh> */}

            <OrbitControls />
          </Canvas>

          <input
            type="range"
            min={0} max={1} step={0.01}
            value={slicePosition}
            onChange={e => setSlicePosition(parseFloat(e.target.value))}
            style={{
              position: 'absolute',
              bottom: 10,
              left: '5%',
              width: '90%'
            }}
          />
        </div>

        {completed && (
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '3rem',
            color: '#28a745',
            zIndex: 10,
            pointerEvents: 'none',
          }}>
            Completed!
          </div>
        )}

        {completed && <Confetti />}

        
        {/* 3D View - Cube-based rendering */}
        <div style={{ gridRow:'1/3',gridColumn:'2/3' }}>
          <Canvas
            style={{ width:'100%',height:'100%' }}
            camera={{ position:[30, 20, 30], fov:45 }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[-15, 15, 5]} intensity={1} />

            {/* Render all cubes */}
            {cubeGrid.map((xArray, x) =>
              xArray.map((yArray, y) =>
                yArray.map((cube, z) => {
                  // Only render cubes at or below the slice position
                  if (cube === MATERIALS.EMPTY || x > sliceX) return null;
                  
                  const worldX = x - GRID_SIZE/2 + 0.5;
                  const worldY = z + 0.5;
                  const worldZ = y - GRID_SIZE/2 + 0.5;
                  
                  return (
                    <mesh 
                      key={`${x}-${y}-${z}`} 
                      position={[worldX, worldY, worldZ]}
                    >
                      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
                      <meshStandardMaterial
                        color={cube.color}
                      />
                      {/*{cube !== MATERIALS.SUBSTRATE && <Edges color="black" lineWidth={1} />}*/}
                    </mesh>
                  );
                })
              )
            )}

            {/* CAP THE CUT FACE
            <mesh
              position={[slicePosition * GRID_SIZE - (GRID_SIZE/2 + 0.1), MAX_HEIGHT/2, 0]}
              rotation={[0, Math.PI/2, 0]}
            >
              <planeGeometry args={[GRID_SIZE, MAX_HEIGHT]} />
              <meshStandardMaterial
                color="#c0c0c0"
                side={THREE.DoubleSide}
              />
            </mesh> */}

            <OrbitControls />
          </Canvas>
        </div>

        {/* Controls */}
        <div style={{
          gridRow: '1/3',
          gridColumn: '3/4',
          padding: 20,
          background: '#f4f4f4',
          display:'flex',
          flexDirection:'column',
          justifyContent:'center'
        }}>
          <button onClick={handleDeposit_Cu} style={{marginBottom:10}}>Deposit Cu</button>
          <button onClick={handleDeposit_SiO2} style={{marginBottom:10}}>Deposit SiO₂</button>
          <button onClick={handleDeposit_aSi} style={{marginBottom:10}}>Deposit aSi</button>
          <button onClick={handlePlasmaClean} style={{marginBottom:10}}>Plasma Clean</button>
          <button onClick={handleSpin} style={{marginBottom:10}}>Spin Photoresist</button>
          <button onClick={handleExposeDevelop} style={{marginBottom:10}}>Expose & Develop</button>
          <button onClick={handleEtch} style={{marginBottom:10}}>Dry Etch</button>
          <button onClick={handleCMP} style={{marginBottom:10}}>CMP</button>
          <button onClick={openMaskEditor} style={{height:140,marginBottom:10,position:'relative'}}>
            {photomask
              ? <img src={photomask} alt="Mask" style={{height:'100%',objectFit:'cover'}}/>
              : <span style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%, -50%)'}}>Edit Mask</span>
            }
          </button>
          <p>{diffCount} blocks away</p>
        </div>
      </div>
    </div>
  );
}
