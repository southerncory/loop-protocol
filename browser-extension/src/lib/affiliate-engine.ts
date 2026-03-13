/**
 * Affiliate Engine
 * 
 * Handles affiliate link injection for major retailers and platforms.
 * Each affiliate program has its own tag format and injection method.
 */

interface AffiliateProgram {
  name: string;
  domains: string[];
  tagParam: string;
  tagValue: string;
  commission: string; // Estimated commission rate
}

// Loop Protocol affiliate tags (these would be your actual affiliate IDs)
const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  // Amazon Associates
  {
    name: 'Amazon',
    domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.ca', 'amzn.to'],
    tagParam: 'tag',
    tagValue: 'loopprotocol-20',
    commission: '1-10%'
  },
  // eBay Partner Network
  {
    name: 'eBay',
    domains: ['ebay.com', 'ebay.co.uk'],
    tagParam: 'mkcid',
    tagValue: 'loop123',
    commission: '1-4%'
  },
  // Walmart
  {
    name: 'Walmart',
    domains: ['walmart.com'],
    tagParam: 'wmlspartner',
    tagValue: 'loopprotocol',
    commission: '1-4%'
  },
  // Target
  {
    name: 'Target',
    domains: ['target.com'],
    tagParam: 'afid',
    tagValue: 'loop',
    commission: '1-8%'
  },
  // Best Buy
  {
    name: 'Best Buy',
    domains: ['bestbuy.com'],
    tagParam: 'irclickid',
    tagValue: 'loopprotocol',
    commission: '0.5-7%'
  },
  // Booking.com
  {
    name: 'Booking.com',
    domains: ['booking.com'],
    tagParam: 'aid',
    tagValue: 'loop123456',
    commission: '25-40%'
  },
  // Expedia
  {
    name: 'Expedia',
    domains: ['expedia.com'],
    tagParam: 'affcid',
    tagValue: 'loopprotocol',
    commission: '2-6%'
  },
  // Nike
  {
    name: 'Nike',
    domains: ['nike.com'],
    tagParam: 'cp',
    tagValue: 'loop',
    commission: '5-11%'
  },
  // Adidas
  {
    name: 'Adidas',
    domains: ['adidas.com'],
    tagParam: 'cm_mmc',
    tagValue: 'AffLoop',
    commission: '5-7%'
  },
  // Sephora
  {
    name: 'Sephora',
    domains: ['sephora.com'],
    tagParam: 'om_mmc',
    tagValue: 'aff-loop',
    commission: '5-10%'
  },
  // Home Depot
  {
    name: 'Home Depot',
    domains: ['homedepot.com'],
    tagParam: 'cm_mmc',
    tagValue: 'aff-loop',
    commission: '2-8%'
  },
  // Lowes
  {
    name: 'Lowes',
    domains: ['lowes.com'],
    tagParam: 'cm_mmc',
    tagValue: 'loop',
    commission: '2-8%'
  },
  // Etsy
  {
    name: 'Etsy',
    domains: ['etsy.com'],
    tagParam: 'utm_source',
    tagValue: 'loopprotocol',
    commission: '4-8%'
  }
];

export class AffiliateEngine {
  private programs: Map<string, AffiliateProgram>;

  constructor() {
    this.programs = new Map();
    
    // Index programs by domain for fast lookup
    for (const program of AFFILIATE_PROGRAMS) {
      for (const domain of program.domains) {
        this.programs.set(domain, program);
      }
    }
  }

  /**
   * Check if a URL can be captured (has affiliate program)
   */
  canCapture(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      return this.programs.has(hostname) || this.findMatchingDomain(hostname) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get the affiliate program for a URL
   */
  getAffiliateProgram(url: string): string | null {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const program = this.programs.get(hostname) || this.findMatchingProgram(hostname);
      return program?.name || null;
    } catch {
      return null;
    }
  }

  /**
   * Inject affiliate tag into URL
   */
  async injectAffiliate(url: string): Promise<string> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      
      const program = this.programs.get(hostname) || this.findMatchingProgram(hostname);
      
      if (!program) {
        // No affiliate program for this domain, return original
        return url;
      }

      // Check if already has an affiliate tag (don't override)
      if (urlObj.searchParams.has(program.tagParam)) {
        console.log(`[Loop] URL already has ${program.name} affiliate tag`);
        return url;
      }

      // Add affiliate tag
      urlObj.searchParams.set(program.tagParam, program.tagValue);
      
      console.log(`[Loop] Injected ${program.name} affiliate tag (${program.commission} commission)`);
      
      return urlObj.toString();
    } catch (error) {
      console.error('[Loop] Error injecting affiliate:', error);
      return url;
    }
  }

  /**
   * Get estimated commission for a URL
   */
  getCommissionRate(url: string): string | null {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const program = this.programs.get(hostname) || this.findMatchingProgram(hostname);
      return program?.commission || null;
    } catch {
      return null;
    }
  }

  /**
   * Get all supported programs
   */
  getSupportedPrograms(): { name: string; domains: string[]; commission: string }[] {
    const seen = new Set<string>();
    const result = [];
    
    for (const program of AFFILIATE_PROGRAMS) {
      if (!seen.has(program.name)) {
        seen.add(program.name);
        result.push({
          name: program.name,
          domains: program.domains,
          commission: program.commission
        });
      }
    }
    
    return result;
  }

  /**
   * Find matching domain for subdomains
   */
  private findMatchingDomain(hostname: string): string | null {
    for (const domain of this.programs.keys()) {
      if (hostname.endsWith(domain)) {
        return domain;
      }
    }
    return null;
  }

  /**
   * Find matching program for subdomains
   */
  private findMatchingProgram(hostname: string): AffiliateProgram | null {
    for (const [domain, program] of this.programs.entries()) {
      if (hostname.endsWith(domain)) {
        return program;
      }
    }
    return null;
  }
}
