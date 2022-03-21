import { dfn } from '../deps.ts';
import { Menu, Resturant, WeekMenu, WeekMenuFetcher } from './lunch.ts';

interface DishOccurrence {
  startDate: string;
  mealProvidingUnit: { mealProvidingUnitName: string };
  displayNames: {
    dishDisplayName: string;
    displayNameCategory: {
      displayNameCategoryName: string;
    };
  }[];
  dishType: {
    dishTypeName: string;
    dishTypeNameEnglish: string;
  };
  dish: {
    recipes: {
      allergens: {
        allergenCode: string;
        allergenURL: string;
      }[];
    }[];
    dishName: string;
    totalEmission: number;
    prices: string;
  };
}

const apiUrl =
  'http://carbonateapiprod.azurewebsites.net/api/v1/mealprovidingunits/';

function formatDate(date: Date): string {
  return dfn.lightFormat(date, 'yyyy-MM-dd');
}

function parseApiDate(date: string): Date {
  return dfn.parse(date, 'M/dd/yyyy hh:mm:ss a', new Date(), {});
}

async function fetchApi(
  id: string,
  startDate: Date,
  endDate: Date
): Promise<DishOccurrence[]> {
  const url = new URL(`${id}/dishoccurrences`, apiUrl);
  url.searchParams.set('startDate', formatDate(startDate));
  url.searchParams.set('endDate', formatDate(endDate));

  const ab = new AbortController();
  try {
    const t = setTimeout(() => ab.abort(), 20000);
    const response = await fetch(url.toString(), {
      signal: ab.signal,
    });
    clearTimeout(t);
    return await response.json();
  } catch (error) {
    throw new Error('Failed to fetch menu', { cause: error });
  }
}

async function fetchWeekeMenu(id: string, date: Date): Promise<WeekMenu> {
  const startDate = dfn.startOfWeek(date);
  const endDate = dfn.nextFriday(date);

  const menus = new Map<string, Menu>();

  const data = await fetchApi(id, startDate, endDate);

  for (const dish of data) {
    const date = parseApiDate(dish.startDate);
    const menu = menus.get(date.toJSON()) ?? {
      date,
      dishes: { english: [], swedish: [] },
    };

    for (const displayName of dish.displayNames) {
      if (
        displayName.displayNameCategory.displayNameCategoryName === 'English'
      ) {
        menu.dishes.english.push({
          name: displayName.dishDisplayName,
          type: dish.dishType.dishTypeNameEnglish,
          allergens: dish.dish.recipes[0].allergens.map((a) => a.allergenCode),
          emmissions: dish.dish.totalEmission,
        });
      } else if (
        displayName.displayNameCategory.displayNameCategoryName === 'Swedish'
      ) {
        menu.dishes.swedish.push({
          name: displayName.dishDisplayName,
          type: dish.dishType.dishTypeName,
          allergens: dish.dish.recipes[0].allergens.map((a) => a.allergenCode),
          emmissions: dish.dish.totalEmission,
        });
      } else {
        console.error(
          `Unknown category ${displayName.displayNameCategory.displayNameCategoryName}`
        );
      }
    }

    menus.set(date.toJSON(), menu);
  }

  const days = Array.from(menus.values());

  return {
    date,
    days,
  } as WeekMenu;
}

function createWeekFetcher(id: string, next: boolean): WeekMenuFetcher {
  return async () => {
    const start = next ? dfn.nextMonday(new Date()) : new Date();
    const menu = await fetchWeekeMenu(id, start);
    return menu;
  };
}

export function createResturant(id: string): Resturant {
  return {
    weekFetcher: createWeekFetcher(id, false),
    nextWeekFetcher: createWeekFetcher(id, true),
  };
}
