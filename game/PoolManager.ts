import * as THREE from 'three';
import { LANE_WIDTH, LANE_COUNT, JUMP_HEIGHT } from '../constants';

type ObstacleType = 'JUMP' | 'ROLL' | 'FULL';

interface GameEntity {
  group: THREE.Group;
  active: boolean;
  lane: number;
  isCoin: boolean;
  type?: ObstacleType;
  collider: THREE.Box3;
  visuals: { jump: THREE.Object3D; roll: THREE.Object3D; full: THREE.Object3D; };
}

const matGold = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
const matRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111 });

// OPTIMIZED: Glow material that preserves shape and shading
const matCoinGlow = new THREE.MeshStandardMaterial({ 
  color: 0xb45309,        // Deep gold base
  emissive: 0xffd700,     // Bright yellow-gold emissive
  emissiveIntensity: 2.8, // Balanced intensity: bright but not "washed out"
  toneMapped: false,      // Allow HDR brightness
  metalness: 1.0,         // Pure metal
  roughness: 0.15         // Slight gloss to catch directional lights
});

export class PoolManager {
  private scene: THREE.Scene;
  private obstacles: GameEntity[] = [];
  private coins: GameEntity[] = []; 
  private totalTime: number = 0;
  private playerBox = new THREE.Box3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPool();
  }

  private createAncientCoinGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 0.4, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    const size = 0.15;
    hole.moveTo(-size, -size);
    hole.lineTo(size, -size);
    hole.lineTo(size, size);
    hole.lineTo(-size, size);
    hole.lineTo(-size, -size);
    shape.holes.push(hole);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    });
  }

  private initPool() {
    for (let i = 0; i < 20; i++) {
      const group = new THREE.Group();
      group.visible = false;
      this.scene.add(group);

      const jumpModel = this.createHorseStatue();
      const rollModel = this.createLanternLine();
      const fullModel = this.createFirecrackerBundle();

      group.add(jumpModel, rollModel, fullModel);
      this.obstacles.push({
        group, active: false, lane: 0, isCoin: false,
        collider: new THREE.Box3(),
        visuals: { jump: jumpModel, roll: rollModel, full: fullModel }
      });
    }

    const coinGeo = this.createAncientCoinGeometry();
    for (let i = 0; i < 80; i++) { // Increased pool for patterns
      const mesh = new THREE.Mesh(coinGeo, matCoinGlow);
      mesh.rotation.x = Math.PI / 2;
      const group = new THREE.Group();
      group.add(mesh);
      
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({visible: false}));
      hb.name = 'HITBOX';
      group.add(hb);
      group.visible = false;
      this.scene.add(group);
      this.coins.push({ group, active: false, lane: 0, isCoin: true, collider: new THREE.Box3(), visuals: { jump: mesh, roll: mesh, full: mesh } });
    }
  }

  private createHorseStatue(): THREE.Group {
    const root = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), matGold);
    base.position.y = 0.1;
    root.add(base);

    const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    const positions = [[0.2, 0.2], [0.2, -0.2], [-0.2, 0.2], [-0.2, -0.2]];
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, matGold);
      leg.position.set(pos[0], 0.4, pos[1]);
      root.add(leg);
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.9), matGold);
    body.position.y = 0.9;
    root.add(body);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), matGold);
    neck.position.set(0, 1.3, 0.3);
    neck.rotation.x = -0.3;
    root.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.5), matGold);
    head.position.set(0, 1.5, 0.5);
    root.add(head);

    const earGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
    const earL = new THREE.Mesh(earGeo, matGold);
    earL.position.set(0.1, 1.65, 0.4);
    root.add(earL);
    const earR = new THREE.Mesh(earGeo, matGold);
    earR.position.set(-0.1, 1.65, 0.4);
    root.add(earR);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), matGold);
    tail.position.set(0, 0.8, -0.5);
    tail.rotation.x = -0.5;
    root.add(tail);

    const hb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), new THREE.MeshBasicMaterial({visible: false}));
    hb.name = 'HITBOX'; hb.position.y = 0.55;
    root.add(hb);
    return root;
  }

  private createLanternLine(): THREE.Group {
    const root = new THREE.Group();
    const string = new THREE.Mesh(new THREE.BoxGeometry(LANE_WIDTH + 0.4, 0.05, 0.05), matBlack);
    string.position.y = 2.0;
    root.add(string);

    const createLantern = (x: number) => {
      const lGroup = new THREE.Group();
      lGroup.position.set(x, 1.6, 0);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8), matRed);
      lGroup.add(body);
      const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 8);
      const capTop = new THREE.Mesh(capGeo, matGold);
      capTop.position.y = 0.3;
      lGroup.add(capTop);
      const capBot = new THREE.Mesh(capGeo, matGold);
      capBot.position.y = -0.3;
      lGroup.add(capBot);
      const tassel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), matRed);
      tassel.position.y = -0.6;
      lGroup.add(tassel);
      return lGroup;
    };

    root.add(createLantern(-0.6));
    root.add(createLantern(0.6));

    const hb = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 0.5), new THREE.MeshBasicMaterial({visible: false}));
    hb.name = 'HITBOX'; hb.position.y = 2.2;
    root.add(hb);
    return root;
  }

  private createFirecrackerBundle(): THREE.Group {
    const root = new THREE.Group();
    const createFirecracker = (x: number, z: number, h: number) => {
      const f = new THREE.Group();
      f.position.set(x, h/2, z);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, h, 8), matRed);
      f.add(body);
      const ringGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8);
      const r1 = new THREE.Mesh(ringGeo, matGold); r1.position.y = h/2 - 0.1; f.add(r1);
      const r2 = new THREE.Mesh(ringGeo, matGold); r2.position.y = -h/2 + 0.1; f.add(r2);
      return f;
    };
    root.add(createFirecracker(0, 0, 1.8));
    root.add(createFirecracker(0.3, 0, 1.4));
    root.add(createFirecracker(-0.3, 0, 1.4));
    root.add(createFirecracker(0.15, 0.25, 1.4));
    root.add(createFirecracker(-0.15, 0.25, 1.4));
    root.add(createFirecracker(0.15, -0.25, 1.4));
    root.add(createFirecracker(-0.15, -0.25, 1.4));
    const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.02), matBlack);
    fuse.position.y = 2.0;
    root.add(fuse);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5, 1), new THREE.MeshBasicMaterial({visible: false}));
    hb.name = 'HITBOX'; hb.position.y = 2.5;
    root.add(hb);
    return root;
  }

  private spawnCoinAt(lane: number, y: number, z: number) {
    const e = this.coins.find(c => !c.active);
    if (!e) return;
    e.active = true;
    e.group.visible = true;
    e.lane = lane;
    e.group.position.set(lane * LANE_WIDTH, y, z);
  }

  public spawnObstacle(z: number) {
    const e = this.obstacles.find(o => !o.active);
    if (!e) return;
    e.active = true; e.group.visible = true;
    e.visuals.jump.visible = e.visuals.roll.visible = e.visuals.full.visible = false;
    e.lane = Math.floor(Math.random() * 3) - 1;
    e.group.position.set(e.lane * LANE_WIDTH, 0, z);
    
    const r = Math.random();
    if (r < 0.33) { 
      e.type = 'JUMP'; 
      e.visuals.jump.visible = true; 
      // Jump Arc: Guide player over the horse
      this.spawnCoinAt(e.lane, 1.0, z + 4);
      this.spawnCoinAt(e.lane, JUMP_HEIGHT + 0.3, z);
      this.spawnCoinAt(e.lane, 1.0, z - 4);
    }
    else if (r < 0.66) { 
      e.type = 'ROLL'; 
      e.visuals.roll.visible = true; 
      // Slide Line: Guide player under the lanterns
      this.spawnCoinAt(e.lane, 0.5, z + 4);
      this.spawnCoinAt(e.lane, 0.5, z);
      this.spawnCoinAt(e.lane, 0.5, z - 4);
    }
    else { 
      e.type = 'FULL'; 
      e.visuals.full.visible = true; 
      // Lane Switch Curve: Guide player to safe lane
      const safeLane = e.lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      this.spawnCoinAt(e.lane, 1.0, z + 8);
      this.spawnCoinAt((e.lane + safeLane) / 2, 1.0, z + 4);
      this.spawnCoinAt(safeLane, 1.0, z);
    }
  }

  public spawnCoin(z: number) {
    // Standard random coin for empty tracks
    this.spawnCoinAt(Math.floor(Math.random() * 3) - 1, 1, z);
  }

  public update(dt: number, speed: number, player: THREE.Object3D) {
    let res = { gameOver: false, scoreDelta: 0 };
    this.totalTime += dt;
    
    // Update Obstacles
    for (const o of this.obstacles) {
      if (o.active) {
        o.group.position.z += speed * dt;
        if (o.group.position.z > 10) { 
          this.recycle(o); 
          res.scoreDelta += 10; 
        }
        else if (o.group.position.z > -1.5 && o.group.position.z < 1.5) {
          const v = o.type === 'JUMP' ? o.visuals.jump : (o.type === 'ROLL' ? o.visuals.roll : o.visuals.full);
          if (this.checkCollision(player, v)) res.gameOver = true;
        }
      }
    }

    // Update Coins
    for (const c of this.coins) {
      if (c.active) {
        c.group.position.z += speed * dt;
        
        // Face is on XY for ExtrudeGeometry, so we rotate around Z for spin
        c.visuals.jump.rotation.z += 5 * dt; 
        c.visuals.jump.rotation.x = 0.5 + Math.sin(this.totalTime * 2) * 0.2; // Wobble
        c.visuals.jump.position.y = Math.sin(this.totalTime * 4) * 0.2;
        
        // Pulsing scale for "alive" glow
        const pulse = 1.0 + Math.sin(this.totalTime * 8) * 0.05;
        c.visuals.jump.scale.set(pulse, pulse, pulse);

        if (c.group.position.z > 10) {
          this.recycle(c);
        }
        else if (c.group.position.z > -1.5 && c.group.position.z < 1.5) {
          if (this.checkCollision(player, c.group)) { 
            this.recycle(c); 
            res.scoreDelta += 50; 
          }
        }
      }
    }
    return res;
  }

  private checkCollision(p: THREE.Object3D, e: THREE.Object3D) {
    this.playerBox.setFromObject(p).expandByScalar(-0.1);
    const target = e.getObjectByName('HITBOX') || e;
    const obox = new THREE.Box3().setFromObject(target);
    return this.playerBox.intersectsBox(obox);
  }

  private recycle(e: GameEntity) { 
    e.active = false; 
    e.group.visible = false; 
    e.group.position.z = 100; 
  }

  public reset() { 
    this.obstacles.forEach(o => this.recycle(o)); 
    this.coins.forEach(c => this.recycle(c)); 
  }
}
