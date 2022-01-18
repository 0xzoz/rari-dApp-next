import { useCallback } from "react";
import { fromWei } from "utils/ethersUtils";
import { useRari } from "../context/RariContext";
import { fetchTVL } from "../utils/fetchTVL";

export const useTVLFetchers = () => {
  const { rari, fuse } = useRari();

  const getTVL = useCallback(() => fetchTVL(rari, fuse), [rari, fuse]);

  const getNumberTVL = useCallback(async () => {
     return parseFloat((await getTVL()).toString());
  }, [rari, getTVL]);
  

  return { getNumberTVL, getTVL };
};
