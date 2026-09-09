import { buildWorldModel, type Book, type Genre, type UserBook, type WorldModel } from '@stacks/domain';

const RAW: Array<[string, string, number, Genre]> = [
  ['The Brothers Karamazov', 'Dostoevsky', 824, 'philosophy'],
  ['Meditations', 'Marcus Aurelius', 254, 'philosophy'],
  ['Beyond Good and Evil', 'Nietzsche', 240, 'philosophy'],
  ['The Myth of Sisyphus', 'Camus', 212, 'philosophy'],
  ['Tao Te Ching', 'Laozi', 160, 'philosophy'],
  ['Letters from a Stoic', 'Seneca', 254, 'philosophy'],
  ['Fear and Trembling', 'Kierkegaard', 200, 'philosophy'],
  ['The Republic', 'Plato', 416, 'philosophy'],
  ['Sapiens', 'Harari', 498, 'science'],
  ['Thinking, Fast and Slow', 'Kahneman', 512, 'science'],
  ['The Selfish Gene', 'Dawkins', 360, 'science'],
  ['Cosmos', 'Sagan', 396, 'science'],
  ['Gödel, Escher, Bach', 'Hofstadter', 777, 'science'],
  ['Chaos', 'Gleick', 352, 'science'],
  ['A Brief History of Time', 'Hawking', 212, 'science'],
  ['The Order of Time', 'Rovelli', 240, 'science'],
  ['Behave', 'Sapolsky', 790, 'science'],
  ['One Hundred Years of Solitude', 'Márquez', 417, 'fiction'],
  ['Blood Meridian', 'McCarthy', 351, 'fiction'],
  ['Midnight’s Children', 'Rushdie', 647, 'fiction'],
  ['Beloved', 'Morrison', 324, 'fiction'],
  ['Never Let Me Go', 'Ishiguro', 288, 'fiction'],
  ['Norwegian Wood', 'Murakami', 389, 'fiction'],
  ['Things Fall Apart', 'Achebe', 209, 'fiction'],
  ['The God of Small Things', 'Roy', 340, 'fiction'],
  ['Disgrace', 'Coetzee', 220, 'fiction'],
  ['Pale Fire', 'Nabokov', 315, 'fiction'],
  ['A Fine Balance', 'Mistry', 603, 'fiction'],
];

/** A library to develop the world against, so it needs no database to run. */
export function fixtureModel(): WorldModel {
  const books: Book[] = RAW.map(([title, author, pages], i) => ({
    id: `b${i}`,
    olWorkKey: `/works/FIX${i}`,
    title,
    author,
    pages,
    coverId: null,
    subjects: [],
  }));

  const userBooks: UserBook[] = RAW.map(([, , , genre], i) => ({
    id: `u${i}`,
    bookId: `b${i}`,
    status: i < 2 ? 'reading' : 'finished',
    genre,
    rating: null,
    addedAt: '2026-01-01',
    finishedAt: i < 2 ? null : `2026-0${(i % 8) + 1}-01`,
  }));

  const sessions = [0, 1, 2].map((d) => ({
    id: `s${d}`,
    userBookId: 'u0',
    readOn: new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10),
    pageStart: 100 + d * 30,
    pageEnd: 130 + d * 30,
    minutes: 40,
    mood: null,
    note: null,
  }));

  return buildWorldModel(userBooks, books, sessions, new Date());
}
