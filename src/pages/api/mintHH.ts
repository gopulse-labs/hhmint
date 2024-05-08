import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { TransactionBuilderItemsInput, Umi, createNoopSigner, generateSigner, 
  percentAmount, signerIdentity, sol, transactionBuilder, createSignerFromKeypair, keypairIdentity } from '@metaplex-foundation/umi';
import { createNft, fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';

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
  try {
    console.log("Start backend mint process...");

    const umi = createUmi("https://quiet-empty-theorem.solana-devnet.quiknode.pro/7d57464a8ad6a9c0f5395d099b88e1c820789582/")
      .use(mplTokenMetadata())
      .use(bundlrUploader());
  
    const collectionMint = generateSigner(umi);

    console.log("mint: " + collectionMint);

    const keypair = Keypair.fromSecretKey(
      bs58.decode(
        "33gqSGMNmo9QmzuFiGK4t8jZFmeKgWXiM4jFvQ9zSmJL6RuMupY2hFnsErAhwaQhxe9ZgzSqQBnNYzHq5yphYLrU"
      )
    );

    console.log(keypair);

    let newpair = fromWeb3JsKeypair(keypair);

    const signer = createSignerFromKeypair(umi, newpair);

    umi.use(keypairIdentity(signer))

    console.log(signer);


    const noop = createNoopSigner(newpair.publicKey);

    console.log("noop: " + noop);
  

    // let [imageUri] = await umi.uploader.upload([event.GenericFile])
    // console.log("image: " + imageUri);

    // let uri = await umi.uploader.uploadJson({
    //   name: news,
    //   description: '"' + news + '"' + " in the " + selectedStyle + " style.",
    //   image: imageUri,
    // });

    let ix = await createNft(umi, {
        mint: collectionMint,
        name: 'HeadlineHarmonies',
        uri: "uri",
        sellerFeeBasisPoints: percentAmount(5.5),
        payer: noop,
        authority: umi.identity,
      })
      .setFeePayer(noop)
      .buildWithLatestBlockhash(umi);

      let backTx = await umi.identity.signTransaction(ix);
      backTx = await collectionMint.signTransaction(backTx);  
      
      console.log(backTx.signatures);
      
      const serialized = await umi.transactions.serialize(backTx);

      console.log(serialized);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
        body: JSON.stringify({ serialized }),
      };
    } catch (error) {
      console.error('Error fetching news: ' + error);
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