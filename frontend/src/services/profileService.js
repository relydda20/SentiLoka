import apiClient from "../utils/apiClient";

/**
 * Simulate network delay
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch user profile data with stats and locations
 */
export const fetchUserProfile = async () => {
  try {
    console.log("Loading user profile...");

    // First get the basic user info to get the slug
    const meResponse = await apiClient.get('/auth/me');
    const user = meResponse.data.data.user;

    console.log("✅ Basic user info loaded!", user);

    // Then fetch the full profile with stats and locations using the slug
    const profileResponse = await apiClient.get(`/users/${user.slug}`);

    console.log("✅ Full user profile loaded!", profileResponse.data);
    // Backend returns { success: true, data: { ...user, stats: {...}, locations: [...] } }
    return profileResponse.data.data;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch profile");
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    console.log("Updating user profile...", profileData);

    const response = await apiClient.put('/users/profile', profileData);

    console.log("✅ User profile updated!");
    return response.data.data;
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    throw new Error(error.response?.data?.message || "Failed to update profile");
  }
};

/**
 * Change user password
 */
export const changePassword = async (passwordData) => {
  try {
    console.log("Changing password...");

    const response = await apiClient.post('/users/change-password', passwordData);

    console.log("✅ Password changed!");
    return response.data;
  } catch (error) {
    console.error("❌ Error changing password:", error);
    throw new Error(error.response?.data?.message || "Failed to change password");
  }
};

/**
 * Fetch user stores/locations
 * Note: This is now handled by fetchUserProfile which returns locations in the response
 * Keeping this function for backwards compatibility but it now fetches from the same endpoint
 */
export const fetchUserStores = async () => {
  try {
    console.log("Loading user stores...");

    // First get the basic user info to get the slug
    const meResponse = await apiClient.get('/auth/me');
    const user = meResponse.data.data.user;

    // Then fetch the full profile with locations using the slug
    const profileResponse = await apiClient.get(`/users/${user.slug}`);

    console.log("✅ User stores loaded!", profileResponse.data.data.locations);
    // Return just the locations array from the backend response
    return profileResponse.data.data.locations || [];
  } catch (error) {
    console.error("❌ Error fetching user stores:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch user stores");
  }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file) => {
  try {
    console.log("Uploading avatar...");
    await delay(1500);

    // const formData = new FormData();
    // formData.append('avatar', file);
    // const response = await apiClient.post('/api/user/avatar', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' }
    // });
    // return response.data.data;

    console.log("Avatar uploaded!");
    // Mock response
    return {
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl: URL.createObjectURL(file),
    };
  } catch (error) {
    console.error("❌ Error uploading avatar:", error);
    throw error;
  }
};