import {
  isWeekend,
  nextMonday,
  isAfter,
  startOfHour,
  addBusinessDays,
  startOfDay,
  lightFormat,
} from 'https://esm.sh/date-fns';

// BEWARE TRAVAELER! Here be dragons!

// Thank you to IT for figureing this out, it was a big help!
// https://github.com/cthit/chalmersit-lunch/blob/master/chalmrest.rb

// This site makes graphql requests to a api endpoint
// http://carbonatescreen.azurewebsites.net/menu/week/johanneberg-express/3d519481-1667-4cad-d2a3-08d558129279
// We copy that query and we can use other resturant ids found on the site below
// https://chalmerskonferens.se/en/api/

interface LunchResponse {
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

interface Menu {
  lastUpdated: Date;
  dishes: Dish[];
}

interface Dish {
  type: string;
  name: string;
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

const todaysLunch = new Map<string, Menu>();

const idNameMap = new Map<string, string>([
  ['johanneberg-express', '3d519481-1667-4cad-d2a3-08d558129279'],
  ['karresturangen', '21f31565-5c2b-4b47-d2a1-08d558129279'],
]);

function formatDate(date: Date): string {
  return lightFormat(date, 'yyyy-MM-dd');
}

async function fetchRemoteMenu(
  id: string,
  language: 'Swedish' | 'English',
  startDate?: Date,
  endDate?: Date
): Promise<Dish[]> {
  const body = {
    query: menuQuery,
    variables: {
      mealProvidingUnitID: id,
      startDate: formatDate(startDate ?? new Date()),
      endDate: formatDate(endDate ?? new Date()),
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
  const expressData: LunchResponse[] = data.data.dishOccurrencesByTimeRange;

  return expressData.map((e) => {
    return {
      name: e.displayNames.find((n) => n.categoryName === language)!.name,
      type: e.dishType.name,
    };
  });
}

function getLunchDate(): Date {
  const afternoon = startOfHour(new Date());
  const now = new Date();
  if (isAfter(now, afternoon)) {
    return startOfDay(addBusinessDays(now, 1));
  } else if (isWeekend(now)) {
    return startOfDay(nextMonday(now));
  } else {
    return startOfDay(now);
  }
}

export const getLunch = async (id: string) => {
  const date = getLunchDate();
  const lunch = todaysLunch.get(id);
  if (lunch && !isAfter(date, lunch.lastUpdated)) {
    return lunch;
  }
  const menu = await fetchRemoteMenu(id, 'Swedish', date, date);
  const lunchMenu = { dishes: menu, lastUpdated: date };
  todaysLunch.set(id, lunchMenu);
  return lunchMenu;
};

export function getLunchByName(name: string): Promise<Menu> {
  const id = idNameMap.get(name);
  if (!id) {
    return Promise.reject(new Error('Bad resturant name'));
  }
  return getLunch(id);
}
