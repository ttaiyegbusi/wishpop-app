export function PublicWishlistView({ shareToken }: { shareToken: string }) {
  return (
    <main className="app-shell public-list-shell">
      <section className="empty-panel">
        <p className="eyebrow">Public wishlist</p>
        <h1>Shared wishlist route is ready.</h1>
        <p>Share token: <code>{shareToken}</code></p>
        <p>Next step: fetch list data by token, then show items and reservation states to viewers.</p>
      </section>
    </main>
  );
}
