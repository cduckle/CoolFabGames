import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// // Photomask Editor with grid-based square drawing
// function PhotomaskEditor({ photomask, onSave, onCancel }) {
//   const canvasRef = useRef(null);
//   const [maskCells, setMaskCells] = useState(
//     Array.from({ length: 20 }, () => Array(20).fill(false))
//   );

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     canvas.width = 400;
//     canvas.height = 400;
//     // draw grid and existing cells
//     drawGrid(ctx, canvas.width);
//     drawCells(ctx, maskCells, canvas.width);
//   }, [maskCells]);

//   function drawGrid(ctx, size) {
//     const cell = size / 20;
//     ctx.clearRect(0, 0, size, size);
//     ctx.fillStyle = '#fff';
//     ctx.fillRect(0, 0, size, size);
//     ctx.strokeStyle = '#000';
//     ctx.lineWidth = 1;
//     for (let i = 0; i <= 20; i++) {
//       const p = i * cell;
//       ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
//       ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
//     }
//   }

//   function drawCells(ctx, cells, size) {
//     const cell = size / 20;
//     ctx.fillStyle = '#000';
//     cells.forEach((row, r) => row.forEach((filled, c) => {
//       if (filled) ctx.fillRect(c * cell, r * cell, cell, cell);
//     }));
//   }

//   const handleClick = (e) => {
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     const cell = canvas.width / 20;
//     const c = Math.floor(x / cell);
//     const r = Math.floor(y / cell);
//     if (r < 0 || r >= 20 || c < 0 || c >= 20) return;
//     const newCells = maskCells.map(row => row.slice());
//     newCells[r][c] = !newCells[r][c];
//     setMaskCells(newCells);
//   };

//   const handleSave = () => {
//     const canvas = document.createElement('canvas');
//     canvas.width = 400;
//     canvas.height = 400;
//     const ctx = canvas.getContext('2d');
//     drawGrid(ctx, canvas.width);
//     drawCells(ctx, maskCells, canvas.width);
//     onSave(canvas.toDataURL());
//   };

//   const handleReset = () => {
//     setMaskCells(Array.from({ length: 20 }, () => Array(20).fill(false)));
//   };

//   const handleInvert = () => {
//     setMaskCells(maskCells.map(row => row.map(cell => !cell)));
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Photomask Editor</h2>
//       <canvas
//         ref={canvasRef}
//         style={{ border: '1px solid #000', cursor: 'pointer' }}
//         onClick={handleClick}
//       />
//       <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
//         <button onClick={handleSave}>Save Mask</button>
//         <button onClick={handleReset}>Reset Mask</button>
//         <button onClick={handleInvert}>Invert Mask</button>
//         <button onClick={onCancel}>Cancel</button>
//       </div>
//     </div>
//   );
// }
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

// 2D cross-section component
function CrossSection({ layers, substrateHeight, maskRects }) {
  const totalH = substrateHeight + layers.reduce((s, l) => s + l.thickness, 0);
  const scale = 100 / totalH;
  const shapes = [];
  // substrate
  shapes.push({ color: '#c0c0c0', h: substrateHeight });
  layers.forEach(l => shapes.push({ color: l.color, h: l.thickness }));
  let cum = 0;
  const rects = shapes.map((s, i) => {
    const hh = s.h * scale;
    const y = 100 - (cum + s.h) * scale;
    cum += s.h;
    return (
      <rect key={i} x={10} y={y} width={80} height={hh} fill={s.color} stroke="#000" />
    );
  });
  // overlay mask in cross-section: full height, positions ignored
  const overlays = maskRects.map((r, i) => (
    <rect key={i} x={10 + r.x * 80} y={0} width={r.w * 80} height={100} fill="rgba(0,0,255,0.1)" />
  ));

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', background: '#eaeaea' }}>
      {rects}
      {overlays}
    </svg>
  );
}

export default function FabSimulator() {
  const [layers, setLayers] = useState([]);
  const [photomask, setPhotomask] = useState(null);
  const [editingMask, setEditingMask] = useState(false);
  const [maskRects, setMaskRects] = useState([]);
  const [patternedRects, setPatternedRects] = useState([]);
  const [isPatternedRects, setTFPatternedRects] = useState(false);  // Initialize to false
  const [PRLevel, setPRLevel] = useState(null);
 
  const substrateHeight = 1.5;
  const depositThickness = 0.1;
  const [isResistMask, setResistMask] = useState(false);  // Initialize to false


  // Estimate mask cells from saved image
  const approximateMaskRects = async (url) => {
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
        if (p[0] < 128) rects.push({ x: c / grid, y: r / grid, w: 1 / grid, h: 1 / grid, l: PRLevel });
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
  };

  const handleDeposit_SiO2 = () => {
    const color = '#8ac6d1';
    setLayers([...layers, { thickness: depositThickness, color }]);

    if (patternedRects) {
    const maxLevel = Math.max(...patternedRects.map(r => r.l));

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
  };

  const handleDeposit_aSi = () => {
    const color = '#c0c0c0';
    setLayers([...layers, { thickness: depositThickness, color }]);

    if (patternedRects) {
    const maxLevel = Math.max(...patternedRects.map(r => r.l));

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
  };

  const handleSpin = () => {
    setLayers([...layers, { thickness: depositThickness, color: 'green' }]);
    setPRLevel(layers.length-1);
    setMaskRects([]);
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
  };

  const handleExposeDevelop = async () => {
    if (!photomask) return;
    const idx = layers.findIndex(l => l.color === 'green');
    if (idx === -1) return;
    const rects = await approximateMaskRects(photomask, layers.length-1);
    // keep underlying layers, and then add patterned resist
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

    const rects = await approximateMaskRects(photomask);
    // keep underlying layers, and then add patterned resist

    const patterned_rects = patternedRects.concat(await approximateLayerRects(photomask, layers.length));
    setMaskRects(rects);
    setPatternedRects(patterned_rects);
    setLayers(layers.slice(0, -1));
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
        //background: 'rgba(0,0,0,0.3)',  // optional dim-behind
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#f0f0f0' }}>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 2fr', gridTemplateColumns: '1fr 2fr 200px', width: '80%', height: '80%', maxWidth: 1200, maxHeight: 800, background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        
        <div style={{ gridRow: '1/2', gridColumn: '1/2', padding: 0, background: '#f4f4f4', width: '100%', height: '100%' }}>
        <h3 style={{paddingLeft: 10}}>MOSFET</h3>
        <p style={{paddingLeft: 10}}>Metal-Oxide Semiconductor Field Effect Transistor</p>
        <p style={{paddingLeft: 10}}>Modern chips have billions of these small electronic switches that controls the flow of electricity</p>
        </div>
        {/* 3D Goal */}
        <div style={{ gridRow: '2/3', gridColumn: '1/2', background: '#f4f4f4', padding: 0, width: '100%', height: '100%' }}>
          <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [6,10,20], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5,10,7]} intensity={1} />
            {/* substrate */}
            <mesh position={[0, substrateHeight/2, 0]}> <boxGeometry args={[5,substrateHeight,5]} /> <meshStandardMaterial color="#c0c0c0" /> </mesh>
            
            <OrbitControls />
          </Canvas>
        </div>
        {/* 3D View */}
        <div style={{ gridRow: '1/3', gridColumn: '2/3', width: '100%', height: '100%' }}>
          <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [3,5,10], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5,10,7]} intensity={1} />
            {/* substrate */}
            <mesh position={[0, substrateHeight/2, 0]}> <boxGeometry args={[5,substrateHeight,5]} /> <meshStandardMaterial color="#c0c0c0" /> </mesh>
            {/* existing layers */}
            {layers.map((l,i) => {
              const yOff = layers.slice(0,i).reduce((s,x)=>s+x.thickness, substrateHeight);
              const yPos = yOff + l.thickness/2;
              return <mesh key={i} position={[0, yPos, 0]}> <boxGeometry args={[5, l.thickness,5]} /> <meshStandardMaterial color={l.color} /></mesh>;
            })}
            {/* patterned layers */}
            {patternedRects.map((r,i)=>{
              const yPos = substrateHeight + (r.l-1)*depositThickness + depositThickness/2;
              const x = (r.x + r.w/2 - 0.5)*5;
              const z = (r.y + r.h/2 - 0.5)*5;
              
              
              return <mesh key={i} position={[x,yPos,z]}> <boxGeometry args={[r.w*5, depositThickness, r.h*5]} /> <meshStandardMaterial color={r.color} /></mesh>;
            })}
            {/* patterned resist */}
            {maskRects.map((r,i)=>{
              const yPos = substrateHeight + (r.l)*depositThickness + depositThickness + depositThickness/2;
              const x = (r.x + r.w/2 - 0.5)*5;
              const z = (r.y + r.h/2 - 0.5)*5;

              return <mesh key={i} position={[x,yPos,z]}> <boxGeometry args={[r.w*5, depositThickness, r.h*5]} /> <meshStandardMaterial color="green" /></mesh>;
            })}
            <OrbitControls />
          </Canvas>
        </div>
        {/* Controls */}
        <div style={{ gridRow: '1/3', gridColumn: '3/4', padding: 20, background: '#f4f4f4', display:'flex',flexDirection:'column',justifyContent:'center' }}>
          <button onClick={handleDeposit_Cu} style={{marginBottom:10}}>Deposit Cu</button>
          <button onClick={handleDeposit_SiO2} style={{marginBottom:10}}>Deposit SiO2</button>
          <button onClick={handleDeposit_aSi} style={{marginBottom:10}}>Deposit aSi</button>
          <button onClick={handlePlasmaClean} style={{marginBottom:10}}>Plasma Clean</button>
          <button onClick={handleSpin} style={{marginBottom:10}}>Spin Photoresist</button>
          <button onClick={handleExposeDevelop} style={{marginBottom:10}}>Expose & Develop</button>
          <button onClick={handleEtch} style={{marginBottom:10}}>Dry Etch</button>
          <button onClick={handleCMP} style={{marginBottom:10}}>CMP</button>
          <button onClick={openMaskEditor} style={{height:140,marginBottom:10,position:'relative'}}>
            {photomask ? <img src={photomask} alt="Mask" style={{height:'100%',objectFit:'cover'}}/> : <span style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%, -50%)'}}>Edit Mask</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
