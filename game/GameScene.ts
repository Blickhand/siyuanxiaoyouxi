import * as THREE from 'three';
import gsap from 'gsap';
import { Player } from './Player';
import { InputManager } from './InputManager';
import { PoolManager } from './PoolManager';
import { SceneryManager } from './SceneryManager';
import { 
  COLOR_SKY, 
  COLOR_FOG, 
  COLOR_GROUND_TRACK, 
  COLOR_GROUND_SNOW,
  CAMERA_OFFSET_Y,
  CAMERA_OFFSET_Z,
  CAMERA_FOV,
  LANE_WIDTH,
  GAME_SPEED_START,
  GAME_SPEED_MAX,
  OBSTACLE_INTERVAL,
  OBSTACLE_INTERVAL_MIN,
  GROUND_SEGMENT_LENGTH,
  GROUND_SEGMENT_COUNT,
  SPAWN_DISTANCE
} from '../constants';

type GameState = 'MENU' | 'TRANSITION' | 'PLAYING' | 'GAMEOVER';

export class GameScene {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private player: Player;
  private inputManager: InputManager;
  private poolManager: PoolManager;
  private sceneryManager: SceneryManager;
  
  private animationId: number | null = null;
  private clock: THREE.Clock;
  
  // Game State
  private gameState: GameState = 'MENU';
  private gameSpeed: number = GAME_SPEED_START;
  private score: number = 0;
  private spawnTimer: number = 0;

  // Infinite Ground
  private groundSegments: THREE.Group[] = [];
  
  // Snow Particles
  private snowSystem: THREE.Points | null = null;
  private snowVelocities: Float32Array | null = null;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Setup Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLOR_SKY);
    this.scene.fog = new THREE.Fog(COLOR_FOG, 15, 60);

    // 3. Setup Camera
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, container.clientWidth / container.clientHeight, 0.1, 100);
    
    // 4. Setup Lights
    this.setupLights();

    // 5. Setup Infinite World
    this.buildInfiniteWorld();
    
    // 6. Setup Snow
    this.createSnow();

    // 7. Setup Player
    this.player = new Player();
    this.scene.add(this.player.mesh);

    // 8. Setup Managers
    this.poolManager = new PoolManager(this.scene);
    this.sceneryManager = new SceneryManager(this.scene);

    // 9. Setup Inputs
    this.inputManager = new InputManager((dir) => this.handleInput(dir));
    this.inputManager.enable();

    // 10. Listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('game-start', this.startGame);
    window.addEventListener('game-restart', this.restartGame);
    window.addEventListener('game-return-menu', this.returnToMenu);

    // 11. Enter Menu State
    this.enterMenu();

    // 12. Start Loop
    this.animate();
  }

  private enterMenu() {
    this.gameState = 'MENU';
    this.gameSpeed = 0; // Stop world movement
    this.player.startIdle(); // Start breathing animation
    // Initial camera position for orbit is handled in animate()
    
    this.scene.fog = new THREE.Fog(COLOR_FOG, 15, 60);
    // Notify UI
    this.dispatchStateChange();
  }

  private startGame = () => {
    if (this.gameState !== 'MENU' && this.gameState !== 'GAMEOVER') return;
    
    this.gameState = 'TRANSITION';
    this.dispatchStateChange();

    // 1. Stop Player Idle
    this.player.stopIdle();

    // 2. Animate Camera from Orbit to Runner View
    // The current orbit position is dynamic, so GSAP will pick up from current values automatically.
    gsap.to(this.camera.position, {
      x: 0,
      y: CAMERA_OFFSET_Y,
      z: CAMERA_OFFSET_Z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(0, 1, -5); // Keep looking ahead
      },
      onComplete: () => {
        this.gameState = 'PLAYING';
        this.gameSpeed = GAME_SPEED_START;
        this.dispatchStateChange();
      }
    });

    // 3. Reset Game Logic
    this.resetGameLogic();
  };

  private restartGame = () => {
    // Quick restart logic
    this.gameState = 'PLAYING';
    this.gameSpeed = GAME_SPEED_START;
    this.resetGameLogic();
    this.player.stopIdle();
    this.scene.fog = new THREE.Fog(COLOR_FOG, 15, 60);
    this.dispatchStateChange();
  };

  private returnToMenu = () => {
    this.resetGameLogic();
    this.enterMenu();
  };

  private resetGameLogic() {
    this.isGameOver = false; // Internal flag for input check
    this.score = 0;
    this.spawnTimer = 0;
    this.addScore(0);
    
    // Reset Managers
    this.poolManager.reset();
    this.sceneryManager.reset();
    
    // Reset Ground
    for (let i = 0; i < GROUND_SEGMENT_COUNT; i++) {
       this.groundSegments[i].position.z = -i * GROUND_SEGMENT_LENGTH;
    }
    // Reset Player
    this.player.mesh.position.set(0,0,0);
  }

  private isGameOver = false; // Kept for compatibility with handleInput checks

  private setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(-20, 50, -20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    const d = 30;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);
  }

  private buildInfiniteWorld() {
    const trackGeo = new THREE.PlaneGeometry(LANE_WIDTH * 3, GROUND_SEGMENT_LENGTH);
    const trackMat = new THREE.MeshStandardMaterial({ color: COLOR_GROUND_TRACK });
    const snowGeo = new THREE.PlaneGeometry(30, GROUND_SEGMENT_LENGTH);
    const snowMat = new THREE.MeshStandardMaterial({ color: COLOR_GROUND_SNOW });

    for (let i = 0; i < GROUND_SEGMENT_COUNT; i++) {
      const segment = new THREE.Group();
      
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.rotation.x = -Math.PI / 2;
      track.receiveShadow = true;
      segment.add(track);

      const leftSnow = new THREE.Mesh(snowGeo, snowMat);
      leftSnow.rotation.x = -Math.PI / 2;
      leftSnow.position.x = -(LANE_WIDTH * 1.5 + 15);
      leftSnow.receiveShadow = true;
      segment.add(leftSnow);

      const rightSnow = new THREE.Mesh(snowGeo, snowMat);
      rightSnow.rotation.x = -Math.PI / 2;
      rightSnow.position.x = (LANE_WIDTH * 1.5 + 15);
      rightSnow.receiveShadow = true;
      segment.add(rightSnow);

      segment.position.z = -i * GROUND_SEGMENT_LENGTH;
      this.groundSegments.push(segment);
      this.scene.add(segment);
    }
  }

  private createSnow() {
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.snowVelocities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 20;
      this.snowVelocities[i] = 2 + Math.random() * 5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ 
      color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8 
    });
    this.snowSystem = new THREE.Points(geometry, material);
    this.scene.add(this.snowSystem);
  }

  private updateSnow(dt: number) {
    if (!this.snowSystem || !this.snowVelocities) return;
    const positions = this.snowSystem.geometry.attributes.position.array as Float32Array;
    
    // During MENU/TRANSITION, wind speed is low. During PLAYING, it matches game speed.
    const windSpeed = (this.gameState === 'PLAYING') ? this.gameSpeed : 2.0;

    for (let i = 0; i < this.snowVelocities.length; i++) {
      positions[i * 3 + 1] -= this.snowVelocities[i] * dt;
      positions[i * 3 + 2] += windSpeed * 0.5 * dt;

      if (positions[i * 3 + 1] < 0 || positions[i * 3 + 2] > 10) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = 30 + Math.random() * 10;
        positions[i * 3 + 2] = -40 - Math.random() * 20;
      }
    }
    this.snowSystem.geometry.attributes.position.needsUpdate = true;
  }

  private handleInput(direction: 'left' | 'right' | 'up' | 'down') {
    if (this.gameState !== 'PLAYING') return;
    if (this.isGameOver) return;

    switch(direction) {
      case 'left': this.player.moveLeft(); break;
      case 'right': this.player.moveRight(); break;
      case 'up': this.player.jump(); break;
      case 'down': this.player.roll(); break;
    }
  }

  private updateWorld(dt: number) {
    const moveDistance = this.gameSpeed * dt;

    // 1. Move Ground Segments
    for (const segment of this.groundSegments) {
      segment.position.z += moveDistance;
      if (segment.position.z > GROUND_SEGMENT_LENGTH) {
        let minZ = 0;
        this.groundSegments.forEach(s => minZ = Math.min(minZ, s.position.z));
        segment.position.z = minZ - GROUND_SEGMENT_LENGTH;
      }
    }

    // 2. Move & Spawn Scenery
    this.sceneryManager.update(dt, this.gameSpeed);

    // 3. Spawn Obstacles
    const speedProgress = Math.min(1, (this.gameSpeed - GAME_SPEED_START) / (GAME_SPEED_MAX - GAME_SPEED_START));
    const currentSpawnInterval = OBSTACLE_INTERVAL - (speedProgress * (OBSTACLE_INTERVAL - OBSTACLE_INTERVAL_MIN));

    this.spawnTimer += moveDistance;
    if (this.spawnTimer > currentSpawnInterval) {
      this.spawnTimer = 0;
      const spawnZ = -SPAWN_DISTANCE;
      
      if (Math.random() > 0.3) {
         this.poolManager.spawnObstacle(spawnZ);
      } else {
         this.poolManager.spawnCoin(spawnZ);
      }
    }

    // 4. Update Pool & Collisions
    const result = this.poolManager.update(dt, this.gameSpeed, this.player.mesh.children[0]);
    
    if (result.scoreDelta > 0) {
      this.addScore(result.scoreDelta);
    }
    
    if (result.gameOver) {
      this.setGameOver();
    }
  }

  private addScore(amount: number) {
    this.score += amount;
    window.dispatchEvent(new CustomEvent('score-update', { detail: this.score }));
  }

  private setGameOver() {
    this.isGameOver = true;
    this.gameState = 'GAMEOVER';
    this.scene.fog = new THREE.Fog(0x880000, 2, 10);
    this.dispatchStateChange();
  }

  private dispatchStateChange() {
    window.dispatchEvent(new CustomEvent('game-state-change', { detail: this.gameState }));
  }

  private updateCameraPlaying() {
    const playerPos = this.player.getPosition();
    const targetY = playerPos.y + CAMERA_OFFSET_Y;
    
    this.camera.position.x = 0;
    this.camera.position.z = CAMERA_OFFSET_Z; 
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
    this.camera.lookAt(0, playerPos.y + 1, -10);
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();

    if (this.gameState === 'MENU') {
      // Orbit Camera Logic
      const time = Date.now() * 0.0005;
      const radius = 5;
      this.camera.position.x = Math.sin(time) * radius;
      this.camera.position.z = Math.cos(time) * radius + 1; // Slight offset so we don't clip too close
      this.camera.position.y = 2.5;
      this.camera.lookAt(0, 1, 0); // Look at player center

      this.updateSnow(dt); // Keep snow falling
    
    } else if (this.gameState === 'TRANSITION') {
      // Camera is handled by GSAP
      this.updateSnow(dt);

    } else if (this.gameState === 'PLAYING') {
      // Gameplay Logic
      this.player.update(dt);
      this.updateWorld(dt);
      this.updateSnow(dt);
      this.updateCameraPlaying();
      
      if (this.gameSpeed < GAME_SPEED_MAX) {
        this.gameSpeed += 0.3 * dt; 
      }
    } else if (this.gameState === 'GAMEOVER') {
       // Static camera or slight movement?
       // Just render scene
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('game-start', this.startGame);
    window.removeEventListener('game-restart', this.restartGame);
    window.removeEventListener('game-return-menu', this.returnToMenu);
    this.inputManager.disable();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
