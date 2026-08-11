window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

const CAMERA_ANIMATION_DURATION = 600;

WH.webgl.CameraAnimator = class {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.frameId = 0;
  }

  animateCameraTo(newCamPos, newTarget = this.controls.target.clone()) {
    cancelAnimationFrame(this.frameId);

    const startCamPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / CAMERA_ANIMATION_DURATION, 1);
      const eased = progress * progress * (3 - 2 * progress);

      this.camera.position.lerpVectors(startCamPos, newCamPos, eased);
      this.controls.target.lerpVectors(startTarget, newTarget, eased);
      this.controls.update();

      if (progress < 1) this.frameId = requestAnimationFrame(step);
    };

    this.frameId = requestAnimationFrame(step);
  }

  snapTo(pos, target) {
    this.cancel();
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.update();
  }

  focusOnBounds(box, paddingFactor, minDistance) {
    if (!box || box.isEmpty()) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);

    let cameraDistance = (maxDim / (2 * Math.tan(fovRad / 2))) * paddingFactor;
    cameraDistance = Math.max(cameraDistance, minDistance);

    const offset = new THREE.Vector3(cameraDistance * 0.5, cameraDistance * 0.7, cameraDistance * 0.8);
    this.animateCameraTo(new THREE.Vector3().addVectors(center, offset), center);
  }

  cancel() {
    cancelAnimationFrame(this.frameId);
  }
};