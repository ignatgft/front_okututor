export const endpoints = {
  auth: {
    login: "/login",
    register: "/register",
    currentUser: "/me",
    google: "/auth/google",
  },
  courses: "/courses",
  courseById: (courseId) => `/courses/${courseId}`,
  courseReviews: (courseId) => `/courses/${courseId}/reviews`,
  userById: (userId) => `/user/${userId}`,
  userProfile: (userId) => `/user/${userId}/profile`,
  coursesByTeacher: (userId) => `/users/${userId}/courses`,
  createMeeting: "/create-meeting/",
};
