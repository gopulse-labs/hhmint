import React, { useState, useEffect } from 'react';
import {
  Stack,
  Button,
  Text,
  Grid,
  GridItem,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Box,
  HStack,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { gridButtonsData } from './buttonData';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faTelegram, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';

interface HHMintProps {
  userPublicKey?: string;
}

interface Scores {
  globalImpact: number;
  longevity: number;
  culturalSignificance: number;
  mediaCoverage: number;
}

function buildDefaultCaption(headline: string, style: string) {
  const styleTag = style.replace(/[^a-zA-Z0-9]/g, "");
  return `"${headline}" reimagined in ${style} style.

Created with HeadlineHarmonies.
#HeadlineHarmonies #AIArt #DigitalArt #NewsArt #${styleTag}`;
}

const HHMint: React.FC<HHMintProps> = ({ userPublicKey }) => {
  const [news, setNews] = useState<string[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [scores1, setScores] = useState<Scores | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

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
  setIsGenerating(true);
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
       if (selectedHeadline && selectedStyle) {
         setCaption(buildDefaultCaption(selectedHeadline, selectedStyle));
       }

    setIsGenerating(false);
  } catch (error) {
    console.error('Error fetching data:', error);
    setIsGenerating(false);
  }
}

  function downloadImage() {
    if (!imageFile) return;

    const url = URL.createObjectURL(imageFile);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = imageFile.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function copyCaption() {
    if (!caption.trim()) return;

    try {
      await navigator.clipboard.writeText(caption);
      toast({
        title: "Caption copied",
        status: "success",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
    } catch (copyError) {
      console.error("Could not copy caption:", copyError);
      toast({
        title: "Could not copy caption",
        description: "You can still copy it manually from the text box.",
        status: "warning",
        duration: 3500,
        isClosable: true,
        position: "top",
      });
    }
  }

  async function postToInstagram() {
    if (!imageFile) {
      toast({
        title: "Generate an image first",
        status: "warning",
        duration: 3500,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setIsPosting(true);
    try {
      const shareData: ShareData = {
        title: "HeadlineHarmonies",
        text: caption,
        files: [imageFile],
      };
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (typeof nav.share === "function" && (!nav.canShare || nav.canShare(shareData))) {
        await nav.share(shareData);
        toast({
          title: "Share sheet opened",
          description: "Pick Instagram to finish posting.",
          status: "success",
          duration: 3500,
          isClosable: true,
          position: "top",
        });
        return;
      }

      await copyCaption();
      downloadImage();
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      toast({
        title: "Ready to post",
        description: "Image downloaded and Instagram opened. Upload image and paste your caption.",
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (shareError: unknown) {
      const err = shareError as { name?: string };
      if (err?.name !== "AbortError") {
        console.error("Instagram share failed:", shareError);
        toast({
          title: "Could not open share",
          description: "Use Download Image and Copy Caption instead.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }
    } finally {
      setIsPosting(false);
    }
  }

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
    At the crossroads of art and technology lies a first-of-its-kind art collection where you can 
    create a unique visual rendering of unfolding history. The combination of sublime imagery and the 
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
    isLoading={isGenerating}
    loadingText="Generating Image"
    bgGradient="linear(to-r, #9945FF, #14F195)"
    isDisabled={isPosting}
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
  {isGenerating && <p>Don't like the image? Click "Generate" again to try another.</p>}
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
          Post
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
        boxShadow="0px 4px 10px rgba(0, 0, 0, 0.5)"
      >
        <Text textAlign="center" mb={3}>
          {imageFile
            ? "Post directly from your browser. On mobile, this opens your share sheet where you can pick Instagram."
            : "Generate an image first, then post to Instagram."}
        </Text>
        {imageSrc && <Image src={imageSrc} alt="Ready to post" display="block" mx="auto" mb={4} maxW="100%" />}
        <Text mb={2} fontWeight="bold" textAlign="left">
          Caption
        </Text>
        <Textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Write your caption..."
          rows={6}
          mb={4}
        />
        <HStack spacing={3} justifyContent="center" flexWrap="wrap">
          <Button
            onClick={postToInstagram}
            bgGradient="linear(to-r, #9945FF, #14F195)"
            isLoading={isPosting}
            loadingText="Opening..."
            isDisabled={!imageFile || isGenerating}
          >
            Share
          </Button>
          <Button onClick={copyCaption} isDisabled={!caption.trim()}>
            Copy Caption
          </Button>
          <Button onClick={downloadImage} isDisabled={!imageFile}>
            Download Image
          </Button>
        </HStack>
      </Box>
    </AccordionPanel>
  </AccordionItem>
  </Accordion>

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
