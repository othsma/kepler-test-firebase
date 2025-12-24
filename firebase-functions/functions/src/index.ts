import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

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

// Send email notification (placeholder - would integrate with email service)
async function sendEmailNotification(customerId: string, notification: {
  subject: string;
  html: string;
  ticketId?: string;
}) {
  try {
    // Get customer email
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

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    console.log(`Would send email to ${email}:`, notification.subject);

    // Example integration:
    // await sendgrid.send({
    //   to: email,
    //   from: 'noreply@omegaservices.com',
    //   subject: notification.subject,
    //   html: notification.html
    // });

  } catch (error) {
    console.error('Error sending email notification:', error);
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
    const customerId = after?.clientId;

    if (!customerId) {
      console.log(`No customer ID found for ticket ${ticketId}`);
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

    // Prepare notification content
    const statusLabels = {
      'pending': 'en attente',
      'in-progress': 'en cours',
      'completed': 'terminée'
    };

    const deviceInfo = `${after?.deviceType || 'Appareil'} ${after?.brand || ''} ${after?.model || ''}`.trim();
    const newStatus = statusLabels[after?.status as keyof typeof statusLabels] || after?.status;

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
      await sendEmailNotification(customerId, {
        subject: `Mise à jour réparation - ${deviceInfo}`,
        html: `
          <h2>Statut de votre réparation mis à jour</h2>
          <p>Bonjour,</p>
          <p>Le statut de votre réparation pour <strong>${deviceInfo}</strong> a été mis à jour.</p>
          <p><strong>Nouveau statut:</strong> ${newStatus}</p>
          <p><strong>Numéro de réparation:</strong> ${after?.ticketNumber || ticketId}</p>
          <p><strong>Date de mise à jour:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          <br>
          <p>Vous pouvez suivre l'évolution de votre réparation sur votre <a href="https://app.omegaservices.com/customer">espace client</a>.</p>
          <br>
          <p>Cordialement,<br>L'équipe O'MEGA Services</p>
        `,
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
        newStatus: after?.status,
        deviceInfo
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
