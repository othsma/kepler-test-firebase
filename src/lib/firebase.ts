import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';

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
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// User roles
export const ROLES = {
  TECHNICIAN: 'technician',
  SUPER_ADMIN: 'superAdmin',
  CUSTOMER: 'customer'
};

// Authentication functions
export const registerUser = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
  let createdUser = null;

  try {
    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    createdUser = userCredential.user;

    // Step 2: Update Auth profile
    await updateProfile(createdUser, { displayName: fullName });

    try {
      // Step 3: Create Firestore document
      await setDoc(doc(db, 'users', createdUser.uid), {
        uid: createdUser.uid,
        email,
        fullName,
        phoneNumber: phoneNumber || '',
        role: ROLES.TECHNICIAN, // Staff registration defaults to TECHNICIAN
        createdAt: new Date().toISOString()
      });

      // Step 4: Verify document exists
      const docSnap = await getDoc(doc(db, 'users', createdUser.uid));

      if (!docSnap.exists()) {
        throw new Error('Firestore document verification failed');
      }

      return { success: true, user: createdUser };

    } catch (firestoreError: any) {
      // Rollback: Delete Auth user if Firestore fails
      if (createdUser) {
        await createdUser.delete();
      }
      return { success: false, error: `Échec de la création du profil utilisateur: ${firestoreError.message}` };
    }

  } catch (authError: any) {
    return { success: false, error: `Échec de la création du compte: ${authError.message}` };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (fullName: string, phoneNumber?: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is signed in');
    
    // Update auth profile
    await updateProfile(user, {
      displayName: fullName
    });
    
    // Update Firestore document
    await setDoc(doc(db, 'users', user.uid), {
      fullName,
      phoneNumber: phoneNumber || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUserEmail = async (newEmail: string, password: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user is signed in');
    
    // Re-authenticate user (required for sensitive operations)
    await signInWithEmailAndPassword(auth, user.email, password);
    
    // Update email
    await updateEmail(user, newEmail);
    
    // Update Firestore document
    await setDoc(doc(db, 'users', user.uid), {
      email: newEmail,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user is signed in');
    
    // Re-authenticate user
    await signInWithEmailAndPassword(auth, user.email, currentPassword);
    
    // Update password
    await updatePassword(user, newPassword);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserRole = async (uid: string) => {
  try {
    // First check if user exists in the users collection (admin/staff)
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }

    // If not found in users collection, check if they have a customer profile
    const customerDoc = await getDoc(doc(db, 'customer_profiles', uid));
    if (customerDoc.exists()) {
      return ROLES.CUSTOMER;
    }

    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const getAllTechnicians = async () => {
  try {
    const techniciansQuery = query(
      collection(db, 'users'),
      where('role', '==', ROLES.TECHNICIAN)
    );
    
    const snapshot = await getDocs(techniciansQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting technicians:', error);
    return [];
  }
};

export const updateUserRole = async (uid: string, newRole: string) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      role: newRole,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Customer-specific authentication functions
export const registerCustomer = async (email: string, password: string, fullName: string, phoneNumber?: string, customerCode?: string) => {
  let createdUser = null;
  let linkedClient = null;

  try {
    // Step 1: Check for customer code first (highest priority)
    if (customerCode) {
      linkedClient = await findClientByCode(customerCode);

      if (linkedClient) {
        // Pre-fill data from client record if available
        if (!email && linkedClient.email) email = linkedClient.email;
        if (!fullName && linkedClient.name) fullName = linkedClient.name;
        if (!phoneNumber && linkedClient.phone) phoneNumber = linkedClient.phone;
      } else {
        return { success: false, error: 'Code d\'accès client invalide' };
      }
    } else {
      // Step 2: Check for existing client with matching email/phone
      linkedClient = await findClientByEmailOrPhone(email, phoneNumber);
    }

    // Step 2: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    createdUser = userCredential.user;

    // Step 3: Update Auth profile
    await updateProfile(createdUser, { displayName: fullName });

    // NOTE: Customers don't get user documents in the 'users' collection
    // They only get customer profiles for authentication to work properly

    try {
      // Step 4: Create customer profile document
      const profileData: any = {
        id: createdUser.uid,
        email,
        fullName,
        phoneNumber: phoneNumber || '',
        preferredLanguage: 'fr',
        notificationPreferences: {
          pushEnabled: false,
          emailEnabled: true,
          smsEnabled: false,
        },
        fcmTokens: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      // If client was found, link them
      if (linkedClient) {
        profileData.linkedClientId = linkedClient.id;
        profileData.linkedAt = new Date().toISOString();
      }

      await setDoc(doc(db, 'customer_profiles', createdUser.uid), profileData);

      // Step 5: Link client if found
      if (linkedClient) {
        await linkClientToCustomer(linkedClient.id, createdUser.uid);
      }

      // Step 6: Verify customer profile exists
      const profileDocSnap = await getDoc(doc(db, 'customer_profiles', createdUser.uid));

      if (!profileDocSnap.exists()) {
        throw new Error('Customer profile document verification failed');
      }

      return {
        success: true,
        user: createdUser,
        linkedClient: linkedClient || null
      };

    } catch (firestoreError: any) {
      // Rollback: Delete Auth user if Firestore fails
      if (createdUser) {
        await createdUser.delete();
      }
      return { success: false, error: `Échec de la création du compte client: ${firestoreError.message}` };
    }

  } catch (authError: any) {
    return { success: false, error: `Échec de la création du compte: ${authError.message}` };
  }
};

export const loginCustomer = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Update last login time
    await setDoc(doc(db, 'customer_profiles', userCredential.user.uid), {
      lastLoginAt: new Date().toISOString()
    }, { merge: true });

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Helper functions for client-customer linking
export const findClientByEmailOrPhone = async (email: string, phoneNumber?: string) => {
  try {
    // Check for client with matching email
    const emailQuery = query(collection(db, 'clients'), where('email', '==', email));
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      const clientDoc = emailSnapshot.docs[0];
      return {
        id: clientDoc.id,
        ...clientDoc.data(),
        matchType: 'email'
      };
    }

    // If no email match and phone provided, check phone
    if (phoneNumber) {
      const phoneQuery = query(collection(db, 'clients'), where('phone', '==', phoneNumber));
      const phoneSnapshot = await getDocs(phoneQuery);

      if (!phoneSnapshot.empty) {
        const clientDoc = phoneSnapshot.docs[0];
        return {
          id: clientDoc.id,
          ...clientDoc.data(),
          matchType: 'phone'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding client:', error);
    return null;
  }
};

export const linkClientToCustomer = async (clientId: string, customerId: string) => {
  try {
    // Update client with customer reference
    await setDoc(doc(db, 'clients', clientId), {
      linkedCustomerId: customerId,
      linkedAt: new Date().toISOString()
    }, { merge: true });

    // Update customer profile with client reference
    await setDoc(doc(db, 'customer_profiles', customerId), {
      linkedClientId: clientId,
      linkedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error linking client to customer:', error);
    return { success: false, error: error.message };
  }
};

export const generateCustomerCode = () => {
  // Generate a 6-character code (letters and numbers)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const findClientByCode = async (customerCode: string) => {
  try {
    const clientsQuery = query(collection(db, 'clients'), where('customerCode', '==', customerCode));
    const clientsSnapshot = await getDocs(clientsQuery);

    if (!clientsSnapshot.empty) {
      const clientDoc = clientsSnapshot.docs[0];
      const clientData = clientDoc.data();
      return {
        id: clientDoc.id,
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        ...clientData
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding client by code:', error);
    return null;
  }
};

// Function to create the super admin account if it doesn't exist
export const initializeSuperAdmin = async () => {
  try {
    const superAdminEmail = 'othsma@gmail.com';

    // Check if super admin already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', superAdminEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Super admin doesn't exist, create it
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, superAdminEmail, 'Egnirf999@');
        const user = userCredential.user;

        // Update profile
        await updateProfile(user, {
          displayName: 'Othsma'
        });

        // Store in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: superAdminEmail,
          fullName: 'Othsma',
          phoneNumber: '0033767695290',
          role: ROLES.SUPER_ADMIN,
          createdAt: new Date().toISOString()
        });
      } catch (error: any) {
        // If the account already exists in Auth but not in Firestore
        if (error.code === 'auth/email-already-in-use') {
          try {
            // Try to sign in
            const userCredential = await signInWithEmailAndPassword(auth, superAdminEmail, 'Egnirf999@');
            const user = userCredential.user;

            // Create Firestore record
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: superAdminEmail,
              fullName: 'Othsma',
              phoneNumber: '0033767695290',
              role: ROLES.SUPER_ADMIN,
              createdAt: new Date().toISOString()
            });
          } catch (signInError) {
            console.error('Error signing in as super admin:', signInError);
          }
        } else {
          console.error('Error creating super admin:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
};

export default app;
