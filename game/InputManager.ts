import { Vector2 } from 'three';

type SwipeCallback = (direction: 'left' | 'right' | 'up' | 'down') => void;

export class InputManager {
  private startPos: Vector2 = new Vector2();
  private isTouching: boolean = false;
  private onSwipe: SwipeCallback;
  private threshold: number = 30; // Minimum pixels for a swipe

  constructor(onSwipe: SwipeCallback) {
    this.onSwipe = onSwipe;
  }

  public enable() {
    window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    
    // Keyboard support for debugging/desktop
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public disable() {
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleTouchStart = (e: TouchEvent) => {
    // e.preventDefault(); // Prevent scrolling
    this.isTouching = true;
    this.startPos.set(e.touches[0].clientX, e.touches[0].clientY);
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.isTouching) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    this.processSwipe(endX, endY);
    this.isTouching = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.isTouching = true;
    this.startPos.set(e.clientX, e.clientY);
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (!this.isTouching) return;
    this.processSwipe(e.clientX, e.clientY);
    this.isTouching = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
        this.onSwipe('left');
        break;
      case 'ArrowRight':
      case 'd':
        this.onSwipe('right');
        break;
      case 'ArrowUp':
      case 'w':
      case ' ':
        this.onSwipe('up');
        break;
      case 'ArrowDown':
      case 's':
        this.onSwipe('down');
        break;
    }
  };

  private processSwipe(endX: number, endY: number) {
    const deltaX = endX - this.startPos.x;
    const deltaY = endY - this.startPos.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal
      if (Math.abs(deltaX) > this.threshold) {
        this.onSwipe(deltaX > 0 ? 'right' : 'left');
      }
    } else {
      // Vertical
      if (Math.abs(deltaY) > this.threshold) {
        this.onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    }
  }
}