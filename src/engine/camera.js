/**
 * 2D Dynamic Fighting Game Camera
 * Keeps both fighters centered, enforces visible screen bounds,
 * and handles impact screen shake.
 */

export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.maxFighterDist = viewportWidth - 64; // Max distance between fighters on screen
  }

  shake(intensity = 5, duration = 6) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(p1, p2, stageBounds) {
    // 1. Enforce max distance separation between fighters so they never spread off screen
    const leftFighter = p1.x < p2.x ? p1 : p2;
    const rightFighter = p1.x < p2.x ? p2 : p1;
    const dist = rightFighter.x - leftFighter.x;

    if (dist > this.maxFighterDist) {
      const excess = (dist - this.maxFighterDist) / 2;
      leftFighter.x += excess;
      rightFighter.x -= excess;
    }

    // 2. Center camera between both fighters
    const midX = (p1.x + p2.x) / 2;
    const targetX = midX - this.width / 2;

    // Smooth camera damping
    this.x += (targetX - this.x) * 0.18;

    // 3. Clamp camera within stage bounds
    const minCamX = stageBounds.minX + 20;
    const maxCamX = stageBounds.maxX - this.width - 20;
    this.x = Math.max(minCamX, Math.min(maxCamX, this.x));

    // 4. Handle screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      if (this.shakeDuration === 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  // Get current visible screen boundaries for clamping fighters
  getViewportBounds() {
    return {
      minX: this.x + 28,
      maxX: this.x + this.width - 28
    };
  }

  getRenderOffset() {
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeDuration > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
    }

    return {
      x: this.x + shakeX,
      y: this.y + shakeY
    };
  }
}
