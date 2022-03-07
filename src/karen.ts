import { dfn } from '../deps.ts';
import { Menu, Resturant, WeekMenu, WeekMenuFetcher } from './lunch.ts';

// BEWARE TRAVAELER! Here be dragons!

// Thank you to IT for figureing this out, it was a big help!
// https://github.com/cthit/chalmersit-lunch/blob/master/chalmrest.rb

// This site makes graphql requests to a api endpoint
// http://carbonatescreen.azurewebsites.net/menu/week/johanneberg-express/3d519481-1667-4cad-d2a3-08d558129279
// We copy that query and we can use other resturant ids found on the site below
// https://chalmerskonferens.se/en/api/

interface DishOccurrance {
  dishType: {
    name: string;
  };
  displayNames: [
    {
      name: string;
      sortOrder: number;
      categoryName: string;
    }
  ];
  startDate: string;
}

const menuQuery = `
  query MealQuery(
    $mealProvidingUnitID: String
    $startDate: String
    $endDate: String
  ) {
    dishOccurrencesByTimeRange(
      mealProvidingUnitID: $mealProvidingUnitID
      startDate: $startDate
      endDate: $endDate
    ) {
      displayNames {
        sortOrder
        name
        categoryName
      }
      startDate
      dishType {
        name
      }
    }
  }
  `;

const apiUrl = 'https://heimdallprod.azurewebsites.net/graphql';

function formatDate(date: Date): string {
  return dfn.lightFormat(date, 'yyyy-MM-dd');
}

function parseApiDate(date: string): Date {
  return dfn.parse(date, 'M/dd/yyyy hh:mm:ss a', new Date(), {});
}

export async function fetchWeekeMenu(
  id: string,
  date: Date
): Promise<WeekMenu> {
  const startDate = dfn.startOfWeek(date);
  const endDate = dfn.nextFriday(date);

  const body = {
    query: menuQuery,
    variables: {
      mealProvidingUnitID: id,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  const dishOccurrance: DishOccurrance[] = data.data.dishOccurrencesByTimeRange;

  const menus = new Map<string, Menu>();

  for (const dish of dishOccurrance) {
    const date = parseApiDate(dish.startDate);
    const menu = menus.get(date.toJSON()) ?? {
      date,
      dishes: { english: [], swedish: [] },
    };
    for (const displayNames of dish.displayNames) {
      if (displayNames.categoryName === 'English') {
        menu.dishes.english.push({
          name: displayNames.name,
          type: dish.dishType.name,
        });
      } else if (displayNames.categoryName === 'Swedish') {
        menu.dishes.swedish.push({
          name: displayNames.name,
          type: dish.dishType.name,
        });
      } else {
        console.log(`Unknown category ${displayNames.categoryName}`);
      }
    }
    menus.set(date.toJSON(), menu);
  }

  const days = Array.from(menus.values());

  return {
    date: startDate,
    days,
  } as WeekMenu;
}

const idNameMap = new Map<string, string>([
  ['johanneberg-express', '3d519481-1667-4cad-d2a3-08d558129279'],
  ['karresturangen', '21f31565-5c2b-4b47-d2a1-08d558129279'],
  ['hyllan', 'a7f0f75b-c1cb-4fc3-d2a6-08d558129279'],
  ['smak', '3ac68e11-bcee-425e-d2a8-08d558129279'],
]);

function createWeekFetcher(id: string, next: boolean): WeekMenuFetcher {
  return async () => {
    const start = next ? dfn.nextMonday(new Date()) : new Date();
    const menu = await fetchWeekeMenu(id, start);
    return menu;
  };
}

export function getId(name: string): string {
  return idNameMap.get(name) ?? '';
}

export function createResturant(id: string): Resturant {
  return {
    weekFetcher: createWeekFetcher(id, false),
    nextWeekFetcher: createWeekFetcher(id, true),
  };
}
