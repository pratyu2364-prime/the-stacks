import { expect, test, type Page } from '@playwright/test';

/**
 * The whole point of the product in one pass: make an account, shelve a book,
 * record a sitting, see it in the thread. Open Library is stubbed — this test is
 * about our behaviour, not theirs.
 */

const OPEN_LIBRARY = 'https://openlibrary.org/search.json*';

const HIT = {
  docs: [
    {
      key: '/works/OL27448W',
      title: 'The Brothers Karamazov',
      author_name: ['Fyodor Dostoevsky'],
      number_of_pages_median: 824,
      cover_i: null,
      subject: ['Russian literature', 'Fiction'],
    },
  ],
};

async function signUp(page: Page): Promise<string> {
  const email = `reader-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto('signup');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill('correct horse battery');
  await page.getByTestId('submit').click();
  return email;
}

test('a reader signs up, shelves a book, and logs a sitting', async ({ page }) => {
  await page.route(OPEN_LIBRARY, (route) => route.fulfill({ json: HIT }));

  await signUp(page);
  await expect(page).toHaveURL(/dashboard/);

  await page.goto('books');
  await page.getByTestId('search').fill('karamazov');
  await page.getByTestId('results').getByRole('button').first().click();

  await expect(page.getByTestId('confirm-add')).toBeVisible();
  await expect(page.getByTestId('add-pages')).toHaveValue('824');
  await page.getByTestId('add-confirm').click();

  const shelved = page.getByTestId('library').getByText('The Brothers Karamazov');
  await expect(shelved).toBeVisible();
  await shelved.click();

  await expect(page.getByRole('heading', { name: 'The Brothers Karamazov' })).toBeVisible();
  await page.getByTestId('session-from').fill('312');
  await page.getByTestId('session-to').fill('348');
  await page.getByTestId('session-minutes').fill('45');
  await page.getByTestId('session-note').fill('Ivan’s poem. The Inquisitor is right and that is the horror.');
  await page.getByTestId('session-save').click();

  await expect(page.getByTestId('thread')).toContainText('pp 312–348');
  await expect(page.getByTestId('thread')).toContainText('The Inquisitor');

  // Reloading proves it was written, not merely rendered.
  await page.reload();
  await expect(page.getByTestId('thread')).toContainText('45 min');
});

test('the dashboard counts the sitting that was just logged', async ({ page }) => {
  await page.route(OPEN_LIBRARY, (route) => route.fulfill({ json: HIT }));
  await signUp(page);

  await page.goto('books');
  await page.getByTestId('search').fill('karamazov');
  await page.getByTestId('results').getByRole('button').first().click();
  await page.getByTestId('add-confirm').click();
  await page.getByTestId('library').getByText('The Brothers Karamazov').click();

  await page.getByTestId('session-from').fill('10');
  await page.getByTestId('session-to').fill('60');
  await page.getByTestId('session-minutes').fill('30');
  await page.getByTestId('session-save').click();
  await expect(page.getByTestId('thread')).toContainText('pp 10-60'.replace('-', '\u2013'));

  await page.goto('dashboard');
  await expect(page.getByTestId('streak')).toHaveText('1');
  await expect(page.getByTestId('pages')).toHaveText('50');
  await expect(page.getByTestId('minutes')).toHaveText('30');
  await expect(page.getByTestId('reading-now')).toContainText('The Brothers Karamazov');
});

test('a signed-out reader is sent to the door', async ({ page }) => {
  await page.goto('books');
  await expect(page).toHaveURL(/login/);
});
