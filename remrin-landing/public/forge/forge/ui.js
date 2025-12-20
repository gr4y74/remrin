/* =========================================
   forge/ui.js - UI Enhancements
   ========================================= */

// Video Kickstart
window.addEventListener('load', function () {
    var video = document.getElementById('orb-video-bg');
    if (video) {
        video.muted = true;
        video.play().catch(e => console.log("Video autoplay failed:", e));
    }
});
