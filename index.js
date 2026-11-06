/**
 * ni-bar-bg — 状态栏·水墨皮肤
 *
 * 给 novel-injector 的状态栏面板（#ni-storybar）整条换皮：
 * 底图、文字底、药丸、按钮、卡片、标签、滚动条，全部按「动漫水墨国风」重绘。
 *
 * 不修改 novel-injector 的任何文件，所以它更新时不会把皮肤冲掉。
 */

const MOD_ID = 'ni-bar-bg';
const STORE_KEY = 'ni-bar-bg/v1';

// 扩展自身所在目录（assets 用），失败时退回标准安装路径
const BASE = (() => {
    try {
        return new URL('.', import.meta.url).href;
    } catch (e) {
        return '/scripts/extensions/third-party/ni-bar-bg/';
    }
})();

const ASSETS = {
    ink: BASE + 'assets/ink.webp',
    clean: BASE + 'assets/ink-clean.webp',
    back: BASE + 'assets/ink-back.webp',
    night: BASE + 'assets/night.webp',
    sakura: BASE + 'assets/sakura.webp',
    bw: BASE + 'assets/ink-bw.webp',
    paper: BASE + 'assets/paper-bw.webp',
    eri: BASE + 'assets/eri-bg.webp',
    eriInner: BASE + 'assets/eri-inner.webp',
    plain: '',
};

const PRESETS = [
    { id: 'eri', name: '绘梨衣·小黄鸭', img: () => ASSETS.eri, tone: 'eri' },
    { id: 'bw', name: '黑白·抱猫', img: () => ASSETS.bw, tone: 'bw' },
    { id: 'ink', name: '水墨·少女', img: () => ASSETS.ink, tone: 'ink' },
    { id: 'clean', name: '水墨·山水', img: () => ASSETS.clean, tone: 'ink' },
    { id: 'back', name: '水墨·背影', img: () => ASSETS.back, tone: 'ink' },
    { id: 'night', name: '夜墨', img: () => ASSETS.night, tone: 'night' },
    { id: 'sakura', name: '樱粉', img: () => ASSETS.sakura, tone: 'sakura' },
    { id: 'plain', name: '素纸', img: () => '', tone: 'plain' },
    { id: 'custom', name: '自定义', img: (s) => s.image || '', tone: 'ink' },
];

const DEFAULT = {
    enabled: true,
    preset: 'eri',
    image: '',
    tone: 'ink',        // 自定义图使用浅色还是深色文字
    pos: 'top',         // 收起时的取景：top / center / bottom（展开后自动居中）
    paper: 0.86,        // 纸底不透明度
    alpha: 1,           // 整块背景透明度（0=全透明，1=不透明）
    dim: 0.12,          // 图片遮罩
    blur: 0,            // 背景模糊
    radius: 16,         // 圆角
    perChar: true,      // 按角色卡分别设置
    byChar: {},         // avatar -> 局部设置
};

const NUM_KEYS = ['paper', 'alpha', 'dim', 'blur', 'radius'];

/* ------------------------------------------------------------------ */
/* 存储                                                                */
/* ------------------------------------------------------------------ */

function loadRaw() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return { ...DEFAULT };
        const obj = JSON.parse(raw);
        return { ...DEFAULT, ...obj, byChar: obj.byChar && typeof obj.byChar === 'object' ? obj.byChar : {} };
    } catch (e) {
        return { ...DEFAULT };
    }
}

function saveRaw(s) {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(s));
        return true;
    } catch (e) {
        if (typeof toastr !== 'undefined') toastr.error('保存失败：图片太大，存储空间不足。换一张小一点的图试试。');
        console.warn('[ni-bar-bg] save failed', e);
        return false;
    }
}

function getCtx() {
    try {
        return window.SillyTavern?.getContext?.() ?? null;
    } catch (e) {
        return null;
    }
}

function currentAvatar() {
    const ctx = getCtx();
    if (!ctx) return '';
    const list = ctx.characters || [];
    const ch = list[ctx.characterId];
    return ch?.avatar || '';
}

function currentCharName() {
    const ctx = getCtx();
    if (!ctx) return '';
    return ctx.characters?.[ctx.characterId]?.name || '';
}

/* ------------------------------------------------------------------ */
/* 计算生效设置                                                        */
/* ------------------------------------------------------------------ */

function effective() {
    const s = loadRaw();
    const av = s.perChar ? currentAvatar() : '';
    const over = av && s.byChar[av] ? s.byChar[av] : null;
    return over ? { ...s, ...over } : s;
}

function toneOf(s) {
    const p = PRESETS.find((x) => x.id === s.preset);
    if (!p) return 'ink';
    if (s.preset === 'custom') return s.tone === 'night' ? 'night' : 'ink';
    return p.tone;
}

function imgOf(s) {
    const p = PRESETS.find((x) => x.id === s.preset);
    if (!p) return '';
    return p.img(s);
}

/* ------------------------------------------------------------------ */
/* 应用到状态栏                                                        */
/* ------------------------------------------------------------------ */

let lastEl = null;
let lastSig = '';

function apply() {
    const el = document.getElementById('ni-storybar');
    if (!el) return;

    const s = loadRaw();
    const e = effective();

    if (!s.enabled) {
        clearSkin(el);
        lastEl = el;
        lastSig = 'off';
        return;
    }

    const sig = JSON.stringify([e.preset, e.tone, e.pos, e.image?.length || 0, e.image?.slice(-32) || '', e.paper, e.dim, e.blur, e.radius, currentAvatar()]);
    if (el === lastEl && sig === lastSig) return;
    lastEl = el;
    lastSig = sig;

    const tone = toneOf(e);
    for (const t of ['ink', 'night', 'sakura', 'plain', 'bw']) el.classList.remove('nb-theme-' + t);
    el.classList.add('nb-theme-' + tone);

    const img = imgOf(e);
    el.style.setProperty('--nb-img', img ? `url("${img}")` : 'none');
    // 框架内的内容区底纹：黑白水墨用宣纸山水，其余主题不铺
    const innerOf = { bw: ASSETS.paper, eri: ASSETS.eriInner };
    el.style.setProperty('--nb-img2', innerOf[e.preset] ? `url("${innerOf[e.preset]}")` : 'none');
    el.style.setProperty('--nb-pos', e.pos === 'top' || e.pos === 'bottom' ? e.pos : 'center');
    el.style.setProperty('--nb-paper-a', String(e.paper));
    el.style.setProperty('--nb-alpha', String(e.alpha));
    el.style.setProperty('--nb-dim', String(e.dim));
    el.style.setProperty('--nb-blur', e.blur + 'px');
    el.style.setProperty('--nb-radius', e.radius + 'px');
    el.dataset.nbSkin = '1';
}

function clearSkin(el) {
    if (!el) return;
    for (const t of ['ink', 'night', 'sakura', 'plain']) el.classList.remove('nb-theme-' + t);
    for (const v of ['--nb-img', '--nb-img2', '--nb-pos', '--nb-paper-a', '--nb-alpha', '--nb-dim', '--nb-blur', '--nb-radius']) {
        el.style.removeProperty(v);
    }
    delete el.dataset.nbSkin;
}

let timer = 0;
function scheduleApply(delay = 120) {
    clearTimeout(timer);
    timer = setTimeout(() => {
        try {
            apply();
        } catch (err) {
            console.warn('[ni-bar-bg] apply error', err);
        }
    }, delay);
}

function watch() {
    // 状态栏是动态插入/移动的，观察 DOM 变化即可
    const mo = new MutationObserver(() => {
        if (document.getElementById('ni-storybar')) scheduleApply();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // 兜底：切换聊天/角色后重新取图
    const ctx = getCtx();
    const es = ctx?.eventSource;
    const et = ctx?.eventTypes || {};
    if (es?.on) {
        for (const name of ['CHARACTER_SELECTED', 'CHAT_CHANGED', 'MESSAGE_RECEIVED', 'MESSAGE_SENT', 'GENERATION_ENDED']) {
            if (et[name]) es.on(et[name], () => scheduleApply(200));
        }
    }

    // 首屏与几次重试（插件可能比我们晚加载）
    for (const d of [0, 300, 900, 1800, 3200]) setTimeout(() => scheduleApply(0), d);
}

/* ------------------------------------------------------------------ */
/* 图片压缩（避免 localStorage 爆掉）                                  */
/* ------------------------------------------------------------------ */

function readFile(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });
}

function loadImg(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function compressToDataUrl(file) {
    const dataUrl = await readFile(file);
    const img = await loadImg(dataUrl);
    const maxW = 1280;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    g.drawImage(img, 0, 0, w, h);

    let out = canvas.toDataURL('image/webp', 0.82);
    if (out.length > 900 * 1024) out = canvas.toDataURL('image/webp', 0.66);
    if (out.length > 900 * 1024) out = canvas.toDataURL('image/jpeg', 0.72);
    return out;
}

/* ------------------------------------------------------------------ */
/* 设置页                                                              */
/* ------------------------------------------------------------------ */

async function fetchTemplate() {
    const ctx = getCtx();
    if (ctx?.renderExtensionTemplateAsync) {
        try {
            return await ctx.renderExtensionTemplateAsync('third-party/ni-bar-bg', 'settings');
        } catch (e) {
            console.warn('[ni-bar-bg] renderExtensionTemplateAsync failed', e);
        }
    }
    const r = await fetch(BASE + 'settings.html', { cache: false });
    return await r.text();
}

function setTarget(s, patch) {
    // 有角色独立设置时写进角色记录，否则写全局
    const av = s.perChar ? currentAvatar() : '';
    if (av && s.byChar[av]) {
        s.byChar[av] = { ...s.byChar[av], ...patch };
    } else {
        Object.assign(s, patch);
    }
    saveRaw(s);
    scheduleApply(30);
}

function renderPreview(s) {
    const box = document.getElementById('nb-preview');
    if (!box) return;
    const e = effective();
    const img = imgOf(e);
    box.style.backgroundImage = img ? `linear-gradient(rgba(250,246,236,0.12), rgba(250,246,236,0.12)), url("${img}")` : 'none';
    box.style.backgroundColor = e.preset === 'night' ? '#1a1f26' : '#f6f1e6';
    const dark = toneOf(e) === 'night';
    const ink = dark ? '#ece5d6' : '#2b2723';
    const unit = dark ? 'rgba(24,29,36,0.82)' : 'rgba(253,250,243,0.82)';
    box.style.borderColor = dark ? 'rgba(198,168,110,0.3)' : 'rgba(150,120,70,0.35)';
    const t = box.querySelector('.nb-p-ttl');
    const meta = box.querySelector('.nb-p-meta');
    const pill = box.querySelector('.nb-p-pill');
    if (t) {
        t.style.color = ink;
        t.style.background = unit;
        t.style.padding = '1px 6px';
        t.style.borderRadius = '3px';
    }
    if (meta) {
        meta.style.color = dark ? '#8d8878' : '#8a8478';
        meta.style.background = unit;
    }
    if (pill) {
        pill.style.color = dark ? '#d06a5c' : '#b23b32';
        pill.style.background = dark ? 'rgba(208,106,92,0.16)' : 'rgba(178,59,50,0.10)';
        pill.style.borderColor = dark ? 'rgba(208,106,92,0.45)' : 'rgba(178,59,50,0.42)';
    }
}

function syncUI() {
    const s = loadRaw();
    const e = effective();
    const q = (id) => document.getElementById(id);

    if (q('nb-enabled')) q('nb-enabled').checked = !!s.enabled;

    document.querySelectorAll('#nb-presets .nb-thumb').forEach((n) => {
        n.classList.toggle('sel', n.dataset.preset === e.preset);
    });

    for (const k of NUM_KEYS) {
        const input = q('nb-' + k);
        if (input) {
            const ratio = k === 'paper' || k === 'alpha' || k === 'dim';
            input.value = String(ratio ? Math.round(e[k] * 100) : e[k]);
            const lab = q('nb-' + k + '-v');
            if (lab) lab.textContent = k === 'blur' ? e[k] + 'px' : k === 'radius' ? e[k] + 'px' : Math.round(e[k] * 100) + '%';
        }
    }

    const toneSel = q('nb-tone');
    if (toneSel) {
        toneSel.value = e.tone === 'night' ? 'night' : 'day';
        const customRow = q('nb-tone-row');
        if (customRow) customRow.style.display = e.preset === 'custom' ? '' : 'none';
    }

    const posSel = q('nb-pos');
    if (posSel) posSel.value = e.pos || 'center';

    const av = currentAvatar();
    const per = q('nb-perchar');
    if (per) per.checked = !!s.perChar;
    const who = q('nb-who');
    if (who) who.textContent = currentCharName() ? `当前角色：${currentCharName()}` : '当前没有打开角色卡';
    const own = q('nb-ownstate');
    if (own) {
        own.textContent = s.perChar && av && s.byChar[av] ? '该角色已单独设置' : '该角色使用全局设置';
        own.style.opacity = '0.7';
    }
    const del = q('nb-chardel');
    if (del) del.disabled = !(s.perChar && av && s.byChar[av]);

    renderPreview(s);
}

async function initSettings() {
    if (document.querySelector('.ni-bar-bg-settings')) return;   // 只挂一次
    let html;
    try {
        html = await fetchTemplate();
    } catch (e) {
        console.warn('[ni-bar-bg] settings template failed', e);
        return;
    }
    const host = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (!host) return false;
    host.insertAdjacentHTML('beforeend', html);

    const q = (id) => document.getElementById(id);

    // 预设缩略图
    const grid = q('nb-presets');
    if (grid) {
        grid.innerHTML = PRESETS.map((p) => {
            const img = p.id === 'custom' ? '' : p.img(DEFAULT);
            const bg = img ? `background-image:url("${img}")` : 'background:#f2ece0';
            const dash = p.id === 'custom' ? 'background-image:repeating-linear-gradient(45deg,#e9e0cf 0 6px,#f7f2e7 6px 12px)' : '';
            return `<div class="nb-thumb" data-preset="${p.id}" style="${bg};${dash}"><span>${p.name}</span></div>`;
        }).join('');
        grid.addEventListener('click', (ev) => {
            const t = ev.target.closest('.nb-thumb');
            if (!t) return;
            const s = loadRaw();
            setTarget(s, { preset: t.dataset.preset });
            syncUI();
        });
    }

    q('nb-enabled')?.addEventListener('change', (ev) => {
        const s = loadRaw();
        s.enabled = !!ev.target.checked;
        saveRaw(s);
        scheduleApply(0);
        syncUI();
    });

    for (const k of NUM_KEYS) {
        q('nb-' + k)?.addEventListener('input', (ev) => {
            const s = loadRaw();
            const raw = Number(ev.target.value);
            const val = k === 'paper' || k === 'alpha' || k === 'dim' ? raw / 100 : raw;
            setTarget(s, { [k]: val });
            const label = q('nb-' + k + '-v');
            if (label) label.textContent = k === 'blur' || k === 'radius' ? raw + 'px' : raw + '%';
            renderPreview(loadRaw());
        });
    }

    q('nb-tone')?.addEventListener('change', (ev) => {
        const s = loadRaw();
        setTarget(s, { tone: ev.target.value === 'night' ? 'night' : 'ink' });
        renderPreview(s);
    });

    q('nb-pos')?.addEventListener('change', (ev) => {
        const s = loadRaw();
        setTarget(s, { pos: ev.target.value });
    });

    // 上传
    q('nb-file')?.addEventListener('change', async (ev) => {
        const f = ev.target.files?.[0];
        if (!f) return;
        try {
            const data = await compressToDataUrl(f);
            const s = loadRaw();
            setTarget(s, { preset: 'custom', image: data });
            syncUI();
            if (typeof toastr !== 'undefined') toastr.success('背景已更新');
        } catch (err) {
            console.warn(err);
            if (typeof toastr !== 'undefined') toastr.error('图片处理失败，换一张试试');
        } finally {
            ev.target.value = '';
        }
    });

    // URL
    q('nb-urlload')?.addEventListener('click', () => {
        const url = (q('nb-url')?.value || '').trim();
        if (!url) return;
        const s = loadRaw();
        setTarget(s, { preset: 'custom', image: url });
        syncUI();
    });

    q('nb-clearimg')?.addEventListener('click', () => {
        const s = loadRaw();
        setTarget(s, { preset: 'ink', image: '' });
        syncUI();
    });

    // 按角色
    q('nb-perchar')?.addEventListener('change', (ev) => {
        const s = loadRaw();
        s.perChar = !!ev.target.checked;
        saveRaw(s);
        syncUI();
        scheduleApply(0);
    });

    q('nb-chardel')?.addEventListener('click', () => {
        const s = loadRaw();
        const av = currentAvatar();
        if (av && s.byChar[av]) {
            delete s.byChar[av];
            saveRaw(s);
            syncUI();
            scheduleApply(0);
        }
    });

    q('nb-reset')?.addEventListener('click', () => {
        if (!confirm('恢复默认设置？自定义背景与各角色设置会一起清掉。')) return;
        saveRaw({ ...DEFAULT, byChar: {} });
        syncUI();
        scheduleApply(0);
    });

    syncUI();
    scheduleApply(0);
    return true;
}

/* ------------------------------------------------------------------ */
/* 启动                                                                */
/* ------------------------------------------------------------------ */

// 扩展设置区是酒馆异步渲染的，等它出现再挂面板
function waitForHost(tries = 40) {
    const host = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (host) {
        initSettings().catch((e) => console.warn('[ni-bar-bg] init failed', e));
        return;
    }
    if (tries <= 0) return;
    setTimeout(() => waitForHost(tries - 1), 250);
}

function boot() {
    watch();
    waitForHost();
    // 供调试
    window.niBarBg = { apply, loadRaw, saveRaw, PRESETS };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
