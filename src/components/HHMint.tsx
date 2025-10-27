/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

//TODO: jwt cross checking

// Use a public env var for client-side access; Next.js injects NEXT_PUBLIC_*
const solanaRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.solanaRpcUrl;
let umi: Umi | null = null;

library.add(faTwitter, faTelegram, faLinkedin, faGithub);

if (typeof window !== 'undefined') {
  if (solanaRpcUrl) {
    try {
      umi = createUmi(solanaRpcUrl)
        .use(mplTokenMetadata())
        .use(bundlrUploader());
    } catch (e) {
      console.error('Failed to initialize UMI:', e);
    }
  } else {
    console.error('RPC node environment variable is not defined.');
  }
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
  const [error, setError] = useState<string | null>(null);

  const [isTouchDevice] = useMediaQuery("(hover: none) and (pointer: coarse)");

  const { isOpen, onOpen, onClose } = useDisclosure();

  const wallet = useWallet();
  if (umi) {
    umi.use(walletAdapterIdentity(wallet));
  }

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

  const [hasStarted, setHasStarted] = useState(false);

  const getStarted = () => {
    setHasStarted(true);
    // Additional actions after setting hasStarted
  };

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

async function generateImage(selectedStyle: any, selectedHeadline: any) {
  try {
    setLoading(true);
    setImageSrc(null);
    setScores(null);
    setError(null);
    
    console.log(selectedHeadline, selectedStyle);

    const response = await fetch('/api/generateImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedStyle, selectedHeadline })
    });

    if (!response.ok) {
      const errorMessage = `HuggingFace error! Status: ${response.status}`;
      setError(errorMessage);  // Set the error state to display the message
      throw new Error(errorMessage);
    }

    const data = await response.json();

    console.log("scores and price: " + data.scores, data.price)
    setImageSrc(`data:image/png;base64,${data.image}`);

    setScores(data.scores);  // Update scores state
    setPrice(data.price); 

       // Convert base64 string to a File object
       const base64Response = data.image.split(';base64,').pop();
       const byteCharacters = atob(base64Response);
       const byteArrays = [];

       for (let offset = 0; offset < byteCharacters.length; offset += 512) {
           const slice = byteCharacters.slice(offset, offset + 512);
           const byteNumbers = new Array(slice.length);
           for (let i = 0; i < slice.length; i++) {
               byteNumbers[i] = slice.charCodeAt(i);
           }
           const byteArray = new Uint8Array(byteNumbers);
           byteArrays.push(byteArray);
       }

       const blob = new Blob(byteArrays, {type: 'image/png'});
       const file = new File([blob], 'generated_image.png', { type: 'image/png' });

       setImageFile(file);

    setLoading(false);
  } catch (error) {
    console.error('Error fetching data:', error);
    setLoading(false);
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

  const handleMint = async (imageFile: File, selectedHeadline: string, selectedStyle: string, frontEndKey: PublicKey, scores: {
    globalImpact: number,
    longevity: number,
    culturalSignificance: number,
    mediaCoverage: number
}) => {
    console.log('Start mint process...');
    console.log("scores:" + scores.globalImpact);
    
    try {
      setLoading(true); // Add loading state
      const reader = new FileReader();
      
      const readFilePromise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const result = await readFilePromise;
      
      if (!result || typeof result !== 'string') {
        throw new Error('Failed to read image file');
      }

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

      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      console.log('Minting successful: ', response.data.serialized);
      const arr = Object.values(response.data.serialized) as unknown[];
      const uint8Array = new Uint8Array(arr.map(num => Number(num)));
  if (!umi) throw new Error('UMI not initialized');
  const deserialized = umi.transactions.deserialize(uint8Array);

  const signedDeserializedCreateAssetTx = await umi.identity.signTransaction(deserialized);
  const createAssetSignature = base58.deserialize(await umi.rpc.sendTransaction(signedDeserializedCreateAssetTx))[0];
      
      // Wait for transaction confirmation
  const confirmation = await umi.rpc.confirmTransaction(base58.serialize(createAssetSignature), {
        strategy: { type: 'blockhash', ...(await umi.rpc.getLatestBlockhash()) },
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      const txUrl = `https://solana.fm/tx/${base58.serialize(createAssetSignature)}?cluster=devnet-alpha`;
      console.log(`\nAsset Created: ${txUrl}`);

      // Show success message only after confirmation
      toast({
        title: 'Your HeadlineHarmonies NFT has been minted!',
        description: `Transaction confirmed! View on Solana FM: ${txUrl}`,
        status: 'success',
        duration: 15000,
        isClosable: true,
        position: 'top',
      });

    } catch (error) {
      console.error('Error in minting process:', error);
      toast({
        title: 'Minting Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
};

  return !hasStarted ? (
    
    <Stack gap={4} align="center">
 
 <Box
  maxWidth={{ base: "90%", md: "768px" }} // Responsive max width
  width="100%" // Uses full width up to the max width
  mx="auto" // Centers the box
  p={4} // Adds padding around the text
>
  <Text
    textAlign="center" // Centers the text inside the Text component
    wordBreak="break-word" // Ensures long words do not overflow
  >
    At the crossroads of art and technology lies a first-of-its-kind NFT collection where you can 
    own a unique visual rendering of unfolding history. The combination of sublime imagery and the 
    unfiltered hope and horror of our modern world converges with the power of generative AI to 
    transform a headline into a piece of digital history.
  </Text>
</Box>

<Button
      bgGradient="linear(to-r, #9945FF, #14F195)"
      w="64"
      size="lg"
      fontSize="md"
 
      onClick={getStarted}
    >
      Get Started
    </Button>
      
      <footer style={{ textAlign: 'center', paddingTop: '20px' }}>
  <p style={{ marginBottom: '2px', fontWeight: 'bold', fontSize: '1rem', background: 'linear-gradient(to right, #9945FF, #14F195)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent' }}>HeadlineHarmonies</p>
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
    <a href="https://x.com/HdlnHarmonies" target="_blank" rel="noopener noreferrer">
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
  <br />
  <div style={{
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  textAlign: 'center',
  color: '#333'
}}>
  Made with <span style={{ color: '#e25555', fontSize: '24px' }}>&hearts;</span> in NYC
</div>
</footer>

    
    </Stack>
  ) : (

    
    
    <Stack gap={4} align="center">
    {publicKey && (
  <Box
    maxW={['90%', '80%', 'md']}
    mx="auto"
    p={[2, 4]}
    borderWidth="1"
    borderRadius="md"
    boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)" // Darker shadow for better visibility
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
)}

{publicKey ? (
  // Show the Disconnect button if a wallet is connected
  <Button onClick={disconnect} bgGradient="linear(to-r, #9945FF, #14F195)">Disconnect Wallet</Button>
) : (
  // Show Connect buttons if no wallet is connected
  wallets.filter((wallet) => wallet.readyState === "Installed").length > 0 ? (
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
    // Show a message if no wallets are installed
    <Text>No wallet found. Please download a supported Solana wallet</Text>
  )
)}

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
          {selectedHeadline && (
            <Box
              maxW="md"
              mx="auto"
              p={4}
              borderWidth="1"
              borderRadius="md"
              boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)" 
            >
              <Text
                maxW="80%"
                mx="auto"
                textAlign="center"
                wordBreak="break-word"
              >
                {selectedHeadline}
              </Text>
            </Box>
          )}
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
          {selectedHeadline && (
            <Box
              maxW="md"
              mx="auto"
              p={4}
              borderWidth="1"
              borderRadius="md"
              boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)" 
            >
              <Text
                maxW="80%"
                mx="auto"
                textAlign="center"
                wordBreak="break-word"
              >
                {selectedHeadline}
              </Text>
            </Box>
          )}
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
      borderWidth="1"
      borderRadius="md"
      boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)" // Darker shadow for better visibility
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
    <Button
        onClick={() => generateImage(selectedStyle, selectedHeadline)}
        isLoading={loading}
        loadingText="Generating Image"
        bgGradient="linear(to-r, #9945FF, #14F195)"
    >
        Generate Image
    </Button>
</Box>
{/* Error message display */}
{error && (
  <Box color="red" padding={3} textAlign="center">
    <Text>Error: {error}</Text>
  </Box>
)}
    <Box>
    {loading && <p>Don't like the image? Click "Generate" again to try another.</p>}
    </Box>
    <Box style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}>
    {imageSrc && <Image src={imageSrc} alt="Generated Image" />}
    </Box>
    <br />
    {scores1 && (
      <Box
        maxW="md"
        mx="auto"
        p={4}
        borderWidth="1"
        borderRadius="md"
        boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)" // Updated darker shadow
      >
        <Text fontWeight="bold" mb={2}>Attributes:</Text>
        <Text>Global Impact: {scores1.globalImpact.toFixed(2)}</Text>
        <Text>Longevity: {scores1.longevity.toFixed(2)}</Text>
        <Text>Cultural Significance: {scores1.culturalSignificance.toFixed(2)}</Text>
        <Text>Media Coverage: {scores1.mediaCoverage.toFixed(2)}</Text>
        {/* Uncomment to display price if needed */}
        {/* <Text fontSize="xl" mt={4} fontWeight="bold">Price: {price.toFixed(2)} SOL</Text> */}
      </Box>
    )}
   
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
      borderWidth="1"
      borderRadius="md"
      boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)" // Darker shadow for better visibility
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
        <br />
    <Box>
    {scores1 && (
      <Box
        maxW="md"
        mx="auto"
        p={4}
        borderWidth="1"
        borderRadius="md"
        boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)" // Updated darker shadow
      >
        <Text fontWeight="bold" mb={2}>Attributes:</Text>
        <Text>Global Impact: {scores1.globalImpact.toFixed(2)}</Text>
        <Text>Longevity: {scores1.longevity.toFixed(2)}</Text>
        <Text>Cultural Significance: {scores1.culturalSignificance.toFixed(2)}</Text>
        <Text>Media Coverage: {scores1.mediaCoverage.toFixed(2)}</Text>
        {/* Uncomment to display price if needed */}
        {/* <Text fontSize="xl" mt={4} fontWeight="bold">Price: {price.toFixed(2)} SOL</Text> */}
      </Box>
    )}
    <br />

    {publicKey && price !== null ? (
    <Button 
        onClick={() => {
            if (imageFile && selectedHeadline && selectedStyle && scores1 && frontEndKey) {
                handleMint(imageFile, selectedHeadline, selectedStyle, frontEndKey, scores1);
            } else {
                console.error("Required data is missing for minting");
            }
        }}
        bgGradient="linear(to-r, #9945FF, #14F195)"
    >
        Mint for {price.toFixed(2)} SOL
    </Button>
) : (
    <Button 
        isDisabled={!publicKey || price === null}
        bgGradient="linear(to-r, #9945FF, #14F195)"
    >
        {publicKey ? 'Mint' : 'Connect Wallet to Mint'}
    </Button>
)}
      </Box>
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
    <a href="https://x.com/HdlnHarmonies" target="_blank" rel="noopener noreferrer">
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
  <br />
  <div style={{
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  textAlign: 'center',
  color: '#333'
}}>
  Made with <span style={{ color: '#e25555', fontSize: '24px' }}>&hearts;</span> in NYC
</div>
</footer>
<br />
    </Stack>
  );
};

export default HHMint;