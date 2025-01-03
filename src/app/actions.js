'use server'
 
import webpush from 'web-push'
 
webpush.setVapidDetails(
  'mailto:<xleobtsx@gmail.com>',
  'BMgM1RagSexiKc6vCGjFdmsz0i5X-ZlbiKmVgNWtxnrMplztM5OrKhwt7OJSrPyXg0b4mlCowwE6HPcji6JulTo',
  'gHMlJrLA0RsMrbOfntlUqbBSEbk4GkmqxDAu6cD4fLA'
)
 
let subscription
 
export async function subscribeUser(sub) {
  subscription = sub
  console.log({
    sub
  })
  // In a production environment, you would want to store the subscription in a database
  // For example: await db.subscriptions.create({ data: sub })
  return { success: true }
}
 
export async function unsubscribeUser() {
  subscription = null
  // In a production environment, you would want to remove the subscription from the database
  // For example: await db.subscriptions.delete({ where: { ... } })
  return { success: true }
}
 
export async function sendNotification(message) {
  if (!subscription) {
    throw new Error('No subscription available')
  }

  try {

  const transformedSubscription = {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime || null,
    keys: {
      auth: subscription.keys?.auth || "",
      p256dh: subscription.keys.p256dh || "",
    },
  };

    await webpush.sendNotification(
      transformedSubscription,
      JSON.stringify({
        title: 'Test Notification',
        body: message,
        icon: '/icon.png',
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}