// import '../styles/ScoreTable.scss';

interface ScoreEntry {
  round: number;
  score: number;
  isWin: boolean;
}

interface ScoresTableProps {
  scores: number[];
  wins?: number[];
}

export default function ScoresTable({ scores, wins }: ScoresTableProps) {
  // Créer les entrées du tableau
  const entries: ScoreEntry[] = scores.map((score, index) => ({
    round: index + 1,
    score,
    isWin: wins ? wins[index] === 1 : false,
  }));

  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  const totalWins = wins ? wins.filter(w => w === 1).length : 0;

  return (
    <div className="scores-table-container">
      <table className="table table-dark table-sm">
        <thead>
          <tr>
            <th scope="col">Round</th>
            <th scope="col">Score</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.round}>
              <th scope="row">{entry.round}</th>
              <td>{entry.score}</td>
              <td>
                <span className={entry.isWin ? 'badge bg-success' : 'badge bg-danger'}>
                  {entry.isWin ? '✓ Win' : '✗ Loss'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="table-total">
            <th scope="row">Total</th>
            <td className="total-score">{totalScore}</td>
            <td className="total-wins">{totalWins}/{entries.length}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
