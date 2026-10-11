/* ============================================================
   MotionForge AI — user configuration
   Edit this file once before deploying. Nothing else needs editing.
   ============================================================ */
window.MF_CONFIG = {
  site: {
    name: 'MotionForge AI',
    tagline: 'Turn ideas into cinematic motion.',
    url: 'https://your-domain.com',       // used for canonical + og:url
    supportEmail: 'hello@your-domain.com',
    contactPhone: '',                     // optional, shown in footer
  },
  brand: {
    primary: '#ff8a3d',
    secondary: '#8b6dff',
  },
  analytics: {
    scriptUrl: '',                        // e.g. 'https://plausible.io/js/script.js'
    domain: '',                           // e.g. 'your-domain.com'
  },
  ai: {
    defaultProvider: 'local',             // 'local' | 'groq' | 'gemini' | 'openrouter'
    allowLocalFallback: true,
  },
  payments: {
    provider: 'lemonsqueezy',             // 'lemonsqueezy' | 'gumroad' | 'stripe' | 'custom'
    successUrl: 'checkout-success.html',
    cancelUrl: 'checkout-cancel.html',
    plans: {
      starter: {
        name: 'Starter',
        price: '$0',
        cadence: 'forever free',
        features: ['3 projects', 'Browser renderer', 'WebM export', 'Deterministic engine'],
        checkoutUrl: '',                  // leave empty — starter is free, "Start creating" goes to app
      },
      studio: {
        name: 'Studio',
        price: '$9',
        cadence: 'per month',
        features: ['Unlimited projects', 'AI brief + storyboard', 'HD export', 'Brand kits', 'Cloud project backup'],
        checkoutUrl: '',                  // paste your LemonSqueezy / Gumroad / Stripe URL here
      },
      agency: {
        name: 'Agency',
        price: '$29',
        cadence: 'per month',
        features: ['Everything in Studio', 'Shared brand kits', 'Team workspaces', 'Higher export resolutions', 'Priority render queue'],
        checkoutUrl: '',
      },
    },
  },
  auth: {
    mode: 'local',                        // 'local' | 'supabase'
    supabaseUrl: '',
    supabaseAnonKey: '',
  },
};
