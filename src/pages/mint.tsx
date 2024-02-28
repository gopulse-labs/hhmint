// pages/profile.tsx
import { Heading, VStack } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const HHMint = dynamic(() => import("../components/HHMint"), { ssr: false });

export default function UserProfile() {
  const router = useRouter();
  const { userPublicKey } = router.query;

  return (
    <VStack gap={8} mt={16}>
      <Heading style={{
          fontFamily: "Engravers MT",
        }}>HeadlineHarmonies</Heading>

      <HHMint userPublicKey={userPublicKey as string} />
    </VStack>
  );
}