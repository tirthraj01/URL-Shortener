const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse incoming JSON data
app.use(express.json());

// In-memory storage for our URLs
const urlDatabase = {};
let urlHistory = []; // Changed to 'let' so we can reassign/clear it

// Generates a random 6-character string
function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// BACKEND: Route to shorten a URL
app.post('/api/shorten', (req, res) => {
  const { longUrl } = req.body;
  if (!longUrl) return res.status(400).json({ error: 'URL required' });

  let shortCode = generateShortCode();
  while (urlDatabase[shortCode]) {
    shortCode = generateShortCode();
  }

  urlDatabase[shortCode] = longUrl;
  
  const newEntry = { shortCode, longUrl };
  urlHistory.unshift(newEntry);

  res.json(newEntry);
});

// BACKEND: Route to get history
app.get('/api/history', (req, res) => {
  res.json(urlHistory);
});

// BACKEND: Route to clear history
app.delete('/api/history', (req, res) => {
  urlHistory = []; // Clear the array in memory
  res.json({ message: 'History cleared successfully' });
});

// BACKEND: Route to handle redirects
app.get('/:code', (req, res, next) => {
  const { code } = req.params;
  if (code === 'api') return next();

  const longUrl = urlDatabase[code];
  if (longUrl) {
    res.redirect(longUrl);
  } else {
    res.status(404).send('<h2>404 - Link not found</h2>');
  }
});

// FRONTEND: Serve the React app
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modern URL Shortener</title>
  
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
  
  <style>
    :root {
      --aqua: #00FFFF;
      --azure: #F0FFFF;
      --baby-blue: #89CFF0;
      --bright-blue: #0096FF;
      --cornflower-blue: #6495ED;
      --periwinkle: #CCCCFF;
      --sky-blue: #87CEEB;
      --white: #FFFFFF;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      /* Smooth animated gradient background */
      background: linear-gradient(135deg, var(--sky-blue), var(--periwinkle), var(--baby-blue), var(--azure));
      background-size: 300% 300%;
      animation: gradientBg 10s ease infinite;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #444;
    }

    @keyframes gradientBg {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Glassmorphism Container */
    .app-container {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      width: 90%;
      max-width: 550px;
      padding: 3rem;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 20px 40px rgba(100, 149, 237, 0.2);
      text-align: center;
      transform: translateY(0);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .app-container:hover {
      box-shadow: 0 25px 50px rgba(100, 149, 237, 0.3);
    }

    h1 { 
      color: var(--bright-blue); 
      margin-top: 0;
      margin-bottom: 2rem;
      font-size: 2.2rem;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 10px rgba(0, 150, 255, 0.2);
    }

    /* Input Form styling */
    .url-form { 
      display: flex; 
      gap: 12px; 
      margin-bottom: 2.5rem; 
    }

    .url-form input {
      flex: 1; 
      padding: 14px 20px; 
      border: 2px solid transparent;
      background-color: var(--azure);
      border-radius: 14px; 
      outline: none; 
      font-size: 1.05rem;
      transition: all 0.3s ease;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }

    .url-form input:focus { 
      border-color: var(--baby-blue); 
      background-color: var(--white);
      box-shadow: 0 0 0 4px rgba(137, 207, 240, 0.2);
    }

    .url-form button {
      padding: 0 24px; 
      border: none; 
      border-radius: 14px;
      background: linear-gradient(135deg, var(--bright-blue), var(--cornflower-blue));
      color: var(--white);
      font-size: 1.05rem;
      font-weight: 600; 
      cursor: pointer; 
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 150, 255, 0.3);
    }

    .url-form button:hover { 
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 150, 255, 0.4);
    }

    .url-form button:active {
      transform: translateY(1px);
    }

    /* History List Styling */
    .url-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--periwinkle); 
      padding-bottom: 12px; 
      margin-bottom: 1.5rem;
    }

    .url-list-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--cornflower-blue);
    }

    /* New Clear History Button */
    .clear-btn {
      background: transparent;
      border: 2px solid var(--periwinkle);
      color: var(--cornflower-blue);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .clear-btn:hover {
      background: var(--periwinkle);
      color: var(--white);
    }

    .url-card {
      background-color: rgba(255, 255, 255, 0.6); 
      border: 1px solid var(--azure);
      border-radius: 16px; 
      padding: 1.2rem; 
      margin-bottom: 1rem;
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      text-align: left;
      transition: all 0.3s ease;
      animation: slideUp 0.4s ease forwards;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .url-card:hover {
      background-color: var(--white);
      border-color: var(--baby-blue);
      box-shadow: 0 8px 24px rgba(137, 207, 240, 0.25);
      transform: translateY(-3px);
    }

    .url-details { 
      overflow: hidden; 
      flex: 1; 
      padding-right: 15px; 
    }

    .long-url { 
      font-size: 0.85rem; 
      color: #888; 
      white-space: nowrap; 
      overflow: hidden; 
      text-overflow: ellipsis; 
      margin: 0 0 6px 0; 
    }

    .short-url { 
      font-weight: 700; 
      font-size: 1.1rem;
      color: var(--bright-blue); 
      text-decoration: none; 
      transition: color 0.2s ease;
    }

    .short-url:hover { 
      color: var(--aqua); 
      text-decoration: underline;
    }
    
    .copy-btn {
      background-color: var(--baby-blue); 
      color: var(--white);
      border: none; 
      padding: 10px 16px; 
      border-radius: 10px; 
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .copy-btn:hover { 
      background-color: var(--sky-blue); 
      transform: scale(1.05);
    }
    
    .copy-btn:active {
      transform: scale(0.95);
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;

    // --- Component: Input Form ---
    function UrlForm({ onAddUrl }) {
      const [longUrl, setLongUrl] = useState('');

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!longUrl) return;

        const res = await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ longUrl })
        });
        const data = await res.json();
        
        onAddUrl(data);
        setLongUrl('');
      };

      return (
        <form onSubmit={handleSubmit} className="url-form">
          <input 
            type="url" 
            placeholder="Paste your long URL here..." 
            value={longUrl} 
            onChange={e => setLongUrl(e.target.value)} 
            required 
          />
          <button type="submit">Shorten</button>
        </form>
      );
    }

    // --- Component: History List ---
    function UrlList({ urls, onClearUrls }) {
      const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url);
        // Simple visual feedback could go here
      };

      if (urls.length === 0) return null;

      return (
        <div>
          <div className="url-list-header">
            <div className="url-list-title">Recent Links</div>
            <button className="clear-btn" onClick={onClearUrls}>
              Clear History
            </button>
          </div>
          
          {urls.map((item, i) => {
            // Using standard string concatenation to avoid backtick conflicts
            const shortLink = window.location.origin + '/' + item.shortCode;
            const displayLink = window.location.host + '/' + item.shortCode;
            
            return (
              <div key={item.shortCode + i} className="url-card">
                <div className="url-details">
                  <p className="long-url">{item.longUrl}</p>
                  <a href={shortLink} target="_blank" className="short-url">
                    {displayLink}
                  </a>
                </div>
                <button className="copy-btn" onClick={() => copyToClipboard(shortLink)}>
                  Copy
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    // --- Component: Main App ---
    function App() {
      const [urls, setUrls] = useState([]);

      // Load history on mount
      useEffect(() => {
        fetch('/api/history')
          .then(res => res.json())
          .then(data => setUrls(data));
      }, []);

      // Add new link to state
      const handleAddUrl = (newUrl) => {
        setUrls([newUrl, ...urls]);
      };

      // Call backend to delete history, then clear state
      const handleClearUrls = async () => {
        await fetch('/api/history', { method: 'DELETE' });
        setUrls([]);
      };

      return (
        <div className="app-container">
          <h1>URL Shortener</h1>
          <UrlForm onAddUrl={handleAddUrl} />
          <UrlList urls={urls} onClearUrls={handleClearUrls} />
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
  `);
});

// Using standard quotes here to ensure no formatting errors on your end!
app.listen(PORT, () => {
  console.log('✅ Server running on http://localhost:' + PORT);
});