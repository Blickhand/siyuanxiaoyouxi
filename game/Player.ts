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
  private characterRoot: THREE.Group; // Container for all body parts
  private currentLane: number = 0; // -1, 0, 1
  private isJumping: boolean = false;
  private isRolling: boolean = false;
  private jumpTimeline: gsap.core.Timeline | null = null;
  private rollTimeline: gsap.core.Timeline | null = null;
  private idleTimeline: gsap.core.Timeline | null = null;

  constructor() {
    this.mesh = new THREE.Group();

    // --- Build Character (Si Yuan Student) ---
    this.characterRoot = new THREE.Group();
    
    // Materials
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xf1c27d }); // Skin tone
    const matCoat = new THREE.MeshStandardMaterial({ color: 0x1e40af }); // Blue Coat (Blue 800)
    const matPants = new THREE.MeshStandardMaterial({ color: 0x0f172a }); // Dark Pants (Slate 900)
    const matScarf = new THREE.MeshStandardMaterial({ color: 0xdc2626 }); // Red Scarf
    const matHair = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black Hair

    // 1. Legs (Left/Right)
    const legGeo = new THREE.BoxGeometry(0.24, 0.6, 0.3);
    
    const legL = new THREE.Mesh(legGeo, matPants);
    legL.position.set(-0.2, 0.3, 0); // Y=0.3 puts feet at 0
    legL.castShadow = true;
    this.characterRoot.add(legL);

    const legR = new THREE.Mesh(legGeo, matPants);
    legR.position.set(0.2, 0.3, 0);
    legR.castShadow = true;
    this.characterRoot.add(legR);

    // 2. Body (Coat)
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.65, 0.45);
    const body = new THREE.Mesh(bodyGeo, matCoat);
    body.position.set(0, 0.925, 0); // 0.6 (Legs) + 0.325 (Half Body)
    body.castShadow = true;
    this.characterRoot.add(body);

    // 3. Head
    const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const head = new THREE.Mesh(headGeo, matSkin);
    head.position.set(0, 1.45, 0);
    head.castShadow = true;
    this.characterRoot.add(head);

    // 4. Hair (Simple cap-like box on top)
    const hairGeo = new THREE.BoxGeometry(0.37, 0.1, 0.37);
    const hair = new THREE.Mesh(hairGeo, matHair);
    hair.position.set(0, 1.65, 0);
    this.characterRoot.add(hair);

    // 5. Scarf (The defining feature)
    // Ring around neck
    const scarfRingGeo = new THREE.TorusGeometry(0.25, 0.08, 8, 12);
    const scarfRing = new THREE.Mesh(scarfRingGeo, matScarf);
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.set(0, 1.25, 0); // Neck position
    this.characterRoot.add(scarfRing);
    
    // Scarf Tail (Floating behind)
    const scarfTailGeo = new THREE.BoxGeometry(0.15, 0.4, 0.05);
    const scarfTail = new THREE.Mesh(scarfTailGeo, matScarf);
    scarfTail.position.set(0, 1.2, 0.35); // Behind neck
    scarfTail.rotation.x = Math.PI / 6; // Angled out
    this.characterRoot.add(scarfTail);

    // Add character to the main group
    // Ideally, character pivot is at feet (0,0,0) inside characterRoot
    this.mesh.add(this.characterRoot);
    
    // Initial position
    this.mesh.position.y = 0;
    this.mesh.position.x = 0;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }

  public startIdle() {
    if (this.idleTimeline) this.idleTimeline.kill();
    
    // Reset properties first
    this.characterRoot.scale.set(1, 1, 1);
    this.characterRoot.position.y = 0;

    this.idleTimeline = gsap.timeline({ repeat: -1, yoyo: true });
    
    // Breathing/Bobbing animation
    // Scale up slightly vertically, squeeze horizontally
    this.idleTimeline.to(this.characterRoot.scale, {
      y: 1.05,
      x: 0.95,
      z: 0.95,
      duration: 1,
      ease: "sine.inOut"
    });
    // Move up slightly to simulate breathing in
    this.idleTimeline.to(this.characterRoot.position, {
      y: 0.02,
      duration: 1,
      ease: "sine.inOut"
    }, "<");
  }

  public stopIdle() {
    if (this.idleTimeline) {
      this.idleTimeline.kill();
      this.idleTimeline = null;
    }
    // Quick reset animation
    gsap.to(this.characterRoot.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
    gsap.to(this.characterRoot.position, { y: 0, duration: 0.3 });
    gsap.to(this.characterRoot.rotation, { x: 0, y: 0, z: 0, duration: 0.3 });
  }

  public moveLeft() {
    if (this.currentLane > -1) {
      this.currentLane--;
      this.animateLaneChange();
    }
  }

  public moveRight() {
    if (this.currentLane < 1) {
      this.currentLane++;
      this.animateLaneChange();
    }
  }

  public jump() {
    if (this.isJumping) return;
    
    this.isJumping = true;
    
    // Kill rolling if we jump instantly
    if (this.isRolling && this.rollTimeline) {
       this.rollTimeline.progress(1); // Finish roll immediately
    }

    this.jumpTimeline = gsap.timeline({
      onComplete: () => {
        this.isJumping = false;
      }
    });

    // Jump Up
    this.jumpTimeline.to(this.mesh.position, {
      y: JUMP_HEIGHT,
      duration: JUMP_DURATION / 2,
      ease: "power2.out"
    });

    // Fall Down
    this.jumpTimeline.to(this.mesh.position, {
      y: 0,
      duration: JUMP_DURATION / 2,
      ease: "power2.in"
    });
    
    // Jump Animation: Slight tilt forward then back
    gsap.fromTo(this.characterRoot.rotation, 
      { x: 0 }, 
      { x: -Math.PI * 0.1, duration: JUMP_DURATION / 2, yoyo: true, repeat: 1 }
    );
  }

  public roll() {
    if (this.isRolling || this.isJumping) return;
    
    this.isRolling = true;

    this.rollTimeline = gsap.timeline({
      onComplete: () => {
        this.isRolling = false;
      }
    });

    const squashDuration = 0.1;

    this.rollTimeline.add('squash');
    
    this.rollTimeline.to(this.characterRoot.scale, {
      y: 0.5,
      x: 1.2, // Widen slightly for "squash" feel
      z: 1.2,
      duration: squashDuration,
      ease: "power2.out"
    }, 'squash');
    
    // Phase 2: Hold
    this.rollTimeline.to({}, { duration: ROLL_DURATION - (squashDuration * 2) });

    // Phase 3: Restore
    this.rollTimeline.add('restore');
    
    this.rollTimeline.to(this.characterRoot.scale, {
      y: 1,
      x: 1,
      z: 1,
      duration: squashDuration,
      ease: "elastic.out(1, 0.5)"
    }, 'restore');
  }

  private animateLaneChange() {
    // Lean effect
    gsap.to(this.mesh.position, {
      x: this.currentLane * LANE_WIDTH,
      duration: LANE_CHANGE_DURATION,
      ease: "power2.inOut"
    });

    // Add a slight banking tilt to the character visuals
    gsap.to(this.characterRoot.rotation, {
      z: - (this.currentLane * 0.15), // Tilt into turn
      duration: LANE_CHANGE_DURATION / 2,
      yoyo: true,
      repeat: 1
    });
  }

  public update(dt: number) {
    // Logic that needs to run every frame
  }
}