import pinataSDK from '@pinata/sdk';
import LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import siwe from "siwe";
import { readFile } from "fs";

const pinata = new pinataSDK('d74988b6b586aafca17b', 'ca736a005f5cf0cbdfc02e99c56906799bdebdd512a2e0931d46a7c9fa837b17');
const privKey = "1abd8d123a31e65a34e9567cc941db8de97e0f9385c50c0191695258f6651a1a";
const wallet = new ethers.Wallet(privKey);

const client = new LitJsSdk.LitNodeClient();
await client.connect();

const chain = "ethereum";
const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">=",
      value: "0",
    },
  },
];

const getSiweAuthsig = async () => {
    const domain = "localhost";
    const origin = "https://localhost/login";
    const statement =
    "DAshy- This is a test statement.  You can put anything you want here.";

    const siweMessage = new siwe.SiweMessage({
        domain,
        address: wallet.address,
        statement,
        uri: origin,
        version: "1",
        chainId: "1",
    });
    const messageToSign = siweMessage.prepareMessage();
    const signature = await wallet.signMessage(messageToSign);
    const recoveredAddress = ethers.verifyMessage(messageToSign, signature);
    const authSig = {
        sig: signature,
        derivedVia: "web3.eth.personal.sign",
        signedMessage: messageToSign,
        address: recoveredAddress,
    };
    return authSig;
}

const litEncryptString = async () => {
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString("BAshy");
    const encryptedSymmetricKey = await client.saveEncryptionKey({
        accessControlConditions,
        symmetricKey,
        authSig: await getSiweAuthsig(),
        chain,
    });

    return {
        encryptedString,
        encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    };
}

const litDecryptString = async (encryptedString, encryptedSymmetricKey) => {
    const symmetricKey = await client.getEncryptionKey({
        accessControlConditions,
        toDecrypt: encryptedSymmetricKey,
        chain,
        authSig: await getSiweAuthsig()
    });
    const decryptedString = await LitJsSdk.decryptString(
        encryptedString,
        symmetricKey
    );
    console.log(decryptedString);
}

const uploadToIpfs = async (body) => {
	const temp = await body.encryptedString.arrayBuffer();
	const encryptedString = Buffer.from(temp).toJSON();
	// const encryptedString = Buffer.from(await body.encryptedString.text(), 'binary').toString('base64');
    const res = await pinata.pinJSONToIPFS({...body, encryptedString});
    // const res = await pinata.pinJSONToIPFS({...body, encryptedString: await body.encryptedString.text() });
    // const res = await pinata.pinFileToIPFS(body.encryptedString, { pinataMetadata: { name: 'encryptedString' } });
    return res;
}

const fetchFromIpfs = async (cid) => {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const val = await res.json();
    console.log("val");
    console.log(val);
    const encryptedString = val.encryptedString;
    // const encryptedSymmetricKey = val.encryptedSymmetricKey;
    console.log(encryptedString);
    // console.log(encryptedSymmetricKey);

    // const encryptedStringBlob = new Blob([encryptedString], { type: 'application/octet-stream' });
    // console.log("encryptedStringBlob");
    // console.log(encryptedStringBlob);
    // console.log(await encryptedStringBlob.text() === encryptedString);
    
    return {
        encryptedString,
        // encryptedStringBlob,
        // encryptedSymmetricKey,
    };
}

// const body = await litEncryptString();
// console.log(body.encryptedString);
// console.log(await body.encryptedString.text());
// const res = await uploadToIpfs(body);
// console.log(res);

const res = await fetch(`https://gateway.pinata.cloud/ipfs/QmZW73X2pWbx3oA3a5imk3iyiwhu2xcKjyas7hvnS6Qrrm`);
console.log("res");
console.log(res);
const val = await res.json();
console.log("val");
console.log(val);
const encryptedString = val.encryptedString;
console.log(encryptedString);
console.log(typeof(encryptedString));
const blob = new Blob([Buffer.from(encryptedString)], { type: 'application/octet-stream' });
console.log(blob);
await litDecryptString(blob, val.encryptedSymmetricKey);
// console.log(JSON.parse(encryptedString));

// const res = readFile(body.encryptedString);
// const buffer = Buffer.from(await body.encryptedString.text(), 'binary');
// const buffer = Buffer.from(await body.encryptedString.text());
// console.log(buffer);
// const res = buffer.toString('base64');

// const res = await body.encryptedString.arrayBuffer();
// console.log(res);
// const base64 = Buffer.from(res).toJSON();
// console.log(base64)
// // const blob = new Blob([Buffer.from(res, 'base64')],  { type: 'application/octet-stream' });
// const blob = new Blob([res], { type: 'application/octet-stream' });
// console.log(blob);
// console.log(await blob.text());
// // await litDecryptString(body.encryptedString, body.encryptedSymmetricKey);
// await litDecryptString(blob, body.encryptedSymmetricKey);

// // const file = new File([body.encryptedString], "encryptedString");
// // console.log(file);
// const res = await uploadToIpfs(body);
// console.log(res);
// // const { encryptedStringBlob, encryptedSymmetricKey } = await fetchFromIpfs(res.IpfsHash);
// const { encryptedString } = await fetchFromIpfs(res.IpfsHash);
// // console.log(await body.encryptedString.text() === await encryptedStringBlob.text());
// console.log(await body.encryptedString.text() === await encryptedString.text());
// // console.log(typeof(encryptedStringBlob));
// console.log(typeof(encryptedString));
// // await litDecryptString(encryptedStringBlob, body.encryptedSymmetricKey);
// await litDecryptString(encryptedString, body.encryptedSymmetricKey);