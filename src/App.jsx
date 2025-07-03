import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { mask, pattern } from 'framer-motion/client';

function PhotomaskEditor({ photomask, onSave, onCancel }) {
  const canvasRef = useRef(null);

  // initialize empty grid once
  const [maskCells, setMaskCells] = useState(
    () => Array.from({ length: 20 }, () => Array(20).fill(false))
  );

  // whenever photomask URL changes, decode it back into maskCells
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
          const p = ctx.getImageData(c * cell + cell/2, r * cell + cell/2, 1, 1).data;
          if (p[0] < 128) newCells[r][c] = true;
        }
      }
      setMaskCells(newCells);
    };
  }, [photomask]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 400;
    drawGrid(ctx, canvas.width);
    drawCells(ctx, maskCells, canvas.width);
  }, [maskCells]);

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

  const drawCells = (ctx, cells, size) => {
    const cell = size / 20;
    ctx.fillStyle = '#000';
    cells.forEach((row, r) =>
      row.forEach((filled, c) => {
        if (filled) ctx.fillRect(c * cell, r * cell, cell, cell);
      })
    );
  };

  const handleClick = e => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell = canvas.width / 20;
    const c = Math.floor(x / cell);
    const r = Math.floor(y / cell);
    if (r < 0 || r >= 20 || c < 0 || c >= 20) return;
    const newCells = maskCells.map(row => row.slice());
    newCells[r][c] = !newCells[r][c];
    setMaskCells(newCells);
  };

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    drawGrid(ctx, canvas.width);
    drawCells(ctx, maskCells, canvas.width);
    onSave(canvas.toDataURL());
  };

  const handleReset = () => {
    setMaskCells(Array.from({ length: 20 }, () => Array(20).fill(false)));
  };

  const handleInvert = () => {
    setMaskCells(maskCells.map(row => row.map(cell => !cell)));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Photomask Editor</h2>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', cursor: 'pointer' }}
        onClick={handleClick}
      />
      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button onClick={handleSave}>Save Mask</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleInvert}>Invert</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// refactor everything to be squares, not layers and rectangles
export default function FabSimulator() {
  const [layers, setLayers] = useState([]);
  const [photomask, setPhotomask] = useState(null);
  const [editingMask, setEditingMask] = useState(false);
  const [maskRects, setMaskRects] = useState([]);
  const [patternedRects, setPatternedRects] = useState([]);
  const [isPatternedRects, setTFPatternedRects] = useState(false);
  const [PRLevel, setPRLevel] = useState(null);
  const [isResistMask, setResistMask] = useState(false);
  const [goalLayers, setGoalLayers] = useState([]);
  const [goalRects, setGoalRects] = useState([
  {
    "x": 0.4,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.15,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.2,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.25,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.7,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.75,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.8,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "grey"
  },
  {
    "x": 0.35,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.55,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.35,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.55,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.35,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.55,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.35,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.55,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.35,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.55,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.35,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.4,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.45,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.5,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.55,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 2,
    "color": "grey"
  },
  {
    "x": 0.35,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.55,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.35,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.55,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.35,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.55,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.35,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.55,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.35,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.55,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.35,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.4,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.45,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.5,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.55,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 3,
    "color": "#f6d186"
  },
  {
    "x": 0.35,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.4,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.45,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.5,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.55,
    "y": 0.35,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.35,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.4,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.45,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.5,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.55,
    "y": 0.4,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.35,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.4,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.45,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.5,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.55,
    "y": 0.45,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.35,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.4,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.45,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.5,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.55,
    "y": 0.5,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.35,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.4,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.45,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.5,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.55,
    "y": 0.55,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.35,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.4,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.45,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.5,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  },
  {
    "x": 0.55,
    "y": 0.6,
    "w": 0.05,
    "h": 0.05,
    "l": 1,
    "color": "#8ac6d1"
  }
]);

  const substrateHeight = 1.5;
  const depositThickness = 0.1;

  // slider state for clipping plane
  const [slicePosition, setSlicePosition] = useState(-0.0001);
  const clippingPlane = useMemo(() => {
    const cutX = slicePosition * 5 - 2.501;
    return new THREE.Plane(new THREE.Vector3(1, 0, 0), -cutX);
  }, [slicePosition]);

// Estimate mask cells from saved image
  const approximateMaskRects = async (url, layer) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    await new Promise(res => img.onload = res);
    const size = 200;
    const off = document.createElement('canvas');
    off.width = off.height = size;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const grid = 20;
    const rects = [];
    const cell = size / grid;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const p = ctx.getImageData(c * cell + cell/2, r * cell + cell/2, 1, 1).data;
        if (p[0] < 128) rects.push({ x: c / grid, y: r / grid, w: 1 / grid, h: 1 / grid, l: layer });
      }
    }
    return rects;
  };

  // Estimate mask cells from saved image
  const approximateLayerRects = async (url, layer) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    await new Promise(res => img.onload = res);
    const size = 200;
    const off = document.createElement('canvas');
    off.width = off.height = size;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const grid = 20;
    const rects = [];
    const cell = size / grid;
    let color = "#c0c0c0";
    if (layers.length > 0) {
      color = layers[layer-1].color;
    }

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const p = ctx.getImageData(c * cell + cell/2, r * cell + cell/2, 1, 1).data;
        if (p[0] < 128) rects.push({ x: c / grid, y: r / grid, w: 1 / grid, h: 1 / grid, l: layer, color: color});
      }
    }
    return rects;
  };

  const handleDeposit_Cu = () => {
    const color = '#f6d186';
    setLayers([...layers, { thickness: depositThickness, color }]);

    if (patternedRects) {
    const maxLevel = Math.max(...patternedRects.map(r => r.l));
      if (maxLevel > layers.length) {
      // Grab only the rects at that top level,
      // clone them with their level bumped by +1:
      const grown = patternedRects
        .filter(r => r.l === maxLevel)
        .map(r => ({ 
          ...r,          // copy x, y, w, h, color, etc.
          color: color,
          l: r.l + 1     // bump the level
        }));

      // Concatenate back to get the “tower grown” array:
      setPatternedRects(patternedRects.concat(grown));
      }
    }
  };

  const handleDeposit_SiO2 = () => {
    const color = '#8ac6d1';
    setLayers([...layers, { thickness: depositThickness, color }]);

    if (patternedRects) {
    const maxLevel = Math.max(...patternedRects.map(r => r.l));
      if (maxLevel > layers.length) {
      // Grab only the rects at that top level,
      // clone them with their level bumped by +1:
      const grown = patternedRects
        .filter(r => r.l === maxLevel)
        .map(r => ({ 
          ...r,          // copy x, y, w, h, color, etc.
          color: color,
          l: r.l + 1     // bump the level
        }));

      // Concatenate back to get the “tower grown” array:
      setPatternedRects(patternedRects.concat(grown));
      }
    }
  };

  const handleDeposit_aSi = () => {
    const color = 'grey';
    setLayers([...layers, { thickness: depositThickness, color }]);

    if (patternedRects) {
    const maxLevel = Math.max(...patternedRects.map(r => r.l));
      if (maxLevel > layers.length) {
      // Grab only the rects at that top level,
      // clone them with their level bumped by +1:
      const grown = patternedRects
        .filter(r => r.l === maxLevel)
        .map(r => ({ 
          ...r,          // copy x, y, w, h, color, etc.
          color: color,
          l: r.l + 1     // bump the level
        }));

      // Concatenate back to get the “tower grown” array:
      setPatternedRects(patternedRects.concat(grown));
      }
    }
  };

  const handleSpin = () => {
    //need some logic to handle if the highest layer is completely covered by patterened rects
    setLayers([...layers, { thickness: depositThickness, color: 'green' }]);
    //setPRLevel(layers.length-1);
    setMaskRects([]);
    if (patternedRects) {
    const maxLevel = Math.max(...patternedRects.map(r => r.l));
      if (maxLevel > layers.length) {
      // Grab only the rects at that top level,
      // clone them with their level bumped by +1:
      console.log("conditions met")
      const grown = patternedRects
        .filter(r => r.l === maxLevel)
        .map(r => ({ 
          ...r,          // copy x, y, w, h, color, etc.
          l: r.l - 1     // fix the level, I know magic number bad!
        }));

      // Concatenate back to get the “tower grown” array:
      setMaskRects(maskRects.concat(grown));
      return;
      }
    }

  };


  const handlePlasmaClean = () => {
    // Remove all resist layers (full and patterned)
    const idx = layers.findIndex(l => l.color === 'green');
    const newLayers = idx !== -1 ? layers.slice(0, idx) : layers;
    setLayers(newLayers);
    // Clear any patterned resist
    setResistMask(false)
    setMaskRects([]);
    setPRLevel(null);
    const json = JSON.stringify(patternedRects, null, 2);
    // 1) print to console
    console.log(json);
  };

  const handleExposeDevelop = async () => {
    if (!photomask) return;
    const idx = layers.findIndex(l => l.color === 'green');
    if (idx === -1) return;
    if (patternedRects) {
    const maxLevel = Math.max(...patternedRects.map(r => r.l));
    console.log(maxLevel);
    console.log(layers.length);
      if (maxLevel > layers.length) {
        const rects = await approximateMaskRects(photomask, maxLevel-1);

        setResistMask(true)
        setLayers(layers.slice(0, idx));
        setMaskRects(rects);
        return;
      }}

    const rects = await approximateMaskRects(photomask, layers.length-2);

    setResistMask(true)
    setLayers(layers.slice(0, idx));
    setMaskRects(rects);
  };

  //const handleEtch = () => setLayers(layers.slice(0, -1));

  const handleEtch = async () => {
    if (!isResistMask) {
      //remove top layer
      setLayers(layers.slice(0, -1));
      // remove top rectangles
      const maxLevel = Math.max(...patternedRects.map(r => r.l));
      const filtered = patternedRects.filter(r => r.l < maxLevel);
      setPatternedRects(filtered);
      return;
    }
    //else
    // get the newly computed mask‐rects:
    const maskRects = await approximateMaskRects(photomask)

    // 1) figure out what your current top‐level is:
    const maxLevel = Math.max(...patternedRects.map(r => r.l))

    // 2) grab everything below that level unchanged:
    const belowTop = patternedRects.filter(r => r.l < maxLevel)

    // 3) grab only those top‐level rects that actually intersect the mask:
    const topRects = patternedRects.filter(r => r.l === maxLevel)
    const underMask = topRects.filter(r =>
      maskRects.some(m =>
        r.x <  m.x + m.w &&
        r.x + r.w > m.x  &&
        r.y <  m.y + m.h &&
        r.y + r.h > m.y
      )
    )

    // 4) re-assemble the ones you’re preserving:
    const preserved = [...belowTop, ...underMask]

    // 5) grow your newly‐exposed layer on top of those
    const newLayerRects = await approximateLayerRects(photomask, layers.length)
    const newPatterned = preserved.concat(newLayerRects)

    //setMaskRects(maskRects)
    setPatternedRects(newPatterned)
    setLayers(layers.slice(0, -1))
  };

  const handleCMP = async () => {
    // the “blanket” film is exactly layers.length tall
    const fullLevel = layers.length;

    // remove any extra-patterned features above that
    setPatternedRects(prev => prev.filter(r => r.l <= fullLevel));

    // likewise knock off any mask‐overlays that poke above
    setMaskRects(prev => prev.filter(r => r.l <= fullLevel));
  }

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
        {/* MOSFET Panel */}
        <div style={{ gridRow: '1/2', gridColumn: '1/2', background: '#f4f4f4' }}>
          <h3 style={{paddingLeft: 10}}>Build a MOSFET</h3>
          <p style={{paddingLeft: 10}}>Metal-Oxide Semiconductor Field Effect Transistor</p>
          <p style={{paddingLeft: 10}}>Modern chips have <b>billions</b> of these small electronic switches.</p>
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
            gl={{ localClippingEnabled: true }}
            style={{ width: '100%', height: 'calc(100% - 40px)' }}
            camera={{ position: [3, 6, 12], fov: 45 }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5,10,7]} intensity={1} />

            {/* substrate */}
            <mesh position={[0, substrateHeight/2, 0]}>
              <boxGeometry args={[5, substrateHeight, 5]} />
              <meshStandardMaterial
                color="#c0c0c0"
                clippingPlanes={[clippingPlane]}
                clipShadows
              />
            </mesh>

            {/* patterned deposits */}
            {goalRects.map((r,i) => {
              const yPos = substrateHeight + (r.l-1)*depositThickness + depositThickness/2;
              const x = (r.x + r.w/2 - 0.5)*5;
              const z = (r.y + r.h/2 - 0.5)*5;
              return (
                <mesh key={i} position={[x, yPos, z]}>
                  <boxGeometry args={[r.w*5, depositThickness, r.h*5]} />
                  <meshStandardMaterial
                    color={r.color}
                    clippingPlanes={[clippingPlane]}
                    clipShadows
                  />
                </mesh>
              );
            })}

            {/* CAP THE CUT FACE */}
            <mesh
              position={[slicePosition * 5 - 2.501, substrateHeight/2, 0]}
              rotation={[0, Math.PI/2, 0]}
            >
              <planeGeometry args={[5, substrateHeight]} />
              <meshStandardMaterial
                color="#c0c0c0"
                side={THREE.DoubleSide}
              />
            </mesh>

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

        {/* 3D View, also clipped */}
        <div style={{ gridRow:'1/3',gridColumn:'2/3' }}>
          <Canvas
            gl={{ localClippingEnabled: true }}
            style={{ width:'100%',height:'100%' }}
            camera={{ position:[3,5,10], fov:45 }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5,10,7]} intensity={1} />

            {/* substrate */}
            <mesh position={[0, substrateHeight/2, 0]}>
              <boxGeometry args={[5, substrateHeight, 5]} />
              <meshStandardMaterial
                color="#c0c0c0"
                clippingPlanes={[clippingPlane]}
                clipShadows
              />
            </mesh>

            {/* stacked layers */}
            {layers.map((l,i) => {
              const yOff = layers.slice(0,i).reduce((sum,x)=>sum+x.thickness, substrateHeight);
              return (
                <mesh key={i} position={[0, yOff + l.thickness/2, 0]}>
                  <boxGeometry args={[5, l.thickness, 5]} />
                  <meshStandardMaterial
                    color={l.color}
                    clippingPlanes={[clippingPlane]}
                    clipShadows
                  />
                </mesh>
              );
            })}

            {/* patterned deposits */}
            {patternedRects.map((r,i) => {
              const yPos = substrateHeight + (r.l-1)*depositThickness + depositThickness/2;
              const x = (r.x + r.w/2 - 0.5)*5;
              const z = (r.y + r.h/2 - 0.5)*5;
              return (
                <mesh key={i} position={[x, yPos, z]}>
                  <boxGeometry args={[r.w*5, depositThickness, r.h*5]} />
                  <meshStandardMaterial
                    color={r.color}
                    clippingPlanes={[clippingPlane]}
                    clipShadows
                  />
                </mesh>
              );
            })}

            {/* resist mask */}
            {maskRects.map((r,i) => {
              const yPos = substrateHeight + r.l*depositThickness + depositThickness*1.5;
              const x = (r.x + r.w/2 - 0.5)*5;
              const z = (r.y + r.h/2 - 0.5)*5;
              return (
                <mesh key={i} position={[x, yPos, z]}>
                  <boxGeometry args={[r.w*5, depositThickness, r.h*5]} />
                  <meshStandardMaterial
                    color="green"
                    clippingPlanes={[clippingPlane]}
                    clipShadows
                  />
                </mesh>
              );
            })}

            {/* CAP THE CUT FACE */}
            <mesh
              position={[slicePosition * 5 - 2.501, substrateHeight/2, 0]}
              rotation={[0, Math.PI/2, 0]}
            >
              <planeGeometry args={[5, substrateHeight]} />
              <meshStandardMaterial
                color="#c0c0c0"
                side={THREE.DoubleSide}
              />
            </mesh>

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
        </div>
      </div>
    </div>
  );
}
