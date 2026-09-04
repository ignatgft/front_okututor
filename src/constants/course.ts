/** Course domain constants — single source shared by wizard, tutor application and search. */

export interface CourseOption {
  readonly value: string;
  readonly labelKey: string;
}

export const COURSE_SUBJECTS = [
  { value: "Mathematics", labelKey: "course.subject.mathematics" },
  { value: "English", labelKey: "course.subject.english" },
  { value: "Russian", labelKey: "course.subject.russian" },
  { value: "IT", labelKey: "course.subject.it" },
  { value: "Physics", labelKey: "course.subject.physics" },
  { value: "Chemistry", labelKey: "course.subject.chemistry" },
  { value: "Biology", labelKey: "course.subject.biology" },
  { value: "History", labelKey: "course.subject.history" },
  { value: "Geography", labelKey: "course.subject.geography" },
  { value: "Music", labelKey: "course.subject.music" },
  { value: "Design", labelKey: "course.subject.design" },
  { value: "Sales", labelKey: "course.subject.sales" },
  { value: "Preparation for ORT", labelKey: "course.subject.ort" },
  { value: "Other", labelKey: "course.subject.other" },
] as const;

export type CourseSubject = (typeof COURSE_SUBJECTS)[number]["value"];
export type CourseSubjectOption = (typeof COURSE_SUBJECTS)[number];

export const COURSE_CATEGORIES = [
  { value: "School", labelKey: "course.category.school" },
  { value: "University", labelKey: "course.category.university" },
  { value: "Languages", labelKey: "course.category.languages" },
  { value: "Programming", labelKey: "course.category.programming" },
  { value: "Art", labelKey: "course.category.art" },
  { value: "Music", labelKey: "course.category.music" },
  { value: "Sports", labelKey: "course.category.sports" },
  { value: "Business", labelKey: "course.category.business" },
  { value: "Other", labelKey: "course.category.other" },
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number]["value"];
export type CourseCategoryOption = (typeof COURSE_CATEGORIES)[number];

export const COURSE_DAYS = [
  { value: "Monday", labelKey: "course.day.monday" },
  { value: "Tuesday", labelKey: "course.day.tuesday" },
  { value: "Wednesday", labelKey: "course.day.wednesday" },
  { value: "Thursday", labelKey: "course.day.thursday" },
  { value: "Friday", labelKey: "course.day.friday" },
  { value: "Saturday", labelKey: "course.day.saturday" },
  { value: "Sunday", labelKey: "course.day.sunday" },
] as const;

export type CourseDay = (typeof COURSE_DAYS)[number]["value"];
export type CourseDayOption = (typeof COURSE_DAYS)[number];

export const TUTOR_LANGUAGES = [
  { value: "Kyrgyz", labelKey: "course.language.kyrgyz" },
  { value: "Russian", labelKey: "course.language.russian" },
  { value: "English", labelKey: "course.language.english" },
  { value: "Turkish", labelKey: "course.language.turkish" },
  { value: "Uzbek", labelKey: "course.language.uzbek" },
] as const;

export type TutorLanguage = (typeof TUTOR_LANGUAGES)[number]["value"];
export type TutorLanguageOption = (typeof TUTOR_LANGUAGES)[number];

export const LOCATION_TYPES = [
  { value: "online", labelKey: "course.location.online" },
  { value: "offline", labelKey: "course.location.offline" },
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number]["value"];
export type LocationTypeOption = (typeof LOCATION_TYPES)[number];

export const GROUP_SIZES = [
  { value: "individual", labelKey: "course.group.individual" },
  { value: "group", labelKey: "course.group.group" },
] as const;

export type GroupSize = (typeof GROUP_SIZES)[number]["value"];
export type GroupSizeOption = (typeof GROUP_SIZES)[number];

/** Legacy helpers: returns just the value array for components not yet migrated. */
export const subjectValues: readonly string[] = COURSE_SUBJECTS.map((s) => s.value);
export const categoryValues: readonly string[] = COURSE_CATEGORIES.map((s) => s.value);
export const dayValues: readonly string[] = COURSE_DAYS.map((s) => s.value);
export const languageValues: readonly string[] = TUTOR_LANGUAGES.map((s) => s.value);
