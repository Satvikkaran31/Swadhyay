import { useCallback } from 'react';

const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v2/checkout.js';
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function loadSdk() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = RAZORPAY_SDK_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Handles Razorpay SDK loading, order creation, and payment initiation.
 *
 * @param {Object} options
 * @param {number}   options.amount       - Amount in paise
 * @param {string}   options.description  - Payment description shown in modal
 * @param {Object}   options.user         - { name, email } for prefill
 * @param {Object}   [options.metadata]   - Extra fields forwarded to /api/payment/verify (e.g. course_id)
 * @param {Function} options.onSuccess    - Called with server verify response on success
 * @param {Function} options.onFailure    - Called with error message string on failure; null if user dismissed
 * @param {Function} [options.onDismiss]  - Called when user closes the payment modal without paying
 */
export function useRazorpay() {
  const initiatePayment = useCallback(async ({
    amount,
    description,
    user,
    metadata = {},
    onSuccess,
    onFailure,
    onDismiss,
  }) => {
    const sdkLoaded = await loadSdk();
    if (!sdkLoaded) {
      onFailure?.('Razorpay SDK failed to load. Check your internet connection.');
      return;
    }

    let order;
    try {
      const res = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // Pass course_id (if present) so server can look up the canonical price
        body: JSON.stringify({ amount, currency: 'INR', receipt: `rcpt_${Date.now()}`, ...metadata }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onFailure?.(err.error || 'Failed to initiate payment. Please try again.');
        return;
      }
      order = await res.json();
    } catch {
      onFailure?.('Failed to initiate payment. Please try again.');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Swadhyay',
      description,
      order_id: order.id,
      prefill: { name: user?.name ?? '', email: user?.email ?? '' },
      theme: { color: '#1A2B3C' },
      handler: async (response) => {
        try {
          const verifyRes = await fetch(`${API}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...metadata,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            onSuccess?.(result);
          } else {
            onFailure?.('Payment verification failed. Contact support if your account was debited.');
          }
        } catch {
          onFailure?.('Payment verification error. Contact support if your account was debited.');
        }
      },
      modal: {
        ondismiss: () => onDismiss?.(),
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      onFailure?.('Payment could not be initiated. Please try again.');
    }
  }, []);

  return { initiatePayment };
}
