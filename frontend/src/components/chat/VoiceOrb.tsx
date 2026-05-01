"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

interface BlobProps {
  isListening: boolean;
  audioLevel: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DistortMaterialRef = any;

function MorphingBlob({ isListening, audioLevel }: BlobProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<DistortMaterialRef>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !materialRef.current) return;

    const t = clock.elapsedTime;

    if (isListening) {
      // Pulse distort between 0.4 and 0.7 based on sine wave + audioLevel
      const sinePulse = (Math.sin(t * 3) + 1) / 2; // 0 to 1
      const targetDistort = 0.4 + sinePulse * 0.3 + audioLevel * 0.1;
      materialRef.current.distort = THREE.MathUtils.lerp(
        materialRef.current.distort,
        targetDistort,
        0.08
      );

      // Slowly rotate
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;

      // Breathe scale
      const breathe = 1 + Math.sin(t * 2) * 0.05;
      meshRef.current.scale.setScalar(breathe);
    } else {
      // Settle to calm state
      materialRef.current.distort = THREE.MathUtils.lerp(
        materialRef.current.distort,
        0.2,
        0.04
      );
      meshRef.current.rotation.y += 0.003;
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, 0.9, 0.04)
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.8, 64, 64]} />
      <MeshDistortMaterial
        ref={materialRef}
        color="#9333EA"
        emissive="#EC4899"
        emissiveIntensity={0.3}
        wireframe={true}
        distort={isListening ? 0.5 : 0.2}
        speed={3}
      />
    </mesh>
  );
}

export default function VoiceOrb({ isListening, audioLevel }: BlobProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#7C3AED" />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#EC4899" />
      <MorphingBlob isListening={isListening} audioLevel={audioLevel} />
    </Canvas>
  );
}
