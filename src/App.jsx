import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { mask, pattern } from 'framer-motion/client';
import { MOSFET_GOAL_RECTS } from './mosfetGoal.js';
import Confetti from 'react-confetti';


// Level definitions
const LEVELS = {
  introduction: {
    name: 'Introduction',
    description: 'Welcome to Cool Fab Games',
    details: 'Learn about nano-fabrication and the basic building blocks of digital devices.',
    goalRects: [] // No goal for introduction level
  },
  
  waveguide: {
    name: 'Waveguide',
    description: 'Optical Waveguide',
    details: 'Guides light through a narrow channel for photonic circuits. This includes a SiO2 cladding for protection and light isolation.',
    goalRects: [
      // Waveguide core - remaining silicon strip in substrate layer (l: 0 means substrate layer z=4)
      { x: 0.2, y: 0.45, w: 0.6, h: 0.1, l: 0, color: '#c0c0c0' },
      // SiO2 cladding above the waveguide core
      { x: 0, y: 0, w: 1, h: 1, l: 1, color: '#8ac6d1' },
      // SiO2 cladding surrounding the waveguide core
      { x: 0, y: 0, w: 1, h: 0.45, l: 0, color: '#8ac6d1' },
      // SiO2 cladding surrounding the waveguide core
      { x: 0, y: 0.55, w: 1, h: 0.45, l: 0, color: '#8ac6d1' },
      // SiO2 cladding surrounding the waveguide core
      { x: 0, y: 0.45, w: 0.2, h: 0.1, l: 0, color: '#8ac6d1' },
      // SiO2 cladding surrounding the waveguide core
      { x: 0.8, y: 0.45, w: 0.2, h: 0.1, l: 0, color: '#8ac6d1' },
    ]
  },
  spiral: {
    name: 'Spiral Waveguide',
    description: 'Spiral Optical Waveguide',
    details: 'A compact spiral design for delay lines and filters.',
    goalRects: [
      // Spiral pattern
      { x: 0.3, y: 0.3, w: 0.4, h: 0.05, l: 0, color: '#c0c0c0' },
      { x: 0.3, y: 0.65, w: 0.4, h: 0.05, l: 0, color: '#c0c0c0' },
      { x: 0.3, y: 0.3, w: 0.05, h: 0.4, l: 0, color: '#c0c0c0' },
      { x: 0.65, y: 0.3, w: 0.05, h: 0.4, l: 0, color: '#c0c0c0' },
      { x: 0.35, y: 0.4, w: 0.25, h: 0.05, l: 0, color: '#c0c0c0' },
      { x: 0.35, y: 0.55, w: 0.25, h: 0.05, l: 0, color: '#c0c0c0' },
      { x: 0.35, y: 0.4, w: 0.05, h: 0.2, l: 0, color: '#c0c0c0' },
      { x: 0.55, y: 0.4, w: 0.05, h: 0.2, l: 0, color: '#c0c0c0' },
    ]
  },
  splitter: {
    name: 'Y-Splitter',
    description: 'Optical Power Splitter',
    details: 'Splits one optical signal into two equal parts.',
    goalRects: [
      // Input waveguide
      { x: 0.1, y: 0.45, w: 0.3, h: 0.1, l: 0, color: '#c0c0c0' },
      // Split section
      { x: 0.4, y: 0.4, w: 0.2, h: 0.2, l: 0, color: '#c0c0c0' },
      // Output waveguides
      { x: 0.6, y: 0.3, w: 0.3, h: 0.1, l: 0, color: '#c0c0c0' },
      { x: 0.6, y: 0.6, w: 0.3, h: 0.1, l: 0, color: '#c0c0c0' }
    ]
  },
  coupler: {
    name: 'Directional Coupler',
    description: 'Optical Directional Coupler',
    details: 'Couples light between two parallel waveguides.',
    goalRects: [
      // Two parallel waveguides
      { x: 0.1, y: 0.35, w: 0.8, h: 0.1, l: 0, color: '#c0c0c0' },
      { x: 0.1, y: 0.55, w: 0.8, h: 0.1, l: 0, color: '#c0c0c0' },
      // Coupling region (closer spacing)
      { x: 0.4, y: 0.46, w: 0.2, h: 0.08, l: 0, color: '#c0c0c0' }
    ]
  },
    mosfet: {
    name: 'MOSFET',
    description: 'Metal-Oxide Semiconductor Field Effect Transistor',
    details: 'Modern chips have billions of these small electronic switches.',
    goalRects: MOSFET_GOAL_RECTS
  },
};

function LevelSelect({ onSelectLevel }) {
  // Check if tutorial has been completed
  const checkTutorialCompleted = () => {
    const savedProgress = localStorage.getItem('tutorialProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        // Tutorial is completed if tutorialStep is at the final step (12)
        return parsed.tutorialStep >= 12;
      } catch (e) {
        return false;
      }
    }
    return false;
  };
  
  // Check if a level has been completed
  const checkLevelCompleted = (levelKey) => {
    if (levelKey === 'introduction') {
      return checkTutorialCompleted();
    }
    
    const savedProgress = localStorage.getItem(`${levelKey}Progress`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        return parsed.completed === true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };
  
  const isTutorialCompleted = checkTutorialCompleted();
  
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
        {Object.entries(LEVELS).map(([key, level]) => {
          const isCompleted = checkLevelCompleted(key);
          
          return (
            <div
              key={key}
              style={{
                background: '#fff',
                border: '2px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                position: 'relative'
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
              
              {/* Completed indicator */}
              {isCompleted && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#28a745',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  Completed
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Arrow component for pointing to 3D elements
function Arrow3D({ fromX, fromY, toX, toY, color = '#007bff' }) {
  const arrowLength = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: fromX,
        top: fromY,
        width: arrowLength,
        height: '2px',
        backgroundColor: color,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        zIndex: 11,
        pointerEvents: 'none'
      }}
    >
      {/* Arrow head */}
      <div
        style={{
          position: 'absolute',
          right: '-8px',
          top: '-4px',
          width: '0',
          height: '0',
          borderLeft: '8px solid ' + color,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent'
        }}
      />
    </div>
  );
}

// Tutorial steps data
const tutorialSteps = [
  {
    title: "Welcome",
    content: (
      <div>
        <p>This is a nano-fabrication simulator, where you'll get to build the devices that enable our digital world, using real processing steps.</p>
        <p>Let's start by exploring the basic building blocks...</p>
      </div>
    ),
    arrows: [],
    arrowTargets: [

    ]
  },
  {
    title: "Silicon basics",
    content: (
      <div>
        <p>Silicon forms the foundation that essentially all modern electronics are built on.</p>
        <p>Its perfect crystal structure makes it ideal for controlling electrical current, as well as light.</p>
        <p>For now, though, it'll just look grey.</p>
      </div>
    ),
    arrows: [
      { target: "top-silicon", text: "Devices are built on this top layer of silicon", position: "top" },
      { target: "substrate", text: "Silicon is also strong, and it forms a good backbone for a chip. It is called the substrate.", position: "bottom" }
    ],
    arrowTargets: [
      { fromPercent: { x: 30, y: 50 }, toPercent: { x: 45, y: 48 }, color: '#007bff' }, // Point to top silicon
      { fromPercent: { x: 30, y: 60 }, toPercent: { x: 49, y: 60 }, color: '#007bff' }  // Point to substrate
    ]
  },
  {
    title: "Buried oxide",
    content: (
      <div>
        <p>This blue layer is silicon dioxide (SiO₂), also known as glass!</p>
        <p>It acts as an insulator between the silicon layers.</p>
        <p>This structure is called Silicon-On-Insulator (SOI) and is commonly used in modern chips.</p>
      </div>
    ),
    arrows: [
      { target: "buried-oxide", text: "This buried oxide layer provides electrical and light isolation", position: "right" }
    ],
    arrowTargets: [
      { fromPercent: { x: 30, y: 50 }, toPercent: { x: 45, y: 52 }, color: '#8ac6d1' } // Point to buried oxide
    ]
  },
  {
    title: "Depositing Copper",
    content: (
      <div>
        <p>Now let's add our first metal layer - copper!</p>
        <p>The copper atoms are deposited uniformly across the entire surface, forming a thin conductive layer.</p>
        <p>This can be done using physical vapor deposition (<a target="_blank" href="https://youtu.be/3fXAy0NzIa0?si=xhv8Yy6fJBKFeRrw&t=23">PVD</a>) or electroplating.</p>

        <p><strong>Try it:</strong> Click the "Deposit Cu" button to add a copper layer!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Spin Photoresist",
    content: (
      <div>
        <p>Now let's apply a photoresist layer for patterning!</p>
        <p>Photoresist is a light-sensitive polymer that can be used to create patterns on the wafer.</p>
        <p>The spin coating process creates a uniform thin film across the entire surface.</p>
        <p><strong>Try it:</strong> Click the "Spin Photoresist" button to apply the photoresist!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Edit photomask",
    content: (
      <div>
        <p>Now let's create a photomask pattern for lithography!</p>
        <p>A photomask is used to selectively expose areas of the photoresist to light.</p>
        <p>The mask editor allows you to draw patterns that will be transferred to the wafer.</p>
        <p><strong>Try it:</strong> Click the "Edit Mask" button to open the mask editor!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Expose & Develop",
    content: (
      <div>
        <p>Now let's expose the photoresist through our mask!</p>
        <p>During exposure, UV light passes through the clear areas of the mask and hits the photoresist.</p>
        <p>The develop step then removes the exposed photoresist, leaving behind a pattern that matches your mask.</p>
        <p><strong>Try it:</strong> Click the "Expose & Develop" button to pattern the photoresist!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Dry Etch",
    content: (
      <div>
        <p>Now let's etch the copper layer using our patterned photoresist!</p>
        <p>Dry etching uses plasma to remove material from areas not protected by photoresist.</p>
        <p>The photoresist acts as a mask, protecting some areas while allowing others to be etched away.</p>
        <p><strong>Try it:</strong> Click the "Dry Etch" button to etch the copper in the pattern you created!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Deposit SiO₂ Cladding",
    content: (
      <div>
        <p>Now let's add a protective silicon dioxide (SiO₂) cladding layer!</p>
        <p>Cladding protects the underlying structures and provides electrical and light isolation.</p>
        <p>This oxide layer is deposited over the entire surface, filling gaps and covering the etched copper pattern.</p>
        <p><strong>Try it:</strong> Click the "Deposit SiO₂" button <strong>twice</strong> to build up a thick cladding layer!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Chemical Mechanical Polishing (CMP)",
    content: (
      <div>
        <p>Now let's flatten the surface using Chemical Mechanical Polishing (CMP)!</p>
        <p>CMP combines chemicals with mechanical grinding to create a perfectly flat surface.</p>
        <p>CMP is essential in modern semiconductor manufacturing for creating the multiple metal layers in advanced chips.</p>
        <p>Learn more <a target="_blank" href="https://www.youtube.com/watch?v=WjzlXe8E-jE">here</a> </p>
        <p><strong>Try it:</strong> Click the "CMP" button to flatten the surface!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Deposit Amorphous Silicon",
    content: (
      <div>
        <p>Now let's deposit amorphous silicon (a-Si) for our next layer!</p>
        <p>Amorphous silicon is a non-regular form of silicon.</p>
        <p>Amorphous silicon is much easier to make than crystalline-silicon. It can be deposited at low temperatures and on flexible substrates.</p>
        <p>It's commonly used in display technologies like LCD screens and in solar panels.</p>
        <p><strong>Try it:</strong> Click the "Deposit aSi" button to add the amorphous silicon layer!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  },
  {
    title: "Second Patterning Step",
    content: (
      <div>
        <p>Let's do another patterning step!</p>
        <p>First, spin photoresist on the amorphous silicon layer. We have the mask you created earlier still loaded. Now click expose and develop to put that pattern into the photoresist!</p>
        <p>In real fabrication, multiple patterning (lithography) steps are used to create complex multilayer structures.</p>
        <p><strong>Try it:</strong> Click both the "Spin Photoresist" and "Expose & Develop" buttons to complete the lithography process!</p>
      </div>
    ),
    arrows: [

    ],
    arrowTargets: [

    ],
    interactive: true
  },
  {
    title: "Plasma Clean",
    content: (
      <div>
        <p>Finally, let's clean up our fabrication with a plasma clean step!</p>
        <p>Plasma cleaning removes the remaining photoresist.</p>
        <p>This step uses ionized gas (plasma) to strip away the photoresist mask, leaving behind only the desired pattern.</p>
        <p><strong>Try it:</strong> Click the "Plasma Clean" button to remove the photoresist and complete the fabrication!</p>
      </div>
    ),
    arrows: [
    ],
    arrowTargets: [
    ],
    interactive: true
  }
];

// Introduction Tutorial Component
function IntroductionTutorial({ onNext, onBack, currentStep, stepCompleted, onDepositCopper, onSpinPhotoresist, cubeGrid, onEditMask, photomask, onExposeDevelop, onDryEtch, onDepositSiO2, onCMP, onDepositASi, onPlasmaClean }) {
  const orbitControlsRef = useRef();
  
  // Check if tutorial has been completed (allows free navigation)
  const isTutorialCompleted = () => {
    const savedProgress = localStorage.getItem('tutorialProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        return parsed.tutorialStep >= 12;
      } catch (e) {
        return false;
      }
    }
    return false;
  };
  
  const tutorialCompleted = isTutorialCompleted();
  
  // Animate camera reset to default position when step changes
  useEffect(() => {
    if (orbitControlsRef.current) {
      // Enable smooth transitions
      orbitControlsRef.current.enableDamping = true;
      orbitControlsRef.current.dampingFactor = 0.05;
      
      // Animate back to default position
      const targetPosition = new THREE.Vector3(30, 20, 30);
      const targetTarget = new THREE.Vector3(0, 0, 0);
      
      // Smooth animation using built-in reset with custom animation
      const controls = orbitControlsRef.current;
      const camera = controls.object;
      
      // Create a smooth transition
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      
      const animateCamera = () => {
        const duration = 1000; // 1 second
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Smooth easing function (ease-out)
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          // Interpolate position
          camera.position.lerpVectors(startPosition, targetPosition, easeOut);
          controls.target.lerpVectors(startTarget, targetTarget, easeOut);
          
          controls.update();
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      };
      
      // Start the animation
      animateCamera();
    }
  }, [currentStep]);
  
  const steps = tutorialSteps;

  const currentStepData = steps[currentStep] || steps[0];

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
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {/* Controls Panel for Tutorial */}
        <div style={{
          gridRow: '1/3',
          gridColumn: '3/4',
          padding: 20,
          background: '#f4f4f4',
          display:'flex',
          flexDirection:'column',
          justifyContent:'center'
        }}>
          <button 
            onClick={currentStep === 3 ? onDepositCopper : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: currentStep === 3 ? '#f6d186' : '#ccc',
              color: currentStep === 3 ? 'white' : '#999',
              cursor: currentStep === 3 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 3 ? 1 : 0.5
            }}
            disabled={currentStep !== 3}
          >
            Deposit Cu
          </button>
          <button 
            id="sio2-button"
            onClick={currentStep === 8 ? onDepositSiO2 : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: currentStep === 8 ? '#8ac6d1' : '#ccc',
              color: currentStep === 8 ? 'white' : '#999',
              cursor: currentStep === 8 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 8 ? 1 : 0.5
            }}
            disabled={currentStep !== 8}
          >
            Deposit SiO₂
          </button>
          <button 
            id="asi-button"
            onClick={currentStep === 10 ? onDepositASi : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: currentStep === 10 ? '#808080' : '#ccc',
              color: currentStep === 10 ? 'white' : '#999',
              cursor: currentStep === 10 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 10 ? 1 : 0.5
            }}
            disabled={currentStep !== 10}
          >
            Deposit aSi
          </button>
          <button 
            id="plasma-clean-button"
            onClick={currentStep === 12 ? onPlasmaClean : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: currentStep === 12 ? '#17a2b8' : '#ccc',
              color: currentStep === 12 ? 'white' : '#999',
              cursor: currentStep === 12 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 12 ? 1 : 0.5
            }}
            disabled={currentStep !== 12}
          >
            Plasma Clean
          </button>
          <button 
            onClick={(currentStep === 4 || currentStep === 11) ? onSpinPhotoresist : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: (currentStep === 4 || currentStep === 11) ? '#28a745' : '#ccc',
              color: (currentStep === 4 || currentStep === 11) ? 'white' : '#999',
              cursor: (currentStep === 4 || currentStep === 11) ? 'pointer' : 'not-allowed',
              opacity: (currentStep === 4 || currentStep === 11) ? 1 : 0.5
            }}
            disabled={currentStep !== 4 && currentStep !== 11}
          >
            Spin Photoresist
          </button>
          <button 
            onClick={(currentStep === 6 || currentStep === 11) ? onExposeDevelop : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: (currentStep === 6 || currentStep === 11) ? '#dc3545' : '#ccc',
              color: (currentStep === 6 || currentStep === 11) ? 'white' : '#999',
              cursor: (currentStep === 6 || currentStep === 11) ? 'pointer' : 'not-allowed',
              opacity: (currentStep === 6 || currentStep === 11) ? 1 : 0.5
            }}
            disabled={currentStep !== 6 && currentStep !== 11}
          >
            Expose & Develop
          </button>
          <button 
            onClick={currentStep === 7 ? onDryEtch : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: currentStep === 7 ? '#ffc107' : '#ccc',
              color: currentStep === 7 ? 'white' : '#999',
              cursor: currentStep === 7 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 7 ? 1 : 0.5
            }}
            disabled={currentStep !== 7}
          >
            Dry Etch
          </button>
          <button 
            id="cmp-button"
            onClick={currentStep === 9 ? onCMP : undefined}
            style={{
              marginBottom: 10,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: currentStep === 9 ? '#ffc107' : '#ccc',
              color: currentStep === 9 ? 'white' : '#999',
              cursor: currentStep === 9 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 9 ? 1 : 0.5
            }}
            disabled={currentStep !== 9}
          >
            CMP
          </button>
          <button 
            onClick={currentStep === 5 ? onEditMask : undefined}
            style={{
              height: 140,
              marginBottom: 10,
              position: 'relative',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: currentStep === 5 ? '#6c757d' : '#ccc',
              color: currentStep === 5 ? 'white' : '#999',
              cursor: currentStep === 5 ? 'pointer' : 'not-allowed',
              opacity: currentStep === 5 ? 1 : 0.5
            }}
            disabled={currentStep !== 5}
          >
            {photomask
              ? <img src={photomask} alt="Mask" style={{height:'100%',objectFit:'cover'}}/>
              : <span style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  Edit Mask
                </span>
            }
          </button>
        </div>
        {/* Tutorial Info Panel */}
        <div style={{ gridRow: '1/2', gridColumn: '1/2', background: '#f4f4f4', padding: 20 }}>
          <h3>{currentStepData.title}</h3>
          {currentStepData.content}
        </div>

        {/* Additional explanation area */}
        <div style={{
          gridRow: '2/3',
          gridColumn: '1/2',
          background: '#f4f4f4',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {currentStepData.arrows.map((arrow, index) => (
              <div key={index} style={{ marginBottom: 15, padding: 10, background: '#fff', borderRadius: 4, border: '1px solid #ddd' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>→ {arrow.text}</p>
              </div>
            ))}
          </div>
          
          {/* Navigation buttons at bottom */}
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button 
              onClick={onBack}
              style={{ 
                padding: '8px 16px', 
                border: 'none', 
                borderRadius: '4px', 
                background: '#6c757d', 
                color: 'white', 
                cursor: 'pointer' 
              }}
            >
              {currentStep > 0 ? '← Back' : '← Back to Level Select'}
            </button>
            <button 
              onClick={onNext}
              style={{ 
                padding: '8px 16px', 
                border: 'none', 
                borderRadius: '4px', 
                background: (currentStep >= 3 && currentStep <= 12 && !stepCompleted && !tutorialCompleted) ? '#ccc' : '#007bff', 
                color: (currentStep >= 3 && currentStep <= 12 && !stepCompleted && !tutorialCompleted) ? '#999' : 'white', 
                cursor: (currentStep >= 3 && currentStep <= 12 && !stepCompleted && !tutorialCompleted) ? 'not-allowed' : 'pointer',
                opacity: (currentStep >= 3 && currentStep <= 12 && !stepCompleted && !tutorialCompleted) ? 0.5 : 1
              }}
              disabled={currentStep >= 3 && currentStep <= 12 && !stepCompleted && !tutorialCompleted}
            >
              {currentStep < steps.length - 1 ? 'Next →' : 'Finish'}
            </button>
          </div>
        </div>

        {/* 3D View - Show substrate only */}
        <div style={{ gridRow:'1/3',gridColumn:'2/3', position: 'relative' }}>
          <Canvas
            style={{ width:'100%',height:'100%' }}
            camera={{ position:[30, 20, 30], fov:45 }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[-15, 15, 5]} intensity={1} />

            {/* Render all layers from cubeGrid */}
            {cubeGrid.map((xArray, x) => 
              xArray.map((yArray, y) => 
                yArray.map((material, z) => {
                  if (material === MATERIALS.EMPTY) return null;
                  
                  const worldX = x - GRID_SIZE/2 + 0.5;
                  const worldY = z + 0.5;
                  const worldZ = y - GRID_SIZE/2 + 0.5;
                  
                  // Highlight based on current step
                  let shouldHighlight = false;
                  const isOxide = (material === MATERIALS.SILICON_OXIDE);
                  const isTopSilicon = (z === 4);
                  const isCopper = material === MATERIALS.COPPER;
                  const isPhotoresist = material === MATERIALS.PHOTORESIST;
                  
                  if (currentStep === 0 && (isTopSilicon || (!isOxide && !isTopSilicon && !isCopper && !isPhotoresist))) {
                    shouldHighlight = true;
                  } else if (currentStep === 1 && (isTopSilicon || (!isOxide && !isTopSilicon && !isCopper && !isPhotoresist))) {
                    shouldHighlight = true;
                  } else if (currentStep === 2 && isOxide) {
                    shouldHighlight = true;
                  } else if (currentStep === 3 && isCopper) {
                    shouldHighlight = true;
                  } else if (currentStep === 4 && isPhotoresist) {
                    shouldHighlight = true;
                  }
                  
                  return (
                    <mesh 
                      key={`cube-${x}-${y}-${z}`} 
                      position={[worldX, worldY, worldZ]}
                    >
                      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
                      <meshPhysicalMaterial
                        color={material.color}
                        transparent={isOxide}
                        opacity={isOxide ? MATERIALS.SILICON_OXIDE.transparency : 1}
                        ior={1}
                        emissive={shouldHighlight ? '#444' : '#000'}
                        emissiveIntensity={shouldHighlight ? 0.2 : 0}
                      />
                    </mesh>
                  );
                })
              )
            ).flat(3)}

            <OrbitControls 
              ref={orbitControlsRef}
              enableDamping={true}
              dampingFactor={0.05}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

function PhotomaskEditor({ photomask, onSave, onCancel, goalRects, showTutorialText = false }) {
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
      {/* Goal view or Tutorial text */}
      <div>
        {showTutorialText ? (
          <div style={{ width: 200 }}>
            <h3 style={{ margin: '0 0 10px' }}>Photomask Editor</h3>
            <div style={{ padding: 10, background: '#f8f9fa', borderRadius: 4, fontSize: '14px', lineHeight: '1.4' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong>What is a photomask?</strong></p>
              <p style={{ margin: '0 0 10px 0' }}>A photomask covers parts of the chip from light. Parts of the chip that are exposed to light can then be removed.</p>
              <p style={{ margin: '0 0 10px 0' }}><strong>How to use:</strong></p>
              <ul style={{ margin: '0 0 10px 0', paddingLeft: 20 }}>
                <li>Click to toggle individual squares</li>
                <li>Click and drag to draw rectangles</li>
                <li>Black areas will expose the photoresist</li>
                <li>White areas will block the light</li>
              </ul>
              <p style={{ margin: '0 0 10px 0' }}><strong>Try it:</strong> Draw any pattern you like and click "Save Mask" to continue!</p>
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ margin: '0 0 10px' }}>Goal</h3>
            <canvas ref={goalRef} width={200} height={200} style={{ border: '1px solid #000' }} />
          </div>
        )}
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
  SILICON_OXIDE: { color: '#8ac6d1', name: 'Silicon Oxide', transparency: 0.08},
  AMORPHOUS_SILICON: { color: 'grey', name: 'Amorphous Silicon' },
  PHOTORESIST: { color: 'green', name: 'Photoresist' }
};

export default function FabSimulator() {
  const [currentLevel, setCurrentLevel] = useState(null);
  
  // Helper function to create initial substrate grid
  const createInitialGrid = () => {
    const grid = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => 
        Array(MAX_HEIGHT).fill(MATERIALS.EMPTY)
      )
    );
    
    // New: Silicon-On-Insulator (SOI) substrate
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[x][y][0] = MATERIALS.SUBSTRATE;       // Bottom silicon
        grid[x][y][1] = MATERIALS.SUBSTRATE;       // Second silicon layer
        grid[x][y][2] = MATERIALS.SILICON_OXIDE;   // Buried oxide layer (BOX)
        grid[x][y][3] = MATERIALS.SILICON_OXIDE;   // Buried oxide layer (BOX)
        grid[x][y][4] = MATERIALS.SUBSTRATE;       // Top silicon device layer
      }
    }
    
    return grid;
  };
  
  // Helper function to reconstruct material references from saved data
  const reconstructMaterialReferences = (cubeGrid) => {
    if (!cubeGrid) return createInitialGrid();
    
    // Create a mapping from saved material properties to actual MATERIALS constants
    const materialMap = {};
    Object.values(MATERIALS).forEach(material => {
      const key = JSON.stringify(material);
      materialMap[key] = material;
    });
    
    // Reconstruct the grid with proper material references
    return cubeGrid.map(xArray => 
      xArray.map(yArray => 
        yArray.map(savedMaterial => {
          if (!savedMaterial || savedMaterial === MATERIALS.EMPTY) {
            return MATERIALS.EMPTY;
          }
          
          // Try to find the matching material by properties
          const materialKey = JSON.stringify(savedMaterial);
          const matchedMaterial = materialMap[materialKey];
          
          if (matchedMaterial) {
            return matchedMaterial;
          }
          
          // Fallback: match by color property
          const materialByColor = Object.values(MATERIALS).find(mat => 
            mat.color === savedMaterial.color
          );
          
          return materialByColor || MATERIALS.EMPTY;
        })
      )
    );
  };
  
  // Helper function to load level-specific progress
  const loadLevelProgress = (levelName) => {
    if (!levelName) return { cubeGrid: createInitialGrid(), tutorialStep: 0, photomask: null };
    
    const savedProgress = localStorage.getItem(`${levelName}Progress`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        return {
          cubeGrid: reconstructMaterialReferences(parsed.cubeGrid),
          tutorialStep: parsed.tutorialStep || 0,
          photomask: parsed.photomask || null
        };
      } catch (e) {
        console.warn(`Failed to parse saved ${levelName} progress:`, e);
      }
    }
    
    return { cubeGrid: createInitialGrid(), tutorialStep: 0, photomask: null };
  };
  
  // Helper function to save level-specific progress
  const saveLevelProgress = (levelName, cubeGrid, tutorialStep, photomask, completed = false) => {
    if (!levelName) return;
    
    const progress = {
      cubeGrid: cubeGrid,
      tutorialStep: tutorialStep,
      photomask: photomask,
      completed: completed
    };
    localStorage.setItem(`${levelName}Progress`, JSON.stringify(progress));
  };
  
  // NEW: 3D cube grid - [x][y][z] where z=0 is bottom
  const [cubeGrid, setCubeGrid] = useState(() => createInitialGrid());
  
  const [editingMask, setEditingMask] = useState(false);
  const [goalRects, setGoalRects] = useState([]); // Will be set based on selected level
  
  // slider state for clipping plane - MUST be before conditional returns
  const [slicePosition, setSlicePosition] = useState(1);
  // At the top of your FabSimulator component, after your diffCount calculation:
  const [completed, setCompleted] = useState(false);
  
  // Level-specific tutorial state
  const [tutorialStep, setTutorialStep] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [step11Actions, setStep11Actions] = useState({ photoresist: false, exposeDevelop: false });
  const [step8SiO2Count, setStep8SiO2Count] = useState(0);
  
  // Level-specific photomask state
  const [photomask, setPhotomask] = useState(null);



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
// Adjust the layer calculation for the goal rects starting at the top silicon layer
      const z      = r.l + 4;

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

    // compare user vs goal (include all layers from z=0 including substrate)
    let count = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        // Check all layers from bottom (z=0) including substrate
        for (let z = 3; z < MAX_HEIGHT; z++) {
          const userHas = cubeGrid[x][y][z] !== MATERIALS.EMPTY;
          const goalHas = goalGrid[x][y][z];
          if (userHas !== goalHas) count++;
        }
      }
    }
    return count;
  }, [cubeGrid, goalRects]);

  useEffect(() => {
    const isCompleted = diffCount === 0;
    setCompleted(isCompleted);
    
    // Save completion status when level is completed
    if (isCompleted && currentLevel && currentLevel !== 'introduction') {
      saveLevelProgress(currentLevel, cubeGrid, tutorialStep, photomask, true);
    }
  }, [diffCount, currentLevel, cubeGrid, tutorialStep, photomask]);
  
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
    // Save current level progress before switching
    if (currentLevel) {
      saveLevelProgress(currentLevel, cubeGrid, tutorialStep, photomask);
    }
    
    setCurrentLevel(levelKey);
    const level = LEVELS[levelKey];
    if (level) {
      setGoalRects(level.goalRects);
      
      // Load progress for the new level
      const progress = loadLevelProgress(levelKey);
      setCubeGrid(progress.cubeGrid);
      setTutorialStep(progress.tutorialStep);
      setPhotomask(progress.photomask);
      
      // Reset level-specific state
      setStepCompleted(false);
      setStep11Actions({ photoresist: false, exposeDevelop: false });
      setStep8SiO2Count(0);
    }
  };
  
  // Save progress when level changes or when user actions occur
  useEffect(() => {
    if (currentLevel) {
      saveLevelProgress(currentLevel, cubeGrid, tutorialStep, photomask);
    }
  }, [currentLevel, cubeGrid, tutorialStep, photomask]);

  // Show level select screen if no level is selected
  if (!currentLevel) {
return <LevelSelect onSelectLevel={handleSelectLevel} />
  }

  const currentLevelData = LEVELS[currentLevel];
  if (!currentLevelData) {
return <LevelSelect onSelectLevel={handleSelectLevel} />
  }

  // Show 'Completed!' message on level completion
  const showCompletionMessage = (levelKey) => {
    const savedProgress = localStorage.getItem(`${levelKey}Progress`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        return parsed.completed; // Assuming 'completed' key is set when level is complete
      } catch (e) {
        console.warn(`Failed to parse saved ${levelKey} progress for completion check:`, e);
      }
    }
    return false;
  };
  
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
  const saveMask = (m) => { 
    setPhotomask(m); 
    setEditingMask(false); 
    // Mark step 5 as completed when mask is saved during tutorial
    if (currentLevel === 'introduction' && tutorialStep === 5) {
      setStepCompleted(true);
    }
  };
  const cancelMask = () => setEditingMask(false);
  
  // Reset function to return to initial substrate
  const handleReset = () => {
    setCubeGrid(createInitialGrid());
    setPhotomask(null);
    // Reset tutorial-specific state if in introduction level
    if (currentLevel === 'introduction') {
      setTutorialStep(0);
      setStepCompleted(false);
      setStep11Actions({ photoresist: false, exposeDevelop: false });
      setStep8SiO2Count(0);
    }
  };
  
  // Tutorial handlers
  const handleTutorialNext = () => {
    const totalSteps = 13; // Total number of tutorial steps (including plasma clean)
    if (tutorialStep < totalSteps - 1) {
      setTutorialStep(tutorialStep + 1);
      setStepCompleted(false); // Reset completion state for next step
      setStep11Actions({ photoresist: false, exposeDevelop: false }); // Reset step 11 actions
      setStep8SiO2Count(0); // Reset step 8 SiO2 count
    } else {
      // Tutorial finished - save progress and go back to level select
      const tutorialProgress = {
        cubeGrid: cubeGrid,
        tutorialStep: tutorialStep, // Keep the current step (12)
        photomask: photomask
      };
      localStorage.setItem('tutorialProgress', JSON.stringify(tutorialProgress));
      
      setCurrentLevel(null);
      // Don't reset tutorialStep to 0 - keep it at 12 so user can resume
      setStepCompleted(false);
      setStep11Actions({ photoresist: false, exposeDevelop: false });
      setStep8SiO2Count(0);
    }
  };
  
  const handleTutorialDepositCopper = () => {
    handleDeposit_Cu();
    setStepCompleted(true);
  };
  
  const handleTutorialSpinPhotoresist = () => {
    handleSpin();
    if (tutorialStep === 11) {
      // For step 11, track both actions
      const newStep11Actions = { ...step11Actions, photoresist: true };
      setStep11Actions(newStep11Actions);
      if (newStep11Actions.photoresist && newStep11Actions.exposeDevelop) {
        setStepCompleted(true);
      }
    } else {
      setStepCompleted(true);
    }
  };
  
  const handleTutorialExposeDevelop = () => {
    handleExposeDevelop();
    if (tutorialStep === 11) {
      // For step 11, track both actions
      const newStep11Actions = { ...step11Actions, exposeDevelop: true };
      setStep11Actions(newStep11Actions);
      if (newStep11Actions.photoresist && newStep11Actions.exposeDevelop) {
        setStepCompleted(true);
      }
    } else {
      setStepCompleted(true);
    }
  };
  
  const handleTutorialDryEtch = () => {
    handleEtch();
    setStepCompleted(true);
  };
  
  const handleTutorialDepositSiO2 = () => {
    handleDeposit_SiO2();
    if (tutorialStep === 8) {
      // For step 8, require two SiO2 depositions
      const newCount = step8SiO2Count + 1;
      setStep8SiO2Count(newCount);
      if (newCount >= 2) {
        setStepCompleted(true);
      }
    } else {
      setStepCompleted(true);
    }
  };
  
  const handleTutorialCMP = () => {
    handleCMP();
    setStepCompleted(true);
  };
  
  const handleTutorialDepositASi = () => {
    handleDeposit_aSi();
    setStepCompleted(true);
  };
  
  const handleTutorialPlasmaClean = () => {
    handlePlasmaClean();
    setStepCompleted(true);
  };
  
  
  const handleTutorialBack = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
      setStepCompleted(false); // Reset completion state when going back
      setStep11Actions({ photoresist: false, exposeDevelop: false }); // Reset step 11 actions
      setStep8SiO2Count(0); // Reset step 8 SiO2 count
    } else {
      setCurrentLevel(null);
      setTutorialStep(0);
      setStepCompleted(false);
      setStep11Actions({ photoresist: false, exposeDevelop: false });
      setStep8SiO2Count(0);
    }
  };

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
          showTutorialText={currentLevel === 'introduction'}
        />
      </div>
    );
  }

  // Show tutorial for introduction level
  if (currentLevel === 'introduction') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <IntroductionTutorial 
          onNext={handleTutorialNext}
          onBack={handleTutorialBack}
          currentStep={tutorialStep}
          stepCompleted={stepCompleted}
          onDepositCopper={handleTutorialDepositCopper}
          onSpinPhotoresist={handleTutorialSpinPhotoresist}
          cubeGrid={cubeGrid}
          onEditMask={() => setEditingMask(true)}
          photomask={photomask}
          onExposeDevelop={handleTutorialExposeDevelop}
          onDryEtch={handleTutorialDryEtch}
          onDepositSiO2={handleTutorialDepositSiO2}
          onCMP={handleTutorialCMP}
          onDepositASi={handleTutorialDepositASi}
          onPlasmaClean={handleTutorialPlasmaClean}
        />
        {/* Render arrows for current step */}
        {(() => {
          const currentStepData = tutorialSteps[tutorialStep] || tutorialSteps[0];
          
          return currentStepData.arrowTargets?.map((arrow, index) => (
            <Arrow3D
              key={index}
              fromX={window.innerWidth * arrow.fromPercent.x / 100}
              fromY={window.innerHeight * arrow.fromPercent.y / 100}
              toX={window.innerWidth * arrow.toPercent.x / 100}
              toY={window.innerHeight * arrow.toPercent.y / 100}
              color={arrow.color}
            />
          ));
        })()}
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
            onClick={() => {
              // Save current progress before going back to level select
              saveLevelProgress(currentLevel, cubeGrid, tutorialStep, photomask);
              setCurrentLevel(null);
            }} 
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

            {/* Render substrate layers for goal as individual cubes (excluding top silicon layer) */}
            {Array.from({ length: 4 }, (_, z) => {
              const cubes = [];
              for (let x = 0; x < GRID_SIZE; x++) {
                for (let y = 0; y < GRID_SIZE; y++) {
                  if (x > sliceX) continue;

                  // pick SOI material (only layers 0-3, not top silicon at z=4)
                  const isOxide = (z === 2 || z === 3);
                  const mat = isOxide
                    ? MATERIALS.SILICON_OXIDE
                    : MATERIALS.SUBSTRATE;

                  const worldX = x - GRID_SIZE/2 + 0.5;
                  const worldY = z + 0.5;
                  const worldZ = y - GRID_SIZE/2 + 0.5;
                  
                  cubes.push(
                    <mesh key={`goal-substrate-${x}-${y}-${z}`} position={[worldX, worldY, worldZ]}>
                      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
                      <meshPhysicalMaterial
                          color={mat.color}
                          transparent={isOxide}
                          opacity={isOxide ? MATERIALS.SILICON_OXIDE.transparency : 1}
                          ior={1}
                        />
                    </mesh>
                  );
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
              // Adjust the layer calculation for the goal rects starting at the top silicon layer
              const z = r.l + 4;
              
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
                          transparent={r.color === MATERIALS.SILICON_OXIDE.color} // only SiO₂ is transparent
                          opacity={r.color === MATERIALS.SILICON_OXIDE.color ? MATERIALS.SILICON_OXIDE.transparency : 1}
                        />
                        {/*<Edges color="black" lineWidth={1} /> */}
                      </mesh>
                    );
                  }
                }
              }
              return cubes;
            })}

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
                      <meshPhysicalMaterial
                        color={cube.color}
                        transparent={cube === MATERIALS.SILICON_OXIDE} // only SiO₂ is transparent
                        opacity={cube === MATERIALS.SILICON_OXIDE ? MATERIALS.SILICON_OXIDE.transparency : 1}
                        ior={1}
                      />
                      {/*{cube !== MATERIALS.SUBSTRATE && <Edges color="black" lineWidth={1} />}*/}
                    </mesh>
                  );
                })
              )
            )}


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
      
      {/* Fixed Reset Button */}
      <button
        onClick={handleReset}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#c82333';
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#dc3545';
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
        }}
      >
        Reset
      </button>
    </div>
  );
}
