// ── ROUND DEFINITIONS ──
export const ROUNDS = [
  { id:'r1', num:1, title:'GEOLOCATION',    tag:'OSINT',     tc:'tt-osint',    pts:100,
    hint:'Each location is somewhere in the world. Look for signboards, architecture, vegetation, vehicles — anything that hints at the country or city.',
    desc:'Four Street View screenshots from different locations around the world. Identify the city for each one.',
    multi: true,
    subs: [
      { id:'r1a', pts:25, flag:'flag{chernobyl}',   label:'Location 1', img:'https://drive.google.com/thumbnail?id=13uPSkA-7gOPkEIUbDlclmYUCrTYDD3CW&sz=w1200' },
      { id:'r1b', pts:25, flag:'flag{venice}',   label:'Location 2', img:'https://drive.google.com/thumbnail?id=1M_wlI_J1sdrf2GUtkq7nXo6Bqbz5Uteh&sz=w1200' },
      { id:'r1c', pts:25, flag:'flag{cyprus}',   label:'Location 3', img:'https://drive.google.com/thumbnail?id=1ubZc015wkHBgA9Tvfd3orVdKY92hj88n&sz=w1200' },
      { id:'r1d', pts:25, flag:'flag{las vegas}',   label:'Location 4', img:'https://drive.google.com/thumbnail?id=1rxViJ0nBdEdDo6MHLbrHV-8_TMe7NMaY&sz=w1200' },
    ]
  },
  { id:'r2', num:2, title:'STEGANOGRAPHY',  tag:'STEGO',     tc:'tt-stego',    pts:100,
    flag:'flag{h4ck3r5_4r3_1n_th3_w4ll5}',
    hint:'Use stylesuxx.github.io/steganography — decode each image separately, combine the two extracted parts to form the full flag.',
    desc:'Two images have been provided. A secret message is hidden inside each one. Extract the hidden text from both images, combine them in order, and submit the complete flag.',
    images: [
      { label:'Image 1', img:'https://drive.google.com/thumbnail?id=1lsrG6IuROa44Qhd1WDh9Sf-8l9dVxeg6&sz=w1200', file:'https://drive.google.com/uc?export=download&id=1lsrG6IuROa44Qhd1WDh9Sf-8l9dVxeg6' },
      { label:'Image 2', img:'https://drive.google.com/thumbnail?id=1tuHTojYoHxzAlvTRwjL2SctH7batUrku&sz=w1200', file:'https://drive.google.com/uc?export=download&id=1tuHTojYoHxzAlvTRwjL2SctH7batUrku' },
    ]
  },
  { id:'r3', num:3, title:'METADATA HUNT',  tag:'FORENSICS', tc:'tt-forensics', pts:100,
    flag:'flag{m3t4d4t4_n3v3r_l135}',
    hint:'Use an online EXIF viewer like exifinfo.org — the flag is hiding in one of the metadata fields.',
    desc:'This image carries more than just pixels. Dig into its embedded metadata using an EXIF viewer and look carefully through all the fields to find the hidden flag.',
    file: 'https://drive.google.com/uc?export=download&id=1QAbt4aYkzP5KEAeD_Afqri6hrS0SkXrX',
    img: 'https://drive.google.com/thumbnail?id=1QAbt4aYkzP5KEAeD_Afqri6hrS0SkXrX&sz=w1200'
  },
  { id:'r4', num:4, title:'CIPHER DECODE',  tag:'CRYPTO',    tc:'tt-crypto',   pts:100,
    flag:'flag{cr4ck_th3_c0d3_h4ck3r}',
    hint:'CyberChef is your best friend — try chaining multiple operations. The string has been encoded more than once.',
    desc:'An encoded string was intercepted. It has been put through multiple encoding steps. Figure out the chain, reverse it, and reveal the hidden flag.',
    cipher: '9W3ZeATAb91ZxOmLsAQn091nwEwpwg3MukzM'
  },
  { id:'r5', num:5, title:'WEB RECON',      tag:'WEB',       tc:'tt-web',      pts:100,
    flag:'flag{r0b0ts_4r3_w4tch1ng}',
    hint:'Check everything — page source, special paths, and response headers. The flag appears in more than one place.',
    desc:'A target company website has been deployed. The flag is hidden somewhere on the site — it could be in the page source, a special file crawlers use, or in the HTTP response headers. Inspect carefully.',
    url: 'https://cyber-grid-target.netlify.app'
  },
  { id:'r6', num:6, title:'BINARY STRINGS', tag:'REVERSING', tc:'tt-rev',      pts:100,
    flag:'flag{h3x_dump_h3r0}',
    hint:'Use the strings command: strings challenge.bin | grep flag — or open it in a hex editor and search for the flag pattern.',
    desc:'A binary executable has been provided. You do not need to run it. Extract all readable text strings from the binary and find the hidden flag buried inside.',
    file: 'https://drive.google.com/uc?export=download&id=1pideMwVU-oQrIw75kZWgnd6xHIN1OO_T'
  },
];

// ── SESSION HELPERS ──
export function getSession() {
  try { return JSON.parse(localStorage.getItem('cg_session')); } catch { return null; }
}

export function saveSession(data) {
  localStorage.setItem('cg_session', JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem('cg_session');
}

// ── TOAST ──
export function toast(msg, type='info') {
  let box = document.getElementById('toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toasts';
    box.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('bye'); setTimeout(() => t.remove(), 250); }, 3200);
}
