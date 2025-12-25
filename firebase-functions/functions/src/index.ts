import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid
const sendgridApiKey = functions.config().sendgrid?.api_key ||
                      process.env.SENDGRID_API_KEY;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
} else {
  console.warn('SendGrid API key not configured. Email notifications will not work.');
}

// Firestore reference
const db = admin.firestore();

// Send push notification to customer
async function sendPushNotification(customerId: string, notification: {
  title: string;
  body: string;
  ticketId?: string;
  type?: string;
  url?: string;
}) {
  try {
    // Get customer profile to find FCM tokens
    const customerDoc = await db.collection('customer_profiles').doc(customerId).get();

    if (!customerDoc.exists) {
      console.log(`Customer ${customerId} not found`);
      return;
    }

    const customerData = customerDoc.data();
    const fcmTokens = customerData?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for customer ${customerId}`);
      return;
    }

    // Prepare notification payload
    const payload = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/omegalogo.png',
        badge: '/omegalogo.png'
      },
      data: {
        ticketId: notification.ticketId || '',
        type: notification.type || 'general',
        url: notification.url || '/customer'
      }
    };

    // Send to all customer's FCM tokens
    const sendPromises = fcmTokens.map((token: string) =>
      admin.messaging().send({ ...payload, token })
    );

    const results = await Promise.allSettled(sendPromises);

    // Log results
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send to token ${index}:`, result.reason);
      } else {
        console.log(`Successfully sent to token ${index}`);
      }
    });

    // Clean up invalid tokens (would implement token cleanup here)

  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Email templates
const emailTemplates = {
  welcome: (data: any) => `
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
            <p><strong>Date de création:</strong> ${data.createdDate}</p>
            <p><strong>Description:</strong> ${data.description || 'Réparation standard'}</p>
          </div>

          <p>Notre équipe va examiner votre appareil et vous contacter sous 24-48h pour un devis détaillé.</p>

          <div style="text-align: center;">
            <a href="https://kepleromega.netlify.app/customer" class="button">📱 Suivre ma réparation</a>
          </div>

          <p>Vous recevrez des notifications par email à chaque étape de la réparation.</p>

          <br>
          <p>Cordialement,<br><strong>L'équipe O'MEGA Services</strong></p>
          <p>📞 01 23 45 67 89<br>📧 contact@omegaservices.com</p>
        </div>
        <div class="footer">
          <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  statusUpdate: (data: any) => `
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
            <p><strong>Date de mise à jour:</strong> ${data.updateDate}</p>
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
          <p>📞 01 23 45 67 89<br>📧 contact@omegaservices.com</p>
        </div>
        <div class="footer">
          <p>Si vous souhaitez modifier vos préférences de notification, connectez-vous à votre <a href="https://kepleromega.netlify.app/customer/profile">espace client</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  completion: (data: any) => `
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
            <p><strong>Date de completion:</strong> ${data.completionDate}</p>
            <p><strong>Total estimé:</strong> ${data.estimatedCost || 'À confirmer'}</p>
          </div>

          <p>Votre appareil a été réparé avec succès et est prêt à être récupéré.</p>

          ${data.repairDetails ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>🔧 Détails de la réparation:</h4>
            <p>${data.repairDetails}</p>
          </div>` : ''}

          <div style="text-align: center;">
            <a href="tel:+33123456789" class="button">📞 Appeler pour récupérer</a>
            <a href="https://kepleromega.netlify.app/customer" class="button secondary-button">📱 Voir les détails</a>
          </div>

          <p>Nous espérons que vous êtes satisfait du service. N'hésitez pas à nous contacter pour toute question.</p>

          <br>
          <p>Cordialement,<br><strong>L'équipe O'MEGA Services</strong></p>
          <p>📞 01 23 45 67 89<br>📧 contact@omegaservices.com</p>
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
async function sendEmailNotification(customerId: string, notification: {
  subject: string;
  html?: string;
  ticketId?: string;
  template?: string;
  templateData?: any;
}) {
  try {
    // Check if SendGrid is configured
    if (!sendgridApiKey) {
      console.warn('SendGrid not configured, skipping email notification');
      return;
    }

    // Get customer email and preferences
    const customerDoc = await db.collection('customer_profiles').doc(customerId).get();

    if (!customerDoc.exists) {
      console.log(`Customer ${customerId} not found`);
      return;
    }

    const customerData = customerDoc.data();
    const email = customerData?.email;

    if (!email) {
      console.log(`No email found for customer ${customerId}`);
      return;
    }

    // Check if customer has email notifications enabled
    const preferences = customerData?.notificationPreferences;
    if (!preferences?.emailEnabled) {
      console.log(`Email notifications disabled for customer ${customerId}`);
      return;
    }

    // Prepare email content
    let emailHtml = notification.html;
    let emailSubject = notification.subject;

    // Use template if specified
    if (notification.template && emailTemplates[notification.template as keyof typeof emailTemplates]) {
      emailHtml = emailTemplates[notification.template as keyof typeof emailTemplates](notification.templateData);
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
        email: 'noreply@omegaservices.com',
        name: "O'MEGA Services"
      },
      subject: emailSubject,
      html: emailHtml,
      // Add unsubscribe link in footer
      headers: {
        'List-Unsubscribe': `<https://kepleromega.netlify.app/customer/profile>`
      }
    };

    console.log(`Sending email to ${email} via SendGrid: ${emailSubject}`);

    const result = await sgMail.send(msg);

    console.log(`Email sent successfully to ${email}`, result);

    // Log email in notification history
    await db.collection('notification_history').add({
      customerId,
      ticketId: notification.ticketId,
      type: 'email',
      channel: 'email',
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      subject: emailSubject,
      metadata: {
        template: notification.template,
        sendgridMessageId: result[0]?.headers?.['x-message-id']
      }
    });

  } catch (error) {
    console.error('Error sending email notification:', error);

    // Log failed email attempt
    await db.collection('notification_history').add({
      customerId,
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

// Cloud Function: Trigger when ticket status changes
export const onTicketStatusChange = functions.firestore
  .document('tickets/{ticketId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status actually changed
    if (before?.status === after?.status) {
      return;
    }

    const ticketId = context.params.ticketId;
    const clientId = after?.clientId; // This is the client ID from tickets collection

    if (!clientId) {
      console.log(`No client ID found for ticket ${ticketId}`);
      return;
    }

    // Find customer profile - try multiple approaches
    let customerDoc = null;
    let customerId = null;
    let customerData = null;

    // First, try to find by linkedClientId (for customers registered with customer code)
    const linkedQuery = await db.collection('customer_profiles')
      .where('linkedClientId', '==', clientId)
      .limit(1)
      .get();

    if (!linkedQuery.empty) {
      customerDoc = linkedQuery.docs[0];
      customerId = customerDoc.id;
      customerData = customerDoc.data();
      console.log(`Found customer ${customerId} via linkedClientId for client ${clientId}`);
    } else {
      // If not found by linkedClientId, get the client data to find customers by email/phone
      const clientDoc = await db.collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        console.log(`Client ${clientId} not found`);
        return;
      }

      const clientData = clientDoc.data();
      const clientEmail = clientData?.email;
      const clientPhone = clientData?.phone;

      // Try to find customer by email first
      if (clientEmail) {
        const emailQuery = await db.collection('customer_profiles')
          .where('email', '==', clientEmail)
          .limit(1)
          .get();

        if (!emailQuery.empty) {
          customerDoc = emailQuery.docs[0];
          customerId = customerDoc.id;
          customerData = customerDoc.data();
          console.log(`Found customer ${customerId} via email ${clientEmail}`);
        }
      }

      // If not found by email, try by phone
      if (!customerDoc && clientPhone) {
        const phoneQuery = await db.collection('customer_profiles')
          .where('phoneNumber', '==', clientPhone)
          .limit(1)
          .get();

        if (!phoneQuery.empty) {
          customerDoc = phoneQuery.docs[0];
          customerId = customerDoc.id;
          customerData = customerDoc.data();
          console.log(`Found customer ${customerId} via phone ${clientPhone}`);
        }
      }

      if (!customerDoc) {
        console.log(`No customer profile found for client ${clientId} (tried linkedClientId, email, and phone)`);
        return;
      }
    }

    const preferences = customerData?.notificationPreferences;

    // Prepare notification content
    const statusLabels = {
      'pending': 'en attente',
      'in-progress': 'en cours',
      'completed': 'terminée'
    };

    const deviceInfo = `${after?.deviceType || 'Appareil'} ${after?.brand || ''} ${after?.model || ''}`.trim();
    const newStatus = statusLabels[after?.status as keyof typeof statusLabels] || after?.status;

    // Ensure we have a valid customer ID before proceeding
    if (!customerId) {
      console.log(`No valid customer ID found for ticket ${ticketId}`);
      return;
    }

    // Send push notification if enabled
    if (preferences?.pushEnabled) {
      await sendPushNotification(customerId, {
        title: 'Statut de réparation mis à jour',
        body: `Votre ${deviceInfo} est maintenant ${newStatus}`,
        ticketId,
        type: 'status_change',
        url: '/customer'
      });
    }

    // Send email notification if enabled
    if (preferences?.emailEnabled) {
      // Get customer name
      const customerName = customerData?.fullName || '';

      // Determine status colors and next steps
      let statusColor = '#e8f5e8';
      let statusBorder = '#4caf50';
      let nextSteps = '';

      switch (after?.status) {
        case 'in-progress':
          statusColor = '#fff3cd';
          statusBorder = '#ffc107';
          nextSteps = 'Notre technicien va examiner votre appareil et vous contacter pour un devis détaillé.';
          break;
        case 'completed':
          statusColor = '#e8f5e8';
          statusBorder = '#4caf50';
          nextSteps = 'Votre appareil est prêt à être récupéré. Contactez-nous pour organiser la récupération.';
          break;
        default:
          statusColor = '#e3f2fd';
          statusBorder = '#2196f3';
          nextSteps = 'Nous allons examiner votre demande et vous contacter sous 24h.';
      }

      await sendEmailNotification(customerId, {
        subject: `Mise à jour réparation - ${deviceInfo}`,
        template: 'statusUpdate',
        templateData: {
          customerName,
          deviceInfo,
          newStatus,
          ticketNumber: after?.ticketNumber || ticketId,
          updateDate: new Date().toLocaleDateString('fr-FR'),
          statusColor,
          statusBorder,
          nextSteps
        },
        ticketId
      });
    }

    // Log notification in history
    await db.collection('notification_history').add({
      customerId,
      ticketId,
      type: 'status_change',
      channel: preferences?.pushEnabled ? 'push' : 'email',
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        oldStatus: before?.status,
        newStatus: newStatus, // Use the French translated status
        deviceInfo,
        ticketNumber: after?.ticketNumber || ticketId // Include ticketNumber in metadata
      }
    });

    console.log(`Status change notification sent for ticket ${ticketId} to customer ${customerId}`);
  });

// Cloud Function: Trigger when new ticket is created
export const onTicketCreated = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snapshot, context) => {
    const ticket = snapshot.data();
    const ticketId = context.params.ticketId;
    const customerId = ticket?.clientId;

    if (!customerId) {
      console.log(`No customer ID found for new ticket ${ticketId}`);
      return;
    }

    // Get customer notification preferences
    const customerDoc = await db.collection('customer_profiles').doc(customerId).get();

    if (!customerDoc.exists) {
      console.log(`Customer profile not found for ${customerId}`);
      return;
    }

    const customerData = customerDoc.data();
    const preferences = customerData?.notificationPreferences;

    const deviceInfo = `${ticket?.deviceType || 'Appareil'} ${ticket?.brand || ''} ${ticket?.model || ''}`.trim();

    // Send welcome notification
    if (preferences?.pushEnabled) {
      await sendPushNotification(customerId, {
        title: 'Nouvelle réparation créée',
        body: `Votre ${deviceInfo} a été enregistré pour réparation`,
        ticketId,
        type: 'ticket_created',
        url: '/customer'
      });
    }

    if (preferences?.emailEnabled) {
      await sendEmailNotification(customerId, {
        subject: `Réparation créée - ${deviceInfo}`,
        html: `
          <h2>Votre réparation a été créée</h2>
          <p>Bonjour,</p>
          <p>Nous avons bien reçu votre ${deviceInfo} pour réparation.</p>
          <p><strong>Numéro de réparation:</strong> ${ticket?.ticketNumber || ticketId}</p>
          <p><strong>Statut actuel:</strong> En attente</p>
          <p><strong>Date de création:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          <br>
          <p>Vous pouvez suivre l'évolution de votre réparation sur votre <a href="https://app.omegaservices.com/customer">espace client</a>.</p>
          <br>
          <p>Cordialement,<br>L'équipe O'MEGA Services</p>
        `,
        ticketId
      });
    }

    console.log(`New ticket notification sent for ticket ${ticketId} to customer ${customerId}`);
  });

// Cloud Function: Clean up expired FCM tokens
export const cleanupExpiredTokens = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('Europe/Paris')
  .onRun(async () => {
    console.log('Starting FCM token cleanup...');

    try {
      const customersRef = db.collection('customer_profiles');
      const snapshot = await customersRef.get();

      let cleanedCount = 0;

      for (const doc of snapshot.docs) {
        const customerData = doc.data();
        const fcmTokens = customerData?.fcmTokens || [];

        if (fcmTokens.length > 0) {
          // Test each token by sending a test message
          const testResults = await Promise.allSettled(
            fcmTokens.map((token: string) =>
              admin.messaging().send({
                token,
                data: { test: 'cleanup' }
              }, true) // dryRun = true
            )
          );

          // Filter out invalid tokens
          const validTokens = fcmTokens.filter((token: string, index: number) =>
            testResults[index].status === 'fulfilled'
          );

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
      return null;

    } catch (error) {
      console.error('Error during FCM token cleanup:', error);
      return null;
    }
  });
