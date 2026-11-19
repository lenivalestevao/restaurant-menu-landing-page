/* Saffron & Sage: vanilla JavaScript, no dependencies.
   Every page is rendered in the browser and routed with the URL hash
   (#/menu, #/dish/6, #/journal/2 ...), so it runs on any static host.
   The order cart, reservation and gift card are kept in localStorage. */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Storage (falls back to memory if blocked) ---------- */
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  const ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  /* ---------- Demo data (replace with your own) ---------- */
  const CATS = ['Starters', 'Mains', 'Pasta & Pizza', 'Desserts', 'Drinks'];
  const CAT_ICON = { 'Starters': '🥗', 'Mains': '🍽️', 'Pasta & Pizza': '🍝', 'Desserts': '🍰', 'Drinks': '🍹' };
  const DIETS = [['v', 'Vegetarian'], ['vg', 'Vegan'], ['gf', 'Gluten-free'], ['sp', 'Spicy']];
  // id, category, name, description, price, emoji, hue, tags, popular
  const DISHES = [
    [1, 'Starters', 'Burrata & Heirloom Tomato', 'Creamy burrata, ripe tomatoes, basil oil and toasted sourdough.', 14, '🍅', 8, ['v'], 1],
    [2, 'Starters', 'Crispy Calamari', 'Lightly fried squid with lemon aioli and pickled chili.', 13, '🦑', 35, [], 0],
    [3, 'Starters', 'Roasted Beet Salad', 'Golden beets, orange, pistachio and a sage vinaigrette.', 12, '🥗', 340, ['vg', 'gf'], 0],
    [4, 'Starters', 'Saffron Arancini', 'Crisp risotto balls filled with mozzarella, served with tomato jam.', 11, '🍘', 42, ['v'], 0],
    [5, 'Starters', 'Spiced Lamb Skewers', 'Charred lamb, harissa yogurt and fresh mint.', 15, '🍢', 15, ['gf', 'sp'], 0],
    [6, 'Mains', 'Herb-Crusted Salmon', 'Roasted salmon, lemon butter, charred broccolini and new potatoes.', 26, '🐟', 12, ['gf'], 1],
    [7, 'Mains', 'Slow-Braised Short Rib', 'Eight-hour short rib, creamy polenta and red wine jus.', 31, '🥩', 5, ['gf'], 1],
    [8, 'Mains', 'Sage Roast Chicken', 'Half chicken with sage, garlic, seasonal greens and pan juices.', 24, '🍗', 28, ['gf'], 0],
    [9, 'Mains', 'Wild Mushroom Risotto', 'Arborio rice, forest mushrooms, parmesan and thyme.', 22, '🍄', 30, ['v', 'gf'], 0],
    [10, 'Mains', 'Cauliflower Steak', 'Roasted cauliflower, tahini, pomegranate and herb salad.', 20, '🥦', 95, ['vg', 'gf'], 0],
    [11, 'Pasta & Pizza', 'Saffron Tagliatelle', 'Fresh egg pasta, saffron cream, peas and crispy sage.', 21, '🍝', 45, ['v'], 1],
    [12, 'Pasta & Pizza', 'Spicy Arrabbiata', 'Penne, tomato, garlic and chili, finished with olive oil.', 18, '🌶️', 2, ['vg', 'sp'], 0],
    [13, 'Pasta & Pizza', 'Margherita Pizza', 'Wood-fired, San Marzano tomato, mozzarella and basil.', 17, '🍕', 8, ['v'], 0],
    [14, 'Pasta & Pizza', 'Truffle Funghi Pizza', 'Mixed mushrooms, taleggio, thyme and truffle oil.', 22, '🍕', 25, ['v'], 0],
    [15, 'Pasta & Pizza', 'Lobster Ravioli', 'Handmade ravioli, bisque butter and chives.', 29, '🦞', 355, [], 0],
    [16, 'Desserts', 'Olive Oil Cake', 'Moist citrus cake with whipped mascarpone and berries.', 10, '🍰', 48, ['v'], 1],
    [17, 'Desserts', 'Dark Chocolate Pot', 'Silky 70% chocolate, sea salt and olive oil.', 11, '🍫', 20, ['v', 'gf'], 0],
    [18, 'Desserts', 'Lemon Tart', 'Buttery crust, sharp lemon curd and torched meringue.', 9, '🍋', 55, ['v'], 0],
    [19, 'Desserts', 'Affogato', 'Vanilla gelato drowned in hot espresso.', 8, '☕', 30, ['v', 'gf'], 0],
    [20, 'Drinks', 'Sage Lemonade', 'Fresh lemon, sage syrup and sparkling water.', 6, '🍋', 70, ['vg'], 0],
    [21, 'Drinks', 'Blood Orange Spritz', 'Blood orange, prosecco and a splash of bitter.', 12, '🍊', 18, [], 0],
    [22, 'Drinks', 'House Red (glass)', 'Medium-bodied red from a small family vineyard.', 11, '🍷', 345, ['vg'], 0],
    [23, 'Drinks', 'Cold Brew', 'Slow-steeped for 18 hours, served over ice.', 5, '☕', 25, ['vg'], 0],
    [24, 'Drinks', 'Rosemary Gin Fizz', 'Gin, rosemary, lemon and soda.', 13, '🍸', 120, ['vg'], 0]
  ].map((d) => ({ id: d[0], cat: d[1], name: d[2], desc: d[3], price: d[4], icon: d[5], hue: d[6], tags: d[7], pop: !!d[8] }));

  const REVIEWS = [
    ['Marta Gomez', 'Dined with family', 'The saffron tagliatelle is the best pasta I have had outside Italy. Service felt warm and unhurried.', 5],
    ['Chris Nolan', 'Anniversary dinner', 'Beautiful room, perfect pacing and a short rib that fell apart at the touch of a fork.', 5],
    ['Aisha Khan', 'Lunch with friends', 'Great vegan options that are not an afterthought. The cauliflower steak is excellent.', 5],
    ['Tom Becker', 'Takeout regular', 'Order online, pick up in ten minutes, and everything arrives hot and well packed.', 4],
    ['Lucia Fernandez', 'Birthday party', 'They hosted our party of twenty without a single hiccup. The olive oil cake was a hit.', 5],
    ['Ben Carter', 'Date night', 'Cozy, quiet and delicious. Ask for the table by the window.', 5]
  ];
  const EVENT_TYPES = [
    ['🥂', 'Private Dining', 'A room of your own with a set menu and a dedicated server.', '12 to 40 guests', 65],
    ['💍', 'Weddings & Rehearsals', 'Intimate celebrations with seasonal menus and floral styling.', 'Up to 80 guests', 95],
    ['💼', 'Corporate Dinners', 'Team dinners, client evenings and quiet working lunches.', '10 to 60 guests', 55],
    ['🍷', 'Wine Evenings', 'Guided tastings with pairing plates from the kitchen.', '8 to 24 guests', 70]
  ];
  const UPCOMING = [
    ['06', 'DEC', 'Winter Truffle Dinner', 'Five courses built around fresh black truffle, with wine pairings.', 'Seats from $95'],
    ['13', 'DEC', 'Pasta Making Class', 'Hands-on workshop with Chef Marco, followed by a family-style lunch.', '$60 per guest'],
    ['21', 'DEC', 'Holiday Wine Night', 'Six wines from small producers, paired with bites from the kitchen.', '$70 per guest'],
    ['31', 'DEC', 'New Year\'s Eve Tasting Menu', 'Seven courses and a midnight toast. Two seatings.', 'Seats from $120'],
    ['11', 'JAN', 'Supper Club: Winter Harvest', 'A shared table, one long menu and neighbors you have not met yet.', '$55 per guest']
  ];
  const POSTS = [
    { id: 1, cat: 'Kitchen', icon: '🍅', hue: 10, date: 'Nov 14, 2026', read: 4, title: 'Why we cook with what is in season', ex: 'The menu changes every few weeks, and here is why that makes the food better.', body: ['Our menu follows the farms, not the calendar on the wall.', '## Flavor first', 'A tomato picked in August needs almost nothing. In winter we turn to roots, citrus and slow braises that ask for patience.', '## Fewer miles', 'Most of our produce comes from farms less than an hour away, so it reaches the kitchen the same day it is picked.'] },
    { id: 2, cat: 'Recipes', icon: '🍝', hue: 45, date: 'Nov 2, 2026', read: 6, title: 'Saffron tagliatelle you can make at home', ex: 'Our most ordered pasta, simplified for a weeknight.', body: ['This is a lighter version of the dish that has been on our menu since the first week.', '## What you need', 'Fresh tagliatelle, a pinch of saffron, cream, peas, parmesan and a few sage leaves.', '## Method', 'Steep the saffron in warm water, simmer it with cream, toss with the pasta and finish with crisp sage. Salt at the end.'] },
    { id: 3, cat: 'People', icon: '👨‍🍳', hue: 200, date: 'Oct 20, 2026', read: 5, title: 'Meet Chef Marco Bellini', ex: 'From his grandmother\'s kitchen in Bologna to ours.', body: ['Marco learned to roll pasta standing on a chair, next to his grandmother.', '## A simple rule', 'He teaches every cook the same thing: taste everything, all the time.', '## What is next', 'A weekend pasta class and a small bakery counter are planned for next spring.'] },
    { id: 4, cat: 'Events', icon: '🍷', hue: 345, date: 'Oct 8, 2026', read: 3, title: 'How to pair wine with a tasting menu', ex: 'Three rules our sommelier uses every night.', body: ['Pairing is easier than it sounds.', '## Match weight', 'Light dishes want light wines. Rich dishes can handle structure and tannin.', '## Mind the acid', 'Acidity cuts through fat and refreshes the palate between bites.'] },
    { id: 5, cat: 'Kitchen', icon: '🌿', hue: 95, date: 'Sep 25, 2026', read: 5, title: 'Our herb garden on the roof', ex: 'Sage, rosemary and thyme, thirty steps from the stove.', body: ['Three years ago we put a few planters on the roof.', '## Why it matters', 'Fresh herbs change a dish. Picking them minutes before service means more aroma and less waste.', '## Come and see', 'Ask your server for a short tour on a quiet afternoon.'] }
  ];
  const GALLERY = [
    ['🍝', 45, 'Saffron tagliatelle', 'Food'], ['🏛️', 25, 'The main dining room', 'Venue'], ['🥩', 5, 'Slow-braised short rib', 'Food'],
    ['👨‍🍳', 200, 'Chef Marco at the pass', 'Team'], ['🍰', 48, 'Olive oil cake', 'Food'], ['🪟', 35, 'The window table', 'Venue'],
    ['🍕', 8, 'Wood-fired Margherita', 'Food'], ['🌿', 95, 'Rooftop herb garden', 'Venue'], ['🍷', 345, 'Wine cellar', 'Venue'],
    ['🧑‍🍳', 160, 'Prep before service', 'Team'], ['🍋', 55, 'Lemon tart', 'Food'], ['🥂', 330, 'Private dining room', 'Venue']
  ];
  const GAL_CATS = ['All', 'Food', 'Venue', 'Team'];
  const TEAM = [['Marco Bellini', 'Executive chef', 20], ['Sofia Reyes', 'General manager', 330], ['Daniel Okafor', 'Head sommelier', 265], ['Elena Rossi', 'Pastry chef', 45]];
  const TIMELINE = [['2012', 'Two cooks, six tables and one very old oven open the first Saffron & Sage.'], ['2016', 'We move to Olive Street and add a wood-fired pizza oven.'], ['2020', 'Online ordering launches and the kitchen feeds the neighborhood through a hard year.'], ['2023', 'The rooftop herb garden opens and our first Michelin Bib Gourmand arrives.'], ['2026', 'Fourteen years in, still cooking with the seasons.']];
  const FAQ = [
    ['Reservations', 'How far ahead can I book?', 'You can reserve up to 60 days in advance. Same-day tables are often available after 8 pm.'],
    ['Reservations', 'What is your cancellation policy?', 'Please let us know at least 4 hours ahead. Groups of 8 or more need 48 hours.'],
    ['Reservations', 'Do you accommodate large groups?', 'Yes. Groups of 9 or more should send an inquiry through our events page.'],
    ['Menu', 'Do you have vegetarian, vegan and gluten-free options?', 'Yes. Use the filters on the menu page to see them. Tell your server about any allergy.'],
    ['Menu', 'Can I bring my own wine?', 'Yes, for a $25 corkage fee per bottle. Two bottles maximum per table.'],
    ['Ordering', 'How long does delivery take?', 'Usually 35 to 50 minutes within three miles. Pickup is ready in about 20 minutes.'],
    ['Ordering', 'Is there a delivery fee?', 'Delivery is $4.00 and free for orders of $40 or more.'],
    ['Gift cards', 'Do gift cards expire?', 'No. They never expire and can be used for dining, takeout and events.']
  ];
  // Opening hours by weekday (0 = Sunday): [open hour, close hour] or null when closed
  const HOURS = [[12, 21], null, [12, 22], [12, 22], [12, 22], [12, 23], [12, 23]];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SLOTS = ['12:00', '12:30', '13:00', '13:30', '14:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

  /* ---------- Helpers ---------- */
  const shade = (h) => 'linear-gradient(135deg,hsl(' + h + ' 70% 55%),hsl(' + ((h + 40) % 360) + ' 70% 45%))';
  const soft = (h) => 'linear-gradient(135deg,hsl(' + h + ' 80% 93%),hsl(' + ((h + 30) % 360) + ' 80% 86%))';
  const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const stars = (n) => '<span class="stars" aria-hidden="true">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>';
  const money = (n) => '$' + n.toFixed(2);
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dishById = (id) => DISHES.find((d) => d.id === Number(id));
  const store_ = { cat: 'All', diet: [], q: '', gal: 'All', mode: store.get('ss-mode', 'pickup'), tip: store.get('ss-tip', 15), amt: 50, slot: '', lb: -1 };
  const cart = { items: store.get('ss-cart', {}) };
  const cartCount = () => Object.keys(cart.items).reduce((n, id) => n + cart.items[id], 0);
  const cartLines = () => Object.keys(cart.items).map((id) => ({ d: dishById(id), q: cart.items[id] })).filter((l) => l.d);
  const subtotal = () => cartLines().reduce((s, l) => s + l.d.price * l.q, 0);
  const totals = () => {
    const sub = subtotal(), delivery = store_.mode === 'delivery' && sub > 0 && sub < 40 ? 4 : 0;
    const tax = sub * 0.08, tip = sub * (store_.tip / 100);
    return { sub, delivery, tax, tip, total: sub + delivery + tax + tip };
  };
  const saveCart = () => store.set('ss-cart', cart.items);

  const hoursFmt = (day) => HOURS[day] ? ((h) => (h > 12 ? h - 12 : h) + (h >= 12 ? ' pm' : ' am'))(HOURS[day][0]) + ' to ' + ((h) => (h > 12 ? h - 12 : h) + (h >= 12 ? ' pm' : ' am'))(HOURS[day][1]) : 'Closed';
  const openNow = () => {
    const n = new Date(), h = HOURS[n.getDay()], t = n.getHours() + n.getMinutes() / 60;
    if (h && t >= h[0] && t < h[1]) return { open: true, text: 'Open now until ' + ((x) => (x > 12 ? x - 12 : x) + ' pm')(h[1]) };
    for (let i = 1; i <= 7; i++) { const d = (n.getDay() + i) % 7; if (HOURS[d]) return { open: false, text: 'Closed. Opens ' + (i === 1 ? 'tomorrow' : DAYS[d]) + ' at 12 pm' }; }
    return { open: false, text: 'Closed' };
  };
  const isoDate = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const slotFull = (date, slot) => { let h = 0; (date + slot).split('').forEach((c) => { h = (h * 31 + c.charCodeAt(0)) % 997; }); return h % 5 === 0; };
  const slotsFor = (date) => {
    if (!date) return [];
    const day = new Date(date + 'T12:00:00').getDay();
    if (!HOURS[day]) return [];
    return SLOTS.filter((s) => Number(s.slice(0, 2)) < HOURS[day][1] - 1);
  };

  const carBtns = '<div class="car-btns"><button data-action="car" data-d="-1" aria-label="Previous">' + ARROW + '</button><button data-action="car" data-d="1" aria-label="Next">' + ARROW + '</button></div>';
  const head = (title, sub, crumbs) => `<div class="page-head"><div class="container"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a>${(crumbs || []).map((c) => ' / ' + c).join('')}</nav><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div></div>`;
  const quote = (r, i) => `<figure class="quote">${stars(r[3])}<blockquote>“${r[2]}”</blockquote><figcaption class="who"><span class="avatar" style="background:${shade(i * 60 + 10)}">${initials(r[0])}</span><span><b>${r[0]}</b><small>${r[1]}</small></span></figcaption></figure>`;
  const tagHTML = (d) => d.tags.map((t) => t === 'sp' ? '<span class="tag hot">Spicy</span>' : `<span class="tag green">${({ v: 'Vegetarian', vg: 'Vegan', gf: 'Gluten-free' })[t]}</span>`).join('');
  const dishCard = (d) => `<article class="card dish"><a href="#/dish/${d.id}" class="tile" style="background:${soft(d.hue)}" aria-label="${esc(d.name)}">${d.icon}</a><div class="body"><div class="top"><h3><a href="#/dish/${d.id}">${d.name}</a></h3><span class="price">${money(d.price)}</span></div><p class="desc">${d.desc}</p><div class="tags">${tagHTML(d)}</div><div class="foot"><span class="muted" style="font-size:13px">${d.cat}</span><button class="btn btn-primary btn-sm" data-action="add" data-id="${d.id}">Add to order</button></div></div></article>`;
  const postCard = (p) => `<a class="card post" href="#/journal/${p.id}"><div class="tile" style="background:${soft(p.hue)}">${p.icon}</div><div class="body"><span class="tag">${p.cat}</span><h3>${p.title}</h3><p class="muted">${p.ex}</p><small>${p.date} · ${p.read} min read</small></div></a>`;
  const galTile = (g, i) => `<button data-action="lb-open" data-i="${i}" aria-label="Open photo: ${esc(g[2])}"><div class="tile" style="background:${shade(g[1])};height:${[200, 260, 220][i % 3]}px">${g[0]}</div><span class="cap">${g[2]}</span></button>`;
  const faqList = (list) => list.map((f) => `<details class="acc"><summary>${f[1]}</summary><p>${f[2]}</p></details>`).join('');
  const bodyHTML = (arr) => arr.map((l) => l.startsWith('## ') ? `<h2>${l.slice(3)}</h2>` : `<p>${l}</p>`).join('');
  const cta = (t, p) => `<section class="section tight"><div class="container"><div class="cta"><h2>${t}</h2><p>${p}</p><a class="btn btn-light btn-lg" href="#/reserve">Reserve a Table ${ARROW}</a></div></div></section>`;
  const cartBar = () => { const n = cartCount(); return n ? `<a class="cartbar" href="#/order"><span>${n} item${n > 1 ? 's' : ''} · <b>${money(subtotal())}</b></span><span class="btn btn-primary btn-sm">View order ${ARROW}</span></a>` : ''; };

  /* ---------- Pages ---------- */
  const pages = {};

  pages.home = () => {
    const op = openNow();
    const fav = DISHES.filter((d) => d.pop);
    return `
    <section class="hero">
      <span class="float-emoji" aria-hidden="true">🍝</span><span class="float-emoji" aria-hidden="true">🍅</span><span class="float-emoji" aria-hidden="true">🌿</span>
      <div class="container hero-inner">
        <span class="eyebrow">Seasonal kitchen · Since 2012</span>
        <h1>Honest food, cooked slowly, shared warmly.</h1>
        <p class="lead">Local ingredients, wood-fired flavor and a dining room that feels like a friend's table. Come hungry.</p>
        <div class="hero-actions"><a class="btn btn-primary btn-lg" href="#/reserve">Book a Table</a><a class="btn btn-outline-light btn-lg" href="#/menu">Explore the Menu</a></div>
        <div class="open-pill"><span class="dot ${op.open ? 'on' : ''}"></span>${op.text}</div>
      </div>
    </section>
    <section class="section tight"><div class="container"><div class="stats" id="statsBar">
      <div class="stat"><b data-count="14">0</b><span>Years cooking</span></div>
      <div class="stat"><b data-count="86000" data-suffix="+">0</b><span>Guests served</span></div>
      <div class="stat"><b data-count="24">0</b><span>Dishes on the menu</span></div>
      <div class="stat"><b data-count="38" data-suffix="">0</b><span>Local farms and makers</span></div>
    </div></div></section>

    <section class="section alt"><div class="container">
      <div class="section-head row"><div><span class="eyebrow">Guest favorites</span><h2>What everyone orders</h2></div>${carBtns}</div>
      <div class="carousel">${fav.concat(DISHES.filter((d) => !d.pop).slice(0, 4)).map(dishCard).join('')}</div>
      <p class="center" style="margin-top:14px"><a class="btn btn-ghost" href="#/menu">See the full menu ${ARROW}</a></p>
    </div></section>

    <section class="section"><div class="container split">
      <div class="tile" style="height:420px;font-size:130px;background:${shade(25)}">🌿</div>
      <div><span class="eyebrow">Our story</span><h2>From a six-table kitchen to the neighborhood's dining room</h2>
        <p class="lead" style="margin:16px 0">We started with two cooks, one old oven and a simple promise: cook what is in season, and treat every guest like family.</p>
        <ul class="stack muted"><li>✔ Produce from farms less than an hour away</li><li>✔ Pasta rolled fresh every morning</li><li>✔ Vegetarian, vegan and gluten-free dishes on every course</li></ul>
        <p style="margin-top:24px"><a class="btn btn-primary" href="#/about">Read our story</a></p></div>
    </div></section>

    <section class="section alt"><div class="container">
      <div class="section-head"><span class="eyebrow">The menu</span><h2>Something for every appetite</h2><p>Five chapters, changing with the seasons.</p></div>
      <div class="grid-4" style="grid-template-columns:repeat(5,1fr)">${CATS.map((c, i) => `<a class="card lift center" href="#/menu/${slug(c)}" style="padding:26px 12px"><span class="emoji-xl">${CAT_ICON[c]}</span><h3>${c}</h3><small class="muted">${DISHES.filter((d) => d.cat === c).length} dishes</small></a>`).join('')}</div>
    </div></section>

    <section class="section"><div class="container">
      <div class="section-head row"><div><span class="eyebrow">Kind words</span><h2>Loved by our guests</h2></div>${carBtns}</div>
      <div class="carousel wide">${REVIEWS.map(quote).join('')}</div>
      <p class="center" style="margin-top:10px"><a class="btn btn-ghost" href="#/reviews">Read all reviews</a></p>
    </div></section>

    <section class="section alt"><div class="container">
      <div class="section-head row"><div><span class="eyebrow">Gather here</span><h2>Private events and tastings</h2></div><a class="btn btn-ghost" href="#/events">All events ${ARROW}</a></div>
      <div class="grid-3">${UPCOMING.slice(0, 3).map((e) => `<div class="card lift event-card"><span class="tag">${e[0]} ${e[1]}</span><h3>${e[2]}</h3><p class="muted">${e[3]}</p><b style="color:var(--primary)">${e[4]}</b></div>`).join('')}</div>
    </div></section>

    <section class="section"><div class="container">
      <div class="section-head row"><div><span class="eyebrow">A look inside</span><h2>Gallery</h2></div><a class="btn btn-ghost" href="#/gallery">See all photos ${ARROW}</a></div>
      <div class="grid-4" style="grid-template-columns:repeat(6,1fr);gap:12px">${GALLERY.slice(0, 6).map((g, i) => `<a class="tile" href="#/gallery" style="height:130px;font-size:44px;background:${shade(g[1])}" aria-label="${esc(g[2])}">${g[0]}</a>`).join('')}</div>
    </div></section>

    <section class="section alt"><div class="container">
      <div class="section-head row"><div><span class="eyebrow">Journal</span><h2>From the kitchen</h2></div><a class="btn btn-ghost" href="#/journal">All stories ${ARROW}</a></div>
      <div class="grid-3">${POSTS.slice(0, 3).map(postCard).join('')}</div>
    </div></section>

    ${cta('Save a seat at our table', 'Reservations open 60 days ahead. Walk-ins are always welcome at the bar.')}
    <section class="section tight"><div class="container narrow center"><h3>Get seasonal menus and event invites</h3><form class="newsletter" data-form="newsletter"><input type="email" required placeholder="you@email.com" aria-label="Email"><button class="btn btn-primary">Subscribe</button></form></div></section>`;
  };

  /* Menu */
  const menuMatches = () => DISHES.filter((d) => (store_.cat === 'All' || d.cat === store_.cat)
    && store_.diet.every((t) => d.tags.indexOf(t) > -1 || (t === 'v' && d.tags.indexOf('vg') > -1))
    && (!store_.q || (d.name + ' ' + d.desc).toLowerCase().indexOf(store_.q.toLowerCase()) > -1));
  function menuList() {
    const list = menuMatches();
    if (!list.length) return '<div class="empty"><span class="emoji-xl">🍽️</span><h3>No dishes match</h3><p>Try removing a filter or searching for something else.</p></div>';
    if (store_.cat !== 'All' || store_.q || store_.diet.length) return `<div class="grid-3">${list.map(dishCard).join('')}</div>`;
    return CATS.map((c) => `<h2 style="font-size:28px;margin:34px 0 18px">${CAT_ICON[c]} ${c}</h2><div class="grid-3">${list.filter((d) => d.cat === c).map(dishCard).join('')}</div>`).join('');
  }
  pages.menu = (arg) => {
    const hit = CATS.find((c) => slug(c) === arg);
    if (hit) store_.cat = hit;
    return `${head('Our menu', 'Seasonal dishes, made from scratch. Add what you like and order for pickup or delivery.', ['Menu'])}
    <section class="section tight"><div class="container">
      <div class="toolbar"><input class="search" data-filter="q" value="${esc(store_.q)}" placeholder="Search dishes" aria-label="Search dishes"><span class="muted" id="menuCount"></span></div>
      <div class="filters" id="catChips">${['All'].concat(CATS).map((c) => `<button class="chip ${store_.cat === c ? 'on' : ''}" data-action="menu-cat" data-v="${c}">${c}</button>`).join('')}</div>
      <div class="filters" id="dietChips">${DIETS.map((d) => `<button class="chip green ${store_.diet.indexOf(d[0]) > -1 ? 'on' : ''}" data-action="menu-diet" data-v="${d[0]}">${d[1]}</button>`).join('')}</div>
      <div id="menuList">${menuList()}</div>
      <p class="muted center" style="margin-top:30px;font-size:14px">Please tell your server about any allergies. Prices are in USD and exclude tax.</p>
    </div></section><div id="cartBar">${cartBar()}</div>`;
  };

  pages.dish = (id) => {
    const d = dishById(id);
    if (!d) return pages.notfound();
    const more = DISHES.filter((x) => x.cat === d.cat && x.id !== d.id).slice(0, 3);
    const q = cart.items[d.id] || 0;
    return `${head(d.name, d.desc, ['<a href="#/menu">Menu</a>', d.name])}
    <section class="section tight"><div class="container split" style="align-items:start">
      <div class="tile" style="height:420px;font-size:150px;background:${soft(d.hue)}">${d.icon}</div>
      <div class="stack"><div>${tagHTML(d)}<span class="tag">${d.cat}</span></div>
        <p class="lead">${d.desc}</p>
        <div style="font-family:var(--serif);font-size:38px;color:var(--primary);font-weight:700">${money(d.price)}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><button class="btn btn-primary btn-lg" data-action="add" data-id="${d.id}">Add to order</button><a class="btn btn-ghost btn-lg" href="#/order">${q ? q + ' in your order' : 'View order'}</a></div>
        <div class="box" style="margin-top:22px"><b>Good to know</b><p class="muted" style="margin-top:6px">Prepared to order, usually 15 to 25 minutes. Ask us to adjust spice or remove an ingredient and we will do our best.</p></div>
      </div></div></section>
    <section class="section alt"><div class="container"><div class="section-head row"><h2>More ${d.cat.toLowerCase()}</h2><a class="btn btn-ghost" href="#/menu/${slug(d.cat)}">See all</a></div><div class="grid-3">${more.map(dishCard).join('')}</div></div></section><div id="cartBar">${cartBar()}</div>`;
  };

  /* Order */
  const orderLines = () => {
    const ls = cartLines();
    if (!ls.length) return '<div class="empty"><span class="emoji-xl">🛍️</span><h3>Your order is empty</h3><p style="margin:6px 0 18px">Add a few dishes from the menu to get started.</p><a class="btn btn-primary" href="#/menu">Browse the menu</a></div>';
    return ls.map((l) => `<div class="line"><div class="tile" style="background:${soft(l.d.hue)}">${l.d.icon}</div><div><b>${l.d.name}</b><div class="muted" style="font-size:14px">${money(l.d.price)} each</div></div><div style="text-align:right"><div class="qty"><button data-action="qty" data-id="${l.d.id}" data-d="-1" aria-label="Remove one">−</button><span>${l.q}</span><button data-action="qty" data-id="${l.d.id}" data-d="1" aria-label="Add one">+</button></div><div style="margin-top:4px;font-weight:700">${money(l.d.price * l.q)}</div></div></div>`).join('');
  };
  const orderSum = () => {
    const t = totals();
    return `<div class="sum"><span>Subtotal</span><span>${money(t.sub)}</span></div>${store_.mode === 'delivery' ? `<div class="sum"><span>Delivery</span><span>${t.delivery ? money(t.delivery) : 'Free'}</span></div>` : ''}<div class="sum"><span>Tax (8%)</span><span>${money(t.tax)}</span></div><div class="sum"><span>Tip (${store_.tip}%)</span><span>${money(t.tip)}</span></div><div class="sum total"><span>Total</span><span>${money(t.total)}</span></div>`;
  };
  pages.order = () => {
    const empty = !cartCount();
    return `${head('Your order', 'Pickup in about 20 minutes, or delivery within three miles.', ['Order'])}
    <section class="section tight"><div class="container order-layout" ${empty ? 'style="grid-template-columns:1fr"' : ''}>
      <div class="box"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h3>Items</h3>${empty ? '' : '<button class="chip" data-action="clear">Clear all</button>'}</div><div id="orderLines">${orderLines()}</div><p style="margin-top:16px"><a href="#/menu" style="color:var(--primary);font-weight:600">+ Add more dishes</a></p></div>
      <form class="box stack" data-form="order" ${empty ? 'hidden' : ''} id="orderForm">
        <div class="seg" role="group" aria-label="Order type"><button type="button" data-action="mode" data-v="pickup" class="${store_.mode === 'pickup' ? 'on' : ''}">🥡 Pickup</button><button type="button" data-action="mode" data-v="delivery" class="${store_.mode === 'delivery' ? 'on' : ''}">🛵 Delivery</button></div>
        <div class="row2"><div class="field"><label>Name</label><input name="name" required placeholder="Jane Doe"></div><div class="field"><label>Phone</label><input name="phone" type="tel" required placeholder="(555) 123-4567"></div></div>
        <div class="field" id="addrField" ${store_.mode === 'delivery' ? '' : 'hidden'}><label>Delivery address</label><input name="address" placeholder="Street, apartment, city"></div>
        <div class="field"><label>Tip</label><div class="filters" id="tipChips" style="margin:0">${[0, 10, 15, 20].map((t) => `<button type="button" class="chip ${store_.tip === t ? 'on' : ''}" data-action="tip" data-v="${t}">${t}%</button>`).join('')}</div></div>
        <div class="field"><label>Notes for the kitchen (optional)</label><textarea name="notes" rows="2" placeholder="Allergies, spice level, utensils..."></textarea></div>
        <div id="orderSum">${orderSum()}</div>
        <button class="btn btn-primary btn-lg btn-block">Place order</button>
        <p class="muted center" style="font-size:13px">Demo only. No payment is taken and nothing is sent anywhere.</p>
      </form></div></section>`;
  };
  pages['order-done'] = () => {
    const o = store.get('ss-order', null);
    if (!o) return pages.notfound();
    return `<section class="section"><div class="container narrow center"><div class="success-ico">✓</div><h1 style="font-size:40px">Thank you, ${esc(o.name.split(' ')[0])}!</h1><p class="lead" style="margin:12px 0">Order <b>${esc(o.num)}</b> is in the kitchen. ${o.mode === 'delivery' ? 'It will arrive in about 45 minutes.' : 'It will be ready for pickup in about 20 minutes.'}</p>
      <div class="box receipt">${o.lines.map((l) => `<div><span>${l.q} × ${esc(l.name)}</span><span>${money(l.q * l.price)}</span></div>`).join('')}<div><span>Tax and tip</span><span>${money(o.tax + o.tip)}</span></div>${o.delivery ? `<div><span>Delivery</span><span>${money(o.delivery)}</span></div>` : ''}<div><b>Total</b><b>${money(o.total)}</b></div></div>
      <p style="margin-top:26px"><a class="btn btn-primary btn-lg" href="#/menu">Order something else</a></p></div></section>`;
  };

  /* Reservations */
  const slotChips = (date) => {
    const day = date ? new Date(date + 'T12:00:00').getDay() : -1;
    if (day >= 0 && !HOURS[day]) return '<p class="muted">We are closed on Mondays. Please pick another day.</p>';
    return slotsFor(date).map((s) => { const full = slotFull(date, s); return `<button type="button" class="chip ${store_.slot === s ? 'on' : ''}" data-action="slot" data-v="${s}" ${full ? 'disabled title="Fully booked"' : ''}>${s}</button>`; }).join('');
  };
  pages.reserve = () => {
    const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    const min = isoDate(new Date()), def = isoDate(tmr), max = isoDate(new Date(Date.now() + 60 * 864e5));
    store_.slot = '';
    return `${head('Reserve a table', 'Choose a date and time, and we will hold your table for 15 minutes.', ['Reservations'])}
    <section class="section tight"><div class="container order-layout">
      <form class="box stack" data-form="reserve" id="resForm">
        <div class="row2"><div class="field"><label>Date</label><input type="date" name="date" id="rdate" required min="${min}" max="${max}" value="${def}"></div><div class="field"><label>Party size</label><select name="size">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} ${n === 1 ? 'guest' : 'guests'}</option>`).join('')}</select></div></div>
        <div class="field"><label>Time</label><div class="slots" id="slots">${slotChips(def)}</div></div>
        <div class="row2"><div class="field"><label>Name</label><input name="name" required placeholder="Jane Doe"></div><div class="field"><label>Phone</label><input name="phone" type="tel" required placeholder="(555) 123-4567"></div></div>
        <div class="field"><label>Email</label><input name="email" type="email" required placeholder="you@email.com"></div>
        <div class="field"><label>Occasion (optional)</label><select name="occasion"><option value="">None</option><option>Birthday</option><option>Anniversary</option><option>Business meal</option><option>Date night</option></select></div>
        <div class="field"><label>Requests (optional)</label><textarea name="notes" rows="2" placeholder="Allergies, high chair, window table..."></textarea></div>
        <button class="btn btn-primary btn-lg btn-block">Confirm reservation</button>
        <p class="muted center" style="font-size:13px">For groups of 9 or more, use our <a href="#/events" style="color:var(--primary);font-weight:600">events page</a>.</p>
      </form>
      <aside class="stack"><div class="box"><h3>Opening hours</h3>${hoursTable()}</div><div class="box"><h3>Good to know</h3><p class="muted" style="margin-top:8px">Tables are held for 15 minutes. Cancel at least 4 hours ahead and we will happily rebook you. Walk-ins are welcome at the bar.</p></div></aside>
    </div></section>`;
  };
  pages['reserve-done'] = () => {
    const r = store.get('ss-res', null);
    if (!r) return pages.notfound();
    const when = new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return `<section class="section"><div class="container narrow center"><div class="success-ico">✓</div><h1 style="font-size:40px">You are booked, ${esc(r.name.split(' ')[0])}!</h1><p class="lead" style="margin:12px 0">We sent a confirmation to ${esc(r.email)}. See you soon.</p>
      <div class="box receipt"><div><span>Date</span><b>${when}</b></div><div><span>Time</span><b>${esc(r.time)}</b></div><div><span>Party size</span><b>${esc(r.size)}</b></div><div><span>Confirmation</span><b>${esc(r.code)}</b></div>${r.occasion ? `<div><span>Occasion</span><b>${esc(r.occasion)}</b></div>` : ''}</div>
      <p style="margin-top:26px"><a class="btn btn-primary btn-lg" href="#/menu">Preview the menu</a></p></div></section>`;
  };
  const hoursTable = () => `<table class="hours">${[2, 3, 4, 5, 6, 0, 1].map((d) => `<tr class="${new Date().getDay() === d ? 'today' : ''}"><td>${DAYS[d]}</td><td>${hoursFmt(d)}</td></tr>`).join('')}</table>`;

  /* Gallery */
  const galList = () => GALLERY.map((g, i) => [g, i]).filter((x) => store_.gal === 'All' || x[0][3] === store_.gal).map((x) => galTile(x[0], x[1])).join('');
  pages.gallery = () => `${head('Gallery', 'A look at the food, the room and the people behind it.', ['Gallery'])}
    <section class="section tight"><div class="container"><div class="filters" id="galChips">${GAL_CATS.map((c) => `<button class="chip ${store_.gal === c ? 'on' : ''}" data-action="gal" data-v="${c}">${c}</button>`).join('')}</div><div class="gallery" id="galList">${galList()}</div></div></section>`;

  /* About */
  pages.about = () => `${head('Our story', 'Fourteen years of cooking with the seasons.', ['About'])}
    <section class="section"><div class="container split"><div><span class="eyebrow">Who we are</span><h2>A neighborhood kitchen with big roots</h2><p class="lead" style="margin:16px 0">Saffron &amp; Sage began with a few tables, a wood oven and a belief that good food should feel generous.</p><p class="muted">We buy from farms and makers we know by name, bake our bread every morning and change the menu when the produce does. It keeps us curious, and it keeps the food honest.</p></div><div class="tile" style="height:360px;font-size:120px;background:${shade(160)}">🍞</div></div></section>
    <section class="section alt"><div class="container"><div class="section-head"><span class="eyebrow">What we believe</span><h2>Our values</h2></div><div class="grid-3">${[['🌱', 'Seasonal first', 'We cook what is ripe, local and at its best right now.'], ['🤝', 'Know your farmer', 'Thirty-eight farms and makers supply our kitchen.'], ['❤️', 'Generous service', 'Everyone gets a seat at the table, and a warm welcome.']].map((v) => `<div class="card lift event-card"><span class="ico">${v[0]}</span><h3>${v[1]}</h3><p class="muted">${v[2]}</p></div>`).join('')}</div></div></section>
    <section class="section"><div class="container narrow"><div class="section-head"><h2>Our journey</h2></div><div class="timeline">${TIMELINE.map((t) => `<div><b>${t[0]}</b><p class="muted">${t[1]}</p></div>`).join('')}</div></div></section>
    <section class="section alt"><div class="container"><div class="section-head"><span class="eyebrow">The team</span><h2>The people behind the pass</h2></div><div class="grid-4">${TEAM.map((m) => `<div class="card center" style="padding:26px 16px"><span class="avatar" style="width:84px;height:84px;font-size:26px;margin:0 auto 14px;background:${shade(m[2])}">${initials(m[0])}</span><h3>${m[0]}</h3><p class="muted">${m[1]}</p></div>`).join('')}</div></div></section>
    ${cta('Come and say hello', 'We would love to cook for you. Tables fill quickly on weekends.')}`;

  /* Events */
  pages.events = () => `${head('Private events', 'Celebrate with us. We handle the menu, the room and the details.', ['Events'])}
    <section class="section tight"><div class="container"><div class="grid-4">${EVENT_TYPES.map((e) => `<div class="card lift event-card"><span class="ico">${e[0]}</span><h3>${e[1]}</h3><p class="muted">${e[2]}</p><span class="tag">${e[3]}</span><b style="color:var(--primary)">From $${e[4]} per guest</b></div>`).join('')}</div></div></section>
    <section class="section alt"><div class="container narrow"><div class="section-head"><span class="eyebrow">On the calendar</span><h2>Upcoming events</h2></div>${UPCOMING.map((e) => `<div class="date-row"><div class="date-badge"><b>${e[0]}</b><span>${e[1]}</span></div><div><h3>${e[2]}</h3><p class="muted">${e[3]}</p></div><a class="btn btn-ghost btn-sm" href="#/reserve">${e[4]}</a></div>`).join('')}</div></section>
    <section class="section"><div class="container narrow"><form class="box stack" data-form="events"><h2 style="font-size:28px" class="center">Plan your event</h2><p class="muted center">Tell us a little and we will reply within one business day.</p>
      <div class="row2"><div class="field"><label>Name</label><input required placeholder="Jane Doe"></div><div class="field"><label>Email</label><input type="email" required placeholder="you@email.com"></div></div>
      <div class="row2"><div class="field"><label>Event type</label><select>${EVENT_TYPES.map((e) => `<option>${e[1]}</option>`).join('')}</select></div><div class="field"><label>Guests</label><input type="number" min="8" max="80" value="20"></div></div>
      <div class="field"><label>Date and details</label><textarea rows="3" placeholder="Preferred date, budget, dietary needs..."></textarea></div><button class="btn btn-primary btn-lg btn-block">Send inquiry</button></form></div></section>`;

  /* Journal */
  pages.journal = (id) => {
    if (id) {
      const p = POSTS.find((x) => x.id === Number(id));
      if (!p) return pages.notfound();
      const more = POSTS.filter((x) => x.id !== p.id).slice(0, 3);
      return `${head(p.title, `${p.date} · ${p.read} min read · ${p.cat}`, ['<a href="#/journal">Journal</a>', p.cat])}<section class="section tight"><div class="container narrow article"><div class="tile article-cover" style="background:${soft(p.hue)}">${p.icon}</div>${bodyHTML(p.body)}<p style="margin-top:30px"><a class="btn btn-ghost" href="#/journal">← All stories</a></p></div></section><section class="section alt"><div class="container"><div class="section-head"><h2>Keep reading</h2></div><div class="grid-3">${more.map(postCard).join('')}</div></div></section>`;
    }
    return `${head('Journal', 'Recipes, stories and news from the kitchen.', ['Journal'])}<section class="section tight"><div class="container"><div class="grid-3">${POSTS.map(postCard).join('')}</div></div></section>`;
  };

  /* Reviews */
  pages.reviews = () => `${head('Guest reviews', 'What people say after dinner.', ['Reviews'])}
    <section class="section tight"><div class="container"><div class="box score"><div class="center"><div class="big">4.8</div>${stars(5)}<p class="muted">Based on 1,240 reviews</p></div><div id="bars">${[[5, 82], [4, 13], [3, 3], [2, 1], [1, 1]].map((r) => `<div class="bar-row"><span>${r[0]} ★</span><div class="bar"><i data-w="${r[1]}"></i></div><span>${r[1]}%</span></div>`).join('')}</div></div>
      <div class="grid-3" style="margin-top:28px">${REVIEWS.concat(REVIEWS.slice(0, 3).map((r, i) => [r[0].split(' ')[0] + ' P.', 'Verified guest', ['Everything arrived hot and the portions were generous.', 'Friendly staff and a lovely, relaxed atmosphere.', 'We booked on short notice and they still found us a table.'][i], 5 - (i === 1 ? 1 : 0)])).map(quote).join('')}</div></div></section>${cta('Taste it yourself', 'Book a table and tell us what you think.')}`;

  /* Gift cards */
  pages.gift = () => `${head('Gift cards', 'Give a meal they will remember. Delivered by email in minutes, never expires.', ['Gift cards'])}
    <section class="section tight"><div class="container order-layout"><form class="box stack" data-form="gift"><div class="field"><label>Choose an amount</label><div class="amounts" id="amounts">${[25, 50, 100, 200].map((a) => `<button type="button" class="chip ${store_.amt === a ? 'on' : ''}" data-action="amt" data-v="${a}">$${a}</button>`).join('')}</div></div>
      <div class="row2"><div class="field"><label>Your name</label><input name="from" required placeholder="Jane Doe"></div><div class="field"><label>Recipient name</label><input name="to" required placeholder="Alex Smith"></div></div>
      <div class="field"><label>Recipient email</label><input type="email" name="email" required placeholder="alex@email.com"></div>
      <div class="field"><label>Message (optional)</label><textarea name="msg" rows="3" placeholder="Happy birthday! Dinner is on me."></textarea></div>
      <button class="btn btn-primary btn-lg btn-block">Buy gift card</button><p class="muted center" style="font-size:13px">Demo only. No payment is taken.</p></form>
      <aside class="stack"><div class="giftcard"><span>🌿 Saffron &amp; Sage</span><b id="giftAmt">$${store_.amt}</b><span>Gift card · never expires</span></div></aside></div></section>`;
  pages['gift-done'] = () => {
    const g = store.get('ss-gift', null);
    if (!g) return pages.notfound();
    return `<section class="section"><div class="container narrow center"><div class="success-ico">🎁</div><h1 style="font-size:38px">Gift card ready</h1><p class="lead" style="margin:12px 0">A $${g.amt} card for ${esc(g.to)} is on its way to ${esc(g.email)}.</p><div class="code-box">${esc(g.code)}</div><p class="muted">Demo code. Nothing was charged or sent.</p><p style="margin-top:22px"><a class="btn btn-primary btn-lg" href="#/">Back home</a></p></div></section>`;
  };

  /* Contact */
  pages.contact = () => `${head('Contact us', 'Questions, feedback or a table for tonight. We are here.', ['Contact'])}
    <section class="section tight"><div class="container order-layout">
      <div class="stack"><div class="grid-2">${[['📍', 'Visit', '214 Olive Street<br>Springfield, CA 90210'], ['📞', 'Call', '(555) 014-2290<br>Daily during opening hours'], ['✉️', 'Email', 'hello@saffronandsage.example'], ['🚗', 'Parking', 'Free lot behind the restaurant and street parking']].map((c) => `<div class="box info-card"><span class="ico">${c[0]}</span><div><b>${c[1]}</b><p class="muted">${c[2]}</p></div></div>`).join('')}</div><div class="map">Map placeholder · add your embed here</div></div>
      <div class="stack"><div class="box"><h3>Opening hours</h3>${hoursTable()}</div>
      <form class="box stack" data-form="contact"><h3>Send a message</h3><div class="field"><label>Name</label><input required></div><div class="field"><label>Email</label><input type="email" required></div><div class="field"><label>Message</label><textarea rows="3" required></textarea></div><button class="btn btn-primary btn-block">Send message</button></form></div>
    </div></section>`;

  pages.faq = () => {
    const groups = Array.from(new Set(FAQ.map((f) => f[0])));
    return `${head('FAQ', 'Quick answers about reservations, the menu and ordering.', ['FAQ'])}<section class="section tight"><div class="container narrow">${groups.map((g) => `<h3 class="faq-group">${g}</h3>${faqList(FAQ.filter((f) => f[0] === g))}`).join('')}<div class="box center" style="margin-top:34px"><h3>Still have a question?</h3><p class="muted" style="margin:6px 0 16px">We are happy to help.</p><a class="btn btn-primary" href="#/contact">Contact us</a></div></div></section>`;
  };
  const legal = (t, b) => `${head(t, 'Sample text. Replace it with your own policy before going live.', [t])}<section class="section tight"><div class="container narrow box article">${b}</div></section>`;
  pages.privacy = () => legal('Privacy policy', '<h2>What we collect</h2><p>This demo stores your order, reservation and gift card only in your own browser. Nothing is sent to a server.</p><h2>Your choices</h2><p>Clear your browser storage at any time to remove this data.</p>');
  pages.terms = () => legal('Terms of service', '<h2>Using this site</h2><p>This is a free template. Dishes, prices, events and reviews are fictional examples.</p><h2>No warranty</h2><p>Replace this text with your own terms before going live.</p>');
  pages.notfound = () => '<section class="section"><div class="container narrow center"><div class="empty"><span class="emoji-xl">🍽️</span><h1>Page not found</h1><p class="lead" style="margin:10px 0 20px">The page you are looking for is not on the menu.</p><a class="btn btn-primary btn-lg" href="#/">Back home</a></div></div></section>';

  /* ---------- Router ---------- */
  const TITLES = { menu: 'Menu', dish: 'Menu', order: 'Your order', 'order-done': 'Order confirmed', reserve: 'Reservations', 'reserve-done': 'Reservation confirmed', gallery: 'Gallery', about: 'Our story', events: 'Private events', journal: 'Journal', reviews: 'Reviews', gift: 'Gift cards', 'gift-done': 'Gift card', contact: 'Contact', faq: 'FAQ', privacy: 'Privacy policy', terms: 'Terms of service', notfound: 'Page not found' };
  const ROUTE_GROUP = { dish: 'menu', 'order-done': 'order', 'reserve-done': 'reserve', reviews: 'about', 'gift-done': 'gift' };
  function render(keepScroll) {
    const y = window.scrollY;
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
    let key = parts[0] || 'home';
    if (!pages[key]) key = 'notfound';
    if (key === 'menu' && !parts[1] && !keepScroll) { store_.cat = 'All'; }
    $('#view').innerHTML = pages[key](parts[1]);
    document.title = (TITLES[key] ? TITLES[key] + ' | ' : '') + 'Saffron & Sage';
    const group = ROUTE_GROUP[key] || key;
    $$('[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === group));
    document.body.classList.remove('nav-open');
    closeLightbox();
    updateCart();
    updateMenuCount();
    window.scrollTo(0, keepScroll ? y : 0);
    if (key === 'home') startCounters();
    if (key === 'reviews') animateBars();
  }

  function updateCart() {
    const n = cartCount(), el = $('#cartCount');
    el.textContent = n;
    el.classList.toggle('zero', n === 0);
    const bar = $('#cartBar');
    if (bar) bar.innerHTML = cartBar();
  }
  function updateMenuCount() {
    const el = $('#menuCount');
    if (el) el.textContent = menuMatches().length + ' dishes';
  }
  function refreshMenu() {
    $('#menuList').innerHTML = menuList();
    $$('[data-action="menu-cat"]').forEach((b) => b.classList.toggle('on', b.dataset.v === store_.cat));
    $$('[data-action="menu-diet"]').forEach((b) => b.classList.toggle('on', store_.diet.indexOf(b.dataset.v) > -1));
    updateMenuCount();
  }
  function refreshOrder() {
    const lines = $('#orderLines');
    if (!lines) return;
    lines.innerHTML = orderLines();
    $('#orderSum').innerHTML = orderSum();
    $('#orderForm').hidden = !cartCount();
    lines.closest('.order-layout').style.gridTemplateColumns = cartCount() ? '' : '1fr';
    $$('[data-action="mode"]').forEach((b) => b.classList.toggle('on', b.dataset.v === store_.mode));
    $$('[data-action="tip"]').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === store_.tip));
    $('#addrField').hidden = store_.mode !== 'delivery';
  }

  function startCounters() {
    const bar = $('#statsBar');
    if (!bar) return;
    const run = () => $$('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count), suffix = el.dataset.suffix || '', t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1400);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US') + (k === 1 ? suffix : '');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (!('IntersectionObserver' in window)) { run(); return; }
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(bar);
  }
  function animateBars() {
    const set = () => $$('.bar i').forEach((b) => { b.style.width = b.dataset.w + '%'; });
    const box = $('#bars');
    if (!box || !('IntersectionObserver' in window)) { set(); return; }
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { set(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(box);
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(i) {
    const list = GALLERY.map((g, n) => [g, n]).filter((x) => store_.gal === 'All' || x[0][3] === store_.gal).map((x) => x[1]);
    if (list.indexOf(i) < 0) return;
    store_.lb = i;
    const g = GALLERY[i], pos = list.indexOf(i);
    const lb = $('#lightbox');
    lb.hidden = false;
    lb.innerHTML = `<button class="lb-btn lb-close" data-action="lb-close" aria-label="Close">✕</button><button class="lb-btn lb-prev" data-action="lb-step" data-d="-1" aria-label="Previous">‹</button><div class="lb-card" role="dialog" aria-modal="true" aria-label="${esc(g[2])}"><div class="tile" style="background:${shade(g[1])}">${g[0]}</div><p>${g[2]} <span style="opacity:.6">· ${pos + 1} of ${list.length}</span></p></div><button class="lb-btn lb-next" data-action="lb-step" data-d="1" aria-label="Next">›</button>`;
  }
  function closeLightbox() {
    const lb = $('#lightbox');
    if (lb && !lb.hidden) { lb.hidden = true; lb.innerHTML = ''; store_.lb = -1; }
  }
  function stepLightbox(d) {
    const list = GALLERY.map((g, n) => [g, n]).filter((x) => store_.gal === 'All' || x[0][3] === store_.gal).map((x) => x[1]);
    if (!list.length || store_.lb < 0) return;
    openLightbox(list[(list.indexOf(store_.lb) + d + list.length) % list.length]);
  }

  /* ---------- Events ---------- */
  const actions = {
    'nav-toggle': () => document.body.classList.toggle('nav-open'),
    'ui-close': () => document.body.classList.remove('nav-open'),
    car: (el) => { const c = el.closest('.section').querySelector('.carousel'); c.scrollBy({ left: Number(el.dataset.d) * (c.firstElementChild.offsetWidth + 22) * 2, behavior: 'smooth' }); },
    add: (el) => {
      const d = dishById(el.dataset.id);
      cart.items[d.id] = (cart.items[d.id] || 0) + 1;
      saveCart(); updateCart();
      toast('Added ' + d.name);
    },
    qty: (el) => {
      const id = el.dataset.id, n = (cart.items[id] || 0) + Number(el.dataset.d);
      if (n <= 0) delete cart.items[id]; else cart.items[id] = n;
      saveCart(); updateCart(); refreshOrder();
    },
    clear: () => { cart.items = {}; saveCart(); updateCart(); render(true); },
    mode: (el) => { store_.mode = el.dataset.v; store.set('ss-mode', store_.mode); refreshOrder(); },
    tip: (el) => { store_.tip = Number(el.dataset.v); store.set('ss-tip', store_.tip); refreshOrder(); },
    'menu-cat': (el) => { store_.cat = el.dataset.v; refreshMenu(); },
    'menu-diet': (el) => {
      const v = el.dataset.v, i = store_.diet.indexOf(v);
      if (i > -1) store_.diet.splice(i, 1); else store_.diet.push(v);
      refreshMenu();
    },
    slot: (el) => { store_.slot = el.dataset.v; $$('[data-action="slot"]').forEach((b) => b.classList.toggle('on', b === el)); },
    gal: (el) => { store_.gal = el.dataset.v; $$('[data-action="gal"]').forEach((b) => b.classList.toggle('on', b === el)); $('#galList').innerHTML = galList(); },
    'lb-open': (el) => openLightbox(Number(el.dataset.i)),
    'lb-close': () => closeLightbox(),
    'lb-step': (el) => stepLightbox(Number(el.dataset.d)),
    amt: (el) => { store_.amt = Number(el.dataset.v); $$('[data-action="amt"]').forEach((b) => b.classList.toggle('on', b === el)); $('#giftAmt').textContent = '$' + store_.amt; }
  };
  document.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') { closeLightbox(); return; }
    const el = e.target.closest('[data-action]');
    if (el && actions[el.dataset.action]) { e.preventDefault(); actions[el.dataset.action](el, e); return; }
    if (e.target.closest('.nav a')) document.body.classList.remove('nav-open');
  });
  document.addEventListener('input', (e) => {
    if (e.target.dataset && e.target.dataset.filter === 'q') { store_.q = e.target.value; refreshMenu(); }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'rdate') { store_.slot = ''; $('#slots').innerHTML = slotChips(e.target.value); }
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form, d = new FormData(form);
    if (kind === 'order') {
      if (!cartCount()) { toast('Your order is empty.'); return; }
      if (store_.mode === 'delivery' && !String(d.get('address')).trim()) { toast('Please add a delivery address.'); return; }
      const t = totals();
      store.set('ss-order', { num: 'SS-' + (1000 + Math.floor(Math.random() * 9000)), name: String(d.get('name')), mode: store_.mode, lines: cartLines().map((l) => ({ q: l.q, name: l.d.name, price: l.d.price })), tax: t.tax, tip: t.tip, delivery: t.delivery, total: t.total });
      cart.items = {}; saveCart();
      location.hash = '#/order-done';
    } else if (kind === 'reserve') {
      if (!store_.slot) { toast('Please choose a time.'); return; }
      store.set('ss-res', { name: String(d.get('name')), email: String(d.get('email')), date: String(d.get('date')), time: store_.slot, size: String(d.get('size')), occasion: String(d.get('occasion')), code: 'RES-' + (100 + Math.floor(Math.random() * 900)) });
      location.hash = '#/reserve-done';
    } else if (kind === 'gift') {
      store.set('ss-gift', { amt: store_.amt, to: String(d.get('to')), email: String(d.get('email')), code: 'SAGE-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase() });
      location.hash = '#/gift-done';
    } else if (kind === 'newsletter') { toast('Subscribed. Thanks!'); form.reset(); }
    else if (kind === 'events') { toast('Inquiry sent. We will reply within one business day.'); form.reset(); }
    else { toast('Message sent. We will reply soon.'); form.reset(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { document.body.classList.remove('nav-open'); closeLightbox(); }
    if (store_.lb >= 0) { if (e.key === 'ArrowLeft') stepLightbox(-1); if (e.key === 'ArrowRight') stepLightbox(1); }
  });

  window.addEventListener('hashchange', () => render());
  render();
})();
