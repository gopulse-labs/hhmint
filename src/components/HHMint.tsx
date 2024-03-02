import React, { useState, useEffect } from 'react';
import { VStack, Stack, Button, Image, Text, Grid, GridItem,
  Accordion, AccordionItem, AccordionButton,AccordionPanel,
  AccordionIcon, useMediaQuery, Container, Box } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { GenericFile, TransactionBuilderItemsInput, Umi, 
  generateSigner, percentAmount, sol, transactionBuilder } from '@metaplex-foundation/umi';
import { createNft, fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import { gridButtonsData } from './buttonData';
import axios from 'axios';
import parseString from 'xml2js';
import 'text-encoding';

const umi = createUmi("https://quiet-empty-theorem.solana-devnet.quiknode.pro/7d57464a8ad6a9c0f5395d099b88e1c820789582/")
    .use(mplTokenMetadata())
    .use(bundlrUploader());

interface HHMintProps {
  userPublicKey?: string;
}

let currentPromptIndex = 0;

const HHMint: React.FC<HHMintProps> = ({ userPublicKey }) => {
  const { select, wallets, publicKey, disconnect } = useWallet();

  const [news, setNews] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [realData1, setRealData] = useState<ArrayBuffer | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const wallet = useWallet();
  umi.use(walletAdapterIdentity(wallet));

  async function getPrice() {
    try {
      const response = await axios.get('https://headlineharmonies.netlify.app/.netlify/functions/getPrice', {
        params: {
          salesLastSixHours: 77,
          salesPreviousSixHours: 22
        }
      });
      // const response = await axios.get('http://localhost:3000/api/getPrice', {
      //   params: {
      //     salesLastSixHours: 77,
      //     salesPreviousSixHours: 22
      //   }
      // });
      const price = parseFloat(response.data);
      console.log(price)
      setPrice(price);
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  }

  useEffect(() => {
    // Access userPublicKey here
    if (userPublicKey) {
      console.log('User Public Key:', userPublicKey);
    }

    getPrice();

  }, [userPublicKey]);



  async function fetchHeadline() {  
    
    try {
      //const response = await axios.get('https://headlineharmonies.netlify.app/.netlify/functions/getNews');
      //const response = await axios.get('http://localhost:3000/api/getNews');
      // const parsedNews = await parseString.parseStringPromise(response.data);
      // const numberOfTitles = parsedNews.rss.channel[0].item.length;
      // let random = getRandomNumber(numberOfTitles);
      // console.log("Number of titles: ", numberOfTitles);
      // let titleElement = parsedNews.rss.channel[0].item[random].title;
      // let originalHeadline = titleElement.textContent || titleElement.toString();
      // console.log("original: " + originalHeadline, typeof originalHeadline)
      // let lastDashIndex = originalHeadline.lastIndexOf(' - ');
      // //let modifiedHeadline = originalHeadline.substring(0, lastDashIndex);
      let modifiedHeadline = "US and Jordanian forces airdrop aid into Gaza";
      console.log("modified: " + modifiedHeadline)
      setNews(modifiedHeadline);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }

  function handleStyleClick(style: string, id: string) {
    setSelectedStyle(style);

      // Remove the selected class from all buttons except the clicked one
      gridButtonsData.forEach(button => {
        if (button.id !== id) {
          document.getElementById(button.id)?.classList.remove('selected');
        }
      });
      // Add the selected class to the clicked button
      document.getElementById(id)?.classList.add('selected');
  }

  useEffect(() => {
    console.log(selectedStyle);
  }, [selectedStyle]);

  const prompts = [
    "Craft a masterpiece, channeling the aesthetic essence of " + selectedStyle + ", to convey the message behind the headline: " + '"' + news + '"',
    "Design an exquisite piece, drawing inspiration from the visual language of " + selectedStyle + ", to interpret the narrative within the headline: " + '"' + news + '"',
    "Produce an artistic marvel, embracing the stylistic elements of " + selectedStyle + ", to articulate the story encapsulated in the headline: " + '"' + news + '"',
    "Create a visual symphony, echoing the design ethos of " + selectedStyle + ", to mirror the essence of the headline: " + '"' + news + '"',
    "Fashion a captivating artwork, embodying the visual characteristics of " + selectedStyle + ", to depict the essence of the headline: " + '"' + news + '"',
    "Construct a striking composition, influenced by the aesthetic principles of " + selectedStyle + ", to illuminate the essence of the headline: " + '"' + news + '"',
    "Shape an evocative piece, drawing from the visual motifs of " + selectedStyle + ", to encapsulate the essence of the headline: " + '"' + news + '"',
    "Devise a stunning creation, inspired by the visual aesthetics of " + selectedStyle + ", to reflect the narrative conveyed in the headline: " + '"' + news + '"',
    "Forge an artistic interpretation, mirroring the visual cues of " + selectedStyle + ", to convey the underlying message of the headline: " + '"' + news + '"',
    "Sculpt an expressive artwork, embodying the stylistic nuances of " + selectedStyle + ", to capture the essence of the headline: " + '"' + news + '"'
  ];

  async function generateImage(selectedStyle: string | null) {
    try {
      setImageSrc(null);
      setLoading(true);

      const currentPrompt = prompts[currentPromptIndex];
      console.log(currentPrompt);
      console.log(currentPromptIndex);     
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/prompthero/openjourney",
        {
          headers: { Authorization: "Bearer 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" },
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
  
      const blob = await response.blob();
      const realData = await blob.arrayBuffer();
      setRealData(realData);

      // Convert ArrayBuffer to base64
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(realData)));

      // Create a data URL from the base64 data
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      setLoading(false);

      // Set the image source in the component state
      setImageSrc(dataUrl);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  
  function getRandomNumber(itemCount: number): number {
    return Math.floor(Math.random() * itemCount);
  }

  function generateSpecialLink() {
    if (publicKey) {
      const specialLink = `http://localhost:3000/${publicKey.toBase58()}`;

      // Copy to clipboard
      navigator.clipboard.writeText(specialLink)
        .then(() => {
          console.log('Special link copied to clipboard:', specialLink);
          // You can provide user feedback here if needed
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error);
        });
    }
  }

  interface GenericFileTag {
    // Define your GenericFileTag properties here
    name: string;
    value: string;
  }

  interface GenericFile {
    readonly buffer: Uint8Array;
    readonly fileName: string;
    readonly displayName: string;
    readonly uniqueName: string;
    readonly contentType: string | null;
    readonly extension: string | null;
    readonly tags: GenericFileTag[];
  }

  // Function to create GenericFile from ArrayBuffer
  function createGenericFile(arrayBuffer: ArrayBuffer,
    fileName: string,
    displayName: string,
    uniqueName: string,
    contentType: string | null,
    extension: string | null,
    tags: GenericFileTag[]): GenericFile {
    return ({
      buffer: new Uint8Array(arrayBuffer),
      fileName,
      displayName,
      uniqueName,
      contentType,
      extension,
      tags,
    });
  }

  async function handleMint() {
    console.log("Start mint process...");
    setIsOwner(true);

    if (realData1 !== null) {

      const genericFile = createGenericFile(
        realData1,
        'example.jpg', // Replace with your actual file name
        'Example File', // Replace with your actual display name
        'unique-identifier', // Replace with your actual unique name
        'image/jpeg', // Replace with your actual content type
        'jpg', // Replace with your actual extension
        [] // Replace with your actual tags
      );

      console.log(genericFile);

      let [imageUri] = await umi.uploader.upload([genericFile]);
      console.log("image: " + imageUri);
      let uri = await umi.uploader.uploadJson({
        name: selectedStyle + " - " + news,
        description: '"' + news + '"' + " in the style of " + selectedStyle,
        image: imageUri,
      });

      console.log("uri: " + uri);

      const mint = generateSigner(umi);
      
      transactionBuilder()

      .add(createNft(umi, {
        mint,
        name: 'HeadlineHarmonies',
        uri: uri,
        sellerFeeBasisPoints: percentAmount(5.5),
      }))
      .add(transferSol(umi, { 
        source: umi.identity, 
        destination: umi.eddsa.generateKeypair().publicKey, 
        amount: sol(0.1)}))
      .sendAndConfirm(umi)
      const asset = await fetchDigitalAsset(umi, mint.publicKey)
      console.log("New NFT data: " + asset)
    }
  }    

  // async function mintNFT(file: GenericFile) {

  //   let [imageUri] = await umi.uploader.upload([file])
    
  //   let uri = await umi.uploader.uploadJson({
  //     name: "name",
  //     description: "description",
  //     image: imageUri,
  //   })

  //   const mint = generateSigner(umi)
    
    // transactionBuilder()
    //   .add(createNft(umi, {
    //     mint,
    //     name: "Collection Name",
    //     uri: uri,
    //     sellerFeeBasisPoints: percentAmount(5.5),
    //   }))
  //     .add(transferSol(umi, { 
  //       source: umi.identity, 
  //       destination: umi.eddsa.generateKeypair().publicKey, 
  //       amount: sol(0.3)}))
  //     .sendAndConfirm(umi)
  // }

  return !publicKey ? (
    
    <Stack style={{
      maxWidth: '80%', // Limit the maximum width to prevent running off the screen
      wordWrap: 'break-word', // Allow long words to break and wrap onto the next line
      textAlign: 'center', // Center the text horizontally
      alignItems: 'center'
    }} gap={4}>

      <Text style={{
          maxWidth: '80%', // Limit the maximum width to prevent running off the screen
          wordWrap: 'break-word', // Allow long words to break and wrap onto the next line
          textAlign: 'center', // Center the text horizontally
        }}> 
      At the crossroads of art and technology comes a first of its kind NFT collection where you can own a uniqe 
      visual rendering of unfolding history. The combination of ethereal beauty and 
      the unfiltered hope and horror of our modern world come together with the power of generative AI to elevate a headline 
      into a piece of digital history.
      </Text>
      
      {wallets.filter((wallet) => wallet.readyState === "Installed").length >
      0 ? (
        
        wallets
        
          .filter((wallet) => wallet.readyState === "Installed")
          .map((wallet) => (
            
            <Button
              key={wallet.adapter.name}
              onClick={() => select(wallet.adapter.name)}
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
      <footer>Presented by GoPulse Labs</footer>
    </Stack>
  ) : (
    
    <Stack gap={4} align="center">
 
      <Text
        style={{
          maxWidth: '80%', // Limit the maximum width to prevent running off the screen
          wordWrap: 'break-word', // Allow long words to break and wrap onto the next line
          textAlign: 'center', // Center the text horizontally
        }}
      >
        {publicKey.toBase58()}
      </Text>

      <Button onClick={disconnect}>Disconnect Wallet</Button>

      <Text style={{
          maxWidth: '80%', // Limit the maximum width to prevent running off the screen
          wordWrap: 'break-word', // Allow long words to break and wrap onto the next line
          textAlign: 'center', // Center the text horizontally
        }}>
      Using your chosen headline and visual style, any current event can be transformed into an 
      artistic masterpiece that echoes the pulse of contemporary life.
      </Text>

      <Accordion style={{
          width: "80%",
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          justifyContent: "center",
          textAlign: "center"
        }}>
        <AccordionItem>
          <h2>
            <AccordionButton _expanded={{ bg: 'blue', color: 'white' }}>
              <Box>
              Headline
              </Box>
              {/* <AccordionIcon /> */}
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
          Toggle through today&apos;s headlines.
          <br />
          First come first serve!
          <br />
          <Button onClick={fetchHeadline}>Toggle headlines</Button>
          {news && <Text>{news}</Text>}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton _expanded={{ bg: 'blue', color: 'white' }}>
              <Box>
                Style
              </Box>
              {/* <AccordionIcon /> */}
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
          {news && <Text>{news}</Text>}
          <Box padding="20px">
      <Grid 
         templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)"}} 
            gap={4}>
        {gridButtonsData.map((button, index) => (
          <GridItem key={index}>
              <Button
                variant="outline"
                size="md"
                width="100%"
                height="auto"
                borderRadius="md"
                onClick={() => handleStyleClick(button.label, button.id)}
                style={
                  selectedStyle === button.label
                    ? { backgroundColor: 'blue', color: 'white', flexDirection: 'column', alignItems: 'center', display: 'flex' }
                    : { flexDirection: 'column', alignItems: 'center', display: 'flex' }
                }
              >
                <Image paddingTop="5px" src={button.imageUrl} alt={'Image ${index}'} boxSize="100px" />
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
      <AccordionButton _expanded={{ bg: 'blue', color: 'white' }}>
        <Box>
          Generate
        </Box>
        {/* <AccordionIcon /> */}
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
    <div>
    {news && <Text>{news}</Text>}
    <Text>+</Text>
    {selectedStyle && <Text>{selectedStyle}</Text>}
    <Button onClick={() => generateImage(selectedStyle)}>Create Image</Button>
    <Box>
    {loading && <p>Creating image, this will take a second...</p>}
    </Box>
    <br />
    <Box style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center", // Center vertically
          textAlign: "center"
        }}>
    {imageSrc && <Image src={imageSrc} alt="Generated Image" />}
    </Box>
    </div>
    </AccordionPanel>
  </AccordionItem>

  <AccordionItem>
    <h2>
      <AccordionButton _expanded={{ bg: 'blue', color: 'white' }}>
        <Box>
          Mint
        </Box>
        {/* <AccordionIcon /> */}
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
    <div>
    <Text>{price !== null ? `${price} SOL` : 'Loading...'}</Text>
    </div>
      <Button onClick={handleMint}>Mint your HeadlineHarmonies NFT</Button>
    </AccordionPanel>
  </AccordionItem>
  </Accordion>

    
      
      {isOwner && (
    <Button onClick={generateSpecialLink}>Generate Referral Link</Button>
)}

      
      <footer>Presented by GoPulse Labs</footer>
      <br />
    </Stack>
  
  );
};

export default HHMint;