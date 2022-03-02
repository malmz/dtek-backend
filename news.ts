export interface News {
  title: string;
  body: string;
  published: Date;
  place?: string;
  startDate?: Date;
  endDate?: Date;
}

const testNews: News[] = [
  {
    title: 'Hackkväll',
    body: '<p>Har du en lurig labb, ett kul projekt att leka med, eller är du bara fikasugen? Ta dig då till NC:s övervåning efter afterschool på onsdag för hackkväll!</p>',
    place: 'NC',
    published: new Date(2022, 1, 30, 18, 18),
  },
  {
    title: 'DLudeaspning',
    body: '<p>Vill du veta vad spel är egentligen? Vill du öppna ditt tredje öga? Då ska du aspa DLude! Vi drar igång med aspning i Bibblan (NC) den 28/2 18:18 med info, spel och fika så det är bara att dyka upp!</p>',
    place: 'Bibblan',
    published: new Date(2022, 1, 28, 18, 18),
  },
];

export async function fetchNews(): Promise<News[]> {
  return await Promise.resolve(testNews);
}
