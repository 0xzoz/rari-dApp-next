import { useRari } from "context/RariContext";
import { BigNumber, constants, Contract } from "ethers";

import FlywheelLensABI from "contracts/abi/FlywheelRouter.json";
import { useQuery } from "react-query";
// import { formatEther } from "ethers/lib/utils";
import { useCallback } from "react";
import { Web3Provider } from "@ethersproject/providers";
import { filterOnlyObjectProperties } from "utils/fetchFusePoolData";
// import { getEthUsdPriceBN } from "esm/utils/getUSDPriceBN";
// import { FusePoolData } from "utils/fetchFusePoolData";
// import { getPriceFromOracles } from "hooks/rewards/useRewardAPY";
import { useConvexPoolSuppliedCTokens} from "hooks/fuse/useConvexPoolSuppliedCTokens";
// import { pools } from "constants/pools";
// import useCTokensWithRewardsPlugin from "./useMarketsWithPlugins";


const FLYWHEEL_LENS_ROUTER = "0xe7813367804d5a8bc19c27a143c8b837d373e3b7";

const createFlywheelLens = (provider: any) => new Contract(
  FLYWHEEL_LENS_ROUTER,
  JSON.stringify(FlywheelLensABI),
  provider
);


type FlywheelData = {
  [flywheel: string]: {
    rewardToken: string;
    rewardTokenSymbol: string;
    rewardTokenDecimals: number;
  };
};

// @todo - remove hardcoded flywheel data 
// Applies only to Pool 156
export const flywheels: FlywheelData = {
  "0x65dfbde18d7f12a680480abf6e17f345d8637829": {
    rewardToken: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    rewardTokenSymbol: "CRV",
    rewardTokenDecimals: 18,
  },
  "0x18b9ae8499e560bf94ef581420c38ec4cff8559c": {
    rewardToken: "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b",
    rewardTokenSymbol: "CVX",
    rewardTokenDecimals: 18,
  },
  "0x506ce4145833e55000cbd4c89ac9ba180647eb5e": {
    rewardToken: "0x5a98fcbea516cf06857215779fd812ca3bef1b32",
    rewardTokenSymbol: "LDO",
    rewardTokenDecimals: 18,
  },
};

// Mapping of flywheel -> Undelrying Claimable
type FlywheelRewardsTotal = {
  [flywheel: string]: BigNumber;
};

type FlywheelRewardsTotalUSD = {
  [flywheel: string]: number;
};

export type FlywheelRewardsByMarket = {
  [cToken: string]: FlywheelRewardsTotal;
};
interface FlywheelMaxClaimable {
  call: () => any;
  flywheelRewardsTotals: FlywheelRewardsTotal,
  estiamtedGas: BigNumber | undefined,
  hasClaimable: boolean;
}

// Notice: All cTokens passed in MUST be able to call `cToken.plugin().claimRewards()`
// Only used on Mainnnet Pool 156 data right now.
export const useMaxUnclaimedFlywheelRewardsByMarkets = (cTokens: string[]) => {
  const { fuse, address, chainId } = useRari();
  const { provider } = fuse

  const lens = createFlywheelLens(provider)

  // TODO - remove hardcoded flywheel data
  const flywheelAddresses = Object.keys(flywheels);
  const accrueForAll = new Array(flywheelAddresses.length).fill(true);
  const claimRewards = new Array(cTokens.length).fill(false);

  const { data, error } = useQuery(
    `Unclaimed by ${address} for markets ${cTokens?.join(" + ")}`,
    async () => {
      if (!cTokens || !cTokens.length || !address || chainId !== 1) return undefined;
      let flywheelRewardsTotals: FlywheelRewardsTotal = {};

      try {
        const obj = {
          address,
          cTokens,
          flywheelAddresses,
          accrueForAll,
          claimRewards,
        };

        let result: BigNumber[] =
          await lens.callStatic.getUnclaimedRewardsByMarkets(
            address,
            cTokens,
            flywheelAddresses,
            accrueForAll,
            claimRewards
          );

        let hasClaimable = false
        result.forEach(
          (claimable, i) => {
            if (!claimable.isZero()) hasClaimable = true
            flywheelRewardsTotals[flywheelAddresses[i]] = claimable
          }
        );

        let estimatedGas = await lens.estimateGas.getUnclaimedRewardsByMarkets(
          address,
          cTokens,
          flywheelAddresses,
          accrueForAll,
          claimRewards
        );

        // console.log({ obj, result, flywheelRewardsTotals });

        return { flywheelRewardsTotals, estimatedGas, hasClaimable };
      } catch (err) {
        console.error(
          "error fetching CToken Rewards for " + cTokens.join(", ")
        );
      }
    }
  );

  const call = useCallback(() => {
    if (!address || !cTokens || !cTokens.length) return undefined;

    return lens.populateTransaction
      .getUnclaimedRewardsByMarkets(
        address,
        cTokens,
        flywheelAddresses,
        accrueForAll,
        claimRewards,
        { from: address }
      )
      .then((unsignedTx) => {
        const signer = (provider as Web3Provider).getSigner(address);
        return signer.sendTransaction(unsignedTx);
      });
  }, [address, cTokens, provider]);

  const obj = { ...data, call };
  return obj
};

/**
export const useFlywheelsTotalUSD = (
  flywheelRewards?: FlywheelRewardsTotal,
  pool: FusePoolData,
  fuse: Fuse,
) => {

  //   TODO: remove hardcoded flywheel
  const flywheelsAddresses = Object.keys(flywheelRewards ?? {});

  const { data, error } = useQuery(
    `USD Value Of flywheels ${flywheelsAddresses.join(", ")} for pool ${pool?.id
    }`,
    async () => {
      if (!pool || !flywheelRewards) return;
      let flywheelRewardsTotalsUSD: FlywheelRewardsTotalUSD = {};
      let sumUSD = 0;

      const ethUSD = await getEthUsdPriceBN();

      []

      await Promise.all(
        flywheelsAddresses.map(async (flywheelAddress) => {
          const ethPrice = await getPriceFromOracles(
            flywheels[flywheelAddress].rewardToken,
            pool.comptroller,
            fuse,
            true
          );

          // amountUSD = claimable by user * ethPrice * ethUSD
          const amountUSD = parseFloat(
            formatEther(
              flywheelRewards[flywheelAddress]
                .mul(ethPrice)
                .mul(ethUSD)
                .div(constants.WeiPerEther)
                .div(constants.WeiPerEther)
            )
          );

          flywheelRewardsTotalsUSD[flywheelAddress] = amountUSD;
          sumUSD += amountUSD;
        })
      );

      return { flywheelRewardsTotalsUSD, sumUSD };
    }
  );

  const { flywheelRewardsTotalsUSD, sumUSD } = data ?? {
    flywheelRewardsTotalsUSD: {},
    sumUSD: 0,
  };
  return { flywheelRewardsTotalsUSD, sumUSD };
};
 */


const POOL_156_MARKETS_WITH_PLUGINS = [
  "0xEee0de9187B8B1Ba554E406d0b36a807A00B0ea5",
  "0x03C2d837e625E0f5CC8f50084b7986863c82102C",
  "0x5E479875Ed69d4F09f7bCAaF71E9879b12d9e326",
  "0x3c37CdA5C30952E48aFcc40443A9296e59DAAcA9",
  "0x97b8c935e130cBa777579Ea2460c4C3e78a48a61",
  "0x2ec70d3Ff3FD7ac5c2a72AAA64A398b6CA7428A5",
  "0xe71b4Cb8A99839042C45CC4cAca31C85C994E79f"
]

export const POOL_156_COMPTROLLER = "0x07cd53380fe9b2a5e64099591b498c73f0efaa66"

export const useConvexMaxClaimable = () => {
  const cTokens = useConvexPoolSuppliedCTokens(POOL_156_COMPTROLLER)
  console.log({cTokens})
  const convexRewards = useMaxUnclaimedFlywheelRewardsByMarkets(POOL_156_MARKETS_WITH_PLUGINS)
  return convexRewards
}


interface CTokenPluginRewardsMap {
  [cToken: string]: FlywheelPluginRewardsMap
}

export type FlywheelPluginRewardsMap = {
  [flywheel: string]: {
    rewardToken: string;
    formattedAPR: number;
  }
}


export interface FlywheelCTokensMap {
  [flywheel: string]: string[]
}

interface MarketRewardInfo {
  market: string;
  rewardsInfo: RewardsInfo[];
}

interface RewardsInfo {
  flywheel: string,
  formattedAPR: BigNumber,
  rewardToken: string
}

export interface FlywheelIncentivesData {
  hasIncentives: boolean;
  incentives: CTokenPluginRewardsMap;
  rewardsDistributorCtokens: FlywheelCTokensMap;
  rewardTokens: string[];
}

export const useConvexPoolIncentives = (comptroller?: string): FlywheelIncentivesData | undefined => {
  const { fuse } = useRari();
  const { provider } = fuse

  const { data } = useQuery(`plugin incentives for pool ${comptroller}`, async () => {
    if (comptroller?.toLowerCase() !== "0x07cd53380fe9b2a5e64099591b498c73f0efaa66") return undefined
    const lens = createFlywheelLens(provider)
    let result: MarketRewardInfo[] = await lens.callStatic.getMarketRewardsInfo(comptroller)
    let cTokenPluginRewardsMap: CTokenPluginRewardsMap = {}
    let flywheelCTokensMap: FlywheelCTokensMap = {}
    let uniqueRewardTokens: Set<string> = new Set<string>()

    if (result) {
      result.forEach(marketRewardInfo => {
        const { market, rewardsInfo } = marketRewardInfo

        rewardsInfo.forEach(flywheelData => {
          const { flywheel, formattedAPR, rewardToken } = filterOnlyObjectProperties(flywheelData)
          const obj = {
            rewardToken,
            formattedAPR: parseFloat(formattedAPR.toString()) / 1e16,
          }

          if (!formattedAPR.isZero()) {
            uniqueRewardTokens.add(rewardToken)
            // flywheelCTokensMap[flywheel] = [...flywheelCTokensMap[flywheel], market]
            cTokenPluginRewardsMap[market] = {
              ...cTokenPluginRewardsMap[market],
              [flywheel]: obj
            }
          }
        })
      })
    }

    const rewardTokens = Array.from(uniqueRewardTokens)

    const _result: FlywheelIncentivesData = {
      incentives: cTokenPluginRewardsMap,
      hasIncentives: !!rewardTokens.length,
      rewardTokens,
      rewardsDistributorCtokens: flywheelCTokensMap
    }

    return _result
  })

  return data

}