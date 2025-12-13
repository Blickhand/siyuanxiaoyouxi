import * as THREE from 'three';
import { 
  LANE_WIDTH, 
  LANE_COUNT
} from '../constants';

type ObstacleType = 'JUMP' | 'ROLL' | 'FULL';

interface GameEntity {
  group: THREE.Group;
  active: boolean;
  lane: number;
  isCoin: boolean;
  type?: ObstacleType;
  collider: THREE.Box3;
  visuals: {
    jump: THREE.Object3D;
    roll: THREE.Object3D;
    full: THREE.Object3D;
  };
}

// --- Shared Assets ---
const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
const matOrange = new THREE.MeshStandardMaterial({ color: 0xffa500 });
const matWood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
const matRed = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b }); // Dark Slate
const matPaper = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }); // Paper color
const matString = new THREE.MeshBasicMaterial({ color: 0x000000 });
// Debug Material for Hitboxes (set visible: true to debug)
const matHitBox = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, visible: false });

// Geometry Recycling
const geoSphereLarge = new THREE.SphereGeometry(0.6, 16, 16);
const geoSphereSmall = new THREE.SphereGeometry(0.4, 16, 16);
const geoCone = new THREE.ConeGeometry(0.1, 0.3, 8);
const geoBoxDesk = new THREE.BoxGeometry(1.6, 1.0, 1.0);
const geoLantern = new THREE.BoxGeometry(0.4, 0.5, 0.4);

export class PoolManager {
  private scene: THREE.Scene;
  private obstacles: GameEntity[] = [];
  private coins: GameEntity[] = []; 
  private poolSizeObstacles = 20;
  private poolSizeCoins = 50;
  
  private playerBox = new THREE.Box3();
  private totalTime: number = 0; // For animation

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPool();
  }

  private initPool() {
    // 1. Initialize Obstacles
    for (let i = 0; i < this.poolSizeObstacles; i++) {
      const group = new THREE.Group();
      group.visible = false;
      this.scene.add(group);

      const jumpModel = this.createSnowman();
      const rollModel = this.createLanterns();
      const fullModel = this.createDeskPile();

      // Ensure they are initially hidden
      jumpModel.visible = false;
      rollModel.visible = false;
      fullModel.visible = false;

      group.add(jumpModel);
      group.add(rollModel);
      group.add(fullModel);

      this.obstacles.push({
        group,
        active: false,
        lane: 0,
        isCoin: false,
        collider: new THREE.Box3(),
        visuals: {
          jump: jumpModel,
          roll: rollModel,
          full: fullModel
        }
      });
    }

    // 2. Initialize Coins (Upgraded Visuals)
    // Using Octahedron for a crystal/diamond look
    const coinGeo = new THREE.OctahedronGeometry(0.35, 0); 
    const coinMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,      // Gold
      metalness: 0.8,       // Metallic look
      roughness: 0.2,       // Shiny
      emissive: 0x333300,   // Slight self-illumination
      emissiveIntensity: 0.5,
      flatShading: true     // Low-poly faceted look
    });

    for (let i = 0; i < this.poolSizeCoins; i++) {
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      mesh.castShadow = true;
      
      const group = new THREE.Group();
      group.add(mesh);
      // Add a slightly larger hitbox for coins to make collecting easier
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), matHitBox);
      hitBox.name = 'HITBOX';
      group.add(hitBox);

      group.visible = false;
      this.scene.add(group);

      this.coins.push({
        group,
        active: false,
        lane: 0,
        isCoin: true,
        collider: new THREE.Box3(),
        visuals: { jump: mesh, roll: mesh, full: mesh }
      });
    }
  }

  // --- Model Builders ---

  private createSnowman(): THREE.Group {
    const root = new THREE.Group();
    
    // Made Snowman Smaller:
    // Bottom Sphere scaled to 0.7 (r=0.42)
    const bottom = new THREE.Mesh(geoSphereLarge, matWhite);
    bottom.scale.setScalar(0.7);
    bottom.position.y = 0.4;
    bottom.castShadow = true;
    root.add(bottom);

    // Head Sphere scaled to 0.7 (r=0.28)
    const head = new THREE.Mesh(geoSphereSmall, matWhite);
    head.scale.setScalar(0.7);
    head.position.y = 0.95; // Positioned lower
    head.castShadow = true;
    root.add(head);

    // Nose
    const nose = new THREE.Mesh(geoCone, matOrange);
    nose.scale.setScalar(0.6);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.95, 0.28);
    root.add(nose);

    // HITBOX: Snowman (Jumpable)
    // Visual Top is approx 1.25m (0.95 + 0.28)
    // Hitbox Height: 1.2m. Top Y: 1.2.
    // Player Jump: 1.7m. Easily clears.
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), matHitBox);
    hitBox.position.y = 0.6; 
    hitBox.name = 'HITBOX';
    root.add(hitBox);

    return root;
  }

  private createLanterns(): THREE.Group {
    const root = new THREE.Group();
    
    // Visuals
    const stringGeo = new THREE.BoxGeometry(LANE_WIDTH + 0.5, 0.05, 0.05);
    const string = new THREE.Mesh(stringGeo, matString);
    string.position.y = 1.8;
    root.add(string);

    const l1 = new THREE.Mesh(geoLantern, matRed);
    l1.position.set(-0.5, 1.5, 0);
    l1.castShadow = true;
    root.add(l1);

    const l2 = new THREE.Mesh(geoLantern, matRed);
    l2.position.set(0.5, 1.5, 0);
    l2.castShadow = true;
    root.add(l2);

    // HITBOX: Lanterns (Rollable)
    // Box Bottom: 1.2. Top: 3.2.
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 0.5), matHitBox);
    hitBox.position.y = 2.2; 
    hitBox.name = 'HITBOX';
    root.add(hitBox);

    return root;
  }

  private createDeskPile(): THREE.Group {
    const root = new THREE.Group();
    
    // 1. Main Desk (Height 1.0)
    const desk = new THREE.Mesh(geoBoxDesk, matWood);
    desk.position.y = 0.5;
    desk.castShadow = true;
    root.add(desk);

    // 2. Tall Stack of Books (The visual blocker)
    // Height 0.8, placed on top of desk (y=1.0) -> Top reaches 1.8m
    const stackGeo = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    const stack = new THREE.Mesh(stackGeo, matPaper);
    stack.position.set(-0.3, 1.4, 0); // Left side
    stack.castShadow = true;
    root.add(stack);

    // 3. Small Book (Detail)
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), matRed);
    book.position.set(0.3, 1.075, 0.1);
    root.add(book);

    // HITBOX: Full Block (Must Change Lane)
    // Make it tall
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.0, 1.0), matHitBox);
    hitBox.position.y = 2.5; 
    hitBox.name = 'HITBOX';
    root.add(hitBox);

    return root;
  }

  // -----------------------

  public spawnObstacle(zPos: number) {
    const entity = this.obstacles.find(o => !o.active);
    if (!entity) return;

    entity.active = true;
    entity.group.visible = true;
    
    entity.visuals.jump.visible = false;
    entity.visuals.roll.visible = false;
    entity.visuals.full.visible = false;

    const lane = Math.floor(Math.random() * LANE_COUNT) - 1; 
    entity.lane = lane;
    entity.group.position.set(lane * LANE_WIDTH, 0, zPos);

    const typeRand = Math.random();
    if (typeRand < 0.33) {
      entity.type = 'JUMP';
      entity.visuals.jump.visible = true;
    } else if (typeRand < 0.66) {
      entity.type = 'ROLL';
      entity.visuals.roll.visible = true;
    } else {
      entity.type = 'FULL';
      entity.visuals.full.visible = true;
    }
  }

  public spawnCoin(zPos: number) {
    const entity = this.coins.find(c => !c.active);
    if (!entity) return;

    entity.active = true;
    entity.group.visible = true;
    
    // Ensure visual is visible (it shares the same mesh for all keys)
    entity.visuals.jump.visible = true;

    const lane = Math.floor(Math.random() * LANE_COUNT) - 1; 
    entity.lane = lane;
    
    // Initial position (Y=1.0 is the base height)
    entity.group.position.set(lane * LANE_WIDTH, 1.0, zPos);
    entity.group.rotation.set(0, 0, 0);
  }

  public update(dt: number, speed: number, playerMesh: THREE.Object3D): { gameOver: boolean, scoreDelta: number } {
    let result = { gameOver: false, scoreDelta: 0 };
    this.totalTime += dt;
    
    for (const obs of this.obstacles) {
      if (obs.active) {
        obs.group.position.z += speed * dt;
        
        if (obs.group.position.z > 10) {
          this.recycle(obs);
          result.scoreDelta += 10;
        } else {
          if (obs.group.position.z > -2 && obs.group.position.z < 2) {
             // Pass the active visual group to check collision
             let activeVisual: THREE.Object3D | null = null;
             if (obs.type === 'JUMP') activeVisual = obs.visuals.jump;
             else if (obs.type === 'ROLL') activeVisual = obs.visuals.roll;
             else if (obs.type === 'FULL') activeVisual = obs.visuals.full;

             if (activeVisual && this.checkCollision(playerMesh, activeVisual)) {
                result.gameOver = true;
             }
          }
        }
      }
    }

    for (const coin of this.coins) {
      if (coin.active) {
        coin.group.position.z += speed * dt;
        
        // 1. Spin Animation (Y-axis)
        coin.visuals.jump.rotation.y += 4 * dt; 
        
        // 2. Float/Bob Animation (Y-axis) - moves the mesh relative to group anchor
        // Use ID to desync animations slightly
        coin.visuals.jump.position.y = Math.sin(this.totalTime * 3 + coin.group.id) * 0.15;

        if (coin.group.position.z > 10) {
          this.recycle(coin);
        } else {
          if (coin.group.position.z > -2 && coin.group.position.z < 2) {
            // Check collision against the coin group (which contains hitbox)
            if (this.checkCollision(playerMesh, coin.group)) {
              this.recycle(coin);
              result.scoreDelta += 50;
            }
          }
        }
      }
    }

    return result;
  }

  private checkCollision(player: THREE.Object3D, entityGroup: THREE.Object3D): boolean {
    this.playerBox.setFromObject(player);
    this.playerBox.expandByScalar(-0.15); 

    const hitBoxObj = entityGroup.getObjectByName('HITBOX');
    const target = hitBoxObj || entityGroup;

    entityGroup.parent?.updateMatrixWorld(true);
    target.collider = target.collider || new THREE.Box3();
    
    const obstacleBox = new THREE.Box3().setFromObject(target);

    return this.playerBox.intersectsBox(obstacleBox);
  }

  public reset() {
    this.obstacles.forEach(o => this.recycle(o));
    this.coins.forEach(c => this.recycle(c));
  }

  private recycle(entity: GameEntity) {
    entity.active = false;
    entity.group.visible = false;
    entity.group.position.set(0, -100, 0);
  }
}
