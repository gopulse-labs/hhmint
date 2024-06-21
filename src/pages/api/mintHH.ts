import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { generateSigner, publicKey, createSignerFromKeypair, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
import { createNft, findMetadataPda, mplTokenMetadata, verifyCollectionV1 } from '@metaplex-foundation/mpl-token-metadata';
import { bundlrUploader } from '@metaplex-foundation/umi-uploader-bundlr';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { VercelRequest, VercelResponse } from '@vercel/node';

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

    const { selectedHeadline, selectedStyle, image } = req.body;

    const maxLength = 32;
    const truncatedHeadline = selectedHeadline.length > maxLength ? selectedHeadline.substring(0, maxLength) : selectedHeadline;

    const imageBuffer = Buffer.from(image, 'base64');

    const genericFile = createGenericFile(
      imageBuffer.buffer,
      'example.jpg', // Replace with your actual file name
      'Example File', // Replace with your actual display name
      'unique-identifier', // Replace with your actual unique name
      'image/jpeg', // Replace with your actual content type
      'jpg', // Replace with your actual extension
      [] // Replace with your actual tags
    );

    const umi = createUmi("https://quiet-empty-theorem.solana-devnet.quiknode.pro/7d57464a8ad6a9c0f5395d099b88e1c820789582/")
      .use(mplTokenMetadata())
      .use(bundlrUploader());

    const mint = generateSigner(umi);

    const keypair = Keypair.fromSecretKey(
      bs58.decode(
        "33gqSGMNmo9QmzuFiGK4t8jZFmeKgWXiM4jFvQ9zSmJL6RuMupY2hFnsErAhwaQhxe9ZgzSqQBnNYzHq5yphYLrU"
      )
    );

    let newpair = fromWeb3JsKeypair(keypair);
    const signer = createSignerFromKeypair(umi, newpair);
    umi.use(keypairIdentity(signer));

    const [imageUri] = await umi.uploader.upload([genericFile]);

    console.log("ImageUri: " + imageUri);

    const uri = await umi.uploader.uploadJson({
      name: truncatedHeadline,
      description: '"' + selectedHeadline + '"' + " in the " + selectedStyle + " style.",
      image: imageUri,
      attributes: [
        { trait_type: "Global Impact", value: 0.5 },
        { trait_type: "Longevity", value: 0.5 },
        { trait_type: "Cultural Significance", value: 0.5 },
        { trait_type: "Media Coverage", value: 0.5 }
      ]
    });

    console.log("Uri: " + uri);

    const meta = findMetadataPda(umi, { mint: mint.publicKey });

    console.log("Meta: " + meta);

    const ix = await createNft(umi, {
      mint: mint,
      name: truncatedHeadline,
      uri: uri,
      sellerFeeBasisPoints: percentAmount(5),
      payer: signer,
      collection: {
        key: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
        verified: false,
      },
    //   creators: [
    //     {
    //       address: publicKey("CreatorPublicKey1"), // Replace with actual creator public key
    //       share: 20, // Share percentage (0-100)
    //       verified: true, // Set to true if verified
    //     },
    //     {
    //       address: publicKey("CreatorPublicKey2"), // Replace with actual creator public key
    //       share: 80, // Share percentage (0-100)
    //       verified: true, // Set to true if verified
    //     },
    //     // Add more creators as needed
    //   ],
    })
      .add(verifyCollectionV1(umi, {
        metadata: meta,
        collectionMint: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
        authority: umi.identity,
      }))
      // .add(transferSol(umi, {
      //     destination: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
      //     amount: sol(1)
      // }))
      .setFeePayer(signer)
      .buildWithLatestBlockhash(umi);

    let backTx = await umi.identity.signTransaction(ix);
    backTx = await mint.signTransaction(backTx);

    console.log(backTx.signatures);

    const serialized = await umi.transactions.serialize(backTx);

    console.log(serialized);

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
