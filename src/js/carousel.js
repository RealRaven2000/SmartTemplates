document.addEventListener("DOMContentLoaded", function () {
  const carousel = document.getElementById("brandsCarousel");
  if (!carousel) {
    return;
  }

  // Optional kill switch (platform / frame / media)
  if (window.matchMedia("(max-width: 600px)").matches) {
    return;
  }

  const items = Array.from(carousel.children);
  if (items.length === 0) {
    return;
  }

  const track = carousel.querySelector(".brands-track");

  // duplicate items for seamless scrolling
  for (const el of items) {
    el.setAttribute("target", "_blank");
    el.querySelector("img").classList.add("brands");
    track.appendChild(el.cloneNode(true));
  }

});
