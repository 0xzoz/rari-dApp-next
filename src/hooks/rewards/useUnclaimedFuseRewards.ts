import { useQuery } from "react-query";
import { useRari } from "../../context/RariContext";
import { createRewardsDistributor } from "utils/createComptroller";
import { flywheelsFilter } from "hooks/convex/useConvexRewards";

export interface RewardsDistributorToPoolsMap {
  [rD: string]: {
    [comptroller: string]: number;
  };
}

/**
 *
 * Unclaimed Rewards won't tell you the APY, only the unclaimed amt.
 *
 * **/

export function useUnclaimedFuseRewards() {
  const { fuse, address, chainId, isAuthed } = useRari();

  // 1. Fetch all Fuse Pools User has supplied to + their Rewards Distribs.
  const { data: _rewardsDistributorsByFusePool, error } = useQuery(
    "unclaimedRewards for " + "" + address + chainId,
    async () => {
      if (!isAuthed) return null

      const rewardsDistributorsByFusePool =
        await fuse.contracts.FusePoolLensSecondary.callStatic.getRewardsDistributorsBySupplier(
          address
        );

      return rewardsDistributorsByFusePool ?? [];
    }
  );

  const poolIndices: string[] = _rewardsDistributorsByFusePool?.[0] ?? [];
  const poolComptrollers: string[] = _rewardsDistributorsByFusePool?.[1] ?? [];
  const rewardsDistributorsByFusePool: string[][] =
    _rewardsDistributorsByFusePool?.[2] ?? [];

  const rewardsDistributorsToPoolsMap: RewardsDistributorToPoolsMap = {};

  // 1.a Construct a map of rewardsDistributors to fuse pools
  rewardsDistributorsByFusePool.forEach((rDs, i) => {
    // rDs, poolIndex, comptroller all refer to the same fuse pool
    const poolIndex = poolIndices[i];
    const comptroller = poolComptrollers[i];
    if (rDs.length) {
      rDs.forEach((rD) => {
        // If Rd doesnt exist in top level of map, set it and the nested first value
        if (!rewardsDistributorsToPoolsMap[rD]) {
          rewardsDistributorsToPoolsMap[rD] = {
            [comptroller]: parseFloat(poolIndex),
          };
        } else {
          // It exists already in the map
          rewardsDistributorsToPoolsMap[rD][comptroller] =
            parseFloat(poolIndex);
        }
      });
    }
  });


  // 2. Reduce this 2D array into a single deduped array of RewardsDistributors
  // New: Filter out Flywheels (hardcoded for now)
  const uniqueRDs: string[] = [
    ...new Set(
      rewardsDistributorsByFusePool?.reduce(function (prev, curr) {
        return prev.concat(curr);
      }, []) ?? []
    ),
  ].filter(rd => !Object.keys(flywheelsFilter).includes(rd.toLowerCase()));
  // 3. Create map of {[rewardToken: string] : RewardDistributor[] }

  // 3a. Query all individual RewardsDistributors for their rewardTokens
  const { data: _rewardsDistributors, error: _rdError } = useQuery(
    "rewardsDistributor data for " + address + " " + chainId + ` ${uniqueRDs.join(',')}`,
    async () => {

      const _rewardDistributorsData = await Promise.allSettled(
        uniqueRDs.map(async (rewardsDistributorAddress) => {

          const rdInstance = createRewardsDistributor(
            rewardsDistributorAddress,
            fuse
          );

          const obj: RewardsDistributorData = {
            rewardToken: await rdInstance.callStatic.rewardToken(),
            rewardsDistributorAddress,
            markets: await rdInstance.callStatic.getAllMarkets(),
            pools: Object.values(
              rewardsDistributorsToPoolsMap[rewardsDistributorAddress]
            ),
            comptrollers: Object.keys(
              rewardsDistributorsToPoolsMap[rewardsDistributorAddress]
            ),
          }

          _rewardDistributorsData


          return obj
        })
      );

      let _results = _rewardDistributorsData
        .filter(({ status }) => status === "fulfilled") as PromiseFulfilledResult<RewardsDistributorData>[]
      let results = _results.map(({ value }) => value)
      return results;
    }
  );

  // This is an array of RewardsDistributors we care about for this user
  const rewardsDistributors =
    _rewardsDistributors as RewardsDistributorData[];

  console.log({rewardsDistributors})
    // This is a one-to-one map of RewardsDistributors by rD address {rDaddress: RewardsDistributor}
  const rewardsDistributorsMap: RewardsDistributorMap = {};

  rewardsDistributors?.length &&
    rewardsDistributors.forEach((rD) => {
      rewardsDistributorsMap[rD.rewardsDistributorAddress] = rD;
    });

  //   3b. Construct a one-to-many map of rewardTokenAddr => RewardDistributorUnclaimed[]
  const rewardTokensMap: RewardsTokenMap = {};
  rewardsDistributors?.length &&
    rewardsDistributors.forEach((rD) => {
      const key = rD.rewardToken;
      // if value doesnt exist create it as array
      if (!rewardTokensMap[key]) {
        rewardTokensMap[key] = [rD];
      } else {
        // else append to array
        rewardTokensMap[key].push(rD);
      }
    });





  //  4.  getUnclaimedRewardsByDistributors
  const { data: _unclaimed, error: unclaimedErr } = useQuery(
    "unclaimed for " + address + ' ' + chainId,
    async () => {
      if (!isAuthed) return undefined

      console.log({uniqueRDs})
      const unclaimedResults =
        await fuse.contracts.FusePoolLensSecondary.callStatic.getUnclaimedRewardsByDistributors(
          address,
          uniqueRDs
        );


      // console.log({ address, uniqueRDs, unclaimedResults });

      const rewardTokens = unclaimedResults[0];
      const unclaimedAmounts = unclaimedResults[1];

      // console.log({ unclaimedAmounts });

      const results: { rewardToken: string; unclaimed: number }[] = [];

      if (rewardTokens.length)
        for (let i = 0; i < rewardTokens.length; i++) {
          const rewardToken = rewardTokens[i];
          const unclaimed = parseFloat(unclaimedAmounts[i]);
          const x = {
            rewardToken,
            unclaimed,
          };

          results.push(x);
        }

      return results;
    }
  );

  // Filter by claimable balances greater than 0
  const unclaimed: UnclaimedReward[] =
    _unclaimed?.filter((fuseUnclaimed) => {
      if (parseFloat(fuseUnclaimed.unclaimed.toString()) > 0) {
        return true;
      }
    }) ?? [];

  // console.log({ _unclaimed, unclaimed });

  //   console.log("rewards2", {
  //     rewardsDistributorsByFusePool,
  //     uniqueRDs,
  //     rewardsDistributors,
  //     rewardsDistributorsMap,
  //     rewardTokensMap,
  //     unclaimed,
  //   });

  //   handle generic err
  console.log({error, _rdError, unclaimedErr})
  const oopsie = error || _rdError || unclaimedErr;
  if (oopsie) console.log({ oopsie });

  console.log({
    rewardsDistributorsMap,
    rewardTokensMap,
    unclaimed,
    rewardsDistributorsToPoolsMap,
  })
  
  return {
    rewardsDistributorsMap,
    rewardTokensMap,
    unclaimed,
    rewardsDistributorsToPoolsMap,
  };
}

// maps a rewardTtoken to an array of RD addresses
export type RewardsTokenMap = {
  [rewardToken: string]: RewardsDistributorData[];
};

export interface RewardsDistributorData{
  rewardToken: string;
  rewardsDistributorAddress: string;
  markets: string[];
  pools: number[];
  comptrollers: string[];
}

export interface RewardsDistributorMap {
  [rewardsDistributorAddr: string]: RewardsDistributorData;
}

export interface UnclaimedReward {
  rewardToken: string;
  unclaimed: number;
}

// const fetchTokenPriceFromOracleWithFallback = async (oracleInstance: any, tokenAddress: string) => {
//   const tokenPrice = await oracleInstance.methods.price(tokenAddress).call()

// }
