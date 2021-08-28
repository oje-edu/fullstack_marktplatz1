import { ethers } from "ethers";
import { useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";
import Image from "next/image";
import Head from "next/head";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

import { nftaddress, nftmarketaddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const router = useRouter();

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (err) {
      console.log(err);
    }
  }

  async function createItem() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });

    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* After file upload to IPFS, pass the URL to save it on Polygon */
      createSale(url);
    } catch (err) {
      console.log("Error uploading file: ", err);
    }
  }

  async function createSale(url) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
    let transaction = await contract.createToken(url);
    let tx = await transaction.wait();

    let event = tx.events[0];
    let value = event.args[2];
    let tokenId = value.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, "ether");
    contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, {
      value: listingPrice,
    });
    await transaction.wait();
    router.push("/");
  }

  return (
    <div>
      <Head>
        <title>Digitales Gut verkaufen</title>
      </Head>
      <div className="flex justify-center">
        <div className="flex flex-col w-1/2 pb-12">
          <input
            placeholder="Name des Gutes"
            className="p-4 mt-8 border rounded"
            onChange={(e) =>
              updateFormInput({ ...formInput, name: e.target.value })
            }
          />
          <textarea
            placeholder="Beschreibung des Gutes"
            className="p-4 mt-2 border rounded"
            onChange={(e) =>
              updateFormInput({ ...formInput, description: e.target.value })
            }
          />
          <input
            placeholder="Preis des guten Stückes (in Cryptowährung: Matic)"
            className="p-4 mt-8 border rounded"
            onChange={(e) =>
              updateFormInput({ ...formInput, price: e.target.value })
            }
          />
          <input
            type="file"
            name="Asset"
            className="my-4"
            onChange={onChange}
          />
          {fileUrl && (
            <div className="relative h-80 w-80">
              <Image
                className="mt-4 rounded"
                src={fileUrl}
                layout="fill"
                objectFit="cover"
              />
            </div>
          )}
          <button
            onClick={createItem}
            className="p-4 mt-4 font-bold text-white bg-blue-500 rounded shadow-lg"
          >
            Erstelle das gute Stück
          </button>
        </div>
      </div>
    </div>
  );
}
