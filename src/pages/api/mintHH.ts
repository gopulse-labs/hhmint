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

    const { selectedHeadline, selectedStyle, image, publicKey, attributes } = req.body;

    if (!selectedHeadline || !selectedStyle || !image || !publicKey || !attributes) {
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
      .use(mplTokenMetadata())
      .use(bundlrUploader());

    const keypair = Keypair.fromSecretKey(
      bs58.decode(SECRET_KEY)
    );

    const mint = generateSigner(umi);

    let newpair = fromWeb3JsKeypair(keypair);
    const signer = createSignerFromKeypair(umi, newpair);
    umi.use(keypairIdentity(signer));

    const [imageUri] = await umi.uploader.upload([genericFile]);

    console.log("ImageUri: " + imageUri);

    const uri = await umi.uploader.uploadJson({
      name: truncatedHeadline,
      description: "'" + selectedHeadline + "'" + " in the " + selectedStyle + " style.",
      image: imageUri,
      attributes: attributes,
    });

    console.log("Uri: " + uri);

    const meta = findMetadataPda(umi, { mint: mint.publicKey });

    console.log("Meta: " + meta);

    const ix = await createNft(umi, {
      mint: mint,
      name: truncatedHeadline,
      uri: uri,
      sellerFeeBasisPoints: percentAmount(5),
      //payer: signer,
      collection: {
        key: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
        verified: false,
      },
      creators: [
        {
          address: publicKey(publicKey),
          share: 80,
          verified: true,
        },
        {
          address: publicKey("DMteCYezdd8Pzhk7LpMF9fGcKBfiqA5kzmPguiZhENDe"),
          share: 20,
          verified: true,
        }
      ],
    })
      .add(verifyCollectionV1(umi, {
        metadata: meta,
        collectionMint: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
        authority: umi.identity,
      }))
      // .add(transferSol(umi, {
      //     destination: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
      //     amount: sol(0.01)
      // }))
      //.setFeePayer(signer)
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