/**
 * Loop Capture — Content Script
 * Detects product links and rewrites with affiliate tags
 */

interface AffiliateConfig {
  domain: string;
  paramName: string;
  tagValue: string;
  urlPattern?: RegExp;
}

// Affiliate configurations (expand as we add partners)
const AFFILIATE_CONFIGS: AffiliateConfig[] = [
  {
    domain: 'amazon.com',
    paramName: 'tag',
    tagValue: 'loopcapture-20', // Replace with real affiliate ID
    urlPattern: /amazon\.com\/.*\/dp\//
  },
  {
    domain: 'ebay.com',
    paramName: 'campid',
    tagValue: 'loop-ebay-001',
  },
  {
    domain: 'walmart.com',
    paramName: 'affiliates_ad_id',
    tagValue: 'loop-walmart-001',
  },
  {
    domain: 'bestbuy.com',
    paramName: 'irclickid',
    tagValue: 'loop-bestbuy-001',
  }
];

// Track which links we've already processed
const processedLinks = new WeakSet<HTMLAnchorElement>();

// Stats for this session
let captureStats = {
  linksProcessed: 0,
  linksRewritten: 0,
  domains: new Set<string>()
};

/**
 * Check if URL matches any affiliate config
 */
function getAffiliateConfig(url: string): AffiliateConfig | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    for (const config of AFFILIATE_CONFIGS) {
      if (hostname.includes(config.domain)) {
        if (config.urlPattern && !config.urlPattern.test(url)) {
          continue;
        }
        return config;
      }
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Rewrite URL with affiliate tag
 */
function rewriteUrl(url: string, config: AffiliateConfig): string {
  try {
    const urlObj = new URL(url);
    
    // Don't overwrite existing affiliate tags (respect other affiliates)
    if (urlObj.searchParams.has(config.paramName)) {
      return url;
    }
    
    urlObj.searchParams.set(config.paramName, config.tagValue);
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Process a single link element
 */
function processLink(link: HTMLAnchorElement): void {
  if (processedLinks.has(link)) return;
  processedLinks.add(link);
  
  const href = link.href;
  if (!href || href.startsWith('javascript:')) return;
  
  const config = getAffiliateConfig(href);
  if (!config) return;
  
  const newUrl = rewriteUrl(href, config);
  if (newUrl !== href) {
    link.href = newUrl;
    captureStats.linksRewritten++;
    captureStats.domains.add(config.domain);
    
    // Add visual indicator (subtle)
    link.dataset.loopCapture = 'true';
  }
  
  captureStats.linksProcessed++;
}

/**
 * Process all links on page
 */
function processAllLinks(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href]');
  links.forEach(processLink);
}

/**
 * Watch for dynamically added links
 */
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLAnchorElement) {
          processLink(node);
        } else if (node instanceof HTMLElement) {
          const links = node.querySelectorAll<HTMLAnchorElement>('a[href]');
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

/**
 * Handle clipboard copy (for shared links)
 */
function setupClipboardCapture(): void {
  document.addEventListener('copy', async (e) => {
    const selection = window.getSelection()?.toString() || '';
    
    // Check if selection contains a URL we can affiliate
    const urlMatch = selection.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const url = urlMatch[0];
      const config = getAffiliateConfig(url);
      
      if (config) {
        const newUrl = rewriteUrl(url, config);
        if (newUrl !== url) {
          e.preventDefault();
          const newText = selection.replace(url, newUrl);
          
          // Use clipboard API
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(newText);
            
            // Notify background script
            chrome.runtime.sendMessage({
              type: 'LINK_CAPTURED',
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

/**
 * Report stats to background script
 */
function reportStats(): void {
  chrome.runtime.sendMessage({
    type: 'CAPTURE_STATS',
    data: {
      linksProcessed: captureStats.linksProcessed,
      linksRewritten: captureStats.linksRewritten,
      domains: Array.from(captureStats.domains),
      url: window.location.href
    }
  });
}

/**
 * Initialize content script
 */
async function init(): Promise<void> {
  // Check if capture is enabled
  const result = await chrome.storage.sync.get(['captureEnabled', 'walletAddress']);
  
  if (result.captureEnabled === false) {
    console.log('[Loop] Capture disabled');
    return;
  }
  
  console.log('[Loop] Capture active');
  
  // Process existing links
  processAllLinks();
  
  // Watch for new links
  setupMutationObserver();
  
  // Capture clipboard copies
  setupClipboardCapture();
  
  // Report stats periodically
  setInterval(reportStats, 30000);
  
  // Report on page unload
  window.addEventListener('beforeunload', reportStats);
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
