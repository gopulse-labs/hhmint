import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { TransactionBuilderItemsInput, Umi, generateSigner, 
  percentAmount, signerIdentity, sol, transactionBuilder } from '@metaplex-foundation/umi';
import { createNft, fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";

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

export async function handler(event: any, context: any) {
    console.log("Start mint process...");
    //setIsOwner(true);

    const umi = createUmi("https://quiet-empty-theorem.solana-devnet.quiknode.pro/7d57464a8ad6a9c0f5395d099b88e1c820789582/")
    .use(mplTokenMetadata())
    .use(bundlrUploader());
  
    if (event.realData1 !== null) {
      const genericFile = createGenericFile(
        event.realData1,
        'example.jpg', // Replace with your actual file name
        'Example File', // Replace with your actual display name
        'unique-identifier', // Replace with your actual unique name
        'image/jpeg', // Replace with your actual content type
        'jpg', // Replace with your actual extension
        [] // Replace with your actual tags
      );
  
      console.log(genericFile);
  
      // const uploadSigner = generateSigner(umi);
      // umi.use(signerIdentity(uploadSigner));
  
      let [imageUri] = await umi.uploader.upload([genericFile]);
      console.log("image: " + imageUri);
  
      let uri = await umi.uploader.uploadJson({
        name: event.selectedStyle + " - " + event.news,
        description: '"' + event.news + '"' + " in the " + event.selectedStyle + " style.",
        image: imageUri,
      });
  
      console.log("uri: " + uri);
  
      const collectionMint = generateSigner(umi);
      //const collectionUpdateAuthority = generateSigner(umi);
      
      transactionBuilder()
        .add(createNft(umi, {
          mint: collectionMint,
          isCollection: true,
          //authority: collectionUpdateAuthority,
          name: 'HeadlineHarmonies',
          uri: uri,
          sellerFeeBasisPoints: percentAmount(5.5),
        }))
        .add(transferSol(umi, { 
          source: umi.identity, 
          destination: umi.eddsa.generateKeypair().publicKey, 
          amount: sol(0.1)}))
        .add(transferSol(umi, { 
          source: umi.identity, 
          destination: umi.eddsa.generateKeypair().publicKey, 
          amount: sol(0.1)}))
        .sendAndConfirm(umi);
      const asset = await fetchDigitalAsset(umi, collectionMint.publicKey)
      console.log("New NFT data: " + asset)
    }
  }