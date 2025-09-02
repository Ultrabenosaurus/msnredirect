// ==UserScript==
// @name         MSNRedirect
// @namespace    Violentmonkey Scripts
// @version      1.1.0
// @description  Automatically redirects MSN news articles to their original source.
// @author       pr0xim1ty
// @match        *://*.msn.com/*
// @match        *://*.yahoo.com/news/*
// @icon         https://raw.githubusercontent.com/pr0xim1ty/msnredirect/refs/heads/main/msnredirect.png
// @grant        none
// @license      MIT
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  if (!/\/ar-[A-Z0-9]+/.test(window.location.href)) {
    return;
  }

  const redirect = () => {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href && !canonical.href.includes("msn.com") && !canonical.href.includes("yahoo.com"))) { // just in case
      window.location.href = canonical.href;
      return true;
    }
    return false;
  };

  if (redirect()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (redirect()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();


