/* 
  globals
    Environment
*/


/******************************************************************/
/******************* Subfunctions used in: ************************/
/************************* templates.html *************************/
/************************* screenshots.html ***********************/
/************************* faq.html *******************************/
/******************************************************************/

function collapseQA(isjQuery) {
  if (!isjQuery) {return; }// we only care about the legacy jQuery-branch call

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".question").forEach((q) => {
      q.addEventListener("click", () => {
        const par = q.parentElement;
        const ans = par.querySelector(".answer");
        const img = par.querySelector("img");

        if (!ans) {return;}

        const isHidden = ans.style.display === "none" || getComputedStyle(ans).display === "none";
        ans.style.display = isHidden ? "block" : "none";

        if (img) {
          img.src = isHidden ? "/img/collapseUp.png" : "/img/collapseDown.png";
        }
      });
    });
  });
}

"use strict"; // use ECMAScript5 strict mode

/******************************************************************/
/*********************** Toggle Screenshots ***********************/
/************************* by Axel Grude **************************/
/******************************************************************/

function togglePopup(vis, backSelector, popSelector, target) {
  // mobile redirect
  if (Environment.isMobile.any()) {
    const href = target?.getAttribute("data-mobile-href");
    if (href) {
      window.location.href = href;
    }
    return;
  }

  const background = document.querySelector(backSelector);
  const popup = document.querySelector(popSelector);
  const navbar = document.querySelector("#navbarTable");

  if (!background || !popup) {
    return;
  }

  // helper: fade element using CSS opacity & transition
  function fade(el, show, duration = 300, callback) {
    el.style.transition = `opacity ${duration}ms`;
    el.style.display = "block"; // always block for transition
    requestAnimationFrame(function () {
      if (show) {
        el.style.opacity = "0.7";
      } else {
        el.style.opacity = "0.1";
      }
    });
    setTimeout(function () {
      if (!show) {
        el.style.display = "none";
      }
      if (callback) {
        callback();
      }
    }, duration);
  }

  if (vis) {
    fade(background, true, 300);
    fade(popup, true, 300);
    if (navbar) {
      navbar.style.display = "none";
    }
  } else {
    fade(background, false, 300);
    fade(popup, false, 200);
    if (navbar) {
      navbar.style.display = "block";
    }
  }
}
