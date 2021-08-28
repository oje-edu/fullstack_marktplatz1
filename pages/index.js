import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import Image from "next/image";
import Head from "next/head";

import { nftaddress, nftmarketaddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => {
    loadNFTs();
  }, []);

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    );
    const data = await marketContract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );
    setNfts(items);
    setLoadingState("loaded");
  }

  async function buyNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );

    const price = ethers.utils.parseunits(nft.price.toString(), "ether");

    const transaction = await contract.createMarketSale(
      nftaddress,
      nft.tokenId,
      { value: price }
    );
    await transaction.wait();
    loadNFTs();
  }

  if (loadingState === "loaded" && !nfts.length)
    return (
      <h1 className="px-20 py-10 txt-3xl">
        Momentan sind keine Waren auf dem Marktplatz vorhanden.
      </h1>
    );

  return (
    <div>
      <Head>
        <title>Am Marktplatz 1</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex justify-center">
        <main className="px-4" style={{ maxWidth: "1600px" }}>
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {nfts.map((nft, i) => (
              <div key={i} className="overflow-hidden border shadow rounded-xl">
                <div className="relative h-80 w-80">
                  <Image
                    src={nft.image}
                    alt={nft.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-2xl font-semibold"
                  >
                    {nft.name}
                  </p>
                  <div style={{ height: "70px", overflow: "hidden" }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="mb-4 text-2xl font-bold text-white">
                    {nft.price} Matic
                  </p>
                  <button
                    className="w-full px-12 py-2 font-bold text-white bg-blue-500 rounded"
                    onClick={() => buyNFT(nft)}
                  >
                    Kaufen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
