const axios = require('axios');
const FormData = require('form-data');

/**
 * Controller: generateImage
 * - Expects JSON: { prompt: string, style?: string, ratio?: string }
 * - Reads CLIPDROP_API_KEY from process.env
 * - Calls ClipDrop Text-to-Image API and returns a base64 data URL
 */
async function generateImage(req, res) {
  try {
    const { prompt, style, ratio } = req.body || {};
    const API_KEY = process.env.CLIPDROP_API_KEY;
    if (!API_KEY) {
      return res.status(400).json({ error: 'Missing CLIPDROP_API_KEY. Set it in backend/.env' });
    }
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Content filtering for inappropriate prompts
    const bannedTerms = [
      // Explicit terms
      'kissing', 'nude', 'naked', 'sex', 'sexual', 'porn', 'pornographic', 
      'explicit', 'nsfw', 'xxx', 'adult', 'hentai', 'erotic', 
      'intimate', 'making out', 'intercourse',
      
      // Anime character specific inappropriate terms
      'naruto kissing', 'sasuke kissing', 'anime characters kissing',
      'anime kiss', 'anime romance', 'anime couple', 'anime love scene',
      
      // Additional terms
      'inappropriate', 'obscene', 'lewd', 'indecent', 'offensive',
      'vulgar', 'profane', 'suggestive', 'revealing'
    ];
    
    const promptLower = prompt.toLowerCase();
    for (const term of bannedTerms) {
      if (promptLower.includes(term)) {
        console.log(`Content policy violation detected: "${prompt}" contains banned term: ${term}`);
        return res.status(403).json({ 
          error: 'Your prompt contains inappropriate content that violates our content policy.', 
          filtered: true 
        });
      }
    }

    // NOTE: ClipDrop text-to-image API currently expects only a 'prompt' field
    // and returns a 1024x1024 PNG image. Custom size/aspect ratio parameters are
    // not part of the public docs for this endpoint as of now. We'll keep style/ratio
    // in the payload comments for future extension but only send 'prompt' to the API.

    // Build multipart/form-data body
    const form = new FormData();
    form.append('prompt', prompt);

    // Endpoint per official docs
    const url = 'https://clipdrop-api.co/text-to-image/v1';

    const resp = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'x-api-key': API_KEY,
      },
      // API returns PNG bytes on success
      responseType: 'arraybuffer',
      validateStatus: () => true, // handle non-2xx ourselves
      timeout: 30000, // 30 second timeout
      timeoutErrorMessage: 'Request to ClipDrop API timed out after 30 seconds'
    });

    const contentType = resp.headers['content-type'] || '';
    if (resp.status >= 200 && resp.status < 300 && contentType.includes('image/')) {
      const base64 = Buffer.from(resp.data).toString('base64');
      // Return image as data URL for easy rendering and localStorage saving on frontend
      return res.json({ imageDataUrl: `data:image/png;base64,${base64}` });
    }

    // Error case: ClipDrop returns JSON with error details
    try {
      const errorJson = JSON.parse(Buffer.from(resp.data).toString('utf8'));
      return res.status(resp.status || 500).json({ error: errorJson.error || 'ClipDrop error' });
    } catch {
      return res.status(resp.status || 500).json({ error: 'Unexpected API response from ClipDrop' });
    }
  } catch (err) {
    // Check if it's a timeout error
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      console.error('ClipDrop API timeout error:', err.message);
      return res.status(504).json({ error: 'Request to image generation service timed out. Please try again.' });
    }
    
    // Network or connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('ClipDrop API connection error:', err.message);
      return res.status(503).json({ error: 'Unable to connect to image generation service. Please try again later.' });
    }
    
    // Log the detailed error for debugging
    console.error('ClipDrop error:', err.message, err.code);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    
    return res.status(500).json({ error: 'Failed to generate image. Please try again later.' });
  }
}

function ratioToSize(ratio) {
  switch(ratio){
    case '16:9': return { width: 1280, height: 720 };
    case '9:16': return { width: 720, height: 1280 };
    case '4:3':  return { width: 1200, height: 900 };
    case '3:4':  return { width: 900, height: 1200 };
    default: return { width: 1024, height: 1024 };
  }
}

module.exports = { generateImage };
