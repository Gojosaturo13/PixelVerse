/* Pixel Bloom React (CDN + Babel) single-file app */
const { useState, useEffect, useMemo, useRef } = React;

function Logo({ size = 28 }) {
  return (
    <img src="./assets/svg/logo.svg" alt="Pixel Bloom" width={size} height={size} />
  );
}

function Navbar({ onGoDashboard, theme, onToggleTheme, route, onSetRoute }) {
  // Function to handle navigation to different routes
  const handleNavigation = (e, targetRoute) => {
    e.preventDefault();
    onSetRoute(targetRoute);
    window.scrollTo({top:0, behavior:'smooth'});
  };

  return (
    <div className="navbar">
      <div className="container nav-inner">
        <a href="#" className="brand" onClick={(e)=>{e.preventDefault(); onSetRoute('home'); window.scrollTo({top:0, behavior:'smooth'});}}>
          <Logo />
          <strong>Pixel Bloom</strong>
        </a>
        <div className="nav-menu">
          <a href="#" className={`nav-link ${route === 'home' ? 'active' : ''}`} onClick={(e) => handleNavigation(e, 'home')}>Home</a>
          <a href="#" className={`nav-link ${route === 'dashboard' ? 'active' : ''}`} onClick={(e) => handleNavigation(e, 'dashboard')}>Dashboard</a>
          <a href="#" className={`nav-link ${route === 'gallery' ? 'active' : ''}`} onClick={(e) => handleNavigation(e, 'gallery')}>Gallery</a>
          <a href="#" className={`nav-link ${route === 'about' ? 'active' : ''}`} onClick={(e) => handleNavigation(e, 'about')}>About</a>
          <a href="#" className={`nav-link ${route === 'contact' ? 'active' : ''}`} onClick={(e) => handleNavigation(e, 'contact')}>Contact</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={onToggleTheme}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</button>
          {route !== 'dashboard' && <button className="btn btn-primary" onClick={onGoDashboard}>Generate Image</button>}
        </div>
      </div>
    </div>
  );
}

function Hero({ onGetStarted }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Sample showcase images
  const showcaseImages = [
    { url: './assets/showcase/image1.jpg', alt: 'AI generated landscape', style: 'fantasy' },
    { url: './assets/showcase/image2.jpg', alt: 'AI portrait artwork', style: 'portrait' },
    { url: './assets/showcase/image3.jpg', alt: 'Abstract AI art', style: 'abstract' },
    { url: './assets/showcase/image4.jpg', alt: 'Sci-fi cityscape', style: 'sci-fi' }
  ];
  
  // Fallback images if the showcase images don't exist
  const fallbackColors = [
    'linear-gradient(135deg, #7c3aed, #22d3ee)',
    'linear-gradient(135deg, #22d3ee, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #10b981, #3b82f6)'
  ];
  
  // Auto-rotate images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % showcaseImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-card">
          <h1 className="h1">Unleash Your Creativity with AI Images</h1>
          <p className="sub">Pixel Bloom helps you create stunning visuals in seconds. Describe your dream image and let AI do the magic. Premium design, smooth experience.</p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={onGetStarted}>Generate Image</button>
            <button className="btn" onClick={onGetStarted}>Try Now</button>
          </div>
        </div>
        <div className="preview-card">
          <div className="showcase-container">
            <div className="showcase-main">
              <div 
                className="showcase-image" 
                style={{
                  backgroundImage: `url(${showcaseImages[activeIndex].url}), ${fallbackColors[activeIndex % fallbackColors.length]}`
                }}
              >
                <div className="showcase-overlay">
                  <span className="showcase-label">{showcaseImages[activeIndex].style}</span>
                </div>
              </div>
            </div>
            <div className="showcase-thumbnails">
              {showcaseImages.map((image, i) => (
                <div 
                  key={i} 
                  className={`showcase-thumbnail ${i === activeIndex ? 'active' : ''}`}
                  style={{
                    backgroundImage: `url(${image.url}), ${fallbackColors[i % fallbackColors.length]}`
                  }}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
            <div className="showcase-info">
              <div className="showcase-dots">
                {showcaseImages.map((_, i) => (
                  <span 
                    key={i} 
                    className={`showcase-dot ${i === activeIndex ? 'active' : ''}`}
                    onClick={() => setActiveIndex(i)}
                  />
                ))}
              </div>
              <div className="showcase-text">
                <p>Click to explore different styles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <strong>{title}</strong>
        <div>{right}</div>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

function useLocalStorage(key, initial) {
  // Persist a state value in localStorage, reading on mount and writing on change
  const [state, set] = useState(()=>{
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(()=>{ 
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {} 
  }, [key, state]);
  return [state, set];
}

function Generator({ onAddImage }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Photorealistic");
  const [ratio, setRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    // Call backend API (never expose API key on frontend). If backend is unreachable, fall back to a placeholder image.
    if(!prompt.trim()) return;
    setLoading(true);
    try {
      const endpoints = ['/api/generate-image', 'http://localhost:5000/api/generate-image'];
      let data = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, style, ratio }) });
          if (res.ok) { data = await res.json(); break; }
        } catch {}
      }
      if (data && data.imageDataUrl) {
        onAddImage({ 
          prompt: prompt.trim(), 
          imageDataUrl: data.imageDataUrl, 
          timestamp: Date.now(),
          style,
          ratio
        });
      } else {
        throw new Error('Backend not available');
      }
    } catch (e) {
      // Placeholder is used only if backend fails (dev/demo experience)
      const placeholder = await createPlaceholder(prompt, style, ratio);
      onAddImage({ 
        prompt: prompt.trim(), 
        imageDataUrl: placeholder, 
        timestamp: Date.now(),
        style,
        ratio,
        mock: true 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Image Generator" right={<span className="badge">ClipDrop-powered</span>}>
      <div className="controls">
        <input className="input" placeholder="Describe your dream image…" value={prompt} onChange={e=>setPrompt(e.target.value)} />
        <select className="select" value={style} onChange={e=>setStyle(e.target.value)}>
          {["Photorealistic","Digital Art","Anime","3D Render","Cinematic","Cyberpunk","Watercolor"].map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" value={ratio} onChange={e=>setRatio(e.target.value)}>
          {['1:1','16:9','9:16','4:3','3:4'].map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>{loading ? 'Generating…' : 'Generate'}</button>
      </div>
      {loading && <div style={{marginTop:12}} className="skeleton panel" aria-hidden="true"><div style={{height:180}}/></div>}
    </Panel>
  );
}

function History({ history, onDownload, onRemove, onClearAll }) {
  if (history.length === 0) {
    return (
      <Panel title="Recent Generations" right={<span className="badge">0 items</span>}>
        <div className="empty-state">
          <p className="sub">No history yet. Start generating images!</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Recent Generations" right={
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span className="badge">{history.length} items</span>
        <button className="btn btn-ghost" onClick={onClearAll} style={{ fontSize: '12px', padding: '4px 8px' }}>Clear All</button>
      </div>
    }>
      <div className="history-grid">
        {history.map((item, idx) => (
          <div className="history-card" key={item.timestamp + idx}>
            <div className="history-image">
              <img src={item.imageDataUrl} alt={item.prompt} />
            </div>
            <div className="history-content">
              <p className="history-prompt">{item.prompt}</p>
              <div className="history-meta">
                <span className="badge">{item.style} • {item.ratio}</span>
                <span className="timestamp">{formatTimestamp(item.timestamp)}</span>
              </div>
              <div className="history-actions">
                <button className="btn btn-ghost" onClick={() => onDownload(item)}>Download</button>
                <button className="btn btn-ghost btn-danger" onClick={() => onRemove(item.timestamp)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function IntroAnimation({ onComplete }) {
  const [stage, setStage] = useState('loading'); // 'loading' -> 'fadeout' -> 'complete'
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage('fadeout'), 2000);
    const timer2 = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 2800);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (stage === 'complete') return null;

  return (
    <div className={`intro-overlay ${stage}`}>
      <div className="intro-content">
        <div className="intro-logo">
          <Logo size={64} />
        </div>
        <h1 className="intro-title">Pixel Bloom</h1>
        <div className="intro-subtitle">AI Image Generation</div>
        <div className="intro-waves">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return <div className="footer">© {new Date().getFullYear()} Pixel Bloom • Crafted with creativity</div>;
}

// StatsPanel component with glassmorphism and neon glow effects
function StatsPanel() {
  // Dummy stats data - in a real app, this would come from an API or context
  const [stats, setStats] = useState({
    totalGenerations: 1289,
    usersOnline: 42,
    systemUptime: '99.8%'
  });

  // Simulate changing stats for animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        totalGenerations: prev.totalGenerations + Math.floor(Math.random() * 3),
        usersOnline: Math.max(10, prev.usersOnline + Math.floor(Math.random() * 5) - 2),
        systemUptime: '99.' + (Math.floor(Math.random() * 3) + 7) + '%'
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Panel title="Live System Stats" right={<span className="badge">Real-time</span>}>
      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-icon generations-icon">🖼️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalGenerations.toLocaleString()}</div>
            <div className="stat-label">Total Generations</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon users-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.usersOnline}</div>
            <div className="stat-label">Users Online</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon uptime-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{stats.systemUptime}</div>
            <div className="stat-label">System Uptime</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function App() {
  // Persisted UI state: route and theme; history is stored in localStorage (kept across refresh until cleared)
  const [route, setRoute] = useState('home');
  const [showIntro, setShowIntro] = useState(true);
  const [history, setHistory] = useLocalStorage('pixelbloom.history', []);
  const [theme, setTheme] = useLocalStorage('pixelbloom.theme', 'dark');
  const cursorRef = useRef(null);
  
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);
  
  // Cursor trail effect implementation
  useEffect(() => {
    if (!cursorRef.current) {
      cursorRef.current = document.createElement('div');
      cursorRef.current.className = 'cursor-trail';
      document.body.appendChild(cursorRef.current);
    }
    
    const particles = [];
    const particleCount = 15; // Number of particles in the trail
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'cursor-particle';
      cursorRef.current.appendChild(particle);
      particles.push({
        element: particle,
        x: 0,
        y: 0,
        size: Math.random() * 5 + 3, // Random size between 3-8px
        color: i % 2 === 0 ? 'var(--primary)' : 'var(--accent)', // Alternate colors
        speed: 0.15 - (i * 0.01) // Different speeds for trailing effect
      });
    }
    
    let mouseX = 0;
    let mouseY = 0;
    
    // Update mouse position on move
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    // Animation loop for the particles
    const animateParticles = () => {
      particles.forEach((particle, index) => {
        // Calculate new position with easing
        particle.x += (mouseX - particle.x) * particle.speed;
        particle.y += (mouseY - particle.y) * particle.speed;
        
        // Apply styles
        particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px)`;
        particle.element.style.width = `${particle.size}px`;
        particle.element.style.height = `${particle.size}px`;
        particle.element.style.backgroundColor = particle.color;
        particle.element.style.opacity = 1 - (index / particleCount);
      });
      
      requestAnimationFrame(animateParticles);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    const animationId = requestAnimationFrame(animateParticles);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      if (cursorRef.current) {
        document.body.removeChild(cursorRef.current);
        cursorRef.current = null;
      }
    };
  }, []);

  function addToHistory(item) {
    // Keep only the latest 20 items to maintain performance and storage footprint
    const newHistory = [item, ...history].slice(0, 20);
    setHistory(newHistory);
  }

  function handleDownload(item) {
    // Client-side download of the imageDataUrl
    const a = document.createElement('a');
    a.href = item.imageDataUrl;
    a.download = `pixel-bloom-${item.timestamp}.png`;
    a.click();
  }

  function handleRemove(timestamp) {
    // Remove a single entry by its timestamp id
    setHistory(history.filter(item => item.timestamp !== timestamp));
  }

  function handleClearAll() {
    // Clear all saved generations from localStorage-backed state
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  }

  async function handleRegenerate(item) {
    const endpoints = ['/api/generate-image', 'http://localhost:5000/api/generate-image'];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ prompt: item.prompt, style: item.style, ratio: item.ratio }) 
        });
        if (res.ok) { 
          const data = await res.json(); 
          addToHistory({ 
            prompt: item.prompt,
            imageDataUrl: data.imageDataUrl,
            timestamp: Date.now(),
            style: item.style,
            ratio: item.ratio
          }); 
          return; 
        }
      } catch {}
    }
    const ph = await createPlaceholder(item.prompt, item.style, item.ratio);
    addToHistory({ 
      prompt: item.prompt,
      imageDataUrl: ph,
      timestamp: Date.now(),
      style: item.style,
      ratio: item.ratio,
      mock: true 
    });
  }

  return (
    <>
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      <div className={showIntro ? 'app-hidden' : 'app-visible'}>
        <Navbar 
          onGoDashboard={() => setRoute('dashboard')} 
          theme={theme} 
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          route={route}
          onSetRoute={setRoute}
        />
        {route === 'home' && <>
          <Hero onGetStarted={() => setRoute('dashboard')} />
          <section className="section container">
            <Panel title="Why Pixel Bloom?" right={<span className="badge">Modern • Smooth • Powerful</span>}>
              <ul>
                <li>Premium, Leonardo.ai-inspired UI with delightful animations.</li>
                <li>Fast image generation pipeline powered by ClipDrop API.</li>
                <li>Responsive, accessible, and scalable for SaaS.</li>
                <li>Local history storage keeps your creations safe.</li>
              </ul>
            </Panel>
          </section>
        </>}
        {route === 'dashboard' && <section className="section container">
          <div className="dashboard-layout">
            <div className="dashboard-main">
              <Generator onAddImage={addToHistory} />
              <div style={{ height: 24 }} />
              <History 
                history={history} 
                onDownload={handleDownload} 
                onRemove={handleRemove}
                onClearAll={handleClearAll}
              />
            </div>
            <div className="dashboard-sidebar">
              <StatsPanel />
            </div>
          </div>
        </section>}
        {route === 'gallery' && <section className="section container">
          <Panel title="Image Gallery" right={<span className="badge">Recent Creations</span>}>
            {history.length === 0 ? (
              <div className="empty-state">
                <p className="sub">No images yet. Start generating images in the Dashboard!</p>
                <button className="btn btn-primary" onClick={() => setRoute('dashboard')} style={{marginTop: '16px'}}>Go to Dashboard</button>
              </div>
            ) : (
              <>
                <div className="gallery-header">
                  <p className="gallery-intro">Browse your recently generated images:</p>
                  <button className="btn btn-primary" onClick={() => setRoute('dashboard')}>Create New Image</button>
                </div>
                <div className="gallery-grid">
                  {history.map((item, idx) => (
                    <div className="gallery-card" key={item.timestamp + idx}>
                      <div className="gallery-image">
                        <img src={item.imageDataUrl} alt={item.prompt} />
                      </div>
                      <div className="gallery-overlay">
                        <p className="gallery-prompt">{item.prompt}</p>
                        <div className="gallery-meta">
                          <span className="badge">{item.style} • {item.ratio}</span>
                          <span className="timestamp">{formatTimestamp(item.timestamp)}</span>
                        </div>
                        <div className="gallery-actions">
                          <button className="btn btn-ghost" onClick={() => handleDownload(item)}>Download</button>
                          <button className="btn btn-primary" onClick={() => handleRegenerate(item)}>Regenerate</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>
        </section>}
        {route === 'about' && <section className="section container">
          <Panel title="About Pixel Bloom" right={<span className="badge">Our Story</span>}>
            <div style={{ padding: "20px 0" }}>
              <h3>Our Mission</h3>
              <p>Pixel Bloom is dedicated to making AI image generation accessible to everyone. Our platform combines cutting-edge AI technology with an intuitive user interface to help you bring your creative visions to life.</p>
              
              <h3>How It Works</h3>
              <p>Simply describe your dream image, select a style and aspect ratio, and let our AI do the rest. Powered by the ClipDrop API, Pixel Bloom transforms your text prompts into stunning visuals in seconds.</p>
              
              <h3>Get In Touch</h3>
              <p>Have questions or feedback? We'd love to hear from you! Visit our Contact page to get in touch with our team.</p>
            </div>
          </Panel>
        </section>}
        {route === 'contact' && <section className="section container">
          <Panel title="Contact Us" right={<span className="badge">Get In Touch</span>}>
            <div className="contact-container">
              <div className="contact-info">
                <h3>We'd Love To Hear From You</h3>
                <p>Have questions about Pixel Bloom? Want to share your feedback or report an issue? Our team is here to help!</p>
                
                <div className="contact-method">
                  <h4>Email Us</h4>
                  <p className="contact-email">gop699191@gmail.com</p>
                  <button className="btn btn-primary" onClick={() => {
                    window.location.href = 'mailto:gop699191@gmail.com';
                  }}>Send Email</button>
                </div>
                
                <div className="contact-method">
                  <h4>Follow Us</h4>
                  <p>Stay updated with our latest features and announcements on social media.</p>
                  <div className="social-links">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">Twitter</a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">Instagram</a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn</a>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </section>}
        <Footer />
      </div>
    </>
  );
}

// Utilities
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

async function createPlaceholder(prompt, style, ratio) {
  // Create a simple gradient card with overlay text as a data URL
  const [w, h] = ratioToSize(ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, '#7c3aed');
  g.addColorStop(1, '#22d3ee');
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

  // Overlay
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0,0,w,h);

  ctx.fillStyle = 'white';
  ctx.font = `${Math.max(20, Math.floor(w/24))}px Inter, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, `${style}`, w/2, h/2 - 24, w*0.82, Math.max(24, Math.floor(w/28)));
  ctx.font = `${Math.max(16, Math.floor(w/30))}px Inter, Arial`;
  wrapText(ctx, prompt || 'Your prompt will appear here', w/2, h/2 + 20, w*0.82, Math.max(22, Math.floor(w/32)));

  return canvas.toDataURL('image/png');
}

function ratioToSize(ratio) {
  switch(ratio){
    case '16:9': return [1280, 720];
    case '9:16': return [720, 1280];
    case '4:3':  return [1200, 900];
    case '3:4':  return [900, 1200];
    default: return [1024, 1024];
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let testY = y;
  
  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, testY);
      line = words[n] + ' ';
      testY += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, testY);
}

ReactDOM.render(<App />, document.getElementById('root'));
