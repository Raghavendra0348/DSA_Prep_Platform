import './CoolBlobEffect.css';

/**
 * Splitting & Recombining Amorphous Liquid Blob (Black Theme)
 * 1. Starts as a single unshaped amorphous liquid blob in the center.
 * 2. Breaks apart piece-by-piece into multiple floating asymmetrical droplets.
 * 3. All pieces float and morph in the card.
 * 4. Recombines piece-by-piece back into the single unshaped blob.
 */
export function CoolBlobEffect() {
  return (
    <section className="blob-section" aria-hidden="true">
      <div className="blob-meta">
        {/* Core unshaped central blob */}
        <div className="blob-core"></div>

        {/* Droplet pieces that divide out one-by-one and recombine */}
        <div className="blob-piece blob-piece-1"></div>
        <div className="blob-piece blob-piece-2"></div>
        <div className="blob-piece blob-piece-3"></div>
        <div className="blob-piece blob-piece-4"></div>
        <div className="blob-piece blob-piece-5"></div>
      </div>
    </section>
  );
}

export const Component = CoolBlobEffect;
export default CoolBlobEffect;
