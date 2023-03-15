import LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import siwe from "siwe";
import fs from 'fs';
import { encryptAndUploadMetadataToIpfs, decryptStringWithIpfs } from "@lit-protocol/encryption";

const privKey = "<YOUR-PRIVATE-KEY>";
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

console.log("1-");

const data = fs.readFileSync("./package.json");
console.log(data);
try {
	console.log("Simplified Encryption/Decryption");
	const ipfsCid = await encryptAndUploadMetadataToIpfs({
		authSig: await getSiweAuthsig(),
		accessControlConditions,
		chain,
		string: "Heyyyyyyy Lit",
		// file: new Blob([data]),
		litNodeClient: client,
		infuraId: 'INFURA-PROJECT-ID',
		infuraSecretKey: 'INFURA-SECRET-KEY'
	});
	// const ipfsCid = 'QmSDfCcsT1QdGPgwJCh4QrLARiCLcx5Fm3bTzp3fmsDVWE';
	console.log("ipfsCid");
	console.log(ipfsCid);

    // Decrypt
	const res = await decryptStringWithIpfs({ authSig: await getSiweAuthsig(), ipfsCid, litNodeClient: client });
	console.log(res);
} catch(e) {
	console.log(e);
}