import pinataSDK from '@pinata/sdk';
import LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import siwe from "siwe";

const pinata = new pinataSDK('..', '..');
const privKey = "PRIVATE-KEY";
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
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString("DAshy");
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
    const res = await pinata.pinJSONToIPFS({...body, encryptedString: await body.encryptedString.text() });
    return res;
}

const fetchFromIpfs = async (cid) => {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const val = await res.json();
    console.log(val);
    const encryptedString = val.encryptedString;
    const encryptedSymmetricKey = val.encryptedSymmetricKey;
    console.log(encryptedString);
    console.log(encryptedSymmetricKey);

    // const encryptedStringBlob = new Blob([encryptedString], { type: 'application/octet-stream' });
    const encryptedStringBlob = new Blob([encryptedString]);
    console.log(encryptedStringBlob);
    console.log(await encryptedStringBlob.text() === encryptedString);
    
    return {
        encryptedStringBlob,
        encryptedSymmetricKey,
    };
}

const body = await litEncryptString();
console.log(body.encryptedString);
const res = await uploadToIpfs(body);
console.log(res);
const { encryptedStringBlob, encryptedSymmetricKey } = await fetchFromIpfs(res.IpfsHash);
console.log(await body.encryptedString.text() === await encryptedStringBlob.text());
console.log(typeof(encryptedStringBlob));
await litDecryptString(encryptedStringBlob, encryptedSymmetricKey);
// await litDecryptString(body.encryptedString, body.encryptedSymmetricKey);