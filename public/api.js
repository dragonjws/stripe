// API base URL - change this to your deployed URL when in production
const API_BASE_URL = 'https://stripe-eta-lyart.vercel.app';

/**
 * Check if the current click count requires payment
 * @param {number} count - The current click count
 * @param {string} userId - The user's ID
 * @returns {Promise<{requiresPayment: boolean, message: string, userId: string}>}
 */
async function checkClicks(count, userId = 'default') {
    try {
        const response = await fetch(`${API_BASE_URL}/check-clicks?count=${count}&userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking clicks:', error);
        throw error;
    }
}

/**
 * Create a Stripe payment session
 * @returns {Promise<{sessionId: string}>}
 */
async function createPaymentSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/create-payment-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating payment session:', error);
        throw error;
    }
}

/**
 * Reset the click count after successful payment
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean}>}
 */
async function resetClicks(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reset-clicks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error resetting clicks:', error);
        throw error;
    }
}

// Example usage:
/*
// Check if payment is required
checkClicks(45)
    .then(result => {
        if (result.requiresPayment) {
            console.log('Payment required!');
        } else {
            console.log('Continue clicking!');
        }
    })
    .catch(error => console.error('Error:', error));

// Create payment session
createPaymentSession()
    .then(result => {
        // Redirect to Stripe checkout
        window.location.href = result.sessionId;
    })
    .catch(error => console.error('Error:', error));

// Reset clicks after payment
resetClicks('user123')
    .then(result => {
        if (result.success) {
            console.log('Clicks reset successfully!');
        }
    })
    .catch(error => console.error('Error:', error));
*/

// Export the functions
export {
    checkClicks,
    createPaymentSession,
    resetClicks
}; 