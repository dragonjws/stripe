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

// In-memory storage for click counts (in production, use a database)
const clickCounts = new Map()

// Endpoint to increment click count
app.post('/increment-clicks', (req, res) => {
    const userId = req.body.userId || 'default'
    const currentCount = clickCounts.get(userId) || 0
    const newCount = currentCount + 1
    clickCounts.set(userId, newCount)
    
    res.json({ 
        count: newCount,
        requiresPayment: newCount >= 50
    })
})

// Endpoint to create a payment session
app.post('/create-payment-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Button Unlock',
                    },
                    unit_amount: 500, // $5.00
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/payment-cancelled`,
        })
        res.json({ sessionId: session.id })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Endpoint to reset click count after successful payment
app.post('/reset-clicks', (req, res) => {
    const userId = req.body.userId || 'default'
    clickCounts.set(userId, 0)
    res.json({ success: true })
})

// Payment success page
app.get('/payment-success', (req, res) => {
    res.send('Payment successful! The button has been unlocked.')
})

// Payment cancelled page
app.get('/payment-cancelled', (req, res) => {
    res.send('Payment was cancelled. Please try again.')
})

// Use the PORT environment variable provided by Vercel, or fallback to 3000
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})