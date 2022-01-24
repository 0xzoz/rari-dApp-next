// Components
import { ModalDivider } from "components/shared/Modal";
import { SimpleTooltip } from "components/shared/SimpleTooltip";
import AppLink from "components/shared/AppLink";
import { AvatarGroup, Text } from "@chakra-ui/react";

// Hooks
import { letterScore, usePoolRSS } from "hooks/useRSS";

// Utils
import { Center, Column, Row, useIsMobile } from "lib/chakraUtils";
import { smallUsdFormatter } from "utils/bigUtils";
import { CTokenIcon } from "../../../shared/Icons/CTokenIcon";
import { usePoolIncentives } from "hooks/rewards/usePoolIncentives";
import { WhitelistedIcon } from "components/shared/Icons/WhitelistedIcon";

export const PoolRow = ({
  tokens,
  poolNumber,
  tvl,
  borrowed,
  name,
  noBottomDivider,
  isWhitelisted,
  comptroller,
}: {
  tokens: { symbol: string; address: string }[];
  poolNumber: number;
  tvl: number;
  borrowed: number;
  name: string;
  noBottomDivider?: boolean;
  isWhitelisted: boolean;
  comptroller: string;
}) => {
  const isEmpty = tokens.length === 0;

  const rss = usePoolRSS(poolNumber);
  const rssScore = rss ? letterScore(rss.totalScore) : "?";

  const isMobile = useIsMobile();
  const poolIncentives = usePoolIncentives(comptroller);

  const { hasIncentives } = poolIncentives;
  if (hasIncentives) {
    // console.log({ poolNumber, poolIncentives });
  }

  return (
    <>
      <AppLink
        href={"/fuse/pool/" + poolNumber}
        className="no-underline"
        width="100%"
      >
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="center"
          width="100%"
          height="90px"
          className="hover-row"
          pl={4}
          pr={1}
        >
          <Column
            pt={2}
            width={isMobile ? "100%" : "40%"}
            height="100%"
            mainAxisAlignment="center"
            crossAxisAlignment="flex-start"
          >
            {isEmpty ? null : (
              <SimpleTooltip label={tokens.map((t) => t.symbol).join(" / ")}>
                <AvatarGroup size="xs" max={30} mr={2}>
                  {tokens.map(({ address }) => {
                    return <CTokenIcon key={address} address={address} />;
                  })}
                </AvatarGroup>
              </SimpleTooltip>
            )}

            <Row
              mainAxisAlignment="flex-start"
              crossAxisAlignment="center"
              mt={isEmpty ? 0 : 2}
            >
              <WhitelistedIcon
                isWhitelisted={isWhitelisted}
                mr={2}
                boxSize={"15px"}
                mb="2px"
              />
              <Text>{name}</Text>
            </Row>
          </Column>

          {isMobile ? null : (
            <>
              <Center height="100%" width="13%">
                <b>{poolNumber}</b>
              </Center>
              <Center height="100%" width="16%">
                <b>{smallUsdFormatter(tvl)}</b>
              </Center>
              <Center height="100%" width="16%">
                <b>{smallUsdFormatter(borrowed)}</b>
              </Center>
              <Center height="100%" width="15%">
                <SimpleTooltip
                  label={
                    "Underlying RSS: " +
                    (rss ? rss.totalScore.toFixed(2) : "?") +
                    "%"
                  }
                >
                  <b>{rssScore}</b>
                </SimpleTooltip>
              </Center>
            </>
          )}
        </Row>
      </AppLink>

      {noBottomDivider ? null : <ModalDivider />}
    </>
  );
};
export default PoolRow;
