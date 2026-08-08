import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Solar System Objects Data
const PLANET_DETAILS = {
  sun: { 
    id: "sun", name: "The Sun", type: "Yellow Dwarf Star", 
    description: "The star at the center of our Solar System, a nearly perfect ball of hot plasma.", 
    distanceFromSun: "0 km (Center)", diameter: "1,392,700 km", 
    sound: "/assets/sounds/sun_sonification.wav" 
  },
  mercury: { 
    id: "mercury", name: "Mercury", type: "Terrestrial Planet", 
    description: "The smallest planet and closest to the Sun, with a heavily cratered surface.", 
    distanceFromSun: "57.9M km", diameter: "4,879 km", 
    sound: null 
  },
  venus: { 
    id: "venus", name: "Venus", type: "Terrestrial Planet", 
    description: "Second from the Sun, it's the hottest planet with a thick, toxic atmosphere.", 
    distanceFromSun: "108.2M km", diameter: "12,104 km", 
    sound: null 
  },
  earth: { 
    id: "earth", name: "Earth", type: "Terrestrial Planet", 
    description: "Our home planet, vibrant with blue oceans, landmasses, and life.", 
    distanceFromSun: "149.6M km", diameter: "12,742 km", 
    sound: null 
  },
  mars: { 
    id: "mars", name: "Mars", type: "Terrestrial Planet", 
    description: "The Red Planet, a cold desert with two moons, home to Olympus Mons.", 
    distanceFromSun: "227.9M km", diameter: "6,779 km", 
    sound: null 
  },
  jupiter: { 
    id: "jupiter", name: "Jupiter", type: "Gas Giant", 
    description: "The largest planet, a gas giant with massive ammonia and water-ice cloud bands.", 
    distanceFromSun: "778.5M km", diameter: "139,820 km", 
    sound: null 
  },
  saturn: { 
    id: "saturn", name: "Saturn", type: "Gas Giant", 
    description: "A yellow-gold gas giant adorned with a complex system of brilliant icy rings.", 
    distanceFromSun: "1.4B km", diameter: "116,460 km", 
    sound: null 
  },
  uranus: { 
    id: "uranus", name: "Uranus", type: "Ice Giant", 
    description: "An ice giant that rotates nearly parallel to its orbit, appearing pale cyan.", 
    distanceFromSun: "2.9B km", diameter: "50,724 km", 
    sound: null 
  },
  neptune: { 
    id: "neptune", name: "Neptune", type: "Ice Giant", 
    description: "The most distant planet, a deep azure-blue driven by supersonic storms.", 
    distanceFromSun: "4.5B km", diameter: "49,244 km", 
    sound: null 
  },
  moon: { 
    id: "moon", name: "The Moon", type: "Natural Satellite", 
    description: "Earth's only natural satellite, guiding tides and illuminating our night sky.", 
    distanceFromSun: "384,400 km from Earth", diameter: "3,474 km", 
    sound: null 
  }
};

// Orbit Line Component
function OrbitLine({ distance }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[distance - 0.05, distance + 0.05, 128]} />
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.15} />
    </mesh>
  );
}

// Planet Mesh Component
function PlanetMesh({ id, map, distance, speed, size, hasRings, ringMap, hasMoon, moonMap, onSelect, globalSpeed }) {
  const meshRef = useRef();
  const moonRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const effectiveSpeed = speed * globalSpeed;

    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(t * effectiveSpeed) * distance;
      meshRef.current.position.z = Math.cos(t * effectiveSpeed) * distance;
      meshRef.current.rotation.y += 0.01 * globalSpeed;
    }

    if (hasMoon && moonRef.current && meshRef.current) {
      const moonSpeed = 2.0 * globalSpeed;
      const moonDistance = size + 0.8;
      moonRef.current.position.x = meshRef.current.position.x + Math.sin(t * moonSpeed) * moonDistance;
      moonRef.current.position.z = meshRef.current.position.z + Math.cos(t * moonSpeed) * moonDistance;
      moonRef.current.position.y = meshRef.current.position.y + Math.sin(t * moonSpeed) * 0.25;
    }
  });

  return (
    <group>
      <OrbitLine distance={distance} />

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id, meshRef.current, size);
        }}
      >
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial map={map} roughness={0.7} metalness={0.15} />

        {hasRings && (
          <mesh rotation={[-Math.PI / 3, 0, 0]}>
            <ringGeometry args={[size * 1.3, size * 2.2, 128]} />
            <meshStandardMaterial map={ringMap} side={THREE.DoubleSide} transparent opacity={0.8} roughness={0.5} />
          </mesh>
        )}
      </mesh>

      {hasMoon && (
        <mesh 
          ref={moonRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect('moon', moonRef.current, 0.22);
          }}
        >
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial map={moonMap} roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

// Space Background
function SpaceBackground({ starsMap }) {
  return (
    <mesh>
      <sphereGeometry args={[300, 64, 64]} />
      <meshBasicMaterial map={starsMap} side={THREE.BackSide} />
    </mesh>
  );
}

// Main Solar System Component
function SolarSystem({ onSelectPlanet, globalSpeed, lightIntensity }) {
  const sunRef = useRef();

  const [
    sunMap, mercuryMap, venusMap, earthMap, marsMap, jupiterMap, saturnMap, uranusMap, neptuneMap,
    moonMap, saturnRingMap, starsMap
  ] = useTexture([
    '/assets/sun.jpg', 
    '/assets/mercury.jpg', 
    '/assets/venus.jpg', 
    '/assets/earth.jpg',
    '/assets/mars.jpg', 
    '/assets/jupiter.jpg', 
    '/assets/saturn.jpg', 
    '/assets/uranus.jpg',
    '/assets/neptune.jpg', 
    '/assets/moon.jpg', 
    '/assets/saturn_rings.png',
    '/assets/stars.jpg'
  ]);

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.003 * globalSpeed;
    }
  });

  return (
    <group>
      <SpaceBackground starsMap={starsMap} />
      <pointLight position={[0, 0, 0]} intensity={lightIntensity} color="#fff6e5" />

      {/* Sun Mesh */}
      <mesh 
        ref={sunRef} 
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPlanet('sun', sunRef.current, 3.8);
        }}
      >
        <sphereGeometry args={[3.8, 64, 64]} />
        <meshBasicMaterial map={sunMap} />
      </mesh>

      <PlanetMesh id="mercury" map={mercuryMap} distance={8} speed={0.8} size={0.5} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
      <PlanetMesh id="venus" map={venusMap} distance={12} speed={0.6} size={0.8} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
      <PlanetMesh id="earth" map={earthMap} distance={17} speed={0.4} size={1.0} hasMoon={true} moonMap={moonMap} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
      <PlanetMesh id="mars" map={marsMap} distance={22} speed={0.3} size={0.7} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
      <PlanetMesh id="jupiter" map={jupiterMap} distance={30} speed={0.18} size={2.2} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
      <PlanetMesh id="saturn" map={saturnMap} distance={39} speed={0.12} size={1.8} hasRings={true} ringMap={saturnRingMap} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
      <PlanetMesh id="uranus" map={uranusMap} distance={48} speed={0.08} size={1.3} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
      <PlanetMesh id="neptune" map={neptuneMap} distance={56} speed={0.05} size={1.2} globalSpeed={globalSpeed} onSelect={onSelectPlanet} />
    </group>
  );
}

// Fixed Jitter-Free Smooth Camera Controller
function CameraController({ selectedTarget, controlsRef }) {
  const targetPos = useRef(new THREE.Vector3());
  const cameraOffset = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (selectedTarget && selectedTarget.mesh) {
      selectedTarget.mesh.getWorldPosition(targetPos.current);
      const offsetDistance = selectedTarget.size * 4 + 4;

      // সেটআপ ইনিশিয়াল অফসেট ভেক্টর
      cameraOffset.current.set(offsetDistance, offsetDistance * 0.4, offsetDistance);

      controls.target.copy(targetPos.current);
      controls.object.position.copy(targetPos.current).add(cameraOffset.current);
      controls.update();
    } else {
      controls.target.set(0, 0, 0);
      controls.object.position.set(0, 45, 75);
      controls.update();
    }
  }, [selectedTarget, controlsRef]);

  useFrame(() => {
    if (!selectedTarget || !selectedTarget.mesh || !controlsRef.current) return;

    const controls = controlsRef.current;
    
    // গ্রহটি অর্বিটে ঘোরার সাথে তার নতুন পজিশন নেওয়া
    const newPos = new THREE.Vector3();
    selectedTarget.mesh.getWorldPosition(newPos);

    // অফসেট ধরে রেখে ক্যামেরাকে সরাসরি গ্রহের সাথে সিঙ্ক করা
    controls.object.position.add(newPos.clone().sub(controls.target));
    controls.target.copy(newPos);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={1.2}
      maxDistance={250}
    />
  );
}

// Draggable Box Wrapper
function DraggableBox({ children, initialPos, style }) {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 10,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        ...style
      }}
    >
      {children}
    </div>
  );
}

// Control Panel Component
function ControlPanel({ globalSpeed, setGlobalSpeed, lightIntensity, setLightIntensity, isPlayingAudio, toggleAudio, handleReset }) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <DraggableBox
      initialPos={{ x: 20, y: 20 }}
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        padding: isMinimized ? '12px 18px' : '18px 22px',
        borderRadius: '16px',
        color: '#fff',
        width: '260px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        transition: 'padding 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMinimized ? '0' : '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚙️ Control Panel
        </h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isMinimized ? '＋' : '─'}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Orbit Speed:</span>
              <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{globalSpeed}x</span>
            </div>
            <input type="range" min="0" max="4" step="0.1" value={globalSpeed} onChange={(e) => setGlobalSpeed(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Sun Intensity:</span>
              <span style={{ fontWeight: 'bold', color: '#facc15' }}>{lightIntensity}</span>
            </div>
            <input type="range" min="1" max="10" step="0.5" value={lightIntensity} onChange={(e) => setLightIntensity(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>

          <button onClick={handleReset} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
            🔄 Reset Camera
          </button>

          <button onClick={toggleAudio} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: isPlayingAudio ? '#ef4444' : '#6366f1', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            {isPlayingAudio ? '🔇 Mute Space Ambient' : '🎵 Play Space Ambient'}
          </button>
        </>
      )}
    </DraggableBox>
  );
}

// Planet/Sun Info Card Component
function PlanetInfoCard({ activePlanet, handleReset, isPlayingPlanetSound, togglePlanetSound }) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!activePlanet) return null;

  return (
    <DraggableBox
      initialPos={{ x: window.innerWidth - 320, y: 20 }}
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: isMinimized ? '12px 18px' : '22px',
        borderRadius: '16px',
        color: '#fff',
        width: '260px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        transition: 'padding 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMinimized ? '0' : '12px' }}>
        <span style={{ fontSize: '11px', color: '#818cf8', textTransform: 'uppercase', fontWeight: 'bold' }}>{activePlanet.type}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isMinimized ? '＋' : '─'}
          </button>
          <button onClick={handleReset} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            Close
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <h2 style={{ fontSize: '26px', margin: '0 0 8px 0', fontWeight: 'bold' }}>{activePlanet.name}</h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '14px' }}>{activePlanet.description}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            <div>
              <span>Distance:</span>
              <p style={{ color: '#fff', fontWeight: 'bold', marginTop: '2px' }}>{activePlanet.distanceFromSun}</p>
            </div>
            <div>
              <span>Diameter:</span>
              <p style={{ color: '#fff', fontWeight: 'bold', marginTop: '2px' }}>{activePlanet.diameter}</p>
            </div>
          </div>

          {activePlanet.sound && (
            <button 
              onClick={togglePlanetSound} 
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '8px', 
                border: 'none', 
                backgroundColor: isPlayingPlanetSound ? '#10b981' : '#8b5cf6', 
                color: '#fff', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isPlayingPlanetSound ? '🔊 Pause Sound' : `🎧 Listen to ${activePlanet.name}`}
            </button>
          )}
        </>
      )}
    </DraggableBox>
  );
}

// Main App Component
export default function App() {
  const [selectedPlanetKey, setSelectedPlanetKey] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [globalSpeed, setGlobalSpeed] = useState(1);
  const [lightIntensity, setLightIntensity] = useState(4.5);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingPlanetSound, setIsPlayingPlanetSound] = useState(false);

  const ambientAudioRef = useRef(null);
  const planetAudioRef = useRef(null);
  const controlsRef = useRef(null);

  const activePlanet = selectedPlanetKey ? PLANET_DETAILS[selectedPlanetKey] : null;

  // Background Ambient Sound Toggle
  const toggleAudio = () => {
    if (!ambientAudioRef.current) return;
    if (isPlayingAudio) {
      ambientAudioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      ambientAudioRef.current.play().then(() => setIsPlayingAudio(true)).catch((e) => console.log(e));
    }
  };

  // Sound Toggle for Sun
  const togglePlanetSound = () => {
    if (!planetAudioRef.current || !activePlanet || !activePlanet.sound) return;

    if (isPlayingPlanetSound) {
      planetAudioRef.current.pause();
      setIsPlayingPlanetSound(false);
    } else {
      planetAudioRef.current.src = activePlanet.sound;
      planetAudioRef.current.play().then(() => setIsPlayingPlanetSound(true)).catch((e) => console.log(e));
    }
  };

  // On Selection (Sun or Planet)
  const handleSelectPlanet = (id, mesh, size) => {
    setSelectedPlanetKey(id);
    setSelectedTarget({ mesh, size });

    if (PLANET_DETAILS[id] && PLANET_DETAILS[id].sound && planetAudioRef.current) {
      planetAudioRef.current.src = PLANET_DETAILS[id].sound;
      planetAudioRef.current.play().then(() => setIsPlayingPlanetSound(true)).catch(() => setIsPlayingPlanetSound(false));
    } else if (planetAudioRef.current) {
      planetAudioRef.current.pause();
      setIsPlayingPlanetSound(false);
    }
  };

  const handleReset = () => {
    setSelectedPlanetKey(null);
    setSelectedTarget(null);
    if (planetAudioRef.current) {
      planetAudioRef.current.pause();
      setIsPlayingPlanetSound(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, backgroundColor: '#000' }}>
      {/* Background Ambient Audio */}
      <audio 
        ref={ambientAudioRef} 
        src="/assets/sounds/Space.mp3" 
        loop 
      />

      {/* Sun Dynamic Audio Element */}
      <audio ref={planetAudioRef} loop />

      {/* Control Panel */}
      <ControlPanel 
        globalSpeed={globalSpeed}
        setGlobalSpeed={setGlobalSpeed}
        lightIntensity={lightIntensity}
        setLightIntensity={setLightIntensity}
        isPlayingAudio={isPlayingAudio}
        toggleAudio={toggleAudio}
        handleReset={handleReset}
      />

      {/* Draggable Planet/Sun Info Card */}
      <PlanetInfoCard 
        activePlanet={activePlanet} 
        handleReset={handleReset} 
        isPlayingPlanetSound={isPlayingPlanetSound}
        togglePlanetSound={togglePlanetSound}
      />

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 45, 75], fov: 50 }}>
        <ambientLight intensity={0.6} />
        
        <React.Suspense fallback={null}>
          <SolarSystem 
            onSelectPlanet={handleSelectPlanet} 
            globalSpeed={globalSpeed} 
            lightIntensity={lightIntensity} 
          />
        </React.Suspense>

        <CameraController selectedTarget={selectedTarget} controlsRef={controlsRef} />
      </Canvas>
    </div>
  );
}