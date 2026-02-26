export const PROFILE_STRINGS = {
    main: {
        title: "Profile",
    },
    table: {
        labels: {
            profileImage: "Profile Image",
            profileImageAlt: "Profile",
            name: "Name",
            email: "Email",
            role: "Role",
        },
        placeholders: {
            profileImage: "Profile Image",
            name: "Name",
            email: "Email",
            role: "Role",
        },
        actions: {
            save: "Save Changes",
            discard: "Discard",
            saving: "Saving...",
        },
    },
    toast: {
        profileLoadError: {
            title: "Failed to load profile",
            description: "Please try again",
        },
        profileUpdated: {
            title: "Profile updated",
            description: "Your profile was updated successfully!",
        },
        profileUpdateError: {
            title: "Failed to update profile",
            description: "Please try again",
        },
        profileImageError: {
            title: "Failed to update profile image",
            description: "Please select an image",
        },
        profileDiscard: {
            title: "Changes discarded",
            description: "Profile changes have been discarded.",
        },
    },
}; 

export type ProfileStringsType = typeof PROFILE_STRINGS;