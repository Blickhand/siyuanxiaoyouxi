import * as THREE from 'three';

const SPAWN_Z = -90; // Spawn slightly further than fog end
const REMOVE_Z = 20;

interface SceneryItem {
  group: THREE.Group;
  type: 'TREE' | 'LAMP' | 'BUILDING';
  active: boolean;
}

export class SceneryManager {
  private scene: THREE.Scene;
  private pool: SceneryItem[] = [];
  
  // Track spawning
  private distTraveledNear: number = 0;
  private distTraveledFar: number = 0;

  // Reusable Materials
  private matTreeLeaves: THREE.MeshStandardMaterial;
  private matTreeTrunk: THREE.MeshStandardMaterial;
  private matTreeSnow: THREE.MeshStandardMaterial;
  private matLampPost: THREE.MeshStandardMaterial;
  private matLampLight: THREE.MeshStandardMaterial;
  private matBuilding: THREE.MeshStandardMaterial;
  private matWindow: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // --- Materials Setup ---
    
    // Pine Tree: Dark green leaves, brown trunk, white snow
    this.matTreeLeaves = new THREE.MeshStandardMaterial({ 
      color: 0x2f5233, 
      roughness: 0.9,
      flatShading: true
    });
    this.matTreeTrunk = new THREE.MeshStandardMaterial({ 
      color: 0x3d2817, 
      roughness: 1.0 
    });
    this.matTreeSnow = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      roughness: 0.3 
    });
    
    // Street Lamp: Dark metal, warm light
    this.matLampPost = new THREE.MeshStandardMaterial({ 
      color: 0x2d3748, 
      roughness: 0.6,
      metalness: 0.4
    });
    this.matLampLight = new THREE.MeshStandardMaterial({ 
      color: 0xffd60a, 
      emissive: 0xffd60a, 
      emissiveIntensity: 5.0, // Increased intensity for better glow
      toneMapped: false
    });
    
    // Building: Dark Slate (matches sky/fog), smooth
    this.matBuilding = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      roughness: 0.2 
    });
    // Windows: Random scattered lights (Yellow/Warm)
    this.matWindow = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });

    this.initPools();
  }

  private initPools() {
    // 1. Trees (Frequent)
    for(let i=0; i<30; i++) this.addToPool(this.createTree(), 'TREE');
    
    // 2. Lamps (Frequent)
    for(let i=0; i<15; i++) this.addToPool(this.createLamp(), 'LAMP');

    // 3. Buildings (Background)
    for(let i=0; i<20; i++) this.addToPool(this.createBuilding(), 'BUILDING');
  }

  private addToPool(group: THREE.Group, type: 'TREE' | 'LAMP' | 'BUILDING') {
    group.visible = false;
    this.scene.add(group);
    this.pool.push({ group, type, active: false });
  }

  // --- Builders ---

  private createTree(): THREE.Group {
    const group = new THREE.Group();
    
    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 1.5, 6), this.matTreeTrunk);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    group.add(trunk);
    
    // Leaves (3 layers of cones)
    const l1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.0, 7), this.matTreeLeaves);
    l1.position.y = 2.0;
    l1.castShadow = true;
    group.add(l1);
    
    const l2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 7), this.matTreeLeaves);
    l2.position.y = 3.2;
    l2.castShadow = true;
    group.add(l2);

    const l3 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 7), this.matTreeLeaves);
    l3.position.y = 4.3;
    l3.castShadow = true;
    group.add(l3);
    
    // Snow Cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.81, 0.6, 7), this.matTreeSnow);
    cap.position.y = 4.6;
    group.add(cap);

    return group;
  }

  private createLamp(): THREE.Group {
    const group = new THREE.Group();
    
    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 5), this.matLampPost);
    pole.position.y = 2.5;
    pole.castShadow = true;
    group.add(pole);

    // Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), this.matLampPost);
    arm.position.set(0.3, 4.8, 0);
    group.add(arm);

    // Bulb Housing
    const housing = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 6), this.matLampPost);
    housing.position.set(0.7, 4.8, 0);
    group.add(housing);

    // Emissive Bulb
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), this.matLampLight);
    bulb.position.set(0.7, 4.65, 0);
    group.add(bulb);

    return group;
  }

  private createBuilding(): THREE.Group {
    const group = new THREE.Group();
    
    // Main Block (Base size 1x1x1)
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geo, this.matBuilding);
    // Use name to find it later for scaling
    mesh.name = 'BODY';
    mesh.castShadow = true;
    
    // Windows - Add "strips" of light to the mesh
    // Since they are children of the mesh, they will scale with it, creating wide light bands on wide buildings
    const winGeo = new THREE.PlaneGeometry(0.6, 0.05);
    
    // Add a few random windows to the faces
    const numWindows = 3;
    for(let i=0; i<numWindows; i++) {
        const w = new THREE.Mesh(winGeo, this.matWindow);
        // Random height (-0.4 to 0.4 relative to center)
        const yPos = (Math.random() - 0.5) * 0.8;
        // Front face
        w.position.set(0, yPos, 0.51); 
        mesh.add(w);
    }
    
    // Add windows to back face as well
    for(let i=0; i<numWindows; i++) {
        const w = new THREE.Mesh(winGeo, this.matWindow);
        const yPos = (Math.random() - 0.5) * 0.8;
        w.position.set(0, yPos, -0.51);
        w.rotation.y = Math.PI;
        mesh.add(w);
    }

    // Default position y=0.5 (sitting on ground), will be adjusted in spawn
    mesh.position.y = 0.5; 
    group.add(mesh);
    
    return group;
  }

  // --- Update Loop ---

  public update(dt: number, speed: number) {
    const moveDist = speed * dt;

    // 1. Move Active Objects
    for (const item of this.pool) {
      if (item.active) {
        item.group.position.z += moveDist;
        
        // Recycle if passed camera
        if (item.group.position.z > REMOVE_Z) {
          item.active = false;
          item.group.visible = false;
        }
      }
    }

    // 2. Spawn Logic
    this.distTraveledNear += moveDist;
    this.distTraveledFar += moveDist;

    // Near objects: Spawn frequently (every ~10 units)
    if (this.distTraveledNear > 10) {
      this.spawnNearLayer();
      this.distTraveledNear = 0;
    }

    // Far objects: Spawn less frequently (every ~30 units)
    if (this.distTraveledFar > 30) {
      this.spawnFarLayer();
      this.distTraveledFar = 0;
    }
  }

  private spawnNearLayer() {
    // Attempt to spawn on both sides
    [-1, 1].forEach(side => {
      // 50% chance to spawn something on this side
      if (Math.random() > 0.5) {
        // 70% Tree, 30% Lamp
        const type = Math.random() > 0.3 ? 'TREE' : 'LAMP';
        const item = this.pool.find(i => !i.active && i.type === type);
        
        if (item) {
          item.active = true;
          item.group.visible = true;
          
          // Position: 6 to 14 units away from center
          const xOffset = side * (6 + Math.random() * 8); 
          item.group.position.set(xOffset, 0, SPAWN_Z);
          
          // Rotation & Scale
          if (type === 'TREE') {
            item.group.rotation.y = Math.random() * Math.PI * 2;
            const scale = 0.8 + Math.random() * 0.5;
            item.group.scale.setScalar(scale);
          } else {
            // Lamps face the road
            item.group.rotation.y = side === 1 ? Math.PI : 0;
            // Lamps should be closer to road (approx 5.5 units)
            item.group.position.x = side * 5.5; 
            item.group.scale.setScalar(1);
          }
        }
      }
    });
  }

  private spawnFarLayer() {
    [-1, 1].forEach(side => {
       // 50% chance for a building
       if (Math.random() > 0.5) {
         const item = this.pool.find(i => !i.active && i.type === 'BUILDING');
         if (item) {
            item.active = true;
            item.group.visible = true;

            const xOffset = side * (25 + Math.random() * 25); // 25 to 50 units away
            item.group.position.set(xOffset, 0, SPAWN_Z);

            // Randomize Building Shape
            const width = 8 + Math.random() * 12; // Wider
            const depth = 8 + Math.random() * 12;
            const height = 20 + Math.random() * 30; // Taller
            
            // Find the BODY mesh and scale it
            const mesh = item.group.getObjectByName('BODY');
            if (mesh) {
                mesh.scale.set(width, height, depth);
                // Adjust Y so it sits on ground (scale grows from center)
                mesh.position.y = height / 2;
            }
         }
       }
    });
  }

  public reset() {
    this.pool.forEach(item => {
      item.active = false;
      item.group.visible = false;
    });
    this.distTraveledNear = 0;
    this.distTraveledFar = 0;
  }
}
