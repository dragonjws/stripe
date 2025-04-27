if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripe = require('stripe')(stripeSecretKey)

const express = require('express')
const cors = require('cors')
const app = express()

// Enable CORS for all routes
app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json())
app.use(express.static('public'))
app.set('view engine', 'ejs')

// NOTE: In a production environment, replace this with a proper database
// This in-memory storage will not persist between serverless function invocations
const clickCounts = new Map()

// Endpoint to check click count
app.get('/check-clicks', (req, res) => {
    try {
        const userId = req.query.userId || 'default'
        const clickCount = parseInt(req.query.count) || 0
        
        if (isNaN(clickCount)) {
            return res.status(400).json({ error: 'Invalid click count provided' })
        }
        
        // Store the click count for this user
        clickCounts.set(userId, clickCount)
        
        res.json({ 
            requiresPayment: clickCount >= 3,
            message: clickCount >= 3 ? 'Payment required' : 'Continue clicking',
            userId: userId
        })
    } catch (error) {
        console.error('Error in check-clicks:', error);
        res.status(500).json({ error: error.message })
    }
})

// Create Payment Session Endpoint
app.post('/create-payment-session', async (req, res) => {
    try {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing required field',
                details: 'userId is required'
            })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Button Unlock',
                        description: 'Unlock additional version creation capabilities'
                    },
                    unit_amount: 500, // $5.00
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}?payment_status=cancelled`,
            client_reference_id: userId,
            metadata: {
                userId: userId
            }
        })

        res.json({ url: session.url })
    } catch (error) {
        console.error('Error creating payment session:', error);
        res.status(500).json({ 
            error: 'Failed to create payment session',
            details: error.message
        })
    }
})

// Verify Payment Endpoint
app.get('/verify-payment', async (req, res) => {
    try {
        const { session_id } = req.query

        if (!session_id) {
            return res.status(400).json({ 
                error: 'Missing required field',
                details: 'session_id is required'
            })
        }

        const session = await stripe.checkout.sessions.retrieve(session_id)
        const userId = session.client_reference_id

        if (session.payment_status === 'paid') {
            // Reset click count for the user
            clickCounts.set(userId, 0)
            res.json({ verified: true })
        } else {
            res.json({ verified: false })
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            error: 'Failed to verify payment',
            details: error.message
        })
    }
})

// Reset Clicks Endpoint
app.post('/reset-clicks', (req, res) => {
    try {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing required field',
                details: 'userId is required'
            })
        }

        clickCounts.set(userId, 0)
        console.log(`Reset click count for user ${userId}`)
        res.json({ success: true })
    } catch (error) {
        console.error('Error in reset-clicks:', error);
        res.status(500).json({ error: error.message })
    }
})

// Use the PORT environment variable provided by Vercel, or fallback to 3000
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

// Export the Express app for Vercel
module.exports = app