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
  SUPER_ADMIN: 'superAdmin'
};

// Authentication functions
export const registerUser = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, {
      displayName: fullName
    });
    
    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      fullName,
      phoneNumber: phoneNumber || '',
      role: ROLES.TECHNICIAN, // Default role
      createdAt: new Date().toISOString()
    });
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
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

// Function to create the super admin account if it doesn't exist
export const initializeSuperAdmin = async () => {
  try {
    const superAdminEmail = 'othsma@gmail.com';
    
    // Check if super admin already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', superAdminEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Creating super admin account...');
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
        
        console.log('Super admin created successfully');
      } catch (error: any) {
        // If the account already exists in Auth but not in Firestore
        if (error.code === 'auth/email-already-in-use') {
          console.log('Super admin auth account exists, but not in Firestore. Attempting to sign in...');
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
            
            console.log('Super admin Firestore record created');
          } catch (signInError) {
            console.error('Error signing in as super admin:', signInError);
          }
        } else {
          console.error('Error creating super admin:', error);
        }
      }
    } else {
      console.log('Super admin already exists');
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
};

export default app;