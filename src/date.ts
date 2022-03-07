import { dfn } from '../deps.ts';

export function getLunchDate(): Date {
  /*  const afternoon = dayjs().startOf('day').hour(18);
  const now = dayjs();

  if (now.day() === 0 || now.day() === 6) {
    return now.startOf('week').add(1, 'week').toDate();
  } else if (now.isAfter(afternoon)) {
    if (now.day() === 5) {
      return now.startOf('week').add(1, 'week').toDate();
    } else {
      return now.add(1, 'week').toDate();
    }
  } else {
    return now.startOf('week').toDate();
  } */

  const today = dfn.startOfDay(new Date());
  const afternoon = dfn.setHours(today, 18);

  if (dfn.isAfter(new Date(), afternoon)) {
    return dfn.addBusinessDays(today, 1);
  } else if (dfn.isWeekend(new Date())) {
    return dfn.nextMonday(today);
  } else {
    return today;
  }
}

export function getStartOfWeek(): Date {
  /* const now = dayjs();
  if (now.day() === 0 || now.day() === 6) {
    return now.startOf('week').add(1, 'week').toDate();
  } else {
    return now.startOf('week').toDate();
  } */
  const now = new Date();
  if (dfn.isWeekend(now)) {
    return dfn.nextMonday(dfn.startOfDay(now));
  } else {
    return dfn.startOfWeek(now);
  }
}
