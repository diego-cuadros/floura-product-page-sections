$(document).on('click', '.option-values', function() {
    var parentLi = $(this).closest('.product-contenet-wrapper');
    $(this).siblings().removeClass('selected');
    $(this).addClass('selected');
    updateStockAvailability(parentLi);
});

function updateStockAvailability(parentLi) {
    var selectedColor = parentLi.find('.variant-option--1 .option-values.selected').data('value') || null;
    var selectedSize = parentLi.find('.variant-option--2 .option-values.selected').data('value') || null;
    var selectedMaterial = parentLi.find('.variant-option--3 .option-values.selected').data('value') || null;

    var combination = [];
    if (parentLi.find('.variant-option--1 .option-values.selected').length > 0) {
        var varselectedColor = parentLi.find('.variant-option--1 .option-values.selected').attr('title') || null;
        if (varselectedColor) {
            combination.push(varselectedColor);
        }
    }

    if (parentLi.find('.variant-option--2 .option-values.selected').length > 0) {
        var varselectedSize = parentLi.find('.variant-option--2 .option-values.selected').attr('title') || null;
        if (varselectedSize) {
            combination.push(varselectedSize);
        }
    }

    if (parentLi.find('.variant-option--3 .option-values.selected').length > 0) {
        var varselectedMaterial = parentLi.find('.variant-option--3 .option-values.selected').attr('title') || null;
        if (varselectedMaterial) {
            combination.push(varselectedMaterial);
        }
    }
    var finalCombination = combination.join(' / ') || null;
    parentLi.find('button.button.add-to-bundle').attr('data-variant-title', finalCombination);

    parentLi.find('.option-values').removeClass('out-of-stock');
    var availableVariants = {};

    parentLi.find('.product-variants li').each(function() {
        var variantName = $(this).attr('data-title') || "";
        var variantQty = parseInt($(this).attr('data-quantity')) || 0;
        var variantId = $(this).attr('data-variant-id') || "";
        var variantImage = $(this).attr('data-variant-image') || "";
        var variantPrice = $(this).attr('data-var-price') || "";
        var variantParts = variantName.split('-').map(part => part.trim()).filter(Boolean);
        var key = variantParts.join('-');

        availableVariants[key] = {
            inStock: variantQty > 0,
            variantId: variantId,
            variantQty: variantQty,
            variantImage: variantImage,
            variantName: variantName,
            variantPrice: variantPrice
        };
    });

    function createKey(...values) {
        return values.filter(Boolean).join('-');
    }

    var selectedVariantKey = createKey(selectedColor, selectedSize, selectedMaterial);
    var cartButton = parentLi.find('button.button.add-to-bundle');

    if (availableVariants[selectedVariantKey]) {
        var selectedVariant = availableVariants[selectedVariantKey];

        cartButton
            .attr('data-var-id', selectedVariant.variantId)
            .attr('data-var-qty', selectedVariant.variantQty)
            .attr('data-var-img', selectedVariant.variantImage)
            .attr('data-swatch', selectedVariant.variantName)
            .attr('data-var-price', selectedVariant.variantPrice);

        if (selectedVariant.variantQty > 0) {
            cartButton.removeClass('out-of-stock').text("Add to Bundle"); // Keep the default text if in stock
            cartButton.removeAttr('data-sold-message'); // Remove the out-of-stock message
        } else {
            cartButton.addClass('out-of-stock'); // Mark the button as out of stock
            cartButton.attr('data-sold-message', 'Sold out'); // Add "Sold out" to the data-sold-message attribute
            cartButton.text(cartButton.attr('data-sold-message')); // Set the button text to "Sold out"
        }

        if (selectedVariant.variantImage) {
            parentLi.find('.bundle-product-image').attr('srcset', selectedVariant.variantImage);
            parentLi.find('.bundle-product-image').attr('src', selectedVariant.variantImage);
        }
    } else {
        cartButton.addClass('out-of-stock'); // Mark the button as out of stock
        cartButton.attr('data-sold-message', 'Sold out'); // Add "Sold out" to the data-sold-message attribute
        cartButton.text(cartButton.attr('data-sold-message')); // Set the button text to "Sold out"
    }

    function checkStockAvailability(optionClass, selectedValues) {
        parentLi.find(optionClass + ' .option-values').each(function() {
            var value = $(this).data('value');
            var key = createKey(...selectedValues.map((v, i) => (i === selectedValues.indexOf(null) ? value : v)));
            if (!availableVariants[key] || availableVariants[key].variantQty <= 0) {
                $(this).addClass('out-of-stock');
            }
        });
    }

    checkStockAvailability('.variant-option--1', [null, selectedSize, selectedMaterial]);
    checkStockAvailability('.variant-option--2', [selectedColor, null, selectedMaterial]);
    checkStockAvailability('.variant-option--3', [selectedColor, selectedSize, null]);
}


function updateProgressText(currentCount, dataLimit) {
    let message = '';
    let remaining = dataLimit - currentCount;

    if (currentCount === 0) {
        message = `Add at least ${dataLimit - 1} products to proceed and free product.`;
    } else if (currentCount < dataLimit && remaining > 1) {
        message = `${remaining - 1} more product${remaining > 1 ? 's' : ''} to unlock free product.`;
    } else {
        message = `You’re eligible to free product`;
    }
    $('.save-text').text(message);
}

$('body').on('click', 'button.button.add-to-bundle', function () {
    var $button = $(this);
    var dataVarid = $button.attr('data-var-id');
    var dataVarimg = $button.attr('data-var-img');
    var dataProducttitle = $button.attr('data-var-title');
    var dataVartitle = $button.attr('data-swatch');
    var datavariantTitle = $button.attr('data-variant-title');
    var dataVarprice = $button.attr('data-var-price');
    var dataVarpricewithoutCurrency = parseFloat($button.attr('data-price'));
    var dataLimitError = $button.attr('data-error-message');
    var dataLimit = parseInt($button.attr('data-limit')) || 3;
    var cartWrapper = $('.cart-bundle-product-wrapper');

    var currentCount = cartWrapper.find('.bundle-product-cart-wrapper').not('.blank-produt-bundle').length;

    if (currentCount >= dataLimit) {
        $('.error-message').text(`${dataLimitError} ${dataLimit}`);
        return; 
    }
    $('.error-message').text('');

    var emptySlot = cartWrapper.find('.blank-produt-bundle').first();
    if (emptySlot.length) {
        var cartProductHtml = `
            <div class="bundle-product-cart-wrapper" data-var-id="${dataVarid}" data-price="${dataVarpricewithoutCurrency}" style="display: none;">
                <div class="image-wrapper">
                    <img src="${dataVarimg}" alt="${dataProducttitle}" />
                </div>
                <div class="bundle-product-detail-wrapper">
                    <div class="product-name">${dataProducttitle}</div>
                    <div class="product-variant-name">${datavariantTitle}</div>
                    <div class="product-variant-price">${dataVarprice}</div>
                    <div class="product-variant-remove">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-remove" viewBox="0 0 16 16">
                                <path fill="currentColor" d="M14 3h-3.53a3.07 3.07 0 0 0-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 0 0 5.53 3H2a.5.5 0 0 0 0 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 0 0 .5-.5V4H14a.5.5 0 0 0 0-1M6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02m4.84 11.52h-7.5V4h7.5z"></path>
                                <path fill="currentColor" d="M6.55 5.25a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5m2.9 0a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5"></path>
                            </svg>
                        </span>
                    </div>
                </div>
            </div>`;

        var newProduct = $(cartProductHtml);
        emptySlot.replaceWith(newProduct);
        newProduct.fadeIn('slow');

        currentCount++;
        $('.current_slide_count').text(currentCount);

        $('button.button.bundle-add-to-cart').attr('disabled', currentCount < dataLimit);

        var fillPercentage = (currentCount / dataLimit) * 100;
        $('.progress-bar-fill').css('width', fillPercentage + '%');

        updateProgressText(currentCount, dataLimit);
    }

    updateTotalPrice();
});





$('body').on('click', '.product-variant-remove span', function () {
    var cartWrapper = $('.cart-bundle-product-wrapper');
    var removedItem = $(this).closest('.bundle-product-cart-wrapper');
    
    removedItem.fadeOut('fast', function () {
        $(this).replaceWith(`
            <div class="bundle-product-cart-wrapper blank-produt-bundle">
                <div class="bundle-product-inner-wrapper">
                    <div class="image-wrapper">
                        <svg width="96" height="97" viewBox="0 0 96 97" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect y="0.190002" width="96" height="96" rx="8" fill="#F4F4F4"/>
                        </svg>
                    </div>
                    <div class="bundle-product-detail-wrapper">
                        <div class="product-name"></div>
                        <div class="product-variant-name"></div>
                        <div class="product-variant-price"></div>
                        <div class="product-variant-remove"></div>
                    </div>
                </div>
            </div>
        `);

        updateTotalPrice();
        updateAddToCartButtonState();

        var currentCount = cartWrapper.find('.bundle-product-cart-wrapper').not('.blank-produt-bundle').length;
        var dataLimit = parseInt($('button.button.add-to-bundle').first().attr('data-limit')) || 3;
        var fillPercentage = (currentCount / dataLimit) * 100;
        $('.progress-bar-fill').css('width', fillPercentage + '%');

        $('.current_slide_count').text(currentCount);
        updateProgressText(currentCount, dataLimit);
    });
});




function updateTotalPrice() {
  var totalPrice = 0;

  $('.cart-bundle-product-wrapper .bundle-product-cart-wrapper').each(function (index) {
    var $this = $(this);
    var productPrice = parseFloat($this.attr('data-price')) || 0;

    if (index < 4) {
      // First 4 products → add normally
      totalPrice += productPrice;
      $this.find('.product-variant-price').css('text-decoration', 'none');
    } else {
      // 5th+ products → zero cost, strike through
       $this.find('.product-variant-price').css({
    'text-decoration': 'line-through',
    'color': '#7fc68a'
  });
    }
  });

  // Currency symbols
  var currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "Rs.",
    AUD: "A$",
    CAD: "$",
    JPY: "¥",
    CNY: "¥",
    SGD: "S$",
    HKD: "HK$",
    NZD: "NZ$",
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    RUB: "₽",
    ZAR: "R",
    BRL: "R$",
    MXN: "MX$",
    MYR: "RM",
    IDR: "Rp",
    PHP: "₱",
    THB: "฿",
    VND: "₫",
    KRW: "₩"
  };

  var storeCurrencyCode = Shopify.currency.active;
  var storeCurrencySymbol = currencySymbols[storeCurrencyCode] || storeCurrencyCode;

  // Update total
  $('.cart-total-price span.money').text(`${storeCurrencySymbol}${totalPrice.toFixed(2)}`);
}


function updateAddToCartButtonState() {
    var cartWrapper = $('.cart-bundle-product-wrapper');
    var currentCount = cartWrapper.find('.bundle-product-cart-wrapper').not('.blank-produt-bundle').length;
    var addToBundleBtn = $('button.add-to-bundle').first();
    var dataLimit = parseInt(addToBundleBtn.attr('data-limit')) || 3;
    var dataLimitError = addToBundleBtn.attr('data-error-message') || 'Limit reached. Max:';

    $('.current_slide_count').text(currentCount);

    const addToCartBtn = $('button.button.bundle-add-to-cart');
    if (currentCount >= dataLimit) {
        $('.error-message').text(`${dataLimitError} ${dataLimit}`);
        addToCartBtn.prop('disabled', true);
    } else {
        $('.error-message').text('');
        addToCartBtn.prop('disabled', currentCount < dataLimit);
    }

    var steps = $('.bundle-progress .progress-step');
    steps.removeClass('active');
    steps.each(function (index) {
        if (index < currentCount) {
            $(this).addClass('active');
        }
    });
}

document.body.addEventListener("click", async function (event) {
  const button = event.target.closest("button.button.bundle-add-to-cart");
  if (!button) return;

  const cartType = button.getAttribute("data-cart-type");
  const items = [];

  document.querySelectorAll(".cart-bundle-product-wrapper .bundle-product-cart-wrapper")
    .forEach((item) => {
      const id = item.getAttribute("data-var-id");
      if (id) items.push({ id, quantity: 1 });
    });

  try {
    await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (cartType === "modal") {
      const res = await fetch(
        `${window.location.pathname}?sections=cart-drawer-content,main-cart-items,cart-items,cart-footer`
      );
      const data = await res.json();

      // Update main drawer slot
      const container = document.querySelector("#right-drawer-slot .testing");
      const drawerHTML = data["cart-drawer-content"] || data["main-cart-items"] || data["cart-items"];
      if (container && drawerHTML) {
        container.innerHTML = drawerHTML;
        if (window.Alpine?.initTree) Alpine.initTree(container);
        console.log("✅ Cart drawer content updated");
      } else {
        console.warn("❌ Could not update cart drawer. Section or container missing.");
      }

      // Update cart footer (if present)
      const footerHTML = data["cart-footer"];
      const footerContainer = document.querySelector(".px-section.pb-safe-bottom.pt-5");
      if (footerHTML && footerContainer) {
        footerContainer.outerHTML = footerHTML;
        console.log("✅ Cart footer updated");
      } else {
        console.warn("❌ Cart footer section not found in either DOM or response.");
      }

      if (window.Alpine?.store("modals")) {
        Alpine.store("modals").rightDrawer.contents = "cart";
        Alpine.store("modals").rightDrawer.open = true;
      } else {
        console.warn("Alpine modals store not found");
      }

      window.dispatchEvent(new CustomEvent("cart:updated"));
    } else {
      window.location.href = "/cart";
    }
  } catch (err) {
    console.error("Bundle add-to-cart error:", err);
  }
});


window.addEventListener('cart:updated', async () => {
  try {
    // Fetch updated cart JSON to get item count
    const res = await fetch('/cart.js');
    const cart = await res.json();

    // Get the badge element inside your CartButton
    const badge = document.querySelector('#CartButton [x-text="$store.cart_count.count"]');
    if (badge) {
      badge.textContent = cart.item_count || 0;

      // Optionally show/hide badge based on count
      if (cart.item_count > 0) {
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {
    console.error('Failed to update cart count badge:', e);
  }
});
