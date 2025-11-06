import apiClient from "../utils/apiClient";

/**
 * Simulate network delay
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch user profile data
 */
export const fetchUserProfile = async () => {
  try {
    console.log("Loading user profile...");

    const response = await apiClient.get('/auth/me');

    console.log("✅ User profile loaded!", response.data);
    // Backend returns { success: true, data: { user: {...} } }
    return response.data.data.user;
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
 */
export const fetchUserStores = async () => {
  try {
    console.log("Loading user stores...");
    await delay(1000);

    // const response = await apiClient.get('/api/user/stores');
    // return response.data.data;

    console.log("✅ User stores loaded!");
    // Mock data
    return [
      {
        id: 1,
        name: "Maxwell Urban Pet House",
        address: "Jl. Mampang Prapatan Raya",
        sentiment: "Good",
        reviews: 4,
        reviewCount: 67,
      },
      {
        id: 2,
        name: "Maxwell Pet House Tebet",
        address: "Jl. Tebet Barat Dalam",
        sentiment: "Bad",
        reviews: 2,
        reviewCount: 45,
      },
      {
        id: 3,
        name: "Maxwell Pet House Bintaro",
        address: "Jl. Bintaro Utama Sektor 9",
        sentiment: "Neutral",
        reviews: 3,
        reviewCount: 44,
      },
      {
        id: 4,
        name: "Maxwell Pet House Senopati",
        address: "Jl. Senopati Raya No. 12",
        sentiment: "Good",
        reviews: 4,
        reviewCount: 52,
      },
      {
        id: 5,
        name: "Maxwell Pet House Kemang",
        address: "Jl. Kemang Raya No. 8",
        sentiment: "Neutral",
        reviews: 3,
        reviewCount: 38,
      },
      {
        id: 6,
        name: "Maxwell Pet House Pondok Indah",
        address: "Jl. Metro Pondok Indah",
        sentiment: "Good",
        reviews: 5,
        reviewCount: 78,
      },
    ];
  } catch (error) {
    console.error("❌ Error fetching user stores:", error);
    throw error;
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