window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

WH.webgl.FpsController = class {
  constructor(camera, domElement, onExit) {
    this.camera = camera;
    this.domElement = domElement;
    this.onExit = onExit;

    this.isFPSActive = false;
    this.keys = {};
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.clock = new THREE.Clock();
    this.dropAnimationFrameId = 0;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  handleKeyDown(event) {
    if (!this.isFPSActive) return;
    this.keys[event.code] = true;
    if (event.code === 'Escape') this.exit();
  }

  handleKeyUp(event) {
    if (!this.isFPSActive) return;
    this.keys[event.code] = false;
  }

  handlePointerLockChange() {
    if (document.pointerLockElement !== this.domElement && this.isFPSActive) {
      this.exit();
    }
  }

  handleMouseMove(event) {
    if (!this.isFPSActive) return;

    const sensitivity = WH.config.WAREHOUSE_CONFIG.camera.fps.lookSensitivity;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= (event.movementX || 0) * sensitivity;
    this.euler.x -= (event.movementY || 0) * sensitivity;

    const maxPitch = Math.PI / 2 - 0.08;
    this.euler.x = Math.max(-maxPitch, Math.min(maxPitch, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  isActive() {
    return this.isFPSActive;
  }

  enter(targetX, targetZ) {
    if (this.isFPSActive) return;

    const { fps } = WH.config.WAREHOUSE_CONFIG.camera;
    const targetY = fps.eyeHeight;
    const duration = fps.transitionDuration;

    const startX = this.camera.position.x;
    const startY = this.camera.position.y;
    const startZ = this.camera.position.z;
    const startTime = performance.now();

    const hasTargetXZ = typeof targetX === 'number' && typeof targetZ === 'number';

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.x = 0;
    this.camera.quaternion.setFromEuler(this.euler);

    cancelAnimationFrame(this.dropAnimationFrameId);

    const animateDrop = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.y = startY + (targetY - startY) * ease;

      if (hasTargetXZ) {
        this.camera.position.x = startX + (targetX - startX) * ease;
        this.camera.position.z = startZ + (targetZ - startZ) * ease;
      }

      if (progress < 1.0) {
        this.dropAnimationFrameId = requestAnimationFrame(animateDrop);
      } else {
        this.isFPSActive = true;
        this.clock.start();
        this.domElement.requestPointerLock?.();
        document.addEventListener('mousemove', this.handleMouseMove, false);
      }
    };

    this.dropAnimationFrameId = requestAnimationFrame(animateDrop);
  }

  exit() {
    if (!this.isFPSActive) return;

    this.isFPSActive = false;
    document.exitPointerLock?.();
    document.removeEventListener('mousemove', this.handleMouseMove, false);

    Object.keys(this.keys).forEach((key) => { this.keys[key] = false; });

    this.onExit();
  }

  update() {
    if (!this.isFPSActive) return;

    const { fps } = WH.config.WAREHOUSE_CONFIG.camera;
    const baseSpeed = fps.moveSpeed;
    const sprintMultiplier = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? fps.sprintMultiplier : 1.0;
    const speed = baseSpeed * sprintMultiplier * this.clock.getDelta();

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDirection = new THREE.Vector3();

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDirection.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDirection.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDirection.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDirection.sub(right);

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      this.camera.position.addScaledVector(moveDirection, speed);
    }

    this.camera.position.y = fps.eyeHeight;
  }

  dispose() {
    cancelAnimationFrame(this.dropAnimationFrameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('mousemove', this.handleMouseMove);
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock?.();
    }
  }
};