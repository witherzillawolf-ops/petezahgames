import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mappings = null;
let reverseMappings = null;

const OBFUSCATE_KEYWORDS = [
  'games',
  'game',
  'proxy',
  'proxies',
  'petezah',
  'scramjet',
  'ultraviolet',
  'unblocked',
  'unblocker',
  'bypass',
  'unblock',
  'filter',
  'gaming',
  'play',
  'arcade'
];

const OBFUSCATE_FILES = [
  'index.html',
  'search.html',
  'iframe.html',
  'newpage.html'
];

function loadMappings(publicPath) {
  try {
    const mappingsPath = path.join(__dirname, publicPath, 'plusjakartasans-obf-mappings.json');
    const reversePath = path.join(__dirname, publicPath, 'plusjakartasans-obf-reverse-mappings.json');
    
    if (fs.existsSync(mappingsPath) && fs.existsSync(reversePath)) {
      mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      reverseMappings = JSON.parse(fs.readFileSync(reversePath, 'utf8'));
      return true;
    }
  } catch (err) {
    console.error('[FONT OBFUSCATION] Failed to load mappings:', err.message);
  }
  return false;
}

export function obfuscateText(text) {
  if (!mappings) return text;
  return text.split('').map(char => mappings[char] || char).join('');
}

export function deobfuscateText(text) {
  if (!reverseMappings) return text;
  return text.split('').map(char => reverseMappings[char] || char).join('');
}

function shouldObfuscateText(text) {
  const lowerText = text.toLowerCase();
  return OBFUSCATE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export function shouldObfuscateFile(filePath) {
  const fileName = path.basename(filePath);
  
  if (filePath.includes('/pages/other/interpreter/')) {
    return false;
  }
  
  if (OBFUSCATE_FILES.includes(fileName)) {
    return true;
  }
  
  if (filePath.includes('/pages/') && filePath.endsWith('.html')) {
    return true;
  }
  
  return false;
}

export function obfuscateHtmlKeywords(html) {
  if (!mappings) return html;

  return html.replace(/>([^<]+)</g, (match, text) => {
    if (!text.trim() || /^[\s\n\r]*$/.test(text)) return match;
    if (text.includes('=') || text.includes('{') || text.includes('}')) return match;
    if (text.startsWith('http') || text.startsWith('/')) return match;
    if (/^[0-9\s\-:,\.]+$/.test(text)) return match;
    if (!shouldObfuscateText(text)) return match;
    
    return `>${obfuscateText(text)}<`;
  }).replace(/\s(title|placeholder|alt)="([^"]*)"/g, (match, attr, value) => {
    if (!shouldObfuscateText(value)) return match;
    return ` ${attr}="${obfuscateText(value)}"`;
  });
}

export function setupFontObfuscation(app, publicPath = 'public') {
  loadMappings(publicPath);
  
  app.get('/plusjakartasans-obf-mappings.json', (req, res) => {
    const filePath = path.join(__dirname, publicPath, 'plusjakartasans-obf-mappings.json');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Mappings not found' });
    }
  });
  
  app.get('/plusjakartasans-obf-reverse-mappings.json', (req, res) => {
    const filePath = path.join(__dirname, publicPath, 'plusjakartasans-obf-reverse-mappings.json');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Reverse mappings not found' });
    }
  });
  
  const fontsPath = path.join(__dirname, publicPath, 'fonts');
  if (fs.existsSync(fontsPath)) {
    app.use('/fonts', express.static(fontsPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('.woff') || path.endsWith('.woff2')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      }
    }));
  }
  
  console.log('[FONT OBFUSCATION] Middleware loaded');
}

export default setupFontObfuscation;