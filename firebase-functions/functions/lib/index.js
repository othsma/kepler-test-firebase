"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredTokens = exports.whatsappWebhook = exports.getClientForRegistration = exports.onTicketCreated = exports.onTicketStatusChange = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const twilio_1 = __importDefault(require("twilio"));
// Import HttpsError for proper typing
const { HttpsError } = functions.https;
// Initialize Firebase Admin
admin.initializeApp();
// SendGrid initialization status
let sendgridInitialized = false;
// Twilio initialization status
let twilioInitialized = false;
let twilioClient = null;
// Firestore reference
const db = admin.firestore();
// Helper function to format date and time in French locale
const formatDateTime = (date) => {
    return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// Helper function for email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// Send push notification to customer
async function sendPushNotification(customerId, notification) {
    try {
        // Get customer profile to find FCM tokens
        const customerDoc = await db.collection('customer_profiles').doc(customerId).get();
        if (!customerDoc.exists) {
            console.log(`Customer ${customerId} not found`);
            return;
        }
        const customerData = customerDoc.data();
        const fcmTokens = (customerData === null || customerData === void 0 ? void 0 : customerData.fcmTokens) || [];
        if (fcmTokens.length === 0) {
            console.log(`No FCM tokens found for customer ${customerId}`);
            return;
        }
        // Prepare notification payload - FCM only supports title and body in notification
        const payload = {
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: {
                ticketId: notification.ticketId || '',
                type: notification.type || 'general',
                url: notification.url || '/customer',
                icon: '/omegalogo.png',
                badge: '/omegalogo.png'
            }
        };
        // Send to all customer's FCM tokens
        const sendPromises = fcmTokens.map((token) => admin.messaging().send(Object.assign(Object.assign({}, payload), { token })));
        const results = await Promise.allSettled(sendPromises);
        // Log results
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to send to token ${index}:`, result.reason);
            }
            else {
                console.log(`Successfully sent to token ${index}`);
            }
        });
        // Clean up invalid tokens (would implement token cleanup here)
    }
    catch (error) {
        console.error('Error sending push notification:', error);
    }
}
// Email templates
const emailTemplates = {
    welcome: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réparation créée - O'MEGA Services</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛠️ O'MEGA Services</h1>
          <h2>Réparation créée avec succès</h2>
        </div>
        <div class="content">
          <p>Bonjour ${data.customerName || ''},</p>
          <p>Nous avons bien reçu votre <strong>${data.deviceInfo}</strong> pour réparation.</p>

        <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>📋 Détails de votre réparation:</h3>
          <p><strong>Numéro de réparation:</strong> ${data.ticketNumber}</p>
          <p><strong>Statut actuel:</strong> En attente</p>
          <p><strong>Date et heure de création:</strong> ${data.createdDateTime}</p>
          <p><strong>Description:</strong> ${data.description || 'Réparation standard'}</p>
        </div>

        ${data.registrationLink ? `
        <div style="background: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3>🔐 Créez votre compte client</h3>
          <p>Pour suivre l'évolution de votre réparation et recevoir toutes les notifications, créez votre compte client gratuit :</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.registrationLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Créer mon compte</a>
          </div>
          <p style="font-size: 12px; color: #666;">
            Votre email sera pré-rempli et vos informations de réparation déjà enregistrées.
          </p>
        </div>
        ` : ''}

        <p>Notre équipe va examiner votre appareil et vous contacter sous 24-48h pour vous communiquer l'état d'avancement de votre réparation.</p>

          <div style="text-align: center;">
            <a href="https://kepleromega.netlify.app/customer" class="button">📱 Suivre ma réparation</a>
          </div>

          <p>Vous recevrez des notifications par email à chaque étape de la réparation.</p>

          <br>
          <p>Cordialement,<br><strong>L'équipe O'MEGA Services</strong></p>
          <p>📞 09 86 60 89 80<br>📧 contact@omegaservices.fr</p>
        </div>
        <div class="footer">
          <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
        </div>
      </div>
    </body>
    </html>
  `,
    statusUpdate: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mise à jour réparation - O'MEGA Services</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-box { background: ${data.statusColor || '#e8f5e8'}; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${data.statusBorder || '#4caf50'}; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Mise à jour réparation</h1>
          <h2>O'MEGA Services</h2>
        </div>
        <div class="content">
          <p>Bonjour ${data.customerName || ''},</p>

          <div class="status-box">
            <h3>📱 Statut mis à jour pour votre ${data.deviceInfo}</h3>
            <p><strong>Nouveau statut:</strong> <span style="font-size: 18px; font-weight: bold;">${data.newStatus}</span></p>
            <p><strong>Numéro de réparation:</strong> ${data.ticketNumber}</p>
            <p><strong>Date et heure de mise à jour:</strong> ${data.updateDateTime}</p>
          </div>

          ${data.nextSteps ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>📋 Prochaines étapes:</h4>
            <p>${data.nextSteps}</p>
          </div>` : ''}

          <div style="text-align: center;">
            <a href="https://kepleromega.netlify.app/customer" class="button">👀 Voir les détails</a>
          </div>

          <p>Vous serez informé par email de chaque évolution importante de votre réparation.</p>

          <br>
          <p>Cordialement,<br><strong>L'équipe O'MEGA Services</strong></p>
          <p>📞 09 86 60 89 80<br>📧 contact@omegaservices.fr</p>
        </div>
        <div class="footer">
          <p>Si vous souhaitez modifier vos préférences de notification, connectez-vous à votre <a href="https://kepleromega.netlify.app/customer/profile">espace client</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `,
    completion: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réparation terminée - O'MEGA Services</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .completion-box { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50; }
        .button { display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .secondary-button { background: #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Réparation terminée</h1>
          <h2>O'MEGA Services</h2>
        </div>
        <div class="content">
          <p>Bonjour ${data.customerName || ''},</p>

          <div class="completion-box">
            <h3>🎉 Votre ${data.deviceInfo} est prêt !</h3>
            <p><strong>Numéro de réparation:</strong> ${data.ticketNumber}</p>
            <p><strong>Date et heure d'exécution:</strong> ${data.completionDateTime}</p>
            <p><strong>Total estimé:</strong> ${data.estimatedCost || 'À confirmer'}</p>
          </div>

          <p>Votre appareil a été réparé avec succès et est prêt à être récupéré.</p>

          ${data.repairDetails ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>🔧 Détails de la réparation:</h4>
            <p>${data.repairDetails}</p>
          </div>` : ''}

          <div style="text-align: center;">
            <a href="tel:+33986608980" class="button">📞 Appeler pour récupérer</a>
            <a href="https://kepleromega.netlify.app/customer" class="button secondary-button">📱 Voir les détails</a>
          </div>

          <p>Nous espérons que vous êtes satisfait du service. N'hésitez pas à nous contacter pour toute question.</p>

          <br>
          <p>Cordialement,<br><strong>L'équipe O'MEGA Services</strong></p>
          <p>📞 09 86 60 89 80<br>📧 contact@omegaservices.fr</p>
        </div>
        <div class="footer">
          <p>Merci d'avoir choisi O'MEGA Services pour vos réparations ! ⭐⭐⭐⭐⭐</p>
        </div>
      </div>
    </body>
    </html>
  `
};
// Send email notification using SendGrid
async function sendEmailNotification(customerId, notification) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        // Initialize SendGrid if not already done
        if (!sendgridInitialized) {
            try {
                const sendgridApiKey = ((_a = functions.config().sendgrid) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.SENDGRID_API_KEY;
                if (sendgridApiKey) {
                    mail_1.default.setApiKey(sendgridApiKey);
                    sendgridInitialized = true;
                    console.log('✅ SendGrid initialized successfully');
                }
                else {
                    console.warn('SendGrid API key not configured. Email notifications will not work.');
                    return;
                }
            }
            catch (error) {
                console.error('Failed to initialize SendGrid:', error);
                return;
            }
        }
        // Handle walk-in customers vs registered customers
        let email;
        if (notification.to) {
            // Walk-in customer - use the provided email directly
            email = notification.to;
            console.log(`Sending to walk-in customer email: ${email}`);
        }
        else {
            // Registered customer - look up profile
            if (!customerId) {
                console.error('No customerId provided for registered customer');
                return;
            }
            const customerDoc = await db.collection('customer_profiles').doc(customerId).get();
            if (!customerDoc.exists) {
                console.log(`Customer ${customerId} not found`);
                return;
            }
            const customerData = customerDoc.data();
            email = customerData === null || customerData === void 0 ? void 0 : customerData.email;
            if (!email) {
                console.log(`No email found for customer ${customerId}`);
                return;
            }
            // Check if customer has email notifications enabled
            const preferences = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences;
            if (!(preferences === null || preferences === void 0 ? void 0 : preferences.emailEnabled)) {
                console.log(`Email notifications disabled for customer ${customerId}`);
                return;
            }
        }
        // Prepare email content
        let emailHtml = notification.html;
        let emailSubject = notification.subject;
        // Use template if specified
        if (notification.template && emailTemplates[notification.template]) {
            emailHtml = emailTemplates[notification.template](notification.templateData);
            // Template includes its own subject, or use provided subject
        }
        // Ensure emailHtml is defined
        if (!emailHtml) {
            console.error('No email content to send');
            return;
        }
        // Send email via SendGrid
        const msg = {
            to: email,
            from: {
                email: 'noreply@omegaservices.fr',
                name: "O'MEGA Services"
            },
            subject: emailSubject,
            html: emailHtml,
            // Add unsubscribe link in footer
            headers: {
                'List-Unsubscribe': `<https://kepleromega.netlify.app/customer/profile>`
            }
        };
        console.log(`🔍 DEBUG - Email payload:`, {
            to: email,
            from: msg.from,
            subject: emailSubject,
            htmlLength: emailHtml.length,
            hasHtml: !!emailHtml
        });
        console.log(`📧 Sending email to ${email} via SendGrid: ${emailSubject}`);
        let sendResult = null;
        try {
            sendResult = await mail_1.default.send(msg);
            console.log(`✅ Email sent successfully to ${email}`, {
                messageId: (_c = (_b = sendResult[0]) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['x-message-id'],
                statusCode: (_d = sendResult[0]) === null || _d === void 0 ? void 0 : _d.statusCode
            });
        }
        catch (sendGridError) {
            console.error(`❌ SendGrid API Error Details:`, {
                message: sendGridError.message,
                code: sendGridError.code,
                response: ((_e = sendGridError.response) === null || _e === void 0 ? void 0 : _e.data) || sendGridError.response,
                status: (_f = sendGridError.response) === null || _f === void 0 ? void 0 : _f.status,
                headers: (_g = sendGridError.response) === null || _g === void 0 ? void 0 : _g.headers,
                sendGridErrors: ((_j = (_h = sendGridError.response) === null || _h === void 0 ? void 0 : _h.body) === null || _j === void 0 ? void 0 : _j.errors) ? JSON.stringify(sendGridError.response.body.errors, null, 2) : 'No errors array'
            });
            throw sendGridError;
        }
        // Log email in notification history
        await db.collection('notification_history').add({
            customerId: customerId || undefined,
            ticketId: notification.ticketId,
            type: 'email',
            channel: 'email',
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            subject: emailSubject,
            metadata: {
                template: notification.template,
                sendgridMessageId: sendResult ? (_l = (_k = sendResult[0]) === null || _k === void 0 ? void 0 : _k.headers) === null || _l === void 0 ? void 0 : _l['x-message-id'] : null
            }
        });
    }
    catch (error) {
        console.error('Error sending email notification:', error);
        // Log failed email attempt
        await db.collection('notification_history').add({
            customerId: customerId || undefined,
            ticketId: notification.ticketId,
            type: 'email',
            channel: 'email',
            status: 'failed',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
                subject: notification.subject
            }
        });
    }
}
// Send SMS notification using Twilio
async function sendSmsNotification(phoneNumber, message, options) {
    var _a, _b, _c, _d;
    try {
        // Initialize Twilio if not already done
        if (!twilioInitialized) {
            try {
                const twilioSid = ((_a = functions.config().twilio) === null || _a === void 0 ? void 0 : _a.sid) || process.env.TWILIO_SID;
                const twilioToken = ((_b = functions.config().twilio) === null || _b === void 0 ? void 0 : _b.token) || process.env.TWILIO_TOKEN;
                const twilioFrom = ((_c = functions.config().twilio) === null || _c === void 0 ? void 0 : _c.from) || process.env.TWILIO_FROM_NUMBER;
                if (twilioSid && twilioToken && twilioFrom) {
                    twilioClient = (0, twilio_1.default)(twilioSid, twilioToken);
                    twilioInitialized = true;
                    console.log('✅ Twilio initialized successfully');
                }
                else {
                    console.warn('Twilio credentials not configured. SMS notifications will not work.');
                    return;
                }
            }
            catch (error) {
                console.error('Failed to initialize Twilio:', error);
                return;
            }
        }
        // Validate and format phone number
        const formattedPhone = formatFrenchPhoneNumber(phoneNumber);
        if (!formattedPhone) {
            console.error('Invalid phone number format:', phoneNumber);
            return;
        }
        console.log(`📱 Sending SMS to ${formattedPhone}: ${message.substring(0, 50)}...`);
        // Send SMS via Twilio
        const smsResult = await twilioClient.messages.create({
            body: message,
            from: ((_d = functions.config().twilio) === null || _d === void 0 ? void 0 : _d.from) || process.env.TWILIO_FROM_NUMBER,
            to: formattedPhone
        });
        console.log(`✅ SMS sent successfully to ${formattedPhone}`, {
            messageId: smsResult.sid,
            status: smsResult.status,
            segments: smsResult.numSegments
        });
        // Log SMS in notification history
        await db.collection('notification_history').add({
            customerId: (options === null || options === void 0 ? void 0 : options.customerId) || null,
            ticketId: (options === null || options === void 0 ? void 0 : options.ticketId) || null,
            type: 'sms',
            channel: 'sms',
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                twilioMessageId: smsResult.sid,
                cost: smsResult.price ? parseFloat(smsResult.price) : null,
                segments: smsResult.numSegments,
                phoneNumber: formattedPhone,
                messageLength: message.length
            }
        });
    }
    catch (error) {
        console.error('Error sending SMS notification:', error);
        // Log failed SMS attempt
        await db.collection('notification_history').add({
            customerId: (options === null || options === void 0 ? void 0 : options.customerId) || null,
            ticketId: (options === null || options === void 0 ? void 0 : options.ticketId) || null,
            type: 'sms',
            channel: 'sms',
            status: 'failed',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
                phoneNumber: phoneNumber,
                messageLength: message.length
            }
        });
    }
}
// Send WhatsApp notification using Twilio
async function sendWhatsAppMessage(phoneNumber, message, options) {
    var _a, _b, _c, _d;
    try {
        // Initialize Twilio if not already done
        if (!twilioInitialized) {
            try {
                const twilioSid = ((_a = functions.config().twilio) === null || _a === void 0 ? void 0 : _a.sid) || process.env.TWILIO_SID;
                const twilioToken = ((_b = functions.config().twilio) === null || _b === void 0 ? void 0 : _b.token) || process.env.TWILIO_TOKEN;
                const whatsappFrom = ((_c = functions.config().twilio) === null || _c === void 0 ? void 0 : _c.whatsapp_from) || process.env.TWILIO_WHATSAPP_FROM;
                if (twilioSid && twilioToken && whatsappFrom) {
                    twilioClient = (0, twilio_1.default)(twilioSid, twilioToken);
                    twilioInitialized = true;
                    console.log('✅ Twilio initialized successfully for WhatsApp');
                }
                else {
                    console.warn('Twilio WhatsApp credentials not configured. WhatsApp notifications will not work.');
                    return;
                }
            }
            catch (error) {
                console.error('Failed to initialize Twilio for WhatsApp:', error);
                return;
            }
        }
        // Validate and format phone number
        const formattedPhone = formatFrenchPhoneNumber(phoneNumber);
        if (!formattedPhone) {
            console.error('Invalid phone number format for WhatsApp:', phoneNumber);
            return;
        }
        // Format for WhatsApp: whatsapp:+336XXXXXXXX
        const whatsappTo = `whatsapp:${formattedPhone}`;
        console.log(`💬 Sending WhatsApp to ${whatsappTo}: ${message.substring(0, 50)}...`);
        // Ensure whatsappTo is not null (TypeScript safety)
        if (!whatsappTo || whatsappTo === 'whatsapp:') {
            console.error('Invalid WhatsApp recipient format');
            return;
        }
        // Send WhatsApp via Twilio
        const whatsappFromNumber = ((_d = functions.config().twilio) === null || _d === void 0 ? void 0 : _d.whatsapp_from) || process.env.TWILIO_WHATSAPP_FROM;
        if (!whatsappFromNumber) {
            console.error('WhatsApp from number not configured');
            return;
        }
        const whatsappResult = await twilioClient.messages.create({
            body: message,
            from: `whatsapp:${whatsappFromNumber}`,
            to: whatsappTo
        });
        console.log(`✅ WhatsApp sent successfully to ${formattedPhone}`, {
            messageId: whatsappResult.sid,
            status: whatsappResult.status
        });
        // Log WhatsApp in notification history
        await db.collection('notification_history').add({
            customerId: (options === null || options === void 0 ? void 0 : options.customerId) || null,
            ticketId: (options === null || options === void 0 ? void 0 : options.ticketId) || null,
            type: 'whatsapp',
            channel: 'whatsapp',
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                twilioMessageId: whatsappResult.sid,
                cost: whatsappResult.price ? parseFloat(whatsappResult.price) : null,
                phoneNumber: formattedPhone,
                messageLength: message.length
            }
        });
    }
    catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        // Log failed WhatsApp attempt
        await db.collection('notification_history').add({
            customerId: (options === null || options === void 0 ? void 0 : options.customerId) || null,
            ticketId: (options === null || options === void 0 ? void 0 : options.ticketId) || null,
            type: 'whatsapp',
            channel: 'whatsapp',
            status: 'failed',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
                phoneNumber: phoneNumber,
                messageLength: (message === null || message === void 0 ? void 0 : message.length) || 0
            }
        });
    }
}
// French phone number validation and formatting
function formatFrenchPhoneNumber(phoneNumber) {
    if (!phoneNumber)
        return null;
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Handle different French phone number formats
    if (cleaned.startsWith('33') && cleaned.length === 11) {
        // Already in +33 format without +
        return `+${cleaned}`;
    }
    else if (cleaned.startsWith('0') && cleaned.length === 10) {
        // French mobile: 06XXXXXXXX or 07XXXXXXXX → +336XXXXXXXX or +337XXXXXXXX
        return `+33${cleaned.substring(1)}`;
    }
    else if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('7'))) {
        // Just 6XXXXXXXX or 7XXXXXXXX → +336XXXXXXXX or +337XXXXXXXX
        return `+33${cleaned}`;
    }
    // If already in correct format, return as-is
    if (cleaned.startsWith('+33') && cleaned.length === 12) {
        return cleaned;
    }
    // Invalid format
    console.warn('Invalid French phone number format:', phoneNumber);
    return null;
}
// SMS Templates
const smsTemplates = {
    repairCompleted: "🛠️ O'MEGA Services: Votre réparation est terminée! Prêt à récupérer.",
    statusUpdate: "📱 Statut mis à jour: Votre appareil est maintenant en réparation.",
    pickupReminder: "⏰ RAPPEL: Votre appareil vous attend pour récupération.",
    welcome: "👋 Bienvenue chez O'MEGA Services! Suivez vos réparations facilement.",
    paymentReminder: "💳 PAIEMENT: Votre réparation est prête. Total estimé: {amount}€"
};
// WhatsApp availability detection
async function isWhatsAppAvailable() {
    var _a, _b;
    try {
        const whatsappFrom = (_a = functions.config().twilio) === null || _a === void 0 ? void 0 : _a.whatsapp_from;
        const whatsappToken = (_b = functions.config().twilio) === null || _b === void 0 ? void 0 : _b.token;
        return !!(whatsappFrom && whatsappToken);
    }
    catch (_c) {
        return false;
    }
}
// WhatsApp Templates (used for future WhatsApp implementation)
const whatsappTemplates = {
    welcome: (data) => `🛠️ *O'MEGA Services*

Bonjour${data.customerName ? ` ${data.customerName}` : ''}! 👋

Votre réparation #${data.ticketNumber} a été enregistrée.

📱 *Suivez l'évolution et créez votre compte:*
${data.registrationLink}

📞 Questions? Écrivez-nous ici ou appelez le 09 86 60 89 80

_Nous vous tiendrons informé de chaque étape!_`,
    statusUpdate: (data) => `🔄 *MISE À JOUR*

Votre ${data.deviceInfo} est maintenant *${data.newStatus}*.

📞 Notre équipe vous contactera sous 24-48h pour la suite.

Merci de votre patience! 🙏`,
    completion: (data) => `✅ *RÉPARATION TERMINÉE*

Votre ${data.deviceInfo} est *prêt à récupérer*!

🏪 *Adresse:* 123 Rue de la Réparation, Paris
🕐 *Horaires:* Lundi-Vendredi 9h-18h

📞 Appelez-nous au 09 86 60 89 80 pour confirmer votre passage.

Merci d'avoir choisi O'MEGA Services! ⭐`
};
// Customer Phone Number Extraction and Validation
// @ts-expect-error - Function kept for future SMS implementation
async function findCustomerPhoneForSms(clientId) {
    var _a, _b, _c;
    try {
        // Step 1: Try to find registered customer first (preferred)
        const linkedQuery = await db.collection('customer_profiles')
            .where('linkedClientId', '==', clientId)
            .limit(1)
            .get();
        if (!linkedQuery.empty) {
            const customerDoc = linkedQuery.docs[0];
            const customerData = customerDoc.data();
            const phoneNumber = customerData === null || customerData === void 0 ? void 0 : customerData.phoneNumber;
            if (phoneNumber && formatFrenchPhoneNumber(phoneNumber)) {
                return {
                    phoneNumber: formatFrenchPhoneNumber(phoneNumber),
                    customerId: customerDoc.id,
                    smsEnabled: ((_a = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences) === null || _a === void 0 ? void 0 : _a.smsEnabled) || false,
                    source: 'customer_profile_linked'
                };
            }
        }
        // Step 2: Try email/phone matching for existing customers
        const clientDoc = await db.collection('clients').doc(clientId).get();
        if (!clientDoc.exists) {
            return null;
        }
        const clientData = clientDoc.data();
        const clientEmail = clientData === null || clientData === void 0 ? void 0 : clientData.email;
        const clientPhone = clientData === null || clientData === void 0 ? void 0 : clientData.phone;
        // Try to find customer by email first
        if (clientEmail) {
            const emailQuery = await db.collection('customer_profiles')
                .where('email', '==', clientEmail)
                .limit(1)
                .get();
            if (!emailQuery.empty) {
                const customerDoc = emailQuery.docs[0];
                const customerData = customerDoc.data();
                const phoneNumber = (customerData === null || customerData === void 0 ? void 0 : customerData.phoneNumber) || clientPhone;
                if (phoneNumber && formatFrenchPhoneNumber(phoneNumber)) {
                    return {
                        phoneNumber: formatFrenchPhoneNumber(phoneNumber),
                        customerId: customerDoc.id,
                        smsEnabled: ((_b = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences) === null || _b === void 0 ? void 0 : _b.smsEnabled) || false,
                        source: 'customer_profile_email_match'
                    };
                }
            }
        }
        // Try to find customer by phone number
        if (clientPhone && formatFrenchPhoneNumber(clientPhone)) {
            const phoneQuery = await db.collection('customer_profiles')
                .where('phoneNumber', '==', clientPhone)
                .limit(1)
                .get();
            if (!phoneQuery.empty) {
                const customerDoc = phoneQuery.docs[0];
                const customerData = customerDoc.data();
                return {
                    phoneNumber: formatFrenchPhoneNumber(clientPhone),
                    customerId: customerDoc.id,
                    smsEnabled: ((_c = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences) === null || _c === void 0 ? void 0 : _c.smsEnabled) || false,
                    source: 'customer_profile_phone_match'
                };
            }
        }
        // Step 3: Fallback to client phone for walk-in customers (SMS enabled by default for critical updates)
        if (clientPhone && formatFrenchPhoneNumber(clientPhone)) {
            return {
                phoneNumber: formatFrenchPhoneNumber(clientPhone),
                customerId: null, // Walk-in customer
                smsEnabled: true, // Default to true for walk-in customers (they provided phone)
                source: 'client_walkin'
            };
        }
        return null;
    }
    catch (error) {
        console.error('Error finding customer phone for SMS:', error);
        return null;
    }
}
// Cloud Function: Trigger when ticket status changes
exports.onTicketStatusChange = functions.firestore
    .document('tickets/{ticketId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Check if status actually changed
    if ((before === null || before === void 0 ? void 0 : before.status) === (after === null || after === void 0 ? void 0 : after.status)) {
        return;
    }
    const ticketId = context.params.ticketId;
    const clientId = after === null || after === void 0 ? void 0 : after.clientId; // This is the client ID from tickets collection
    if (!clientId) {
        console.log(`No client ID found for ticket ${ticketId}`);
        return;
    }
    // Get client data first
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
        console.log(`Client ${clientId} not found`);
        return;
    }
    const clientData = clientDoc.data();
    // FIXED: Prioritize customer profile data over client data
    let customerDoc = null;
    let customerId = null;
    let customerData = null;
    let preferences = null;
    // Try to find customer profile (linkedClientId → email → phone)
    const linkedQuery = await db.collection('customer_profiles')
        .where('linkedClientId', '==', clientId)
        .limit(1)
        .get();
    if (!linkedQuery.empty) {
        customerDoc = linkedQuery.docs[0];
        customerId = customerDoc.id;
        customerData = customerDoc.data();
        preferences = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences;
        console.log(`Found customer ${customerId} via linkedClientId`);
    }
    else {
        // Try email matching
        if ((clientData === null || clientData === void 0 ? void 0 : clientData.email) && typeof clientData.email === 'string') {
            const emailQuery = await db.collection('customer_profiles')
                .where('email', '==', clientData.email)
                .limit(1)
                .get();
            if (!emailQuery.empty) {
                customerDoc = emailQuery.docs[0];
                customerId = customerDoc.id;
                customerData = customerDoc.data();
                preferences = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences;
                console.log(`Found customer ${customerId} via email`);
            }
        }
        // Try phone matching
        if (!customerDoc && (clientData === null || clientData === void 0 ? void 0 : clientData.phone) && typeof clientData.phone === 'string') {
            const phoneQuery = await db.collection('customer_profiles')
                .where('phoneNumber', '==', clientData.phone)
                .limit(1)
                .get();
            if (!phoneQuery.empty) {
                customerDoc = phoneQuery.docs[0];
                customerId = customerDoc.id;
                customerData = customerDoc.data();
                preferences = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences;
                console.log(`Found customer ${customerId} via phone`);
            }
        }
    }
    // Set defaults for preferences if no customer profile found
    const defaultPreferences = {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false, // Only for registered customers
        whatsappEnabled: false // Only for registered customers
    };
    const finalPreferences = preferences || defaultPreferences;
    // FIXED: Use customer profile data first, client data as fallback
    const emailToUse = customerId ? ((customerData === null || customerData === void 0 ? void 0 : customerData.email) || (clientData === null || clientData === void 0 ? void 0 : clientData.email)) : clientData === null || clientData === void 0 ? void 0 : clientData.email;
    const phoneToUse = customerId ? ((customerData === null || customerData === void 0 ? void 0 : customerData.phoneNumber) || (clientData === null || clientData === void 0 ? void 0 : clientData.phone)) : clientData === null || clientData === void 0 ? void 0 : clientData.phone;
    const customerName = (customerData === null || customerData === void 0 ? void 0 : customerData.fullName) || (clientData === null || clientData === void 0 ? void 0 : clientData.name) || '';
    const deviceInfo = `${(after === null || after === void 0 ? void 0 : after.deviceType) || 'Appareil'} ${(after === null || after === void 0 ? void 0 : after.brand) || ''} ${(after === null || after === void 0 ? void 0 : after.model) || ''}`.trim();
    // Prepare status info
    const statusLabels = {
        'pending': 'en attente',
        'in-progress': 'en cours',
        'completed': 'terminée'
    };
    const newStatus = statusLabels[after === null || after === void 0 ? void 0 : after.status] || (after === null || after === void 0 ? void 0 : after.status);
    console.log(`Status change notification preferences for ticket ${ticketId}:`, finalPreferences);
    // Send push notification (only for registered customers)
    if (customerId && finalPreferences.pushEnabled) {
        await sendPushNotification(customerId, {
            title: 'Statut de réparation mis à jour',
            body: `Votre ${deviceInfo} est maintenant ${newStatus}`,
            ticketId,
            type: 'status_change',
            url: '/customer'
        });
    }
    // Send EMAIL notification (if enabled) - FIXED: uses prioritized email
    if (finalPreferences.emailEnabled && emailToUse && isValidEmail(emailToUse)) {
        console.log(`Sending status update email for ticket ${ticketId} to ${emailToUse}`);
        let emailTemplate = 'statusUpdate';
        let templateData = {};
        if ((after === null || after === void 0 ? void 0 : after.status) === 'completed') {
            emailTemplate = 'completion';
            templateData = {
                customerName: customerName || 'Cher client',
                deviceInfo,
                ticketNumber: (after === null || after === void 0 ? void 0 : after.ticketNumber) || ticketId,
                completionDateTime: formatDateTime(new Date()),
                estimatedCost: (after === null || after === void 0 ? void 0 : after.cost) ? `${after.cost.toFixed(2)}€ TTC` : 'À confirmer',
                repairDetails: (after === null || after === void 0 ? void 0 : after.repairNotes) || null
            };
        }
        else {
            let statusColor = '#e8f5e8';
            let statusBorder = '#4caf50';
            let nextSteps = '';
            switch (after === null || after === void 0 ? void 0 : after.status) {
                case 'in-progress':
                    statusColor = '#fff3cd';
                    statusBorder = '#ffc107';
                    nextSteps = 'Notre technicien va examiner votre appareil et procéder à sa réparation.';
                    break;
                default:
                    statusColor = '#e3f2fd';
                    statusBorder = '#2196f3';
                    nextSteps = 'Nous allons examiner votre demande et vous contacter sous 24h.';
            }
            templateData = {
                customerName: customerName || 'Cher client',
                deviceInfo,
                newStatus,
                ticketNumber: (after === null || after === void 0 ? void 0 : after.ticketNumber) || ticketId,
                updateDateTime: formatDateTime(new Date()),
                statusColor,
                statusBorder,
                nextSteps
            };
        }
        await sendEmailNotification(customerId || null, {
            to: customerId ? undefined : (emailToUse || undefined), // Use 'to' for walk-in, customerId for registered
            subject: (after === null || after === void 0 ? void 0 : after.status) === 'completed' ? `Réparation terminée - ${deviceInfo}` : `Mise à jour réparation - ${deviceInfo}`,
            template: emailTemplate,
            templateData,
            ticketId
        });
    }
    // IMPLEMENTED: Anti-spam WhatsApp XOR SMS logic (skip if in-store pickup)
    if (!(after === null || after === void 0 ? void 0 : after.inStorePickup)) {
        const whatsappAvailable = await isWhatsAppAvailable();
        // WhatsApp XOR SMS: Choose WhatsApp if available, otherwise SMS (never both)
        let messagingChannel = null;
        let formattedPhone = null;
        if (finalPreferences.whatsappEnabled && whatsappAvailable && phoneToUse) {
            // Priority: WhatsApp if enabled and available
            messagingChannel = 'whatsapp';
            formattedPhone = formatFrenchPhoneNumber(phoneToUse);
        }
        else if (finalPreferences.smsEnabled && phoneToUse) {
            // Fallback: SMS if WhatsApp not available
            messagingChannel = 'sms';
            formattedPhone = formatFrenchPhoneNumber(phoneToUse);
        }
        // Send messaging notification (WhatsApp OR SMS, not both)
        if (messagingChannel && formattedPhone) {
            let message = '';
            if ((after === null || after === void 0 ? void 0 : after.status) === 'completed') {
                message = messagingChannel === 'whatsapp'
                    ? whatsappTemplates.completion({ deviceInfo, ticketNumber: (after === null || after === void 0 ? void 0 : after.ticketNumber) || ticketId })
                    : smsTemplates.repairCompleted;
            }
            else if ((after === null || after === void 0 ? void 0 : after.status) === 'in-progress') {
                message = messagingChannel === 'whatsapp'
                    ? whatsappTemplates.statusUpdate({ deviceInfo, newStatus })
                    : smsTemplates.statusUpdate;
            }
            else {
                message = messagingChannel === 'whatsapp'
                    ? whatsappTemplates.statusUpdate({ deviceInfo, newStatus })
                    : `📱 Statut de votre ${deviceInfo}: ${newStatus}`;
            }
            if (messagingChannel === 'whatsapp') {
                await sendWhatsAppMessage(formattedPhone, message, {
                    ticketId,
                    customerId: customerId || undefined,
                    type: customerId ? 'status_change_registered' : 'status_change_walkin'
                });
            }
            else {
                await sendSmsNotification(formattedPhone, message, {
                    ticketId,
                    customerId: customerId || undefined,
                    type: customerId ? 'status_change_registered' : 'status_change_walkin'
                });
            }
        }
        else if ((finalPreferences.whatsappEnabled || finalPreferences.smsEnabled) && phoneToUse) {
            // Log when WhatsApp/SMS is enabled but not available
            console.log(`Messaging not sent: WhatsApp available=${whatsappAvailable}, WhatsApp enabled=${finalPreferences.whatsappEnabled}, SMS enabled=${finalPreferences.smsEnabled}`);
        }
    }
    else {
        console.log(`SMS skipped for ticket ${ticketId}: in-store pickup detected`);
    }
    // Log notification in history
    const channels = [];
    if (finalPreferences.emailEnabled)
        channels.push('email');
    if (finalPreferences.smsEnabled)
        channels.push('sms');
    if (customerId && finalPreferences.pushEnabled)
        channels.push('push');
    await db.collection('notification_history').add({
        customerId: customerId || undefined,
        ticketId,
        type: 'status_change',
        channel: channels.join('+') || 'none',
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
            oldStatus: before === null || before === void 0 ? void 0 : before.status,
            newStatus,
            deviceInfo,
            ticketNumber: (after === null || after === void 0 ? void 0 : after.ticketNumber) || ticketId,
            isRegisteredCustomer: !!customerId,
            preferences: finalPreferences
        }
    });
    console.log(`Unified status change notifications sent for ticket ${ticketId}: ${channels.join(' + ') || 'none'}`);
});
// Cloud Function: Trigger when new ticket is created
exports.onTicketCreated = functions.firestore
    .document('tickets/{ticketId}')
    .onCreate(async (snapshot, context) => {
    const ticket = snapshot.data();
    const ticketId = context.params.ticketId;
    const clientId = ticket === null || ticket === void 0 ? void 0 : ticket.clientId; // This is the client ID from tickets collection
    if (!clientId) {
        console.log(`No client ID found for new ticket ${ticketId}`);
        return;
    }
    // Get client data first
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
        console.log(`Client ${clientId} not found`);
        return;
    }
    const clientData = clientDoc.data();
    // UNIFIED CUSTOMER LOGIC: Find customer profile (if exists) and get preferences
    let customerDoc = null;
    let customerId = null;
    let customerData = null;
    let preferences = null;
    // Try to find customer profile (linkedClientId → email → phone)
    const linkedQuery = await db.collection('customer_profiles')
        .where('linkedClientId', '==', clientId)
        .limit(1)
        .get();
    if (!linkedQuery.empty) {
        customerDoc = linkedQuery.docs[0];
        customerId = customerDoc.id;
        customerData = customerDoc.data();
        preferences = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences;
        console.log(`Found customer ${customerId} via linkedClientId`);
    }
    else {
        // Try email matching
        if (clientData === null || clientData === void 0 ? void 0 : clientData.email) {
            const emailQuery = await db.collection('customer_profiles')
                .where('email', '==', clientData.email)
                .limit(1)
                .get();
            if (!emailQuery.empty) {
                customerDoc = emailQuery.docs[0];
                customerId = customerDoc.id;
                customerData = customerDoc.data();
                preferences = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences;
                console.log(`Found customer ${customerId} via email`);
            }
        }
        // Try phone matching
        if (!customerDoc && (clientData === null || clientData === void 0 ? void 0 : clientData.phone)) {
            const phoneQuery = await db.collection('customer_profiles')
                .where('phoneNumber', '==', clientData.phone)
                .limit(1)
                .get();
            if (!phoneQuery.empty) {
                customerDoc = phoneQuery.docs[0];
                customerId = customerDoc.id;
                customerData = customerDoc.data();
                preferences = customerData === null || customerData === void 0 ? void 0 : customerData.notificationPreferences;
                console.log(`Found customer ${customerId} via phone`);
            }
        }
    }
    // Set defaults for preferences if no customer profile found
    const defaultPreferences = {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false, // Only for registered customers
        whatsappEnabled: false // Only for registered customers
    };
    const finalPreferences = preferences || defaultPreferences;
    // FIXED: Use customer profile data first, client data as fallback
    const emailToUse = customerId ? ((customerData === null || customerData === void 0 ? void 0 : customerData.email) || (clientData === null || clientData === void 0 ? void 0 : clientData.email)) : clientData === null || clientData === void 0 ? void 0 : clientData.email;
    const phoneToUse = customerId ? ((customerData === null || customerData === void 0 ? void 0 : customerData.phoneNumber) || (clientData === null || clientData === void 0 ? void 0 : clientData.phone)) : clientData === null || clientData === void 0 ? void 0 : clientData.phone;
    const customerName = (customerData === null || customerData === void 0 ? void 0 : customerData.fullName) || (clientData === null || clientData === void 0 ? void 0 : clientData.name) || '';
    const deviceInfo = `${(ticket === null || ticket === void 0 ? void 0 : ticket.deviceType) || 'Appareil'} ${(ticket === null || ticket === void 0 ? void 0 : ticket.brand) || ''} ${(ticket === null || ticket === void 0 ? void 0 : ticket.model) || ''}`.trim();
    console.log(`🎯 UNIFIED LOGIC: Notification preferences for ticket ${ticketId}:`, finalPreferences);
    // Send push notification (only for registered customers)
    if (customerId && finalPreferences.pushEnabled) {
        await sendPushNotification(customerId, {
            title: 'Nouvelle réparation créée',
            body: `Votre ${deviceInfo} a été enregistré pour réparation`,
            ticketId,
            type: 'ticket_created',
            url: '/customer'
        });
    }
    // Send EMAIL notification (if enabled)
    if (finalPreferences.emailEnabled && (clientData === null || clientData === void 0 ? void 0 : clientData.email) && isValidEmail(clientData.email)) {
        console.log(`Sending welcome email for ticket ${ticketId}`);
        const templateData = {
            customerName: customerName || 'Cher client',
            deviceInfo,
            ticketNumber: (ticket === null || ticket === void 0 ? void 0 : ticket.ticketNumber) || ticketId,
            createdDateTime: formatDateTime(new Date()),
            description: (ticket === null || ticket === void 0 ? void 0 : ticket.issue) || 'Réparation standard',
            registrationLink: customerId ? undefined : `https://kepleromega.netlify.app/customer/register?ticket=${ticketId}&email=${encodeURIComponent(clientData.email)}`
        };
        await sendEmailNotification(customerId || null, {
            to: customerId ? undefined : (emailToUse || undefined), // Use 'to' for walk-in, customerId for registered
            subject: customerId
                ? `Réparation créée - ${deviceInfo}`
                : `Bienvenue chez O'MEGA Services - Réparation ${(ticket === null || ticket === void 0 ? void 0 : ticket.ticketNumber) || ticketId}`,
            template: 'welcome',
            templateData,
            ticketId
        });
    }
    // Send SMS notification (if enabled and NOT in-store pickup) - FIXED: uses prioritized phone
    if (finalPreferences.smsEnabled && phoneToUse && !ticket.inStorePickup) {
        const formattedPhone = formatFrenchPhoneNumber(phoneToUse);
        if (formattedPhone) {
            const smsMessage = customerId
                ? `🛠️ O'MEGA Services\n\nBonjour${customerName ? ` ${customerName}` : ''}!\n\nVotre réparation #${(ticket === null || ticket === void 0 ? void 0 : ticket.ticketNumber) || ticketId} a été enregistrée.\n\n📱 Suivez l'évolution sur votre espace client.`
                : `🛠️ O'MEGA Services\n\nBonjour${(clientData === null || clientData === void 0 ? void 0 : clientData.name) ? ` ${clientData.name}` : ''}!\n\nVotre réparation #${(ticket === null || ticket === void 0 ? void 0 : ticket.ticketNumber) || ticketId} a été enregistrée.\n\nSuivez l'évolution et créez votre compte:\n${`https://kepleromega.netlify.app/customer/register?ticket=${ticketId}${(clientData === null || clientData === void 0 ? void 0 : clientData.email) ? `&email=${encodeURIComponent(clientData.email)}` : ''}`}\n\nPour toute question, contactez-nous:\n09 86 60 89 80`;
            await sendSmsNotification(formattedPhone, smsMessage, {
                ticketId,
                customerId: customerId || undefined,
                type: customerId ? 'ticket_created_registered' : 'ticket_created_walkin'
            });
        }
    }
    // Log notification in history
    const channels = [];
    if (finalPreferences.emailEnabled)
        channels.push('email');
    if (finalPreferences.smsEnabled)
        channels.push('sms');
    if (customerId && finalPreferences.pushEnabled)
        channels.push('push');
    await db.collection('notification_history').add({
        customerId: customerId || undefined,
        ticketId,
        type: 'ticket_created',
        channel: channels.join('+') || 'none',
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
            deviceInfo,
            ticketNumber: (ticket === null || ticket === void 0 ? void 0 : ticket.ticketNumber) || ticketId,
            isRegisteredCustomer: !!customerId,
            preferences: finalPreferences
        }
    });
    console.log(`Unified welcome notifications sent for ticket ${ticketId}: ${channels.join(' + ') || 'none'}`);
});
// Cloud Function: Get client data for registration pre-filling
exports.getClientForRegistration = functions.https.onCall(async (data, context) => {
    const { ticketId } = data;
    if (!ticketId) {
        throw new HttpsError('invalid-argument', 'Ticket ID is required');
    }
    try {
        // Validate ticket exists and get client ID
        const ticketRef = admin.firestore().doc(`tickets/${ticketId}`);
        const ticketSnap = await ticketRef.get();
        if (!ticketSnap.exists) {
            throw new HttpsError('not-found', 'Ticket not found');
        }
        const ticketData = ticketSnap.data();
        const clientId = ticketData === null || ticketData === void 0 ? void 0 : ticketData.clientId;
        if (!clientId) {
            throw new HttpsError('failed-precondition', 'No client linked to this ticket');
        }
        // Fetch client data
        const clientRef = admin.firestore().doc(`clients/${clientId}`);
        const clientSnap = await clientRef.get();
        if (!clientSnap.exists) {
            throw new HttpsError('not-found', 'Client data not found');
        }
        const clientData = clientSnap.data();
        // Return the client data (Firestore security rules will be bypassed since this runs with admin privileges)
        return Object.assign({ id: clientSnap.id }, clientData);
    }
    catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Failed to fetch client data');
    }
});
// WhatsApp Webhook Handler for incoming messages
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    try {
        console.log('WhatsApp webhook received:', JSON.stringify(req.body, null, 2));
        // Handle WhatsApp webhook verification (required by Twilio)
        if (req.method === 'GET') {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            // Verify webhook (you'll set this token in Twilio console)
            const VERIFY_TOKEN = ((_a = functions.config().twilio) === null || _a === void 0 ? void 0 : _a.whatsapp_verify_token) || 'your_verify_token';
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('WhatsApp webhook verified successfully');
                res.status(200).send(challenge);
                return;
            }
            else {
                res.status(403).send('Verification failed');
                return;
            }
        }
        // Handle incoming WhatsApp messages
        if (req.method === 'POST') {
            const body = req.body;
            // Process each message entry
            if (body === null || body === void 0 ? void 0 : body.entry) {
                for (const entry of body.entry) {
                    if (entry === null || entry === void 0 ? void 0 : entry.changes) {
                        for (const change of entry.changes) {
                            if ((_b = change === null || change === void 0 ? void 0 : change.value) === null || _b === void 0 ? void 0 : _b.messages) {
                                for (const message of change.value.messages) {
                                    await processIncomingWhatsAppMessage(message, change.value);
                                }
                            }
                        }
                    }
                }
            }
            // Always respond with 200 OK for WhatsApp webhooks
            res.status(200).send('OK');
        }
        else {
            res.status(405).send('Method not allowed');
        }
    }
    catch (error) {
        console.error('WhatsApp webhook error:', error);
        res.status(500).send('Internal server error');
    }
});
// Process incoming WhatsApp message
async function processIncomingWhatsAppMessage(message, value) {
    var _a, _b;
    try {
        const from = message.from; // Customer's phone number
        const messageType = message.type;
        const messageId = message.id;
        console.log(`Processing WhatsApp message from ${from}: ${messageType}`);
        // Find customer by phone number
        const customerQuery = await db.collection('customer_profiles')
            .where('phoneNumber', '==', from.replace('+', ''))
            .limit(1)
            .get();
        if (customerQuery.empty) {
            console.log(`No customer found for WhatsApp number: ${from}`);
            // Could send a "please register" message
            return;
        }
        const customerDoc = customerQuery.docs[0];
        const customerId = customerDoc.id;
        // Log the incoming message
        await db.collection('whatsapp_conversations').add({
            customerId: customerId || undefined,
            messageId,
            from: from,
            to: value.to,
            type: messageType,
            content: ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || message.caption || 'Media message',
            timestamp: new Date(parseInt(message.timestamp) * 1000),
            direction: 'incoming',
            processed: false
        });
        // Auto-responses for common queries
        if (messageType === 'text') {
            const text = message.text.body.toLowerCase();
            let autoResponse = '';
            if (text.includes('statut') || text.includes('status') || text.includes('où')) {
                autoResponse = '📱 Je vérifie le statut de votre réparation. Un technicien vous contactera sous 24-48h.';
            }
            else if (text.includes('prix') || text.includes('coût') || text.includes('tarif')) {
                autoResponse = '💰 Les tarifs seront communiqués après diagnostic. Contactez-nous au 09 86 60 89 80.';
            }
            else if (text.includes('rendez-vous') || text.includes('rdv')) {
                autoResponse = '📅 Pour prendre rendez-vous, appelez-nous au 09 86 60 89 80.';
            }
            else if (text.includes('merci') || text.includes('thank')) {
                autoResponse = '🙏 Merci à vous! N\'hésitez pas si vous avez d\'autres questions.';
            }
            // Send auto-response if applicable
            if (autoResponse) {
                await sendWhatsAppMessage(from, autoResponse, {
                    customerId,
                    type: 'auto_response'
                });
                // Mark conversation as processed
                await db.collection('whatsapp_conversations')
                    .where('messageId', '==', messageId)
                    .limit(1)
                    .get()
                    .then(snapshot => {
                    if (!snapshot.empty) {
                        snapshot.docs[0].ref.update({ processed: true });
                    }
                });
            }
            else {
                // Forward to staff/admin for manual response
                console.log(`🤖 WhatsApp message needs manual response: "${(_b = message.text) === null || _b === void 0 ? void 0 : _b.body}"`);
                // Could send notification to staff here
                // For now, just mark as needing attention
                await db.collection('whatsapp_conversations')
                    .where('messageId', '==', messageId)
                    .limit(1)
                    .get()
                    .then(snapshot => {
                    if (!snapshot.empty) {
                        snapshot.docs[0].ref.update({
                            processed: false,
                            needsAttention: true
                        });
                    }
                });
            }
        }
    }
    catch (error) {
        console.error('Error processing incoming WhatsApp message:', error);
    }
}
// Cloud Function: Clean up expired FCM tokens
exports.cleanupExpiredTokens = functions.pubsub.schedule('0 2 * * *').timeZone('Europe/Paris').onRun(async () => {
    console.log('Starting FCM token cleanup...');
    try {
        const customersRef = db.collection('customer_profiles');
        const snapshot = await customersRef.get();
        let cleanedCount = 0;
        for (const doc of snapshot.docs) {
            const customerData = doc.data();
            const fcmTokens = (customerData === null || customerData === void 0 ? void 0 : customerData.fcmTokens) || [];
            if (fcmTokens.length > 0) {
                // Test each token by sending a test message
                const testResults = await Promise.allSettled(fcmTokens.map((token) => admin.messaging().send({
                    token,
                    data: { test: 'cleanup' }
                }, true) // dryRun = true
                ));
                // Filter out invalid tokens
                const validTokens = fcmTokens.filter((token, index) => testResults[index].status === 'fulfilled');
                if (validTokens.length !== fcmTokens.length) {
                    // Update document with only valid tokens
                    await doc.ref.update({
                        fcmTokens: validTokens,
                        lastTokenCleanup: admin.firestore.FieldValue.serverTimestamp()
                    });
                    cleanedCount += (fcmTokens.length - validTokens.length);
                }
            }
        }
        console.log(`FCM token cleanup completed. Removed ${cleanedCount} invalid tokens.`);
    }
    catch (error) {
        console.error('Error during FCM token cleanup:', error);
    }
});
//# sourceMappingURL=index.js.map