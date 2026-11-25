import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export function nextRecurringDate(fromDate, interval) {
  const d = new Date(fromDate);
  switch (interval) {
    case "DAILY":
      return addDays(d, 1);
    case "WEEKLY":
      return addWeeks(d, 1);
    case "MONTHLY":
      return addMonths(d, 1);
    case "YEARLY":
      return addYears(d, 1);
    default:
      return null;
  }
}
