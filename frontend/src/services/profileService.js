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
    await delay(800);

    // const response = await apiClient.get('/api/user/profile');
    // return response.data.data;

    console.log("✅User profile loaded!");
    // Mock data
    return {
      id: 1,
      name: "Maxwell",
      email: "maxwell@petstore.com",
      bio: "Hey, I'm Maxwell! I run a cozy pet store where every furry, feathery, and scaly friend is welcome. I started the shop out of my love for animals and a passion for helping people care for their pets. When I'm not at the store, you'll probably find me playing fetch with my dog, Luna, or trying to stop my cat from knocking things off the counter (again).",
      avatar: null,
      createdAt: "2023-01-15T00:00:00Z",
    };
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    console.log("Updating user profile...", profileData);
    await delay(1000);

    // const response = await apiClient.put('/api/user/profile', profileData);
    // return response.data.data;

    console.log("✅ User profile updated!");
    // Mock response
    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        ...profileData,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (passwordData) => {
  try {
    console.log("Changing password...");
    await delay(1200);

    // const response = await apiClient.post('/api/user/change-password', passwordData);
    // return response.data;

    console.log("✅ Password changed!");
    // Mock response
    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("❌ Error changing password:", error);
    throw error;
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