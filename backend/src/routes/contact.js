const router = require('express').Router();
const { z }  = require('zod');

const contactSchema = z.object({
  name:     z.string().trim().min(1, 'Name is required').max(100),
  email:    z.string().trim().email('Invalid email address'),
  category: z.enum(['general', 'suggestion', 'bug', 'partnership']).default('general'),
  subject:  z.string().trim().max(150).optional().default(''),
  message:  z.string().trim().min(5, 'Message must be at least 5 characters').max(5000),
});

// ── POST /api/contact ───────────────────────────────────────────────────────
// Accepts feedback, bug reports, and company suggestion submissions
router.post('/', async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);

    // In a production setup, dispatch email notification via Resend/SendGrid/SES here
    // or persist to DB. For now, log the contact submission safely.
    console.log(`[Contact Submission] from ${data.name} <${data.email}> [${data.category}]: ${data.message.slice(0, 80)}...`);

    res.json({
      success: true,
      message: 'Thank you for your message! Our maintainers will review it shortly.',
      received: {
        name:     data.name,
        email:    data.email,
        category: data.category,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
