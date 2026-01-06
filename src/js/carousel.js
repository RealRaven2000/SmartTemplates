
(function () {
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

  // duplicate items for seamless scrolling
  for (const el of items) {
    carousel.appendChild(el.cloneNode(true));
  }
})();

