type Props = {
  score: number;
  round: number;
};

export default function ScoreList({ score, round }: Props) {
  return (
    <li className="scoreItem">
      <span>Round ({round})</span>
      <span>{score}</span>
    </li>
  );
}
