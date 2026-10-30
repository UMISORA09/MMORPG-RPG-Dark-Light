import { memo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { LightingConfig, StudioLightingPresetId } from "./types";

export const STUDIO_LIGHTING_PRESETS: Record<StudioLightingPresetId, LightingConfig> = {
  cinematic_dark_fantasy: {
    id: "cinematic_dark_fantasy",
    name: "Hắc Ám Kỳ Ảo",
    description: "Ánh sáng tương phản cao phong cách Chiến Long Bá với ánh sáng chính bạc kim và viền sáng đỏ rực lửa rồng.",
    ambient: {
      color: "#161324",
      intensity: 0.85,
    },
    keyLight: {
      color: "#fff2dd",
      intensity: 2.2,
      position: [4.0, 5.5, 3.8],
      castShadow: true,
    },
    fillLight: {
      color: "#4a3b69",
      intensity: 0.9,
      position: [-3.5, 3.0, -2.0],
    },
    rimLight: {
      color: "#ff3b30",
      intensity: 3.4,
      position: [0.0, 4.0, -4.5],
    },
    groundBounce: {
      color: "#2a1535",
      intensity: 0.5,
    },
    fog: {
      color: "#0d0a14",
      near: 6.0,
      far: 18.0,
    },
  },
  cyberpunk_neon: {
    id: "cyberpunk_neon",
    name: "Lượng Tử Cyberpunk",
    description: "Ánh sáng neon công nghệ tương lai với ánh sáng chính cyan neon và viền sáng magenta quyến rũ.",
    ambient: {
      color: "#08121f",
      intensity: 0.8,
    },
    keyLight: {
      color: "#00f2ff",
      intensity: 2.0,
      position: [3.5, 5.0, 3.5],
      castShadow: true,
    },
    fillLight: {
      color: "#1d2d44",
      intensity: 0.7,
      position: [-3.0, 2.5, -2.0],
    },
    rimLight: {
      color: "#ff007f",
      intensity: 3.8,
      position: [-1.0, 3.5, -4.0],
    },
    groundBounce: {
      color: "#0b253a",
      intensity: 0.6,
    },
    fog: {
      color: "#050b14",
      near: 5.5,
      far: 16.0,
    },
  },
  celestial_gold: {
    id: "celestial_gold",
    name: "Hoàng Kim Thần Thánh",
    description: "Ánh hào quang rực rỡ vàng kim tôn vinh giáp trụ hộ vệ và kiếm thánh hoàng gia.",
    ambient: {
      color: "#201c12",
      intensity: 1.0,
    },
    keyLight: {
      color: "#fff7d6",
      intensity: 2.4,
      position: [3.0, 6.0, 3.2],
      castShadow: true,
    },
    fillLight: {
      color: "#e0a940",
      intensity: 1.1,
      position: [-3.5, 3.0, -1.5],
    },
    rimLight: {
      color: "#ffd700",
      intensity: 3.0,
      position: [0.5, 4.5, -3.8],
    },
    groundBounce: {
      color: "#38290f",
      intensity: 0.7,
    },
    fog: {
      color: "#120f0a",
      near: 7.0,
      far: 20.0,
    },
  },
  cosmic_nebula: {
    id: "cosmic_nebula",
    name: "Tinh Vân Vũ Trụ",
    description: "Không gian vũ trụ sâu thẳm với ánh sáng sao băng cyan rực rỡ và phản quang tinh vân tím huyền ảo.",
    ambient: {
      color: "#08081c",
      intensity: 0.85,
    },
    keyLight: {
      color: "#e0f2fe",
      intensity: 2.6,
      position: [3.5, 6.0, 3.5],
      castShadow: true,
    },
    fillLight: {
      color: "#8b5cf6",
      intensity: 1.3,
      position: [-4.0, 2.8, -2.0],
    },
    rimLight: {
      color: "#00f2ff",
      intensity: 4.2,
      position: [0.0, 4.5, -4.5],
    },
    groundBounce: {
      color: "#3b0764",
      intensity: 0.7,
    },
    fog: {
      color: "#020208",
      near: 9.0,
      far: 30.0,
    },
  },
  neutral_studio: {
    id: "neutral_studio",
    name: "Studio Tiêu Chuẩn 5500K",
    description: "Môi trường ánh sáng trắng tự nhiên trung thực, tối ưu cho việc kiểm tra chất liệu PBR.",
    ambient: {
      color: "#ffffff",
      intensity: 1.1,
    },
    keyLight: {
      color: "#ffffff",
      intensity: 1.8,
      position: [3.0, 4.5, 3.0],
      castShadow: true,
    },
    fillLight: {
      color: "#dbe4ee",
      intensity: 0.9,
      position: [-3.0, 2.5, -2.5],
    },
    rimLight: {
      color: "#e2e8f0",
      intensity: 2.0,
      position: [0.0, 3.5, -4.0],
    },
    groundBounce: {
      color: "#64748b",
      intensity: 0.4,
    },
    fog: {
      color: "#1e293b",
      near: 8.0,
      far: 22.0,
    },
  },
};

interface StudioLightingProps {
  presetId?: StudioLightingPresetId;
}

export const StudioLighting = memo(function StudioLighting({
  presetId = "cinematic_dark_fantasy",
}: StudioLightingProps) {
  const config = STUDIO_LIGHTING_PRESETS[presetId] || STUDIO_LIGHTING_PRESETS.cinematic_dark_fantasy;
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog(
      config.fog.color,
      config.fog.near,
      config.fog.far
    );
    return () => {
      scene.fog = null;
    };
  }, [scene, config.fog.color, config.fog.near, config.fog.far]);

  return (
    <group name="studio-lighting-rig">
      {/* ── Ambient Illumination ── */}
      <ambientLight color={config.ambient.color} intensity={config.ambient.intensity} />

      {/* ── Key Light (Main Sunlight / Key Shadow) ── */}
      <directionalLight
        position={config.keyLight.position}
        color={config.keyLight.color}
        intensity={config.keyLight.intensity}
        castShadow={config.keyLight.castShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={3.0}
        shadow-camera-bottom={-1.0}
        shadow-bias={-0.0005}
      />

      {/* ── Soft Fill Light (Reduces harsh shadows) ── */}
      <directionalLight
        position={config.fillLight.position}
        color={config.fillLight.color}
        intensity={config.fillLight.intensity}
      />

      {/* ── Kicker / Rim Light (Edge silhouette highlight) ── */}
      <directionalLight
        position={config.rimLight.position}
        color={config.rimLight.color}
        intensity={config.rimLight.intensity}
      />

      {/* ── Subtle Ground Bounce ── */}
      {config.groundBounce && (
        <hemisphereLight
          args={[config.ambient.color, config.groundBounce.color, config.groundBounce.intensity]}
        />
      )}
    </group>
  );
});

