
const dishes = {
  noodles: {
    name: "Chicken Noodles",
    ar: "نودلز بالدجاج",
    price: 180,
    emoji: "🍜"
  },
  rice: {
    name: "Fried Rice",
    ar: "أرز مقلي",
    price: 160,
    emoji: "🍚"
  },
  rolls: {
    name: "Spring Rolls",
    ar: "سبرينج رولز",
    price: 95,
    emoji: "🥢"
  },
  dumplings: {
    name: "Chicken Dumplings",
    ar: "دامبلنج بالدجاج",
    price: 130,
    emoji: "🥟"
  }
};

let language = "en";
let activeFilter = "all";
let cart = loadCart();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("shz-cart")) || {};

    const validCart = {};

    for (const id in savedCart) {
      if (
        dishes[id] &&
        Number.isInteger(savedCart[id]) &&
        savedCart[id] > 0 &&
        savedCart[id] < 100
      ) {
        validCart[id] = savedCart[id];
      }
    }

    return validCart;
  } catch {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem("shz-cart", JSON.stringify(cart));
  } catch {
    // The cart still works if browser storage is unavailable.
  }
}

function formatMoney(amount) {
  return amount.toLocaleString("en-EG") + " EGP";
}

function getItemCount() {
  return Object.values(cart).reduce((total, quantity) => {
    return total + quantity;
  }, 0);
}

function getSubtotal() {
  let total = 0;

  for (const id in cart) {
    total += dishes[id].price * cart[id];
  }

  return total;
}

function translate(english, arabic) {
  return language === "ar" ? arabic : english;
}

/* Toast message */
let toastTimer;

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/* Cart open and close */
function openCart() {
  $("#overlay").classList.add("open");
  $("#cartDrawer").classList.add("open");
  document.body.classList.add("no-scroll");

  renderCart();
}

function closeCart() {
  $("#overlay").classList.remove("open");
  $("#cartDrawer").classList.remove("open");
  document.body.classList.remove("no-scroll");
}

/* Add an item */
function addItem(id) {
  if (!dishes[id]) return;

  if (cart[id]) {
    cart[id]++;
  } else {
    cart[id] = 1;
  }

  renderCart();

  const itemName = language === "ar"
    ? dishes[id].ar
    : dishes[id].name;

  showToast(
    language === "ar"
      ? itemName + " اتضاف للسلة"
      : itemName + " added to your bag"
  );
}

/* Change quantity */
function changeQuantity(id, amount) {
  if (!dishes[id] || !cart[id]) return;

  cart[id] += amount;

  if (cart[id] <= 0) {
    delete cart[id];
  }

  renderCart();
}

/* Remove an item */
function removeItem(id) {
  delete cart[id];
  renderCart();
}

/* Display cart items */
function renderCart() {
  saveCart();

  $("#cartCount").textContent = getItemCount();

  const cartItems = $("#cartItems");
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-symbol">sh.z</div>

        <h3>
          ${translate(
            "A little room for something lovely.",
            "لسه في مكان لحاجة حلوة."
          )}
        </h3>

        <p>
          ${translate(
            "Your bag is waiting for its first favourite.",
            "سلتك مستنية أول طبق تحبيه."
          )}
        </p>

        <button class="button small" id="emptyBrowse">
          ${translate("Explore the menu", "اكتشفي المنيو")}
        </button>
      </div>
    `;

    $("#emptyBrowse").addEventListener("click", () => {
      closeCart();
      $("#menu").scrollIntoView({ behavior: "smooth" });
    });
  } else {
    cartItems.innerHTML = ids.map((id) => {
      const dish = dishes[id];
      const name = language === "ar" ? dish.ar : dish.name;

      return `
        <div class="cart-row">
          <div class="cart-thumb">${dish.emoji}</div>

          <div>
            <h4>${name}</h4>

            <div class="cart-price">
              ${formatMoney(dish.price * cart[id])}
            </div>

            <div class="quantity">
              <button
                data-qty="${id}"
                data-delta="-1"
                aria-label="Decrease quantity"
              >−</button>

              <span>${cart[id]}</span>

              <button
                data-qty="${id}"
                data-delta="1"
                aria-label="Increase quantity"
              >+</button>
            </div>
          </div>

          <button
            class="remove-item"
            data-remove="${id}"
            aria-label="Remove item"
          >×</button>
        </div>
      `;
    }).join("");
  }

  $("#cartSubtotal").textContent = formatMoney(getSubtotal());

  const checkoutButton = $("#checkoutButton");
  checkoutButton.disabled = ids.length === 0;
  checkoutButton.style.opacity = ids.length === 0 ? "0.55" : "1";
}

/* Filter the menu */
function filterMenu(category) {
  activeFilter = category;

  $$("[data-filter]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.filter === category
    );
  });

  $$(".menu-card").forEach((card) => {
    const categories = card.dataset.category.split(" ");

    const shouldShow =
      category === "all" || categories.includes(category);

    card.hidden = !shouldShow;
  });
}

/* Language switch */
function setLanguage(newLanguage) {
  language = newLanguage;

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  $("#languageButton").textContent = language === "ar" ? "EN" : "AR";

  $$("[data-en][data-ar]").forEach((element) => {
    const text = element.getAttribute("data-" + language);

    if (text !== null) {
      if (element.matches("input")) {
        element.placeholder = text;
      } else {
        element.textContent = text;
      }
    }
  });

  $$("[data-en-html][data-ar-html]").forEach((element) => {
    element.innerHTML = element.getAttribute("data-" + language + "-html");
  });

  filterMenu(activeFilter);
  renderCart();

  if ($("#checkoutView").classList.contains("open")) {
    renderCheckout();
  }
}

/* Checkout screen */
function showCheckout() {
  if (getItemCount() === 0) {
    showToast(
      translate(
        "Add a dish to your bag first.",
        "ضيفي طبق للسلة الأول."
      )
    );
    return;
  }

  closeCart();
  renderCheckout();

  $("#checkoutView").classList.add("open");
  document.body.classList.add("no-scroll");

  window.scrollTo(0, 0);
}

function hideCheckout() {
  $("#checkoutView").classList.remove("open");
  $("#checkoutLayout").style.display = "";
  $("#successState").classList.remove("show");

  document.body.classList.remove("no-scroll");
}

/* Display checkout summary */
function renderCheckout() {
  const checkoutItems = $("#checkoutItems");

  checkoutItems.innerHTML = Object.keys(cart).map((id) => {
    const dish = dishes[id];
    const name = language === "ar" ? dish.ar : dish.name;

    return `
      <div class="summary-line">
        <span>${cart[id]} × ${name}</span>
        <strong>${formatMoney(dish.price * cart[id])}</strong>
      </div>
    `;
  }).join("");

  const subtotal = getSubtotal();

  const delivery = subtotal >= 500 ? 0 : 35;
  const discount = subtotal >= 500 ? 35 : 0;
  const total = subtotal + delivery - discount;

  $("#deliveryFee").textContent = delivery === 0
    ? translate("Free", "مجاني")
    : formatMoney(delivery);

  $("#discountAmount").textContent = discount > 0
    ? "−" + formatMoney(discount)
    : formatMoney(0);

  $("#checkoutTotal").textContent = formatMoney(total);
}

/* Navigation and cart buttons */
$("#cartButton").addEventListener("click", openCart);

$("#closeCart").addEventListener("click", closeCart);

$("#overlay").addEventListener("click", closeCart);

$("#checkoutButton").addEventListener("click", showCheckout);

$("#backToMenu").addEventListener("click", hideCheckout);

$("#checkoutBrand").addEventListener("click", (event) => {
  event.preventDefault();

  hideCheckout();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

$("#languageButton").addEventListener("click", () => {
  setLanguage(language === "en" ? "ar" : "en");
});

$("#mobileMenuButton").addEventListener("click", () => {
  $("#navLinks").classList.toggle("mobile-open");
});

/* Close mobile menu after choosing a link */
$$(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    $("#navLinks").classList.remove("mobile-open");
  });
});

/* Add buttons */
$$("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    addItem(button.dataset.add);
  });
});

/* Cart quantity and remove buttons */
$("#cartItems").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    const id = quantityButton.dataset.qty;
    const amount = Number(quantityButton.dataset.delta);

    changeQuantity(id, amount);
  }

  if (removeButton) {
    removeItem(removeButton.dataset.remove);
  }
});

/* Filter buttons */
$$("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filterMenu(button.dataset.filter);
  });
});

/* Keyboard Escape */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();

    $("#navLinks").classList.remove("mobile-open");

    if ($("#checkoutView").classList.contains("open")) {
      hideCheckout();
    }
  }
});

/* Submit demo order */
$("#checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();

  if (getItemCount() === 0) {
    hideCheckout();

    showToast(
      translate("Your bag is empty.", "السلة فاضية.")
    );

    return;
  }

  const formData = new FormData(event.currentTarget);

  const fullName = String(formData.get("fullName") || "").trim();
  const firstName = fullName.split(/\s+/)[0] || "";

  const total = $("#checkoutTotal").textContent;

  $("#successMessage").textContent =
    translate(
      `Thank you, ${firstName}! Your demo order totals ${total}. No payment was taken and no real restaurant received this order.`,
      `شكرًا يا ${firstName}! إجمالي طلبك التجريبي ${total}. مفيش فلوس اتخصمت والطلب موصلش لمطعم حقيقي.`
    );

  $("#checkoutLayout").style.display = "none";
  $("#successState").classList.add("show");

  window.scrollTo(0, 0);
});

/* Finish order */
$("#finishOrder").addEventListener("click", () => {
  cart = {};

  renderCart();
  hideCheckout();

  $("#checkoutForm").reset();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  showToast(
    translate(
      "Thanks for trying the sh.z demo!",
      "شكرًا إنك جرّبتي sh.z!"
    )
  );
});

/* Start the website */
renderCart();
filterMenu("all");




