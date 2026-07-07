type WishlistFolderPreviewProps = {
  title: string;
};

// Folder art is the exported SVG frame (frosted body, Items card, skeleton
// lines, 🎉) with its baked title removed; the live title + "0 item" are
// overlaid on top at the positions the baked text used to sit.
export function WishlistFolderPreview({ title }: WishlistFolderPreviewProps) {
  const shown = title.trim().length > 0 ? title : 'Folder name';
  const isPlaceholder = title.trim().length === 0;

  return (
    <div className="folder-preview">
      <img
        className="folder-preview-art"
        src="/assets/wishlist-folder-frame.svg"
        alt=""
        aria-hidden="true"
      />
      <div className="folder-preview-text">
        <span
          className={`folder-preview-title ${isPlaceholder ? 'is-placeholder' : ''}`}
        >
          {shown}
        </span>
        <span className="folder-preview-count">0 item</span>
      </div>
    </div>
  );
}
