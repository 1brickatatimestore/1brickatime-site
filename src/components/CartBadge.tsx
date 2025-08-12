import React from 'react';
import styles from './CartBadge.module.css';
import { useCart } from '../context/CartContext';

const CartBadge: React.FC = () => {
  const { cart } = useCart();

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={styles.cartBadge}>
      <span role="img" aria-label="cart">🛒</span>
      {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
    </div>
  );
};

export default CartBadge;
