import { lpe } from '../deps.ts';
import { Dish, Menu, Resturant, WeekMenu, WeekMenuFetcher } from './lunch.ts';

function convertMenu(menu: lpe.WeekMenu): WeekMenu {
  const toDish = (dish: string): Dish => ({ name: dish });
  const days: Menu[] = menu.days.map((day) => {
    const swedish = day.dishes.swedish.map(toDish);
    const english = day.dishes.english.map(toDish);
    return {
      date: day.date,
      dishes: { swedish, english },
    } as Menu;
  });
  const date = menu.days[0].date;
  return {
    date,
    days,
  };
}

function createWeekFetcher(): WeekMenuFetcher {
  return async () => {
    const ab = new AbortController();
    const t = setTimeout(() => ab.abort(), 20000);
    const response = await fetch(
      'http://www.cafelinsen.se/menyer/cafe-linsen-lunch-meny.pdf',
      {
        signal: ab.signal,
      }
    );
    clearTimeout(t);
    const data = await response.arrayBuffer();
    const doc = lpe.extract_pdf(new Uint8Array(data));
    return convertMenu(doc);
  };
}

export function createResturant(): Resturant {
  return {
    weekFetcher: createWeekFetcher(),
  };
}
