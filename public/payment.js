// Initialize Stripe with your publishable key
const stripe = Stripe('pk_test_your_publishable_key'); // Replace with your actual publishable key

/**
 * Handle the payment process
 * @param {string} userId - The user's ID
 */
async function handlePayment(userId) {
    try {
        // Show loading state
        const paymentButton = document.getElementById('paymentButton');
        if (paymentButton) {
            paymentButton.disabled = true;
            paymentButton.textContent = 'Processing...';
        }

        // Create payment session
        const response = await fetch(`${API_BASE_URL}/create-payment-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Failed to create payment session');
        }

        const { sessionId } = await response.json();

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: sessionId
        });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error('Payment error:', error);
        // Show error to user
        alert('Payment failed. Please try again.');
        
        // Reset button state
        const paymentButton = document.getElementById('paymentButton');
        if (paymentButton) {
            paymentButton.disabled = false;
            paymentButton.textContent = 'Pay Now';
        }
    }
}

// Example HTML for the payment button:
/*
<button id="paymentButton" onclick="handlePayment('user123')">
    Pay Now
</button>
*/

// Export the function
export { handlePayment }; 