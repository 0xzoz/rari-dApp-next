import { NextPage } from "next";
import FusePoolpage from "components/pages/Fuse/FusePoolPage";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Heading } from "@chakra-ui/layout";

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
}

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

const FusePage: NextPage = () => {
  // return <Heading>
  return <FusePoolpage />
};

export default FusePage;
