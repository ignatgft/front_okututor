import { describe, it, expect, beforeEach } from "vitest";
import i18n, { loadLocale } from "./i18n";
import { getErrorMessage } from "./utils/errorMessage";
import { applicationStatusLabel, applicationStatusKey } from "./utils/statusLabels";

function ru() {
  return i18n.getFixedT("ru");
}
function en() {
  return i18n.getFixedT("en");
}

describe("Russian pluralization (spec §41, §69)", () => {
  beforeEach(async () => {
    await loadLocale("ru");
    await i18n.changeLanguage("ru");
  });

  const cases = [
    [1, "lesson", "1 занятие"],
    [2, "lesson", "2 занятия"],
    [5, "lesson", "5 занятий"],
    [21, "lesson", "21 занятие"],
    [22, "lesson", "22 занятия"],
    [25, "lesson", "25 занятий"],
    [1, "request", "1 заявка"],
    [3, "request", "3 заявки"],
    [10, "request", "10 заявок"],
    [1, "hour", "1 час"],
    [2, "hour", "2 часа"],
    [7, "hour", "7 часов"],
  ];

  it.each(cases)("pluralizes %i %s -> %s", (count, noun, expected) => {
    expect(ru()(`plural.${noun}`, { count })).toBe(expected);
  });
});

describe("English pluralization (spec §42)", () => {
  it("uses one/other", () => {
    expect(en()("plural.lesson", { count: 1 })).toBe("1 lesson");
    expect(en()("plural.lesson", { count: 3 })).toBe("3 lessons");
    expect(en()("plural.request", { count: 1 })).toBe("1 request");
    expect(en()("plural.request", { count: 8 })).toBe("8 requests");
  });
});

describe("application status labels (spec §73-74)", () => {
  it("maps enum -> friendly label, never raw enum", () => {
    expect(applicationStatusLabel("SCHEDULE_PROPOSED", ru())).toBe("Расписание предложено");
    expect(applicationStatusLabel("SCHEDULE_PENDING", ru())).toBe("Нужно согласовать расписание");
    expect(applicationStatusLabel("SCHEDULED", ru())).toBe("Расписание подтверждено");
    expect(applicationStatusLabel("PENDING", ru())).toBe("Ожидает ответа");
    expect(applicationStatusKey("ACCEPTED")).toBe("statuses.ACCEPTED");
  });
});

describe("domain error mapping (spec §68)", () => {
  it("maps backend machine codes to friendly ru text", () => {
    expect(getErrorMessage({ error: "SCHEDULE_CONFLICT" }, ru())).toBe(
      "Это время уже занято. Выберите другой вариант."
    );
    expect(getErrorMessage({ error: "MEETING_NOT_AVAILABLE" }, ru())).toBe(
      "Сейчас в занятие войти нельзя. Проверьте время начала занятия."
    );
  });

  it("falls back to message / default", () => {
    expect(getErrorMessage({ message: "backend message" }, en())).toBe("backend message");
  });
});
