import { CartProvider } from '../context/CartContext';

export { CartProvider, useCart } from '../context/CartContext';

// Old imports that did `import CartContext from ...` will get the provider.
export default CartProvider;