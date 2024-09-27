/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { generateSigner, publicKey, createSignerFromKeypair, signerIdentity, createNoopSigner, keypairIdentity, percentAmount, sol, Transaction } from '@metaplex-foundation/umi';
import { createNft, findMetadataPda, mplTokenMetadata, verifyCollectionV1 } from '@metaplex-foundation/mpl-token-metadata';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { create, fetchCollection, ruleSet } from '@metaplex-foundation/mpl-core';
import { PublicKey } from '@solana/web3.js';
import { mplCore } from '@metaplex-foundation/mpl-core'
import { base64 } from '@metaplex-foundation/umi/serializers';

interface GenericFileTag {
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

function createGenericFile(arrayBuffer: ArrayBuffer, fileName: string, displayName: string, 
  uniqueName: string, contentType: string | null, extension: string | null, tags: GenericFileTag[]): GenericFile {
  return {
    buffer: new Uint8Array(arrayBuffer),
    fileName,
    displayName,
    uniqueName,
    contentType,
    extension,
    tags,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Start backend mint process...");

    //change publicKey argument name

    const { selectedHeadline, selectedStyle, image, frontEndKey, attributes } = req.body;

    if (!selectedHeadline || !selectedStyle || !image || !frontEndKey || !attributes) {
      return res.status(400).send('Bad Request: Missing required fields.');
    }

    const maxLength = 32;
    const truncatedHeadline = selectedHeadline.length > maxLength ? selectedHeadline.substring(0, maxLength) : selectedHeadline;

    const imageBuffer = Buffer.from(image, 'base64');

    const genericFile = createGenericFile(
      imageBuffer.buffer,
      'example.jpg',
      'Example File',
      'unique-identifier',
      'image/jpeg',
      'jpg',
      []
    );

    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
    const SECRET_KEY = process.env.SECRET_KEY;

    if (!SOLANA_RPC_URL || !SECRET_KEY) {
      console.error('RPC URL or Secret Key environment variable is not defined.');
      return res.status(500).send('Internal Server Error');
    }

    const umi = createUmi(SOLANA_RPC_URL)
    .use(mplCore())
      .use(mplTokenMetadata())
      .use(irysUploader({
        address: "https://devnet.irys.xyz/",
      }));

    const keypair = Keypair.fromSecretKey(
      bs58.decode(SECRET_KEY)
    );

    let newpair = fromWeb3JsKeypair(keypair);
    const collectionAuthority = createSignerFromKeypair(umi, newpair);
    umi.use(signerIdentity(collectionAuthority));

    const [imageUri] = await umi.uploader.upload([genericFile]);

    console.log("ImageUri: " + imageUri);

    const uri = await umi.uploader.uploadJson({
      name: truncatedHeadline,
      description: "'" + selectedHeadline + "'" + " in the " + selectedStyle + " style.",
      image: imageUri,
      attributes: attributes,
    });

    console.log("Uri: " + uri);

    const frontendPubkey = publicKey(frontEndKey)
    const frontEndSigner = createNoopSigner(frontEndKey)

    const assetKeypair = generateSigner(umi);
    const meta = findMetadataPda(umi, { mint: assetKeypair.publicKey });

    console.log("Meta: " + meta);

    const collection = await fetchCollection(umi, "EGe47cdy7jYt7fuMkHanXwZ3BWM1tzGbz8rekHhNbsez");

    console.log("Collection: " + collection);

    const creator1 = publicKey(frontEndKey);
    const creator2 = publicKey("DMteCYezdd8Pzhk7LpMF9fGcKBfiqA5kzmPguiZhENDe");
    
    const ix = await create(umi, {
      asset: assetKeypair,
      collection: collection,
      name: truncatedHeadline,
      authority: collectionAuthority,
      payer: frontEndSigner,
      owner: frontendPubkey,
      uri: uri,
      plugins: [
        {
          type: 'Royalties',
          basisPoints: 500,
          creators: [
            {
              address: creator1,
              percentage: 80,
            },
            {
              address: creator2,
              percentage: 20,
            },
          ],
          ruleSet: ruleSet('None'),
        },
      ],
    })
    // .add(verifyCollectionV1(umi, {
    //   metadata: meta,
    //   collectionMint: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
    //   authority: umi.identity,
    // }))
    // .add(transferSol(umi, {
      //     destination: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
      //     amount: sol(0.01)
      // }))
      //.setFeePayer(signer)
      .useV0()
  .setBlockhash(await umi.rpc.getLatestBlockhash())
  .buildAndSign(umi);

    // const ix = await createNft(umi, {
    //   mint: mint,
    //   name: truncatedHeadline,
    //   uri: uri,
    //   sellerFeeBasisPoints: percentAmount(5),
    //   //payer: signer,
    //   collection: {
    //     key: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
    //     verified: false,
    //   },
    //   creators: [
    //     {
    //       address: publicKey(publicKey),
    //       share: 80,
    //       verified: true,
    //     },
    //     {
    //       address: publicKey("DMteCYezdd8Pzhk7LpMF9fGcKBfiqA5kzmPguiZhENDe"),
    //       share: 20,
    //       verified: true,
    //     }
    //   ],
    // })
    //   .add(verifyCollectionV1(umi, {
    //     metadata: meta,
    //     collectionMint: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
    //     authority: umi.identity,
    //   }))
    //   // .add(transferSol(umi, {
    //   //     destination: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
    //   //     amount: sol(0.01)
    //   // }))
    //   //.setFeePayer(signer)
    //   .buildWithLatestBlockhash(umi);

    let backTx = await umi.identity.signTransaction(ix);
    backTx = await assetKeypair.signTransaction(backTx);

    console.log(backTx.signatures);

    const serialized = await umi.transactions.serialize(backTx);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    res.status(200).json({ serialized });
  } catch (error) {
    console.error('Error minting: ' + error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    res.status(500).send('Internal Server Error');
  }
}