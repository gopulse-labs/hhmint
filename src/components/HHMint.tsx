import React, { useState, useEffect } from 'react';
import { VStack, Stack, Button, Text, Grid, GridItem, Image,
  Accordion, AccordionItem, AccordionButton,AccordionPanel,
  AccordionIcon, useMediaQuery, Container, Box, Alert,
  AlertIcon, AlertTitle, AlertDescription, Toast, useToast, Tooltip, IconButton, useDisclosure, } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { GenericFile, TransactionBuilderItemsInput, Umi, 
  generateSigner, percentAmount, signerIdentity, sol, transactionBuilder, createSignerFromKeypair, base58 } from '@metaplex-foundation/umi';
import { createNft, fetchAllDigitalAssetByUpdateAuthority, fetchAllDigitalAssetByVerifiedCollection, fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import { gridButtonsData } from './buttonData';
import axios from 'axios';
import parseString from 'xml2js';
import 'text-encoding';
import { PublicKey, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faTelegram, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import { InfoIcon } from '@chakra-ui/icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import fs from "node:fs";
import FormData from "form-data";
import OpenAI from "openai";





//TODO: configure environment variables

//TODO: move front end logic to generate image to serveless function

//TODO: use openai api to score headline for pricing during image generation function on vercel and create jwt token

//TODO: check scoring token against passed in score during mint process

//TODO: create jwt token for headlines array returned rss feed within getNews serverless function 
//to cross check that the user chosen headline passed into generateImage serverless function
//is part of the array of headlines from rss feed

//TODO: cross check jwt token again to be sure that no false data can be passed to mintHH function

//TODO: fetch asset data to disable minted headline and style cominations, then confirm again during minting

const solanaRpcUrl = process.env.solanaRpcUrl;
const openai = new OpenAI({
  apiKey: process.env.openAI, 
  dangerouslyAllowBrowser: true });

const hfApi = process.env.hfApi;
const hfApiEndpoint = process.env.hfApiEndpoint;
let currentPromptIndex = 0;
let umi: Umi;

library.add(faTwitter, faTelegram, faLinkedin, faGithub);

if (solanaRpcUrl) {
  umi = createUmi(solanaRpcUrl)
  .use(mplTokenMetadata())
  .use(bundlrUploader());
} else {
  console.error('RPC node environment variable is not defined.');
}

interface HHMintProps {
  userPublicKey?: string;
}

const HHMint: React.FC<HHMintProps> = ({ userPublicKey }) => {
  const { select, wallets, publicKey, disconnect } = useWallet();

  const frontEndKey = publicKey;

  const [news, setNews] = useState<string[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [scores1, setScores] = useState<Scores | null>(null);
  const [loading, setLoading] = useState(false);
  const [realData1, setRealData] = useState<ArrayBuffer | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isTouchDevice] = useMediaQuery("(hover: none) and (pointer: coarse)");

  const { isOpen, onOpen, onClose } = useDisclosure();

  const wallet = useWallet();
  umi.use(walletAdapterIdentity(wallet));

  const toast = useToast();

  // async function fetchAssets() {
  //   try {
  //     const owner = new PublicKey("DMteCYezdd8Pzhk7LpMF9fGcKBfiqA5kzmPguiZhENDe");
  //     let newKey = fromWeb3JsPublicKey(owner);
  //     const assets = await fetchAllDigitalAssetByUpdateAuthority(umi, newKey);
  //     console.log("Collection: " + assets);
  //   } catch (error) {
  //     console.error('Error fetching assets:', error);
  //   }
  // }

  useEffect(() => {
    if (userPublicKey) {
      console.log('Referral Key: ', userPublicKey);
    }
    //fetchAssets();
    fetchHeadline();
  }, [userPublicKey]);

  async function fetchHeadline() {
    try {
      const response = await axios.get('/api/getNews');
      
      setNews(response.data.headlines);
    } catch (error) {
        console.error('Error fetching news:', error);
    }
  }

  function handleStyleClick(style: string, id: string) {
    setSelectedStyle(style);
    gridButtonsData.forEach(button => {
      if (button.id !== id) {
        document.getElementById(button.id)?.classList.remove('selected');
      }
    });
    document.getElementById(id)?.classList.add('selected');
  }

  async function handleHeadlineClick(headline: string, index: number) {
    setSelectedHeadline(headline);
    document.querySelectorAll('.headline-button').forEach((button) => {
        button.classList.remove('selected');
    });
    document.getElementById(`headline-button-${index}`)?.classList.add('selected');
  }

  useEffect(() => {
    console.log(selectedStyle);
  }, [selectedStyle]);

  const prompts = [
    "Craft a masterpiece, channeling the aesthetic essence of " + selectedStyle + ", to convey the message behind the headline: " + '"' + selectedHeadline + '"',
    "Design an exquisite piece, drawing inspiration from the visual language of " + selectedStyle + ", to interpret the narrative within the headline: " + '"' + selectedHeadline + '"',
    "Produce an artistic marvel, embracing the stylistic elements of " + selectedStyle + ", to articulate the story encapsulated in the headline: " + '"' + selectedHeadline + '"',
    "Create a visual symphony, echoing the design ethos of " + selectedStyle + ", to mirror the essence of the headline: " + '"' + selectedHeadline + '"',
    "Fashion a captivating artwork, embodying the visual characteristics of " + selectedStyle + ", to depict the essence of the headline: " + '"' + selectedHeadline + '"',
    "Construct a striking composition, influenced by the aesthetic principles of " + selectedStyle + ", to illuminate the essence of the headline: " + '"' + selectedHeadline + '"',
    "Shape an evocative piece, drawing from the visual motifs of " + selectedStyle + ", to encapsulate the essence of the headline: " + '"' + selectedHeadline + '"',
    "Devise a stunning creation, inspired by the visual aesthetics of " + selectedStyle + ", to reflect the narrative conveyed in the headline: " + '"' + selectedHeadline + '"',
    "Forge an artistic interpretation, mirroring the visual cues of " + selectedStyle + ", to convey the underlying message of the headline: " + '"' + selectedHeadline + '"',
    "Sculpt an expressive artwork, embodying the stylistic nuances of " + selectedStyle + ", to capture the essence of the headline: " + '"' + selectedHeadline + '"'
  ];

  function arrayBufferToBase64(buffer: Iterable<number>) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

async function generateImage(selectedStyle: string | null) {
  try {
    setImageSrc(null);
    setLoading(true);

    const currentPrompt = prompts[currentPromptIndex];
    console.log(currentPrompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
          { role: "system", content: `Please provide a detailed analysis of the following news headline. Each category should be scored on a precise scale from 
            0.01 to 0.99, reflecting subtle differences in impact and significance based on the event's details and implications. Ensure that each score 
            truly captures the gradation of impact, significance, and anticipated coverage, avoiding rounding to general values unless absolutely fitting. Evaluate 
            each aspect carefully and justify each score with specific reasons drawn from the event's characteristics.”

          Scoring Guidelines:

            •	Global Impact: Score from 0.01 to 0.99, where 0.01 represents minimal impact and 0.99 indicates a profound global effect.
            Consider factors like international relations, global markets, and worldwide public health.
            •	Longevity: Score from 0.01 to 0.99, assessing how long the effects of the event will last. A score closer to 
            0.01 suggests transient effects, whereas 0.99 suggests changes or consequences enduring over generations.
            •	Cultural Significance: Evaluate how deeply the event influences cultural values, societal norms, and artistic
            expressions across different regions, scoring minutely to reflect the extent and depth of cultural penetration.
            •	Media Coverage: Assign a score based on the extent, depth, and duration of anticipated media attention across the globe.
            Detailed considerations should include the diversity of reporting sources, the sustained interest over time, and the intensity of the coverage.` },
          {
              role: "user",
              content: selectedHeadline || "No headline provided",
          },
      ],
  });

  

  let openAiResponse = completion.choices[0].message.content;

if (openAiResponse !== null) {
    //console.log(openAiResponse);
  const scores = extractScores(openAiResponse);
    console.log(scores);


    calculateAndSetAveragePrice(scores);
} else {
    console.error("Received null content from OpenAI completion.");
}
  
  
if (hfApi && hfApiEndpoint) {
  const response = await fetch(
    hfApiEndpoint,
    {
      headers: { Authorization: hfApi },
      method: "POST",
      body: JSON.stringify({ inputs: currentPrompt }),
    }
  );

  currentPromptIndex++;
  console.log(currentPromptIndex);
  
  if (currentPromptIndex === prompts.length) {
    currentPromptIndex = 0;
  }
  
  if (!response.ok) {
    setLoading(false);
    throw new Error(`HTTP error! Status: ${response.status}`);
  }


  const realData = await response.arrayBuffer();

  // Create a Blob from the ArrayBuffer
  const blob = new Blob([realData], { type: 'image/png' }); // Adjust MIME type as needed

  // Create an object URL for the Blob
  const imageUrl = URL.createObjectURL(blob);
  setLoading(false);
  setImageSrc(imageUrl);

  // Create a File object if needed
  const file = new File([blob], 'generated_image.png', { type: 'image/png' });
  setImageFile(file);
} else {
  console.error('Hugging Face API environment variable is not defined.');
}
} catch (error) {
console.error('Error fetching data:', error);
}
}

  function generateSpecialLink() {
    if (publicKey) {
      const specialLink = `http://localhost:3000/${publicKey.toBase58()}`;
      navigator.clipboard.writeText(specialLink)
        .then(() => {
          console.log('Special link copied to clipboard: ', specialLink);
        })
        .catch((error) => {
          console.error('Error copying to clipboard: ', error);
        });
    }
  }

  interface Scores {
    globalImpact: number;
    longevity: number;
    culturalSignificance: number;
    mediaCoverage: number;
}

function extractScores(responseText: string): Scores {
  const regexPatterns = {
      globalImpact: /Global Impact:\s*(\d+\.\d+)/,
      longevity: /Longevity:\s*(\d+\.\d+)/,
      culturalSignificance: /Cultural Significance:\s*(\d+\.\d+)/,
      mediaCoverage: /Media Coverage:\s*(\d+\.\d+)/
  };

  let scores: Scores = {
      globalImpact: 0,
      longevity: 0,
      culturalSignificance: 0,
      mediaCoverage: 0
  };

  // Iterate over each score type and attempt to find matches
  for (const [key, regex] of Object.entries(regexPatterns)) {
      const match = responseText.match(regex);
      if (match && match[1]) {
          scores[key as keyof Scores] = parseFloat(match[1]);  // Safely indexing using keyof Scores
      } else {
          console.error(`No match found for ${key}.`);
      }
  }
  setScores(scores)

  return scores;
}

const calculateAndSetAveragePrice = (scores: Scores) => {
  const { globalImpact, longevity, culturalSignificance, mediaCoverage } = scores;
  const average = (globalImpact + longevity + culturalSignificance + mediaCoverage) / 4;
  const finalPrice = average * 10;

  // Set the average as the new price
  setPrice(finalPrice);
};

  const handleMint = async (imageFile: File, selectedHeadline: string, selectedStyle: string, frontEndKey: PublicKey, scores: {
    globalImpact: number,
    longevity: number,
    culturalSignificance: number,
    mediaCoverage: number
}) => {
    console.log('Start mint process...');
    console.log("scores:" + scores.globalImpact)
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        if (result) {
          const base64Image = result.split(',')[1];
          const response = await axios.post('/api/mintHH', {
            image: base64Image,
            selectedHeadline: selectedHeadline,
            selectedStyle: selectedStyle,
            frontEndKey: frontEndKey.toBase58(),
            attributes: [
              { trait_type: "Global Impact", value: scores.globalImpact },
              { trait_type: "Longevity", value: scores.longevity },
              { trait_type: "Cultural Significance", value: scores.culturalSignificance },
              { trait_type: "Media Coverage", value: scores.mediaCoverage }
            ] 
          });
          

          if (response.status === 200) {
            console.log('Minting successful: ', response.data.serialized);
            const arr = Object.values(response.data.serialized) as unknown[];
            const uint8Array = new Uint8Array(arr.map(num => Number(num)));
            const deserialized = umi.transactions.deserialize(uint8Array);


            const signedDeserializedCreateAssetTx = await umi.identity.signTransaction(deserialized);
            const createAssetSignature = base58.deserialize(await umi.rpc.sendTransaction(signedDeserializedCreateAssetTx))[0]
            console.log(`\nAsset Created: https://solana.fm/tx/${createAssetSignature}}?cluster=devnet-alpha`);
          } else {
            console.error('Unexpected response status: ', response.status);
            return null;
          }
        } else {
          console.error('Error reading image file.');
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file: ', error);
      };

      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Error calling mint function: ', error);
      return null;
    }
    toast({
      title: 'Your HeadlineHarmonies NFT is being minted!',
      description: 'Check your wallet!',
      status: 'success',
      duration: 15000,
      isClosable: true,
      position: 'top', });
  };

  return !publicKey ? (
    
    <Stack gap={4} align="center">
 
      <Text style={{
          maxWidth: '80%',
          wordWrap: 'break-word',
          textAlign: 'center',
        }}>
      At the crossroads of art and technology lies a first-of-its-kind NFT collection where you can 
      own a unique visual rendering of unfolding history. The combination of sublime imagery and the 
      unfiltered hope and horror of our modern world converges with the power of generative AI to 
      transform a headline into a piece of digital history.
      </Text>
      
      {wallets.filter((wallet) => wallet.readyState === "Installed").length >
      0 ? (
        
        wallets
        
          .filter((wallet) => wallet.readyState === "Installed")
          .map((wallet) => (
            
            <Button
              key={wallet.adapter.name}
              onClick={() => select(wallet.adapter.name)}
              bgGradient="linear(to-r, #9945FF, #14F195)"
              w="64"
              size="lg"
              fontSize="md"
              leftIcon={
                <Image
                  src={wallet.adapter.icon}
                  alt={wallet.adapter.name}
                  h={6}
                  w={6}
                />
              }
            >
              {wallet.adapter.name}
            </Button>
          
          ))
          
      ) : (
        <Text>No wallet found. Please download a supported Solana wallet</Text>
      )}
      
      <footer style={{ textAlign: 'center', paddingTop: '20px' }}>
  <p style={{ marginBottom: '2px', fontWeight: 'bold', fontSize: '1rem', background: 'linear-gradient(to right, #9945FF, #14F195)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent' }}>HeadlineHarmonies</p>
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
    <a href="https://x.com/thomasfdevito" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faTwitter} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://github.com/gopulse-labs/hhmint" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faGithub} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
  </div>
  <p style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '1rem', background: 'linear-gradient(to right, #9945FF, #14F195)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent' }}>Presented by Thomas DeVito</p>
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
    <a href="https://x.com/thomasfdevito" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faTwitter} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://telegram.com" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faTelegram} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://www.linkedin.com/in/tdevito" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faLinkedin} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://github.com/tommyd2377" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faGithub} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
  </div>
</footer>

    
    </Stack>
  ) : (
    
    <Stack gap={4} align="center">
    <Box
             maxW={['90%', '80%', 'md']}
             mx='auto'
             p={[2, 4]}
        borderWidth={1}
        borderRadius="md"
        boxShadow="lg"
      >
        <Text
          maxW="80%"
          mx="auto"
          textAlign="center"
          wordBreak="break-word"
        >
          {publicKey.toBase58()}
        </Text>
      </Box>

      <Button onClick={disconnect} bgGradient="linear(to-r, #9945FF, #14F195)">Disconnect Wallet</Button>

      <Text style={{
          maxWidth: '80%',
          wordWrap: 'break-word',
          textAlign: 'center',
        }}>
      Using your chosen headline and visual style, any current event can be transformed into an 
      artistic masterpiece that echoes the pulse of contemporary life.
      </Text>

      <Accordion allowToggle
       style={{
          width: "80%",
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          justifyContent: "center",
          textAlign: "center"
        }}>
        <AccordionItem>
          <h2>
            <AccordionButton _expanded={{ bgGradient: "linear(to-r, #9945FF, #14F195)", color: 'white' }}>
              <Box>
                Headline
              </Box>
            </AccordionButton>
          </h2>

          <AccordionPanel pb={4}>
          <Box
        maxW="md"
        mx="auto"

        p={4}
        borderWidth={1}
        borderRadius="md"
        boxShadow="lg"
      >
        <Text
          maxW="80%"
          mx="auto"
          textAlign="center"
          wordBreak="break-word"
        >
          {selectedHeadline && <Text>{selectedHeadline}</Text>}  
          </Text>
          </Box>
          <br />
              <Grid
                templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
                gap={4}
              >
                {news.map((headline, index) => (
                  <GridItem key={index}>
                    <Button
                      size="md"
                      width="100%"
                      maxWidth="300px"
                      height="auto"
                      borderRadius="md"
                      onClick={() => handleHeadlineClick(headline, index)}
                      style={
                        selectedHeadline === headline
                          ? {
                              backgroundImage: 'linear-gradient(to right, #9945FF, #14F195)',
                              color: 'white',
                              flexDirection: 'column',
                              alignItems: 'center',
                              display: 'flex',
                            }
                          : {
                              flexDirection: 'column',
                              alignItems: 'center',
                              display: 'flex',
                            }
                      }
                      className="headline-button"
                      id={`headline-button-${index}`}
                      px={4}
                      py={2}
                    >
                      <Text
            style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
            textAlign="center"
                      >{headline}</Text>
                    </Button>
                  </GridItem>
                ))}
              </Grid>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton _expanded={{ bgGradient: "linear(to-r, #9945FF, #14F195)", color: 'white' }}>
              <Box>
                Style
              </Box>
  
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
          <Box
        maxW="md"
        mx="auto"

        p={4}
        borderWidth={1}
        borderRadius="md"
        boxShadow="lg"
      >
        <Text
          maxW="80%"
          mx="auto"
          textAlign="center"
          wordBreak="break-word"
        >
          {selectedHeadline && <Text>{selectedHeadline}</Text>}
          </Text>
          </Box>
          <Box padding="20px">
      <Grid 
         templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)"}} 
            gap={4}>
        {gridButtonsData.map((button, index) => (
          <GridItem key={index}>
              <Button
                size="md"
                width="100%"
                height="auto"
                borderRadius="md"
                onClick={() => handleStyleClick(button.label, button.id)}
                style={
                  selectedStyle === button.label
                    ? {
                        backgroundImage: "linear-gradient(to right, #9945FF, #14F195)",
                        color: "white",
                        flexDirection: "column",
                        alignItems: "center",
                        display: "flex",
                      }
                    : {
                        flexDirection: "column",
                        alignItems: "center",
                        display: "flex",
                      }
                }
              >
              <Image paddingTop="5px" src={button.imageUrl} alt={`Image ${index}`} boxSize="100px" objectFit="cover" />
              <Text>{button.label}</Text>
            </Button>

          </GridItem>
        ))}
      </Grid>
      </Box>
          </AccordionPanel>
        </AccordionItem>
      
    <AccordionItem>
    <h2>
      <AccordionButton _expanded={{ bgGradient: "linear(to-r, #9945FF, #14F195)", color: 'white' }}>
        <Box>
          Generate
        </Box>

      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
    <div>
    <Box
        maxW="md"
        mx="auto"

        p={4}
        borderWidth={1}
        borderRadius="md"
        boxShadow="lg"
      >
        <Text
          maxW="80%"
          mx="auto"
          textAlign="center"
          wordBreak="break-word"
        >
{selectedHeadline && selectedStyle && (
  <Text>An interpretation of &apos;{selectedHeadline}&apos; inspired by the {selectedStyle} style.</Text>
)}
        </Text>
      </Box>
      <Box padding={3}>
    <Button onClick={() => generateImage(selectedStyle)} bgGradient="linear(to-r, #9945FF, #14F195)">Generate Image</Button>
    </Box>
    <Box>
    {loading && <p>Creating image, this will take a second...</p>}
    </Box>
    <br />
    <Box style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}>
    {imageSrc && <Image src={imageSrc} alt="Generated Image" />}
    </Box>
    </div>
    </AccordionPanel>
  </AccordionItem>

  <AccordionItem>
    <h2>
      <AccordionButton _expanded={{ bgGradient: "linear(to-r, #9945FF, #14F195)", color: 'white' }}>
        <Box>
          Mint
        </Box>
  
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
    <Box
        maxW="md"
        mx="auto"

        p={4}
        borderWidth={1}
        borderRadius="md"
        boxShadow="lg"
      >
        <Text
          maxW="80%"
          mx="auto"
          textAlign="center"
          wordBreak="break-word"
        >
{selectedHeadline && selectedStyle && (
  <Text>An interpretation of &apos;{selectedHeadline}&apos; inspired by the {selectedStyle} style.</Text>
)}
        </Text>
      </Box>
      <br />
    <Box style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}>
    {imageSrc && <Image src={imageSrc} alt="Generated Image" />}
    </Box>
    <div>
    <Text>{price !== null ? `${price.toFixed(2)} SOL` : 'Loading Price...'}</Text>
    <Tooltip
      label={
        <VStack spacing={1} p={4} align="start" bg="white" shadow="md" borderColor="gray.200">
          <Text fontWeight="bold">Attribute Scoring:</Text>
          <VStack align="start">
            <Text><strong>Global Impact:</strong></Text>
            <Text>0.01 to 0.2: Minor local interest (e.g., local events, minor news).</Text>
            <Text>0.21 to 0.5: Significant national interest (e.g., national sports events, national political news).</Text>
            <Text>0.51 to 0.8: Major international interest (e.g., international sporting events, significant political events in large countries).</Text>
            <Text>0.81 to 1: Worldwide impact (e.g., global pandemics, world wars, major scientific breakthroughs).</Text>
          </VStack>
          <VStack align="start" mt={2}>
            <Text><strong>Longevity:</strong></Text>
            <Text>0.01 to 0.2: Short-term interest (days to weeks).</Text>
            <Text>0.21 to 0.5: Medium-term interest (months to a few years).</Text>
            <Text>0.51 to 0.8: Long-term interest (decades).</Text>
            <Text>0.81 to 1: Permanent impact (centuries or more).</Text>
          </VStack>
          <VStack align="start" mt={2}>
            <Text><strong>Cultural Significance:</strong></Text>
            <Text>0.01 to 0.2: Minor or niche cultural impact.</Text>
            <Text>0.21 to 0.5: Significant cultural impact within a country or region.</Text>
            <Text>0.51 to 0.8: Major cultural impact affecting multiple countries or regions.</Text>
            <Text>0.81 to 1: Profound cultural impact, leading to major changes in global culture or history.</Text>
          </VStack>
          <VStack align="start" mt={2}>
            <Text><strong>Media Coverage:</strong></Text>
            <Text>0.01 to 0.2: Limited media coverage.</Text>
            <Text>0.21 to 0.5: Moderate media coverage in a few countries.</Text>
            <Text>0.51 to 0.8: Extensive media coverage in many countries.</Text>
            <Text>0.81 to 1: Intense media coverage globally.</Text>
          </VStack>
        </VStack>
      }
      aria-label="Price scoring criteria"
      hasArrow
      placement="auto"
      closeOnClick={true}
      shouldWrapChildren
    >
      <IconButton
        aria-label="Info"
        icon={<InfoIcon />}
        onClick={isOpen ? onClose : onOpen}
        variant="ghost"
        size="lg"
      />
    </Tooltip>
    </div>
    <Button onClick={() => {
  if (imageFile && selectedHeadline && selectedStyle && scores1 && frontEndKey) {
    handleMint(imageFile, selectedHeadline, selectedStyle, frontEndKey, scores1);
  } else {
    console.error("ImageSrc is null");
  }
}} bgGradient="linear(to-r, #9945FF, #14F195)">Mint your HeadlineHarmonies NFT</Button>
      
    </AccordionPanel>
  </AccordionItem>
  </Accordion>
  
    {isOwner && (   
      <Button onClick={generateSpecialLink} bgGradient="linear(to-r, #9945FF, #14F195)">Generate Referral Link</Button>
    )}

<footer style={{ textAlign: 'center', paddingTop: '20px' }}>
  <p style={{ marginBottom: '2px', fontWeight: 'bold', fontSize: '1rem', background: 'linear-gradient(to right, #9945FF, #14F195)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent' }}>HeadlineHarmonies</p>
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
    <a href="https://x.com/thomasfdevito" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faTwitter} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://github.com/gopulse-labs/hhmint" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faGithub} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
  </div>
  <p style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '1rem', background: 'linear-gradient(to right, #9945FF, #14F195)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent' }}>Presented by Thomas DeVito</p>
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
    <a href="https://x.com/thomasfdevito" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faTwitter} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://telegram.com" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faTelegram} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://www.linkedin.com/in/tdevito" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faLinkedin} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
    <a href="https://github.com/tommyd2377" target="_blank" rel="noopener noreferrer">
      <FontAwesomeIcon icon={faGithub} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
    </a>
  </div>
</footer>
<br />
    </Stack>
  );
};

export default HHMint;