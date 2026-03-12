const prisma = require('../prismaClient');

/**
 * POST /api/certificates/send
 * Body: { recipients: [{ email, filename, pdfBase64 }], eventTitle, senderName }
 *
 * Looks up each recipient by email, stores their PDF, and creates a notification
 * so they can download it from the Tempus notification panel.
 */
exports.sendCertificate = async (req, res) => {
    try {
        const { recipients, eventTitle, senderName } = req.body;

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: 'No recipients provided' });
        }

        const results = [];
        const errors  = [];

        for (const { email, filename, pdfBase64 } of recipients) {
            if (!email || !filename || !pdfBase64) {
                errors.push({ email: email || '?', error: 'Missing required fields' });
                continue;
            }

            const user = await prisma.users.findUnique({ where: { email } });
            if (!user) {
                errors.push({ email, error: 'No Tempus account found for this email' });
                continue;
            }

            // Store the certificate data
            const cert = await prisma.certificate_downloads.create({
                data: {
                    user_id:  user.id,
                    filename,
                    pdf_data: pdfBase64,
                },
            });

            // Create an in-app notification with a download link
            const titleLine   = eventTitle  ? ` for "${eventTitle}"` : '';
            const senderLine  = senderName  ? ` from ${senderName}`  : '';
            await prisma.notifications.create({
                data: {
                    user_id: user.id,
                    type:    'certificate_issued',
                    title:   'Your Certificate is Ready',
                    message: `You have received a certificate${titleLine}${senderLine}. Click Download to save it.`,
                    link:    `/api/certificates/${cert.id}/download`,
                },
            });

            results.push({ email, certId: cert.id });
        }

        res.json({ sent: results.length, failed: errors.length, errors });
    } catch (error) {
        console.error('Error sending certificates:', error);
        res.status(500).json({ error: 'Failed to send certificates', details: error.message, code: error.code });
    }
};

/**
 * GET /api/certificates/:id/download
 * Returns the stored PDF as a file download (only accessible by the intended recipient).
 */
exports.downloadCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const certId = parseInt(req.params.id, 10);

        if (isNaN(certId)) return res.status(400).json({ error: 'Invalid certificate ID' });

        const cert = await prisma.certificate_downloads.findFirst({
            where: { id: certId, user_id: userId },
        });

        if (!cert) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        const pdfBuffer = Buffer.from(cert.pdf_data, 'base64');

        // Sanitise filename to prevent header injection
        const safe = cert.filename.replace(/[^\w\-. ]/g, '_');
        res.set({
            'Content-Type':        'application/pdf',
            'Content-Disposition': `attachment; filename="${safe}"`,
            'Content-Length':      pdfBuffer.length,
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error downloading certificate:', error);
        res.status(500).json({ error: 'Failed to download certificate' });
    }
};
