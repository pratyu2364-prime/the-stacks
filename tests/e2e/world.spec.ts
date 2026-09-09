import { expect, test } from '@playwright/test';

const OPEN_LIBRARY = 'https://openlibrary.org/search.json*';

const HIT = {
  docs: [
    {
      key: '/works/OL2W',
      title: 'Cosmos',
      author_name: ['Carl Sagan'],
      number_of_pages_median: 396,
      subject: ['Astronomy', 'Popular science'],
    },
  ],
};

/** The claim: a book you logged is physically standing in your library. */
test('a shelved book appears on a shelf in the world', async ({ page }) => {
  await page.route(OPEN_LIBRARY, (route) => route.fulfill({ json: HIT }));

  await page.goto('signup');
  await page.getByTestId('email').fill(`walker-${Date.now()}@example.com`);
  await page.getByTestId('password').fill('correct horse battery');
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/dashboard/);

  await page.goto('books');
  await page.getByTestId('search').fill('cosmos');
  await page.getByTestId('results').getByRole('button').first().click();
  await page.getByTestId('add-confirm').click();
  await expect(page.getByTestId('library')).toContainText('Cosmos');

  // Reading books lie on the desk; finishing it puts it on a shelf.
  await page.getByTestId('library').getByText('Cosmos').click();
  await page.getByRole('button', { name: 'finished' }).click();

  await page.goto('library?lite');
  await expect.poll(async () => page.evaluate(() => window.__stacks?.titles ?? []), { timeout: 30_000 })
    .toContain('Cosmos');
});

test('a new account sees a world with every arch bricked up', async ({ page }) => {
  await page.goto('signup');
  await page.getByTestId('email').fill(`empty-${Date.now()}@example.com`);
  await page.getByTestId('password').fill('correct horse battery');
  await page.getByTestId('submit').click();

  await page.goto('library?lite');
  await expect(page.getByText('bricked up')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.__stacks?.titles ?? ['pending'])).toEqual([]);
});
