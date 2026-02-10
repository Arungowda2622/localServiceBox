// Shared auth utilities to avoid circular dependencies
let forceLogoutCallback = () => {};

/**
 * Set the forceLogout callback (called from App.js)
 */
export const setForceLogoutCallback = (callback) => {
  forceLogoutCallback = callback;
};

/**
 * Force logout - can be called from anywhere without circular dependency
 */
export const forceLogout = () => {
  forceLogoutCallback();
};
