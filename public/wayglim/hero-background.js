/* Wayglim · PART 2 of 2 · the Prism Flow background used behind the hero.
   Drop the mounted element anywhere: it fills its nearest positioned parent. */
(function () {
  var settings = { "aspectRatio": 1.777778, "background": [0.9765, 0.9765, 0.9765], "durationSeconds": 60, "maxPixelRatio": 2, "pace": 0.3, "params": { "balanceX": 0, "balanceY": 0, "bend": 48, "chromaSplit": 14, "cornerRadius": 12, "curve": "line", "curveDepth": 0, "customColors": [[1, 0.3098, 0.5451], [0.2471, 0.549, 1], [1, 0.6902, 0.2275], [0.4784, 0.3608, 1]], "effectArea": "core", "form": "path", "formRotate": 0, "formRound": 35, "formSize": 50, "formSpin": 0, "frameShape": "rect", "glow": 48, "grainAmount": 24, "grainDistortion": 50, "grainEnabled": true, "grainDrift": 35, "grainScale": 70, "grainSoftness": 50, "height": 58, "inset": 0, "lens": { "angle": 2, "bias": 1, "count": 35, "dispersion": 0, "dispersionColor": 0.46, "dispersionShift": 0.11, "enabled": false, "focusCenter": 0.8, "focusEdges": 1, "grainMixer": 0, "grainOverlay": 0, "imageX": 0, "imageY": 0, "lensBulge": 0, "lensCircle": 0, "noise": 0, "noiseFrequency": 0.25, "noiseOffset": 0, "perspective": 0.1, "spread": 0.97, "swirl": -0.14 }, "lightTravel": 80, "masks": [], "masksEnabled": true, "mode": "halo", "path": [1.06, 0.55, 1.0394, 0.5189, 1.019, 0.4876, 0.9985, 0.4564, 0.9778, 0.4255, 0.9569, 0.3952, 0.9355, 0.3659, 0.9135, 0.3382, 0.8906, 0.3127, 0.8669, 0.2897, 0.8425, 0.2693, 0.8174, 0.2516, 0.7916, 0.2374, 0.7652, 0.2275, 0.7384, 0.2221, 0.7114, 0.2212, 0.6845, 0.2243, 0.6578, 0.2308, 0.6313, 0.2399, 0.605, 0.2512, 0.579, 0.2642, 0.5533, 0.2786, 0.5278, 0.2944, 0.5026, 0.3114, 0.4775, 0.3294, 0.4528, 0.3487, 0.4285, 0.3695, 0.4046, 0.3918, 0.3812, 0.4156, 0.3581, 0.4405, 0.3353, 0.4661, 0.3126, 0.4922, 0.29, 0.5185, 0.2674, 0.5448, 0.2447, 0.5707, 0.2218, 0.5961, 0.1987, 0.6209, 0.1754, 0.6452, 0.152, 0.6691, 0.1285, 0.6928, 0.105, 0.7164, 0.0815, 0.7399, 0.0579, 0.7633, 0.0344, 0.7867, 0.0108, 0.81, -0.0128, 0.8333, -0.0364, 0.8566, -0.06, 0.88], "phase": 31, "pointer": { "color": 35, "enabled": false, "glow": 25, "grain": 50, "pull": 40, "reach": 35, "smoothing": 45 }, "position": 50, "refraction": 49, "saturation": 100, "secondaryMotion": 38, "shading": 0, "softness": 78, "spectrum": "custom", "speed": 3, "spread": 62, "surfaceGrain": true, "wobble": 42 }, "pauseOffscreen": true, "respectReducedMotion": true, "startSeconds": 1.1532 };
  // The grain noise map is optional: without it the engine falls back to a flat
  // texture and the grain still comes from its own simplex noise.
  settings.noise = "";
  var start = function (api) {
    var instances = [];
    var run = function () {
      // Drop instances whose host element left the DOM (client-side navigation).
      instances = instances.filter(function (entry) {
        if (entry.element.isConnected) return true;
        try { entry.instance.destroy(); } catch (error) { /* already gone */ }
        return false;
      });
      document.querySelectorAll('[data-wayglim="wl-16ui5k2"]:not([data-wayglim-ready])').forEach(function (element) {
        element.setAttribute("data-wayglim-ready", "");
        var instance = api.mount(element, settings);
        element.__wayglimInstance = instance;
        instances.push({ element: element, instance: instance });
      });
    };
    // Re-runnable so a client-side route back to the hero mounts a fresh canvas.
    window.WayglimMountHeroBackground = run;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
  };
  (window.WayglimQueue = window.WayglimQueue || []).push(start);
})();