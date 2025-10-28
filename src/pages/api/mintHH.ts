/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { generateSigner, publicKey, createSignerFromKeypair, signerIdentity, createNoopSigner, percentAmount, sol, some } from '@metaplex-foundation/umi';
import { findMetadataPda, mplTokenMetadata, createNft } from '@metaplex-foundation/mpl-token-metadata';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { transferSol } from '@metaplex-foundation/mpl-toolbox'

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

function createGenericFile(bytes: Uint8Array, fileName: string, displayName: string,
  uniqueName: string, contentType: string | null, extension: string | null, tags: GenericFileTag[]): GenericFile {
  return {
    buffer: bytes,
    fileName,
    displayName,
    uniqueName,
    contentType,
    extension,
    tags,
  };
}

function generateHash(input: crypto.BinaryLike) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Normalize Arweave URIs to Irys devnet gateway for easier resolution on devnet
function normalizeToIrysGatewayDevnet(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.hostname.endsWith('arweave.net')) {
      url.hostname = 'gateway.irys.xyz';
      url.port = '';
      url.protocol = 'https:';
      return url.toString();
    }
  } catch (_) {
    // If URI isn't a valid URL, fall through
  }
  // Fallback simple replace
  return uri.replace('http://arweave.net/', 'https://gateway.irys.xyz/').replace('https://arweave.net/', 'https://gateway.irys.xyz/');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Start backend mint process...");

    const { selectedHeadline, selectedStyle, image, frontEndKey, attributes } = req.body;

    if (!selectedHeadline || !selectedStyle || !image || !frontEndKey || !attributes) {
      return res.status(400).send('Bad Request: Missing required fields.');
    }

    const shortHash = generateHash(selectedHeadline).substring(0, 8);
    console.log("hash: " + shortHash)
    const nftName = `HeadlineHarmonies #${shortHash}`;
    console.log("nftname: " + nftName)

    // Decode image base64; handle data URL prefix if present
    const base64 = typeof image === 'string' && image.includes('base64,')
      ? image.split('base64,')[1]
      : image;
    const imageBuffer = Buffer.from(base64, 'base64');
    // Use a view that respects byteOffset and byteLength
    const fileBytes = new Uint8Array(
      imageBuffer.buffer,
      imageBuffer.byteOffset,
      imageBuffer.byteLength
    );

    const genericFile = createGenericFile(
      fileBytes,
      'headline-harmonies.jpg',
      'Headline Harmonies',
      `hh-${shortHash}.jpg`,
      'image/jpeg',
      'jpg',
      []
    );

    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
    const SECRET_KEY = process.env.SECRET_KEY;

    if (!SOLANA_RPC_URL || !SECRET_KEY) {
      console.error('RPC URL or Secret Key environment variable is not defined.');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(500).json({ error: 'Server misconfigured: SOLANA_RPC_URL or SECRET_KEY missing' });
    }

    const umi = createUmi(SOLANA_RPC_URL)
      .use(mplTokenMetadata())
      .use(irysUploader({
        address: "https://devnet.irys.xyz/",
      }));

    // Detect devnet to route URIs through Irys gateway for better resolution
    const isDevnet = (process.env.SOLANA_RPC_URL || '').toLowerCase().includes('devnet');

    let keypair: Keypair;
    try {
      keypair = Keypair.fromSecretKey(bs58.decode(SECRET_KEY));
    } catch (e) {
      console.error('SECRET_KEY is not valid base58-encoded Solana secret key');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(400).json({ error: 'Invalid SECRET_KEY format. Expecting base58-encoded Solana private key (64-byte secret key).' });
    }

    let newpair = fromWeb3JsKeypair(keypair);
    const collectionAuthority = createSignerFromKeypair(umi, newpair);
    umi.use(signerIdentity(collectionAuthority));
  const serverSignerPubkeyStr = collectionAuthority.publicKey.toString();
  console.log('Server signer pubkey:', serverSignerPubkeyStr);
  (global as any).collectionAuthorityPubkey = serverSignerPubkeyStr;

    // Attempt upload; if signer lacks devnet SOL, return actionable error
    let imageUri: string;
    try {
      const [uri0] = await umi.uploader.upload([genericFile]);
      imageUri = uri0;
    } catch (e: any) {
      const msg = (e && (e.message || e.toString())) || 'Upload failed';
      console.error('Irys upload failed:', msg);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(402).json({
        error: 'Server signer has insufficient funds on devnet to upload metadata/image.',
        details: msg,
        fundPublicKey: collectionAuthority.publicKey,
        hint: 'Airdrop some devnet SOL to the above public key and retry.'
      });
    }

    console.log("ImageUri: " + imageUri);

    // If on devnet, ensure the metadata JSON we upload references the Irys gateway for the image field.
    const imageUriForJson = isDevnet ? normalizeToIrysGatewayDevnet(imageUri) : imageUri;
    let uri: string;
    try {
      uri = await umi.uploader.uploadJson({
        name: nftName,
        description:  `An interpretation of '${selectedHeadline}' inspired by the ${selectedStyle} style.`,
        image: imageUriForJson,
        attributes: attributes,
        // Provide standard properties.files for broader wallet compatibility
        properties: {
          files: [
            { uri: imageUriForJson, type: 'image/jpeg' },
          ],
          category: 'image'
        }
      });
      if (!uri) throw new Error('uploadJson returned empty URI');
    } catch (e: any) {
      const msg = (e && (e.message || e.toString())) || 'uploadJson failed';
      console.error('Metadata upload failed:', msg);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(402).json({
        error: 'Server signer has insufficient funds on devnet to upload metadata JSON.',
        details: msg,
        fundPublicKey: collectionAuthority.publicKey,
        hint: 'Airdrop some devnet SOL to the above public key and retry.'
      });
    }

    console.log("Uri: " + uri);

    // On devnet, prefer Irys gateway for better wallet previews
    if (isDevnet) {
      const normalizedImage = normalizeToIrysGatewayDevnet(imageUri);
      const normalizedUri = normalizeToIrysGatewayDevnet(uri);
      if (normalizedImage !== imageUri) {
        console.log('Normalized imageUri to Irys devnet gateway:', normalizedImage);
        imageUri = normalizedImage;
      }
      if (normalizedUri !== uri) {
        console.log('Normalized metadata uri to Irys devnet gateway:', normalizedUri);
        uri = normalizedUri;
      }
    }

    const frontendPubkey = publicKey(frontEndKey);
    const frontEndSigner = createNoopSigner(frontEndKey);

    // Generate a new mint for Token Metadata (Non-Fungible)
    const mint = generateSigner(umi);
    const meta = findMetadataPda(umi, { mint: mint.publicKey });
    console.log("Metadata PDA: " + meta);

    // Define creators: server signer (verified) 20%, frontend wallet (unverified) 80%
    const creators = some([
      { address: collectionAuthority.publicKey, share: 20, verified: true },
      { address: frontendPubkey, share: 80, verified: false },
    ]);

    // Build createV1 + mintV1 (aka createNft) with client as payer and owner
    const ix = await createNft(umi, {
      mint,
      name: nftName,
      uri,
      sellerFeeBasisPoints: percentAmount(5), // 5%
      creators,
      payer: frontEndSigner,
      tokenOwner: frontendPubkey,
      // updateAuthority and authority default to server identity (collectionAuthority)
    })
      .add(
        transferSol(umi, {
          source: frontEndSigner,
          destination: publicKey("bTScLTgqYYXVhYUxBxLg9iKhFGgmBoNF8YywAXjH3uW"),
          amount: sol(0.1),
        })
      )
      .useV0()
      .setBlockhash(await umi.rpc.getLatestBlockhash())
      .buildAndSign(umi);

    let backTx = await umi.identity.signTransaction(ix);
    backTx = await mint.signTransaction(backTx);

    console.log(backTx.signatures);

    const serialized = await umi.transactions.serialize(backTx);

    res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
  res.status(200).json({ serialized, imageUri, uri });
  } catch (error) {
    console.error('Error minting: ' + error);
    // Provide more actionable error to client in common insufficient-funds case
    const errMsg = (error as any)?.message || String(error);
    const insufficient = errMsg.includes('Attempt to debit an account');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (insufficient) {
      return res.status(402).json({
        error: 'Insufficient funds on one or more signers for transaction simulation',
        details: errMsg,
        hint: 'Fund the server signer (SECRET_KEY public key) and the client wallet (payer/frontEndKey) with devnet SOL, then retry.',
        serverSignerPublicKey: (typeof (global as any).collectionAuthorityPubkey === 'string') ? (global as any).collectionAuthorityPubkey : undefined,
        payerPublicKey: typeof (req as any)?.body?.frontEndKey === 'string' ? (req as any).body.frontEndKey : undefined,
      });
    }
    res.status(500).json({ error: 'Internal Server Error', details: errMsg });
  }
}