"use strict";
(() => {
  // src/content.ts
  var AFFILIATE_CONFIGS = [
    {
      domain: "amazon.com",
      paramName: "tag",
      tagValue: "loopcapture-20",
      // Replace with real affiliate ID
      urlPattern: /amazon\.com\/.*\/dp\//
    },
    {
      domain: "ebay.com",
      paramName: "campid",
      tagValue: "loop-ebay-001"
    },
    {
      domain: "walmart.com",
      paramName: "affiliates_ad_id",
      tagValue: "loop-walmart-001"
    },
    {
      domain: "bestbuy.com",
      paramName: "irclickid",
      tagValue: "loop-bestbuy-001"
    }
  ];
  var processedLinks = /* @__PURE__ */ new WeakSet();
  var captureStats = {
    linksProcessed: 0,
    linksRewritten: 0,
    domains: /* @__PURE__ */ new Set()
  };
  function getAffiliateConfig(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace("www.", "");
      for (const config of AFFILIATE_CONFIGS) {
        if (hostname.includes(config.domain)) {
          if (config.urlPattern && !config.urlPattern.test(url)) {
            continue;
          }
          return config;
        }
      }
    } catch {
    }
    return null;
  }
  function rewriteUrl(url, config) {
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has(config.paramName)) {
        return url;
      }
      urlObj.searchParams.set(config.paramName, config.tagValue);
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  function processLink(link) {
    if (processedLinks.has(link))
      return;
    processedLinks.add(link);
    const href = link.href;
    if (!href || href.startsWith("javascript:"))
      return;
    const config = getAffiliateConfig(href);
    if (!config)
      return;
    const newUrl = rewriteUrl(href, config);
    if (newUrl !== href) {
      link.href = newUrl;
      captureStats.linksRewritten++;
      captureStats.domains.add(config.domain);
      link.dataset.loopCapture = "true";
    }
    captureStats.linksProcessed++;
  }
  function processAllLinks() {
    const links = document.querySelectorAll("a[href]");
    links.forEach(processLink);
  }
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLAnchorElement) {
            processLink(node);
          } else if (node instanceof HTMLElement) {
            const links = node.querySelectorAll("a[href]");
            links.forEach(processLink);
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function setupClipboardCapture() {
    document.addEventListener("copy", async (e) => {
      const selection = window.getSelection()?.toString() || "";
      const urlMatch = selection.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        const config = getAffiliateConfig(url);
        if (config) {
          const newUrl = rewriteUrl(url, config);
          if (newUrl !== url) {
            e.preventDefault();
            const newText = selection.replace(url, newUrl);
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(newText);
              chrome.runtime.sendMessage({
                type: "LINK_CAPTURED",
                data: {
                  originalUrl: url,
                  affiliateUrl: newUrl,
                  domain: config.domain,
                  timestamp: Date.now()
                }
              });
            }
          }
        }
      }
    });
  }
  function reportStats() {
    chrome.runtime.sendMessage({
      type: "CAPTURE_STATS",
      data: {
        linksProcessed: captureStats.linksProcessed,
        linksRewritten: captureStats.linksRewritten,
        domains: Array.from(captureStats.domains),
        url: window.location.href
      }
    });
  }
  async function init() {
    const result = await chrome.storage.sync.get(["captureEnabled", "walletAddress"]);
    if (result.captureEnabled === false) {
      console.log("[Loop] Capture disabled");
      return;
    }
    console.log("[Loop] Capture active");
    processAllLinks();
    setupMutationObserver();
    setupClipboardCapture();
    setInterval(reportStats, 3e4);
    window.addEventListener("beforeunload", reportStats);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
