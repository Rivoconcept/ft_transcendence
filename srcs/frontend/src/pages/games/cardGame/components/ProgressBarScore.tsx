interface ProgressBar {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBar) => {
   return (
    <div className="progressBarContainer">
      <div
        className="progressBarFill"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
