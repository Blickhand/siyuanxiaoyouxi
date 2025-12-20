import * as THREE from 'three';
import gsap from 'gsap';
import { 
  LANE_WIDTH, 
  LANE_CHANGE_DURATION, 
  JUMP_DURATION, 
  JUMP_HEIGHT, 
  ROLL_DURATION 
} from '../constants';

export class Player {
  public mesh: THREE.Group;
  private characterRoot: THREE.Group; 
  private currentLane: number = 0; 
  public isJumping: boolean = false;
  public isRolling: boolean = false;
  private jumpTimeline: gsap.core.Timeline | null = null;
  private rollTimeline: gsap.core.Timeline | null = null;
  private idleTimeline: gsap.core.Timeline | null = null;

  constructor() {
    this.mesh = new THREE.Group();
    this.characterRoot = new THREE.Group();
    
    // Festive Materials
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xf1c27d });
    const matSuit = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3 }); // Silk Red Tang Suit
    const matGold = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 }); // Gold embroidery
    const matPants = new THREE.MeshStandardMaterial({ color: 0x111827 }); // Dark pants
    const matScarf = new THREE.MeshStandardMaterial({ color: 0xdc2626 }); 

    // 1. Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.6, 0.3);
    const legL = new THREE.Mesh(legGeo, matPants);
    legL.position.set(-0.2, 0.3, 0);
    this.characterRoot.add(legL);

    const legR = new THREE.Mesh(legGeo, matPants);
    legR.position.set(0.2, 0.3, 0);
    this.characterRoot.add(legR);

    // 2. Body (Tang Suit)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.45), matSuit);
    body.position.set(0, 0.925, 0);
    body.castShadow = true;
    this.characterRoot.add(body);
    
    // Gold trim on suit
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.47), matGold);
    trim.position.set(0, 0.75, 0);
    body.add(trim);

    // 3. Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matSkin);
    head.position.set(0, 1.45, 0);
    this.characterRoot.add(head);

    // 4. Scarf (Red Silk)
    const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 8, 12), matScarf);
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.set(0, 1.25, 0);
    this.characterRoot.add(scarfRing);

    this.mesh.add(this.characterRoot);
  }

  public getPosition(): THREE.Vector3 { return this.mesh.position; }

  public startIdle() {
    if (this.idleTimeline) this.idleTimeline.kill();
    this.idleTimeline = gsap.timeline({ repeat: -1, yoyo: true });
    this.idleTimeline.to(this.characterRoot.scale, { y: 1.05, x: 0.95, duration: 1, ease: "sine.inOut" });
  }

  public stopIdle() {
    if (this.idleTimeline) this.idleTimeline.kill();
    gsap.to(this.characterRoot.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
  }

  public moveLeft() { if (this.currentLane > -1) { this.currentLane--; this.animateLaneChange(); } }
  public moveRight() { if (this.currentLane < 1) { this.currentLane++; this.animateLaneChange(); } }

  public jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.jumpTimeline = gsap.timeline({ onComplete: () => this.isJumping = false });
    this.jumpTimeline.to(this.mesh.position, { y: JUMP_HEIGHT, duration: JUMP_DURATION / 2, ease: "power2.out" });
    this.jumpTimeline.to(this.mesh.position, { y: 0, duration: JUMP_DURATION / 2, ease: "power2.in" });
  }

  public roll() {
    if (this.isRolling || this.isJumping) return;
    this.isRolling = true;
    this.rollTimeline = gsap.timeline({ onComplete: () => this.isRolling = false });
    this.rollTimeline.to(this.characterRoot.scale, { y: 0.5, x: 1.2, duration: 0.15 });
    this.rollTimeline.to(this.characterRoot.scale, { y: 1, x: 1, duration: 0.15, delay: ROLL_DURATION - 0.3 });
  }

  private animateLaneChange() {
    gsap.to(this.mesh.position, { x: this.currentLane * LANE_WIDTH, duration: LANE_CHANGE_DURATION });
  }

  public update(dt: number) {}
}
