import { formatHeight, reasonLabels, type Pole } from '@/lib/pole-map/model';

export function ReviewList({ poles, onSelect }: {
  poles: readonly Pole[];
  onSelect: (pole: Pole) => void;
}) {
  return (
    <section className="pole-review-list" aria-labelledby="review-list-title">
      <h2 id="review-list-title">Under review · {poles.length}</h2>
      <table>
        <caption className="sr-only">Poles kept for a person to review</caption>
        <thead><tr><th scope="col">Pole</th><th scope="col">Street</th><th scope="col">Reason</th><th scope="col">Height</th></tr></thead>
        <tbody>
          {poles.map((pole) => (
            <tr key={pole.id} onClick={() => onSelect(pole)}>
              <td><button type="button" aria-label={`Review pole ${pole.id}`} onClick={(event) => {
                event.stopPropagation();
                onSelect(pole);
              }}>{pole.id}</button></td>
              <td>{pole.on_street}</td>
              <td>{pole.review_reason && reasonLabels[pole.review_reason]}</td>
              <td>{formatHeight(pole.height_ft)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
