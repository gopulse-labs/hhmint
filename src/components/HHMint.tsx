import React, { useState, useEffect } from 'react';
import { VStack, Stack, Button, Image, Text, Grid, GridItem, useMediaQuery, Container, Box } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { GenericFile, TransactionBuilderItemsInput, Umi, generateSigner, percentAmount, sol, transactionBuilder } from '@metaplex-foundation/umi';
import { createNft, fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
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
  const [isGridVisible, setIsGridVisible] = useState(false);

  const wallet = useWallet();
  umi.use(walletAdapterIdentity(wallet));

  // getPrice(7, 5).then(currentPrice => {
  //   console.log("current price: " + currentPrice);
  // });

  useEffect(() => {
    // Access userPublicKey here
    console.log('User Public Key:', userPublicKey);

    setIsGridVisible(true);

    // Your existing useEffect code
  }, [userPublicKey]);

  const gridButtonsData = [
    { label: 'Impressionism', imageUrl: '/images/impressionism.jpg', id: 'impressionism' },
    { label: 'Abstract Expressionism', imageUrl: '/images/abstract-expressionism.jpeg', id: 'abstract-expressionism' },
    { label: 'Art Deco', imageUrl: '/images/art-deco.avif', id: 'art-deco' },
    { label: 'Fauvism', imageUrl: '/images/fauvism.jpeg', id: 'fauvism' },
    { label: 'Romanticism', imageUrl: '/images/romanticism.jpg', id: 'romanticism' },
    { label: 'Futurism', imageUrl: '/images/futurism.jpg', id: 'futurism' },
    { label: 'Rococo', imageUrl: '/images/rococo.jpg', id: 'rococo' },
    { label: 'Classicism', imageUrl: '/images/classicism.jpg', id: 'classicism' },
    { label: 'Cubism', imageUrl: '/images/cubism.jpg', id: 'cubism' },
    { label: 'Pop art', imageUrl: '/images/pop-art.jpg', id: 'pop-art' },
    { label: 'Realism', imageUrl: '/images/realism.jpg', id: 'realism' },
    { label: 'Conceptual art', imageUrl: '/images/conceptual-art.jpg', id: 'conceptual-art' },
    { label: 'Dadaism', imageUrl: '/images/dadaism.jpg', id: 'dadaism' },
    { label: 'Abstract art', imageUrl: '/images/abstract-art.webp', id: 'abstract-art' },
    { label: 'Contemporary art', imageUrl: '/images/contemporary-art.webp', id: 'contemporary-art' },
    { label: 'Expressionism', imageUrl: '/images/expressionism.webp', id: 'expressionism' },
    { label: 'Surrealsim', imageUrl: '/images/surrealism.jpg', id: 'surrealism' },
    { label: 'Art Nouveau', imageUrl: '/images/art-nouveau.webp', id: 'art-nouveau' },
    { label: 'Renaissance', imageUrl: '/images/renaissance.jpg', id: 'renaissance' },
    { label: 'Constructivism', imageUrl: '/images/constructivism.JPG', id: 'constructivism' },
    { label: 'Neoclassicism', imageUrl: '/images/neoclassicism.webp', id: 'neoclassism' },
    { label: 'Bauhaus', imageUrl: '/images/bauhaus.jpg', id: 'bauhaus' },
    { label: 'Minimalism', imageUrl: '/images/minimalism.webp', id: 'minimalism' },
    { label: 'Baroque', imageUrl: '/images/minimalism.webp', id: 'baroque' }
  ];

  async function fetchHeadline() {  
    
    try {
      const response = await axios.get('http://localhost:3001/getNews');
      const parsedNews = await parseString.parseStringPromise(response.data);
      const numberOfTitles = parsedNews.rss.channel[0].item.length;
      let random = getRandomNumber(numberOfTitles);
      console.log("Number of titles: ", numberOfTitles);
      let titleElement = parsedNews.rss.channel[0].item[random].title;
      let originalHeadline = titleElement.textContent || titleElement.toString();
      console.log("original: " + originalHeadline, typeof originalHeadline)
      let lastDashIndex = originalHeadline.lastIndexOf(' - ');
      let modifiedHeadline = originalHeadline.substring(0, lastDashIndex);
      console.log("modified: " + modifiedHeadline)
      setNews(modifiedHeadline);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }

  async function getPrice(lastSix: number, previousSix: number) {
    let response = await axios.get('/getPrice?salesLastSixHours=${lastSix}&salesPreviousSixHours=${previousSix}');
    let data = response.data;
    console.log(data);
    // let price = data.price;
    // return price;
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
      // .add(transferSol(umi, { 
      //   source: wallet, 
      //   destination: umi.eddsa.generateKeypair().publicKey, 
      //   amount: sol(0.1)}))
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
    
  //   transactionBuilder()
  //     .add(createNft(umi, {
  //       mint,
  //       name: "Collection Name",
  //       uri: uri,
  //       sellerFeeBasisPoints: percentAmount(5.5),
  //     }))
  //     .sendAndConfirm(umi)
  // }

  return !publicKey ? (
    
    <Stack gap={4}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '80%' }}>
      
      <Text> 
      At the crossroads of art and technology comes a first of its kind NFT collection where you can own a uniqe 
      visual rendering of unfolding history. Using your chosen headline and visual style, any current event can be transformed into an 
      artistic masterpiece that echoes the pulse of contemporary life. The combination of artistic beauty and 
      the unfiltered hope and horror of our modern world come together with the power of generative AI to elevate a headline 
      into a piece of digital history.
      </Text>
      
      </div>
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
      
      <Button onClick={fetchHeadline}>Grab a headline</Button>
      {news && <Text>{news}</Text>}
    
      <Box padding="20px"> {/* Add padding here */}
      <Grid 
         templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)"}} 
            gap={4}
            className={isGridVisible ? "visible" : "hidden"}>
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

      <Button onClick={() => generateImage(selectedStyle)}>Create Image from Headline</Button>

      <div>
      {loading && <p>Creating image, this will take a second...</p>}
      {imageSrc && <img src={imageSrc} alt="Generated Image" />}
    </div>
      <Button onClick={handleMint}>Mint me!</Button>
      
        <Button onClick={generateSpecialLink}>Generate Referral Link</Button>
      
      <footer>Presented by GoPulse Labs</footer>
      <br />
    </Stack>
  
  );
};

export default HHMint;