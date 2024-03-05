export async function handler(event: { queryStringParameters: { selectedStyle: any; news: any; }; }, context: any) {
  try {
    const { selectedStyle, news } = event.queryStringParameters;

    let currentPromptIndex = 0;

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

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    currentPromptIndex++;
    console.log(currentPromptIndex);
    
    if (currentPromptIndex === prompts.length) {
    currentPromptIndex = 0;
    }

    const blob = await response.blob();
    const realData = await blob.arrayBuffer();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      body: JSON.stringify({ realData }),
    };
  } catch (error) {
    console.error("Error generating image:", error);

    return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
        body: 'Internal Server Error',
      };
  }
}