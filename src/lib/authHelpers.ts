import { getAuth } from 'firebase/auth';
import { getUserRole, ROLES } from './firebase';

export type LoginType = 'staff' | 'customer';

/**
 * Checks user role and redirects to appropriate login page if needed
 * This should be called AFTER successful login to validate the user role
 * @param userId - The authenticated user's ID
 * @param loginType - The type of login page this is ('staff' or 'customer')
 * @returns true if user can proceed, false if redirected
 */
export const checkUserRoleAndRedirect = async (userId: string, loginType: LoginType): Promise<boolean> => {
  try {
    // Get user role from Firestore
    const userRole = await getUserRole(userId);

    // If role cannot be determined, allow access (let auth system handle it)
    if (!userRole) {
      return true;
    }

    // Check if user is trying to login on the correct page
    if (loginType === 'staff') {
      // Staff login page - only allow TECHNICIAN and SUPER_ADMIN
      if (userRole === ROLES.CUSTOMER) {
        // Customer trying to use staff login - redirect to customer login
        window.location.href = '/customer/login';
        return false;
      }
    } else if (loginType === 'customer') {
      // Customer login page - only allow CUSTOMER
      if (userRole === ROLES.TECHNICIAN || userRole === ROLES.SUPER_ADMIN) {
        // Staff trying to use customer login - redirect to staff login
        window.location.href = '/login';
        return false;
      }
    }

    // User role matches login type, allow access
    return true;

  } catch (error) {
    console.error('Error checking user role for login routing:', error);
    // On error, allow access to avoid breaking authentication
    return true;
  }
};

/**
 * Shows appropriate error message for wrong login page
 */
export const getLoginRedirectMessage = (loginType: LoginType): string => {
  if (loginType === 'staff') {
    return 'Ce compte est réservé aux clients. Veuillez utiliser l\'espace client.';
  } else {
    return 'Ce compte est réservé au personnel. Veuillez utiliser l\'espace staff.';
  }
};
