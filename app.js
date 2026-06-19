document.addEventListener('DOMContentLoaded', () => {
  // === STATE ===
  let cart = [];
  let strokes = []; // For Patina Sandbox: Array of { points: [{x, y}], alpha: number, color: string }
  let isDrawing = false;
  let currentStroke = null;

  // === DOM ELEMENTS ===
  const body = document.body;
  const themeBtns = document.querySelectorAll('.theme-btn');
  const patinaCanvas = document.getElementById('patina-canvas');
  const polishBtn = document.getElementById('polish-btn');
  const scratchDemoBtn = document.getElementById('scratch-demo-btn');
  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const cartCount = document.querySelector('.cart-count');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalOverlay = document.getElementById('modal-overlay');
  const checkoutForm = document.getElementById('checkout-form');
  const toast = document.getElementById('toast');
  
  // Autocomplete
  const cityInput = document.getElementById('client-city');
  const cityDropdown = document.getElementById('city-autocomplete');
  const branchInput = document.getElementById('client-branch');
  const checkoutSummaryList = document.getElementById('checkout-summary-list');
  
  // Filters & Accordions
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  const faqItems = document.querySelectorAll('.faq-item');
  const collectionLinks = document.querySelectorAll('.collection-link');

  // === NOVO POSHTA MOCK DATA ===
  const citiesData = {
    "Львів": [
      "Відділення №1: вул. Городоцька, 359",
      "Відділення №3: вул. Угорська, 22",
      "Відділення №15: вул. Зелена, 147",
      "Поштомат №4531: вул. Шевченка, 60"
    ],
    "Київ": [
      "Відділення №1: вул. Пирогівський шлях, 135",
      "Відділення №50: вул. Антоновича, 40",
      "Відділення №100: вул. Хрещатик, 15",
      "Поштомат №8000: вул. Велика Васильківська, 23"
    ],
    "Одеса": [
      "Відділення №1: вул. Базова, 16",
      "Відділення №10: вул. Середньофонтанська, 26",
      "Поштомат №9230: вул. Дерибасівська, 14"
    ],
    "Дніпро": [
      "Відділення №1: вул. Маршала Малиновського, 114",
      "Відділення №22: пр-т Яворницького, 65"
    ],
    "Харків": [
      "Відділення №1: вул. Польова, 67",
      "Відділення №12: вул. Пушкінська, 54"
    ]
  };

  // === THEME SWITCHER ===
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const themeVal = btn.getAttribute('data-theme-val');
      body.setAttribute('data-theme', themeVal);
      
      showToast(`Активовано тему: ${btn.title}`);
      initCanvasBackground();
    });
  });

  // === PRODUCT FILTERS ===
  function applyFilter(filterValue) {
    productCards.forEach(card => {
      const category = card.getAttribute('data-category');
      if (filterValue === 'all' || category === filterValue) {
        card.style.display = 'flex';
        card.style.animation = 'fadeInUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards';
      } else {
        card.style.display = 'none';
      }
    });

    // Update active state in catalog header filter buttons
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-filter') === filterValue) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterValue = btn.getAttribute('data-filter');
      applyFilter(filterValue);
    });
  });

  // Direct Collection category link clicking
  collectionLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filterValue = link.getAttribute('data-filter');
      applyFilter(filterValue);
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // === TOAST NOTIFICATION ===
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 2500);
  }

  // === INTERACTIVE PATINA CANVAS SANDBOX ===
  const ctx = patinaCanvas.getContext('2d');
  
  function resizeCanvas() {
    const rect = patinaCanvas.parentElement.getBoundingClientRect();
    patinaCanvas.width = rect.width;
    patinaCanvas.height = rect.height;
    initCanvasBackground();
    drawAllStrokes();
  }
  
  window.addEventListener('resize', resizeCanvas);
  
  function getLeatherColor() {
    const currentTheme = body.getAttribute('data-theme');
    switch (currentTheme) {
      case 'A': return { bg: '#2B1A13', stamp: '#180E0A', scratch: 'rgba(235, 215, 195, 0.28)' }; // Deep Dark Espresso
      case 'B': return { bg: '#473228', stamp: '#281912', scratch: 'rgba(240, 225, 205, 0.32)' }; // Reddish saddle
      case 'C': return { bg: '#22242B', stamp: '#111216', scratch: 'rgba(225, 175, 150, 0.26)' }; // Dark Obsidian
      case 'D': return { bg: '#331F14', stamp: '#1E120C', scratch: 'rgba(245, 225, 205, 0.30)' }; // Dark glassmorphic saddle
      default: return { bg: '#2B1A13', stamp: '#180E0A', scratch: 'rgba(235, 215, 195, 0.28)' };
    }
  }

  function initCanvasBackground() {
    const colors = getLeatherColor();
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, patinaCanvas.width, patinaCanvas.height);
    
    // Noise/grain
    for (let i = 0; i < patinaCanvas.width; i += 4) {
      for (let j = 0; j < patinaCanvas.height; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
          ctx.fillRect(i, j, 2, 2);
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    // Stamp
    ctx.save();
    ctx.strokeStyle = colors.stamp;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(patinaCanvas.width / 2 - 130, patinaCanvas.height / 2 - 60, 260, 120);
    
    ctx.fillStyle = colors.stamp;
    ctx.font = 'normal 500 16px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.2em';
    ctx.fillText('CRAZY HORSE LEATHER', patinaCanvas.width / 2, patinaCanvas.height / 2 - 15);
    ctx.font = 'normal 700 11px "Manrope", sans-serif';
    ctx.fillText('HANDMADE CRAFT WORKSHOP', patinaCanvas.width / 2, patinaCanvas.height / 2 + 15);
    ctx.font = 'italic 400 11px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('Genuine Craftsmanship', patinaCanvas.width / 2, patinaCanvas.height / 2 + 35);
    ctx.restore();
  }

  function drawAllStrokes() {
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color.replace('0.28', stroke.alpha).replace('0.32', stroke.alpha).replace('0.26', stroke.alpha);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  function getMousePos(e) {
    const rect = patinaCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (patinaCanvas.width / rect.width),
      y: (clientY - rect.top) * (patinaCanvas.height / rect.height)
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getMousePos(e);
    const colors = getLeatherColor();
    currentStroke = {
      points: [pos],
      alpha: 1.0,
      color: colors.scratch
    };
    strokes.push(currentStroke);
  }

  function draw(e) {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const pos = getMousePos(e);
    currentStroke.points.push(pos);
    
    const colors = getLeatherColor();
    const len = currentStroke.points.length;
    if (len > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = colors.scratch;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.moveTo(currentStroke.points[len - 2].x, currentStroke.points[len - 2].y);
      ctx.lineTo(currentStroke.points[len - 1].x, currentStroke.points[len - 1].y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function endDraw() {
    isDrawing = false;
    currentStroke = null;
  }

  patinaCanvas.addEventListener('mousedown', startDraw);
  patinaCanvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', endDraw);

  patinaCanvas.addEventListener('touchstart', startDraw, { passive: false });
  patinaCanvas.addEventListener('touchmove', draw, { passive: false });
  window.addEventListener('touchend', endDraw);

  scratchDemoBtn.addEventListener('click', () => {
    const colors = getLeatherColor();
    const demoStrokes = [
      { x1: 60, y1: 90, x2: 260, y2: 130 },
      { x1: 110, y1: 290, x2: 310, y2: 230 },
      { x1: 460, y1: 100, x2: 360, y2: 270 },
      { x1: 190, y1: 160, x2: 410, y2: 190 }
    ];

    demoStrokes.forEach(s => {
      const stroke = {
        points: [{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }],
        alpha: 0.8,
        color: colors.scratch
      };
      strokes.push(stroke);
    });

    initCanvasBackground();
    drawAllStrokes();
    showToast("Нанесено малюнок патини");
  });

  polishBtn.addEventListener('click', () => {
    if (strokes.length === 0) {
      showToast("Шкіра вже ідеально відполірована!");
      return;
    }

    let frame = 0;
    function fade() {
      frame++;
      let stillVisible = false;
      
      strokes.forEach(stroke => {
        stroke.alpha -= 0.08;
        if (stroke.alpha > 0) stillVisible = true;
      });

      initCanvasBackground();
      drawAllStrokes();

      if (stillVisible && frame < 30) {
        requestAnimationFrame(fade);
      } else {
        strokes = [];
        initCanvasBackground();
        showToast("Відполіровано восковим бальзамом");
      }
    }
    fade();
  });

  setTimeout(resizeCanvas, 150);

  // === SHOPPING CART DRAWER ===
  function toggleCart(open = true) {
    if (open) {
      cartDrawer.classList.add('active');
      renderCart();
    } else {
      cartDrawer.classList.remove('active');
    }
  }

  openCartBtn.addEventListener('click', () => toggleCart(true));
  closeCartBtn.addEventListener('click', () => toggleCart(false));
  cartOverlay.addEventListener('click', () => toggleCart(false));

  // Add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseInt(btn.getAttribute('data-price'));
      const img = btn.getAttribute('data-img');
      
      addToCart(id, name, price, img);
    });
  });

  // Cart Upsells Binding
  document.querySelectorAll('.add-upsell-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseInt(btn.getAttribute('data-price'));
      const img = btn.getAttribute('data-img');
      
      addToCart(id, name, price, img);
      renderCart(); // Force render to refresh quantity and values immediately
    });
  });

  function addToCart(id, name, price, img) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ id, name, price, img, qty: 1 });
    }
    updateCartCount();
    showToast(`«${name}» додано до кошика`);
  }

  function updateCartCount() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalQty;
    
    openCartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
      openCartBtn.style.transform = 'scale(1)';
    }, 200);
  }

  function renderCart() {
    cartItemsContainer.innerHTML = '';
    
    // If cart is empty, show empty message and hide upsells list to clean up UI
    const upsellWrapper = document.getElementById('cart-upsell-wrapper');
    
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="empty-cart-message">Ваш кошик порожній.</div>';
      cartTotalPrice.textContent = '0 грн';
      checkoutBtn.disabled = true;
      if (upsellWrapper) upsellWrapper.style.display = 'none';
      return;
    }

    if (upsellWrapper) upsellWrapper.style.display = 'block';
    checkoutBtn.disabled = false;
    let total = 0;
    
    cart.forEach(item => {
      total += item.price * item.qty;
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      
      // Handle fallback or placeholder images cleanly
      const imageSrc = item.img.startsWith('http') ? 'https://placehold.co/80x80?text=Accessory' : item.img;
      
      itemEl.innerHTML = `
        <img src="${imageSrc}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <span class="cart-item-price">${item.price.toLocaleString('uk-UA')} грн × ${item.qty}</span>
        </div>
        <button class="remove-item-btn" data-id="${item.id}" aria-label="Видалити">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;
      
      itemEl.querySelector('.remove-item-btn').addEventListener('click', () => {
        removeFromCart(item.id);
      });
      
      cartItemsContainer.appendChild(itemEl);
    });

    cartTotalPrice.textContent = `${total.toLocaleString('uk-UA')} грн`;
  }

  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartCount();
    renderCart();
  }

  // === FAQ ACCORDION ===
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const panel = item.querySelector('.faq-panel');
    const icon = item.querySelector('.faq-icon-state');
    
    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other panels
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.faq-panel').style.maxHeight = '0px';
        otherItem.querySelector('.faq-icon-state').textContent = '+';
        otherItem.querySelector('.faq-icon-state').style.transform = 'rotate(0deg)';
      });

      if (!isActive) {
        item.classList.add('active');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        icon.textContent = '−';
        icon.style.transform = 'rotate(180deg)';
      }
    });
  });

  // === SCROLL REVEAL ANIMATIONS ===
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Stop tracking once loaded
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // === NOVA POSHTA AUTOCOMPLETE ===
  cityInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    cityDropdown.innerHTML = '';
    
    if (val.length < 2) {
      cityDropdown.classList.remove('active');
      return;
    }

    const matchedCities = Object.keys(citiesData).filter(city => 
      city.toLowerCase().startsWith(val)
    );

    if (matchedCities.length > 0) {
      cityDropdown.classList.add('active');
      matchedCities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = city;
        item.addEventListener('click', () => {
          cityInput.value = city;
          cityDropdown.classList.remove('active');
          
          const branches = citiesData[city];
          branchInput.value = branches[0];
          showToast(`Доставку оформлено: ${city}`);
        });
        cityDropdown.appendChild(item);
      });
    } else {
      cityDropdown.classList.remove('active');
    }
  });

  document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
      cityDropdown.classList.remove('active');
    }
  });

  // === CHECKOUT MODAL ===
  function toggleModal(open = true) {
    if (open) {
      checkoutModal.classList.add('active');
      renderCheckoutSummary();
    } else {
      checkoutModal.classList.remove('active');
    }
  }

  checkoutBtn.addEventListener('click', () => {
    toggleCart(false);
    toggleModal(true);
  });

  closeModalBtn.addEventListener('click', () => toggleModal(false));
  modalOverlay.addEventListener('click', () => toggleModal(false));

  function renderCheckoutSummary() {
    checkoutSummaryList.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.qty;
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justify = 'space-between';
      row.innerHTML = `<span>${item.name} (x${item.qty})</span><span>${(item.price * item.qty).toLocaleString('uk-UA')} грн</span>`;
      checkoutSummaryList.appendChild(row);
    });
    
    const divider = document.createElement('hr');
    divider.style.border = 'none';
    divider.style.borderTop = '1px dashed var(--border-color)';
    divider.style.margin = '8px 0';
    checkoutSummaryList.appendChild(divider);

    const totalRow = document.createElement('div');
    totalRow.style.display = 'flex';
    totalRow.style.justify = 'space-between';
    totalRow.style.fontWeight = 'bold';
    totalRow.innerHTML = `<span>Загальна сума:</span><span style="color: var(--accent);">${total.toLocaleString('uk-UA')} грн</span>`;
    checkoutSummaryList.appendChild(totalRow);
  }

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('client-name').value;
    toggleModal(false);
    showToast(`Дякуємо, ${name}! Замовлення оформлено.`);
    cart = [];
    updateCartCount();
  });

  // Telegram Direct Order
  document.querySelectorAll('.telegram-direct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleCart(false);
      toggleModal(false);
      
      const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const itemsList = cart.map(item => `• ${item.name} (${item.qty}шт)`).join('\n');
      
      alert(`Симуляція замовлення в Telegram:\n\nМенеджеру відправлено повідомлення:\n"Привіт! Хочу замовити:\n${itemsList}\nЗагальна сума: ${total} грн"`);
      
      cart = [];
      updateCartCount();
    });
  });
});
