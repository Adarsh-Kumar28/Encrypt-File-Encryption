import { ethers } from "ethers";
import siwe from "siwe";
import fs from "fs";
import LitJsSdk from "@lit-protocol/encryption";
import { uint8arrayToString } from "@lit-protocol/uint8arrays";
// import LitJsSdk from "@lit-protocol/lit-node-client";

const privKey = "1abd8d123a31e65a34e9567cc941db8de97e0f9385c50c0191695258f6651a1a";
const wallet = new ethers.Wallet(privKey);

const domain = "localhost";
const origin = "https://localhost/login";
const statement =
  "This is a test statement.  You can put anything you want here.";

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

console.log("signature- ", signature);

const recoveredAddress = ethers.verifyMessage(messageToSign, signature);
console.log("recoveredAddress- ", recoveredAddress)
console.log("address- ", wallet.address);

const authSig = {
  sig: signature,
  derivedVia: "web3.eth.personal.sign",
  signedMessage: messageToSign,
  address: recoveredAddress,
};

console.log("authSig", authSig);

let file = fs.readFileSync("./package.json");
// const fileString = LitJsSdk.uint8arrayToString(file, "base16");
const fileString = uint8arrayToString(file, "base16");
console.log(typeof(fileString));
console.log(fileString);
console.log(file);
const fileBlob = new Blob(file);
console.log("here-");

const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({file:fileBlob});
console.log("encryptedFile- ", await encryptedFile.text());
console.log("symmetricKey- ", symmetricKey);

const client = new LitJsSdk.LitNodeClient();
const chain = "ethereum";
await client.connect();

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

const encryptedSymmetricKey = await client.saveEncryptionKey({
  accessControlConditions,
  symmetricKey,
  authSig,
  chain,
});

// const encryptedSymmetricKeyString = LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16");
const encryptedSymmetricKeyString = uint8arrayToString(encryptedSymmetricKey, "base16");
console.log(encryptedSymmetricKeyString);

const newSymmetricKey = await client.getEncryptionKey({
  accessControlConditions,
  toDecrypt: encryptedSymmetricKeyString,
  chain,
  authSig,
});

console.log("newSymmetricKey- ", newSymmetricKey);

const decryptedFile = await LitJsSdk.decryptFile({
  file: encryptedFile,
  symmetricKey: newSymmetricKey
});

console.log("decryptedFile");
console.log(decryptedFile);
const enc = new TextDecoder("utf-8");
console.log(enc.decode(decryptedFile));