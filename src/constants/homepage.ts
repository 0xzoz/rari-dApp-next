// Logos
import { ChainID } from "esm/utils/networks";
import { FusePoolMetric } from "utils/fetchFusePoolData";
import { Pool } from "utils/poolUtils";

/* Fuse Pools Marquee */
export interface HomepageFusePool {
  id: number;
  title?: string | null;
  subtitle?: string | null;
}

export const HOMEPAGE_FUSE_POOLS: { [chainId: number]: HomepageFusePool[] } = {
  [ChainID.ETHEREUM]: [
    {
      id: 0,
    },
    {
      id: 8,
    },

    {
      id: 6,
    },
    {
      id: 18,
    },
    {
      id: 9,
    },
    {
      id: 3,
    },

    {
      id: 24,
    },
    {
      id: 21,
    },
    {
      id: 23,
    },
    {
      id: 11,
    },
    {
      id: 5,
    },
    {
      id: 14,
    },
    {
      id: 13,
    },
    {
      id: 19,
    },
  ],
  [ChainID.ARBITRUM]: [
    {
      id: 0,
    },
    {
      id: 0,
    },
    {
      id: 0,
    },
    {
      id: 0,
    },
    {
      id: 0,
    },
    {
      id: 0,
    },
    {
      id: 0,
    },
    {
      id: 0,
    },
  ],
};

/* Opportunities */
export enum HomepageOpportunityType {
  EarnVault,
  FusePool,
  EarnPage,
  FusePage,
  Pool2Page,
  TranchesPage,
}

export interface HomepageOpportunity {
  type: HomepageOpportunityType;
  title: string;
  subtitle: string;
  icon: string;
  bgColor: string;
  // Conditional params
  vaultType?: Pool;
  fusePoolId?: number;
  fuseMetric?: FusePoolMetric;
}

export const HOMEPAGE_OPPORTUNIES: HomepageOpportunity[] = [
  {
    type: HomepageOpportunityType.FusePage,
    title: "Fuse",
    subtitle: "The first open interest rate market protocol",
    bgColor: "#E6303A",
    icon: "/static/icons/fuse-glow.svg",
  },
  {
    type: HomepageOpportunityType.EarnPage,
    title: "Vaults v1",
    subtitle: "Sustainable yield made easy",
    bgColor: "#6041FC",
    icon: "/static/icons/earn-glow.svg",
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "DAI Vault",
    subtitle: "Earn interest on DAI deposits",
    bgColor: "#FFA700",
    icon: "/static/icons/dai-glow.svg",
    vaultType: Pool.DAI,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "USDC Vault",
    subtitle: "Earn interest on USDC deposits",
    bgColor: "#2474cc",
    icon: "/static/icons/usdc-glow.svg",
    vaultType: Pool.USDC,
  },

  {
    type: HomepageOpportunityType.FusePool,
    title: "Tetranode's Pool",
    subtitle: "Lend RGT and borrow against it",
    bgColor: "#00BB28",
    icon: "/static/icons/tetranode-pool.svg",
    fusePoolId: 6,
    fuseMetric: FusePoolMetric.TotalSuppliedUSD,
  },
  {
    type: HomepageOpportunityType.FusePool,
    title: "Olympus Pool Party",
    subtitle: "Lend and borrow off sOHM",
    bgColor: "#00BEFF",
    icon: "/static/icons/olympus-pool.svg",
    fusePoolId: 18,
    fuseMetric: FusePoolMetric.TotalSuppliedUSD,
  },
];

export const HOMEPAGE_EARN_VAULTS: HomepageOpportunity[] = [
  {
    type: HomepageOpportunityType.EarnVault,
    title: "USDC Pool",
    subtitle: "Earn interest on USDC deposits",
    bgColor: "#1079FD",
    icon: "/static/icons/usdc-glow.svg",
    vaultType: Pool.USDC,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "ETH Pool",
    subtitle: "Earn interest on DAI deposits",
    bgColor: "#A5A7ED",
    icon: "/static/icons/eth-glow.svg",
    vaultType: Pool.ETH,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "DAI Pool",
    subtitle: "Earn interest on DAI deposits",
    bgColor: "#FFA700",
    icon: "/static/icons/dai-glow.svg",
    vaultType: Pool.DAI,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "Yield Pool",
    subtitle: "Earn interest on YIELD deposits",
    bgColor: "#101111",
    icon: "static/fuseicon.png",
    vaultType: Pool.YIELD,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "USDC Pool",
    subtitle: "Earn interest on USDC deposits",
    bgColor: "#1079FD",
    icon: "/static/icons/usdc-glow.svg",
    vaultType: Pool.USDC,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "ETH Pool",
    subtitle: "Earn interest on DAI deposits",
    bgColor: "#A5A7ED",
    icon: "/static/icons/eth-glow.svg",
    vaultType: Pool.ETH,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "DAI Pool",
    subtitle: "Earn interest on DAI deposits",
    bgColor: "#FFA700",
    icon: "/static/icons/dai-glow.svg",
    vaultType: Pool.DAI,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "Yield Pool",
    subtitle: "Earn interest on Yield deposits",
    bgColor: "#101111",
    icon: "static/fuseicon.png",
    vaultType: Pool.YIELD,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "USDC Pool",
    subtitle: "Earn interest on USDC deposits",
    bgColor: "#1079FD",
    icon: "/static/icons/usdc-glow.svg",
    vaultType: Pool.USDC,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "ETH Pool",
    subtitle: "Earn interest on DAI deposits",
    bgColor: "#A5A7ED",
    icon: "/static/icons/eth-glow.svg",
    vaultType: Pool.ETH,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "DAI Pool",
    subtitle: "Earn interest on DAI deposits",
    bgColor: "#FFA700",
    icon: "/static/icons/dai-glow.svg",
    vaultType: Pool.DAI,
  },
  {
    type: HomepageOpportunityType.EarnVault,
    title: "Yield Pool",
    subtitle: "Earn interest on Yield deposits",
    bgColor: "#101111",
    icon: "static/fuseicon.png",
    vaultType: Pool.YIELD,
  },
];
