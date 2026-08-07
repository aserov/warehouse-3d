window.Warehouse = window.Warehouse || {};

window.Warehouse.FPSController = (function() {
  let camera = null;
  let domElement = null;
  let onExitCallback = null;

  let isFPS = false;
  const keys = {};
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const clock = new THREE.Clock();

  function init(threeCamera, canvasElement, exitCallback) {
    camera = threeCamera;
    domElement = canvasElement || document.body;
    onExitCallback = exitCallback;

    setupListeners();
  }

  function setupListeners() {
    window.addEventListener('keydown', (e) => {
      if (!isFPS) return;
      keys[e.code] = true;

      if (e.code === 'Escape') {
        exit();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!isFPS) return;
      keys[e.code] = false;
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== domElement && isFPS) {
        exit();
      }
    });
  }

  function onMouseMove(event) {
    if (!isFPS) return;

    const { fps } = window.Warehouse.CONFIG.camera;
    const sensitivity = fps?.lookSensitivity || 0.002;

    euler.setFromQuaternion(camera.quaternion);
    euler.y -= (event.movementX || 0) * sensitivity;
    euler.x -= (event.movementY || 0) * sensitivity;

    // Limit vertical look (-85 deg to +85 deg)
    const maxPitch = Math.PI / 2 - 0.08;
    euler.x = Math.max(-maxPitch, Math.min(maxPitch, euler.x));

    camera.quaternion.setFromEuler(euler);
  }

  function enter(targetX, targetZ) {
    if (isFPS) return;

    const { fps } = window.Warehouse.CONFIG.camera;
    const targetY = fps?.eyeHeight || 1.8;
    const duration = fps?.transitionDuration || 600;

    const startX = camera.position.x;
    const startY = camera.position.y;
    const startZ = camera.position.z;
    const startTime = performance.now();

    const hasTargetXZ = typeof targetX === 'number' && typeof targetZ === 'number';

    // Reset pitch angle to keep view strictly horizontal
    euler.setFromQuaternion(camera.quaternion);
    euler.x = 0;
    camera.quaternion.setFromEuler(euler);

    // Smooth transition animation to warehouse center at eye height
    function animateDrop(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

      camera.position.y = startY + (targetY - startY) * ease;

      if (hasTargetXZ) {
        camera.position.x = startX + (targetX - startX) * ease;
        camera.position.z = startZ + (targetZ - startZ) * ease;
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateDrop);
      } else {
        isFPS = true;
        clock.start();
        domElement.requestPointerLock?.();
        document.addEventListener('mousemove', onMouseMove, false);
      }
    }

    requestAnimationFrame(animateDrop);
  }

  function exit() {
    if (!isFPS) return;

    isFPS = false;
    document.exitPointerLock?.();
    document.removeEventListener('mousemove', onMouseMove, false);

    // Reset key states
    Object.keys(keys).forEach(k => keys[k] = false);

    // Notify CameraController
    if (typeof onExitCallback === 'function') {
      onExitCallback();
    }
  }

  function update() {
    if (!isFPS) return;

    const { fps } = window.Warehouse.CONFIG.camera;
    const baseSpeed = fps?.moveSpeed || 40.0;
    const sprintMultiplier = (keys['ShiftLeft'] || keys['ShiftRight']) ? (fps?.sprintMultiplier || 2.0) : 1.0;
    const speed = baseSpeed * sprintMultiplier * clock.getDelta();

    // 1. Extract camera forward direction
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // Lock to horizontal plane
    forward.normalize();

    // 2. Extract right direction (perpendicular to forward and global UP)
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // 3. Accumulate movement
    const moveDirection = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp']) moveDirection.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) moveDirection.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) moveDirection.add(right); // D = Right
    if (keys['KeyA'] || keys['ArrowLeft']) moveDirection.sub(right); // A = Left

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      camera.position.addScaledVector(moveDirection, speed);
    }

    // Strictly enforce eye level
    camera.position.y = fps?.eyeHeight || 1.8;
  }

  return {
    init,
    enter,
    exit,
    update,
    isFPS: () => isFPS
  };
})();
