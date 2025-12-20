import * as THREE from 'three';

const SPAWN_Z = -90; 
const REMOVE_Z = 20;

interface SceneryItem {
  group: THREE.Group;
  type: 'TREE' | 'LAMP' | 'BUILDING';
  active: boolean;
}

export class SceneryManager {
  private scene: THREE.Scene;
  private pool: SceneryItem[] = [];
  private distTraveledNear: number = 0;
  private distTraveledFar: number = 0;

  // Materials
  private matPlumTrunk: THREE.MeshStandardMaterial;
  private matPlumFlower: THREE.MeshStandardMaterial;
  private matPlumSnow: THREE.MeshStandardMaterial;
  private matLampPost: THREE.MeshStandardMaterial;
  private matLampLight: THREE.MeshStandardMaterial;
  private matBuilding: THREE.MeshStandardMaterial;
  private matWindow: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    this.matPlumTrunk = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1.0 });
    this.matPlumFlower = new THREE.MeshStandardMaterial({ color: 0xff69b4, transparent: true, opacity: 0.9 });
    this.matPlumSnow = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    
    this.matLampPost = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.6, metalness: 0.4 });
    this.matLampLight = new THREE.MeshStandardMaterial({ 
      color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 6.0, toneMapped: false 
    });
    
    this.matBuilding = new THREE.MeshStandardMaterial({ color: 0x1e0a0a, roughness: 0.2 });
    this.matWindow = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });

    this.initPools();
  }

  private initPools() {
    for(let i=0; i<30; i++) this.addToPool(this.createPlumTree(), 'TREE');
    for(let i=0; i<15; i++) this.addToPool(this.createLamp(), 'LAMP');
    for(let i=0; i<20; i++) this.addToPool(this.createBuilding(), 'BUILDING');
  }

  private addToPool(group: THREE.Group, type: 'TREE' | 'LAMP' | 'BUILDING') {
    group.visible = false;
    this.scene.add(group);
    this.pool.push({ group, type, active: false });
  }

  private createPlumTree(): THREE.Group {
    const group = new THREE.Group();
    
    // Crooked Trunk (3 segments)
    const segmentGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 6);
    const s1 = new THREE.Mesh(segmentGeo, this.matPlumTrunk);
    s1.position.y = 0.75;
    s1.rotation.z = 0.1;
    group.add(s1);

    const s2 = new THREE.Mesh(segmentGeo, this.matPlumTrunk);
    s2.position.set(0.2, 2.0, 0);
    s2.rotation.z = -0.2;
    s2.scale.set(0.8, 0.8, 0.8);
    group.add(s2);

    const s3 = new THREE.Mesh(segmentGeo, this.matPlumTrunk);
    s3.position.set(-0.1, 3.0, 0);
    s3.rotation.z = 0.3;
    s3.scale.set(0.6, 0.6, 0.6);
    group.add(s3);
    
    // Flower Clusters (Spheres)
    const flowerGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const flowerSnowGeo = new THREE.SphereGeometry(0.51, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);

    const addCluster = (x: number, y: number, z: number, s: number) => {
      const cluster = new THREE.Mesh(flowerGeo, this.matPlumFlower);
      cluster.position.set(x, y, z);
      cluster.scale.setScalar(s);
      group.add(cluster);
      
      const snow = new THREE.Mesh(flowerSnowGeo, this.matPlumSnow);
      snow.position.set(x, y, z);
      snow.scale.setScalar(s);
      group.add(snow);
    };

    addCluster(0.6, 2.5, 0.2, 1.2);
    addCluster(-0.5, 3.2, -0.3, 0.9);
    addCluster(0.2, 3.8, 0.4, 0.7);
    addCluster(-0.8, 2.0, 0.5, 0.6);

    return group;
  }

  private createLamp(): THREE.Group {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 5), this.matLampPost);
    pole.position.y = 2.5;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), this.matLampPost);
    arm.position.set(0.3, 4.8, 0);
    group.add(arm);

    // Red housing for lantern look
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 8), new THREE.MeshStandardMaterial({color: 0x991b1b}));
    housing.position.set(0.7, 4.6, 0);
    group.add(housing);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.matLampLight);
    bulb.position.set(0.7, 4.5, 0);
    group.add(bulb);

    return group;
  }

  private createBuilding(): THREE.Group {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.matBuilding);
    mesh.name = 'BODY';
    
    // Long vertical "Banner" (Spring Festival Couplet style)
    const bannerGeo = new THREE.PlaneGeometry(0.2, 0.8);
    const banner = new THREE.Mesh(bannerGeo, new THREE.MeshBasicMaterial({color: 0xdc2626}));
    banner.position.set(0.4, 0, 0.51);
    mesh.add(banner);

    const winGeo = new THREE.PlaneGeometry(0.1, 0.1);
    for(let i=0; i<6; i++) {
        const w = new THREE.Mesh(winGeo, this.matWindow);
        w.position.set((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.8, 0.51);
        mesh.add(w);
    }

    mesh.position.y = 0.5; 
    group.add(mesh);
    return group;
  }

  public update(dt: number, speed: number) {
    const moveDist = speed * dt;
    for (const item of this.pool) {
      if (item.active) {
        item.group.position.z += moveDist;
        if (item.group.position.z > REMOVE_Z) {
          item.active = false;
          item.group.visible = false;
        }
      }
    }
    this.distTraveledNear += moveDist;
    this.distTraveledFar += moveDist;
    if (this.distTraveledNear > 12) { this.spawnNearLayer(); this.distTraveledNear = 0; }
    if (this.distTraveledFar > 35) { this.spawnFarLayer(); this.distTraveledFar = 0; }
  }

  private spawnNearLayer() {
    [-1, 1].forEach(side => {
      if (Math.random() > 0.4) {
        const type = Math.random() > 0.4 ? 'TREE' : 'LAMP';
        const item = this.pool.find(i => !i.active && i.type === type);
        if (item) {
          item.active = true;
          item.group.visible = true;
          const xOffset = side * (6 + Math.random() * 8); 
          item.group.position.set(xOffset, 0, SPAWN_Z);
          if (type === 'TREE') {
            item.group.rotation.y = Math.random() * Math.PI * 2;
            item.group.scale.setScalar(0.7 + Math.random() * 0.6);
          } else {
            item.group.rotation.y = side === 1 ? Math.PI : 0;
            item.group.position.x = side * 5.5; 
            item.group.scale.setScalar(1);
          }
        }
      }
    });
  }

  private spawnFarLayer() {
    [-1, 1].forEach(side => {
       if (Math.random() > 0.5) {
         const item = this.pool.find(i => !i.active && i.type === 'BUILDING');
         if (item) {
            item.active = true;
            item.group.visible = true;
            item.group.position.set(side * (25 + Math.random() * 25), 0, SPAWN_Z);
            const w = 10 + Math.random() * 15;
            const h = 25 + Math.random() * 40;
            const mesh = item.group.getObjectByName('BODY');
            if (mesh) {
                mesh.scale.set(w, h, 10);
                mesh.position.y = h / 2;
            }
         }
       }
    });
  }

  public reset() {
    this.pool.forEach(item => { item.active = false; item.group.visible = false; });
    this.distTraveledNear = 0; this.distTraveledFar = 0;
  }
}
