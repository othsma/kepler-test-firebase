// Firebase Messaging Service Worker
// This file is required for Firebase Cloud Messaging to work

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAh1eF1NFXUzCSPppycYjqeWGrSj1fGJj0",
  authDomain: "kepler-omega-dd495.firebaseapp.com",
  projectId: "kepler-omega-dd495",
  storageBucket: "kepler-omega-dd495.appspot.com",
  messagingSenderId: "110852541952",
  appId: "1:110852541952:web:dcc1b0bbeb4dfabd1552e5",
  measurementId: "G-V4T01YLVWT"
};

// Initialize Firebase
console.log('🔥 SERVICE WORKER: Initializing Firebase...');
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
console.log('🔥 SERVICE WORKER: Initializing Firebase Messaging...');
const messaging = firebase.messaging();

console.log('🔥 SERVICE WORKER: Firebase Messaging initialized, setting up background handler...');

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('🔥 BACKGROUND MESSAGE RECEIVED:', payload);
  console.log('🔥 Notification data:', payload.notification);
  console.log('🔥 Custom data:', payload.data);
  console.log('🔥 BACKGROUND MESSAGE RECEIVED:', payload);
  console.log('🔥 Notification data:', payload.notification);
  console.log('🔥 Custom data:', payload.data);

  const notificationTitle = payload.notification?.title || 'O\'MEGA Services';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: payload.data?.icon || '/omegalogo.png',
    badge: payload.data?.badge || '/omegalogo.png',
    data: payload.data,
    tag: payload.data?.tag || 'repair-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Voir'
      },
      {
        action: 'dismiss',
        title: 'Ignorer'
      }
    ]
  };

  console.log('🔥 Showing notification:', notificationTitle, notificationOptions);

  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('✅ Background notification displayed successfully');
    })
    .catch((error) => {
      console.error('❌ Failed to show background notification:', error);
    });
});
