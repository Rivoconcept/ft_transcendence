import { useEffect } from "react";
import { useSetAtom } from "jotai";

export function usePollingAtom(atom: any, interval: number) {
  const setAtom = useSetAtom(atom);

  useEffect(() => {
    const polling = setInterval(() => {
      setAtom((prev: any) => prev + 1);
    }, interval);

    return () => clearInterval(polling);
  }, [atom, interval, setAtom]);
}