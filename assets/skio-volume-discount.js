 /**
 * Setup: add the below script include to pages that have a checkout button
 * 
 * <script src="{{ 'skio-volume-discount.js' | asset_url }}" defer="defer"></script>
 * 
 * Make sure the selector below covers all checkout buttons
 */

// scope variables
(() => {
  const selector = '.add-to-cart-btn'
  
  const checkoutHandler = async (event) => {
    if (!window.skio_ran_tier_discount && event.target.matches(selector)) {
      event.preventDefault()
  
      // Get Skio rules and the current cart
      const [{rules}, cart] = await Promise.all([
        (await fetch(`https://api.skio.com/storefront-http/get-rules-by-domain-or-hostname?domain=${window?.Shopify?.shop}`)).json(), 
        (await fetch('/cart.js')).json()
      ])
    
      // console.log('rules', rules)
      // console.log('cart', cart)
    
      // Check each rule to find the eligible rule 
      // with the largest min quantity
      let largestMinQuantity = {
        value: -1,
        index: -1,
      }
      rules.forEach((rule, index) => {
        if (rule.code &&
            largestMinQuantity.value < rule.minQuantityToDiscount
        ) {
          // Gets the count of eligible items in the cart for this rule
          const eligibleCount = cart.items.reduce(
            (aggregate, item) => rule.productVariantIds.some(gid => gid.includes(item.id)) ? 
                aggregate + item.quantity : aggregate 
            , 0)
          if (rule.minQuantityToDiscount <= eligibleCount) {
            largestMinQuantity.value = rule.minQuantityToDiscount
            largestMinQuantity.index = index
          }
        }
      })
    
      const rule = largestMinQuantity.index > -1 ? rules[largestMinQuantity.index] : null
      // console.log(rule)
      
      // Apply code
      if (rule) await fetch(`/discount/${rule.code}`)
      
      window.skio_ran_tier_discount = true
      
      event.target.click()
    }
  }
  
  // Event delegation
  document.body.addEventListener('click', checkoutHandler)
})()