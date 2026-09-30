(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- barra de HP = progresso da leitura ---------- */
  const hp = $('.hp-scroll i');
  let tick = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    hp.style.setProperty('--p', max > 0 ? scrollY / max : 0);
    tick = false;
  };
  addEventListener('scroll', () => { if (!tick) { requestAnimationFrame(onScroll); tick = true; } }, { passive: true });
  onScroll();

  /* ---------- seção ativa no menu ---------- */
  const navLinks = $$('.nav a');
  const porId = new Map(navLinks.map(a => [a.hash.slice(1), a]));
  const espiao = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.remove('ativo'));
    porId.get(e.target.id)?.classList.add('ativo');
  }), { rootMargin: '-45% 0px -50% 0px' });
  porId.forEach((_, id) => { const s = document.getElementById(id); if (s) espiao.observe(s); });

  /* ---------- log de batalha ---------- */
  const LINHAS = [
    { t: 'Você entrou no Showdown pela primeira vez.' },
    { t: 'O circuito usou <span class="ruim">Metagame Atual</span>.', hp: 52, turno: 2 },
    { t: '<span class="ruim">Foi muito eficaz!</span> Seu time de servidor caiu 6 a 0.', hp: 18, turno: 3 },
    { t: 'Você quase desinstalou.', turno: 4 },
    { t: '<span class="nos">Envy</span> e <span class="nos">seraphz</span> entraram na sala.', hp: 74, turno: 5 },
    { t: '<span class="fx">Você aprendeu Teambuilding.</span>', hp: 100, turno: 6 },
    { t: 'Você se inscreveu no primeiro open.', turno: 7 }
  ];
  const log = $('#log'), barra = $('#barra-voce'), hpTxt = $('#hp-voce'), turno = $('#turno');
  const slots = $$('.slots b'), replay = $('#replay');
  let timer = null;

  const pintaHp = v => {
    barra.querySelector('i').style.width = v + '%';
    barra.classList.toggle('baixo', v < 30);
    barra.classList.toggle('medio', v >= 30 && v < 60);
    hpTxt.textContent = v + '%';
  };
  const linha = (l, visivel) => {
    const p = document.createElement('p');
    p.innerHTML = l.t;
    if (visivel) p.className = 'vis';
    log.appendChild(p);
    if (!visivel) requestAnimationFrame(() => p.classList.add('vis'));
    while (log.children.length > 7) log.removeChild(log.firstElementChild);
  };
  const solta = i => {
    if (i >= LINHAS.length) { replay.classList.add('on'); return; }
    const l = LINHAS[i];
    linha(l, false);
    if (l.turno) turno.textContent = 'turno ' + l.turno;
    if (typeof l.hp === 'number') pintaHp(l.hp);
    slots[i]?.classList.add('on');
    timer = setTimeout(() => solta(i + 1), 1500);
  };
  const inicia = () => {
    clearTimeout(timer);
    log.innerHTML = '';
    slots.forEach(s => s.classList.remove('on'));
    replay.classList.remove('on');
    pintaHp(100);
    turno.textContent = 'turno 1';
    if (reduz) {
      LINHAS.forEach((l, i) => { linha(l, true); slots[i]?.classList.add('on'); });
      turno.textContent = 'turno 7';
      replay.classList.add('on');
      return;
    }
    timer = setTimeout(() => solta(0), 600);
  };
  if (log) { inicia(); replay.addEventListener('click', inicia); }

  /* ---------- revelar ao rolar ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('vis');
    io.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.rev').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });

  /* ---------- trilha de 30 dias ---------- */
  const trilha = $('#trilha');
  if (trilha) {
    const passos = $$('.passo', trilha);
    new IntersectionObserver((es, obs) => es.forEach(e => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      passos.forEach((p, i) => setTimeout(() => {
        p.classList.add('feito');
        trilha.style.setProperty('--prog', i / (passos.length - 1));
      }, reduz ? 0 : 350 + i * 420));
    }), { threshold: .35 }).observe(trilha);
  }

  /* ---------- comparação Showdown x Pixelmon ---------- */
  const vista = $('.compara__vista'), range = $('#compara-range');
  if (vista && range) {
    const set = v => { v = Math.max(0, Math.min(100, v)); vista.style.setProperty('--x', v + '%'); range.value = v; };
    const doPonteiro = e => { const r = vista.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
    let arrastando = false;
    vista.addEventListener('pointerdown', e => { arrastando = true; vista.setPointerCapture(e.pointerId); doPonteiro(e); });
    vista.addEventListener('pointermove', e => { if (arrastando) doPonteiro(e); });
    vista.addEventListener('pointerup', () => { arrastando = false; });
    vista.addEventListener('pointercancel', () => { arrastando = false; });
    range.addEventListener('input', () => set(+range.value));
    set(50);
  }

  /* ---------- seletor de tier ---------- */
  const TIERS = {
    agressivo: { n: 'Ubers', golpe: 'Pressão total', d: 'Você gosta de resolver a partida no braço, com poder bruto e pressão constante. Ubers premia leitura agressiva e pune quem hesita — e o metagame é mais estável, então você aprende mais rápido.' },
    controle: { n: 'OU stall / balance', golpe: 'Muralha', d: 'Paciência é a sua arma. OU tem o pool mais profundo para construir times que ganham no cansaço, mas exige o maior volume de conhecimento de meta. É o caminho mais longo e o mais completo.' },
    tecnico: { n: 'Little Cup', golpe: 'Preparação', d: 'Playerbase menor, cálculo mais apertado e valor enorme em preparação. É a tier em que você chega mais rápido do zero à relevância — e é a casa do Envy.' },
    caos: { n: 'Random Battle → NU', golpe: 'Improviso', d: 'Comece na Random Battle para calibrar mecânica sem se preocupar com time, e migre para NU, onde criatividade de build ainda ganha partida.' }
  };
  const opts = $('#tier-opts'), saida = $('#tier-saida');
  if (opts && saida) {
    opts.addEventListener('click', e => {
      const b = e.target.closest('.golpe');
      if (!b) return;
      $$('.golpe', opts).forEach(o => o.setAttribute('aria-pressed', String(o === b)));
      const t = TIERS[b.dataset.t];
      saida.innerHTML = '';
      const add = (tag, cls, txt) => { const el = document.createElement(tag); el.className = cls; el.textContent = txt; saida.appendChild(el); return el; };
      add('p', 'saida__log', `Você usou ${t.golpe}! · ponto de partida sugerido`);
      add('p', 'saida__nome', t.n);
      add('p', '', t.d);
      const cta = add('a', 'saida__cta', 'Começar por essa tier →');
      cta.href = '#assinar';
    });
  }

  /* ---------- checkout (protótipo) ---------- */
  const toast = $('#toast');
  let toastT;
  $$('[data-checkout]').forEach(a => a.addEventListener('click', e => {
    if (a.getAttribute('href') !== '#') return; // quando houver link real de pagamento, ele segue normalmente
    e.preventDefault();
    toast.textContent = 'Protótipo: o checkout ainda não está conectado.';
    toast.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('on'), 3200);
  }));

  /* ---------- barra de CTA no celular ---------- */
  const barraCta = $('#barra-cta'), hero = $('.hero'), oferta = $('#assinar');
  if (barraCta && hero && oferta) {
    const vis = { hero: true, oferta: false };
    const atualiza = () => barraCta.classList.toggle('on', !vis.hero && !vis.oferta);
    new IntersectionObserver(es => es.forEach(e => {
      vis[e.target === hero ? 'hero' : 'oferta'] = e.isIntersecting;
      atualiza();
    })).observe(hero);
    new IntersectionObserver(es => es.forEach(e => { vis.oferta = e.isIntersecting; atualiza(); })).observe(oferta);
  }
})();
