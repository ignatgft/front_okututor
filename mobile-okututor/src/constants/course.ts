export interface CourseOption {
  value: string;
  labelKey: string;
}

export const COURSE_SUBJECTS: CourseOption[] = [
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
];

export const COURSE_CATEGORIES: CourseOption[] = [
  { value: "School", labelKey: "course.category.school" },
  { value: "University", labelKey: "course.category.university" },
  { value: "Languages", labelKey: "course.category.languages" },
  { value: "Programming", labelKey: "course.category.programming" },
  { value: "Art", labelKey: "course.category.art" },
  { value: "Music", labelKey: "course.category.music" },
  { value: "Sports", labelKey: "course.category.sports" },
  { value: "Business", labelKey: "course.category.business" },
  { value: "Other", labelKey: "course.category.other" },
];

export const COURSE_DAYS: CourseOption[] = [
  { value: "Monday", labelKey: "course.day.monday" },
  { value: "Tuesday", labelKey: "course.day.tuesday" },
  { value: "Wednesday", labelKey: "course.day.wednesday" },
  { value: "Thursday", labelKey: "course.day.thursday" },
  { value: "Friday", labelKey: "course.day.friday" },
  { value: "Saturday", labelKey: "course.day.saturday" },
  { value: "Sunday", labelKey: "course.day.sunday" },
];

export const TUTOR_LANGUAGES: CourseOption[] = [
  { value: "Kyrgyz", labelKey: "course.language.kyrgyz" },
  { value: "Russian", labelKey: "course.language.russian" },
  { value: "English", labelKey: "course.language.english" },
  { value: "Turkish", labelKey: "course.language.turkish" },
  { value: "Uzbek", labelKey: "course.language.uzbek" },
];

export const LOCATION_TYPES: CourseOption[] = [
  { value: "online", labelKey: "course.location.online" },
  { value: "offline", labelKey: "course.location.offline" },
];

export const GROUP_SIZES: CourseOption[] = [
  { value: "individual", labelKey: "course.group.individual" },
  { value: "group", labelKey: "course.group.group" },
];

export const CURRENCIES: CourseOption[] = [
  { value: "KGS", labelKey: "course.currency.kgs" },
  { value: "USD", labelKey: "course.currency.usd" },
  { value: "RUB", labelKey: "course.currency.rub" },
];

/** Legacy helpers: returns just the value array for components not yet migrated. */
export const subjectValues = COURSE_SUBJECTS.map((s) => s.value);
export const categoryValues = COURSE_CATEGORIES.map((s) => s.value);
export const dayValues = COURSE_DAYS.map((s) => s.value);
export const languageValues = TUTOR_LANGUAGES.map((s) => s.value);
export const currencyValues = CURRENCIES.map((s) => s.value);