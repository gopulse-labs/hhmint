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
import {
  buildCaptionPackage,
  formatCaptionPackageForShare,
  type CaptionPackage,
} from '../lib/captionPackage';
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

const generationStatusCopy = [
  { startsAtSeconds: 0, message: "Reading the headline and shaping the image prompt..." },
  { startsAtSeconds: 8, message: "Choosing the visual direction..." },
  { startsAtSeconds: 18, message: "Composing the first image pass..." },
  { startsAtSeconds: 32, message: "Adding detail, color, and atmosphere..." },
  { startsAtSeconds: 48, message: "Finalizing the render..." },
  { startsAtSeconds: 60, message: "Still working. Larger generations can take a little longer." },
];

function getGenerationStatusMessage(elapsedSeconds: number) {
  return generationStatusCopy.reduce((currentMessage, status) => {
    return elapsedSeconds >= status.startsAtSeconds ? status.message : currentMessage;
  }, generationStatusCopy[0].message);
}

const guidedSteps = [
  "Headline",
  "Style",
  "Generate",
  "Post",
];

function WebsiteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ margin: '0 10px', width: '24px', height: '24px', color: 'white' }}
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.75 9h16.5M3.75 15h16.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 3c2.25 2.35 3.4 5.35 3.4 9S14.25 18.65 12 21c-2.25-2.35-3.4-5.35-3.4-9S9.75 5.35 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="5.5" cy="12" r="1.15" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.15" fill="currentColor" />
    </svg>
  );
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
  const [captionPackage, setCaptionPackage] = useState<CaptionPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

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
    setImageSrc(null);
    setImageFile(null);
    setScores(null);
    setCaption("");
    setCaptionPackage(null);
    setError(null);
    setActiveStep(2);
    gridButtonsData.forEach(button => {
      if (button.id !== id) {
        document.getElementById(button.id)?.classList.remove('selected');
      }
    });
    document.getElementById(id)?.classList.add('selected');
  }

  async function handleHeadlineClick(headline: string, index: number) {
    setSelectedHeadline(headline);
    setImageSrc(null);
    setImageFile(null);
    setScores(null);
    setCaption("");
    setCaptionPackage(null);
    setError(null);
    setActiveStep(1);
    document.querySelectorAll('.headline-button').forEach((button) => {
        button.classList.remove('selected');
    });
    document.getElementById(`headline-button-${index}`)?.classList.add('selected');
  }

  useEffect(() => {
    console.log(selectedStyle);
  }, [selectedStyle]);

  useEffect(() => {
    if (!isGenerating) {
      setGenerationElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setGenerationElapsedSeconds(0);

    const intervalId = window.setInterval(() => {
      setGenerationElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isGenerating]);

async function generateImage() {
  if (!selectedHeadline || !selectedStyle) {
    setError("Choose a headline and style first.");
    setActiveStep(selectedHeadline ? 1 : 0);
    return;
  }

  try {
  setIsGenerating(true);
  setImageSrc(null);
  setScores(null);
  setCaptionPackage(null);
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
      const errorPayload = await response.json().catch(() => null);
      const errorMessage =
        errorPayload?.details
          ? `${errorPayload.error}: ${errorPayload.details}`
          : errorPayload?.error || `Image generation failed. Status: ${response.status}`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const imageMimeType = data.imageMimeType || 'image/png';
    const imageExtension = imageMimeType === 'image/jpeg' ? 'jpg' : imageMimeType.split('/')[1] || 'png';

    console.log("scores and price: " + data.scores, data.price)
    setImageSrc(`data:${imageMimeType};base64,${data.image}`);

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

       const blob = new Blob(byteArrays, {type: imageMimeType});
       const file = new File([blob], `generated_image.${imageExtension}`, { type: imageMimeType });

       setImageFile(file);
       if (selectedHeadline && selectedStyle) {
         const nextCaptionPackage = buildCaptionPackage({
           headline: selectedHeadline,
           style: selectedStyle,
         });
         setCaptionPackage(nextCaptionPackage);
         setCaption(formatCaptionPackageForShare(nextCaptionPackage));
       }

    setActiveStep(3);
    setIsGenerating(false);
  } catch (error) {
    console.error('Error fetching data:', error);
    setIsGenerating(false);
  }
}

  const maxUnlockedStep = imageFile
    ? 3
    : selectedHeadline && selectedStyle
      ? 2
      : selectedHeadline
        ? 1
        : 0;

  function handleAccordionChange(nextIndex: number | number[]) {
    const nextStep = Array.isArray(nextIndex) ? nextIndex[0] : nextIndex;

    if (typeof nextStep === "number" && nextStep >= 0 && nextStep <= maxUnlockedStep) {
      setActiveStep(nextStep);
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
	      className="hh-gradient-button"
	      bgGradient="linear(to-r, #9945FF, #14F195)"
	      w="64"
	      size="lg"
      fontSize="md"
 
      onClick={getStarted}
    >
      Start Generating
    </Button>
      
	      <footer style={{ textAlign: 'center', paddingTop: '20px' }}>
	  <p style={{ marginTop: '0', fontWeight: 'bold', fontSize: '1rem', background: 'linear-gradient(to right, #9945FF, #14F195)', WebkitBackgroundClip: 'text',
	    WebkitTextFillColor: 'transparent' }}>Presented by Thomas DeVito</p>
		  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
	    <a href="https://thomasdevito.me/" target="_blank" rel="noopener noreferrer">
	      <WebsiteIcon />
	    </a>
	    <a href="https://x.com/thomasfdevito" target="_blank" rel="noopener noreferrer">
	      <FontAwesomeIcon icon={faTwitter} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
	    </a>
	    <a href="https://t.me/doubting_tom" target="_blank" rel="noopener noreferrer">
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
  color: 'white'
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

      <HStack
        width="80%"
        spacing={3}
        justifyContent="center"
        flexWrap="wrap"
      >
        {guidedSteps.map((step, index) => {
          const isActive = activeStep === index;
          const isComplete = index < maxUnlockedStep;
          const isLocked = index > maxUnlockedStep;

          return (
            <Box
              key={step}
              minW={{ base: "120px", md: "145px" }}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              borderColor={isActive ? "#14F195" : "whiteAlpha.300"}
              bg={isActive ? "whiteAlpha.200" : "whiteAlpha.100"}
              opacity={isLocked ? 0.45 : 1}
              textAlign="center"
            >
              <Text fontSize="xs" color="whiteAlpha.700">
                Step {index + 1}
              </Text>
              <Text fontWeight="bold">{step}</Text>
              <Text fontSize="xs" color="whiteAlpha.700">
                {isActive ? "Current" : isComplete ? "Done" : isLocked ? "Locked" : "Next"}
              </Text>
            </Box>
          );
        })}
      </HStack>

      <Accordion
       index={activeStep}
       onChange={handleAccordionChange}
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
          <Text mb={4} color="whiteAlpha.800">
            Step 1 of 4: choose the headline you want to turn into artwork.
          </Text>
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

        <AccordionItem isDisabled={!selectedHeadline}>
          <h2>
            <AccordionButton _expanded={{ bgGradient: "linear(to-r, #9945FF, #14F195)", color: 'white' }}>
              <Box>
                Style
              </Box>
  
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
          <Text mb={4} color="whiteAlpha.800">
            Step 2 of 4: choose the visual style that should shape the final image.
          </Text>
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
      
    <AccordionItem isDisabled={!selectedHeadline || !selectedStyle}>
    <h2>
      <AccordionButton _expanded={{ bgGradient: "linear(to-r, #9945FF, #14F195)", color: 'white' }}>
        <Box>
          Generate
        </Box>

      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
    <Text mb={4} color="whiteAlpha.800">
      Step 3 of 4: review your choices, then generate your image.
    </Text>
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
	    className="hh-gradient-button"
	    onClick={generateImage}
	    isLoading={isGenerating}
	    loadingText="Generating Image"
    bgGradient="linear(to-r, #9945FF, #14F195)"
    isDisabled={!selectedHeadline || !selectedStyle || isPosting}
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
    <Box minH="24px" px={3} textAlign="center">
  {isGenerating && (
    <Text color="whiteAlpha.800" fontSize="sm">
      {getGenerationStatusMessage(generationElapsedSeconds)}
    </Text>
  )}
    </Box>
    <Box style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}>
    {imageSrc && <Image src={imageSrc} alt={captionPackage?.altText || "Generated Image"} />}
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

  <AccordionItem isDisabled={!imageFile}>
    <h2>
      <AccordionButton _expanded={{ bgGradient: "linear(to-r, #9945FF, #14F195)", color: 'white' }}>
        <Box>
          Post
        </Box>
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
      <Text mb={4} color="whiteAlpha.800">
        Step 4 of 4: review the image and caption, then share or download.
      </Text>
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
        {imageSrc && <Image src={imageSrc} alt={captionPackage?.altText || "Ready to post"} display="block" mx="auto" mb={4} maxW="100%" />}
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
	            className="hh-gradient-button"
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
	  <p style={{ marginTop: '0', fontWeight: 'bold', fontSize: '1rem', background: 'linear-gradient(to right, #9945FF, #14F195)', WebkitBackgroundClip: 'text',
	    WebkitTextFillColor: 'transparent' }}>Presented by Thomas DeVito</p>
		  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
	    <a href="https://thomasdevito.me/" target="_blank" rel="noopener noreferrer">
	      <WebsiteIcon />
	    </a>
	    <a href="https://x.com/thomasfdevito" target="_blank" rel="noopener noreferrer">
	      <FontAwesomeIcon icon={faTwitter} style={{ margin: '0 10px', fontSize: '24px', color: 'white' }} />
	    </a>
	    <a href="https://t.me/doubting_tom" target="_blank" rel="noopener noreferrer">
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
  color: 'white'
}}>
  Made with <span style={{ color: '#e25555', fontSize: '24px' }}>&hearts;</span> in NYC
</div>
</footer>
<br />
    </Stack>
  );
};

export default HHMint;
