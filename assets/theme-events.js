/**
 * Learn more about theme events at
 * https://help.switchthemes.co/shapes/developer/theme-events/overview.html
 */

window.theme = window.theme || {};

window.theme.events = {
  version: '1.0',
};

document.addEventListener('theme:update:cart', async () => {
  document.dispatchEvent(new CustomEvent('shapes:cart:lock'));

  try {
    const response = await fetch(
      `${window.location.pathname}?sections=cart-items,cart-footer,cart-item-count,cart-live-region`
    );
    const data = await response.json();

    if (!data.status) {
      document.dispatchEvent(
        new CustomEvent('shapes:cart:update', {
          bubbles: true,
          detail: {
            response: {
              sections: {
                ...data,
              },
            },
          },
        })
      );
    }
  } catch (e) {
    console.error(e);
    document.getElementById('cart-errors').textContent =
      theme.strings.cartError;
    document.dispatchEvent(
      new CustomEvent('theme:cart:error:other', {
        detail: {
          message: theme.strings.cartError,
          error: e,
        },
      })
    );
  } finally {
    document.dispatchEvent(new CustomEvent('shapes:cart:unlock'));
  }
});

const getCartDrawerEl = () => {
  return document.querySelector('[data-cart-drawer]');
};

document.addEventListener('cart-will-open', async () => {
  const cartDrawerEl = getCartDrawerEl();

  const detail = {
    cartDrawerEl,
  };

  document.dispatchEvent(
    new CustomEvent('theme:cart-drawer:opening', {
      detail,
    })
  );
});

document.addEventListener('cart-is-open', async () => {
  const cartDrawerEl = getCartDrawerEl();

  const detail = {
    cartDrawerEl,
  };

  document.dispatchEvent(
    new CustomEvent('theme:cart-drawer:open', {
      detail,
    })
  );
});

document.addEventListener('cart-will-close', () => {
  document.dispatchEvent(
    new CustomEvent('theme:cart-drawer:closing', {
      detail: {
        cartDrawerEl: getCartDrawerEl(),
      },
    })
  );
});

document.addEventListener('cart-is-closed', () => {
  document.dispatchEvent(
    new CustomEvent('theme:cart-drawer:closed', {
      detail: {
        cartDrawerEl: getCartDrawerEl(),
      },
    })
  );
});

document.addEventListener('theme:open:cart-drawer', () => {
  if (
    window.theme.settings.cart_type === 'modal' &&
    Alpine.store('modals').modals.cart
  ) {
    Alpine.store('modals').closeAll();

    Alpine.store('modals').open('cart');
  }
});

document.addEventListener('theme:close:cart-drawer', () => {
  if (
    window.theme.settings.cart_type === 'modal' &&
    Alpine.store('modals').modals.cart
  ) {
    Alpine.store('modals').close('cart');
  }
});

const cartChangeEventHandler = (e) => {
  const { cartItemCount, itemsRootEl, lineItemEl, variantId, key } = e.detail;

  document.dispatchEvent(
    new CustomEvent('theme:cart:change', {
      detail: {
        type: e.type,
        cartItemCount,
        itemsRootEl,
        lineItemEl,
        variantId,
        key,
        originalDetail: e.detail,
      },
    })
  );
};

document.addEventListener('theme:product:add', cartChangeEventHandler);
document.addEventListener('theme:line-item:change', cartChangeEventHandler);

const cartErrorEventHandler = (e) => {
  document.dispatchEvent(
    new CustomEvent('theme:cart:error', {
      detail: {
        type: e.type,
        message: e.detail.message,
        originalDetail: e.detail,
      },
    })
  );
};

document.addEventListener(
  'theme:product:error:add-to-cart',
  cartErrorEventHandler
);

document.addEventListener('theme:line-item:error', cartErrorEventHandler);
document.addEventListener('theme:cart:error:other', cartErrorEventHandler);

/**
 * Set `window.themeEventsDebugMode` to `true` to log events
 * outside the theme editor
 */

if (Shopify.designMode || window.themeEventsDebugMode) {
  const themeEvents = [
    'theme:variant:change',
    'theme:product:add',
    'theme:line-item:change',
    'theme:cart:change',
    'theme:cart:update',
    'theme:cart-drawer:opening',
    'theme:cart-drawer:open',
    'theme:cart-drawer:closing',
    'theme:cart-drawer:closed',
    'theme:product:error:add-to-cart',
    'theme:line-item:error',
    'theme:cart:error:other',
    'theme:cart:error',
  ];

  const aggregateEvents = ['theme:cart:change', 'theme:cart:error'];

  for (const eventName of themeEvents) {
    let color;

    if (eventName.includes('error')) {
      color = '#ef4444';
    } else {
      color = '#22c55e';
    }

    const message = [
      `%c\u25CF %c${eventName}`,
      `color: ${color};`,
      'font-weight: bold;',
    ];

    if (aggregateEvents.includes(eventName)) {
      document.addEventListener(eventName, (e) => {
        console.groupCollapsed(...message);
        console.log(
          `Underlying event: %c${e.detail.type}`,
          'font-weight: bold;'
        );
        console.log('Event detail:', e.detail);
        console.groupEnd();
      });
    } else {
      document.addEventListener(eventName, (e) => {
        console.log(...message, e.detail);
      });
    }
  }
}
