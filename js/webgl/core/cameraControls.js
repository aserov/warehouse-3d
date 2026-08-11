window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

(function() {
  const COMPASS_ANGLES_DEG = { n: 0, e: 270, s: 180, w: 90 };

  function setZoom(camera, controls, percent, minDistance, maxDistance) {
    const clamped = Math.min(100, Math.max(0, percent));
    const distance = maxDistance - (clamped / 100) * (maxDistance - minDistance);
    const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(direction, distance);
    controls.update();
  }

  function rotateToCompass(camera, controls, direction, animateCameraTo) {
    const rad = THREE.MathUtils.degToRad(COMPASS_ANGLES_DEG[direction]);
    const target = controls.target.clone();
    const currentDist = camera.position.distanceTo(target);
    const polarAngle = controls.getPolarAngle();

    const sinPolar = Math.sin(polarAngle);
    const cosPolar = Math.cos(polarAngle);

    const newX = target.x + currentDist * sinPolar * Math.sin(rad);
    const newZ = target.z + currentDist * sinPolar * Math.cos(rad);
    const newY = target.y + currentDist * cosPolar;

    animateCameraTo(new THREE.Vector3(newX, newY, newZ), target);
  }

  WH.webgl.setZoom = setZoom;
  WH.webgl.rotateToCompass = rotateToCompass;
})();