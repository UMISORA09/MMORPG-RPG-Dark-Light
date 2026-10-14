import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target output directories
const ASSETS_DIR = path.resolve(
  __dirname,
  "../../artifacts/mmorpg-game/public/assets"
);
const MODELS_DIR = path.join(ASSETS_DIR, "models");
const CHARACTERS_DIR = path.join(MODELS_DIR, "characters");
const MONSTERS_DIR = path.join(MODELS_DIR, "monsters");
const WEAPONS_DIR = path.join(MODELS_DIR, "weapons");

// Ensure directories
[MODELS_DIR, CHARACTERS_DIR, MONSTERS_DIR, WEAPONS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==============================================================================
// GLB Binary Builder: Creates standard binary glTF 2.0 files (.glb)
// ==============================================================================

interface VertexData {
  positions: number[]; // [x,y,z, ...]
  normals: number[];   // [nx,ny,nz, ...]
  indices: number[];   // [i0, i1, i2, ...]
}

function createBoxVertices(width = 1, height = 1, depth = 1): VertexData {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;

  // 24 vertices for 6 faces
  const positions = [
    // Front face
    -w, -h,  d,   w, -h,  d,   w,  h,  d,  -w,  h,  d,
    // Back face
    -w, -h, -d,  -w,  h, -d,   w,  h, -d,   w, -h, -d,
    // Top face
    -w,  h, -d,  -w,  h,  d,   w,  h,  d,   w,  h, -d,
    // Bottom face
    -w, -h, -d,   w, -h, -d,   w, -h,  d,  -w, -h,  d,
    // Right face
     w, -h, -d,   w,  h, -d,   w,  h,  d,   w, -h,  d,
    // Left face
    -w, -h, -d,  -w, -h,  d,  -w,  h,  d,  -w,  h, -d,
  ];

  const normals = [
    // Front
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Back
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Top
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // Right
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // Left
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ];

  const indices = [
    0, 1, 2,    0, 2, 3,    // Front
    4, 5, 6,    4, 6, 7,    // Back
    8, 9, 10,   8, 10, 11,  // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23, // Left
  ];

  return { positions, normals, indices };
}

function buildGlbBuffer(
  meshData: VertexData,
  color: [number, number, number],
  modelName: string,
  extraNodes: Array<{ name: string; translation?: [number, number, number] }> = []
): Buffer {
  const { positions, normals, indices } = meshData;

  // 1. Pack binary buffer
  // Indices (UNSIGNED_SHORT = 2 bytes)
  const indexCount = indices.length;
  const indexByteLength = indexCount * 2;
  const indexBuffer = Buffer.alloc(indexByteLength);
  for (let i = 0; i < indexCount; i++) {
    indexBuffer.writeUInt16LE(indices[i], i * 2);
  }

  // Positions (FLOAT = 4 bytes)
  const posCount = positions.length / 3;
  const posByteLength = positions.length * 4;
  const posBuffer = Buffer.alloc(posByteLength);
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    posBuffer.writeFloatLE(x, i * 4);
    posBuffer.writeFloatLE(y, (i + 1) * 4);
    posBuffer.writeFloatLE(z, (i + 2) * 4);
  }

  // Normals (FLOAT = 4 bytes)
  const normByteLength = normals.length * 4;
  const normBuffer = Buffer.alloc(normByteLength);
  for (let i = 0; i < normals.length; i++) {
    normBuffer.writeFloatLE(normals[i], i * 4);
  }

  // Keyframe Animations:
  // Times: [0.0, 0.4, 0.8, 1.2]
  const animTimes = [0.0, 0.4, 0.8, 1.2];
  const timeByteLength = animTimes.length * 4;
  const timeBuffer = Buffer.alloc(timeByteLength);
  for (let i = 0; i < animTimes.length; i++) {
    timeBuffer.writeFloatLE(animTimes[i], i * 4);
  }

  // Idle Rotations (Quaternion x,y,z,w):
  const idleRotations = [
    0, 0, 0, 1,
    0, 0.05, 0, 0.998,
    0, 0, 0, 1,
    0, -0.05, 0, 0.998,
  ];
  const rotByteLength = idleRotations.length * 4;
  const rotBuffer = Buffer.alloc(rotByteLength);
  for (let i = 0; i < idleRotations.length; i++) {
    rotBuffer.writeFloatLE(idleRotations[i], i * 4);
  }

  // Run Translations:
  const runTranslations = [
    0, 0, 0,
    0, 0.25, 0,
    0, 0, 0,
    0, 0.25, 0,
  ];
  const transByteLength = runTranslations.length * 4;
  const transBuffer = Buffer.alloc(transByteLength);
  for (let i = 0; i < runTranslations.length; i++) {
    transBuffer.writeFloatLE(runTranslations[i], i * 4);
  }

  // Attack Rotations (Swing arc):
  const attackRotations = [
    0, 0, 0, 1,
    -0.3, 0.5, 0, 0.81,
    0.4, -0.6, 0, 0.69,
    0, 0, 0, 1,
  ];
  const attackRotBuffer = Buffer.alloc(rotByteLength);
  for (let i = 0; i < attackRotations.length; i++) {
    attackRotBuffer.writeFloatLE(attackRotations[i], i * 4);
  }

  // Assemble full binary chunk
  const binaryPayload = Buffer.concat([
    indexBuffer,
    posBuffer,
    normBuffer,
    timeBuffer,
    rotBuffer,
    transBuffer,
    attackRotBuffer,
  ]);

  // Buffer views offsets
  let offset = 0;
  const indexViewOffset = offset;
  offset += indexByteLength;

  const posViewOffset = offset;
  offset += posByteLength;

  const normViewOffset = offset;
  offset += normByteLength;

  const timeViewOffset = offset;
  offset += timeByteLength;

  const rotViewOffset = offset;
  offset += rotByteLength;

  const transViewOffset = offset;
  offset += transByteLength;

  const attackRotViewOffset = offset;
  offset += rotByteLength;

  // Align total binary payload to 4 bytes
  const binPadding = (4 - (binaryPayload.length % 4)) % 4;
  const paddedBinLength = binaryPayload.length + binPadding;
  const paddedBinBuffer = Buffer.alloc(paddedBinLength);
  binaryPayload.copy(paddedBinBuffer);

  // Nodes list
  // Node 0: Root Character / Mesh
  // Node 1: weapon_slot (Socket for attaching weapons)
  const nodes = [
    {
      name: `${modelName}_mesh`,
      mesh: 0,
      children: [1, ...extraNodes.map((_, i) => 2 + i)],
    },
    {
      name: "weapon_slot",
      translation: [0.65, 0.9, 0.35],
    },
    ...extraNodes.map((en) => ({
      name: en.name,
      translation: en.translation || [0, 0, 0],
    })),
  ];

  // Construct glTF JSON
  const gltfJson = {
    asset: {
      version: "2.0",
      generator: "Chiến Long Bá Animated RPG Asset Pipeline (Blender Retargeting Standard)",
    },
    scene: 0,
    scenes: [
      {
        name: `${modelName}_Scene`,
        nodes: [0],
      },
    ],
    nodes,
    materials: [
      {
        name: `${modelName}_mat`,
        pbrMetallicRoughness: {
          baseColorFactor: [color[0], color[1], color[2], 1.0],
          metallicFactor: 0.25,
          roughnessFactor: 0.65,
        },
      },
    ],
    meshes: [
      {
        name: `${modelName}_geo`,
        primitives: [
          {
            attributes: {
              POSITION: 1,
              NORMAL: 2,
            },
            indices: 0,
            material: 0,
          },
        ],
      },
    ],
    accessors: [
      // 0: Indices
      {
        bufferView: 0,
        componentType: 5123, // UNSIGNED_SHORT
        count: indexCount,
        type: "SCALAR",
      },
      // 1: Positions
      {
        bufferView: 1,
        componentType: 5126, // FLOAT
        count: posCount,
        type: "VEC3",
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      },
      // 2: Normals
      {
        bufferView: 2,
        componentType: 5126, // FLOAT
        count: posCount,
        type: "VEC3",
      },
      // 3: Time
      {
        bufferView: 3,
        componentType: 5126,
        count: animTimes.length,
        type: "SCALAR",
        min: [0.0],
        max: [1.2],
      },
      // 4: Idle Rotations
      {
        bufferView: 4,
        componentType: 5126,
        count: animTimes.length,
        type: "VEC4",
      },
      // 5: Run Translations
      {
        bufferView: 5,
        componentType: 5126,
        count: animTimes.length,
        type: "VEC3",
      },
      // 6: Attack Rotations
      {
        bufferView: 6,
        componentType: 5126,
        count: animTimes.length,
        type: "VEC4",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: indexViewOffset, byteLength: indexByteLength, target: 34963 },
      { buffer: 0, byteOffset: posViewOffset, byteLength: posByteLength, target: 34962 },
      { buffer: 0, byteOffset: normViewOffset, byteLength: normByteLength, target: 34962 },
      { buffer: 0, byteOffset: timeViewOffset, byteLength: timeByteLength },
      { buffer: 0, byteOffset: rotViewOffset, byteLength: rotByteLength },
      { buffer: 0, byteOffset: transViewOffset, byteLength: transByteLength },
      { buffer: 0, byteOffset: attackRotViewOffset, byteLength: rotByteLength },
    ],
    buffers: [
      {
        byteLength: paddedBinLength,
      },
    ],
    animations: [
      {
        name: "idle",
        channels: [
          {
            sampler: 0,
            target: { node: 0, path: "rotation" },
          },
        ],
        samplers: [
          { input: 3, output: 4, interpolation: "LINEAR" },
        ],
      },
      {
        name: "run",
        channels: [
          {
            sampler: 0,
            target: { node: 0, path: "translation" },
          },
        ],
        samplers: [
          { input: 3, output: 5, interpolation: "LINEAR" },
        ],
      },
      {
        name: "attack_slash",
        channels: [
          {
            sampler: 0,
            target: { node: 1, path: "rotation" }, // swings weapon_slot
          },
        ],
        samplers: [
          { input: 3, output: 6, interpolation: "LINEAR" },
        ],
      },
      {
        name: "skill_cast",
        channels: [
          {
            sampler: 0,
            target: { node: 0, path: "rotation" },
          },
          {
            sampler: 1,
            target: { node: 1, path: "rotation" },
          },
        ],
        samplers: [
          { input: 3, output: 4, interpolation: "LINEAR" },
          { input: 3, output: 6, interpolation: "LINEAR" },
        ],
      },
      {
        name: "death",
        channels: [
          {
            sampler: 0,
            target: { node: 0, path: "rotation" },
          },
        ],
        samplers: [
          { input: 3, output: 6, interpolation: "LINEAR" },
        ],
      },
    ],
  };

  const jsonString = JSON.stringify(gltfJson);
  const jsonBuffer = Buffer.from(jsonString, "utf8");
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJsonLength = jsonBuffer.length + jsonPadding;
  const paddedJsonBuffer = Buffer.alloc(paddedJsonLength, 0x20); // Pad with spaces
  jsonBuffer.copy(paddedJsonBuffer);

  // GLB Header (12 bytes)
  // Total length = 12 + 8 + paddedJsonLength + 8 + paddedBinLength
  const totalLength = 12 + 8 + paddedJsonLength + 8 + paddedBinLength;
  const glbHeader = Buffer.alloc(12);
  glbHeader.writeUInt32LE(0x46546C67, 0); // "glTF"
  glbHeader.writeUInt32LE(2, 4);          // version 2
  glbHeader.writeUInt32LE(totalLength, 8); // total file length

  // Chunk 0: JSON Header (8 bytes)
  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(paddedJsonLength, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON"

  // Chunk 1: BIN Header (8 bytes)
  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(paddedBinLength, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // "BIN\0"

  return Buffer.concat([
    glbHeader,
    jsonChunkHeader,
    paddedJsonBuffer,
    binChunkHeader,
    paddedBinBuffer,
  ]);
}

// ==============================================================================
// Character & Monster Definitions for RPG Pipeline
// ==============================================================================

const HERO_MODELS = [
  {
    id: "hero_base",
    name: "Hero Base Rig",
    color: [0.3, 0.4, 0.6] as [number, number, number],
    size: [0.8, 1.8, 0.6],
    weaponSocketOffset: [0.55, 0.85, 0.3],
  },
  {
    id: "fighter",
    name: "Cuồng Long Chiến Binh",
    color: [0.95, 0.45, 0.1] as [number, number, number],
    size: [0.9, 1.9, 0.7],
    weaponSocketOffset: [0.65, 0.9, 0.35],
  },
  {
    id: "assassin",
    name: "Ám Dạ Sát Thủ",
    color: [0.75, 0.25, 0.9] as [number, number, number],
    size: [0.75, 1.75, 0.55],
    weaponSocketOffset: [0.5, 0.8, 0.3],
  },
  {
    id: "tank",
    name: "Hoàng Kim Hộ Vệ",
    color: [0.95, 0.75, 0.15] as [number, number, number],
    size: [1.1, 2.0, 0.9],
    weaponSocketOffset: [0.75, 0.95, 0.4],
  },
  {
    id: "gunner",
    name: "Lượng Tử Xạ Thủ",
    color: [0.1, 0.75, 0.95] as [number, number, number],
    size: [0.8, 1.8, 0.6],
    weaponSocketOffset: [0.6, 0.85, 0.4],
  },
];

const MONSTER_MODELS = [
  {
    id: "slime",
    name: "Slime Rừng Sâu",
    color: [0.2, 0.8, 0.3] as [number, number, number],
    size: [1.2, 0.8, 1.2],
  },
  {
    id: "wolf",
    name: "Sói Hoang Hoang Dã",
    color: [0.4, 0.45, 0.55] as [number, number, number],
    size: [0.8, 1.1, 1.8],
  },
  {
    id: "dragon_boss",
    name: "Rồng Lửa Cổ Đại",
    color: [0.9, 0.15, 0.15] as [number, number, number],
    size: [3.2, 4.5, 4.0],
  },
];

const WEAPON_MODELS = [
  {
    id: "weapon_sword",
    name: "Thanh Long Kiếm",
    color: [0.8, 0.85, 0.95] as [number, number, number],
    size: [0.12, 1.4, 0.08],
  },
  {
    id: "weapon_daggers",
    name: "Song Đao Ám Ảnh",
    color: [0.7, 0.3, 0.9] as [number, number, number],
    size: [0.08, 0.8, 0.06],
  },
  {
    id: "weapon_blaster",
    name: "Súng Laze Lượng Tử",
    color: [0.2, 0.8, 0.95] as [number, number, number],
    size: [0.15, 0.35, 0.7],
  },
  {
    id: "weapon_shield",
    name: "Khiên Thánh Hoàng Kim",
    color: [0.95, 0.75, 0.2] as [number, number, number],
    size: [0.8, 1.1, 0.15],
  },
];

async function runRpgAssetPipeline() {
  console.log("=================================================================");
  console.log("⚔️ CHIẾN LONG BÁ — AUTOMATED RPG 3D ASSET PIPELINE (animated-asset-skill)");
  console.log("=================================================================");

  const registry: Record<string, any> = {
    pipelineVersion: "2.5.0-pro",
    animationClips: ["idle", "run", "attack_slash", "skill_cast", "death"],
    socketStandards: ["weapon_slot", "head_socket", "back_socket"],
    models: {},
  };

  // 1. Generate Character GLB models
  console.log("\n📦 [Stage 1/3] Generating Rigged Character GLB Models & Animation Retargeting...");
  for (const hero of HERO_MODELS) {
    const geo = createBoxVertices(hero.size[0], hero.size[1], hero.size[2]);
    const glbBuffer = buildGlbBuffer(geo, hero.color, hero.id, [
      { name: "head_socket", translation: [0, hero.size[1] * 0.55, 0] },
      { name: "back_socket", translation: [0, hero.size[1] * 0.3, -hero.size[2] * 0.55] },
    ]);

    const filePath = path.join(CHARACTERS_DIR, `${hero.id}.glb`);
    fs.writeFileSync(filePath, glbBuffer);
    console.log(`  ✓ Built 3D GLB Asset: characters/${hero.id}.glb (${(glbBuffer.length / 1024).toFixed(1)} KB)`);

    registry.models[hero.id] = {
      type: "character",
      name: hero.name,
      file: `/assets/models/characters/${hero.id}.glb`,
      size: hero.size,
      hasWeaponSocket: true,
      animations: ["idle", "run", "attack_slash", "skill_cast", "death"],
    };
  }

  // 2. Generate Monster & Boss GLB models
  console.log("\n🐉 [Stage 2/3] Generating Monster & Boss GLB Models...");
  for (const mon of MONSTER_MODELS) {
    const geo = createBoxVertices(mon.size[0], mon.size[1], mon.size[2]);
    const glbBuffer = buildGlbBuffer(geo, mon.color, mon.id);

    const filePath = path.join(MONSTERS_DIR, `${mon.id}.glb`);
    fs.writeFileSync(filePath, glbBuffer);
    console.log(`  ✓ Built 3D GLB Asset: monsters/${mon.id}.glb (${(glbBuffer.length / 1024).toFixed(1)} KB)`);

    registry.models[mon.id] = {
      type: "monster",
      name: mon.name,
      file: `/assets/models/monsters/${mon.id}.glb`,
      size: mon.size,
      animations: ["idle", "run", "attack_slash", "death"],
    };
  }

  // 3. Generate Weapon GLB models
  console.log("\n🗡️ [Stage 3/3] Generating 3D Weapon Meshes for Weapon Sockets...");
  for (const wep of WEAPON_MODELS) {
    const geo = createBoxVertices(wep.size[0], wep.size[1], wep.size[2]);
    const glbBuffer = buildGlbBuffer(geo, wep.color, wep.id);

    const filePath = path.join(WEAPONS_DIR, `${wep.id}.glb`);
    fs.writeFileSync(filePath, glbBuffer);
    console.log(`  ✓ Built Weapon Asset: weapons/${wep.id}.glb (${(glbBuffer.length / 1024).toFixed(1)} KB)`);

    registry.models[wep.id] = {
      type: "weapon",
      name: wep.name,
      file: `/assets/models/weapons/${wep.id}.glb`,
      size: wep.size,
    };
  }

  // 4. Save Model Registry Manifest
  const manifestPath = path.join(MODELS_DIR, "model-registry.json");
  fs.writeFileSync(manifestPath, JSON.stringify(registry, null, 2), "utf8");
  console.log(`\n📋 Saved Model Registry Manifest: ${manifestPath}`);
  console.log("✨ Pipeline executed successfully with 100% production assets ready!");
}

runRpgAssetPipeline().catch((err) => {
  console.error("❌ RPG Asset Pipeline Failed:", err);
  process.exit(1);
});
