const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Get SendGrid API key from Firebase config
const sendGridApiKey = functions.config().sendgrid?.key;

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

/**
 * Scheduled function that runs every 5 minutes to check and send reminder emails
 */
exports.checkReminders = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      // Query all reminders across all users that need to be sent
      // Using collectionGroup to search in all 'reminders' subcollections
      const remindersQuery = db.collectionGroup('reminders')
        .where('remindAt', '<=', now)
        .where('notified', '==', false);

      const snapshot = await remindersQuery.get();

      if (snapshot.empty) {
        console.log('No reminders to send');
        return null;
      }

      console.log(`Found ${snapshot.size} reminders to send`);

      const promises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const reminderId = doc.id;
        const reminderRef = doc.ref;

        try {
          // Get user language, default to 'en'
          const lang = data.userLang || 'en';

          // Prepare email content based on language
          const emailContent = {
            en: {
              subject: `Reminder: ${data.text}`,
              greeting: 'Hello,',
              body: 'This is a reminder for your task:',
              scheduled: 'Scheduled time:',
              regards: 'Best regards,',
              appName: 'My Assistant'
            },
            ru: {
              subject: `Напоминание: ${data.text}`,
              greeting: 'Привет,',
              body: 'Это напоминание для твоей задачи:',
              scheduled: 'Запланированное время:',
              regards: 'С уважением,',
              appName: 'Мой Помощник'
            }
          };

          const content = emailContent[lang] || emailContent.en;
          const scheduledTime = new Date(data.remindAt.toMillis()).toLocaleString(
            lang === 'ru' ? 'ru-RU' : 'en-US'
          );

          // Prepare email
          const emailData = {
            to: data.userEmail,
            from: 'reminder@your-app.com', // Change this to your verified sender email
            subject: content.subject,
            text: `${content.greeting}\n\n${content.body}\n\n${data.text}\n\n${content.scheduled} ${scheduledTime}\n\n${content.regards}\n${content.appName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">${lang === 'ru' ? 'Напоминание' : 'Reminder'}</h2>
                <p>${content.greeting}</p>
                <p>${content.body}</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="font-size: 18px; font-weight: bold; margin: 0;">${data.text}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                  ${content.scheduled} ${scheduledTime}
                </p>
                <p>${content.regards}<br>${content.appName}</p>
              </div>
            `
          };

          // Send email using SendGrid
          if (sendGridApiKey) {
            await sgMail.send(emailData);
            console.log(`Email sent successfully for reminder ${reminderId} to ${data.userEmail} (${lang})`);
          } else {
            console.warn('SendGrid API key not configured. Email not sent.');
            // In development, you might want to log the email instead
            console.log('Would send email:', emailData);
          }

          // Mark reminder as notified
          await reminderRef.update({ notified: true });
          console.log(`Reminder ${reminderId} marked as notified`);

        } catch (error) {
          console.error(`Error processing reminder ${reminderId}:`, error);
          // Don't mark as notified if email failed, so it can be retried
          // You might want to add retry logic or error tracking here
        }
      });

      await Promise.all(promises);
      console.log('All reminders processed');

      return null;
    } catch (error) {
      console.error('Error in checkReminders function:', error);
      throw error;
    }
  });
