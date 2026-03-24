import { db, ref, get, update }   from './firebase.js';
import { getSession, toast, ROUNDS } from './shared.js';

// ── INIT ──
const session = getSession();
if (!session || session.type !== 'member') {
  window.location.href = '/';
}

// Get round ID from this page's filename e.g. /rounds/r1.html → r1
const ROUND_ID  = window.location.pathname.split('/').pop().replace('.html','');
const ROUND     = ROUNDS.find(r => r.id === ROUND_ID);
const { teamId, memberName, isLeader } = session;

if (!ROUND) window.location.href = '/';

// ── DOM helpers ──
const g   = id => document.getElementById(id);
const qs  = s  => document.querySelector(s);

window.ripple = function ripple(btn, ev) {
  const r = document.createElement('span');
  const rect = btn.getBoundingClientRect(), sz = Math.max(rect.width, rect.height);
  r.className = 'rpl';
  r.style.cssText = `width:${sz}px;height:${sz}px;left:${ev.clientX-rect.left-sz/2}px;top:${ev.clientY-rect.top-sz/2}px`;
  btn.appendChild(r); setTimeout(() => r.remove(), 600);
};

// ── BUILD PAGE ──
async function init() {
  // Check round is unlocked
  const rSnap = await get(ref(db, `rounds/${ROUND_ID}`));
  if (!rSnap.exists() || !rSnap.val().unlocked) {
    document.getElementById('round-content').innerHTML = `
      <div style="text-align:center;padding:80px 20px">
        <div style="font-size:48px;margin-bottom:20px">🔒</div>
        <div style="font-family:var(--display);font-size:20px;color:var(--amber);letter-spacing:3px;margin-bottom:12px">ROUND LOCKED</div>
        <div style="font-family:var(--mono);font-size:13px;color:var(--dim)">This round hasn't been unlocked by the admin yet.</div>
        <a href="/" style="display:inline-block;margin-top:28px;font-family:var(--mono);font-size:12px;color:var(--cyan);text-decoration:none;letter-spacing:1px">← BACK TO CHALLENGES</a>
      </div>`;
    return;
  }

  // Get team data
  const tSnap = await get(ref(db, `teams/${teamId}`));
  const team  = tSnap.val();
  const solved     = team.solved      || {};
  const hintsUsed  = team.hints_used  || {};
  const wrongs     = team.wrongs      || {};

  // Render page header info
  g('round-num').textContent   = `ROUND ${ROUND.num}`;
  g('round-title').textContent = ROUND.title;
  g('round-tag').textContent   = ROUND.tag;
  g('round-tag').className     = `ch-tag ${ROUND.tc}`;
  if (ROUND.multi) {
    const perPts = ROUND.subs[0]?.pts || 0;
    g('round-pts').textContent = perPts + ' each';
    g('round-pts').style.fontSize = '18px';
  } else {
    g('round-pts').textContent = ROUND.pts;
  }
  g('round-desc').innerHTML    = ROUND.desc;

  // Render main content
  const content = g('round-content');

  if (ROUND.multi) {
    renderMulti(content, solved, hintsUsed, wrongs, team);
  } else {
    renderSingle(content, solved, hintsUsed, wrongs, team);
  }

  // Role badge
  const roleBadge = g('role-badge');
  if (roleBadge) {
    roleBadge.textContent = isLeader ? 'LEADER' : 'MEMBER';
    roleBadge.className   = isLeader ? 'score-tag role-leader' : 'score-tag role-member';
  }

  // Score
  const scoreEl = g('page-score');
  if (scoreEl) scoreEl.textContent = (team.pts||0) + ' PTS';
}

// ── MULTI (Round 1 — 4 locations) ──
function renderMulti(container, solved, hintsUsed, wrongs, team) {
  // Global hint for round
  const hintUsed = !!hintsUsed[ROUND_ID];
  const hintHtml = hintUsed
    ? `<div class="hint-box on" style="margin-bottom:24px">💡 ${ROUND.hint}<br><span style="font-size:11px;color:var(--red);display:block;margin-top:4px">— 10 pts deducted</span></div>`
    : isLeader
      ? `<button class="hint-btn" style="margin-bottom:16px" onclick="useHint('${ROUND_ID}')">▹ REVEAL HINT <span class="hint-cost">(—10 PTS)</span></button>
         <div id="hb-${ROUND_ID}" class="hint-box"></div>`
      : '';

  const subsHtml = ROUND.subs.map((sub, i) => {
    const isSolved = !!solved[sub.id];
    const wCount   = wrongs[sub.id] || 0;

    const inputArea = isSolved
      ? `<div class="solved-row"><div class="solved-icon">✓</div>Correct! +${sub.pts} pts</div>`
      : isLeader
        ? `<div class="flag-row" style="margin-top:12px">
            <input class="flag-input" id="fi-${sub.id}" placeholder="flag{city_name}" onkeydown="if(event.key==='Enter')submitFlag('${sub.id}',${sub.pts})">
            <button class="flag-btn" onclick="window.ripple&&window.ripple(this,event);window.submitFlag('${sub.id}',${sub.pts})">SUBMIT</button>
          </div>
          ${wCount>0?`<div class="wrong-note">⚠ ${wCount} wrong attempt${wCount>1?'s':''} — ${wCount*5} pts lost</div>`:''}`
        : `<div class="member-wait"><span style="color:var(--amber)">⏳</span> Waiting for team leader to submit...</div>`;

    return `
      <div style="background:var(--bg2);border:1px solid var(--cyanborder);border-radius:6px;overflow:hidden;margin-bottom:20px;${isSolved?'border-color:rgba(0,230,118,0.3)':''}">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--cyanborder);background:var(--bg1)">
          <span style="font-family:var(--mono);font-size:12px;color:var(--text-dim);letter-spacing:2px">${sub.label}</span>
          <span style="font-family:var(--display);font-size:13px;font-weight:700;color:var(--amber)">${sub.pts} PTS</span>
        </div>
        <img src="${sub.img}" alt="${sub.label}"
          style="width:100%;display:block;max-height:320px;object-fit:cover;cursor:pointer"
          onclick="openLightbox('${sub.img}')"
          onerror="this.style.cssText='width:100%;height:180px;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--dim);font-family:var(--mono);font-size:12px'"
        >
        <div style="padding:16px 18px">${inputArea}</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    ${hintHtml}
    ${subsHtml}
    <div style="font-family:var(--mono);font-size:11px;color:var(--dim);text-align:center;margin-top:8px;letter-spacing:1px">
      Click any image to enlarge
    </div>`;
}

// ── SINGLE (Rounds 2-6) ──
function renderSingle(container, solved, hintsUsed, wrongs, team) {
  const isSolved = !!solved[ROUND_ID];
  const hUsed    = !!hintsUsed[ROUND_ID];
  const wCount   = wrongs[ROUND_ID] || 0;

  // Extra content per round type
  let extra = '';
  if (ROUND.images) {
    extra = ROUND.images.map((img, i) => `
      <div style="margin-bottom:16px">
        <div style="font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:2px;margin-bottom:8px">${img.label}</div>
        <img src="${img.img}" alt="${img.label}"
          style="width:100%;max-height:320px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--cyanborder)"
          onclick="openLightbox('${img.img}')">
      </div>`).join('');
  } else if (ROUND.file) {
    const ext = ROUND.file.split('.').pop();
    if (ROUND.img) {
      // Has both preview image and download link
      extra = `
        <img src="${ROUND.img}" alt="Challenge image"
          style="width:100%;max-height:400px;object-fit:cover;border-radius:6px;margin-bottom:14px;cursor:pointer;border:1px solid var(--cyanborder)"
          onclick="openLightbox('${ROUND.img}')">
        <a href="${ROUND.file}" target="_blank"
          style="display:inline-flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--cyanhi);border-radius:4px;padding:12px 20px;font-family:var(--mono);font-size:13px;color:var(--cyan);text-decoration:none;margin-bottom:20px;transition:background 0.15s"
          onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='var(--bg2)'">
          ⬇ Download image file
        </a>`;
    } else if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
      extra = `<img src="${ROUND.file}" alt="Challenge image"
        style="width:100%;max-height:400px;object-fit:cover;border-radius:6px;margin-bottom:20px;cursor:pointer;border:1px solid var(--cyanborder)"
        onclick="openLightbox('${ROUND.file}')">`;
    } else {
      extra = `<a href="${ROUND.file}" target="_blank"
        style="display:inline-flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--cyanhi);border-radius:4px;padding:14px 20px;font-family:var(--mono);font-size:13px;color:var(--cyan);text-decoration:none;margin-bottom:20px;transition:background 0.15s"
        onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='var(--bg2)'">
        ⬇ Download challenge file
      </a>`;
    }
  }
  if (ROUND.cipher) {
    extra = `<div style="background:var(--bg2);border:1px solid var(--cyanborder);border-radius:6px;padding:20px;margin-bottom:20px;text-align:center">
      <div style="font-family:var(--mono);font-size:11px;color:var(--dim);margin-bottom:10px;letter-spacing:2px">INTERCEPTED STRING</div>
      <div style="font-family:var(--mono);font-size:16px;color:var(--cyan);word-break:break-all;letter-spacing:1px">${ROUND.cipher}</div>
      <button onclick="navigator.clipboard.writeText('${ROUND.cipher}');toast('Copied!','ok')"
        style="margin-top:12px;background:transparent;border:1px solid var(--cyanborder);border-radius:3px;padding:6px 14px;font-family:var(--mono);font-size:11px;color:var(--muted);cursor:pointer;letter-spacing:1px">
        COPY STRING
      </button>
    </div>`;
  }
  if (ROUND.url) {
    extra = `<div style="background:var(--bg2);border:1px solid var(--cyanborder);border-radius:6px;padding:20px;margin-bottom:20px">
      <div style="font-family:var(--mono);font-size:11px;color:var(--dim);margin-bottom:10px;letter-spacing:2px">TARGET URL</div>
      <a href="${ROUND.url}" target="_blank"
        style="font-family:var(--mono);font-size:14px;color:var(--cyan);word-break:break-all">${ROUND.url}</a>
    </div>`;
  }

  const hintHtml = hUsed
    ? `<div class="hint-box on">💡 ${ROUND.hint}<br><span style="font-size:11px;color:var(--red);display:block;margin-top:4px">— 10 pts deducted</span></div>`
    : isLeader
      ? `<button class="hint-btn" onclick="useHint('${ROUND_ID}')">▹ REVEAL HINT <span class="hint-cost">(—10 PTS)</span></button>
         <div id="hb-${ROUND_ID}" class="hint-box"></div>`
      : '';

  let flagArea = '';
  if (isSolved) {
    flagArea = `<div class="solved-row" style="margin-top:16px"><div class="solved-icon">✓</div>FLAG CAPTURED — CHALLENGE COMPLETE</div>`;
  } else if (isLeader) {
    flagArea = `
      ${hintHtml}
      <div class="flag-row" style="margin-top:16px">
        <input class="flag-input" id="fi-${ROUND_ID}" placeholder="flag{...}" onkeydown="if(event.key==='Enter')submitFlag('${ROUND_ID}',${ROUND.pts})">
        <button class="flag-btn" onclick="window.ripple&&window.ripple(this,event);window.submitFlag('${ROUND_ID}',${ROUND.pts})">SUBMIT FLAG</button>
      </div>
      ${wCount>0?`<div class="wrong-note" style="margin-top:8px">⚠ ${wCount} wrong attempt${wCount>1?'s':''} — ${wCount*5} pts lost</div>`:''}`;
  } else {
    flagArea = `
      ${hintHtml}
      <div class="member-wait" style="margin-top:16px"><span style="color:var(--amber)">⏳</span> Waiting for team leader to submit the flag...</div>`;
  }

  container.innerHTML = `${extra}${flagArea}`;
}

// ── SUBMIT FLAG ──
window.submitFlag = async function(flagId, pts) {
  if (!isLeader) { toast('Only the leader can submit.','bad'); return; }

  // Determine correct flag
  let correctFlag;
  if (ROUND.multi) {
    const sub = ROUND.subs.find(s => s.id === flagId);
    correctFlag = sub?.flag;
  } else {
    correctFlag = ROUND.flag;
  }

  const inp = g('fi-'+flagId); if (!inp) return;
  const val = inp.value.trim();
  if (!val) { toast('Enter a flag first.','info'); return; }

  const tSnap = await get(ref(db, `teams/${teamId}`));
  const team  = tSnap.val();

  if (team.solved?.[flagId]) { toast('Already solved!','info'); return; }

  if (val === correctFlag) {
    // Speed bonus
    const rSnap = await get(ref(db, `rounds/${ROUND_ID}/solveCount`));
    const sc    = rSnap.exists() ? rSnap.val() : 0;
    const bonus  = sc===0?50:sc===1?25:sc===2?10:0;
    const earned = pts + bonus;

    await update(ref(db, `teams/${teamId}`), {
      [`solved/${flagId}`]: true,
      pts: (team.pts||0) + earned
    });
    await update(ref(db, `rounds/${ROUND_ID}`), { solveCount: sc+1 });

    toast(`🎉 Correct! +${earned} pts${bonus?` (+${bonus} speed bonus)`:''}`, 'ok');
    const scoreEl = g('page-score'); if (scoreEl) scoreEl.textContent = ((team.pts||0)+earned)+' PTS';
    // Reload to reflect solved state
    setTimeout(() => init(), 600);

  } else {
    const wCount = (team.wrongs?.[flagId]||0)+1;
    await update(ref(db, `teams/${teamId}`), {
      [`wrongs/${flagId}`]: wCount,
      pts: Math.max(0,(team.pts||0)-5)
    });
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
    toast('Wrong flag — 5 pts deducted.','bad');
    inp.value='';
    const scoreEl = g('page-score'); if (scoreEl) scoreEl.textContent = Math.max(0,(team.pts||0)-5)+' PTS';
  }
};

// ── USE HINT ──
window.useHint = async function(rid) {
  if (!isLeader) { toast('Only the leader can use hints.','bad'); return; }
  const tSnap = await get(ref(db, `teams/${teamId}`));
  const team  = tSnap.val();
  if (team.hints_used?.[rid]) return;
  if ((team.pts||0) < 10) { toast('Need at least 10 pts to use a hint.','bad'); return; }

  await update(ref(db, `teams/${teamId}`), {
    [`hints_used/${rid}`]: true,
    pts: (team.pts||0) - 10
  });

  const hb = g('hb-'+rid);
  if (hb) {
    hb.innerHTML = `💡 ${ROUND.hint}<br><span style="font-size:11px;color:var(--red);display:block;margin-top:4px">— 10 pts deducted</span>`;
    hb.classList.add('on');
  }
  const scoreEl = g('page-score'); if (scoreEl) scoreEl.textContent = ((team.pts||0)-10)+' PTS';
  toast('Hint revealed — 10 pts deducted','warn');
};

// ── LIGHTBOX ──
window.openLightbox = function(src) {
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(4px)';
  lb.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;box-shadow:0 0 60px rgba(0,0,0,0.8)">`;
  lb.onclick = () => lb.remove();
  document.body.appendChild(lb);
};

// ── BACK BUTTON ──
window.goBack = function() { window.location.href = '/'; };

// ── START ──
init();
