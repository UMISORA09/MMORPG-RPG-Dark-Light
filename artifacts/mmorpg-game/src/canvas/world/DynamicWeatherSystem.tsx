// ==============================================================================
// DynamicWeatherSystem.tsx
// Cinematic Dynamic Weather Engine: SUNNY (Golden Stardust), RAIN (Heavy Slanted Rain & Ripples),
// and BLOOD_MOON (Crimson Mist & Thunder Flash) with Direct Gameplay Impact
// ==============================================================================

import { memo, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

const RAIN_COUNT = 300;
const STARDUST_COUNT = 40;
const FOG_COUNT = 60;

export const DynamicWeatherSystem = memo(function DynamicWeatherSystem() {
  const weather = useGameWorldStore((s) => s.weather);
  const playerPos = useGameWorldStore((s) => s.playerPosition);

  // References
  const rainGeoRef = useRef<THREE.BufferGeometry>(null);
  const rainMatRef = useRef<THREE.PointsMaterial>(null);
  const stardustGeoRef = useRef<THREE.BufferGeometry>(null);
  const fogGeoRef = useRef<THREE.BufferGeometry>(null);
  const lightningLightRef = useRef<THREE.DirectionalLight>(null);
  const lightningTimer = useRef<number>(5.0);

  // ── 0. DARK FOG CREEPING PARTICLES INITIALIZATION ──
  const fogPositions = useMemo(() => {
    const pos = new Float32Array(FOG_COUNT * 3);
    for (let i = 0; i < FOG_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 65;
      pos[i * 3 + 1] = Math.random() * 2.8 + 0.2; // close to ground
      pos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }
    return pos;
  }, []);

  // ── 1. RAIN PARTICLES INITIALIZATION ──
  const rainPositions = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 75;     // X spread
      pos[i * 3 + 1] = Math.random() * 26 + 0.5;   // Y height
      pos[i * 3 + 2] = (Math.random() - 0.5) * 75; // Z spread
    }
    return pos;
  }, []);

  // ── 2. SUNNY GOLDEN STARDUST INITIALIZATION ──
  const stardustPositions = useMemo(() => {
    const pos = new Float32Array(STARDUST_COUNT * 3);
    for (let i = 0; i < STARDUST_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 45;
      pos[i * 3 + 1] = Math.random() * 8 + 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }
    return pos;
  }, []);

  // ── 3. RIPPLES DECALS ON GROUND ──
  const ripplesRef = useRef<THREE.InstancedMesh>(null);
  const rippleData = useMemo(() => {
    return Array.from({ length: 18 }, () => ({
      x: (Math.random() - 0.5) * 40,
      z: (Math.random() - 0.5) * 40,
      scale: 0.1,
      opacity: 1.0,
      speed: 1.2 + Math.random() * 0.8,
    }));
  }, []);

  const dummyMatrix = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = clock.getElapsedTime();
    const px = playerPos.x;
    const pz = playerPos.z;

    // ── Update Rain Droplets (Slanted falling) ──
    if (weather === "RAIN" || weather === "BLOOD_MOON") {
      if (rainGeoRef.current) {
        const positions = rainGeoRef.current.attributes.position.array as Float32Array;
        const speedY = weather === "BLOOD_MOON" ? 38.0 : 30.0;
        const windX = weather === "BLOOD_MOON" ? 5.5 : 3.5;

        for (let i = 0; i < RAIN_COUNT; i++) {
          let y = positions[i * 3 + 1] - speedY * dt;
          let x = positions[i * 3] + windX * dt;
          let z = positions[i * 3 + 2];

          // Wrap around relative to player position
          if (y < 0.2) {
            y = 25.0 + Math.random() * 2.0;
            x = px + (Math.random() - 0.5) * 75;
            z = pz + (Math.random() - 0.5) * 75;
          }

          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
        }
        rainGeoRef.current.attributes.position.needsUpdate = true;
      }

      // Rain Puddle Ripples Animation
      if (ripplesRef.current && weather === "RAIN") {
        for (let i = 0; i < rippleData.length; i++) {
          const r = rippleData[i];
          r.scale += dt * r.speed;
          if (r.scale > 2.2) {
            r.scale = 0.2;
            r.x = px + (Math.random() - 0.5) * 40;
            r.z = pz + (Math.random() - 0.5) * 40;
          }
          dummyMatrix.position.set(r.x, 0.03, r.z);
          dummyMatrix.rotation.set(-Math.PI / 2, 0, 0);
          dummyMatrix.scale.set(r.scale, r.scale, 1);
          dummyMatrix.updateMatrix();
          ripplesRef.current.setMatrixAt(i, dummyMatrix.matrix);
        }
        ripplesRef.current.instanceMatrix.needsUpdate = true;
      }

      // ── Random Lightning Thunder Flash (In Rain & Blood Moon) ──
      lightningTimer.current -= dt;
      if (lightningTimer.current <= 0) {
        lightningTimer.current = 6.0 + Math.random() * 8.0;
        if (lightningLightRef.current) {
          lightningLightRef.current.intensity = weather === "BLOOD_MOON" ? 8.0 : 6.5;
          playCombatSFX("heavy_slam", 0.35);
          setTimeout(() => {
            if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          }, 90);
          setTimeout(() => {
            if (lightningLightRef.current) lightningLightRef.current.intensity = 4.0;
          }, 140);
          setTimeout(() => {
            if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          }, 210);
        }
      }
    }

    // ── Update Sunny Stardust ──
    if (weather === "SUNNY" && stardustGeoRef.current) {
      const positions = stardustGeoRef.current.attributes.position.array as Float32Array;
      for (let i = 0; i < STARDUST_COUNT; i++) {
        const floatY = Math.sin(time * 1.5 + i) * 0.08;
        const driftX = Math.cos(time * 0.8 + i) * 0.04;
        positions[i * 3] += driftX;
        positions[i * 3 + 1] = Math.max(0.5, Math.min(8.0, positions[i * 3 + 1] + floatY));
      }
      stardustGeoRef.current.attributes.position.needsUpdate = true;
    }

    // ── Update Dark Fog Creeping Mist ──
    if (weather === "DARK_FOG" && fogGeoRef.current) {
      const positions = fogGeoRef.current.attributes.position.array as Float32Array;
      for (let i = 0; i < FOG_COUNT; i++) {
        const driftX = Math.sin(time * 0.4 + i * 0.2) * 0.05;
        const driftZ = Math.cos(time * 0.35 + i * 0.2) * 0.05;
        positions[i * 3] += driftX;
        positions[i * 3 + 2] += driftZ;
        if (Math.abs(positions[i * 3] - px) > 35) positions[i * 3] = px + (Math.random() - 0.5) * 60;
        if (Math.abs(positions[i * 3 + 2] - pz) > 35) positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 60;
      }
      fogGeoRef.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* ── Lightning Directional Flash Light ── */}
      <directionalLight
        ref={lightningLightRef}
        position={[20, 45, 20]}
        color={weather === "BLOOD_MOON" ? "#ff2244" : "#e0f2fe"}
        intensity={0}
      />

      {/* ── Dark Fog Creeping Mist ── */}
      {weather === "DARK_FOG" && (
        <points>
          <bufferGeometry ref={fogGeoRef}>
            <bufferAttribute
              attach="attributes-position"
              args={[fogPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#a855f7"
            size={1.6}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* ── Rain Droplets Particles ── */}
      {(weather === "RAIN" || weather === "BLOOD_MOON") && (
        <points>
          <bufferGeometry ref={rainGeoRef}>
            <bufferAttribute
              attach="attributes-position"
              args={[rainPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={rainMatRef}
            color={weather === "BLOOD_MOON" ? "#ef4444" : "#93c5fd"}
            size={0.22}
            transparent
            opacity={weather === "BLOOD_MOON" ? 0.75 : 0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* ── Ground Puddle Ripples (During Rain) ── */}
      {weather === "RAIN" && (
        <instancedMesh
          ref={ripplesRef}
          args={[undefined, undefined, rippleData.length]}
        >
          <ringGeometry args={[0.8, 1.0, 16]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </instancedMesh>
      )}

      {/* ── Sunny Golden Stardust Particles ── */}
      {weather === "SUNNY" && (
        <points>
          <bufferGeometry ref={stardustGeoRef}>
            <bufferAttribute
              attach="attributes-position"
              args={[stardustPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#fbbf24"
            size={0.35}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
});
