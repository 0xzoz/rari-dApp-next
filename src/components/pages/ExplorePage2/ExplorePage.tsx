import { Heading, useBreakpointValue, Image, Collapse } from "@chakra-ui/react";
import DashboardBox from "components/shared/DashboardBox";

import {
  Box,
  Center,
  HStack,
  SimpleGrid,
  Spacer,
  Text,
} from "@chakra-ui/layout";

import {
  ExploreGridBoxMetric,
  FuseAssetGridBox,
  VaultGridBox,
} from "./ExploreGridBox";

// Hooks
import { useTVLFetchers } from "hooks/useTVL";
import { useTranslation } from "next-i18next";
import { ReactNode, useMemo } from "react";

// Utils
import { smallUsdFormatter } from "utils/bigUtils";
import { Column, Row } from "lib/chakraUtils";

import {
  APIExploreData,
  SubgraphCToken,
  SubgraphPool,
} from "pages/api/explore";
import useSWR from "swr";

import axios from "axios";
import { makeGqlRequest } from "utils/gql";
import { GET_TOP_FUSE_POOLS } from "gql/fusePools/getTopFusePools";
import { getUniqueTokensForFusePools } from "utils/gqlFormatters";
import { fetchTokensAPIDataAsMap } from "utils/services";
import { TokensDataMap } from "types/tokens";

import ExploreFuseCard from "./ExploreFuseBox";

import { useAccountBalances } from "context/BalancesContext";
import { GET_RECOMMENDED_POOLS } from "gql/fusePools/getRecommendedPools";
import { GET_UNDERLYING_ASSETS_WITH_POOLS } from "gql/fusePools/getUnderlyingAssetsWithPools";
import TokenExplorer from "./TokenExplorer";

// Fetchers
const exploreFetcher = async (route: string): Promise<APIExploreData> => {
  // const data = await getExploreData();
  const { data }: { data: APIExploreData } = await axios.get(route);

  return data;
};

const topFusePoolsFetcher = async (): Promise<{
  pools: SubgraphPool[];
  tokensData: TokensDataMap;
}> => {
  // const data = await getExploreData();
  const { pools }: { pools: SubgraphPool[] } = await makeGqlRequest(
    GET_TOP_FUSE_POOLS
  );
  const tokenAddresses = getUniqueTokensForFusePools(pools);
  const tokensData = await fetchTokensAPIDataAsMap([
    ...Array.from(tokenAddresses),
  ]);

  return { pools, tokensData };
};

interface RecommendedMarketsMap {
  [tokenAddress: string]: {
    bestSupplyRate: string;
    poolId: string;
    assetIndex: number;
  };
}

type RecommendedPoolDataMap = { [token: string]: SubgraphPool };

interface RecommendedPoolsReturn {
  recommended: RecommendedMarketsMap;
  poolsMap: RecommendedPoolDataMap;
}

const recommendedPoolsFetcher = async (
  ...tokenAddresses: string[]
): Promise<RecommendedPoolsReturn> => {
  // Get all pools where any of these tokens exist
  const { underlyingAssets } = await makeGqlRequest(
    GET_UNDERLYING_ASSETS_WITH_POOLS,
    {
      tokenAddresses,
    }
  );

  const underlyingAssetsMap: {
    [token: string]: any;
  } = underlyingAssets.reduce(function (map: any, underlyingAsset: any) {
    map[underlyingAsset.address] = underlyingAsset;
    return map;
  }, {});

  const _uniquePools = new Set();
  for (let i = 0; i < underlyingAssets.length; i++) {
    const asset = underlyingAssets[i];
    asset.pools.forEach((pool: any) => _uniquePools.add(pool.id));
  }
  const uniquePools = [...Array.from(_uniquePools)] as string[];

  // Get Pools data
  const { pools } = await makeGqlRequest(GET_RECOMMENDED_POOLS, {
    poolIds: uniquePools,
    tokenIds: tokenAddresses,
  });

  let poolsMap: {
    [token: string]: SubgraphPool;
  } = pools.reduce(function (map: any, pool: any) {
    map[pool.id] = pool;
    return map;
  }, {});

  const map: RecommendedMarketsMap = {};

  for (let token of tokenAddresses) {
    const tokenData: {
      address: string;
      symbol: string;
      pools: { index: number; id: string }[];
    } = underlyingAssetsMap[token];

    const { pools } = tokenData;
    pools.forEach(({ id }) => {
      const pool = poolsMap[id];
      if (!!pool) {
        const assetIndex = pool.assets.findIndex(
          (asset) => asset.underlying.id === token
        );
        if (assetIndex < 0) return;

        const cToken = pool.assets[assetIndex];

        if (!!cToken) {
          // Create default if doesn't exist in map
          if (!map[token]) {
            map[token] = {
              bestSupplyRate: cToken.supplyAPY,
              poolId: id,
              assetIndex,
            };
          } else {
            // Update best supply rate
            if (
              parseFloat(cToken.supplyAPY) >
              parseFloat(map[token].bestSupplyRate)
            ) {
              map[token] = {
                bestSupplyRate: cToken.supplyAPY,
                poolId: id,
                assetIndex,
              };
            }
          }
        }
      }
    });
  }

  // reduce poolsMap to only pools which were recommended
  const recommendedPoolDataMap: RecommendedPoolDataMap = {};
  Object.values(map).forEach(({ poolId }) => {
    recommendedPoolDataMap[poolId] = poolsMap[poolId];
  });
  poolsMap = {};

  return {
    recommended: map,
    poolsMap: recommendedPoolDataMap,
  };
};

const useRecommendedPools = (tokens: string[]): RecommendedPoolsReturn => {
  const { data } = useSWR([...tokens], recommendedPoolsFetcher);
  return (
    data ?? {
      recommended: {},
      poolsMap: {},
    }
  );
};

const ExplorePage = () => {
  const { getNumberTVL } = useTVLFetchers();
  const { t } = useTranslation();

  const paddingX = useBreakpointValue({ base: 5, sm: 5, md: 10, lg: 10 });

  // Data
  // Fetchers
  const { data, error } = useSWR("/api/explore", exploreFetcher);
  const { data: topFusePools } = useSWR("topFusePools", topFusePoolsFetcher);
  const { results, tokensData } = data ?? {};
  const { pools: topPools, tokensData: topFusePoolsTokensData } =
    topFusePools ?? { pools: [], tokensData: {} };

  const [balances, significantTokens] = useAccountBalances();

  const { recommended, poolsMap } = useRecommendedPools(significantTokens);

  const recommendedTokens = useMemo(
    () =>
      [...Object.keys(recommended), ...Object.keys(recommended)].slice(0, 3),
    [recommended]
  );

  const hasBalances = useMemo(
    () => !!significantTokens.length,
    [significantTokens]
  );

  const {
    topEarningFuseStable,
    topEarningFuseAsset,
    mostPopularFuseAsset,
    mostBorrowedFuseAsset,
    cheapestStableBorrow,
  } = results ?? {};

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      color="#FFFFFF"
      px={paddingX}
      mt={5}
      width="100%"
    >
      {/* Main Row */}
      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="flex-start"
        w="100%"
        mb={5}
        h="350px"
        // bg="red"
      >
        <Box w="100%" h="100%" bg="" px={8} py={2}>
          <DashboardBox
            bg=""
            w="100%"
            h="100%"
            p={0}
            _hover={{ cursor: "pointer" }}
          >
            <Image h="100%" w="100%" src="static/drake.jpg" />
          </DashboardBox>
        </Box>

        <Spacer />

        <Box bg="" w="100%" h="100%" px={8} py={2}>
          <SimpleGrid columns={2} spacing={5} w="100%" h="100%">
            <HoverCard height="100%">
              <FuseAssetGridBox
                data={topEarningFuseStable}
                tokenData={
                  topEarningFuseStable
                    ? tokensData?.[topEarningFuseStable?.underlying.address]
                    : undefined
                }
                heading="Top Stable Lend"
              />
            </HoverCard>
            <HoverCard height="100%">
              <FuseAssetGridBox
                data={cheapestStableBorrow}
                tokenData={
                  cheapestStableBorrow
                    ? tokensData?.[cheapestStableBorrow?.underlying.address]
                    : undefined
                }
                heading="Top Stable Borrow"
                metric={ExploreGridBoxMetric.BORROW_RATE}
              />
            </HoverCard>
            <HoverCard height="100%">
              <FuseAssetGridBox
                data={mostPopularFuseAsset}
                tokenData={
                  mostPopularFuseAsset
                    ? tokensData?.[mostPopularFuseAsset?.underlying.address]
                    : undefined
                }
                heading="Most Supplied"
                metric={ExploreGridBoxMetric.TOTAL_SUPPLY}
              />
            </HoverCard>
            <HoverCard height="100%">
              <VaultGridBox />
            </HoverCard>
          </SimpleGrid>
        </Box>
      </Row>

      {/* Recommended Row */}
      <Collapse in={hasBalances} animateOpacity style={{ width: "100%" }}>
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          w="100%"
          h="100%"
          bg=""
          px={8}
          py={4}
        >
          <Column
            mainAxisAlignment="flex-start"
            crossAxisAlignment="flex-start"
            w="100%"
            h="100%"
            // bg="coral"
          >
            <Row
              mainAxisAlignment="flex-start"
              crossAxisAlignment="flex-end"
              w="100%"
              // h="20px"
            >
              <Heading>Recommended</Heading>
              <Text ml={3} color="grey">
                based on your positions
              </Text>
            </Row>

            <HStack
              justify="space-between"
              alignItems="flex-start"
              w="100%"
              h="100%"
              expand={true}
              // flex={1}
              py={4}
              spacing={4}
            >
              {[0, 1, 2].map((index) => (
                <HoverCard w="100%" h="100%" ml={0} bg="">
                  <ExploreFuseCard
                    pool={
                      poolsMap[recommended[recommendedTokens[index]]?.poolId] ??
                      undefined
                    }
                    assetIndex={
                      recommended[recommendedTokens[index]]?.assetIndex ??
                      undefined
                    }
                    tokenData={
                      tokensData?.[recommendedTokens[index]] ?? undefined
                    }
                    balance={balances[recommendedTokens[index]] ?? undefined}
                  />
                </HoverCard>
              ))}
            </HStack>
          </Column>
        </Row>
      </Collapse>

      {/* Top Fuse Pools */}
      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="flex-start"
        w="100%"
        h="100%"
        // bg="lime"
        px={8}
        py={4}
        my={3}
      >
        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          w="100%"
          h="100%"
          // bg="coral"
        >
          <Row
            mainAxisAlignment="flex-start"
            crossAxisAlignment="flex-end"
            w="100%"
            // h="20px"
          >
            <Heading>Top Fuse Pools</Heading>
            <Text ml={3} color="grey">
              based on total supply
            </Text>
          </Row>
          <HStack
            justify="space-between"
            alignItems="flex-start"
            w="100%"
            h="100%"
            expand={true}
            flex={1}
            py={4}
            spacing={4}
          >
            <HoverCard w="100%" h="100%">
              <ExploreFuseCard
                pool={topPools[0]}
                // tokensData={topFusePoolsTokensData}
              />
            </HoverCard>
            <HoverCard w="100%" h="100%">
              <ExploreFuseCard
                pool={topPools[1]}
                // tokensData={topFusePoolsTokensData}
              />
            </HoverCard>
            <HoverCard w="100%" h="100%">
              <ExploreFuseCard
                pool={topPools[2]}
                // tokensData={topFusePoolsTokensData}
              />
            </HoverCard>
          </HStack>
        </Column>
      </Row>

      {/* Top Fuse Pools */}
      <HStack
        justify="flex-start"
        align="flex-start"
        w="100%"
        h="100%"
        // bg="lime"
        px={8}
        py={4}
        my={3}
      >
        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          w="100%"
          h="100%"
        >
          <TokenExplorer />
        </Column>
      </HStack>
    </Column>
  );
};

const HoverCard = ({
  children,
  ...boxProps
}: {
  children?: ReactNode;
  [x: string]: any;
}) => {
  return (
    <DashboardBox
      border="1px solid #272727"
      _hover={{
        cursor: "pointer",
        bg: "#272727",
        opacity: 1,
        transform: "translateY(-7px) scale(1.00)",
        boxShadow: "0px .2px 4px grey;",
      }}
      transition="transform 0.2s ease 0s"
      opacity={0.9}
      {...boxProps}
    >
      {children}
    </DashboardBox>
  );
};

export default ExplorePage;
