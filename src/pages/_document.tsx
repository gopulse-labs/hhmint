import { Html, Head, Main, NextScript } from 'next/document'
import { VStack, Stack, Button, Image, Text, Grid, GridItem,
  Accordion, AccordionItem, AccordionButton,AccordionPanel,
  AccordionIcon, useMediaQuery, Container, Box } from "@chakra-ui/react";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
      </Head>
      
      <body >
        <Main  />
        <NextScript />
      </body>
      
    </Html>
  )
}
